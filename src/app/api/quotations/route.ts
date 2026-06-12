import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

interface Payment {
  amount: number;
  date: string;
}

interface Quotation {
  _id?: string;
  quotationId: string;
  items: any[];
  discount: number;
  total: number;
  grandTotal: number;
  payments: Payment[];
  amount: number;
  date: string;
  totalReceived?: number;
  balance?: number;
  quotationTotalProfit?: number;
  status?: string;
  loading?: number;
  carriage?: number;
  bendingLabour?: number;
  customerName?: string;
  createdBy?: string;
}

export async function POST(req: Request) {
  try {
    const {
      items,
      discount,
      total,
      grandTotal,
      payments,
      loading,
      carriage,
      bendingLabour,
      quotationId,
      customerName,
      createdBy,
      date,
    } = await req.json();

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const quotationsCol = db.collection<Quotation>("quotations");
    const inventoryCol = db.collection("inventory");
    const customersCol = db.collection("customers");
    if (customerName && customerName.trim()) {
      const existing = await customersCol.findOne({
        name: customerName.trim(),
      });
      if (!existing) {
        await customersCol.insertOne({
          name: customerName.trim(),
          createdAt: new Date(),
        });
      }
    }

    // === DELTA INVENTORY UPDATE LOGIC ===
    const batchAwareDeduct = async (soldItem: any, deltaQty: number, deltaFt: number, deltaWeight: number) => {
      const inv = await inventoryCol.findOne({
        name: soldItem.originalName || soldItem.item,
        size: soldItem.size || "",
        guage: soldItem.guage || "",
      });
      if (!inv) return;

      // Deduct from main fields
      if (deltaQty !== 0) {
        await inventoryCol.updateOne(
          { _id: inv._id },
          { $inc: { quantity: -deltaQty } }
        );
      }
      if (deltaFt !== 0) {
        await inventoryCol.updateOne(
          { _id: inv._id },
          { $inc: { lengthFt: -deltaFt, ft: -deltaFt } }
        );
      }
      if (deltaWeight !== 0) {
        await inventoryCol.updateOne(
          { _id: inv._id },
          { $inc: { weight: -deltaWeight } }
        );
      }

      // --- BATCH-AWARE DEDUCTION (FIFO) ---
      if (inv && Array.isArray(inv.batches) && inv.batches.length > 0) {
        let updatedBatches = inv.batches.map((b: any) => ({ ...b }));

        // Deduct quantity (FIFO)
        let remainingQty = deltaQty > 0 ? deltaQty : 0;
        if (remainingQty > 0) {
          for (const batch of updatedBatches) {
            if (remainingQty <= 0) break;
            if (batch.quantity && batch.quantity > 0) {
              const deduct = Math.min(batch.quantity, remainingQty);
              batch.quantity -= deduct;
              remainingQty -= deduct;
            }
          }
        }

        // Deduct ft (FIFO)
        let remainingFt = deltaFt > 0 ? deltaFt : 0;
        if (remainingFt > 0) {
          for (const batch of updatedBatches) {
            if (remainingFt <= 0) break;
            if (batch.lengthFt && batch.lengthFt > 0) {
              const deduct = Math.min(batch.lengthFt, remainingFt);
              batch.lengthFt -= deduct;
              remainingFt -= deduct;
            }
          }
        }

        // Deduct weight (FIFO)
        let remainingWeight = deltaWeight > 0 ? deltaWeight : 0;
        if (remainingWeight > 0) {
          for (const batch of updatedBatches) {
            if (remainingWeight <= 0) break;
            if (batch.weight && batch.weight > 0) {
              const deduct = Math.min(batch.weight, remainingWeight);
              batch.weight -= deduct;
              remainingWeight -= deduct;
            }
          }
        }

        // Remove empty batches
        updatedBatches = updatedBatches.filter(
          (b) =>
            (b.quantity ?? 0) > 0 ||
            (b.lengthFt ?? 0) > 0 ||
            (b.weight ?? 0) > 0
        );

        // Recalculate main fields
        const newTotalQty = updatedBatches.reduce(
          (sum, b) => sum + (b.quantity ?? 0),
          0
        );
        const newTotalFt = updatedBatches.reduce(
          (sum, b) => sum + (b.lengthFt ?? 0),
          0
        );
        const newTotalWeight = updatedBatches.reduce(
          (sum, b) => sum + (b.weight ?? 0),
          0
        );

        await inventoryCol.updateOne(
          { _id: inv._id },
          {
            $set: {
              batches: updatedBatches,
              quantity: newTotalQty,
              lengthFt: newTotalFt,
              ft: newTotalFt,
              weight: newTotalWeight,
              updatedAt: new Date().toISOString(),
            },
          }
        );
      }
      // --- END BATCH-AWARE DEDUCTION ---
    };

    if (quotationId) {
      // UPDATE LOGIC
      const existing = await quotationsCol.findOne({ quotationId });
      if (existing) {
        // Build a map for quick lookup
        const oldItemsMap = {};
        for (const oldItem of existing.items || []) {
          const key = `${oldItem.originalName || oldItem.item}|${oldItem.size || ""
            }|${oldItem.guage || ""}|${oldItem.type || ""}`;
          oldItemsMap[key] = oldItem;
        }

        // 1. Build a set of keys for new items
        const newItemsSet = new Set(
          items.map(
            (soldItem) =>
              `${soldItem.originalName || soldItem.item}|${soldItem.size || ""
              }|${soldItem.guage || ""}|${soldItem.type || ""}`
          )
        );

        // 2. For each old item not in new items, add back its qty/ft/weight
        for (const key in oldItemsMap) {
          if (!newItemsSet.has(key)) {
            const oldItem = oldItemsMap[key];
            await batchAwareDeduct(oldItem, -Number(oldItem.qty) || 0, -Number(oldItem.ft) || 0, -Number(oldItem.weight) || 0);
          }
        }

        // For each new item, calculate the delta and only deduct the difference
        for (const soldItem of items) {
          const key = `${soldItem.originalName || soldItem.item}|${soldItem.size || ""
            }|${soldItem.guage || ""}|${soldItem.type || ""}`;
          const oldItem = oldItemsMap[key];

          // Calculate the difference for each field
          const oldQty = Number(oldItem?.qty) || 0;
          const newQty = Number(soldItem.qty) || 0;
          const deltaQty = newQty - oldQty;

          const oldFt = Number(oldItem?.ft) || 0;
          const newFt = Number(soldItem.ft) || 0;
          const deltaFt = newFt - oldFt;

          const oldWeight = Number(oldItem?.weight) || 0;
          const newWeight = Number(soldItem.weight) || 0;
          const deltaWeight = newWeight - oldWeight;

          await batchAwareDeduct(soldItem, deltaQty, deltaFt, deltaWeight);
        }
      }
    } else {
      // NEW INVOICE LOGIC
      for (const soldItem of items) {
        const qty = Number(soldItem.qty) || 0;
        const ft = Number(soldItem.ft) || 0;
        const weight = Number(soldItem.weight) || 0;
        await batchAwareDeduct(soldItem, qty, ft, weight);
      }
    }

    // === ENRICH ITEMS (unchanged) ===
    const enrichedItems: any[] = [];

    for (const soldItem of items) {
      const { item, qty, ft, weight, rate, originalName, size, guage } =
        soldItem;

      const inv = await inventoryCol.findOne({
        name: originalName || item,
        size: size || "",
        guage: guage || "",
      });

      if (!inv) {
        return NextResponse.json(
          { success: false, error: `❌ No inventory found for "${item}".` },
          { status: 400 }
        );
      }

      const invType = (inv.type ?? "").toLowerCase();
      const isPipe = invType === "pipe";
      const isJali = invType === "jali";
      const isTankaBarfi = invType === "tanka barfi jali";
      const isHardware = invType === "hardware";
      const isHardwarePerKg =
        isHardware &&
        Number(inv.pricePerKg) > 0 &&
        (!inv.pricePerUnit || Number(inv.pricePerUnit) === 0);
      const isHardwarePerFt =
        isHardware &&
        Number(inv.pricePerFt) > 0 &&
        ((!inv.pricePerKg && !inv.pricePerUnit) ||
          (Number(inv.pricePerKg) === 0 && Number(inv.pricePerUnit) === 0));

      const isAnglePattiSarrya = ["angle", "patti", "sarrya"].includes(invType);

      const isPerKgType =
        [
          "angle",
          "patti",
          "sarrya",
          "jali",
          "tanka barfi jali",
          "choras khana china jali",
          "diamond chadar",
          "plate",
          "sheet",
          "rod",
          "chowkat",
        ].includes(invType) || isHardwarePerKg;

      const soldFt = Number(ft) || 0;
      const soldQty = Number(qty) || 0;
      const soldWeight = Number(weight) || 0;

      // ===== Compute profit =====
      let costPerUnit = 0;
      if (isPipe) {
        costPerUnit = (Number(inv.pricePerFt) || 0) * 20;
      } else if (isHardwarePerFt) {
        costPerUnit = Number(inv.pricePerFt) || 0;
      } else if (isJali || isTankaBarfi) {
        costPerUnit = Number(inv.pricePerFt) || 0;
      } else if (isPerKgType) {
        costPerUnit = Number(inv.pricePerKg || inv.pricePerUnit) || 0;
      } else {
        costPerUnit = Number(inv.pricePerUnit) || 0;
      }

      const invoiceRatePerUnit = Number(rate);
      const profitPerUnit = Math.round(invoiceRatePerUnit - costPerUnit);

      const qtyFactor =
        soldQty > 0
          ? soldQty
          : soldWeight > 0
            ? soldWeight
            : soldFt > 0
              ? soldFt
              : 0;
      const totalProfit = Math.round(profitPerUnit * qtyFactor);

      enrichedItems.push({
        ...soldItem,
        costPerUnit,
        invoiceRatePerUnit,
        profitPerUnit,
        totalProfit,
      });

      // (No deduction here! Already handled above for update, and for create, it's fine)
    }

    const quotationTotalProfit =
      enrichedItems.reduce((s, i) => s + (i.totalProfit || 0), 0) +
      (Number(carriage) || 0) +
      (Number(bendingLabour) || 0);

    const safePayments: Payment[] = Array.isArray(payments) ? payments : [];
    const totalReceived = safePayments.reduce((s, p) => s + p.amount, 0);
    const balance = grandTotal - totalReceived;

    // ===== Save or update quotation =====
    if (quotationId) {
      const existing = await quotationsCol.findOne({ quotationId });
      if (existing) {
        await quotationsCol.updateOne(
          { quotationId },
          {
            $set: {
              items: enrichedItems,
              discount,
              total,
              grandTotal,
              payments: safePayments,
              amount: grandTotal,
              date: date
                ? new Date(date).toISOString()
                : new Date().toISOString(),
              quotationTotalProfit,
              loading: Number(loading) || 0,
              carriage: Number(carriage) || 0,
              bendingLabour: Number(bendingLabour) || 0,
              totalReceived,
              balance,
              status: "active",
              ...(customerName ? { customerName } : {}),
              ...(createdBy ? { createdBy } : {}),
            },
          }
        );

        return NextResponse.json({
          success: true,
          quotation: {
            ...existing,
            items: enrichedItems,
            discount,
            total,
            grandTotal,
            payments: safePayments,
            amount: grandTotal,
            date: new Date().toISOString(),
            loading: Number(loading) || 0,
            carriage: Number(carriage) || 0,
            quotationTotalProfit,
            totalReceived,
            balance,
            status: "active",
          },
        });
      }
    }

    const count = await quotationsCol.countDocuments({});
    const newQuotationId = `INV-${String(count + 1).padStart(4, "0")}`;

    const result = await quotationsCol.insertOne({
      quotationId: newQuotationId,
      items: enrichedItems,
      discount,
      total,
      grandTotal,
      payments: safePayments,
      amount: grandTotal,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      quotationTotalProfit,
      loading: Number(loading) || 0,
      carriage: Number(carriage) || 0,
      bendingLabour: Number(bendingLabour) || 0,
      totalReceived,
      balance,
      status: "active",
      ...(customerName ? { customerName } : {}),
      ...(createdBy ? { createdBy } : {}),
    });

    return NextResponse.json({
      success: true,
      quotation: {
        _id: result.insertedId,
        quotationId: newQuotationId,
        items: enrichedItems,
        discount,
        total,
        grandTotal,
        payments: safePayments,
        amount: grandTotal,
        date: new Date().toISOString(),
        quotationTotalProfit,
        loading: Number(loading) || 0,
        carriage: Number(carriage) || 0,
        totalReceived,
        balance,
        status: "active",
      },
    });
  } catch (err: any) {
    console.error("❌ Error saving quotation:", err);
    return NextResponse.json(
      { success: false, error: "Failed to save quotation" },
      { status: 500 }
    );
  }
}

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const status = searchParams.get("status");
//     const search = searchParams.get("search");
//     const month = searchParams.get("month");
//     const year = searchParams.get("year");
//     const fromDate = searchParams.get("fromDate");
//     const toDate = searchParams.get("toDate");

