import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const adminCount = await db
      .collection("users")
      .countDocuments({ role: "admin" });

    return NextResponse.json({
      success: true,
      adminExists: adminCount > 0,
    });
  } catch (err: any) {
    console.error("❌ Error checking admin count:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
