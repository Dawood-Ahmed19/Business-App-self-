import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const monthKey = searchParams.get("month"); // e.g. "2025-10"
    if (!monthKey)
      return NextResponse.json({
        success: false,
        message: "Month is required",
        total: 0,
      });

    const db = await getDb();

    let matchQuery: any;
    if (/^\d{4}-\d{2}$/.test(monthKey)) {
      // new format "YYYY-MM"
      matchQuery = { month: monthKey };
    } else {
      // fall back for old records ("October", etc.)
      const lookup: Record<string, string> = {
        January: "01",
        February: "02",
        March: "03",
        April: "04",
        May: "05",
        June: "06",
        July: "07",
        August: "08",
        September: "09",
        October: "10",
        November: "11",
        December: "12",
      };
      const thisYear = new Date().getFullYear();
      const num = lookup[monthKey] ?? "00";
      matchQuery = { month: `${thisYear}-${num}` };
    }

    const agg = await db
      .collection("salaries")
      .aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $add: [
                  { $toDouble: { $ifNull: ["$paidAmount", 0] } },
                  { $toDouble: { $ifNull: ["$advancePaid", 0] } },
                ],
              },
            },
          },
        },
      ])
      .toArray();

    const total = agg.length > 0 ? agg[0].total : 0;

    return NextResponse.json({ success: true, total });
  } catch (err: any) {
    console.error("GET /api/salaries/total error:", err);
    return NextResponse.json(
      { success: false, total: 0, message: err.message },
      { status: 500 }
    );
  }
}
