"use client";

import { printMonthlyReport, printGenericReport } from "@/utils/printReports";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
interface Quotation {
  _id: string;
  quotationId: string;
  date: string;
  grandTotal: number;
  quotationTotalProfit: number;
  status: string;
  items: any[];
  loading?: number;
}

const Reports = () => {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const [filterType, setFilterType] = useState("all");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [grandTotalExpenses, setGrandTotalExpenses] = useState(0);
  const [netMonthlyProfit, setNetMonthlyProfit] = useState(0);
  const [salariesPaid, setSalariesPaid] = useState(0);
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrint = () => {
    const data = quotations.map((q) => ({
      date: q.date,
      quotationId: q.quotationId,
      grandTotal: q.grandTotal,
      profit: q.quotationTotalProfit || 0,
      loading: q.loading || 0,
    }));

    const totalAmount = quotations.reduce((s, q) => s + q.grandTotal, 0);
    const totalProfit = quotations.reduce(
      (s, q) => s + (q.quotationTotalProfit || 0),
      0
    );

    let title = "Business Report";
    if (filterType === "yearly") title = `Yearly Report — ${year}`;
    if (filterType === "custom")
      title = `Custom Report — ${fromDate} to ${toDate}`;

    // Pass filterType, fromDate, toDate, year!
    printGenericReport(
      title,
      data,
      totalAmount,
      totalProfit,
      filterType,
      fromDate,
      toDate,
      year
    );
  };


  const totalBills = quotations.length;

  const handlePrintAndSave = async () => {
    // call your existing printer first
    printMonthlyReport(
      month,
      year,
      quotations.map((q) => ({
        date: q.date,
        quotationId: q.quotationId,
        grandTotal: q.grandTotal,
        profit: q.quotationTotalProfit || 0,
        loading: q.loading || 0,
      })),
      quotations.reduce((s, q) => s + q.grandTotal, 0),
      quotations.reduce((s, q) => s + (q.quotationTotalProfit || 0), 0),
      netMonthlyProfit,
      monthlyExpenses,
      salariesPaid
    );

    // then send data to backend to store summary
    try {
      const res = await fetch("/api/reports/save-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          year,
          totalSales: quotations.reduce((s, q) => s + q.grandTotal, 0),
          totalProfit: quotations.reduce(
            (s, q) => s + (q.quotationTotalProfit || 0),
            0
          ),
          monthlyExpenses,
          grandTotalExpenses,
          netMonthlyProfit,
        }),
      });

      const data = await res.json();
      if (data.success) {
        console.log("✅ Saved to reportsSummary collection.");
      } else {
        console.warn("⚠️ Save summary failed:", data.message);
      }
    } catch (err) {
      console.error("❌ Error saving summary:", err);
    }
  };

  // const fetchQuotations = async () => {
  //   try {
  //     const query = new URLSearchParams();

  //     if (filterType === "monthly") {
  //       query.append("month", String(month));
  //       query.append("year", String(year));
  //     } else if (filterType === "yearly") {
  //       query.append("year", String(year));
  //     } else if (filterType === "custom") {
  //       if (fromDate) query.append("fromDate", fromDate);
  //       if (toDate) query.append("toDate", toDate);
  //     }

  //     const res = await fetch(`/api/quotations?${query.toString()}`);
  //     const data = await res.json();
  //     if (data.success) {
  //       setQuotations(data.quotations || []);
  //       setCurrentPage(1);
  //     }

  //     if (filterType === "monthly") {
  //       const expRes = await fetch(
  //         `/api/reports/monthly-expenses?month=${month}&year=${year}`
  //       );
  //       const expData = await expRes.json();

  //       if (expData.success) {
  //         setMonthlyExpenses(expData.monthlyExpenses || 0);
  //         setGrandTotalExpenses(expData.grandTotalExpenses || 0);
  //       } else {
  //         setMonthlyExpenses(0);
  //         setGrandTotalExpenses(0);
  //       }
  //     } else {
  //       setMonthlyExpenses(0);
  //       setGrandTotalExpenses(0);
  //     }
  //   } catch (err) {
  //     console.error("Error fetching quotations:", err);
  //   }
  // };

  const fetchQuotations = async () => {
    try {
      const query = new URLSearchParams();

      if (filterType === "monthly") {
        query.append("month", String(month));
        query.append("year", String(year));
      } else if (filterType === "yearly") {
        query.append("year", String(year));
      } else if (filterType === "custom") {
        if (fromDate) query.append("fromDate", fromDate);
        if (toDate) query.append("toDate", toDate);
      }

      const res = await fetch(`/api/quotations?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setQuotations(data.quotations || []);
        setCurrentPage(1);
      }

      if (filterType === "monthly") {
        // Expenses
        const expRes = await fetch(
          `/api/reports/monthly-expenses?month=${month}&year=${year}`
        );
        const expData = await expRes.json();

        if (expData.success) {
          setMonthlyExpenses(expData.monthlyExpenses || 0);
          setGrandTotalExpenses(expData.grandTotalExpenses || 0);
        } else {
          setMonthlyExpenses(0);
          setGrandTotalExpenses(0);
        }

        // Salaries Paid
        const monthKey = `${year}-${String(month).padStart(2, "0")}`;
        const salRes = await fetch(`/api/salaries/total?month=${monthKey}`);
        const salData = await salRes.json();
        setSalariesPaid(salData.total || 0);
      } else {
        setMonthlyExpenses(0);
        setGrandTotalExpenses(0);
        setSalariesPaid(0);
      }
    } catch (err) {
      console.error("Error fetching quotations:", err);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [filterType, month, year, fromDate, toDate]);

  const totalPages = Math.ceil(quotations.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = quotations.slice(startIndex, startIndex + pageSize);

  const totalAmount = paginatedData.reduce((sum, q) => sum + q.grandTotal, 0);
  const netProfit = paginatedData.reduce(
    (sum, q) =>
      sum +
      (Array.isArray(q.items)
        ? q.items.reduce((s, i) => s + (i.totalProfit || 0), 0)
        : 0),
    0
  );

  useEffect(() => {
    if (filterType === "monthly") {
      const totalInvoiceProfit = quotations.reduce(
        (sum, q) => sum + (q.quotationTotalProfit || 0),
        0
      );
      const totalLoading = quotations.reduce(
        (sum, q) => sum + (q.loading || 0),
        0
      );
      setNetMonthlyProfit(totalInvoiceProfit + totalLoading - grandTotalExpenses);
    } else {
      setNetMonthlyProfit(0);
    }
  }, [quotations, grandTotalExpenses, filterType]);

  function calcTotalProfit(q) {
    const profit = Array.isArray(q.items)
      ? q.items.reduce((sum, i) => {
        let adjustedCostPerUnit = i.costPerUnit;

        if (i.itemType === "pipe") {
          adjustedCostPerUnit = i.costPerUnit * 20;
        }

        const profitPerUnit =
          (i.invoiceRatePerUnit || 0) - (adjustedCostPerUnit || 0);

        // Use ft for hardware per ft, jali per ft; qty for others; weight for per kg
        let multiplier = Number(i.qty) || Number(i.weight) || 0;
        if (
          i.type?.toLowerCase() === "hardware" &&
          i.ft !== undefined &&
          i.ft !== null &&
          i.ft !== ""
        ) {
          multiplier = Number(i.ft);
        }
        if (
          i.type?.toLowerCase() === "jali" &&
          i.ft !== undefined &&
          i.ft !== null &&
          i.ft !== ""
        ) {
          multiplier = Number(i.ft);
        }

        const totalProfit = (profitPerUnit || 0) * multiplier;
        return sum + totalProfit;
      }, 0)
      : 0;

    // Round to nearest integer
    return Math.round(profit);
  }

  return (
    <div className="h-full flex flex-col items-center gap-[30px] px-[40px] py-[30px]">
      {/* Header */}
      {/* <span className="flex justify-between w-full items-center">
        <h1 className="text-xl font-bold text-white">Business Reports</h1>
        <p className="text-sm text-white">{formattedDate}</p>
      </span> */}
      <span className="flex justify-between w-full items-center">
        <h1 className="text-xl font-bold text-white">Business Reports</h1>
        <div className="flex items-center gap-8">
          <span className="text-lg font-semibold text-yellow-400">
            Total Bills: {totalBills}
          </span>
          <p className="text-sm text-white">{formattedDate}</p>
        </div>
      </span>
      {/* 🔍 Filter Section */}
      <div className="w-full flex flex-wrap bg-gray-800 p-4 rounded justify-between items-center">
        <div className="flex items-center gap-4">
          {/* Select filter type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-900 text-white p-2 rounded"
          >
            <option value="all">All Records</option>
            <option value="monthly">Monthly Report</option>
            <option value="yearly">Yearly Report</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {filterType === "monthly" && (
            <>
              <input
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-gray-900 text-white p-2 rounded w-[120px]"
                placeholder="Month"
              />
              <input
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-gray-900 text-white p-2 rounded w-[120px]"
                placeholder="Year"
              />
            </>
          )}

          {filterType === "yearly" && (
            <input
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-gray-900 text-white p-2 rounded w-[120px]"
              placeholder="Year"
            />
          )}

          {filterType === "custom" && (
            <>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-gray-900 text-white p-2 rounded"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-gray-900 text-white p-2 rounded"
              />
            </>
          )}

          <button
            onClick={fetchQuotations}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Apply Filter
          </button>

          {["monthly", "yearly", "custom"].includes(filterType) && quotations.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={
                  filterType === "monthly"
                    ? handlePrintAndSave
                    : handlePrint
                }
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Download Report
              </button>
            </div>
          )}
        </div>

        <Link
          href="/Reports/PendingInvoices"
          className="text-sm text-white hover:text-yellow-400"
        >
          Pending Invoices
        </Link>

      </div>

      {/* Table */}
      <span className="w-full h-full max-h-[700px]">
        <div className="h-full w-full overflow-x-auto">
          <table className="w-full text-white border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-800 text-center text-sm">
                <th className="border border-gray-600 p-3">Date</th>
                <th className="border border-gray-600 p-3">Bill No</th>
                <th className="border border-gray-600 p-3">Amount</th>
                <th className="border border-gray-600 p-3">Profit</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.length > 0 ? (
                <>
                  {paginatedData.map((q) => (
                    <tr
                      key={q._id}
                      onClick={() => router.push(`/Reports/${q._id}`)}
                      className="text-center text-sm hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <td className="border border-gray-700 p-2">
                        {new Date(q.date).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-700 p-2 text-blue-400 underline">
                        {q.quotationId}
                      </td>
                      <td className="border border-gray-700 p-2">
                        {q.grandTotal.toLocaleString("en-US")} Rs
                      </td>

                      <td className="border border-gray-700 p-2 text-green-400 font-semibold">
                        {calcTotalProfit(q).toLocaleString("en-US")} Rs
                      </td>
                    </tr>
                  ))}

                  {/* Totals */}
                  <tr className="bg-gray-800 font-bold text-center text-sm">
                    <td
                      colSpan={2}
                      className="border border-gray-700 p-2 text-right pr-4"
                    >
                      Totals:
                    </td>
                    <td className="border border-gray-700 p-2">
                      {totalAmount.toLocaleString("en-US")} Rs
                    </td>
                    <td className="border border-gray-700 p-2 text-green-400">
                      {netProfit.toLocaleString("en-US")} Rs
                    </td>
                  </tr>

                  {/* Monthly net profit */}
                  {filterType === "monthly" && (
                    <tr className="bg-gray-800 font-bold text-center text-sm">
                      <td
                        colSpan={2}
                        className="border border-gray-700 p-2 text-right pr-4"
                      >
                        Net Profit (
                        {new Date(year, month - 1).toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })}
                        ):
                      </td>
                      <td className="border border-gray-700 p-2 text-gray-200">
                        —
                      </td>
                      <td
                        className={`border border-gray-700 p-2 ${netMonthlyProfit >= 0
                          ? "text-green-400"
                          : "text-red-400"
                          }`}
                      >
                        {netMonthlyProfit.toLocaleString("en-US")} Rs
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 p-4">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex justify-between items-center mt-4">
            <button
              className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>

        {/* Pagination */}
      </span>
    </div>
  );
};

export default Reports;
