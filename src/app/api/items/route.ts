import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

/* =======================================================
   Type definition
========================================================= */

// Helper Function

function recalcTotalsFromBatches(batches: InventoryBatch[]) {
  return {
    quantity: batches.reduce((s, b) => s + (Number(b.quantity) || 0), 0),
    weight: batches.reduce((s, b) => s + (Number(b.weight) || 0), 0),
    lengthFt: batches.reduce((s, b) => s + (Number(b.lengthFt) || 0), 0),
  };
}


interface InventoryBatch {
  quantity?: number;
  weight?: number;
  lengthFt?: number;
  pricePerUnit?: number | null;
  pricePerKg?: number | null;
  pricePerFt?: number | null;
  date: string;
}

interface InventoryItem {
  _id?: string | ObjectId;
  name: string;
  type: string;
  pipeType?: string;
  guage?: string | number;
  gote?: string | number;
  size: string;
  number?: string;
  weight?: number;
  quantity?: number;
  lengthFt?: number;
  pricePerFt?: number | null;
  pricePerUnit?: number | null;
  pricePerKg?: number | null;
  amount?: number | null;
  date: string;
  index?: number;
  color?: string;
  uniqueKey?: string;
  batches?: InventoryBatch[];
}

/* =======================================================
   Normaliser — fixed to keep decimals (no rounding)
========================================================= */
function normalizeItem(item: any): InventoryItem {
  const name = (item.name || "").trim().toLowerCase();
  const type = (item.type || "").trim().toLowerCase();
  const pipeType = (item.pipeType || "").trim().toLowerCase();
  const size = String(item.size ?? "")
    .trim()
    .toLowerCase();
  const number = String(item.number ?? "")
    .trim()
    .toLowerCase();
  const guage = String(item.guage ?? "")
    .trim()
    .toLowerCase();
  const gote = String(item.gote ?? "")
    .trim()
    .toLowerCase();
  const color = (item.color || "").trim().toLowerCase();

  const toFloat = (v: any) =>
    v === undefined || v === null || v === "" ? 0 : parseFloat(v);

  const weight = toFloat(item.weight);
  const quantity = toFloat(item.quantity);
  const lengthFt = toFloat(item.lengthFt ?? item.ft ?? 0);

  // ✅ keep precision, do not round
  let pricePerFt =
    item.pricePerFt != null && item.pricePerFt !== ""
      ? parseFloat(item.pricePerFt)
      : null;
  let pricePerKg =
    item.pricePerKg != null && item.pricePerKg !== ""
      ? parseFloat(item.pricePerKg)
      : null;
  let pricePerUnit =
    item.pricePerUnit != null && item.pricePerUnit !== ""
      ? parseFloat(item.pricePerUnit)
      : null;

  // ✅ NEW: handle plain "price" for per‑kg items like Diamond Chadar
  if (
    (type === "diamond chadar" ||
      type === "chowkat" ||
      ["angle", "patti", "sarrya", "choras khana china jali"].includes(type)) &&
    (pricePerKg === null || pricePerKg === 0) &&
    item.price != null &&
    item.price !== ""
  ) {
    pricePerKg = parseFloat(item.price);
  }

  // per‑kg pricing detection
  const isPerKgPricing =
    pricePerKg != null &&
    pricePerKg > 0 &&
    (!pricePerUnit || pricePerUnit === 0);

  // compute amount safely
  const amount = isPerKgPricing
    ? Number((weight * (pricePerKg ?? 0)).toFixed(2))
    : pricePerUnit && quantity
      ? Number((quantity * (pricePerUnit ?? 0)).toFixed(2))
      : null;

  // ensure per‑kg items don’t overwrite pricePerUnit
  if (isPerKgPricing) {
    pricePerUnit = null;
  }

  const uniqueKey = `${type}_${name}_${size}_${number}_${guage}_${gote}_${pipeType}_${color}`;

  return {
    ...item,
    name,
    type,
    pipeType,
    gote,
    guage,
    size,
    number,
    color,
    uniqueKey,
    weight,
    quantity,
    lengthFt,
    pricePerFt,
    pricePerKg,
    pricePerUnit,
    amount,
  };
}
/* =======================================================
   Helper: Generate unique names
========================================================= */
async function generateTypeName(collection: any, type: string) {
  const proper = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

  const last = await collection
    .find({ type })
    .sort({ index: -1 })
    .limit(1)
    .toArray();

  const next = last.length && last[0].index ? last[0].index + 1 : 1;

  return {
    name: `${proper}-${String(next).padStart(3, "0")}`,
    index: next,
  };
}

