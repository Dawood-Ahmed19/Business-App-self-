import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "replace_this_secret";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    // --- Find user --------------------------------------------------------
    const db = await getDb();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // --- Check password ---------------------------------------------------
    const matches = await bcrypt.compare(password, user.passwordHash || "");
    if (!matches) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // --- Check verification ------------------------------------------------
    if (user.isVerified === false) {
      return NextResponse.json(
        { success: false, message: "Please verify your email first." },
        { status: 403 }
      );
    }

    // --- Create JWT -------------------------------------------------------
    const payload = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

    // --- Construct response ------------------------------------------------
    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user._id.toString(),
        name: user.name || "Unnamed User",
        email: user.email,
        role: user.role,
      },
    });

    const isProd = process.env.NODE_ENV === "production";

    response.cookies.set("authToken", token, {
      httpOnly: true,
      secure: isProd ? true : false,
      sameSite: "lax",
      path: "/",
    });

    // --- Debug logging ----------------------------------------------------
    console.log("✅ Login success for:", email);
    console.log("✅ Cookie set:", response.cookies.getAll());

    return response;
  } catch (err: any) {
    console.error("❌ Login error:", err);
    return NextResponse.json(
      { success: false, message: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
