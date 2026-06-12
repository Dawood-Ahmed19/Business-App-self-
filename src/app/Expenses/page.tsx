"use client";

import { printExpenseSheet } from "@/utils/printExpenseSheet";
import { useEffect, useState } from "react";

interface ExpenseEntry {
  date: string;
  description: string;
  amount: number | "";
}

export default function ExpensesPage() {
  const now = new Date();
  const [startDay, setStartDay] = useState<number | null>(null);
  const [endDay, setEndDay] = useState<number | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string | null>(null);
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salaryTotal, setSalaryTotal] = useState(0);
  const [isClosed, setIsClosed] = useState(false);

  // Pagination state
  const ENTRIES_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Persist pagination page per month
  useEffect(() => {
    if (!currentMonth) return;
    const key = `expenses_currentPage_${currentMonth}`;
    const stored = localStorage.getItem(key);
    if (stored) setCurrentPage(Number(stored));
  }, [currentMonth]);

  useEffect(() => {
    if (!currentMonth) return;
    const key = `expenses_currentPage_${currentMonth}`;
    localStorage.setItem(key, String(currentPage));
  }, [currentPage, currentMonth]);

  const totalPages = Math.ceil(entries.length / ENTRIES_PER_PAGE);
  const paginatedEntries = entries.slice(
    (currentPage - 1) * ENTRIES_PER_PAGE,
    currentPage * ENTRIES_PER_PAGE
  );

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setStartDay(data.settings.financialStartDay || 1);
        setEndDay(data.settings.financialEndDay || 31);
      } else {
        setStartDay(1);
        setEndDay(31);
      }
    } catch {
      setStartDay(1);
      setEndDay(31);
    } finally {
      setSettingsLoaded(true);
    }
  };

  const getCompanyMonthKey = (today = new Date(), start = 1) => {
    const year = today.getFullYear();
    const month = today.getMonth();
    if (today.getDate() < start) {
      const prev = new Date(year, month - 1, 1);
      return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    }
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  };

  const fetchMonths = async () => {
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      if (data.success) {
        const list = data.months || [];
        if (list.length === 0) {
          const todayKey = getCompanyMonthKey(now, startDay || 1);
          setMonths([todayKey]);
        } else {
          setMonths(list);
        }
      }
    } catch (err) {
      console.error("Error fetching months:", err);
    }
  };

  const fetchEntries = async (month: string) => {
    setLoading(true);
    const res = await fetch(`/api/expenses?month=${month}`);
    const data = await res.json();

    if (data.success) {
      setEntries(data.entries || data.expenses || []);
      setIsClosed(data.status === "closed");
    } else {
      setEntries([]);
      setIsClosed(false);
    }

    const salaryRes = await fetch(`/api/salaries/total?month=${month}`);
    const salaryData = await salaryRes.json();
    if (salaryData.success) setSalaryTotal(salaryData.total);
    else setSalaryTotal(0);

    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!settingsLoaded || startDay === null) return;
    const key = getCompanyMonthKey(now, startDay);
    setCurrentMonth(key);
    fetchMonths();
  }, [settingsLoaded]);

  useEffect(() => {
    if (currentMonth) fetchEntries(currentMonth);
  }, [currentMonth]);

  const activeMonthKey = getCompanyMonthKey(now, startDay || 1);
  const isEditable = currentMonth === activeMonthKey && !isClosed;

  useEffect(() => {
    if (loading || !currentMonth || !isEditable) return;
    if (entries.length === 0) return;

    const timeout = setTimeout(() => {
      saveEntries();
    }, 1200);

    return () => clearTimeout(timeout);
  }, [entries, currentMonth]);

  const saveEntries = async () => {
    if (!currentMonth) return;

    const cleanEntries = entries.map((e) => ({
      date: e.date,
      description: e.description.trim(),
      amount: Number(e.amount) || 0,
    }));

    try {
      setSaving(true);
      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: currentMonth,
          entries: cleanEntries,
        }),
      });
    } finally {
      setSaving(false);
    }
  };

  // Add row: stay on current page, or go to new last page if overflow
  const addRow = () => {
    const today = new Date().toISOString().split("T")[0];
    const newEntries = [
      ...entries,
      { date: today, description: "", amount: 0 }, // <-- FIXED: amount is a number
    ];
    setEntries(newEntries);

    // If new row overflows current page, go to new last page
    const newTotalPages = Math.ceil(newEntries.length / ENTRIES_PER_PAGE);
    if (currentPage < newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  };

  // Remove row: remove by absolute index
  const removeRow = (absoluteIndex: number) => {
    const newEntries = entries.filter((_, idx) => idx !== absoluteIndex);
    setEntries(newEntries);

    // If current page is now out of range, go to last page
    const newTotalPages = Math.max(
      1,
      Math.ceil(newEntries.length / ENTRIES_PER_PAGE)
    );
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  };

  const updateField = (
    index: number,
    field: keyof ExpenseEntry,
    value: any
  ) => {
    const updated = [...entries];

    if (field === "amount") {
      updated[index].amount = value === "" ? "" : Number(value);
    } else {
      updated[index][field] = value;
    }

    setEntries(updated);
  };

  const endMonth = async () => {
    if (!confirm("End this month and start a new one?")) return;
    if (!currentMonth || startDay === null) return;

    try {
      await fetch("/api/expenses/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: currentMonth }),
      });
    } catch (err) {
      console.error("Error closing month:", err);
    }

    const currentDate = new Date();
    const thisPeriodStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      startDay
    );
    const nextPeriodStart = new Date(
      thisPeriodStart.getFullYear(),
      thisPeriodStart.getMonth() + 1,
      startDay
    );
    const nextKey = `${nextPeriodStart.getFullYear()}-${String(
      nextPeriodStart.getMonth() + 1
    ).padStart(2, "0")}`;

    setCurrentMonth(nextKey);
    setEntries([]);
    fetchMonths();
  };

  const total = entries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const formatMonthName = (m: string) =>
    new Date(`${m}-01`).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

  if (!settingsLoaded || startDay === null)
    return <p className="text-white p-6">Loading settings...</p>;

  return (
    <div className="flex justify-center items-start w-full mt-14 px-5">
      <div className="w-full max-w-4xl bg-dashboardBg p-10 rounded-2xl text-white shadow-lg space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between gap-5">
          <div>
            <h1 className="text-2xl font-semibold">
              {currentMonth ? formatMonthName(currentMonth) : ""}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Starts on day {startDay}, ends on {endDay}
            </p>
          </div>
          <div className="flex gap-3 md:items-center">
            <select
              value={currentMonth ?? ""}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="bg-[#2a2a3c] border border-gray-600 text-white px-4 py-2 rounded-md focus:outline-none"
            >
              {months.length === 0 ? (
                <option>Loading months...</option>
              ) : (
                months
                  .sort((a, b) => (a < b ? 1 : -1))
                  .map((m) => (
                    <option key={m} value={m}>
                      {formatMonthName(m)}
                    </option>
                  ))
              )}
            </select>
            <button
              onClick={endMonth}
              disabled={!isEditable}
              className={`px-4 py-2 rounded-md font-medium ${
                isEditable
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-700 cursor-not-allowed text-gray-400"
              }`}
            >
              End Month
            </button>
          </div>
        </div>

        {!isEditable && (
          <div className="text-center text-sm text-gray-400 pb-3 italic">
            Viewing archived month — editing disabled
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-10">Loading...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-300 border-b border-gray-700">
                    <th className="py-3 w-[120px]">Date</th>
                    <th className="py-3">Description</th>
                    <th className="py-3 w-[120px] text-right">Amount</th>
                    <th className="py-3 w-[60px] text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center text-gray-500 py-6 italic"
                      >
                        No expenses recorded for this month.
                      </td>
                    </tr>
                  ) : (
                    paginatedEntries.map((entry, i) => {
                      const absoluteIndex =
                        (currentPage - 1) * ENTRIES_PER_PAGE + i;
                      return (
                        <tr
                          key={absoluteIndex}
                          className={`border-b border-gray-800 ${
                            isEditable
                              ? "hover:bg-[#2b2b3a] transition-colors"
                              : "opacity-70"
                          }`}
                        >
                          <td className="py-3 pr-4">
                            <input
                              type="date"
                              value={entry.date}
                              onChange={(e) =>
                                updateField(
                                  absoluteIndex,
                                  "date",
                                  e.target.value
                                )
                              }
                              readOnly={!isEditable}
                              disabled={!isEditable}
                              className="bg-transparent outline-none w-full text-center text-white"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="text"
                              placeholder="Description..."
                              value={entry.description}
                              onChange={(e) =>
                                updateField(
                                  absoluteIndex,
                                  "description",
                                  e.target.value
                                )
                              }
                              readOnly={!isEditable}
                              disabled={!isEditable}
                              className="bg-transparent outline-none w-full"
                            />
                          </td>
                          <td className="py-3 pl-4 text-right">
                            <input
                              type="number"
                              placeholder="0"
                              value={entry.amount}
                              onChange={(e) =>
                                updateField(
                                  absoluteIndex,
                                  "amount",
                                  e.target.value
                                )
                              }
                              readOnly={!isEditable}
                              disabled={!isEditable}
                              className="bg-transparent outline-none text-right w-full"
                            />
                          </td>
                          <td className="py-3 text-center">
                            {isEditable && (
                              <button
                                onClick={() => removeRow(absoluteIndex)}
                                className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-white text-xs"
                                type="button"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {entries.length > ENTRIES_PER_PAGE && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-white">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}

            <div className="flex justify-between items-center pt-6">
              <button
                onClick={addRow}
                disabled={!isEditable}
                className={`px-4 py-2 rounded-md font-medium ${
                  isEditable
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-700 cursor-not-allowed text-gray-400"
                }`}
              >
                + Add Row
              </button>
              {!isEditable && (
                <button
                  onClick={() => printExpenseSheet(currentMonth!)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md font-medium"
                >
                  Print Sheet
                </button>
              )}
              <div className="text-right space-y-1">
                <div className="text-right space-y-1 mt-4">
                  <p>
                    <span className="text-gray-400">Monthly Expenses: </span>
                    <span className="text-yellow-400">
                      {total.toLocaleString("en-US")} Rs
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-400">Salaries Paid: </span>
                    <span className="text-green-400">
                      {salaryTotal.toLocaleString("en-US")} Rs
                    </span>
                  </p>
                  <p className="text-lg font-semibold">
                    <span className="text-gray-300">Grand Total: </span>
                    <span className="text-orange-400">
                      {(total + salaryTotal).toLocaleString("en-US")} Rs
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {saving && (
              <p className="text-sm mt-3 text-yellow-400 text-right">
                Saving changes...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
