import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

interface ExpenseEntry {
  date: string;
  description: string;
  amount: number;
}

interface ExpenseDoc {
  month: string;
  path?: string;
  entries?: ExpenseEntry[];
  createdAt?: Date;
  updatedAt?: Date;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      employeeId,
      month,
      year,
      totalSalary,
      paidAmount = 0,
      balanceRemaining = totalSalary,
      fullyPaid = false,
      advancePaid = 0,
    } = body;

    const db = await getDb();

    let monthKey: string;
    const monthStr = String(month);

    if (/^\d{4}-\d{2}$/.test(monthStr)) {
      monthKey = monthStr;
    } else if (typeof month === "number" || /^\d+$/.test(monthStr)) {
      monthKey = `${year}-${String(Number(month)).padStart(2, "0")}`;
    } else {
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
      monthKey = `${year}-${lookup[monthStr] ?? "00"}`;
    }

    // ─── Compute new totals (additive if record exists) ───────
    const match = {
      employeeId: new ObjectId(employeeId),
      month: monthKey,
      year: Number(year),
    };

    const existing = await db.collection("salaries").findOne(match);

    const prevPaid = Number(existing?.paidAmount || 0);
    const prevAdvance = Number(existing?.advancePaid || 0);
    const prevTotalSalary = Number(existing?.totalSalary || totalSalary);

    const newPaidAmount = prevPaid + Number(paidAmount);
    const newAdvancePaid = prevAdvance + Number(advancePaid);
    const newBalanceRemaining = Math.max(
      0,
      prevTotalSalary - newPaidAmount - newAdvancePaid
    );
    const isFullyPaid = newBalanceRemaining <= 0;

    // ─── Upsert salary record ─────────────────────────────────
    const result = await db.collection("salaries").updateOne(
      match,
      {
        $set: {
          employeeId: new ObjectId(employeeId),
          month: monthKey,
          year: Number(year),
          totalSalary: prevTotalSalary,
          paidAmount: newPaidAmount,
          advancePaid: newAdvancePaid,
          balanceRemaining: newBalanceRemaining,
          fullyPaid: isFullyPaid,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    // ─── Log an expense entry for this payout ─────────────────
    try {
      const totalPaidOut = Number(paidAmount) + Number(advancePaid);
      if (totalPaidOut > 0) {
        const expenses = db.collection<ExpenseDoc>("expenses");

        await expenses.updateOne(
          { month: monthKey },
          {
            $setOnInsert: {
              createdAt: new Date(),
              path: `expenses/${monthKey}`,
              entries: [],
            },
            $set: { updatedAt: new Date() },
            $push: {
              entries: {
                date: new Date().toISOString().split("T")[0],
                description:
                  Number(advancePaid) > 0
                    ? "Employee Salary Advance"
                    : "Employee Salaries",
                amount: totalPaidOut,
              },
            },
          },
          { upsert: true }
        );
      }
    } catch (err) {
      console.error("Failed to append salary info to expenses:", err);
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("POST /api/salaries error:", error);
    return NextResponse.json(
      { error: "Failed to create or update salary record" },
      { status: 500 }
    );
  }
}

// ─── UPDATE PAYMENT ────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, payAmount } = body;
    const db = await getDb();

    const record = await db
      .collection("salaries")
      .findOne({ _id: new ObjectId(id) });
    if (!record)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const newPaid = Number(record.paidAmount || 0) + Number(payAmount || 0);
    const newBalance = Number(record.totalSalary || 0) - newPaid;

    await db.collection("salaries").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          paidAmount: newPaid,
          balanceRemaining: newBalance,
          fullyPaid: newBalance <= 0,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update salary" },
      { status: 500 }
    );
  }
}

// ─── FETCH SALARIES ────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);

    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const match: any = {};
    if (month) match.month = month;
    if (year) match.year = Number(year);

    const salaries = await db
      .collection("salaries")
      .aggregate([
        { $match: match },
        {
          $lookup: {
            from: "employees",
            localField: "employeeId",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: "$employee" },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    return NextResponse.json(salaries);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch salaries" },
      { status: 500 }
    );
  }
}
