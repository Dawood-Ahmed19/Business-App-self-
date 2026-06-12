import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: "Missing fields" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const users = db.collection("users");

    const user = await users.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json({
        success: true,
        message: "User already verified",
      });
    }

    const exp = new Date(user.verificationExpires).getTime();
    if (Date.now() > exp) {
      return NextResponse.json(
        { success: false, message: "Verification code expired" },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(code, user.verificationCode);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid verification code" },
        { status: 400 }
      );
    }

    await users.updateOne(
      { email },
      {
        $set: { isVerified: true },
        $unset: { verificationCode: "", verificationExpires: "" },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Account verified successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
