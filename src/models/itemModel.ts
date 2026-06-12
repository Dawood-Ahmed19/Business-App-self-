import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export interface Item {
  _id?: ObjectId | string;
  name: string;
  type: string;
  pipeType: string;
  guage: number | string;
  gote: number | string;
  size: number | string;
  weight: number | string;
  quantity: number | string;
  price: number | string;
  height?: number | string | null;
  index: number;
  date: string; // using ISO string format
}

// ✅ Get all items
export async function getItems() {
  const client = await clientPromise;
  const db = client.db("TahaMetals"); // 👈 your real DB
  return db.collection<Item>("inventory").find().toArray(); // 👈 your real collection
}

// ✅ Add new item
export async function addItem(item: Omit<Item, "_id">) {
  const client = await clientPromise;
  const db = client.db("TahaMetals");

  const newItem = {
    ...item,
    date: new Date().toISOString(),
  };

  const result = await db.collection<Item>("inventory").insertOne(newItem);
  return result;
}

// ✅ Delete item by ID
export async function deleteItem(id: string) {
  const client = await clientPromise;
  const db = client.db("TahaMetals");
  return db.collection<Item>("inventory").deleteOne({ _id: new ObjectId(id) });
}

// ✅ Update item
export async function updateItem(id: string, updates: Partial<Item>) {
  const client = await clientPromise;
  const db = client.db("TahaMetals");
  return db
    .collection<Item>("inventory")
    .updateOne({ _id: new ObjectId(id) }, { $set: updates });
}
