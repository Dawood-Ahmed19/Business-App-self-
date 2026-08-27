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

    return NextResponse.json({
      success: true,
      returns: allReturns,
    });
  } catch (err) {
    console.error("❌ Error fetching returns:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Error fetching returns",
      },
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

    const quotationsCollection =
      db.collection<Quotation>("quotations");

    const inventoryCollection =
      db.collection<InventoryItem>("inventory");

    const reportsCollection = db.collection("reportsSummary");
    const returnsCollection = db.collection("returns");

    // 🧾 Fetch the invoice

    const invoice = await quotationsCollection.findOne({
      quotationId: invoiceId,
    });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice not found.",
        },
        { status: 404 }
      );
    }

    if (invoice.status !== "active" && invoice.status !== "Paid") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invoice not active or paid. Cannot process returns.",
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
      const {
        itemName,
        size,
        guage,
        qty = 0,
        ft = 0,
        kg = 0,
      } = returned;

      // FIX:
      // Match the exact invoice item using name + size + guage
      // instead of name only.

      const itemIndex = updatedItems.findIndex(
        (i: any) =>
          i.originalName === itemName &&
          String(i.size ?? "") === String(size ?? "") &&
          String(i.guage ?? "") === String(guage ?? "")
      );

      if (itemIndex === -1) continue;

      const item = updatedItems[itemIndex];

      const type = (item.type || "").toLowerCase();

      // Determine how this item was sold originally

      let soldBy: "qty" | "ft" | "kg" = "qty";

      if (item.ft && item.ft > 0) soldBy = "ft";
      else if (item.weight && item.weight > 0) soldBy = "kg";

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

        const ftPerQty =
          maxQty > 0 ? maxFt / maxQty : 0;

        returnQty = requestedQty;

        returnFt = requestedQty * ftPerQty;

        if (returnFt > maxFt) returnFt = maxFt;
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
        (isPipe &&
          (returnQty <= 0 || returnQty > maxQty)) ||
        (!isPipe &&
          soldBy === "qty" &&
          (returnQty <= 0 || returnQty > maxQty)) ||
        (soldBy === "ft" &&
          (returnFt <= 0 || returnFt > maxFt)) ||
        (soldBy === "kg" &&
          (returnKg <= 0 || returnKg > maxKg))
      ) {
        continue;
      }

      // 💰 Calculate refund & profit

      const refundAmount = isPipe
        ? item.rate * returnQty
        : soldBy === "ft"
          ? item.rate * returnFt
          : soldBy === "kg"
            ? item.rate * returnKg
            : item.rate * returnQty;

      const refundProfit = isPipe
        ? item.profitPerUnit * returnQty
        : soldBy === "ft"
          ? (item.profitPerFt || item.profitPerUnit) *
          returnFt
          : soldBy === "kg"
            ? (item.profitPerKg || item.profitPerUnit) *
            returnKg
            : item.profitPerUnit * returnQty;

      // ⚙️ Modify invoice item data

      if (
        (isPipe && returnQty === maxQty) ||
        (!isPipe &&
          soldBy === "qty" &&
          returnQty === maxQty) ||
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

        if (
          soldBy !== "kg" &&
          item.weight &&
          item.qty > 0
        ) {
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
      } else if (soldBy === "ft") {
        incFields.ft = returnFt;
      } else if (soldBy === "kg") {
        incFields.weight = returnKg;
      } else {
        incFields.quantity = returnQty;
      }

      // FIX:
      // Update the exact inventory item using name + size + guage.
      // Previously it used name only, which could update size 10
      // when size 12 was returned.

      const inventoryFilter = {
        name: item.originalName,
        size: item.size,
        guage: item.guage,
      };

      await inventoryCollection.updateOne(
        inventoryFilter,
        { $inc: incFields }
      );

      // 📦 Update latest batch in inventory

      const invItem = await inventoryCollection.findOne(
        inventoryFilter
      );

      if (invItem) {
        // If batches exist, update the latest batch

        if (
          Array.isArray(invItem.batches) &&
          invItem.batches.length > 0
        ) {
          // Find batch matching the sold rate, not just the latest batch

          const soldRate = item.costPerUnit || 0;

          const matchingBatch = invItem.batches.find(
            (b: any) => {
              const batchRate =
                b.pricePerFt ||
                b.pricePerKg ||
                b.pricePerUnit ||
                0;

              const normalizedSoldRate = isPipe
                ? soldRate / 20
                : soldRate;

              return (
                Math.abs(
                  batchRate - normalizedSoldRate
                ) < 0.01
              );
            }
          );

          const targetBatchDate = matchingBatch
            ? matchingBatch.date
            : null;

          const batchIncFields: any = {};

          if (isPipe) {
            batchIncFields["batches.$.quantity"] =
              returnQty;

            batchIncFields["batches.$.lengthFt"] =
              returnFt;
          } else if (soldBy === "ft") {
            batchIncFields["batches.$.lengthFt"] =
              returnFt;
          } else if (soldBy === "kg") {
            batchIncFields["batches.$.weight"] =
              returnKg;
          } else {
            batchIncFields["batches.$.quantity"] =
              returnQty;
          }

          if (targetBatchDate) {
            // FIX:
            // Also make sure the batch belongs to the exact
            // inventory item (name + size + guage).

            await inventoryCollection.updateOne(
              {
                ...inventoryFilter,
                "batches.date": targetBatchDate,
              },
              { $inc: batchIncFields }
            );
          } else {
            // No matching batch found — create a new one
            // with original purchase price

            const normalizedRate = isPipe
              ? (item.costPerUnit || 0) / 20
              : item.costPerUnit || 0;

            const newBatch: Batch = {
              date: new Date().toISOString(),

              quantity:
                isPipe || soldBy === "qty"
                  ? returnQty
                  : 0,

              weight:
                soldBy === "kg"
                  ? returnKg
                  : 0,

              lengthFt:
                isPipe || soldBy === "ft"
                  ? returnFt
                  : 0,

              pricePerFt:
                isPipe || soldBy === "ft"
                  ? normalizedRate
                  : undefined,

              pricePerKg:
                soldBy === "kg"
                  ? normalizedRate
                  : undefined,

              pricePerUnit:
                soldBy === "qty"
                  ? normalizedRate
                  : undefined,
            };

            // FIX:
            // Push the batch into the exact inventory item.

            await inventoryCollection.updateOne(
              inventoryFilter,
              { $push: { batches: newBatch } }
            );
          }
        } else {
          // If no batch exists, create a new batch

          const newBatch: Batch = {
            date: new Date().toISOString(),

            quantity:
              isPipe || soldBy === "qty"
                ? returnQty
                : 0,

            weight:
              soldBy === "kg"
                ? returnKg
                : 0,

            lengthFt:
              isPipe || soldBy === "ft"
                ? returnFt
                : 0,

            // add other fields as needed
          };

          // FIX:
          // Push the batch into the exact inventory item.

          await inventoryCollection.updateOne(
            inventoryFilter,
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

        // FIX:
        // Use the exact invoice item's values instead of
        // potentially taking size/guage from a wrong inventory item.

        type: item.type,
        size: item.size,
        guage: item.guage,
        gote: item.gote,
        color: item.color,
        originalName: item.originalName,
      });

      totalRefund += refundAmount;
      totalProfitBack += refundProfit;
    }

    // const newGrandTotal = invoice.grandTotal - totalRefund;

    const newGrandTotal = Math.max(
      invoice.grandTotal - totalRefund,
      0
    );

    const newProfit =
      (invoice.quotationTotalProfit || 0) -
      totalProfitBack;

    const newTotal = updatedItems.reduce(
      (sum, i) => sum + (Number(i.amount) || 0),
      0
    );

    const receivedTotal = (invoice.payments || []).reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    let refundPaymentEntry: Payment | null = null;

    let finalReceivedTotal = receivedTotal;

    if (receivedTotal > newGrandTotal) {
      const refundAmount = Math.min(
        receivedTotal - newGrandTotal,
        invoice.grandTotal
      );

      refundPaymentEntry = {
        amount: -refundAmount,
        date: new Date().toISOString(),
        note: "Auto refund (return processed)",
      };

      finalReceivedTotal =
        receivedTotal - refundAmount;
    }

    const newBalance =
      newGrandTotal - finalReceivedTotal;

    const updateOps: any = {
      $set: {
        items: updatedItems,

        total: newTotal,

        grandTotal: newGrandTotal,

        amount: newGrandTotal,

        balance: newBalance,

        totalReceived: finalReceivedTotal,

        quotationTotalProfit: newProfit,

        updatedAt: new Date().toISOString(),

        ...(updatedItems.length === 0
          ? {
            status: "returned",
            grandTotal: 0,
            amount: 0,
            balance: 0,
            quotationTotalProfit: 0,
          }
          : {}),
      },
    };

    if (refundPaymentEntry) {
      updateOps.$push = {
        payments: refundPaymentEntry,
      };
    }

    await quotationsCollection.updateOne(
      { quotationId: invoiceId },
      updateOps
    );

    await reportsCollection.updateOne(
      {},
      {
        $inc: {
          totalAmount: -totalRefund,
          totalProfit: -totalProfitBack,
        },
      }
    );

    const lastReturn = await returnsCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    let nextNumber = 1;

    if (lastReturn.length > 0) {
      const lastId = lastReturn[0].returnId;

      const num = parseInt(
        lastId.replace("RTN-", ""),
        10
      );

      nextNumber = num + 1;
    }

    const returnId = `RTN-${String(nextNumber).padStart(
      4,
      "0"
    )}`;

    await returnsCollection.insertOne({
      returnId,
      referenceInvoice: invoiceId,
      itemsReturned: returnItems,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Return processed successfully.",
        returnId,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error processing return:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Server error in /api/returns",
      },
      { status: 500 }
    );
  }
}
