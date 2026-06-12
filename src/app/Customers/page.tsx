"use client";
import { useEffect, useState } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  async function fetchCustomers(page = 1, query = "") {
    const url = new URL(`/api/customers`, window.location.origin);
    url.searchParams.append("page", page.toString());
    if (query) url.searchParams.append("search", query);

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setCustomers(data.customers);
      setTotalPages(
        Math.max(1, Math.ceil((data.total || data.customers.length) / limit))
      );
    }
  }

  useEffect(() => {
    fetchCustomers(currentPage, searchCustomer);
  }, [currentPage, searchCustomer]);

  return (
    <div className="w-full p-8 text-white flex flex-col">
      <h2 className="text-2xl font-semibold mb-6 text-white">Customers</h2>

      <div className="flex items-center gap-3 mb-4 px-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchCustomer}
          onChange={(e) => {
            setCurrentPage(1);
            setSearchCustomer(e.target.value);
          }}
          className="px-4 py-2 text-sm rounded-md text-white outline-none focus:ring-2 w-[250px]"
          style={{
            backgroundColor: "var(--color-cardBg)",
            border: "1px solid var(--color-IconBg)",
          }}
        />
      </div>

      {/* Table */}
      <div
        className="rounded-lg mb-6"
        style={{
          backgroundColor: "var(--color-BgColor)",
          maxHeight: "calc(100vh - 260px)", // fits both 1920px and 1280px screens
          overflowY: "auto",
        }}
      >
        <table className="w-full border-collapse text-sm">
          <thead
            style={{ backgroundColor: "var(--color-cardBg)", color: "#ccc" }}
          >
            <tr>
              <th className="text-left p-3">S.no</th>
              <th className="text-left p-3">Customer Name</th>
              <th className="text-left p-3">Date Added</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              customers.map((cust, index) => (
                <tr
                  key={cust._id}
                  className="border-t text-gray-200"
                  style={{ borderColor: "var(--color-cardBg)" }}
                >
                  <td className="p-3">
                    {(currentPage - 1) * limit + index + 1}
                  </td>
                  <td className="p-3">{cust.name}</td>
                  <td className="p-3">
                    {cust.createdAt
                      ? new Date(cust.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3">
                    <button
                      className="text-blue-400 hover:underline"
                      onClick={() =>
                        window.location.assign(`/Customers/${cust._id}`)
                      }
                    >
                      View Invoices
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="text-center p-6 text-gray-500"
                  style={{ backgroundColor: "var(--color-dashboardBg)" }}
                >
                  No customers found.
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
