"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  returnValue?: number;
}

interface ReturnRecord {
  returnId: string;
  referenceInvoice: string;
  createdAt: string;
  itemsReturned: ReturnItem[];
}

const ShowReturned = () => {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/returns")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.returns)) {
          setReturns(data.returns);
        } else {
          setReturns([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setReturns([]);
        setLoading(false);
      });
  }, []);

  // Filter by Return ID or Reference Invoice
  const filteredReturns = returns.filter(
    (r) =>
      r.returnId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referenceInvoice.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const router = useRouter();
  return (
    <div className="relative w-full bg-cardBg rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center px-[50px] py-[20px]">
        <p className="text-lg text-white">Returned Invoices</p>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by Return ID or Invoice ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 rounded text-sm border border-gray-600 text-white bg-fieldBg focus:ring-0 focus:outline-none"
          />
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center justify-between h-[50px] w-full bg-fieldBg px-[50px]">
        <span className="text-white text-xs w-[120px]">Return ID</span>
        <span className="text-white text-xs w-[120px]">Reference Invoice</span>
        <span className="text-white text-xs w-[120px]">Date</span>
        <span className="text-white text-xs w-[120px] text-center">Refund</span>
        <span className="text-white text-xs w-[120px] text-center">Actions</span>
      </div>

      {/* Table Body */}
      <div className="relative flex flex-col px-[50px] py-[10px] max-h-[400px] overflow-y-auto">
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : filteredReturns.length === 0 ? (
          <p className="text-gray-400 text-sm">No returned invoices found.</p>
        ) : (
          filteredReturns.map((r, idx) => {
            // Calculate total refund for this return
            const totalRefund = r.itemsReturned.reduce(
              (sum, item) => sum + (item.refundAmount || 0),
              0
            );
            return (
              <div key={r.returnId}>
                <div
                  className="flex items-center justify-between hover:bg-BgColor px-0 py-[10px] hover:cursor-pointer rounded"
                >
                  <span className="w-[120px] font-mono text-white text-xs">{r.returnId}</span>
                  <span className="w-[120px] font-mono text-white text-xs">{r.referenceInvoice}</span>
                  <span className="w-[120px] text-white text-xs">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                  <span className="w-[120px] text-white text-xs text-center">
                    {totalRefund.toLocaleString("en-US")} Rs
                  </span>
                  <span className="w-[160px] text-center flex gap-2 justify-center">

                    <button
                      className="text-purple-400 hover:cursor-pointer"
                      onClick={() => router.push(`/Returned/${r.returnId}`)}
                    >
                      View Invoice
                    </button>
                  </span>
                </div>
                <hr className="text-white opacity-20" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ShowReturned;