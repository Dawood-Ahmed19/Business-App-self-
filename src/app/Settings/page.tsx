"use client";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [financialStartDay, setStartDay] = useState<number>(1);
  const [financialEndDay, setEndDay] = useState<number>(30);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setStartDay(data.settings.financialStartDay || 1);
        setEndDay(data.settings.financialEndDay || 30);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ financialStartDay, financialEndDay }),
    });
    const data = await res.json();
    setMessage(data.success ? "Settings saved!" : data.message || "Error");
    setSaving(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen  p-6 text-white">
      <div className="bg-dashboardBg w-full max-w-md rounded-lg p-6 shadow-lg">
        <h1 className="text-xl font-bold mb-6">Financial Settings</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Month starts on day:</label>
            <input
              type="number"
              min={1}
              max={28}
              value={financialStartDay}
              onChange={(e) => setStartDay(Number(e.target.value))}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-center"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Month ends on day:</label>
            <input
              type="number"
              min={1}
              max={31}
              value={financialEndDay}
              onChange={(e) => setEndDay(Number(e.target.value))}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-center"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>

          {message && (
            <p className="text-center mt-3 text-green-400">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
