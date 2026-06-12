import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const col = db.collection("inventory");

    const rawTypes = await col.distinct("type");
    const rawSizes = await col.distinct("size");
    const rawGuages = await col.distinct("guage");

    const clean = (arr: any[]) =>
      Array.from(
        new Set(
          arr
            .filter((v) => v !== null && v !== undefined && v !== "")
            .map((v) => String(v).trim())
        )
      );

    const types = clean(rawTypes);
    const sizes = clean(rawSizes);
    const guages = clean(rawGuages);

    return NextResponse.json({
      success: true,
      types: ["All", ...types],
      sizes: ["All", ...sizes],
      guages: ["All", ...guages],
    });
  } catch (e) {
    console.error("❌ Error reading inventory filters:", e);
    return NextResponse.json(
      { success: false, error: "Failed to load filter options" },
      { status: 500 }
    );
  }
}
