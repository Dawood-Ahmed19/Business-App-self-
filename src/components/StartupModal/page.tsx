"use client";
import { useEffect, useState } from "react";

export default function StartupModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/auth/check-admin", { cache: "no-store" });
        const data = await res.json();

        if (!data.success) throw new Error(data.message);

        if (!data.adminExists) {
          setOpen(true);
        }
      } catch (err) {
        console.error("❌ Admin check error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  const closeModal = () => setOpen(false);
  if (loading || !open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      aria-modal
      role="dialog"
    >
      <div className="bg-[#2d3142] text-white p-8 rounded-2xl shadow-xl w-[90%] max-w-md text-center space-y-6">
        <h2 className="text-2xl font-bold text-orange-300">Important Notice</h2>

        <p className="text-sm leading-relaxed text-gray-200">
          An <strong>Admin account</strong> is required before you can create
          any user accounts. Keep in mind that only one Admin account can exist.
        </p>

        <button
          onClick={closeModal}
          className="bg-orange-400 hover:bg-orange-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
