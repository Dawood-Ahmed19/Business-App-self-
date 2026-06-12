import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { mainProfit, halfProfit, primeProfit } = await req.json();

    const main = parseFloat(mainProfit);
    const half = parseFloat(halfProfit);
    const prime = parseFloat(primeProfit);

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const inventory = db.collection("inventory");
    const rateList = db.collection("ratelist");

    const pipes = await inventory
      .find({
        type: { $regex: /^pipe$/i },
        pricePerFt: { $exists: true },
      })
      .toArray();

    let updatedCount = 0;

    for (const p of pipes) {
      const baseRate = parseFloat(p.pricePerFt);
      if (isNaN(baseRate)) continue;

      const rawSize = String(p.size || "")
        .toLowerCase()
        .replace(/["”“]/g, "")
        .trim();

      const isSmallPipe =
        rawSize.includes("1/2x1/2") ||
        rawSize.includes("1/2 x 1/2") ||
        rawSize.includes("½x½") ||
        rawSize.includes("½ x ½") ||
        rawSize.includes("3/4x3/8") ||
        rawSize.includes("3/4 x 3/8") ||
        rawSize.includes("¾x⅜") ||
        rawSize.includes("¾ x ⅜");

      const isPrime =
        rawSize.includes("1/2prime") ||
        rawSize.includes("1/2 prime") ||
        rawSize.includes("½prime") ||
        rawSize.includes("½ prime");

      let profitToApply: number | undefined;

      if (isSmallPipe && !isNaN(half)) profitToApply = half;
      else if (isPrime && !isNaN(prime)) profitToApply = prime;
      else if (!isSmallPipe && !isPrime && !isNaN(main)) profitToApply = main;

      if (profitToApply === undefined) continue;

      const newRate = Number((baseRate * (1 + profitToApply / 100)).toFixed(2));

      await rateList.updateOne(
        { type: p.type, size: p.size, guage: p.guage },
        {
          $set: {
            ratePerFt: newRate,
            name: p.name,
            type: p.type,
            size: p.size,
            guage: p.guage,
          },
        },
        { upsert: true }
      );

      updatedCount++;
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (err) {
    console.error("❌ Error updating pipe rates:", err);
    return NextResponse.json(
      { success: false, message: "Server Error while updating pipe rates" },
      { status: 500 }
    );
  }
}