/* =======================================================
   GET — list items
========================================================= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const size = searchParams.get("size");
    const guage = searchParams.get("guage");
    const search = searchParams.get("search");

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const collection = db.collection<InventoryItem>("inventory");

    const query: any = {};
    if (type && type.toLowerCase() !== "all")
      query.type = { $regex: new RegExp(`^${type}$`, "i") };
    if (size && size.toLowerCase() !== "all")
      query.size = { $regex: new RegExp(`^${size}$`, "i") };
    if (guage && guage.toLowerCase() !== "all")
      query.guage = { $regex: new RegExp(`^${guage}$`, "i") };
    if (search && search.trim() !== "")
      query.name = { $regex: search.trim(), $options: "i" };

    const items = await collection
      .find(query, {
        projection: {
          name: 1,
          type: 1,
          color: 1,
          guage: 1,
          size: 1,
          number: 1,
          lengthFt: 1,
          weight: 1,
          quantity: 1,
          pricePerFt: 1,
          pricePerUnit: 1,
          pricePerKg: 1,
          amount: 1,
          date: 1,
          batches: 1,
        },
      })
      .sort({ date: -1 })
      .toArray();

    const safeItems = items.map((x: any) => ({
      ...x,
      ft: x.type?.toLowerCase() === "pipe" ? Number(x.lengthFt ?? 0) : null,
      lengthFt: Number(x.lengthFt ?? 0),
      _id: x._id?.toString(),
    }));

    return NextResponse.json({ success: true, items: safeItems });
  } catch (error) {
    console.error("❌ Error fetching items:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

/* =======================================================
   POST — add new or merge existing
========================================================= */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const normalized = normalizeItem(body);
    let itemName = normalized.name;

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const collection = db.collection<InventoryItem>("inventory");

    const existing = await collection.findOne({
      uniqueKey: normalized.uniqueKey,
    });

    // Prepare the new batch
    const batch: any = {
      quantity: normalized.quantity ?? 0,
      weight: normalized.weight ?? 0,
      lengthFt: normalized.lengthFt ?? 0,
      pricePerUnit: normalized.pricePerUnit ?? null,
      pricePerKg: normalized.pricePerKg ?? null,
      pricePerFt: normalized.pricePerFt ?? null,
      date: new Date().toISOString(),
    };

    if (existing) {
      // If batches array doesn't exist, create it from existing stock
      if (!Array.isArray(existing.batches)) {
        existing.batches = [];
        // Optionally, migrate existing stock as a batch
        if (
          (existing.quantity && existing.quantity > 0) ||
          (existing.weight && existing.weight > 0) ||
          (existing.lengthFt && existing.lengthFt > 0)
        ) {
          existing.batches.push({
            quantity: existing.quantity ?? 0,
            weight: existing.weight ?? 0,
            lengthFt: existing.lengthFt ?? 0,
            pricePerUnit: existing.pricePerUnit ?? null,
            pricePerKg: existing.pricePerKg ?? null,
            pricePerFt: existing.pricePerFt ?? null,
            date: existing.date ?? new Date().toISOString(),
          });
        }
      }

      // Add the new batch
      const updatedBatches = [...(existing.batches || []), batch];
      const totals = recalcTotalsFromBatches(updatedBatches);

      await collection.updateOne(
        { _id: existing._id },
        {
          $set: {
            batches: updatedBatches,
            quantity: totals.quantity,
            weight: totals.weight,
            lengthFt: totals.lengthFt,
            ft: totals.lengthFt,
            pricePerUnit: batch.pricePerUnit ?? existing.pricePerUnit ?? null,
            pricePerKg: batch.pricePerKg ?? existing.pricePerKg ?? null,
            pricePerFt: batch.pricePerFt ?? existing.pricePerFt ?? null,
            date: new Date().toISOString(),
          },
        }
      );


      return NextResponse.json({
        success: true,
        item: { ...existing, batches: [...(existing.batches || []), batch] },
      });
    }

    // --- Your auto-naming logic (unchanged) ---
    const autoTypes = [
      "angle",
      "patti",
      "sarrya",
      "diamond chadar",
      "jali",
      "tanka barfi jali",
      "choras khana china jali",
      "plate",
      "sheet",
      "rod",
    ];

    if (!itemName && autoTypes.includes(normalized.type)) {
      const generated = await generateTypeName(
        collection,
        normalized.type.toLowerCase()
      );
      itemName = generated.name;
      normalized.name = itemName;
      normalized.index = generated.index;
    }

    if (!itemName && normalized.type === "pipe") {
      const last = await collection
        .find({ type: "pipe" })
        .sort({ index: -1 })
        .limit(1)
        .toArray();
      const next = last.length && last[0].index ? last[0].index + 1 : 1;
      itemName = `p${String(next).padStart(3, "0")}`;
      normalized.name = itemName;
      normalized.index = next;
    }

    if (
      !itemName &&
      (normalized.type === "pillar" || normalized.type === "pillars")
    ) {
      const last = await collection
        .find({ type: { $in: ["pillar", "pillars"] } })
        .sort({ index: -1 })
        .limit(1)
        .toArray();

      const next = last.length && last[0].index ? last[0].index + 1 : 1;
      itemName = `pl${String(next).padStart(3, "0")}`;
      normalized.name = itemName;
      normalized.index = next;
    }

    if (!itemName && normalized.type === "chowkat") {
      const last = await collection
        .find({ type: "chowkat" })
        .sort({ index: -1 })
        .limit(1)
        .toArray();

      const next = last.length && last[0].index ? last[0].index + 1 : 1;
      itemName = `CH-${String(next).padStart(3, "0")}`;
      normalized.name = itemName;
      normalized.index = next;
    }

    if (!itemName) {
      itemName = "unnamed";
      normalized.name = itemName;
    }

    // Insert new item with batches array
    const insert = await collection.insertOne({
      ...normalized,
      name: itemName,
      batches: [batch],
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      item: { _id: insert.insertedId, ...normalized, batches: [batch] },
    });
  } catch (err) {
    console.error("❌ Error saving item:", err);
    return NextResponse.json(
      { success: false, error: "Failed to save item" },
      { status: 500 }
    );
  }
}

