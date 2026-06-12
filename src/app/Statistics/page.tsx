// "use client";
// import React, { useEffect, useState } from "react";

// // Helper to get the correct unit for each type
// const getUnit = (type: string) => {
//   if (!type) return "";
//   type = type.toLowerCase();
//   if (type === "pipe" || type === "hardware" || type === "jali") return "Ft";
//   if (
//     [
//       "angle",
//       "patti",
//       "sarrya",
//       "diamond chadar",
//       "plate",
//       "sheet",
//       "rod",
//       "chowkat",
//       "tanka barfi jali",
//     ].includes(type)
//   )
//     return "Kg";
//   return "Qty";
// };
// const ITEMS_PER_PAGE = 15;

// export default function StatisticsPage() {
//   const [stats, setStats] = useState<any[]>([]);
//   const [filtered, setFiltered] = useState<any[]>([]);
//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);

//   useEffect(() => {
//     fetch("/api/statistics")
//       .then((res) => res.json())
//       .then((data) => {
//         if (data.success) {
//           setStats(data.stats);
//           setFiltered(data.stats);
//         }
//       });
//   }, []);

//   // Search filter
//   useEffect(() => {
//     if (!search) {
//       setFiltered(stats);
//       setPage(1);
//       return;
//     }
//     const s = search.toLowerCase();
//     setFiltered(
//       stats.filter(
//         (item) =>
//           (item.item || item.originalName || "").toLowerCase().includes(s) ||
//           (item.size || "").toLowerCase().includes(s) ||
//           (item.guage || "").toLowerCase().includes(s) ||
//           (item.type || "").toLowerCase().includes(s)
//       )
//     );
//     setPage(1);
//   }, [search, stats]);

//   // Pagination
//   const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
//   const paginated = filtered.slice(
//     (page - 1) * ITEMS_PER_PAGE,
//     page * ITEMS_PER_PAGE
//   );

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold mb-4 text-white">
//         Item Sales Statistics
//       </h2>
//       <div className="mb-4 flex justify-between items-center">
//         <input
//           type="text"
//           placeholder="Search by item, size, guage, type..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-600 w-96"
//         />
//         <div className="text-gray-400">
//           Page {page} of {totalPages}
//         </div>
//       </div>
//       <table className="min-w-full border border-gray-700 text-white">
//         <thead>
//           <tr className="bg-gray-800">
//             <th className="border p-2">S.No</th>
//             <th className="border p-2">Item Name</th>
//             <th className="border p-2">Size</th>
//             <th className="border p-2">Guage</th>
//             <th className="border p-2">Type</th>
//             <th className="border p-2">Total Sold</th>
//             <th className="border p-2">Qty</th>
//           </tr>
//         </thead>
//         <tbody>
//           {paginated.length === 0 ? (
//             <tr>
//               <td colSpan={7} className="text-center p-4 text-gray-400">
//                 No items found.
//               </td>
//             </tr>
//           ) : (
//             paginated.map((item, idx) => {
//               const unit = getUnit(item.type);
//               let total = 0;
//               if (unit === "Ft") total = item.totalFt;
//               else if (unit === "Kg") total = item.totalWeight;
//               else total = item.totalQty;

//               // Show qty for pipes and hardware, else blank
//               const showQty =
//                 item.type &&
//                 ["pipe", "hardware"].includes(item.type.toLowerCase());

//               return (
//                 <tr key={idx} className="text-center">
//                   <td className="border p-2">
//                     {(page - 1) * ITEMS_PER_PAGE + idx + 1}
//                   </td>
//                   <td className="border p-2">
//                     {item.item || item.originalName}
//                   </td>
//                   <td className="border p-2">{item.size}</td>
//                   <td className="border p-2">{item.guage}</td>
//                   <td className="border p-2">{item.type}</td>
//                   <td className="border p-2">
//                     {total}{" "}
//                     <span className="text-xs text-gray-400">{unit}</span>
//                   </td>
//                   <td className="border p-2">{showQty ? item.totalQty : ""}</td>
//                 </tr>
//               );
//             })
//           )}
//         </tbody>
//       </table>
//       {/* Pagination Controls */}
//       <div className="flex justify-between items-center mt-4">
//         <button
//           onClick={() => setPage((p) => Math.max(1, p - 1))}
//           disabled={page === 1}
//           className={`px-4 py-2 rounded ${
//             page === 1
//               ? "bg-gray-700 text-gray-400 cursor-not-allowed"
//               : "bg-blue-600 hover:bg-blue-700 text-white"
//           }`}
//         >
//           Prev
//         </button>
//         <span className="text-gray-400">
//           Page {page} of {totalPages}
//         </span>
//         <button
//           onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//           disabled={page === totalPages}
//           className={`px-4 py-2 rounded ${
//             page === totalPages || totalPages === 0
//               ? "bg-gray-700 text-gray-400 cursor-not-allowed"
//               : "bg-blue-600 hover:bg-blue-700 text-white"
//           }`}
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// }

"use client";
import React, { useEffect, useState } from "react";

