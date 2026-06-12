import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import bcrypt from "bcrypt";
import { sendVerificationEmail } from "@/lib/sendMail";

export async function POST(req: Request) {
  try {
    const { name, email, password, role, adminPassword } = await req.json();

    // ── 1️⃣ Validate input ─────────────────────────────────────────────
    if (!email || !password || !role) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const users = db.collection("users");

    // ── 2️⃣ Handle admin creation ─────────────────────────────────────
    if (role === "admin") {
      const existingAdmin = await users.findOne({ role: "admin" });
      if (existingAdmin) {
        return NextResponse.json(
          { success: false, message: "Admin account already exists." },
          { status: 403 }
        );
      }
    }

    // ── 3️⃣ Handle user creation (admin-password gate) ─────────────────
    if (role === "user") {
      const admin = await users.findOne({ role: "admin" });
      if (!admin) {
        return NextResponse.json(
          {
            success: false,
            message: "No admin found. Please create an admin first.",
          },
          { status: 400 }
        );
      }

      if (!adminPassword) {
        return NextResponse.json(
          {
            success: false,
            message: "Admin password required to create user.",
          },
          { status: 401 }
        );
      }

      const isValidAdmin = await bcrypt.compare(
        adminPassword,
        admin.passwordHash
      );
      if (!isValidAdmin) {
        return NextResponse.json(
          { success: false, message: "Invalid admin password." },
          { status: 401 }
        );
      }
    }

    // ── 4️⃣ Check for existing user ───────────────────────────────────
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User already exists." },
        { status: 409 }
      );
    }

    // ── 5️⃣ Hash password ─────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 10);

    // ── 6️⃣ Generate verification code ─────────────────────────────────
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationHash = await bcrypt.hash(verificationCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // ── 7️⃣ Create user in DB ─────────────────────────────────────────
    await users.insertOne({
      name: name || "",
      email,
      passwordHash,
      role,
      isVerified: false,
      verificationCode: verificationHash,
      verificationExpires: expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // ── 8️⃣ Send verification email ───────────────────────────────────
    try {
      console.log(`📧 Sending verification email to ${email}...`);
      await sendVerificationEmail(email, verificationCode);
      console.log(`✅ Verification email sent to ${email}`);
    } catch (err: any) {
      console.error(`❌ Failed to send verification email:`, err);
      // We still return success, but include a note
      return NextResponse.json({
        success: true,
        verificationRequired: true,
        message:
          "Account created but failed to send email. Please contact admin to verify manually.",
      });
    }

    // ── 9️⃣ Respond success ───────────────────────────────────────────
    return NextResponse.json({
      success: true,
      verificationRequired: true,
      message:
        "Account created successfully. Please check your email for the 6-digit verification code.",
    });
  } catch (err: any) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { success: false, message: "Signup failed: " + err.message },
      { status: 500 }
    );
  }
}
