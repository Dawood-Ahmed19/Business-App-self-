import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db("MakkaMetals");
        const quotationsCol = db.collection("quotations");

        const invoices = await quotationsCol
            .find({ balance: { $gt: 0 } })
            .sort({ date: -1 })
            .project({
                quotationId: 1,
                customerName: 1,
                date: 1,
                grandTotal: 1,
                balance: 1,
                quotationTotalProfit: 1,
            })
            .toArray();

        return NextResponse.json({ success: true, invoices });
    } catch (err) {
        console.error("❌ Error fetching pending invoices:", err);
        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}