/* =======================================================
   PATCH — deduct stock
========================================================= */
// export async function PATCH(req: Request) {
//   try {
//     const { name, qty, weight, ft } = await req.json();

//     if (!name) {
//       return NextResponse.json(
//         { success: false, error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     const client = await clientPromise;
//     const db = client.db("MakkaMetals");
//     const collection = db.collection<InventoryItem>("inventory");
//     const item = await collection.findOne({ name });

//     if (!item)
//       return NextResponse.json(
//         { success: false, error: "Item not found" },
//         { status: 404 }
//       );

//     if (item.type?.toLowerCase() === "pipe") {
//       const currentFt = Number(item.lengthFt ?? 0);
//       const soldFt = Number(ft ?? 0);
//       const newFt = Math.max(currentFt - soldFt, 0);

//       await collection.updateOne(
//         { _id: item._id },
//         {
//           $set: {
//             lengthFt: newFt,
//             amount: (item.pricePerFt || 0) * newFt,
//             date: new Date().toISOString(),
//           },
//         }
//       );

//       return NextResponse.json({
//         success: true,
//         updated: { name, newLengthFt: newFt },
//       });
//     }

//     const perKgTypes = [
//       "angle",
//       "patti",
//       "sarrya",
//       "diamond chadar",
//       "jali",
//       "tanka barfi jali",
//       "choras khana china jali",
//       "plate",
//       "sheet",
//       "rod",
//     ];
//     if (perKgTypes.includes(item.type?.toLowerCase())) {
//       const currentWeight = Number(item.weight ?? 0);
//       const soldWeight = Number(weight ?? 0);
//       const newWeight = Math.max(currentWeight - soldWeight, 0);

