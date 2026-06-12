import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// interface InventoryItem {
//   _id?: string | ObjectId;
//   name: string;
//   type: string;
//   pipeType?: string;
//   guage?: string | number;
//   gote?: string | number;
//   size: string;
//   weight: number;
//   quantity: number;
//   lengthFt?: number;
//   pricePerKg?: number | null;
//   pricePerUnit?: number | null;
//   date: string;
//   index?: number;
//   height?: string | null;
//   color?: string;
//   batches: any[];
// }

interface InventoryItem {
  _id?: string | ObjectId;
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
  pricePerFt?: number | null;
  date: string;
  index?: number;
  height?: string | null;
  color?: string;
  batches: any[];
}

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     console.log("Incoming body →", body);

//     let {
//       name,
//       type,
//       pipeType,
//       guage,
//       gote,
//       size,
//       weight,
//       quantity,
//       lengthFt,
//       pricePerKg,
//       pricePerUnit,
//       height,
//       color,
//     } = body;

//     let pricePerFt = body.pricePerFt ? Number(body.pricePerFt) : null;

//     // 🔹 Normalize
//     type = String(type || "")
//       .trim()
//       .toLowerCase();
//     pipeType = String(pipeType || "")
//       .trim()
//       .toLowerCase();
//     guage = guage ? String(guage).trim().toLowerCase() : "";
//     gote = gote ? String(gote).trim().toLowerCase() : "";
//     size = String(size || "")
//       .trim()
//       .toLowerCase();

//     weight = Number(weight) || 0;
//     quantity = Number(quantity) || 0;
//     lengthFt = Number(lengthFt) || 0;
//     pricePerKg = pricePerKg ? Number(pricePerKg) : null;
//     pricePerUnit = pricePerUnit ? Number(pricePerUnit) : null;

//     // 🔹 If price per Kg is given, compute unit price
//     if (pricePerKg && quantity > 0 && weight > 0) {
//       const unitWeight = weight / quantity;
//       pricePerUnit = Number((unitWeight * pricePerKg).toFixed(2));
//     }

//     const client = await clientPromise;
//     const db = client.db("MakkaMetals");
//     const collection = db.collection<InventoryItem>("inventory");

//     // 🔹 Auto‑generate item name/index
//     let itemName = name?.trim() || "";
//     let itemIndex: number | undefined;

//     if (type === "pipe") {
//       const lastPipe = await collection
//         .find({ type: "pipe" })
//         .sort({ index: -1 })
//         .limit(1)
//         .toArray();
//       const nextNumber =
//         lastPipe.length && lastPipe[0].index !== undefined
//           ? lastPipe[0].index + 1
//           : 1;
//       itemName = `p${String(nextNumber).padStart(3, "0")}`;
//       itemIndex = nextNumber;
//     }

//     if (type === "pillar" || type === "pillars") {
//       const lastPillar = await collection
//         .find({ type: { $in: ["pillar", "pillars"] } })
//         .sort({ index: -1 })
//         .limit(1)
//         .toArray();
//       const nextNumber =
//         lastPillar.length && lastPillar[0].index !== undefined
//           ? lastPillar[0].index + 1
//           : 1;
//       itemName = `pl${String(nextNumber).padStart(3, "0")}`;
//       itemIndex = nextNumber;
//     }

//     if (!itemName) itemName = "unnamed";

//     console.log("✅ Final type:", type, "→ Generated name:", itemName);