// Helper to get the correct unit for each type
const getUnit = (item: any) => {
  if (!item?.type) return "";
  const type = item.type.toLowerCase();
  if (type === "hardware") {
    if (item.totalWeight > 0) return "Kg";
    if (item.totalFt > 0) return "Ft";
    return "Qty";
  }
  if (type === "pipe" || type === "jali") return "Ft";
  if (
    [
      "angle",
      "patti",
      "sarrya",
      "diamond chadar",
      "plate",
      "sheet",
      "rod",
      "chowkat",
      "tanka barfi jali",
    ].includes(type)
  )
    return "Kg";
  return "Qty";
};

const ITEMS_PER_PAGE = 15;

export default function StatisticsPage() {
  const [stats, setStats] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loadingPerMonth, setLoadingPerMonth] = useState<
    Record<string, number>
  >({});
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    fetch("/api/statistics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
          setFiltered(data.stats);
          setLoadingPerMonth(data.loadingPerMonth || {});
          // Set default selected month to latest
          const months = Object.keys(data.loadingPerMonth || {}).sort();
          if (months.length > 0) setSelectedMonth(months[months.length - 1]);
        }
      });
  }, []);

  // Search filter
  useEffect(() => {
    if (!search) {
      setFiltered(stats);
      setPage(1);
      return;
    }
    const s = search.toLowerCase();
    setFiltered(
      stats.filter(
        (item) =>
          (item.item || item.originalName || "").toLowerCase().includes(s) ||
          (item.size || "").toLowerCase().includes(s) ||
          (item.guage || "").toLowerCase().includes(s) ||
          (item.type || "").toLowerCase().includes(s)
      )
    );
    setPage(1);
  }, [search, stats]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Prepare sorted months for dropdown
  const sortedMonths = Object.keys(loadingPerMonth).sort();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-white">
        Item Sales Statistics
      </h2>

      {/* Header Row: Month Select + Loading + Search + Page */}
      <div className="mb-4 flex flex-wrap gap-4 justify-between items-center">
        {/* Month Select + Loading */}
        <div className="flex items-center gap-2">
          <label className="text-white font-semibold" htmlFor="month-select">
            Loading Per Month:
          </label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2 py-1 rounded bg-gray-800 text-white border border-gray-600"
          >
            {sortedMonths.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
          <span className="text-gray-200 font-semibold ml-2">
            {selectedMonth && (
              <>
                Total Loading:{" "}
                <span className="text-blue-400">
                  {loadingPerMonth[selectedMonth] ?? 0}
                </span>
              </>
            )}
          </span>
        </div>
        {/* Search */}
        <input
          type="text"
          placeholder="Search by item, size, guage, type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-600 w-96"
        />
        {/* Page Info */}
        <div className="text-gray-400">
          Page {page} of {totalPages}
        </div>
      </div>

      <table className="min-w-full border border-gray-700 text-white">
        <thead>
          <tr className="bg-gray-800">
            <th className="border p-2">S.No</th>
            <th className="border p-2">Item Name</th>
            <th className="border p-2">Size</th>
            <th className="border p-2">Guage</th>
            <th className="border p-2">Type</th>
            <th className="border p-2">Total Sold</th>
            <th className="border p-2">Qty</th>
          </tr>
        </thead>
        <tbody>
          {paginated.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center p-4 text-gray-400">
                No items found.
              </td>
            </tr>
          ) : (
            paginated.map((item, idx) => {
              const unit = getUnit(item);
              let total = 0;
              if (unit === "Ft") total = item.totalFt;
              else if (unit === "Kg") total = item.totalWeight;
              else total = item.totalQty;

              const showQty =
                item.type &&
                (["pipe"].includes(item.type.toLowerCase()) ||
                  (item.type.toLowerCase() === "hardware" && unit === "Qty"));

              return (
                <tr key={idx} className="text-center">
                  <td className="border p-2">
                    {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                  </td>
                  <td className="border p-2">
                    {item.item || item.originalName}
                  </td>
                  <td className="border p-2">{item.size}</td>
                  <td className="border p-2">{item.guage}</td>
                  <td className="border p-2">{item.type}</td>
                  <td className="border p-2">
                    {total !== undefined && total !== null
                      ? Number(total)
                          .toFixed(4)
                          .replace(/\.?0+$/, "")
                      : ""}
                    <span className="text-xs text-gray-400">{unit}</span>
                  </td>
                  <td className="border p-2">
                    {showQty
                      ? Number(item.totalQty)
                          .toFixed(4)
                          .replace(/\.?0+$/, "")
                      : unit === "Kg"
                      ? Number(item.totalWeight)
                          .toFixed(4)
                          .replace(/\.?0+$/, "")
                      : unit === "Ft"
                      ? Number(item.totalFt)
                          .toFixed(4)
                          .replace(/\.?0+$/, "")
                      : ""}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className={`px-4 py-2 rounded ${
            page === 1
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          Prev
        </button>
        <span className="text-gray-400">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || totalPages === 0}
          className={`px-4 py-2 rounded ${
            page === totalPages || totalPages === 0
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
