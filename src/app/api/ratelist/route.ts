import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json();
    if (!Array.isArray(rows)) {
      return NextResponse.json(
        { success: false, message: "Invalid data array" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const rateList = db.collection("ratelist");

    const normalize = (val: any) => {
      if (val === undefined || val === null) return "";
      return String(val).toLowerCase();
    };

    const ops = rows.map((row: any) => {
      const t = normalize(row.type);

      const filter =
        t === "jali" || t === "tanka barfi jali"
          ? {
              type: t,
              number: normalize(row.number),
              size: normalize(row.size),
              guage: normalize(row.guage),
            }
          : t === "hardware"
          ? {
              type: t,
              name: normalize(row.name),
              size: normalize(row.size),
              guage: normalize(row.guage),
            }
          : {
              type: t,
              size: normalize(row.size),
              guage: normalize(row.guage),
            };

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              type: t,
              name: row.name ?? "",
              number: normalize(row.number),
              size: normalize(row.size),
              guage: normalize(row.guage),
              color: row.color ?? "",
              ratePerFt: row.ratePerFt ?? "",
              ratePerUnit: row.ratePerUnit ?? "",
              ratePerKg: row.ratePerKg ?? "",
              pricePerFt: row.pricePerFt ?? 0,
              pricePerUnit: row.pricePerUnit ?? 0,
              updatedAt: new Date(),
            },
          },
          upsert: true,
        },
      };
    });

    const result = await rateList.bulkWrite(ops);

    return NextResponse.json({
      success: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
    });
  } catch (err) {
    console.error("Error saving rate list:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const rateList = db.collection("ratelist");

    const list = await rateList.find({}).toArray();

    return NextResponse.json({
      success: true,
      items: list,
    });
  } catch (err) {
    console.error("Error loading rate list:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
