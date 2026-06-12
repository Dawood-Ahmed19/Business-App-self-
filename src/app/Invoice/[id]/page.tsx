"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { printInvoicePDF } from "@/utils/printInvoicePDF";

const InvoiceDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/quotations/${id}`);
        const data = await res.json();
        if (data.success) setInvoice(data.quotation);
      } catch (err) {
        console.error("❌ Error fetching invoice:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading)
    return <p className="text-white text-center p-6">Loading invoice…</p>;

  if (!invoice)
    return <p className="text-red-500 text-center p-6">Invoice not found</p>;

  // Totals
  const total = invoice.items.reduce(
    (sum: number, r: any) => sum + (r.amount || 0),
    0
  );
  // const grandTotal = total - (invoice.discount || 0) + (invoice.loading || 0);
  const grandTotal =
    total -
    (invoice.discount || 0) +
    (invoice.loading || 0) +
    (invoice.carriage || 0) +
    (invoice.bendingLabour || 0);

  const received =
    invoice.payments?.reduce(
      (sum: number, p: any) => sum + (p.amount || 0),
      0
    ) || 0;
  const balance = grandTotal - received;
  const isPaid = balance <= 0;

  // Item name helper
  const formatItemName = (r: any) => {
    const t = r.type?.toLowerCase();
    if (!t) return r.item;
    if (t === "pipe") return `${r.type} ${r.size || ""}`.trim();
    if (t === "hardware")
      return `${r.originalName || ""} ${r.size || ""} ${r.color || ""}`.trim();
    if (
      [
        "angle",
        "patti",
        "sarrya",
        "jali",
        "tanka barfi jali",
        "choras khana china jali",
      ].includes(t)
    ) {
      return `${r.type || ""} ${r.size || ""}`.trim();
    }
    return r.item;
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full">
      <div className="relative w-full max-w-3xl bg-dashboardBg p-6 rounded-lg shadow-lg overflow-hidden">
        {isPaid && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[30deg] text-[140px] font-extrabold text-white/5 tracking-widest pointer-events-none select-none z-0">
            PAID
          </div>
        )}

        <div className="relative z-10">
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-white text-black rounded hover:bg-gray-300"
            >
              ← Back
            </button>
            <button
              onClick={() => printInvoicePDF(invoice.quotationId)}
              className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
            >
              Print Invoice
            </button>
          </div>

          {invoice.customerName && (
            <p className="text-center text-white text-lg font-semibold mb-1">
              Customer: {invoice.customerName}
            </p>
          )}

          {invoice.contactNumber && (
            <p className="text-center text-gray-400 text-sm mb-1">
              Contact: {invoice.contactNumber}
            </p>
          )}

          {invoice.createdBy && (
            <p className="text-center text-gray-300 text-sm mb-2">
              Created by
              <span className="font-semibold text-white">
                {invoice.createdBy}
              </span>
            </p>
          )}

          <h1 className="text-2xl font-bold mb-1 text-center text-white">
            Invoice {invoice.quotationId}
          </h1>
          <p className="text-center text-gray-300 mb-6">
            Date {new Date(invoice.date).toLocaleDateString()} | Status:
            <span className="capitalize"> {invoice.status}</span>
          </p>

          {/* === Items Table === */}
          <div className="flex justify-center">

            <table className="text-white table-auto border-collapse border border-gray-600 w-full bg-transparent">
              <thead>
                <tr className="bg-bgColor text-center h-[40px]">
                  <th className="border border-white p-2 w-[50px]">Qty</th>
                  <th className="border border-white p-2 w-[50px]">Ft</th>
                  <th className="border border-white p-2 w-[180px]">Item</th>
                  <th className="border border-white p-2 w-[70px]">Gauge</th>
                  <th className="border border-white p-2 w-[70px]">Weight</th>
                  <th className="border border-white p-2 w-[100px]">Rate</th>
                  <th className="border border-white p-2 w-[100px]">Amount</th>
                </tr>
              </thead>
              <tbody className="align-top bg-transparent">
                {invoice.items.length > 0 ? (
                  invoice.items.map((r: any, i: number) => (
                    <tr key={r._id || i} className="text-center h-[32px]">
                      <td className="border border-white">{r.qty ?? ""}</td>
                      <td className="border border-white">{r.ft ?? ""}</td>
                      <td className="border border-white">{formatItemName(r)}</td>
                      <td className="border border-white">{r.guage || ""}</td>
                      <td className="border border-white">
                        {r.weight !== undefined && r.weight !== null && r.weight !== ""
                          ? Number(r.weight).toLocaleString("en-US")
                          : ""}
                      </td>
                      <td className="border border-white">
                        {Number(r.rate || 0).toLocaleString("en-US")}
                      </td>
                      <td className="border border-white">
                        {Number(r.amount || 0).toLocaleString("en-US")}
                      </td>
                    </tr>
                  ))
                ) : invoice.bendingLabour > 0 ? (
                  <tr className="text-center h-[32px]">
                    <td className="border border-white"></td>
                    <td className="border border-white"></td>
                    <td className="border border-white font-semibold">Bending Labour</td>
                    <td className="border border-white"></td>
                    <td className="border border-white"></td>
                    <td className="border border-white"></td>
                    <td className="border border-white font-semibold">
                      {Number(invoice.bendingLabour).toLocaleString("en-US")}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400">
                      No items
                    </td>
                  </tr>
                )}

                {/* Totals */}
                <tr className="font-bold">
                  <td colSpan={5}></td>
                  <td className="border border-white text-center">TOTAL</td>
                  <td className="border border-white text-center">
                    {total.toLocaleString("en-US")}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={5}></td>
                  <td className="border border-white text-center">DISCOUNT</td>
                  <td className="border border-white text-center">
                    {invoice.discount?.toLocaleString("en-US") || 0}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={5}></td>
                  <td className="border border-white text-center">LOADING</td>
                  <td className="border border-white text-center">
                    {invoice.loading?.toLocaleString("en-US") || 0}
                  </td>
                </tr>
                {invoice.items.length > 0 && invoice.bendingLabour > 0 && (
                  <tr className="font-bold">
                    <td colSpan={5}></td>
                    <td className="border border-white text-center">BENDING LABOUR</td>
                    <td className="border border-white text-center">
                      {invoice.bendingLabour?.toLocaleString("en-US") || 0}
                    </td>
                  </tr>
                )}
                <tr className="font-bold">
                  <td colSpan={5}></td>
                  <td className="border border-white text-center">CARRIAGE</td>
                  <td className="border border-white text-center">
                    {invoice.carriage?.toLocaleString("en-US") || 0}
                  </td>
                </tr>

                <tr className="font-bold">
                  <td colSpan={5}></td>
                  <td className="border border-white text-center">
                    GRAND TOTAL
                  </td>
                  <td className="border border-white text-center">
                    {grandTotal.toLocaleString("en-US")}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={5}></td>
                  <td className="border border-white text-center">RECEIVED</td>
                  <td className="border border-white text-center">
                    {received.toLocaleString("en-US")}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={5}></td>
                  <td className="border border-white text-center">BALANCE</td>
                  <td className="border border-white text-center">
                    {balance.toLocaleString("en-US")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payments */}
          <h2 className="mt-8 text-lg font-semibold text-white">
            Payments History
          </h2>
          {invoice.payments?.length ? (
            <ul className="list-disc pl-6 mt-2 text-gray-200">
              {invoice.payments.map((p: any, i: number) => (
                <li key={i}>
                  {new Date(p.date).toLocaleDateString()} —
                  {p.amount.toLocaleString("en-US")} Rs
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 mt-2">No payments recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
