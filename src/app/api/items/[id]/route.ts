import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(req: Request, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid item ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const collection = db.collection("inventory");

    const item = await collection.findOne({ _id: new ObjectId(id) });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, item }, { status: 200 });
  } catch (err) {
    console.error("Error fetching item:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid item ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const collection = db.collection("inventory");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }
  } catch (err) {
    console.error("Error deleting item:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete item" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid item ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Convert numeric fields
    const numericFields = [
      "pricePerFt",
      "pricePerUnit",
      "pricePerKg",
      "ft",
      "weight",
      "quantity",
      "guage",
    ];
    for (const key of numericFields) {
      if (body[key] !== undefined && body[key] !== null && body[key] !== "") {
        const num = Number(body[key]);
        body[key] = isNaN(num) ? body[key] : num;
      }
    }

    // --- BATCH LOGIC START ---
    if (Array.isArray(body.batches)) {
      // Recalculate totals from batches
      const totalQty = body.batches.reduce(
        (sum, b) => sum + Number(b.quantity || 0),
        0
      );
      const totalWeight = body.batches.reduce(
        (sum, b) => sum + Number(b.weight || 0),
        0
      );
      const totalLengthFt = body.batches.reduce(
        (sum, b) => sum + Number(b.lengthFt || 0),
        0
      );

      body.quantity = totalQty;
      body.weight = totalWeight;
      body.lengthFt = totalLengthFt;
    }
    // --- BATCH LOGIC END ---

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const collection = db.collection("inventory");

    // perform update
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: body }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    const updatedDoc = await collection.findOne({ _id: new ObjectId(id) });

    return NextResponse.json(
      { success: true, item: updatedDoc },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating item:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
