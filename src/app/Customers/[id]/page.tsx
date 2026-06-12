"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CustomerProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Payment modal state
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const custRes = await fetch(`/api/customers/${id}`);
      const custData = await custRes.json();
      if (custData.success) setCustomer(custData.customer);

      const invRes = await fetch(`/api/customers/${id}/invoices`);
      const invData = await invRes.json();
      if (invData.success) setInvoices(invData.invoices);

      setLoading(false);
    }
    if (id) fetchData();
  }, [id]);

  // Calculate total balance (no decimals)
  const totalBalance = invoices.reduce(
    (sum, inv) =>
      sum + (typeof inv.balance === "number" ? Math.floor(inv.balance) : 0),
    0
  );

  // Handle Add Payment
  const handleAddPayment = async (e: any) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    let amount = parseInt(paymentAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setError("Enter a valid amount.");
      setIsSubmitting(false);
      return;
    }
    if (amount > totalBalance) {
      setError("Amount cannot be more than total balance.");
      setIsSubmitting(false);
      return;
    }

    // Distribute payment to invoices (oldest first)
    let remaining = amount;
    const unpaid = invoices
      .filter((inv) => typeof inv.balance === "number" && inv.balance >= 1)
      .sort(
        (a, b) =>
          new Date(a.date as string).getTime() -
          new Date(b.date as string).getTime()
      );

    for (const inv of unpaid) {
      if (remaining <= 0) break;
      const pay = Math.min(Math.floor(inv.balance), remaining);
      // Call your API to add payment to this invoice
      await fetch(`/api/quotations/${inv._id}/addPayments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: pay,
          date: new Date().toISOString(),
        }),
      });
      remaining -= pay;
    }

    setShowAddPayment(false);
    setPaymentAmount("");
    setIsSubmitting(false);

    // Refresh invoices
    const invRes = await fetch(`/api/customers/${id}/invoices`);
    const invData = await invRes.json();
    if (invData.success) setInvoices(invData.invoices);
  };

  return (
    <div className="w-full p-8 text-white flex flex-col">
      <button
        onClick={() => router.back()}
        className="self-start mb-4 px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-white font-medium"
        style={{ maxWidth: 120 }}
      >
        ← Back
      </button>
      <h2 className="text-2xl font-semibold mb-6 text-white">
        Customer Details
      </h2>
      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : !customer ? (
        <div className="text-center text-red-400">Customer not found.</div>
      ) : (
        <>
          <div className="mb-6">
            <div className="text-lg font-bold">{customer.name}</div>
            <div className="text-sm text-gray-400">
              Added:{" "}
              {customer.createdAt
                ? new Date(customer.createdAt).toLocaleDateString()
                : "—"}
            </div>
          </div>

          {/* Total Balance Display and Add Payment Button */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Invoices</h3>
            <div className="flex items-center gap-4">
              <div className="text-lg font-semibold text-right">
                Total Balance:{" "}
                {totalBalance < 1 ? (
                  <span className="text-green-400">Paid</span>
                ) : (
                  <span className="text-yellow-400">
                    {totalBalance.toLocaleString("en-US")}
                  </span>
                )}
              </div>
              {totalBalance > 0 && (
                <button
                  disabled
                  title="Working on this feature"
                  className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium disabled:bg-gray-700"
                  onClick={() => setShowAddPayment(true)}
                >
                  Add Payment
                </button>
              )}
            </div>
          </div>

          {/* Add Payment Modal */}
          {showAddPayment && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-xs">
                <h2 className="text-lg font-bold mb-4">Add Payment</h2>
                <form
                  onSubmit={handleAddPayment}
                  className="flex flex-col gap-3"
                >
                  <input
                    type="number"
                    min={1}
                    max={totalBalance}
                    step={1}
                    value={paymentAmount}
                    onChange={(e) =>
                      setPaymentAmount(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Enter amount"
                    className="p-2 rounded bg-gray-800 text-white border border-gray-600"
                  />
                  <div className="text-sm text-gray-400">
                    Max: {totalBalance.toLocaleString("en-US")}
                  </div>
                  {error && <div className="text-red-400 text-sm">{error}</div>}
                  <div className="flex gap-2 mt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium"
                    >
                      {isSubmitting ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPayment(false);
                        setPaymentAmount("");
                        setError("");
                      }}
                      className="flex-1 px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div
            className="rounded-lg overflow-x-auto mb-6"
            style={{ backgroundColor: "var(--color-BgColor)" }}
          >
            <table className="w-full border-collapse text-sm min-w-[700px]">
              <thead
                style={{
                  backgroundColor: "var(--color-cardBg)",
                  color: "#ccc",
                }}
              >
                <tr>
                  <th className="text-left p-3">Invoice ID</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Balance</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr
                      key={inv._id}
                      className="border-t text-gray-200"
                      style={{ borderColor: "var(--color-cardBg)" }}
                    >
                      <td className="p-3">{inv.quotationId}</td>
                      <td className="p-3">
                        {inv.date
                          ? new Date(inv.date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-3">
                        {inv.grandTotal
                          ? Math.floor(inv.grandTotal).toLocaleString("en-US")
                          : "—"}
                      </td>
                      <td className="p-3">
                        {typeof inv.balance === "number" && inv.balance < 1 ? (
                          <span className="text-green-400 font-semibold">
                            Paid
                          </span>
                        ) : typeof inv.balance === "number" ? (
                          Math.floor(inv.balance).toLocaleString("en-US")
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          className="text-blue-400 hover:underline"
                          onClick={() => router.push(`/Invoice/${inv._id}`)}
                        >
                          View Invoice
                        </button>
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
                      No invoices for this customer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
