import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const {
      month,
      year,
      totalSales,
      totalProfit,
      monthlyExpenses,
      grandTotalExpenses,
      netMonthlyProfit,
    } = await req.json();

    if (!month || !year) {
      return NextResponse.json(
        { success: false, message: "Month and year are required." },
        { status: 400 }
      );
    }

    const key = `${year}-${String(month).padStart(2, "0")}`;

    const db = await getDb();
    const reportsCollection = db.collection("reportsSummary");

    const summaryData = {
      month: key,
      year,
      totalSales: Number(totalSales) || 0,
      totalProfit: Number(totalProfit) || 0,
      monthlyExpenses: Number(monthlyExpenses) || 0,
      grandTotalExpenses: Number(grandTotalExpenses) || 0,
      netMonthlyProfit: Number(netMonthlyProfit) || 0,
      updatedAt: new Date(),
    };

    // if exists → update; else → insert
    const res = await reportsCollection.updateOne(
      { month: key },
      { $set: summaryData },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Report summary saved successfully.",
      result: res,
    });
  } catch (err: any) {
    console.error("❌ Error saving monthly report summary:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
