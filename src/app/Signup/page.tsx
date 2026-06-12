"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader/page";

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [verifyCode, setVerifyCode] = useState("");

  // ── handle account creation ──────────────────────────────────────────
  const handleSignup = async () => {
    if (loading) return;
    if (!email || !password) {
      setMessage("Email and password are required");
      setTimeout(() => setMessage(""), 2000);
      return;
    }
    if (role === "user" && !adminPassword) {
      setMessage("Admin password required to create user");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, adminPassword }),
      });
      const data = await res.json();
      setLoading(false);

      setMessage(data.message);

      if (data.success) {
        // if backend uses email‑verification, show code form instead of redirect
        if (data.message?.toLowerCase().includes("verification")) {
          setStep("verify");
        } else {
          setTimeout(() => router.push("/Login"), 1200);
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setMessage("Something went wrong");
      setTimeout(() => setMessage(""), 2000);
    }
  };

  // ── handle verification submit ───────────────────────────────────────
  const handleVerify = async () => {
    if (!verifyCode) return;
    try {
      setLoading(true);
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verifyCode }),
      });
      const data = await res.json();
      setLoading(false);
      setMessage(data.message);

      if (data.success) {
        setTimeout(() => router.push("/Login"), 1200);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setMessage("Verification failed");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[var(--color-dashboardBg)]">
        <Loader />
        <p className="mt-4 text-gray-400 font-medium">
          {step === "signup" ? "Creating account..." : "Verifying..."}
        </p>
      </div>
    );
  }

  // ── Step 2: Verification UI ──────────────────────────────────────────
  if (step === "verify") {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--color-dashboardBg)] text-white p-4">
        <div
          className="w-full max-w-md p-8 rounded-xl shadow-lg space-y-6"
          style={{ backgroundColor: "var(--color-BgColor)" }}
        >
          <h1 className="text-3xl font-bold text-center">Verify Account</h1>
          <p className="text-sm text-gray-400 text-center">
            Enter the 6‑digit code sent to {email}
          </p>
          <input
            type="text"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            placeholder="Verification Code"
            className="w-full p-3 rounded-md outline-none text-center text-white placeholder-gray-400"
            style={{
              backgroundColor: "var(--color-cardBg)",
              border: "1px solid var(--color-IconBg)",
            }}
          />
          {message && (
            <p className="text-center text-sm text-gray-300">{message}</p>
          )}
          <button
            onClick={handleVerify}
            className="w-full py-3 rounded-md font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: "var(--color-iconColor)" }}
          >
            Verify
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Signup UI ────────────────────────────────────────────────
  return (
    <div
      className="flex justify-center items-center h-screen p-4"
      style={{ backgroundColor: "var(--color-dashboardBg)" }}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-lg p-8 space-y-6"
        style={{ backgroundColor: "var(--color-BgColor)" }}
      >
        <h1 className="text-3xl font-bold text-center text-white">
          Create Account
        </h1>

        {/* Role Selector */}
        <div className="flex justify-center gap-8 my-4">
          <button
            onClick={() => setRole("user")}
            className={`px-5 py-2 rounded-md font-semibold ${
              role === "user"
                ? "bg-[var(--color-iconColor)] text-white"
                : "bg-[var(--color-cardBg)] text-gray-400"
            }`}
          >
            User
          </button>
          <button
            onClick={() => setRole("admin")}
            className={`px-5 py-2 rounded-md font-semibold ${
              role === "admin"
                ? "bg-[var(--color-iconColor)] text-white"
                : "bg-[var(--color-cardBg)] text-gray-400"
            }`}
          >
            Admin
          </button>
        </div>

        {role === "user" && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full p-3 rounded-md outline-none text-white placeholder-gray-400"
            style={{
              backgroundColor: "var(--color-cardBg)",
              border: "1px solid var(--color-IconBg)",
            }}
          />
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-3 rounded-md outline-none text-white placeholder-gray-400"
          style={{
            backgroundColor: "var(--color-cardBg)",
            border: "1px solid var(--color-IconBg)",
          }}
        />

        <div className="relative w-full">
          <input
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 rounded-md outline-none text-white placeholder-gray-400 pr-16"
            style={{
              backgroundColor: "var(--color-cardBg)",
              border: "1px solid var(--color-IconBg)",
            }}
          />
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white"
          >
            {showPwd ? "Hide" : "Show"}
          </button>
        </div>

        {role === "user" && (
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Enter admin password to create user"
            className="w-full p-3 rounded-md outline-none text-white placeholder-gray-400"
            style={{
              backgroundColor: "var(--color-cardBg)",
              border: "1px solid var(--color-IconBg)",
            }}
          />
        )}

        {message && (
          <p
            className={`text-center text-sm ${
              message.toLowerCase().includes("success")
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}

        <button
          onClick={handleSignup}
          className="w-full py-3 rounded-md font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: "var(--color-iconColor)" }}
        >
          Sign Up
        </button>

        <p
          onClick={() => router.push("/Login")}
          className="text-center text-gray-400 cursor-pointer hover:text-white"
        >
          Already have an account?{" "}
          <span className="text-[var(--color-iconColor)]">Login</span>
        </p>
      </div>
    </div>
  );
}
