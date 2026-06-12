"use client";

import { useState, useEffect } from "react";

const formattedDate = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

interface ItemRow {
  _id: string;
  name: string;
  type?: string;
  size?: string | number | null;
  guage?: string | number | null;
  number?: string | number | null;
  color?: string;
  pricePerFt?: number;
  pricePerUnit?: number;
  pricePerKg?: number;
  ratePerFt?: string;
  ratePerUnit?: string;
  ratePerKg?: string;
  errorFt?: string;
  errorUnit?: string;
  errorKg?: string;
}

export default function Ratelist() {
  const [rows, setRows] = useState<ItemRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const pageSize = 10;

  // pipe profit fields
  const [pipeProfit, setPipeProfit] = useState("");
  const [halfPipeProfit, setHalfPipeProfit] = useState("");
  const [primePipeProfit, setPrimePipeProfit] = useState("");
  const [updatingPipes, setUpdatingPipes] = useState(false);

  // --------------------------------
  // const makeKey = (obj: any) => {
  //   const normalize = (val: any) => {
  //     if (val === undefined || val === null) return "";
  //     return String(val).toLowerCase().trim();
  //   };

  //   const t = normalize(obj.type);
  //   if (t === "jali" || t === "tanka barfi jali") {
  //     return `${t}|${normalize(obj.number)}|${normalize(obj.size)}|${normalize(
  //       obj.guage
  //     )}`;
  //   }

  //   return `${t}|${normalize(obj.size)}|${normalize(obj.guage)}`;
  // };

  const makeKey = (obj: any) => {
    const normalize = (val: any) => {
      if (val === undefined || val === null) return "";
      return String(val).toLowerCase().trim();
    };

    const t = normalize(obj.type);
    if (t === "jali" || t === "tanka barfi jali") {
      return `${t}|${normalize(obj.number)}|${normalize(obj.size)}|${normalize(
        obj.guage
      )}`;
    }
    if (t === "hardware") {
      // Use name + size + guage for hardware
      return `${t}|${normalize(obj.name)}|${normalize(obj.size)}|${normalize(
        obj.guage
      )}`;
    }
    return `${t}|${normalize(obj.size)}|${normalize(obj.guage)}`;
  };

  const getDisplayName = (r: ItemRow) => {
    if (!r) return "";
    const t = r.type?.toLowerCase();
    const formatSize = (str: string | number | null | undefined) => {
      if (!str) return "";
      return String(str).replace(/\b(l|t)\b/gi, (m) => m.toUpperCase());
    };

    // ✅ Show [chowkat] for chowkat items
    if (t === "chowkat") {
      return `[${r.type ?? ""}]`;
    }

    if (t === "pipe" || t === "jali" || t === "tanka barfi jali") {
      const typeName = r.type || "";
      const num = r.number ? String(r.number) : "";
      const size = formatSize(r.size);
      return [typeName, num, size].filter(Boolean).join(" ").trim();
    }
    if (t === "hardware")
      return `${r.name || ""}${r.size ? " " + formatSize(r.size) : ""}${
        r.color ? " " + r.color : ""
      }`.trim();
    const isKgType = [
      "angle",
      "patti",
      "sarrya",
      "diamond chadar",
      "choras khana china jali",
    ].includes(t || "");
    if (isKgType) return `${r.type || ""} ${formatSize(r.size) ?? ""}`.trim();
    return r.name;
  };

  // --------------------------------

  async function fetchAll(searchTerm = "") {
    try {
      const q = searchTerm.trim()
        ? "?search=" + encodeURIComponent(searchTerm)
        : "";

      const invRes = await fetch("/api/inventory" + q);
      const inv = await invRes.json();
      if (!inv.success) return setRows([]);

      const rateRes = await fetch("/api/ratelist");
      const rateJson = await rateRes.json();

      const saved: Record<string, any> = {};
      if (rateJson.success) {
        for (const r of rateJson.items ?? []) saved[makeKey(r)] = r;
      }

      const merged: ItemRow[] = (inv.items || []).map((i: any) => {
        const key = makeKey(i);
        return {
          _id: i._id,
          name: i.name ?? "N/A",
          type: i.type ?? "",
          size: i.size ?? "",
          number: i.number ?? "",
          guage: i.guage ?? "",
          color: i.color ?? "",
          pricePerFt: i.pricePerFt ?? 0,
          pricePerUnit: i.pricePerUnit ?? 0,
          pricePerKg: i.pricePerKg ?? 0,
          ratePerFt: saved[key]?.ratePerFt ?? "",
          ratePerUnit: saved[key]?.ratePerUnit ?? "",
          ratePerKg: saved[key]?.ratePerKg ?? "",
          errorFt: "",
          errorUnit: "",
          errorKg: "",
        };
      });
      setRows(merged);
    } catch (e) {
      console.error("Fetching error:", e);
      setRows([]);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const deb = setTimeout(() => fetchAll(search), 400);
    return () => clearTimeout(deb);
  }, [search]);

  async function handleSave() {
    if (rows.some((r) => r.errorFt || r.errorUnit || r.errorKg)) {
      alert("⚠️ Fix errors before saving.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/ratelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Saved successfully!");
        fetchAll();
      } else alert("❌ Failed to save");
    } catch (e) {
      console.error(e);
      alert("❌ Error while saving");
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------
  const applyPipeProfit = async () => {
    const mainProfit = parseFloat(pipeProfit);
    const halfProfit = parseFloat(halfPipeProfit);
    const primeProfit = parseFloat(primePipeProfit);

    if (isNaN(mainProfit) && isNaN(halfProfit) && isNaN(primeProfit))
      return alert("Please enter at least one valid percentage.");

    setUpdatingPipes(true);

    try {
      const res = await fetch("/api/rates/updatePipeRates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mainProfit: isNaN(mainProfit) ? "" : mainProfit,
          halfProfit: isNaN(halfProfit) ? "" : halfProfit,
          primeProfit: isNaN(primeProfit) ? "" : primeProfit,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert(`✅ ${data.updatedCount} pipe rate(s) updated successfully!`);
        await fetchAll();
      } else {
        alert("❌ Failed to update pipe rates.");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Error applying pipe profit update");
    } finally {
      setUpdatingPipes(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const start = (page - 1) * pageSize;
  const current = rows.slice(start, start + pageSize);
  const hasErrors = rows.some((r) => r.errorFt || r.errorUnit || r.errorKg);

  // ---------- Editable logic helpers ----------
  const isPerKgType = (t: string) =>
    [
      "angle",
      "patti",
      "sarrya",
      "diamond chadar",
      "choras khana china jali",
      "chowkat", // ✅ Chowkat also per‑kg editable
    ].includes(t);

  // const isRatePerFtEditable = (r: ItemRow) =>
  //   ["pipe", "jali", "tanka barfi jali"].includes(r.type?.toLowerCase() || "");
  const isRatePerFtEditable = (r: ItemRow) => {
    const t = r.type?.toLowerCase();
    if (["pipe", "jali", "tanka barfi jali"].includes(t)) return true;
    if (t === "hardware" && Number(r.pricePerFt) > 0) return true;
    return false;
  };

  // const isRatePerKgEditable = (r: ItemRow) => {
  //   const t = r.type?.toLowerCase();
  //   if (t === "hardware" && Number(r.pricePerKg) > 0) return true;
  //   return isPerKgType(t || ""); // ✅ Chowkat included through helper
  // };
  const isRatePerKgEditable = (r: ItemRow) => {
    const t = r.type?.toLowerCase();
    if (
      t === "hardware" &&
      Number(r.pricePerFt) === 0 &&
      Number(r.pricePerKg) > 0
    )
      return true;
    return isPerKgType(t || "");
  };

  // const isRatePerUnitEditable = (r: ItemRow) => {
  //   const t = r.type?.toLowerCase();
  //   return t === "hardware" && (!r.pricePerKg || Number(r.pricePerKg) === 0);
  // };

  const isRatePerUnitEditable = (r: ItemRow) => {
    const t = r.type?.toLowerCase();
    return (
      t === "hardware" &&
      Number(r.pricePerFt) === 0 &&
      Number(r.pricePerKg) === 0
    );
  };
  // --------------------------------------------

  return (
    <div className="h-full flex flex-col items-center gap-[40px] px-[75px] py-[35px]">
      <div className="flex justify-between items-center w-full">
        <h1 className="text-xl font-bold text-white">Rate List</h1>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-white">Pipe %:</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 10"
              value={pipeProfit}
              onChange={(e) => setPipeProfit(e.target.value)}
              className="w-20 px-2 py-1 rounded bg-gray-900 border border-gray-600 text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-white">
              (1/2" x 1/2"), (3/4" x 3/8") % :
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 6"
              value={halfPipeProfit}
              onChange={(e) => setHalfPipeProfit(e.target.value)}
              className="w-20 px-2 py-1 rounded bg-gray-900 border border-gray-600 text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-white">1/2" prime %:</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 8"
              value={primePipeProfit}
              onChange={(e) => setPrimePipeProfit(e.target.value)}
              className="w-20 px-2 py-1 rounded bg-gray-900 border border-gray-600 text-white text-sm"
            />
          </div>

          <button
            onClick={applyPipeProfit}
            disabled={updatingPipes}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              updatingPipes
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {updatingPipes ? "Updating..." : "Apply"}
          </button>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="px-3 py-2 rounded bg-gray-900 text-white outline-none border border-gray-600 focus:border-green-500 transition w-[250px]"
          />
          <p className="text-sm text-white">{formattedDate}</p>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-white border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-800 text-center text-sm">
              <th className="border border-gray-700 p-3">#</th>
              <th className="border border-gray-700 p-3">Item Name</th>
              <th className="border border-gray-700 p-3">Type</th>
              <th className="border border-gray-700 p-3">Guage</th>
              <th className="border border-gray-700 p-3">Rate Per Ft</th>
              <th className="border border-gray-700 p-3">Rate Per Unit</th>
              <th className="border border-gray-700 p-3">Rate Per Kg</th>
            </tr>
          </thead>
          <tbody>
            {current.length ? (
              current.map((r, i) => {
                const idx = start + i;
                const allowUnit = isRatePerUnitEditable(r);
                const allowKg = isRatePerKgEditable(r);
                const allowFt = isRatePerFtEditable(r);

                return (
                  <tr
                    key={r._id}
                    className="text-center text-sm hover:bg-gray-700"
                  >
                    <td className="border border-gray-700 p-2">{idx + 1}</td>
                    <td className="border border-gray-700 p-2 text-left px-4">
                      {getDisplayName(r)}
                    </td>
                    <td className="border border-gray-700 p-2">{r.type}</td>
                    <td className="border border-gray-700 p-2">{r.guage}</td>

                    {/* Rate Per Ft */}
                    <td className="border border-gray-700 p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={r.ratePerFt ?? ""}
                        readOnly={!allowFt}
                        onChange={(e) => {
                          if (!allowFt) return;
                          const value = e.target.value;
                          const newRows = [...rows];
                          newRows[idx].ratePerFt = value;
                          newRows[idx].errorFt = "";
                          if (value !== "") {
                            const num = parseFloat(value);
                            if (!isNaN(num) && num < (r.pricePerFt || 0)) {
                              newRows[
                                idx
                              ].errorFt = `Must not be lower than inventory rate (₨${r.pricePerFt})`;
                            }
                          }
                          setRows(newRows);
                        }}
                        className={`w-full px-2 py-1 rounded outline-none text-center ${
                          r.errorFt ? "border border-red-500" : ""
                        } ${
                          allowFt
                            ? "bg-gray-900 text-white"
                            : "bg-gray-800 text-gray-500 cursor-not-allowed"
                        }`}
                      />
                      {r.errorFt && (
                        <div className="text-red-500 text-xs mt-1">
                          {r.errorFt}
                        </div>
                      )}
                    </td>

                    {/* Rate Per Unit */}
                    <td className="border border-gray-700 p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={r.ratePerUnit ?? ""}
                        readOnly={!allowUnit}
                        onChange={(e) => {
                          if (!allowUnit) return;
                          const value = e.target.value;
                          const newRows = [...rows];
                          newRows[idx].ratePerUnit = value;
                          newRows[idx].errorUnit = "";
                          if (value !== "") {
                            const num = parseFloat(value);
                            if (!isNaN(num) && num < (r.pricePerUnit || 0)) {
                              newRows[
                                idx
                              ].errorUnit = `Must not be lower than inventory rate (₨${r.pricePerUnit})`;
                            }
                          }
                          setRows(newRows);
                        }}
                        className={`w-full px-2 py-1 rounded outline-none text-center ${
                          r.errorUnit ? "border border-red-500" : ""
                        } ${
                          allowUnit
                            ? "bg-gray-900 text-white"
                            : "bg-gray-800 text-gray-500 cursor-not-allowed"
                        }`}
                      />
                      {r.errorUnit && (
                        <div className="text-red-500 text-xs mt-1">
                          {r.errorUnit}
                        </div>
                      )}
                    </td>

                    {/* Rate Per Kg */}
                    <td className="border border-gray-700 p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={r.ratePerKg ?? ""}
                        readOnly={!allowKg}
                        onChange={(e) => {
                          if (!allowKg) return;
                          const value = e.target.value;
                          const newRows = [...rows];
                          newRows[idx].ratePerKg = value;
                          newRows[idx].errorKg = "";
                          if (value !== "") {
                            const num = parseFloat(value);
                            if (!isNaN(num) && num < (r.pricePerKg || 0)) {
                              newRows[
                                idx
                              ].errorKg = `Must not be lower than inventory rate (₨${r.pricePerKg})`;
                            }
                          }
                          setRows(newRows);
                        }}
                        className={`w-full px-2 py-1 rounded outline-none text-center ${
                          r.errorKg ? "border border-red-500" : ""
                        } ${
                          allowKg
                            ? "bg-gray-900 text-white"
                            : "bg-gray-800 text-gray-500 cursor-not-allowed"
                        }`}
                      />
                      {r.errorKg && (
                        <div className="text-red-500 text-xs mt-1">
                          {r.errorKg}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 p-4">
                  No items available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center w-full max-w-[700px] mt-6">
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
        >
          First Page
        </button>
        <button
          onClick={() => setPage(Math.max(page - 1, 1))}
          disabled={page === 1}
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-gray-300">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(Math.min(page + 1, totalPages))}
          disabled={page === totalPages}
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
        <button
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages}
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
        >
          Last Page
        </button>
      </div>

      <div className="flex justify-end w-full max-w-[700px] mt-4">
        <button
          onClick={handleSave}
          disabled={saving || hasErrors}
          className={`px-4 py-2 rounded transition ${
            saving || hasErrors
              ? "bg-gray-500 text-gray-300 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {saving ? "Saving..." : hasErrors ? "Fix Errors" : "Save"}
        </button>
      </div>
    </div>
  );
}
