import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const client = await clientPromise;
  const db = client.db("MakkaMetals");
  const settings = await db.collection("settings").findOne();
  return NextResponse.json({ success: true, settings });
}

export async function POST(req: Request) {
  const { financialStartDay, financialEndDay } = await req.json();
  if (!financialStartDay || !financialEndDay) {
    return NextResponse.json({
      success: false,
      message: "Both start and end days are required",
    });
  }

  const client = await clientPromise;
  const db = client.db("MakkaMetals");
  await db.collection("settings").updateOne(
    {},
    {
      $set: {
        financialStartDay,
        financialEndDay,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}