//     // 🔹 Insert record
//     const newItem = await collection.insertOne({
//       name: itemName,
//       type,
//       pipeType,
//       guage,
//       gote,
//       size,
//       weight,
//       quantity,
//       lengthFt,
//       pricePerKg,
//       pricePerUnit,
//       height: height || null,
//       color: color || "",
//       index: itemIndex,
//       date: new Date().toISOString(),
//       batches: [
//         {
//           quantity,
//           weight,
//           lengthFt,
//           pricePerUnit,
//           pricePerKg,
//           pricePerFt,
//           date: new Date().toISOString(),
//         },
//       ],
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Item created ✅",
//       item: {
//         _id: newItem.insertedId.toString(),
//         name: itemName,
//         type,
//         pipeType,
//         guage,
//         gote,
//         size,
//         weight,
//         quantity,
//         lengthFt,
//         pricePerKg,
//         pricePerUnit,
//         height: height || null,
//         color: color || "",
//         index: itemIndex,
//         date: new Date().toISOString(),
//       },
//     });
//   } catch (err) {
//     console.error("❌ Error in inventory POST:", err);
//     return NextResponse.json(
//       { success: false, error: "Failed to add item ❌" },
//       { status: 500 }
//     );
//   }
// }

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Incoming body →", body);

    let {
      name,
      type,
      pipeType,
      guage,
      gote,
      size,
      weight,
      quantity,
      lengthFt,
      pricePerKg,
      pricePerUnit,
      height,
      color,
    } = body;

    let pricePerFt = body.pricePerFt ? Number(body.pricePerFt) : null;

    // 🔹 Normalize
    type = String(type || "").trim().toLowerCase();
    pipeType = String(pipeType || "").trim().toLowerCase();
    guage = guage ? String(guage).trim().toLowerCase() : "";
    gote = gote ? String(gote).trim().toLowerCase() : "";
    size = String(size || "").trim().toLowerCase();

    weight = Number(weight) || 0;
    quantity = Number(quantity) || 0;
    lengthFt = Number(lengthFt) || 0;
    pricePerKg = pricePerKg ? Number(pricePerKg) : null;
    pricePerUnit = pricePerUnit ? Number(pricePerUnit) : null;

    // 🔹 If price per Kg is given, compute unit price
    if (pricePerKg && quantity > 0 && weight > 0) {
      const unitWeight = weight / quantity;
      pricePerUnit = Number((unitWeight * pricePerKg).toFixed(2));
    }

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const collection = db.collection<InventoryItem>("inventory");

    // 🔹 Try to find an existing matching item
    const existingItem = await collection.findOne({
      type,
      pipeType,
      size,
      guage,
      gote,
    });

    // 🟣 If item already exists → append new batch and update prices
    if (existingItem) {
      console.log("Updating existing item:", existingItem.name);

      const newBatch = {
        quantity,
        weight,
        lengthFt,
        pricePerUnit,
        pricePerKg,
        pricePerFt,
        date: new Date().toISOString(),
      };

      const updatedBatches = [...(existingItem.batches || []), newBatch];

      // Compute total remaining stock
      const totalQty = updatedBatches.reduce((sum, b) => sum + (b.quantity || 0), 0);
      const totalFt = updatedBatches.reduce((sum, b) => sum + (b.lengthFt || 0), 0);
      const totalKg = updatedBatches.reduce((sum, b) => sum + (b.weight || 0), 0);

      // Find the first non-empty batch (the "active" one)
      const activeBatch = updatedBatches.find(
        (b) =>
          (b.quantity && b.quantity > 0) ||
          (b.lengthFt && b.lengthFt > 0) ||
          (b.weight && b.weight > 0)
      );

      const activePriceFt = activeBatch?.pricePerFt ?? existingItem.pricePerFt ?? null;
      const activePriceKg = activeBatch?.pricePerKg ?? existingItem.pricePerKg ?? null;
      const activePriceUnit = activeBatch?.pricePerUnit ?? existingItem.pricePerUnit ?? null;

      // const updatedItem = await collection.findOneAndUpdate(
      //   { _id: existingItem._id },
      //   {
      //     $set: {
      //       batches: updatedBatches,
      //       quantity: totalQty,
      //       lengthFt: totalFt,
      //       weight: totalKg,
      //       pricePerFt: activePriceFt,
      //       pricePerKg: activePriceKg,
      //       pricePerUnit: activePriceUnit,
      //       updatedAt: new Date().toISOString(),
      //     },
      //   },
      //   { returnDocument: "after" }
      // );

      // return NextResponse.json({
      //   success: true,
      //   message: "Batch added and item updated ✅",
      //   item: updatedItem.value,
      // });

      const updateResult = await collection.findOneAndUpdate(
        { _id: existingItem._id },
        {
          $set: {
            batches: updatedBatches,
            quantity: totalQty,
            lengthFt: totalFt,
            weight: totalKg,
            pricePerFt: activePriceFt,
            pricePerKg: activePriceKg,
            pricePerUnit: activePriceUnit,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" as any } // ensure correct runtime behavior
      );

      // The driver returns { value, ok, lastErrorObject }
      const updatedItem = (updateResult as any)?.value ?? updateResult;

      return NextResponse.json({
        success: true,
        message: "Batch added and item updated ✅",
        item: updatedItem,
      });
    }

    // 🟢 If no existing item → create new entry
    let itemName = name?.trim() || "";
    let itemIndex: number | undefined;

    if (type === "pipe") {
      const lastPipe = await collection
        .find({ type: "pipe" })
        .sort({ index: -1 })
        .limit(1)
        .toArray();
      const nextNumber =
        lastPipe.length && lastPipe[0].index !== undefined
          ? lastPipe[0].index + 1
          : 1;
      itemName = `p${String(nextNumber).padStart(3, "0")}`;
      itemIndex = nextNumber;
    }

    if (type === "pillar" || type === "pillars") {
      const lastPillar = await collection
        .find({ type: { $in: ["pillar", "pillars"] } })
        .sort({ index: -1 })
        .limit(1)
        .toArray();
      const nextNumber =
        lastPillar.length && lastPillar[0].index !== undefined
          ? lastPillar[0].index + 1
          : 1;
      itemName = `pl${String(nextNumber).padStart(3, "0")}`;
      itemIndex = nextNumber;
    }

    if (!itemName) itemName = "unnamed";

    console.log("✅ Final type:", type, "→ Generated name:", itemName);

    // 🔹 Insert new record
    const newItem = await collection.insertOne({
      name: itemName,
      type,
      pipeType,
      guage,
      gote,
      size,
      weight,
      quantity,
      lengthFt,
      pricePerKg,
      pricePerUnit,
      pricePerFt,
      height: height || null,
      color: color || "",
      index: itemIndex,
      date: new Date().toISOString(),
      batches: [
        {
          quantity,
          weight,
          lengthFt,
          pricePerUnit,
          pricePerKg,
          pricePerFt,
          date: new Date().toISOString(),
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Item created ✅",
      item: {
        _id: newItem.insertedId.toString(),
        name: itemName,
        type,
        pipeType,
        guage,
        gote,
        size,
        weight,
        quantity,
        lengthFt,
        pricePerKg,
        pricePerUnit,
        pricePerFt,
        height: height || null,
        color: color || "",
        index: itemIndex,
        date: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("❌ Error in inventory POST:", err);
    return NextResponse.json(
      { success: false, error: "Failed to add item ❌" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const collection = db.collection<InventoryItem>("inventory");

    // 🔹 Optional search filter
    let filter: any = {};
    if (search && search.trim()) {
      filter = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { type: { $regex: search, $options: "i" } },
          { size: { $regex: search, $options: "i" } },
          { gote: { $regex: search, $options: "i" } },
          { guage: { $regex: search, $options: "i" } },
          {
            $expr: {
              $regexMatch: {
                input: {
                  $concat: ["$type", " ", "$size", " ", "$gote", " ", "$guage"],
                },
                regex: search,
                options: "i",
              },
            },
          },
        ],
      };
    }

    const items = await collection.find(filter).toArray();

    // 🔹 Format safely for client — expose ft for pipes
    const safeItems = items.map((item) => {
      const availableFt =
        item.type === "pipe" ? Number(item.lengthFt ?? item.quantity ?? 0) : 0;

      return {
        ...item,
        _id: item._id?.toString(),
        ft: item.type === "pipe" ? availableFt : null,
      };
    });

    return NextResponse.json({ success: true, items: safeItems });
  } catch (err) {
    console.error("❌ Error fetching inventory:", err);
    return NextResponse.json({ success: false, items: [] }, { status: 500 });
  }
}
