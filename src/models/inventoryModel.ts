import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export interface InventoryItem {
  _id?: string | ObjectId;
  name: string;
  type: string;
  pipeType?: string;
  guage?: string | number;
  gote?: string | number;
  size: string;
  weight: number;
  quantity: number;
  price: number;
  date: string;
  index?: number;
  height?: string | null;
}

// 🔹 Add or update inventory item
export async function addOrUpdateInventoryItem(
  item: Omit<InventoryItem, "_id" | "date" | "index">
) {
  const client = await clientPromise;
  const db = client.db("TahaMetals");
  const collection = db.collection<InventoryItem>("inventory");

  let {
    name,
    type,
    pipeType,
    guage,
    gote,
    size,
    weight,
    quantity,
    price,
    height,
  } = item;

  // Normalize
  type = String(type).trim().toLowerCase();
  pipeType = String(pipeType || "")
    .trim()
    .toLowerCase();
  guage = guage ? String(guage).trim().toLowerCase() : "";
  gote = gote ? String(gote).trim().toLowerCase() : "";
  size = String(size).trim().toLowerCase();
  weight = Number(weight);
  quantity = Number(quantity);
  price = Number(price);

  let itemName = name;
  let itemIndex: number | undefined;

  // Auto-generate Pipe Code
  if (type === "pipe") {
    const lastPipe = await collection
      .find({ type: "pipe" })
      .sort({ index: -1 })
      .limit(1)
      .toArray();
    const nextNumber =
      lastPipe.length > 0 && lastPipe[0].index !== undefined
        ? lastPipe[0].index + 1
        : 1;
    itemName = `p${String(nextNumber).padStart(3, "0")}`;
    itemIndex = nextNumber;
  }

  // Check if already exists
  const existingItem = await collection.findOne({
    name: itemName,
    type,
    pipeType,
    guage,
    gote,
    size,
    weight,
  });
  if (existingItem) {
    await collection.updateOne(
      { _id: existingItem._id },
      { $inc: { quantity }, $set: { date: new Date().toISOString() } }
    );
    return { updated: true, id: existingItem._id };
  }

  // Insert new item
  const result = await collection.insertOne({
    name: itemName,
    type,
    pipeType,
    guage,
    gote,
    size,
    weight,
    quantity,
    price,
    height: height || null,
    index: itemIndex,
    date: new Date().toISOString(),
  });

  return { inserted: true, id: result.insertedId };
}

// 🔹 Get all inventory items
export async function getInventoryItems() {
  const client = await clientPromise;
  const db = client.db("TahaMetals");
  return db.collection<InventoryItem>("inventory").find({}).toArray();
}
