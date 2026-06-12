"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { printReturnPDF } from "@/utils/printReturnedPDF";

interface ReturnItem {
  itemName: string;
  originalName?: string;
  qty?: number;
  ft?: number;
  weight?: number;
  rate: number;
  refundAmount: number;
  refundProfit?: number;
  refundWeight?: number;
  type?: string;
  size?: string;
  guage?: string | number;
  gote?: string | number;
  color?: string;
  returnValue?: number; // legacy
  soldBy?: string;

  // NEW: explicit returned quantities from backend
  returnQty?: number;
  returnFt?: number;
  returnKg?: number;
}

interface ReturnRecord {
  returnId: string;
  referenceInvoice: string;
  createdAt: string;
  itemsReturned: ReturnItem[];
}

export default function ReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [returnRecord, setReturnRecord] = useState<ReturnRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReturn = async () => {
      try {
        const res = await fetch(`/api/returns/${id}`);
        const data = await res.json();
        if (data.success) setReturnRecord(data.returnRecord);
      } catch (err) {
        console.error("Error fetching return:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReturn();
  }, [id]);

  if (loading)
    return <p className="text-white text-center p-6">Loading return…</p>;

  if (!returnRecord)
    return (
      <p className="text-red-500 text-center p-6">Return record not found</p>
    );

  const totalRefund = returnRecord.itemsReturned.reduce(
    (acc: number, row: ReturnItem) => acc + (row.refundAmount || 0),
    0
  );

  const formatItemName = (row: ReturnItem) => {
    const type = row.type?.toLowerCase();
    if (type === "pipe" || type === "diamond chadar") {
      return `${row.type || ""} ${row.size || ""} ${row.guage || ""}`.trim();
    }
    if (type === "pillar" || type === "pillars") {
      return `${row.type || ""} ${row.size || ""} ${row.guage || ""} ${row.gote || ""
        }`.trim();
    }
    if (type === "hardware") {
      return `${row.originalName || row.itemName || ""} ${row.size || ""} ${row.color || ""
        }`.trim();
    }
    return `${row.itemName || row.originalName || ""} ${row.size || ""} ${row.guage || ""
      }`.trim();
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full">
      <div className="relative w-full max-w-3xl bg-dashboardBg p-6 rounded-lg shadow-lg overflow-hidden">
        <div className="relative z-10">
          <button
            onClick={() => router.back()}
            className="mb-4 px-4 py-2 bg-white text-black rounded hover:bg-gray-300"
          >
            ← Back
          </button>

          <button
            onClick={async () => {
              await printReturnPDF(returnRecord.returnId);
            }}
            className="mb-4 ml-3 px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
          >
            Print Invoice
          </button>

          <h1 className="text-2xl font-bold mb-2 text-center text-white">
            Return {returnRecord.returnId}
          </h1>
          <p className="text-center text-gray-300 mb-6">
            Date: {new Date(returnRecord.createdAt).toLocaleDateString()} | Ref
            Invoice: {returnRecord.referenceInvoice}
          </p>

          <div className="flex justify-center">
            <table className="text-white table-auto border-collapse border border-gray-600 w-full bg-transparent">
              <thead>
                <tr className="bg-bgColor text-center h-[40px]">
                  <th className="border border-white p-2 w-[60px]">Qty</th>
                  <th className="border border-white p-2 w-[60px]">Ft</th>
                  <th className="border border-white p-2 w-[200px]">Item</th>
                  <th className="border border-white p-2 w-[80px]">Guage</th>
                  <th className="border border-white p-2 w-[80px]">Weight</th>
                  <th className="border border-white p-2 w-[100px]">Rate</th>
                  <th className="border border-white p-2 w-[100px]">Refund</th>
                </tr>
              </thead>
              <tbody className="align-top bg-transparent">
                {returnRecord.itemsReturned.map((row, i) => {
                  const soldBy = row.soldBy?.toLowerCase();

                  let showQty: number | "" = "";
                  let showFt: number | "" = "";
                  let showKg: number | "" = "";

                  if (soldBy === "pipe") {
                    // qty
                    const qty =
                      row.returnQty ??
                      row.returnValue ??
                      row.qty ??
                      0;

                    showQty = qty || "";


                    if (row.returnFt != null) {
                      showFt = row.returnFt;
                    } else if (row.ft != null) {
                      showFt = row.ft;
                    } else if (qty) {
                      showFt = qty * 20; // fallback for old data
                    }
                  } else if (soldBy === "qty") {
                    showQty =
                      row.returnQty ??
                      row.returnValue ??
                      row.qty ??
                      "";
                  } else if (soldBy === "ft") {
                    showFt =
                      row.returnFt ??
                      row.returnValue ??
                      row.ft ??
                      "";
                  } else if (soldBy === "kg") {
                    showKg =
                      row.returnKg ??
                      row.returnValue ??
                      row.weight ??
                      "";
                  }

                  return (
                    <tr key={i} className="text-center h-[30px] bg-transparent">
                      <td className="border border-white">{showQty}</td>
                      <td className="border border-white">{showFt}</td>
                      <td className="border border-white">{formatItemName(row)}</td>
                      <td className="border border-white">{row.guage || ""}</td>
                      <td className="border border-white">{showKg}</td>
                      <td className="border border-white">
                        {Number(row.rate).toLocaleString("en-US")}
                      </td>
                      <td className="border border-white">
                        {Number(row.refundAmount).toLocaleString("en-US")}
                      </td>
                    </tr>
                  );
                })}

                {/* Totals */}
                <tr className="font-bold">
                  <td colSpan={6}></td>
                  <td className="border border-white text-center">
                    {totalRefund.toLocaleString("en-US")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}