//     const client = await clientPromise;
//     const db = client.db("MakkaMetals");
//     const quotationsCol = db.collection<Quotation>("quotations");

//     let query: any = {};

//     // Status filter
//     if (status && status !== "All") {
//       query.status = status;
//     }

//     // Search by quotationId
//     if (search) {
//       query.quotationId = { $regex: search, $options: "i" };
//     }

//     // Date filters
//     if (month && year) {
//       const start = new Date(Number(year), Number(month) - 1, 1);
//       const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
//       query.date = { $gte: start.toISOString(), $lte: end.toISOString() };
//     } else if (year) {
//       const start = new Date(Number(year), 0, 1);
//       const end = new Date(Number(year), 11, 31, 23, 59, 59);
//       query.date = { $gte: start.toISOString(), $lte: end.toISOString() };
//     } else if (fromDate && toDate) {
//       query.date = {
//         $gte: new Date(fromDate).toISOString(),
//         $lte: new Date(toDate).toISOString(),
//       };
//     }

//     // Fetch quotations
//     const rawDocs = await quotationsCol
//       .find(query)
//       .sort({ date: -1 })
//       .toArray();

//     const count = await quotationsCol.countDocuments(query);

//     // Calculate balance and profit for each quotation
//     let quotations: Quotation[] = rawDocs.map((q: any) => {
//       const payments: Payment[] = Array.isArray(q.payments) ? q.payments : [];
//       const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
//       const balance = q.grandTotal
//         ? q.grandTotal - totalReceived
//         : (q.amount || 0) - totalReceived;

