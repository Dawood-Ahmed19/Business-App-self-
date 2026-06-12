import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// --- Types ---
interface Payment {
  amount: number;
  date: string;
  note?: string;
}

interface Batch {
  date: string;
  quantity?: number;
  weight?: number;
  lengthFt?: number;
  pricePerUnit?: number;
  pricePerKg?: number;
  pricePerFt?: number;
  color?: string;
  guage?: string | number;
  gote?: string | number;
  size?: string | number;
  pipeType?: string;
}

interface Quotation {
  _id: string;
  quotationId: string;
  date: string;
  discount: number;
  amount: number;
  total: number;
  grandTotal: number;
  payments?: Payment[];
  status: string;
  quotationTotalProfit?: number;
  items: any[];
}

interface InventoryItem {
  name: string;
  type: string;
  pipeType?: string;
  guage?: string | number;
  gote?: string | number;
  size: string;
  weight: number;
  quantity: number;
  lengthFt?: number;
  pricePerKg?: number | null;
  pricePerUnit?: number | null;
  date: string;
  index?: number;
  height?: string | null;
  color?: string;
  batches: Batch[];
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const returnsCollection = db.collection("returns");

    const allReturns = await returnsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, returns: allReturns });
  } catch (err) {
    console.error("❌ Error fetching returns:", err);
    return NextResponse.json(
      { success: false, message: "Error fetching returns" },
      { status: 500 }
    );
  }
}





// POST




