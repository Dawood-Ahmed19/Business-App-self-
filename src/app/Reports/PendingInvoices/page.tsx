"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PendingInvoices() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 14;

    useEffect(() => {
        async function load() {
            setLoading(true);
            const res = await fetch("/api/invoices/pending");
            const data = await res.json();
            if (data.success) {
                const filtered = (data.invoices || []).filter((inv) => inv.balance > 1);
                setInvoices(filtered);
            }
            setLoading(false);
            setCurrentPage(1);
        }
        load();
    }, []);

    // Pagination logic
    const totalPages = Math.ceil(invoices.length / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const paginated = invoices.slice(startIndex, startIndex + pageSize);

    const totalDue = invoices.reduce((s, i) => s + (i.balance || 0), 0);

    if (loading)
        return <div className="text-center text-gray-400 mt-8">Loading invoices…</div>;

    return (
        <div className="p-8 text-white">
            {/* 👈 Go Back Button */}
            <button
                onClick={() => router.back()}
                className="mb-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-white font-medium"
            >
                ← Go Back
            </button>

            {/* Header */}
            <div className="flex justify-between mb-4 items-center">
                <h1 className="text-2xl font-semibold">Pending Invoices</h1>
                <div className="text-yellow-400 font-semibold">
                    Total Due: {totalDue.toLocaleString("en-US")} Rs
                </div>
            </div>

            {/* Data Table */}
            <div
                className="rounded-lg overflow-x-auto"
                style={{ backgroundColor: "var(--color-BgColor)" }}
            >
                <table className="w-full border-collapse text-sm min-w-[800px]">
                    <thead style={{ backgroundColor: "var(--color-cardBg)", color: "#ccc" }}>
                        <tr>
                            <th className="p-3 text-left">Date</th>
                            <th className="p-3 text-left">Invoice No</th>
                            <th className="p-3 text-left">Customer</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3 text-right">Remaining</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginated.length ? (
                            paginated.map((inv) => (
                                <tr
                                    key={inv._id}
                                    className="border-t border-gray-700 hover:bg-gray-800 cursor-pointer"
                                    onClick={() => router.push(`/Invoice/${inv._id}`)}
                                >
                                    <td className="p-3">
                                        {inv.date ? new Date(inv.date).toLocaleDateString() : "—"}
                                    </td>
                                    <td className="p-3 text-blue-400 underline">
                                        {inv.quotationId}
                                    </td>
                                    <td className="p-3">{inv.customerName}</td>
                                    <td className="p-3 text-right">
                                        {inv.grandTotal.toLocaleString("en-US")} Rs
                                    </td>
                                    <td className="p-3 text-right text-yellow-400 font-semibold">
                                        {inv.balance.toLocaleString("en-US")} Rs
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center text-gray-400 p-6">
                                    All invoices are paid.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {invoices.length > pageSize && (
                <div className="flex justify-between items-center mt-4">
                    <button
                        className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
                        onClick={() => setCurrentPage((p) => p - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span className="text-gray-300">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}