//       const quotationTotalProfit =
//         (q.quotationTotalProfit ??
//           (q.items?.reduce(
//             (sum: number, i: any) => sum + (i.totalProfit || 0),
//             0
//           ) ||
//             0)) + (Number(q.carriage) || 0);

//       return {
//         ...q,
//         payments,
//         totalReceived,
//         balance,
//         quotationTotalProfit,
//       };
//     });

//     // Optional: filter by paid/unpaid
//     if (status === "Paid") {
//       quotations = quotations.filter(
//         (q) => q.balance !== undefined && q.balance <= 0
//       );
//     } else if (status === "Unpaid") {
//       quotations = quotations.filter(
//         (q) => q.balance !== undefined && q.balance > 0
//       );
//     }

//     return NextResponse.json({ success: true, quotations, count });
//   } catch (err) {
//     console.error("❌ Error fetching quotations:", err);
//     return NextResponse.json(
//       { success: false, quotations: [], count: 0 },
//       { status: 500 }
//     );
//   }
// }


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || "all").toLowerCase();
    const search = searchParams.get("search");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const quotationsCol = db.collection("quotations");

    /** -------------------------------------------------------------
     * 1️⃣  Build Mongo query for server‑side filters
     * ------------------------------------------------------------ */
    const query: any = {};

    // status filter
    if (status !== "all") {
      if (["active", "returned"].includes(status)) {
        query.status = status;
      }
      // for paid/unpaid we’ll still compute below (need balance)
    }

    // search by invoice id
    if (search) {
      query.quotationId = { $regex: search, $options: "i" };
    }

    // date filters
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
      query.date = { $gte: start.toISOString(), $lte: end.toISOString() };
    } else if (year) {
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year), 11, 31, 23, 59, 59);
      query.date = { $gte: start.toISOString(), $lte: end.toISOString() };
    } else if (fromDate && toDate) {
      query.date = {
        $gte: new Date(fromDate).toISOString(),
        $lte: new Date(toDate).toISOString(),
      };
    }

    /** -------------------------------------------------------------
     * 2️⃣  Fetch matching docs
     * ------------------------------------------------------------ */
    const docs = await quotationsCol.find(query).sort({ date: -1 }).toArray();
    const count = await quotationsCol.countDocuments(query);

    /** -------------------------------------------------------------
     * 3️⃣  Compute balances & profits
     * ------------------------------------------------------------ */
    const computed = docs.map((q: any) => {
      const payments = Array.isArray(q.payments) ? q.payments : [];
      const totalReceived = payments.reduce(
        (s: number, p: any) => s + (p.amount || 0),
        0
      );

      const balance = Number(
        (q.grandTotal || q.amount || 0) - totalReceived
      );

      const quotationTotalProfit =
        (q.quotationTotalProfit ??
          q.items?.reduce(
            (sum: number, i: any) => sum + (i.totalProfit || 0),
            0
          ) ??
          0) + (Number(q.carriage) || 0);

      return {
        ...q,
        payments,
        totalReceived,
        balance,
        quotationTotalProfit,
      };
    });

    /** -------------------------------------------------------------
     * 4️⃣  Optional: refine paid/unpaid on the fly
     * ------------------------------------------------------------ */
    let quotations = computed;
    if (status === "paid") {
      quotations = computed.filter((q) => q.balance <= 0.99);
    } else if (status === "unpaid") {
      quotations = computed.filter((q) => q.balance > 0.99);
    }

    /** -------------------------------------------------------------
     * 5️⃣  Response
     * ------------------------------------------------------------ */
    return NextResponse.json({ success: true, quotations, count });
  } catch (err) {
    console.error("❌ Error fetching quotations:", err);
    return NextResponse.json(
      { success: false, quotations: [], count: 0 },
      { status: 500 }
    );
  }
}