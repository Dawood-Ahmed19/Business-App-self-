"use client";

import { useState } from "react";

// --- Types ---
interface InvoiceItem {
  item: string;
  originalName: string;
  qty: number;
  ft?: number;
  weight?: number;
  amount: number;
  totalProfit: number;
  guage?: string;
  size?: string;
  gote?: string;
  type?: string;
  name?: string;
  color?: string;
  pipeType?: string;
}

interface Invoice {
  quotationId: string;
  items: InvoiceItem[];
}

interface SelectedItem {
  itemName: string;
  size?: string;
  guage?: string;
  qty?: number;
  ft?: number;
  kg?: number;
}

interface ReturnRecord {
  returnId: string;
  referenceInvoice: string;
  itemsReturned: any[];
  createdAt: string;
}

const ReturnInvoice = ({
  returnRecord,
  onBack,
}: {
  returnRecord: ReturnRecord;
  onBack: () => void;
}) => {
  const { returnId, referenceInvoice, itemsReturned, createdAt } = returnRecord;
  const totalRefund = itemsReturned.reduce(
    (sum, item) => sum + (item.refundAmount || 0),
    0
  );

  // Helper to get item display name (for Item column)
  const getItemName = (item: any) => {
    const type = (item.type || "").toLowerCase();
    if (type === "pipe" || type === "diamond chadar") {
      let str = item.type ? item.type : "";
      if (item.size) str += ` ${item.size}`;
      if (item.guage) str += ` ${item.guage}`;
      return str.trim();
    }
    let str =
      item.originalName || item.itemName || item.name || item.type || "";
    if (item.size) str += ` ${item.size}`;
    if (item.guage) str += ` ${item.guage}`;
    return str.trim();
  };

  // Helper to infer soldBy
  const getSoldBy = (item: any): "pipe" | "qty" | "ft" | "kg" => {
    if ((item.type || "").toLowerCase() === "pipe") return "pipe";
    if (item.ft && item.ft > 0) return "ft";
    if (item.weight && item.weight > 0) return "kg";
    return "qty";
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 bg-gray-900 rounded-lg p-8 text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Return Invoice</h2>
          <div>
            Return ID: <span className="font-mono">{returnId}</span>
          </div>
          <div>
            Reference Invoice:{" "}
            <span className="font-mono">{referenceInvoice}</span>
          </div>
          <div>Date: {new Date(createdAt).toLocaleDateString()}</div>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded text-white"
            onClick={() => window.print()}
          >
            Print Return Invoice
          </button>
          <button
            className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded text-white"
            onClick={onBack}
          >
            Back
          </button>
        </div>
      </div>
      <table className="w-full table-auto border-collapse border border-gray-700 mb-6">
        <thead>
          <tr className="bg-gray-800 text-center">
            <th className="border border-white p-1">Qty</th>
            <th className="border border-white p-1">Ft</th>
            <th className="border border-white p-1">Item</th>
            <th className="border border-white p-1">Guage</th>
            <th className="border border-white p-1">Weight</th>
            <th className="border border-white p-1">Rate</th>
            <th className="border border-white p-1">Refund</th>
          </tr>
        </thead>
        <tbody>
          {itemsReturned.map((item, i) => {
            const soldBy = getSoldBy(item);
            return (
              <tr
                key={`${item.originalName || item.itemName}-${item.size || ""
                  }-${item.guage || ""}-${i}`}
                className="text-center"
              >
                <td className="border border-white">
                  {soldBy === "pipe" || soldBy === "qty"
                    ? item.returnValue || item.qty
                    : ""}
                </td>
                <td className="border border-white">
                  {soldBy === "pipe" || soldBy === "ft"
                    ? item.returnValue || item.ft
                    : ""}
                </td>
                <td className="border border-white">{getItemName(item)}</td>
                <td className="border border-white">{item.guage || ""}</td>
                <td className="border border-white">
                  {soldBy === "kg" ? item.returnValue || item.weight : ""}
                </td>
                <td className="border border-white">
                  {item.rate?.toLocaleString()}
                </td>
                <td className="border border-white">
                  {item.refundAmount?.toLocaleString()}
                </td>
              </tr>
            );
          })}
          <tr className="bg-gray-800 font-bold">
            <td colSpan={6} className="text-right border border-white pr-4">
              Total Refund
            </td>
            <td className="border border-white text-center">
              {totalRefund.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// --- Main ReturnItems Component ---
const ReturnItems = () => {
  const [invoiceId, setInvoiceId] = useState("");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [message, setMessage] = useState("");
  const [returnRecord, setReturnRecord] = useState<ReturnRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to determine how the item was sold
  const getSoldBy = (item: InvoiceItem): "pipe" | "qty" | "ft" | "kg" => {
    if ((item.type || "").toLowerCase() === "pipe") return "pipe";
    if (item.ft && item.ft > 0) return "ft";
    if (item.weight && item.weight > 0) return "kg";
    return "qty";
  };

  // Helper to get display name
  const getDisplayName = (item: InvoiceItem): string => {
    const type = (item.type || "").toLowerCase();
    if (type === "pipe" || type === "diamond chadar") {
      let str = item.type ? item.type : "";
      if (item.size) str += ` ${item.size}`;
      if (item.guage) str += ` ${item.guage}`;
      return str.trim();
    }
    let str = item.originalName || item.item || item.name || item.type || "";
    if (item.size) str += ` ${item.size}`;
    if (item.guage) str += ` ${item.guage}`;
    return str.trim();
  };

  // Fetch invoice
  const fetchInvoice = async () => {
    if (!invoiceId) return;
    try {
      const res = await fetch(`/api/quotations?search=${invoiceId}`);
      const data = await res.json();
      if (data.success && data.quotations.length > 0) {
        setInvoice({ ...data.quotations[0] });
        setSelectedItems([]);
        setMessage("");
      } else {
        setMessage("No invoice found with that ID.");
      }
    } catch (err) {
      setMessage("⚠️ Error fetching invoice.");
    }
  };


  const toggleItem = (item: InvoiceItem, checked: boolean) => {
    const soldBy = getSoldBy(item);
    const keyFields = {
      itemName: item.originalName,
      size: item.size,
      guage: item.guage,
    };

    if (checked) {
      if (soldBy === "pipe") {
        setSelectedItems((prev) => [
          ...prev,
          {
            ...keyFields,
            qty: 1,
            ft: 20,
          },
        ]);
      } else if (soldBy === "ft") {
        setSelectedItems((prev) => [
          ...prev,
          { ...keyFields, ft: 0 },
        ]);
      } else if (soldBy === "kg") {
        setSelectedItems((prev) => [
          ...prev,
          { ...keyFields, kg: 0 },
        ]);
      } else {
        setSelectedItems((prev) => [
          ...prev,
          { ...keyFields, qty: 0 },
        ]);
      }
    } else {
      setSelectedItems((prev) =>
        prev.filter(
          (i) =>
            !(
              i.itemName === item.originalName &&
              i.size === item.size &&
              i.guage === item.guage
            )
        )
      );
    }
  };

  const updateField = (
    item: InvoiceItem,
    field: keyof SelectedItem,
    value: number
  ) => {
    const soldBy = getSoldBy(item);
    const maxQty = item.qty || 0;
    const maxFt = item.ft || 0;
    const maxKg = item.weight || 0;

    setSelectedItems((prev) =>
      prev.map((i) => {
        if (
          i.itemName !== item.originalName ||
          i.size !== item.size ||
          i.guage !== item.guage
        ) {
          return i;
        }
        if (soldBy === "pipe") {
          const cappedQty = Math.min(value, maxQty);
          return {
            ...i,
            qty: cappedQty,
            ft: cappedQty * 20 > maxFt ? maxFt : cappedQty * 20,
          };
        }
        let cappedValue = value;
        if (field === "qty") cappedValue = Math.min(value, maxQty);
        if (field === "ft") cappedValue = Math.min(value, maxFt);
        if (field === "kg") cappedValue = Math.min(value, maxKg);
        return { ...i, [field]: cappedValue };
      })
    );
  };

  // Handle return
  const handleReturn = async () => {
    if (isProcessing) return;
    if (!invoiceId || selectedItems.length === 0) {
      setMessage("Please select items and enter return quantities.");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, items: selectedItems }),
      });
      const data = await res.json();
      if (data.success) {
        const rtnRes = await fetch(`/api/returns/${data.returnId}`);
        const rtnData = await rtnRes.json();
        if (rtnData.success) {
          setReturnRecord(rtnData.returnRecord);
        }
        setMessage(`✅ Return processed. Return ID: ${data.returnId}`);
        setInvoice(null);
        setSelectedItems([]);
        setInvoiceId("");
      } else {
        setMessage("❌ Error: " + data.message);
      }
    } catch {
      setMessage("❌ Error processing return.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (returnRecord) {
    return (
      <ReturnInvoice
        returnRecord={returnRecord}
        onBack={() => setReturnRecord(null)}
      />
    );
  }

  return (
    <div className="px-[75px] py-[35px] h-full flex flex-col items-center gap-[30px] text-white">
      <h1 className="text-xl font-bold">Return Items</h1>
      <div className="w-full max-w-md flex gap-2">
        <input
          type="text"
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          placeholder="Enter Invoice ID (e.g., INV-0001)"
          className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
        />
        <button
          onClick={fetchInvoice}
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
        >
          Fetch
        </button>
      </div>

      {invoice && (
        <div className="w-full max-w-3xl bg-gray-800 rounded p-4">
          <h2 className="font-bold mb-4">Invoice: {invoice.quotationId}</h2>
          <table className="w-full table-auto border-collapse border border-gray-700 mb-6">
            <thead>
              <tr className="bg-gray-800 text-center">
                <th className="border border-white p-1"></th>
                <th className="border border-white p-1">Item</th>
                <th className="border border-white p-1">Qty</th>
                <th className="border border-white p-1">Ft</th>
                <th className="border border-white p-1">Kg</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => {
                const soldBy = getSoldBy(item);
                // const selected = selectedItems.find(
                //   (s) => s.itemName === item.originalName
                // );
                const selected = selectedItems.find(
                  (s) =>
                    s.itemName === item.originalName &&
                    s.size === item.size &&
                    s.guage === item.guage
                );
                const maxQty = item.qty || 0;
                const maxFt = item.ft || 0;
                const maxKg = item.weight || 0;
                return (
                  <tr key={item.originalName + idx} className="text-center">
                    <td className="border border-white">
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={(e) => toggleItem(item, e.target.checked)}
                      />
                    </td>
                    <td className="border border-white">
                      {getDisplayName(item)}
                    </td>
                    <td className="border border-white">
                      {(soldBy === "pipe" || soldBy === "qty") && (
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            min={0}
                            max={maxQty}
                            value={selected?.qty ?? ""}
                            disabled={!selected}
                            onChange={(e) =>
                              updateField(
                                item,
                                "qty",
                                Math.min(Number(e.target.value), maxQty)
                              )
                            }
                            className="w-16 bg-gray-900 border border-gray-600 rounded text-center"
                          />
                          <span className="text-xs text-gray-400">
                            Sold: {maxQty}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="border border-white">
                      {soldBy === "pipe" ? (
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            value={selected?.qty ? selected.qty * 20 : ""}
                            readOnly
                            disabled
                            className="w-16 bg-gray-900 border border-gray-600 rounded text-center opacity-60"
                          />
                          <span className="text-xs text-gray-400">
                            Sold: {maxFt}
                          </span>
                        </div>
                      ) : soldBy === "ft" ? (
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            min={0}
                            max={maxFt}
                            value={selected?.ft ?? ""}
                            disabled={!selected}
                            onChange={(e) =>
                              updateField(
                                item,
                                "ft",
                                Math.min(Number(e.target.value), maxFt)
                              )
                            }
                            className="w-16 bg-gray-900 border border-gray-600 rounded text-center"
                          />
                          <span className="text-xs text-gray-400">
                            Sold: {maxFt}
                          </span>
                        </div>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="border border-white">
                      {soldBy === "kg" ? (
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            min={0}
                            max={maxKg}
                            value={selected?.kg ?? ""}
                            disabled={!selected}
                            onChange={(e) =>
                              updateField(
                                item,
                                "kg",
                                Math.min(Number(e.target.value), maxKg)
                              )
                            }
                            className="w-16 bg-gray-900 border border-gray-600 rounded text-center"
                          />
                          <span className="text-xs text-gray-400">
                            Sold: {maxKg}
                          </span>
                        </div>
                      ) : (
                        ""
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button
            onClick={handleReturn}
            disabled={isProcessing}
            className="mt-4 w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Process Return"}
          </button>
        </div>
      )}

      {message && (
        <div className="mt-4 text-center">
          <p>{message}</p>
        </div>
      )}
    </div>
  );
};

export default ReturnItems;