//       await collection.updateOne(
//         { _id: item._id },
//         {
//           $set: {
//             weight: newWeight,
//             amount: (item.pricePerKg || 0) * newWeight,
//             date: new Date().toISOString(),
//           },
//         }
//       );

//       return NextResponse.json({
//         success: true,
//         updated: { name, newWeight },
//       });
//     }

//     const currentQty = Number(item.quantity ?? 0);
//     const soldQty = Number(qty ?? 0);
//     const newQty = Math.max(currentQty - soldQty, 0);

//     await collection.updateOne(
//       { _id: item._id },
//       {
//         $set: {
//           quantity: newQty,
//           amount: (item.pricePerUnit || 0) * newQty,
//           date: new Date().toISOString(),
//         },
//       }
//     );

//     return NextResponse.json({
//       success: true,
//       updated: { name, newQuantity: newQty },
//     });
//   } catch (err) {
//     console.error("❌ Error deducting inventory:", err);
//     return NextResponse.json(
//       { success: false, error: "Failed to deduct stock" },
//       { status: 500 }
//     );
//   }
// }

// export async function PATCH(req: Request) {
//   try {
//     const { name, qty, weight, ft } = await req.json();

//     if (!name) {
//       return NextResponse.json(
//         { success: false, error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     const client = await clientPromise;
//     const db = client.db("MakkaMetals");
//     const collection = db.collection<InventoryItem>("inventory");
//     const item = await collection.findOne({ name });

//     if (!item)
//       return NextResponse.json(
//         { success: false, error: "Item not found" },
//         { status: 404 }
//       );

//     // FIFO logic for batches
//     if (Array.isArray(item.batches) && item.batches.length > 0) {
//       let remainingQty = Number(qty ?? 0);
//       let remainingWeight = Number(weight ?? 0);
//       let remainingFt = Number(ft ?? 0);

//       // Clone batches to avoid mutating original
//       let updatedBatches = item.batches.map((b: any) => ({ ...b }));

//       // Deduct per unit
//       if (remainingQty > 0) {
//         for (const batch of updatedBatches) {
//           if (remainingQty <= 0) break;
//           const deduct = Math.min(batch.quantity ?? 0, remainingQty);
//           batch.quantity = (batch.quantity ?? 0) - deduct;
//           remainingQty -= deduct;
//         }
//       }

//       // Deduct per weight
//       if (remainingWeight > 0) {
//         for (const batch of updatedBatches) {
//           if (remainingWeight <= 0) break;
//           const deduct = Math.min(batch.weight ?? 0, remainingWeight);
//           batch.weight = (batch.weight ?? 0) - deduct;
//           remainingWeight -= deduct;
//         }
//       }

//       // Deduct per ft
//       if (remainingFt > 0) {
//         for (const batch of updatedBatches) {
//           if (remainingFt <= 0) break;
//           const deduct = Math.min(batch.lengthFt ?? 0, remainingFt);
//           batch.lengthFt = (batch.lengthFt ?? 0) - deduct;
//           remainingFt -= deduct;
//         }
//       }

//       // Remove depleted batches (optional)
//       updatedBatches = updatedBatches.filter(
//         (b) =>
//           (b.quantity ?? 0) > 0 || (b.weight ?? 0) > 0 || (b.lengthFt ?? 0) > 0
//       );

