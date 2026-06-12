import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: Request, context: { params: { id: string } }) {
  try {
    // Await params in case it's a Promise (Next.js App Router)
    const { id } = await context.params;

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const customersCol = db.collection("customers");
    const quotationsCol = db.collection("quotations");

    const customer = await customersCol.findOne({ _id: new ObjectId(id) });
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    const invoices = await quotationsCol
      .find({ customerName: customer.name })
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json({ success: true, invoices });
  } catch (err) {
    console.error("Error fetching invoices for customer:", err);
    return NextResponse.json({ success: false, invoices: [] }, { status: 500 });
  }
}
