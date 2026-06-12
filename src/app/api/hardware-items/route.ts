import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const items = await db.collection("hardware_items").find().toArray();
    return NextResponse.json({ success: true, items });
  } catch (err) {
    console.error("❌ Error fetching hardware items:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch hardware items" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      sizes = {},
      colors = [],
      pipeTypes = [],
      priceType = "unit",
      hasPipeTypes = true,
    } = body;

    const validPriceTypes = ["unit", "kg", "ft"];
    if (!validPriceTypes.includes(priceType)) {
      return NextResponse.json(
        { success: false, message: "Invalid price type." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    const normalizedSizes: any = hasPipeTypes
      ? {
          Round: sizes.Round || sizes.round || [],
          Square: sizes.Square || sizes.square || [],
        }
      : { general: sizes.general || [] };

    const db = await getDb();

    await db.collection("hardware_items").insertOne({
      name: name.trim(),
      sizes: normalizedSizes,
      colors,
      pipeTypes,
      priceType,
      hasPipeTypes,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Hardware item added successfully",
    });
  } catch (err) {
    console.error("❌ Error inserting hardware item:", err);
    return NextResponse.json(
      { success: false, message: "Failed to save hardware item" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      _id,
      name,
      sizes = {},
      colors = [],
      pipeTypes = [],
      priceType = "unit",
      hasPipeTypes = true,
    } = body;

    const validPriceTypes = ["unit", "kg", "ft"];
    if (!validPriceTypes.includes(priceType)) {
      return NextResponse.json(
        { success: false, message: "Invalid price type." },
        { status: 400 }
      );
    }

    if (!_id) {
      return NextResponse.json(
        { success: false, message: "Missing _id for update." },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required." },
        { status: 400 }
      );
    }

    const normalizedSizes: any = hasPipeTypes
      ? {
          Round: sizes.Round || sizes.round || [],
          Square: sizes.Square || sizes.square || [],
        }
      : { general: sizes.general || [] };

    const db = await getDb();
    const result = await db.collection("hardware_items").updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          name: name.trim(),
          sizes: normalizedSizes,
          colors,
          pipeTypes,
          priceType,
          hasPipeTypes,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: result.matchedCount > 0,
      message:
        result.modifiedCount > 0
          ? "Hardware item updated successfully."
          : result.matchedCount > 0
          ? "Item already up‑to‑date."
          : "Item not found.",
    });
  } catch (err: any) {
    console.error("❌ Error updating hardware item:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update hardware item: " + err.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing id" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db
      .collection("hardware_items")
      .deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: result.deletedCount > 0,
      message:
        result.deletedCount > 0
          ? "Hardware item deleted successfully."
          : "Item not found.",
    });
  } catch (err: any) {
    console.error("❌ Error deleting hardware item:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete hardware item: " + err.message,
      },
      { status: 500 }
    );
  }
}