//       await collection.updateOne(
//         { _id: item._id },
//         {
//           $set: {
//             batches: updatedBatches,
//             date: new Date().toISOString(),
//           },
//         }
//       );

//       return NextResponse.json({
//         success: true,
//         updated: { name, batches: updatedBatches },
//       });
//     }
//     if (item.type?.toLowerCase() === "pipe") {
//       const currentFt = Number(item.lengthFt ?? 0);
//       const soldFt = Number(ft ?? 0);
//       const newFt = Math.max(currentFt - soldFt, 0);

//       await collection.updateOne(
//         { _id: item._id },
//         {
//           $set: {
//             lengthFt: newFt,
//             amount: (item.pricePerFt || 0) * newFt,
//             date: new Date().toISOString(),
//           },
//         }
//       );

//       return NextResponse.json({
//         success: true,
//         updated: { name, newLengthFt: newFt },
//       });
//     }

//     const perKgTypes = [
//       "angle",
//       "patti",
//       "sarrya",
//       "diamond chadar",
//       "jali",
//       "tanka barfi jali",
//       "choras khana china jali",
//       "plate",
//       "sheet",
//       "rod",
//     ];
//     if (perKgTypes.includes(item.type?.toLowerCase())) {
//       const currentWeight = Number(item.weight ?? 0);
//       const soldWeight = Number(weight ?? 0);
//       const newWeight = Math.max(currentWeight - soldWeight, 0);

//       const totals = recalcTotalsFromBatches(item.batches);


//       await collection.updateOne(
//         { _id: item._id },
//         {
//           $set: {
//             batches: item.batches || [],
//             quantity: totals.quantity,
//             weight: totals.weight,
//             lengthFt: totals.lengthFt,
//             ft: totals.lengthFt,
//             date: new Date().toISOString(),
//           },
//         }
//       );



//       return NextResponse.json({
//         success: true,
//         updated: { name, newWeight },
//       });
//     }

//     const currentQty = Number(item.quantity ?? 0);
//     const soldQty = Number(qty ?? 0);
//     const newQty = Math.max(currentQty - soldQty, 0);

//     await collection.updateOne(
//       { _id: item._id },
//       {
//         $set: {
//           quantity: newQty,
//           amount: (item.pricePerUnit || 0) * newQty,
//           date: new Date().toISOString(),
//         },
//       }
//     );

//     return NextResponse.json({
//       success: true,
//       updated: { name, newQuantity: newQty },
//     });
//   } catch (err) {
//     console.error("❌ Error deducting inventory:", err);
//     return NextResponse.json(
//       { success: false, error: "Failed to deduct stock" },
//       { status: 500 }
//     );
//   }
// }


