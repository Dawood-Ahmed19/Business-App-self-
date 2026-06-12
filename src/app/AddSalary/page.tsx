"use client";

import { useEffect, useState } from "react";

interface Employee {
  _id: string;
  name: string;
  role?: string;
  monthlySalary: number;
}

interface SalaryRecord {
  employeeId: string;
  month: string;
  year: number;
  totalSalary: number;
  paidAmount: number;
  advancePaid: number;
  fullyPaid?: boolean;
  balanceRemaining?: number;
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function SalariesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<SalaryRecord[]>([]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  const [advanceAmount, setAdvanceAmount] = useState("");
  const [payAmount, setPayAmount] = useState("");

  useEffect(() => {
    fetchEmployees();
    fetchSalaryRecords();
  }, []);

  async function fetchEmployees() {
    const res = await fetch("/api/employees");
    const data = await res.json();
    setEmployees(data.employees);
  }

  async function fetchSalaryRecords() {
    const res = await fetch("/api/salaries");
    const data = await res.json();
    setRecords(data);
  }

  function getMonthKey(year = selectedYear, month = selectedMonth) {
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  }

  function getRecord(empId: string) {
    return records.find(
      (r) =>
        r.employeeId === empId &&
        r.month === getMonthKey() &&
        r.year === selectedYear
    );
  }

  function openAdvanceModal(emp: Employee) {
    setSelectedEmp(emp);
    setAdvanceAmount("");
    setShowAdvanceModal(true);
  }

  function openPayModal(emp: Employee) {
    setSelectedEmp(emp);
    setPayAmount("");
    setShowPayModal(true);
  }

  async function handleAdvance() {
    if (!selectedEmp || !advanceAmount) return;
    const amount = Number(advanceAmount);
    if (amount <= 0) return;

    const totalSalary = selectedEmp.monthlySalary;
    const balance = totalSalary - amount;

    const payload: SalaryRecord = {
      employeeId: selectedEmp._id,
      month: getMonthKey(),
      year: selectedYear,
      totalSalary,
      paidAmount: 0,
      advancePaid: amount,
      balanceRemaining: balance,
      fullyPaid: balance <= 0,
    };

    await fetch("/api/salaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setShowAdvanceModal(false);
    fetchSalaryRecords();
  }

  async function handlePartialPay() {
    if (!selectedEmp || !payAmount) return;

    const record = getRecord(selectedEmp._id);
    const alreadyPaid = Number(record?.paidAmount || 0);
    const alreadyAdvance = Number(record?.advancePaid || 0);
    const totalSalary = selectedEmp.monthlySalary;

    const remaining = totalSalary - alreadyPaid - alreadyAdvance;
    const amount = Number(payAmount);
    if (amount <= 0) return;
    if (amount > remaining) {
      alert("Amount exceeds remaining balance");
      return;
    }

    const payload: SalaryRecord = {
      employeeId: selectedEmp._id,
      month: getMonthKey(),
      year: selectedYear,
      totalSalary,
      paidAmount: amount,
      advancePaid: 0,
      balanceRemaining: remaining - amount,
      fullyPaid: amount + alreadyAdvance >= totalSalary,
    };

    await fetch("/api/salaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setShowPayModal(false);
    fetchSalaryRecords();
  }

  const getStatus = (emp: Employee) => {
    const record = getRecord(emp._id);
    const paid = Number(record?.paidAmount || 0);
    const advance = Number(record?.advancePaid || 0);
    const total = emp.monthlySalary;

    if (paid + advance === 0) return "Unpaid";
    if (paid + advance >= total) return "Paid";
    return "Partial";
  };

  return (
    <div className="w-full p-8 text-white">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-white">Pay Salaries</h2>

        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 rounded-md text-sm text-white outline-none"
            style={{ backgroundColor: "var(--color-cardBg)" }}
          >
            {months.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-md text-sm text-white outline-none"
            style={{ backgroundColor: "var(--color-cardBg)" }}
          >
            {Array.from({ length: 5 }, (_, i) => selectedYear - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: "var(--color-BgColor)" }}
      >
        <table className="w-full border-collapse text-sm">
          <thead
            style={{ backgroundColor: "var(--color-cardBg)", color: "#ccc" }}
          >
            <tr>
              <th className="text-left p-3">S.no</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Salary</th>
              <th className="text-left p-3">Advance</th>
              <th className="text-left p-3">Paid</th>
              <th className="text-left p-3">Balance</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, index) => {
              const record = getRecord(emp._id);
              const paid = Number(record?.paidAmount || 0);
              const advance = Number(record?.advancePaid || 0);
              const total = emp.monthlySalary;
              const balance = Math.max(total - paid - advance, 0);
              const status = getStatus(emp);

              return (
                <tr
                  key={emp._id}
                  className="border-t text-gray-200"
                  style={{ borderColor: "var(--color-cardBg)" }}
                >
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{emp.name}</td>
                  <td className="p-3">{total}</td>
                  <td className="p-3">{advance}</td>
                  <td className="p-3">{paid}</td>
                  <td className="p-3">{balance}</td>
                  <td
                    className="p-3 font-medium"
                    style={{
                      color:
                        status === "Paid"
                          ? "#22c55e"
                          : status === "Partial"
                            ? "var(--color-iconColor)"
                            : "#ef4444",
                    }}
                  >
                    {status}
                  </td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => openPayModal(emp)}
                      disabled={status === "Paid"}
                      className="px-4 py-1 text-sm rounded-md font-semibold transition-all"
                      style={{
                        backgroundColor:
                          status === "Paid"
                            ? "var(--color-cardBg)"
                            : "var(--color-iconColor)",
                        color: "white",
                        opacity: status === "Paid" ? 0.6 : 1,
                      }}
                    >
                      {status === "Paid" ? "Paid" : "Pay Now"}
                    </button>
                    <button
                      onClick={() => openAdvanceModal(emp)}
                      className="px-3 py-1 text-sm rounded-md font-semibold"
                      style={{
                        backgroundColor: "var(--color-IconBg)",
                        color: "white",
                      }}
                    >
                      Advance
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ADVANCE MODAL */}
      {showAdvanceModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 rounded-md shadow-xl w-[360px]" style={{ backgroundColor: "var(--color-IconBg)" }}>
            <h3 className="text-lg font-semibold mb-4 text-white">
              Advance Payment for {selectedEmp?.name}
            </h3>

            <input
              type="number"
              placeholder="Enter advance amount"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-white mb-5 outline-none"
              style={{ backgroundColor: "var(--color-cardBg)" }}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="px-4 py-2 rounded-md font-semibold"
                style={{ backgroundColor: "var(--color-cardBg)", color: "white" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdvance}
                className="px-4 py-2 rounded-md font-semibold"
                style={{ backgroundColor: "var(--color-iconColor)", color: "white" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAY MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50  bg-black/30 backdrop-blur-sm">
          <div className="p-6 rounded-md shadow-xl w-[360px] bg-gray-900">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Pay Salary for {selectedEmp?.name}
            </h3>

            <input
              type="number"
              placeholder="Enter pay amount"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-white mb-5 outline-none"
              style={{ backgroundColor: "var(--color-cardBg)" }}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPayModal(false)}
                className="px-4 py-2 rounded-md font-semibold"
                style={{ backgroundColor: "var(--color-cardBg)", color: "white" }}
              >
                Cancel
              </button>
              <button
                onClick={handlePartialPay}
                className="px-4 py-2 rounded-md font-semibold"
                style={{ backgroundColor: "var(--color-iconColor)", color: "white" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}