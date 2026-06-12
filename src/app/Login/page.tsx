"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader/page";

export default function Login() {
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  const showTempError = (setter: (msg: string) => void, message: string) => {
    setter(message);
    setTimeout(() => setter(""), 1800);
  };

  const handleLogin = async () => {
    if (loading) return;
    setEmailError("");
    setUsernameError("");
    setPasswordError("");

    let hasError = false;

    if (!role) {
      showTempError(setEmailError, "Please select your role first.");
      return;
    }
    if (role === "user" && username.trim() === "") {
      showTempError(setUsernameError, "Please enter your name.");
      hasError = true;
    }
    if (email.trim() === "") {
      showTempError(setEmailError, "Please enter your email.");
      hasError = true;
    }
    if (password.trim() === "") {
      showTempError(setPasswordError, "Please enter your password.");
      hasError = true;
    }
    if (hasError) return;

    try {
      setLoading(true);

      // 🚀 simplified login fetch
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), // no role sent
        credentials: "include", // Required for cookies!
      });

      const data = await res.json();
      setLoading(false);

      if (!data.success) {
        showTempError(setPasswordError, data.message || "Login failed.");
        return;
      }

      sessionStorage.clear();
      sessionStorage.setItem("username", data.user.name || username);
      sessionStorage.setItem("email", data.user.email || email);
      sessionStorage.setItem("role", data.user.role); // For UI only (sidebar)

      router.push("/Dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
      showTempError(setPasswordError, "Something went wrong.");
    }
  };

  // --- Loading View ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[var(--color-dashboardBg)] text-white">
        <Loader />
        <p className="mt-4 text-gray-300 font-medium">Logging in...</p>
      </div>
    );
  }

  // --- Role Selection Screen ---
  if (!role) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ backgroundColor: "var(--color-dashboardBg)" }}
      >
        <div
          className="p-10 rounded-3xl shadow-xl w-96 text-center"
          style={{ backgroundColor: "var(--color-BgColor)" }}
        >
          <h1 className="text-3xl font-bold mb-6 text-white">Login Type</h1>
          <button
            onClick={() => setRole("admin")}
            className="w-full bg-[var(--color-iconColor)] hover:opacity-90 text-white font-semibold py-3 rounded-lg mb-4"
          >
            Admin Login
          </button>
          <button
            onClick={() => setRole("user")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
          >
            User Login
          </button>
        </div>
      </div>
    );
  }

  // --- Actual Login Form ---
  return (
    <div
      className="flex items-center justify-center h-screen p-4"
      style={{ backgroundColor: "var(--color-dashboardBg)" }}
    >
      <div className="bg-[var(--color-BgColor)] p-10 rounded-3xl shadow-xl w-96 text-white">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {role === "admin" ? "Admin Login" : "User Login"}
        </h1>

        {role === "user" && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`p-3 rounded-lg w-full outline-none text-white placeholder-gray-400 ${usernameError ? "border border-red-500" : ""
                }`}
              style={{
                backgroundColor: "var(--color-cardBg)",
                borderColor: "var(--color-IconBg)",
              }}
            />
            {usernameError && (
              <p className="text-red-400 text-sm mt-1">{usernameError}</p>
            )}
          </div>
        )}

        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`p-3 rounded-lg w-full outline-none text-white placeholder-gray-400 ${emailError ? "border border-red-500" : ""
              }`}
            style={{
              backgroundColor: "var(--color-cardBg)",
              borderColor: "var(--color-IconBg)",
            }}
          />
          {emailError && (
            <p className="text-red-400 text-sm mt-1">{emailError}</p>
          )}
        </div>

        <div className="relative w-full mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`p-3 pr-16 rounded-lg w-full outline-none text-white placeholder-gray-400 ${passwordError ? "border border-red-500" : ""
              }`}
            style={{
              backgroundColor: "var(--color-cardBg)",
              borderColor: "var(--color-IconBg)",
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
          {passwordError && (
            <p className="text-red-400 text-sm mt-1">{passwordError}</p>
          )}
        </div>

        {/* Buttons row */}
        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[var(--color-iconColor)] hover:opacity-90 text-white font-semibold py-3 rounded-lg transition-all"
          >
            Login
          </button>

          <button
            onClick={() => router.push("/Signup")}
            className="w-full bg-transparent border border-[var(--color-iconColor)] hover:bg-[var(--color-iconColor)] hover:text-white text-[var(--color-iconColor)] font-semibold py-3 rounded-lg transition-all"
          >
            Sign Up
          </button>
        </div>

        <p
          onClick={() => {
            if (loading) return;
            setRole(null);
            setEmail("");
            setUsername("");
            setPassword("");
            setEmailError("");
            setUsernameError("");
            setPasswordError("");
          }}
          className="mt-5 text-blue-400 hover:underline cursor-pointer text-center"
        >
          Go back
        </p>
      </div>
    </div>
  );
}
