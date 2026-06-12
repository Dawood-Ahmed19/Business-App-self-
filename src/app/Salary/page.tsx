"use client";
import { use, useEffect, useState } from "react";

export default function SalariesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    role: "",
    monthlySalary: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const [searchEmployee, setSearchEmployee] = useState("");

  async function fetchEmployees(page = 1, query = "") {
    const url = new URL(`/api/employees`, window.location.origin);
    url.searchParams.append("page", page.toString());
    if (query) url.searchParams.append("search", query);

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setEmployees(data.employees);
      setTotalPages(Math.ceil(data.total / limit));
    }
  }

  useEffect(() => {
    fetchEmployees(currentPage, searchEmployee);
  }, [currentPage, searchEmployee]);

  async function handleAddEmployee() {
    if (!newEmployee.name || !newEmployee.role || !newEmployee.monthlySalary)
      return;

    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newEmployee,
        createdAt: new Date().toISOString(),
      }),
    });

    if (res.ok) {
      setNewEmployee({ name: "", role: "", monthlySalary: "" });
      fetchEmployees(currentPage);
    }
  }

  return (
    <div className="w-full p-8 text-white flex flex-col">
      <h2 className="text-2xl font-semibold mb-6 text-white">Employees</h2>

      <div className="flex items-center gap-3 mb-4 px-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchEmployee}
          onChange={(e) => {
            setCurrentPage(1);
            setSearchEmployee(e.target.value);
          }}
          className="px-4 py-2 text-sm rounded-md text-white outline-none focus:ring-2 w-[250px]"
          style={{
            backgroundColor: "var(--color-cardBg)",
            border: "1px solid var(--color-IconBg)",
          }}
        />
      </div>

      {/* Add employee section */}
      <div
        className="flex items-center gap-3 p-4 mb-6 rounded-md"
        style={{ backgroundColor: "var(--color-BgColor)" }}
      >
        {/* Inputs */}
        <input
          placeholder="Name"
          value={newEmployee.name}
          onChange={(e) =>
            setNewEmployee({ ...newEmployee, name: e.target.value })
          }
          className="px-4 py-2 text-sm rounded-md text-white outline-none focus:ring-2 w-[200px]"
          style={{
            backgroundColor: "var(--color-cardBg)",
            border: "1px solid var(--color-IconBg)",
          }}
        />
        <input
          placeholder="Role"
          value={newEmployee.role}
          onChange={(e) =>
            setNewEmployee({ ...newEmployee, role: e.target.value })
          }
          className="px-4 py-2 text-sm rounded-md text-white outline-none focus:ring-2 w-[200px]"
          style={{
            backgroundColor: "var(--color-cardBg)",
            border: "1px solid var(--color-IconBg)",
          }}
        />
        <input
          type="number"
          placeholder="Monthly Salary"
          value={newEmployee.monthlySalary}
          onChange={(e) =>
            setNewEmployee({ ...newEmployee, monthlySalary: e.target.value })
          }
          className="px-4 py-2 text-sm rounded-md text-white outline-none focus:ring-2 w-[180px]"
          style={{
            backgroundColor: "var(--color-cardBg)",
            border: "1px solid var(--color-IconBg)",
          }}
        />
        <button
          onClick={handleAddEmployee}
          className="px-5 py-2 rounded-md font-semibold text-sm transition-all"
          style={{
            backgroundColor: "var(--color-iconColor)",
            color: "white",
          }}
        >
          Add
        </button>
      </div>

      {/* Table */}
      <div
        className="rounded-lg overflow-hidden mb-6"
        style={{ backgroundColor: "var(--color-BgColor)" }}
      >
        <table className="w-full border-collapse text-sm">
          <thead
            style={{ backgroundColor: "var(--color-cardBg)", color: "#ccc" }}
          >
            <tr>
              <th className="text-left p-3">S.no</th>
              <th className="text-left p-3">Employee Name</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Monthly Salary</th>
              <th className="text-left p-3">Date Added</th>
            </tr>
          </thead>
          <tbody>
            {employees.length > 0 ? (
              employees.map((emp, index) => (
                <tr
                  key={emp._id}
                  className="border-t text-gray-200"
                  style={{ borderColor: "var(--color-cardBg)" }}
                >
                  <td className="p-3">
                    {(currentPage - 1) * limit + index + 1}
                  </td>
                  <td className="p-3">{emp.name}</td>
                  <td className="p-3">{emp.role}</td>
                  <td className="p-3">{emp.monthlySalary}</td>
                  <td className="p-3">
                    {emp.createdAt
                      ? new Date(emp.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="text-center p-6 text-gray-500"
                  style={{ backgroundColor: "var(--color-dashboardBg)" }}
                >
                  No employees added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-md border border-gray-500 disabled:opacity-30"
          >
            Prev
          </button>

          <span>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-md border border-gray-500 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

