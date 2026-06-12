import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const quotationsCol = db.collection("quotations");

    const quotations = await quotationsCol.find({}).toArray();

    const stats: Record<string, any> = {};
    const loadingPerMonth: Record<string, number> = {};

    for (const q of quotations) {
      // Assume q.date is a Date or ISO string
      const date = q.date ? new Date(q.date) : null;
      let monthKey = "Unknown";
      if (date && !isNaN(date.getTime())) {
        // Format: YYYY-MM
        monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
      }
      const loading = Number(q.loading) || 0;
      loadingPerMonth[monthKey] = (loadingPerMonth[monthKey] || 0) + loading;

      for (const item of q.items || []) {
        const key = `${item.originalName}|${item.size}|${item.guage}|${item.type}`;
        if (!stats[key]) {
          stats[key] = {
            originalName: item.originalName,
            item: item.item,
            size: item.size,
            guage: item.guage,
            type: item.type,
            totalQty: 0,
            totalFt: 0,
            totalWeight: 0,
          };
        }
        stats[key].totalQty += Number(item.qty) || 0;
        stats[key].totalFt += Number(item.ft) || 0;
        stats[key].totalWeight += Number(item.weight) || 0;
      }
    }

    return NextResponse.json({
      success: true,
      stats: Object.values(stats),
      loadingPerMonth,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, stats: [], loadingPerMonth: {} },
      { status: 500 }
    );
  }
}
