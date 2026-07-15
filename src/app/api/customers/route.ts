import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") || 1);
    const search = url.searchParams.get("search") || "";
    const limit = 10;
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const customersCol = db.collection("customers");
    const quotationsCol = db.collection("quotations");

    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const total = await customersCol.countDocuments(query);
    const customers = await customersCol
      .find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // For each customer, calculate their balance from quotations
    const customersWithBalance = await Promise.all(
      customers.map(async (cust) => {
        // Find all quotations for this customer (excluding returned ones)
        const invoices = await quotationsCol
          .find({ customerName: cust.name, status: { $ne: "returned" } })
          .toArray();
        // Sum all balances (grandTotal - payments)
        const balance = invoices.reduce((sum, inv) => {
          const paid =
            (inv.payments || []).reduce(
              (s, p) => s + (typeof p.amount === "number" ? p.amount : 0),
              0
            ) || 0;
          const invoiceBalance =
            (typeof inv.balance === "number"
              ? inv.balance
              : (inv.grandTotal || 0) - paid) || 0;
          return sum + invoiceBalance;
        }, 0);
        return { ...cust, balance: Math.round(balance) };
      })
    );

    return NextResponse.json({
      success: true,
      customers: customersWithBalance,
      total,
    });
  } catch (err) {
    console.error("Error fetching customers:", err);
    return NextResponse.json(
      { success: false, customers: [], total: 0 },
      { status: 500 }
    );
  }
}