export async function PATCH(req: Request) {
  try {
    const { name, qty, weight, ft } = await req.json();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const collection = db.collection<InventoryItem>("inventory");
    const item = await collection.findOne({ name });

    if (!item)
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );

    if (Array.isArray(item.batches) && item.batches.length > 0) {
      const totalAvailableQty = item.batches.reduce((s, b) => s + (b.quantity ?? 0), 0);
      const totalAvailableWeight = item.batches.reduce((s, b) => s + (b.weight ?? 0), 0);
      const totalAvailableFt = item.batches.reduce((s, b) => s + (b.lengthFt ?? 0), 0);

      if (qty && Number(qty) > totalAvailableQty) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock. Available: ${totalAvailableQty} units` },
          { status: 400 }
        );
      }
      if (weight && Number(weight) > totalAvailableWeight) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock. Available: ${totalAvailableWeight} kg` },
          { status: 400 }
        );
      }
      if (ft && Number(ft) > totalAvailableFt) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock. Available: ${totalAvailableFt} ft` },
          { status: 400 }
        );
      }

      let remainingQty = Number(qty ?? 0);
      let remainingWeight = Number(weight ?? 0);
      let remainingFt = Number(ft ?? 0);

      let updatedBatches = item.batches.map((b: any) => ({ ...b }));

      if (remainingQty > 0) {
        for (const batch of updatedBatches) {
          if (remainingQty <= 0) break;
          const deduct = Math.min(batch.quantity ?? 0, remainingQty);
          batch.quantity = Math.max((batch.quantity ?? 0) - deduct, 0);
          remainingQty -= deduct;
        }
      }

      if (remainingWeight > 0) {
        for (const batch of updatedBatches) {
          if (remainingWeight <= 0) break;
          const deduct = Math.min(batch.weight ?? 0, remainingWeight);
          batch.weight = Math.max((batch.weight ?? 0) - deduct, 0);
          remainingWeight -= deduct;
        }
      }

      if (remainingFt > 0) {
        for (const batch of updatedBatches) {
          if (remainingFt <= 0) break;
          const deduct = Math.min(batch.lengthFt ?? 0, remainingFt);
          batch.lengthFt = Math.max((batch.lengthFt ?? 0) - deduct, 0);
          remainingFt -= deduct;
        }
      }

      // Remove depleted batches
      updatedBatches = updatedBatches.filter(
        (b) => (b.quantity ?? 0) > 0 || (b.weight ?? 0) > 0 || (b.lengthFt ?? 0) > 0
      );

      const totals = recalcTotalsFromBatches(updatedBatches);

      await collection.updateOne(
        { _id: item._id },
        {
          $set: {
            batches: updatedBatches,
            quantity: Math.max(totals.quantity, 0),
            weight: Math.max(totals.weight, 0),
            lengthFt: Math.max(totals.lengthFt, 0),
            ft: Math.max(totals.lengthFt, 0),
            date: new Date().toISOString(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        updated: { name, batches: updatedBatches, totals },
      });
    }

    if (item.type?.toLowerCase() === "pipe") {
      const currentFt = Number(item.lengthFt ?? 0);
      const soldFt = Number(ft ?? 0);

      if (soldFt > currentFt) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock. Available: ${currentFt} ft` },
          { status: 400 }
        );
      }

      const newFt = Math.max(currentFt - soldFt, 0);
      await collection.updateOne(
        { _id: item._id },
        { $set: { lengthFt: newFt, amount: (item.pricePerFt || 0) * newFt, date: new Date().toISOString() } }
      );
      return NextResponse.json({ success: true, updated: { name, newLengthFt: newFt } });
    }

    const perKgTypes = ["angle", "patti", "sarrya", "diamond chadar", "jali",
      "tanka barfi jali", "choras khana china jali", "plate", "sheet", "rod"];

    if (perKgTypes.includes(item.type?.toLowerCase())) {
      const currentWeight = Number(item.weight ?? 0);
      const soldWeight = Number(weight ?? 0);

      if (soldWeight > currentWeight) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock. Available: ${currentWeight} kg` },
          { status: 400 }
        );
      }

      const newWeight = Math.max(currentWeight - soldWeight, 0);
      await collection.updateOne(
        { _id: item._id },
        { $set: { weight: newWeight, amount: (item.pricePerKg || 0) * newWeight, date: new Date().toISOString() } }
      );
      return NextResponse.json({ success: true, updated: { name, newWeight } });
    }

    const currentQty = Number(item.quantity ?? 0);
    const soldQty = Number(qty ?? 0);

    if (soldQty > currentQty) {
      return NextResponse.json(
        { success: false, error: `Insufficient stock. Available: ${currentQty} units` },
        { status: 400 }
      );
    }

    const newQty = Math.max(currentQty - soldQty, 0);
    await collection.updateOne(
      { _id: item._id },
      { $set: { quantity: newQty, amount: (item.pricePerUnit || 0) * newQty, date: new Date().toISOString() } }
    );
    return NextResponse.json({ success: true, updated: { name, newQuantity: newQty } });

  } catch (err) {
    console.error("❌ Error deducting inventory:", err);
    return NextResponse.json(
      { success: false, error: "Failed to deduct stock" },
      { status: 500 }
    );
  }
}