export async function POST(req: Request) {
  try {
    const { invoiceId, items } = await req.json();

    if (!invoiceId || !items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice ID and at least one item are required.",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("MakkaMetals");

    const quotationsCollection = db.collection<Quotation>("quotations");
    const inventoryCollection = db.collection<InventoryItem>("inventory");
    const reportsCollection = db.collection("reportsSummary");
    const returnsCollection = db.collection("returns");

    // 🧾 Fetch the invoice
    const invoice = await quotationsCollection.findOne({
      quotationId: invoiceId,
    });
    if (!invoice) {
      return NextResponse.json(
        { success: false, message: "Invoice not found." },
        { status: 404 }
      );
    }

    if (invoice.status !== "active" && invoice.status !== "Paid") {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice not active or paid. Cannot process returns.",
        },
        { status: 400 }
      );
    }

    const updatedItems = [...invoice.items];
    const returnItems: any[] = [];
    let totalRefund = 0;
    let totalProfitBack = 0;

    // 🧮 For each returned item
    for (const returned of items) {
      const { itemName, qty = 0, ft = 0, kg = 0 } = returned;

      const itemIndex = updatedItems.findIndex(
        (i: any) => i.originalName === itemName
      );
      if (itemIndex === -1) continue;

      const item = updatedItems[itemIndex];
      const type = (item.type || "").toLowerCase();

      // Determine how this item was sold originally
      let soldBy: "qty" | "ft" | "kg" = "qty";
      if (item.ft && item.ft > 0) soldBy = "ft";
      else if (item.weight && item.weight > 0) soldBy = "kg";

      // For pipes, always treat as qty and ft (1 qty = 20 ft)
      // const isPipe = type === "pipe";
      // let returnQty = isPipe ? qty : soldBy === "qty" ? qty : 0;
      // let returnFt = isPipe ? qty * 20 : soldBy === "ft" ? ft : 0;
      // let returnKg = soldBy === "kg" ? kg : 0;


      // For pipes, treat as qty; derive ft from what's sold on invoice
      const isPipe = type === "pipe";
      let returnQty = 0;
      let returnFt = 0;
      let returnKg = 0;

      if (isPipe) {
        const maxQty = item.qty || 0;
        const maxFt = item.ft || 0;

        const requestedQty = Math.min(qty, maxQty);
        if (requestedQty <= 0) continue;

        const ftPerQty = maxQty > 0 ? maxFt / maxQty : 0; // e.g. 100/5 = 20
        returnQty = requestedQty;
        returnFt = requestedQty * ftPerQty;

        if (returnFt > maxFt) returnFt = maxFt; // safety
      } else {
        returnQty = soldBy === "qty" ? qty : 0;
        returnFt = soldBy === "ft" ? ft : 0;
        returnKg = soldBy === "kg" ? kg : 0;
      }


      // prevent invalid (too large) returns
      const maxQty = item.qty || 0;
      const maxFt = item.ft || 0;
      const maxKg = item.weight || 0;
      if (
        (isPipe && (returnQty <= 0 || returnQty > maxQty)) ||
        (!isPipe &&
          soldBy === "qty" &&
          (returnQty <= 0 || returnQty > maxQty)) ||
        (soldBy === "ft" && (returnFt <= 0 || returnFt > maxFt)) ||
        (soldBy === "kg" && (returnKg <= 0 || returnKg > maxKg))
      ) {
        continue;
      }

      // 💰 Calculate refund & profit
      // const refundAmount = isPipe
      //   ? item.rate * returnFt
      //   : soldBy === "ft"
      //     ? item.rate * returnFt
      //     : soldBy === "kg"
      //       ? item.rate * returnKg
      //       : item.rate * returnQty;


      const refundAmount = isPipe
        ? item.rate * returnQty   // rate per pipe × quantity
        : soldBy === "ft"
          ? item.rate * returnFt
          : soldBy === "kg"
            ? item.rate * returnKg
            : item.rate * returnQty;


      const refundProfit = isPipe
        ? item.profitPerUnit * returnQty
        : soldBy === "ft"
          ? (item.profitPerFt || item.profitPerUnit) * returnFt
          : soldBy === "kg"
            ? (item.profitPerKg || item.profitPerUnit) * returnKg
            : item.profitPerUnit * returnQty;

      // ⚙️ Modify invoice item data
      if (
        (isPipe && returnQty === maxQty) ||
        (!isPipe && soldBy === "qty" && returnQty === maxQty) ||
        (soldBy === "ft" && returnFt === maxFt) ||
        (soldBy === "kg" && returnKg === maxKg)
      ) {
        updatedItems.splice(itemIndex, 1);
      } else {
        if (isPipe) {
          updatedItems[itemIndex].qty -= returnQty;
          updatedItems[itemIndex].ft -= returnFt;
        } else if (soldBy === "ft") {
          updatedItems[itemIndex].ft -= returnFt;
        } else if (soldBy === "kg") {
          updatedItems[itemIndex].weight -= returnKg;
        } else {
          updatedItems[itemIndex].qty -= returnQty;
        }

        updatedItems[itemIndex].amount -= refundAmount;
        if (soldBy !== "kg" && item.weight && item.qty > 0) {
          updatedItems[itemIndex].weight -=
            (item.weight / item.qty) * (qty || ft || kg);
        }
        updatedItems[itemIndex].totalProfit -= refundProfit;
      }

      // 📦 Update inventory back (main fields)
      const incFields: any = {};
      if (isPipe) {
        incFields.quantity = returnQty;
        incFields.ft = returnFt;
      } else if (soldBy === "ft") incFields.ft = returnFt;
      else if (soldBy === "kg") incFields.weight = returnKg;
      else incFields.quantity = returnQty;

      await inventoryCollection.updateOne(
        { name: item.originalName },
        { $inc: incFields },
        { upsert: true }
      );

      // 📦 Update latest batch in inventory
      const invItem = await inventoryCollection.findOne({
        name: item.originalName,
      });

      if (invItem) {
        // If batches exist, update the latest batch
        // if (Array.isArray(invItem.batches) && invItem.batches.length > 0) {
        //   const lastBatchDate =
        //     invItem.batches[invItem.batches.length - 1].date;
        //   const batchIncFields: any = {};
        //   if (isPipe) {
        //     batchIncFields["batches.$.quantity"] = returnQty;
        //     batchIncFields["batches.$.lengthFt"] = returnFt;
        //   } else if (soldBy === "ft")
        //     batchIncFields["batches.$.lengthFt"] = returnFt;
        //   else if (soldBy === "kg")
        //     batchIncFields["batches.$.weight"] = returnKg;
        //   else batchIncFields["batches.$.quantity"] = returnQty;

        //   await inventoryCollection.updateOne(
        //     { name: item.originalName, "batches.date": lastBatchDate },
        //     { $inc: batchIncFields }
        //   );
        if (Array.isArray(invItem.batches) && invItem.batches.length > 0) {
          // Find batch matching the sold rate, not just the latest batch
          // const soldRate = item.costPerUnit || 0;
          // const matchingBatch = invItem.batches.find((b: any) => {
          //   const batchRate = b.pricePerFt || b.pricePerKg || b.pricePerUnit || 0;
          //   return Math.abs(batchRate - soldRate) < 0.01;
          // });

          const soldRate = item.costPerUnit || 0;
          const matchingBatch = invItem.batches.find((b: any) => {
            const batchRate = b.pricePerFt || b.pricePerKg || b.pricePerUnit || 0;
            const normalizedSoldRate = isPipe ? soldRate / 20 : soldRate;
            return Math.abs(batchRate - normalizedSoldRate) < 0.01;
          });

          // const targetBatchDate = matchingBatch
          //   ? matchingBatch.date
          //   : invItem.batches[invItem.batches.length - 1].date;
          const targetBatchDate = matchingBatch ? matchingBatch.date : null;

          const batchIncFields: any = {};
          if (isPipe) {
            batchIncFields["batches.$.quantity"] = returnQty;
            batchIncFields["batches.$.lengthFt"] = returnFt;
          } else if (soldBy === "ft")
            batchIncFields["batches.$.lengthFt"] = returnFt;
          else if (soldBy === "kg")
            batchIncFields["batches.$.weight"] = returnKg;
          else batchIncFields["batches.$.quantity"] = returnQty;

          // await inventoryCollection.updateOne(
          //   { name: item.originalName, "batches.date": targetBatchDate },
          //   { $inc: batchIncFields }
          // );
          if (targetBatchDate) {
            await inventoryCollection.updateOne(
              { name: item.originalName, "batches.date": targetBatchDate },
              { $inc: batchIncFields }
            );
          } else {
            // No matching batch found — create a new one with original purchase price
            const normalizedRate = isPipe ? (item.costPerUnit || 0) / 20 : (item.costPerUnit || 0);
            const newBatch: Batch = {
              date: new Date().toISOString(),
              quantity: isPipe ? returnQty : soldBy === "qty" ? returnQty : 0,
              weight: soldBy === "kg" ? returnKg : 0,
              lengthFt: isPipe ? returnFt : soldBy === "ft" ? returnFt : 0,
              pricePerFt: isPipe || soldBy === "ft" ? normalizedRate : undefined,
              pricePerKg: soldBy === "kg" ? normalizedRate : undefined,
              pricePerUnit: soldBy === "qty" ? normalizedRate : undefined,
            };
            await inventoryCollection.updateOne(
              { name: item.originalName },
              { $push: { batches: newBatch } }
            );
          }
        } else {
          // If no batch exists, create a new batch
          const newBatch: Batch = {
            date: new Date().toISOString(),
            quantity: isPipe ? returnQty : soldBy === "qty" ? returnQty : 0,
            weight: soldBy === "kg" ? returnKg : 0,
            lengthFt: isPipe ? returnFt : soldBy === "ft" ? returnFt : 0,
            // add other fields as needed
          };
          await inventoryCollection.updateOne(
            { name: item.originalName },
            { $push: { batches: newBatch } }
          );
        }
      }

      // 🧾 Add to return item record
      returnItems.push({
        itemName,
        soldBy: isPipe ? "pipe" : soldBy,
        returnValue: isPipe
          ? returnQty
          : soldBy === "ft"
            ? returnFt
            : soldBy === "kg"
              ? returnKg
              : returnQty,
        rate: item.rate,
        refundAmount,
        refundProfit,
        type: invItem?.type || item.type,
        size: invItem?.size || item.size,
        guage: invItem?.guage || item.guage,
        gote: invItem?.gote || item.gote,
        color: invItem?.color || item.color,
        originalName: item.originalName,
      });

      totalRefund += refundAmount;
      totalProfitBack += refundProfit;
    }

    // const newGrandTotal = invoice.grandTotal - totalRefund;
    const newGrandTotal = Math.max(invoice.grandTotal - totalRefund, 0);
    const newProfit = (invoice.quotationTotalProfit || 0) - totalProfitBack;

    await quotationsCollection.updateOne(
      { quotationId: invoiceId },
      {
        $set: {
          items: updatedItems,
          grandTotal: newGrandTotal,
          quotationTotalProfit: newProfit,
          updatedAt: new Date().toISOString(),
          ...(updatedItems.length === 0
            ? { status: "returned", grandTotal: 0, quotationTotalProfit: 0 }
            : {}),
        },
      }
    );

    await reportsCollection.updateOne(
      {},
      { $inc: { totalAmount: -totalRefund, totalProfit: -totalProfitBack } }
    );

    const receivedTotal = (invoice.payments || []).reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );
    if (receivedTotal > newGrandTotal) {
      const refundAmount = receivedTotal - newGrandTotal;
      await quotationsCollection.updateOne(
        { quotationId: invoiceId },
        {
          $push: {
            payments: {
              amount: -Math.min(refundAmount, invoice.grandTotal),
              date: new Date().toISOString(),
              note: "Auto refund (return processed)",
            },
          },
        }
      );
    }

    const lastReturn = await returnsCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    let nextNumber = 1;
    if (lastReturn.length > 0) {
      const lastId = lastReturn[0].returnId;
      const num = parseInt(lastId.replace("RTN-", ""), 10);
      nextNumber = num + 1;
    }

    const returnId = `RTN-${String(nextNumber).padStart(4, "0")}`;

    await returnsCollection.insertOne({
      returnId,
      referenceInvoice: invoiceId,
      itemsReturned: returnItems,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, message: "Return processed successfully.", returnId },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error processing return:", err);
    return NextResponse.json(
      { success: false, message: "Server error in /api/returns" },
      { status: 500 }
    );
  }
}


