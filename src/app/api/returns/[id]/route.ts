import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const client = await clientPromise;
    const db = client.db("MakkaMetals");

    const returnsCollection = db.collection("returns");
    console.log("Looking for returnId:", id);

    const returnRecord = await returnsCollection.findOne({ returnId: id });

    if (!returnRecord) {
      return NextResponse.json(
        { success: false, message: `Return not found for id: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, returnRecord });
  } catch (err) {
    console.error("❌ Error fetching return record:", err);
    return NextResponse.json(
      { success: false, message: "Server error fetching return record" },
      { status: 500 }
    );
  }
}
