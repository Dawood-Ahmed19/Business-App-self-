import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface Payment {
    amount: number;
    date: string;
}

interface Quotation {
    _id?: string;
    quotationId: string;
    items: any[];
    discount: number;
    total: number;
    grandTotal: number;
    payments: Payment[];
    amount: number;
    date: string;
    totalReceived?: number;
    balance?: number;
    quotationTotalProfit?: number;
    status?: string;
    loading?: number;
    carriage?: number;
    bendingLabour?: number;
    customerName?: string;
    createdBy?: string;
}

export async function POST(req: Request, context: { params: { id: string } }) {
    try {
        const { id } = context.params;
        const { amount } = await req.json();

        if (!amount || amount <= 0) {
            return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("MakkaMetals");
        const customersCol = db.collection("customers");
        const quotationsCol = db.collection<Quotation>("quotations");

        const customer = await customersCol.findOne({ _id: new ObjectId(id) });
        if (!customer) {
            return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
        }

        let remaining = amount;
        const unpaidInvoices = await quotationsCol
            .find({ customerName: customer.name, balance: { $gt: 0 } })
            .sort({ date: 1 }) // oldest first
            .toArray();

        for (const inv of unpaidInvoices) {
            if (remaining <= 0) break;
            const pay = Math.min(inv.balance, remaining);
            await quotationsCol.updateOne(
                { _id: inv._id },
                {
                    $push: {
                        payments: { amount: pay, date: new Date().toISOString() }
                    },
                    $inc: { received: pay, balance: -pay }
                }
            );
            remaining -= pay;
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Error receiving payment:", err);
        return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
    }
}