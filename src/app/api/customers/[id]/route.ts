import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: Request, context: { params: { id: string } }) {
  try {
    // Await params in case it's a Promise (Next.js App Router)
    const { id } = await context.params;
    console.log("API: Looking for customer with _id:", id);

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const customersCol = db.collection("customers");

    let customer = null;
    try {
      customer = await customersCol.findOne({ _id: new ObjectId(id) });
    } catch (e) {
      customer = null;
    }

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, customer });
  } catch (err) {
    console.error("Error fetching customer:", err);
    return NextResponse.json(
      { success: false, customer: null },
      { status: 500 }
    );
  }
}
