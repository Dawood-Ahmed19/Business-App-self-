"use client";

import React, { useEffect, useState, Suspense } from "react";
import { v4 as uuidv4 } from "uuid";
import Select from "react-select";
import { printInvoicePDF } from "@/utils/printInvoicePDF";
import { useSearchParams } from "next/navigation";

type QuotationRow = {
  qty: number | "";
  ft: number | "";
  item: string;
  originalName?: string;
  size?: string | number | "";
  weight: number | "";
  rate: number | "";
  amount: number;
  uniqueKey: string;
  guage: string | number | "";
  type?: string;
  color?: string;
  number?: string;
  pipeType?: string;
};

interface InventoryItem {
  name: string;
  type: string;
  ft?: number;
  weight?: number;
  quantity: number;
  pricePerFt?: number;
  pricePerUnit?: number;
  pricePerKg?: number;
  size?: string | number;
  guage?: string | number;
  color?: string;
  number?: string;
  lengthFt?: number;
  pipeType?: string;
}

const STORAGE_KEY = "current_invoice";

const QuotationTableInner: React.FC = () => {
  const [rows, setRows] = useState<QuotationRow[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [bendingLabour, setBendingLabour] = useState<number>(0);
  const [received, setReceived] = useState<number>(0);
  const [loading, setLoading] = useState<number>(0);
  const [carriage, setCarriage] = useState<number>(0);
  const [quotationId, setQuotationId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [weightPerPieceMap, setWeightPerPieceMap] = useState<
    Record<string, number>
  >({});
  const [customerBalance, setCustomerBalance] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [invoiceDate, setInvoiceDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const fetchCustomerSuggestions = async (name: string) => {
    if (!name) {
      setCustomerSuggestions([]);
      return;
    }
    const res = await fetch(
      `/api/customers?search=${encodeURIComponent(name)}`
    );
    const data = await res.json();
    if (data.success) setCustomerSuggestions(data.customers || []);
  };

  const fetchCustomerByExactName = async (name: string, currentQuotationId?: string) => {
    if (!name) return;

    const res = await fetch(`/api/customers?search=${encodeURIComponent(name)}`);
    const data = await res.json();

    if (data.success && data.customers?.length) {
      const cust = data.customers.find((c: any) => c.name === name);

      if (cust) {
        const invRes = await fetch(`/api/customers/${cust._id}/invoices`);
        const invData = await invRes.json();
        let previousBalance = 0;
        if (invData.success && invData.invoices) {
          previousBalance = invData.invoices
            .filter((inv: any) => inv.quotationId !== currentQuotationId && inv.balance > 0)
            .reduce((sum: number, inv: any) => sum + (inv.balance || 0), 0);
        }
        setSelectedCustomer(cust);
        setCustomerBalance(Math.round(previousBalance) || 0);
      } else {
        setSelectedCustomer(null);
        setCustomerBalance(0);
      }
    }
  };




  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const PER_KG_TYPES = ["angle", "patti", "sarrya", "diamond chadar"];

  // Normalize helper: use for all lookups/keys (keeps UI free to format)
  const norm = (v: any) => (v ?? "").toString().trim().toLowerCase();

  function getAvailableStock(row: QuotationRow) {
    const inv = inventoryItems.find(
      (i) =>
        norm(i.name) === norm(row.originalName) &&
        norm(i.size) === norm(row.size) &&
        norm(i.guage) === norm(row.guage)
    );
    if (!inv) return { quantity: 0, lengthFt: 0, weight: 0 };
    return {
      quantity: Number(inv.quantity) || 0,
      lengthFt: Number(inv.lengthFt || inv.ft) || 0,
      weight: Number(inv.weight) || 0,
    };
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setRows(parsed.rows || []);
      setDiscount(parsed.discount || 0);
      setReceived(parsed.received || 0);
      setLoading(parsed.loading || 0);
      setCarriage(parsed.carriage || 0);
      setQuotationId(parsed.quotationId || "");
      setCustomerName(parsed.customerName || "");
    } else {
      setRows([
        {
          qty: "",
          ft: "",
          item: "",
          weight: "",
          rate: "",
          amount: 0,
          uniqueKey: uuidv4(),
          guage: "",
          size: "",
        },
      ]);
    }
    setMounted(true);
  }, []);

  // useEffect(() => {
  //   if (!editId) return;
  //   (async () => {
  //     try {
  //       const res = await fetch(`/api/quotations?search=${editId}`);
  //       const data = await res.json();
  //       if (data.success && data.quotations?.length) {
  //         const q = data.quotations[0];
  //         setRows(
  //           q.items.map((it: any) => ({
  //             ...it,
  //             uniqueKey: uuidv4(),
  //           }))
  //         );
  //         setDiscount(q.discount || 0);
  //         setReceived(q.payments?.[0]?.amount || 0);
  //         setLoading(q.loading || 0);
  //         setCarriage(q.carriage || 0);
  //         setBendingLabour(q.bendingLabour || 0);
  //         setQuotationId(q.quotationId || "");
  //         setCustomerName(q.customerName || "");
  //         fetchCustomerByExactName(q.customerName);
  //       }
  //     } catch (err) {
  //       console.error("Failed to prefill invoice", err);
  //     }
  //   })();
  // }, [editId]);
  useEffect(() => {
    if (!editId) return;

    (async () => {
      try {
        const res = await fetch(`/api/quotations?search=${editId}`);
        const data = await res.json();

        if (data.success && data.quotations?.length) {
          const q = data.quotations[0];

          setRows(
            q.items.map((it: any) => ({
              ...it,
              uniqueKey: uuidv4(),
            }))
          );

          setDiscount(q.discount || 0);
          setReceived(q.payments?.[0]?.amount || 0);
          setLoading(q.loading || 0);
          setCarriage(q.carriage || 0);
          setBendingLabour(q.bendingLabour || 0);
          setQuotationId(q.quotationId || "");
          setCustomerName(q.customerName || "");
          fetchCustomerByExactName(q.customerName, q.quotationId);
        }
      } catch (err) {
        console.error("Failed to prefill invoice", err);
      }
    })();
  }, [editId]);


  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        rows,
        discount,
        received,
        loading,
        carriage,
        bendingLabour,
        quotationId,
        customerName,
      })
    );
  }, [
    rows,
    discount,
    received,
    loading,
    carriage,
    bendingLabour,
    quotationId,
    customerName,
    mounted,
  ]);

  const showMessage = (text: string, duration = 3000) => {
    setMessage(text);
    setTimeout(() => setMessage(null), duration);
  };

  const addRow = () =>
    setRows((p) => [
      ...p,
      {
        qty: "",
        ft: "",
        item: "",
        weight: "",
        rate: "",
        amount: 0,
        uniqueKey: uuidv4(),
        guage: "",
        size: "",
      },
    ]);

  const removeRow = () => setRows((p) => (p.length > 1 ? p.slice(0, -1) : p));

  const newInvoice = () => {
    setRows([
      {
        qty: "",
        ft: "",
        item: "",
        weight: "",
        rate: "",
        amount: 0,
        uniqueKey: uuidv4(),
        guage: "",
        size: "",
      },
    ]);
    setBendingLabour(0);
    setDiscount(0);
    setReceived(0);
    setLoading(0);
    setCarriage(0);
    setQuotationId("");
    setCustomerName("");
    setCustomerBalance(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  const [rateList, setRateList] = useState<
    Record<
      string,
      { ratePerFt: number; ratePerUnit: number; ratePerKg: number }
    >
  >({});

  useEffect(() => {
    (async () => {
      const invRes = await fetch("/api/inventory");
      const invData = await invRes.json();
      if (invData.success) {
        setInventoryItems(invData.items || []);
        const wppMap: Record<string, number> = {};
        for (const x of invData.items) {
          // normalize all parts for the key
          const key = `${norm(x.name ?? x.type)}|${norm(x.size)}|${norm(
            x.guage
          )}`;
          const totalWeight = Number(x.weight) || 0;
          const totalQty = Number(x.quantity) || 0;
          wppMap[key] = totalQty > 0 ? totalWeight / totalQty : 0;
        }
        setWeightPerPieceMap(wppMap);
      }

      const rateRes = await fetch("/api/ratelist");
      const rateData = await rateRes.json();
      if (rateData.success) {
        const map: Record<string, any> = {};
        for (const x of rateData.items) {
          // normalize all parts; fall back to type when name missing
          const key = `${norm(x.name ?? x.type)}|${norm(x.size)}|${norm(
            x.guage
          )}`;
          map[key] = {
            ratePerFt: Number(x.ratePerFt) || 0,
            ratePerUnit: Number(x.ratePerUnit) || 0,
            ratePerKg: Number(x.ratePerKg) || 0,
          };
        }
        setRateList(map);
      }
    })().catch(console.error);
  }, []);

  // const handleReceivePayment = async () => {
  //   if (!selectedCustomer || !selectedCustomer._id) {
  //     showMessage("Customer not found or not selected.");
  //     return;
  //   }
  //   if (totalBalance <= 0) {
  //     showMessage("No balance to receive.");
  //     return;
  //   }

  //   try {
  //     const res = await fetch(`/api/customers/${selectedCustomer._id}/receivePayment`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ amount: totalBalance }),
  //     });
  //     const data = await res.json();
  //     if (data.success) {
  //       showMessage("Payment received and distributed successfully!");
  //       // Optionally, refresh UI or reset fields here
  //     } else {
  //       showMessage("Error: " + (data.error || "Failed to receive payment."));
  //     }
  //   } catch (err) {
  //     showMessage("Error: Could not process payment.");
  //   }
  // };

  useEffect(() => {
    if (!mounted) return;
    if (Object.keys(rateList).length === 0) return;
    setRows((prevRows) =>
      prevRows.map((row, index) => {
        if (!row.item) return row;
        handleChange(index, "item", row.item);
        return row;
      })
    );
  }, [rateList]);

  const total = rows.reduce((a, r) => a + (r.amount || 0), 0);
  const grandTotal = total - discount + loading + carriage + bendingLabour;
  const balance = grandTotal - received;
  const currentInvoiceBalance = grandTotal - received;
  const totalBalance = customerBalance + currentInvoiceBalance;

  const normalizeQty = (val: number) => {
    if (val % 1 === 0) return val;
    const rem = val % 1;
    if (Math.abs(rem - 0.5) < 0.001) return val;
    return Math.floor(val) + 0.5;
  };

  const capitalizeLTZ = (text: string | number | undefined | null) => {
    if (typeof text !== "string") return text;
    return text.replace(/\b(l|t|z)\b/gi, (m) => m.toUpperCase());
  };

  const handleChange = (
    index: number,
    field: keyof QuotationRow,
    value: any
  ) => {
    const newRows = [...rows];
    let num = Number(value);
    if (field !== "item" && (isNaN(num) || num < 0)) num = 0;
    const row = newRows[index];

    // Helper to get available stock for the selected item
    function getAvailableStock(row: QuotationRow) {
      const inv = inventoryItems.find(
        (i) =>
          norm(i.name) === norm(row.originalName) &&
          norm(i.size) === norm(row.size) &&
          norm(i.guage) === norm(row.guage)
      );
      if (!inv) return { quantity: 0, lengthFt: 0, weight: 0 };
      return {
        quantity: Number(inv.quantity) || 0,
        lengthFt: Number(inv.lengthFt || inv.ft) || 0,
        weight: Number(inv.weight) || 0,
      };
    }

    if (field === "item") {
      const parts = (value ?? "").split("|");
      let sel: InventoryItem | undefined;

      if (parts[0]?.toLowerCase() === "jali") {
        const [type, size, number] = parts;
        sel = inventoryItems.find(
          (i) =>
            i.type?.toLowerCase() === "jali" &&
            (size === "" || norm(i.size) === norm(size)) &&
            (number === "" || norm(i.number) === norm(number))
        );
      } else {
        const [name, size, guage, number] = parts;
        sel = inventoryItems.find(
          (i) =>
            norm(i.name) === norm(name) &&
            (size === "" || norm(i.size) === norm(size)) &&
            (guage === "" || norm(i.guage) === norm(guage)) &&
            (number === undefined ||
              number === "" ||
              norm(i.number) === norm(number))
        );
      }
      if (!sel) return;

      const t = sel.type.toLowerCase();
      const isPipe = t === "pipe";
      const isHardware = t === "hardware";
      const isJali = t === "jali";
      const isTanka = t === "tanka barfi jali";
      const isKgType = PER_KG_TYPES.includes(t);
      const isHwPerKg = isHardware && Number(sel.pricePerKg) > 0;
      const isHwPerUnit = isHardware && Number(sel.pricePerUnit) > 0;
      const isChowkat = sel.type?.toLowerCase() === "chowkat";

      const k = `${norm(sel.name ?? sel.type)}|${norm(sel.size)}|${norm(
        sel.guage
      )}`;


      const rateFt =
        rateList[k] && Number(rateList[k].ratePerFt) > 0
          ? Number(rateList[k].ratePerFt)
          : Number(sel.pricePerFt) || 0;
      const rateUnit =
        rateList[k]?.ratePerUnit > 0
          ? rateList[k].ratePerUnit
          : sel.pricePerUnit || 0;
      const rateKg =
        rateList[k]?.ratePerKg > 0
          ? rateList[k].ratePerKg
          : sel.pricePerKg || 0;
      let rate = 0;

      if (isChowkat) {
        const chowkatKey = `${norm(sel.type)}|${norm(sel.size)}|${norm(
          sel.guage
        )}`;
        const chowkatRate =
          rateList[chowkatKey]?.ratePerKg ||
          rateList[chowkatKey]?.ratePerFt ||
          rateList[chowkatKey]?.ratePerUnit ||
          0;

        rate =
          chowkatRate && chowkatRate > 0
            ? chowkatRate
            : Number(sel.pricePerKg) || 0;
      } else if (isPipe || isJali || isTanka) {
        rate = rateFt;
      } else if (isKgType || isHwPerKg) {
        rate = rateKg;
      } else if (isHardware && Number(rateFt) > 0) {
        // Hardware per ft (like cable)
        rate = rateFt;
      } else if (isHardware && isHwPerUnit) {
        rate = rateUnit;
      }
      console.log(
        "DEBUG: k=",
        k,
        "rateList[k]=",
        rateList[k],
        "rateFt=",
        rateFt,
        "sel.pricePerFt=",
        sel.pricePerFt,
        "rate used=",
        rate
      );

      const displayRate = isPipe ? rate * 20 : rate;

      const formattedSize =
        typeof sel.size === "string" ? capitalizeLTZ(sel.size) : sel.size;
      const label = isJali
        ? `${capitalizeLTZ(sel.type)} ${formattedSize ?? ""} ${sel.number ?? ""
          }`.trim()
        : isHardware
          ? `${sel.name}${formattedSize ? ` ${formattedSize}` : ""}`.trim()
          : `${capitalizeLTZ(sel.type)} ${formattedSize || ""}`.trim();

      newRows[index] = {
        ...row,
        item: label,
        originalName: sel.name ?? "",
        type: sel.type,
        // Keep display capitalization for the UI:
        size:
          typeof sel.size === "string"
            ? capitalizeLTZ(sel.size)
            : sel.size?.toString() || "",
        guage: sel.guage?.toString() || "",
        color: sel.color ?? "",
        number: sel.number ?? "",
        pipeType: sel.pipeType ?? "",
        qty: row.qty !== "" && row.qty !== undefined ? row.qty : "",
        ft: row.ft !== "" && row.ft !== undefined ? row.ft : "",
        weight: row.weight !== undefined ? row.weight : "",
        rate: displayRate,
        amount: 0,
      };
    } else if (["qty", "ft", "weight", "rate"].includes(field)) {
      // === Inventory validation ===
      const { quantity, lengthFt, weight } = getAvailableStock(row);

      if (field === "qty" && num > quantity) {
        showMessage(`❌ Only ${quantity} available in stock.`);
        num = quantity;
      }
      if (field === "ft" && num > lengthFt) {
        showMessage(`❌ Only ${lengthFt} ft available in stock.`);
        num = lengthFt;
      }
      if (field === "weight" && num > weight) {
        showMessage(`❌ Only ${weight} kg available in stock.`);
        num = weight;
      }

      if (field === "qty") num = normalizeQty(num);
      (newRows[index] as any)[field] = num;
    }

    const r = newRows[index];
    const baseRate =
      r.type?.toLowerCase() === "pipe" && typeof r.rate === "number"
        ? r.rate / 20
        : Number(r.rate) || 0;

    const qty = Number(r.qty) || 0;
    const wt = Number(r.weight) || 0;
    const isPipe = r.type?.toLowerCase() === "pipe";
    const isChowkat = r.originalName?.toLowerCase() === "chowkat";
    const isHardware = r.type?.toLowerCase() === "hardware";
    const isHardwarePerFt =
      isHardware &&
      !!inventoryItems.find(
        (inv) =>
          norm(inv.name) === norm(row.originalName) &&
          norm(inv.size) === norm(row.size) &&
          norm(inv.guage) === norm(row.guage)
      )?.pricePerFt;

    if (isPipe) {
      r.ft = qty * 20;
    }

    if (isChowkat) {
      r.amount = baseRate * wt;
    } else if (isHardware && isHardwarePerFt) {
      // Only auto-set rate when item is selected, not when editing ft or rate
      if (field === "item") {
        const k = `${norm(r.originalName)}|${norm(r.size)}|${norm(r.guage)}`;
        const inv = inventoryItems.find(
          (inv) =>
            norm(inv.name) === norm(row.originalName) &&
            norm(inv.size) === norm(row.size) &&
            norm(inv.guage) === norm(row.guage)
        );
        const ratePerFt =
          rateList[k]?.ratePerFt > 0
            ? rateList[k].ratePerFt
            : inv?.pricePerFt || 0;
        r.rate = ratePerFt;
      }
      r.amount = Number(r.ft) * Number(r.rate);
    } else {
      r.amount = baseRate * (Number(r.ft) || qty || wt || 0);
    }
    r.amount = Math.round((r.amount + Number.EPSILON) * 100) / 100;

    setRows(newRows);
  };


  const saveQuotation = async () => {
    try {
      const validRows = rows.filter(
        (r) =>
          r.item &&
          r.rate &&
          (Number(r.ft) > 0 || Number(r.qty) > 0 || Number(r.weight) > 0)
      );

      if (validRows.length === 0 && bendingLabour <= 0) {
        showMessage("⚠️ Please add at least one item or enter bending labour before saving.");
        return;
      }

      // Ensure we send canonical inventory fields (case-insensitive match)
      const postItems = validRows.map((r) => {
        const isJali = (r.type ?? "").toString().toLowerCase() === "jali";
        const match = inventoryItems.find((inv) =>
          isJali
            ? inv.type?.toLowerCase() === "jali" &&
            norm(inv.size) === norm(r.size) &&
            norm(inv.number) === norm(r.number)
            : norm(inv.name) === norm(r.originalName) &&
            norm(inv.size) === norm(r.size) &&
            norm(inv.guage) === norm(r.guage)
        );
        if (!match) return r; // fallback
        return {
          ...r,
          // keep UI label "item" as-is; but send canonical fields
          originalName: match.name ?? r.originalName,
          size: match.size?.toString() ?? r.size,
          guage: match.guage?.toString() ?? r.guage,
          number: match.number ?? r.number,
          type: match.type ?? r.type,
        };
      });

      setIsSaving(true);

      // --- NEW FEATURE: Distribute previous balance before saving invoice ---
      if (customerName && customerBalance > 0 && customerSuggestions.length > 0) {
        const selectedCustomer = customerSuggestions.find(
          (c) => c.name === customerName
        );
        if (selectedCustomer && selectedCustomer._id) {
          await fetch(`/api/customers/${selectedCustomer._id}/receivePayment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: customerBalance }),
          });
        }
      }
      // --- END NEW FEATURE ---

      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationId,
          customerName,
          discount,
          total,
          grandTotal,
          loading,
          carriage,
          bendingLabour,
          date: new Date(invoiceDate).toISOString(),
          payments:
            received > 0
              ? [
                {
                  amount: received,
                  date: new Date(invoiceDate).toISOString(),
                },
              ]
              : [],
          createdBy:
            sessionStorage.getItem("role") === "admin"
              ? "Admin"
              : sessionStorage.getItem("username") || "Unknown",
          items: postItems,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "Failed");
      setQuotationId(data.quotation?.quotationId || "");
      showMessage("✅ Invoice saved successfully!");
    } catch (err: any) {
      showMessage("❌ " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  const fmtInt = (val: number) => Math.floor(val).toLocaleString();

  return (
    <>
      <div className="mb-3 text-white flex justify-between w-full max-w-[1400px] relative">
        <label className="font-bold mr-2">Customer Name:</label>
        <div className="flex-1 relative">
          <input
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              fetchCustomerSuggestions(e.target.value);
              setShowSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Enter customer name"
            className="bg-transparent border-b border-gray-500 focus:border-blue-400 outline-none flex-1 text-center text-white w-full"
            autoComplete="off"
          />
          {/* {showSuggestions && customerSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 bg-gray-900 border border-gray-700 rounded z-10 max-h-40 overflow-y-auto">
              {customerSuggestions.map((cust) => (
                <li
                  key={cust._id}
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    setCustomerName(cust.name);
                    setShowSuggestions(false);
                  }}
                >
                  {cust.name}
                </li>
              ))}
            </ul>
          )} */}

          {showSuggestions && customerSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 bg-gray-900 border border-gray-700 rounded z-10 max-h-40 overflow-y-auto">
              {customerSuggestions.map((cust) => (
                <li
                  key={cust._id}
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    setCustomerName(cust.name);
                    setShowSuggestions(false);
                    setCustomerBalance(Math.round(cust.balance) || 0);
                    setSelectedCustomer(cust);
                  }}
                >
                  {cust.name}
                  {typeof cust.balance === "number" && (
                    <span className="ml-2 text-xs text-yellow-400">
                      (Balance: {cust.balance.toLocaleString("en-US")} Rs)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="font-bold">Date:</label>
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className="bg-transparent border-b border-gray-500 focus:border-blue-400 outline-none text-white"
            style={{ minWidth: 120 }}
          />
        </div>
      </div>
      <div className="flex justify-center max-w-[1400px] bg-gray-900 text-xs">
        <table className="text-white table-auto border-collapse border border-gray-700 min-w-[1400px] w-full">
          <thead>
            <tr className="bg-gray-800 text-center h-[35px]">
              <th className="border border-white w-[60px] p-1">Qty</th>
              <th className="border border-white w-[60px] p-1">Ft</th>
              <th className="border border-white p-1 w-[160px]">Item</th>
              <th className="border border-white p-1 w-[70px]">Gauge</th>
              <th className="border border-white p-1 w-[70px]">Weight</th>
              <th className="border border-white p-1 w-[80px]">Rate</th>
              <th className="border border-white p-1 w-[90px]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isDiamondChadar =
                row.type?.toLowerCase() === "diamond chadar";
              const isChowkat = row.type?.toLowerCase() === "chowkat";
              const isJali = row.type?.toLowerCase() === "jali";
              const isPipe = row.type?.toLowerCase() === "pipe";
              const isHardware = row.type?.toLowerCase() === "hardware";
              const isHardwarePerFt =
                isHardware &&
                !!inventoryItems.find(
                  (inv) =>
                    norm(inv.name) === norm(row.originalName) &&
                    norm(inv.size) === norm(row.size) &&
                    norm(inv.guage) === norm(row.guage)
                )?.pricePerFt;

              // Case-insensitive inventory match for UI logic
              const invItem = inventoryItems.find(
                (inv) =>
                  norm(inv.name) === norm(row.originalName) &&
                  norm(inv.size) === norm(row.size) &&
                  norm(inv.guage) === norm(row.guage)
              );

              const hasPricePerKg = invItem && Number(invItem.pricePerKg) > 0;
              const hasPricePerUnit =
                invItem && Number(invItem.pricePerUnit) > 0;

              return (
                <tr key={row.uniqueKey} className="text-center h-[28px]">
                  <td className="border border-white">
                    {/* <input
                      type="number"
                      step="0.5"
                      value={row.qty ?? ""}
                      onChange={(e) => handleChange(i, "qty", e.target.value)}
                      disabled={
                        isDiamondChadar ||
                        isChowkat ||
                        isJali ||
                        (isHardware && hasPricePerKg)
                      }
                      className={`bg-transparent text-center w-full outline-none border-b border-blue-400 ${
                        isDiamondChadar ||
                        isChowkat ||
                        isJali ||
                        (isHardware && hasPricePerKg)
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    /> */}

                    <input
                      type="number"
                      step="0.5"
                      value={row.qty ?? ""}
                      onChange={(e) => handleChange(i, "qty", e.target.value)}
                      disabled={
                        isDiamondChadar ||
                        isChowkat ||
                        isJali ||
                        (isHardware && (hasPricePerKg || isHardwarePerFt))
                      }
                      className={`bg-transparent text-center w-full outline-none border-b border-blue-400 ${isDiamondChadar ||
                        isChowkat ||
                        isJali ||
                        (isHardware && (hasPricePerKg || isHardwarePerFt))
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                        }`}
                    />
                  </td>
                  <td className="border border-white">
                    {/* <input
                      type="number"
                      value={row.ft ?? ""}
                      onChange={(e) => handleChange(i, "ft", e.target.value)}
                      disabled={
                        isDiamondChadar || isChowkat || isPipe || isHardware
                      }
                      className={`bg-transparent text-center w-full outline-none ${
                        isDiamondChadar || isChowkat || isPipe || isHardware
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    /> */}
                    <input
                      type="number"
                      value={row.ft ?? ""}
                      onChange={(e) => handleChange(i, "ft", e.target.value)}
                      disabled={
                        isDiamondChadar ||
                        isChowkat ||
                        isPipe ||
                        (isHardware && !isHardwarePerFt)
                      }
                      className={`bg-transparent text-center w-full outline-none ${isDiamondChadar ||
                        isChowkat ||
                        isPipe ||
                        (isHardware && !isHardwarePerFt)
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                        }`}
                    />
                  </td>
                  <td className="border border-white p-1">
                    <Select
                      options={inventoryItems.map((inv) => {
                        const isPipe = inv.type?.toLowerCase() === "pipe";
                        const isRoundPipe =
                          isPipe && inv.pipeType?.toLowerCase() === "round";
                        const isHardwareInv =
                          inv.type?.toLowerCase() === "hardware";
                        const isJaliType = inv.type?.toLowerCase() === "jali";
                        const formattedSize =
                          typeof inv.size === "string"
                            ? capitalizeLTZ(inv.size)
                            : inv.size;

                        const menuLabel = isRoundPipe
                          ? `${inv.type ?? ""} ${formattedSize ?? ""} ${inv.guage ?? ""
                            } ${inv.pipeType ?? ""}`.trim()
                          : isJaliType
                            ? `${inv.type ?? ""} ${formattedSize ?? ""} ${inv.number ?? ""
                              }`.trim()
                            : isHardwareInv
                              ? `${inv.name ?? ""} ${formattedSize ?? ""}`.trim()
                              : `${inv.type ?? ""} ${formattedSize ?? ""} ${inv.guage ?? ""
                                }`.trim();

                        const value = isJaliType
                          ? `${inv.type}|${inv.size ?? ""}|${inv.number ?? ""}`
                          : `${inv.name}|${inv.size ?? ""}|${inv.guage ?? ""}`;

                        return { value, label: menuLabel };
                      })}
                      value={
                        row.type?.toLowerCase() === "pipe" &&
                          row.pipeType?.toLowerCase() === "round"
                          ? {
                            value: `${row.originalName}|${row.size ?? ""}|${row.guage ?? ""
                              }|${row.number ?? ""}`,
                            label: `${row.type ?? ""} ${row.size ?? ""} ${row.guage ?? ""
                              } ${row.pipeType ?? ""}`.trim(),
                          }
                          : row.type?.toLowerCase() === "jali"
                            ? {
                              value: `${row.type}|${row.size ?? ""}|${row.number ?? ""
                                }`,
                              label: `${row.type ?? ""} ${row.size ?? ""} ${row.number ?? ""
                                }`.trim(),
                            }
                            : row.originalName
                              ? {
                                value: `${row.originalName}|${row.size ?? ""}|${row.guage ?? ""
                                  }|${row.number ?? ""}`,
                                label:
                                  row.type?.toLowerCase() === "hardware"
                                    ? `${row.originalName ?? ""} ${row.size ?? ""
                                      }`.trim()
                                    : `${row.type ?? ""} ${row.size ?? ""
                                      }`.trim(),
                              }
                              : null
                      }
                      onChange={(opt) =>
                        handleChange(i, "item", opt?.value ?? "")
                      }
                      placeholder="Item..."
                      className="w-full"
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (b) => ({ ...b, zIndex: 9999 }),
                        control: (b) => ({
                          ...b,
                          backgroundColor: "transparent",
                          border: "none",
                          minHeight: "22px",
                          boxShadow: "none",
                        }),
                        singleValue: (b) => ({ ...b, color: "white" }),
                      }}
                    />
                  </td>
                  <td className="border border-white">
                    <input
                      value={row.guage ?? ""}
                      readOnly
                      className="bg-transparent text-center w-full outline-none"
                    />
                  </td>
                  <td className="border border-white">
                    {/* <input
                      type="number"
                      value={row.weight ?? ""}
                      onChange={(e) =>
                        handleChange(i, "weight", e.target.value)
                      }
                      disabled={
                        isJali || isPipe || (isHardware && hasPricePerUnit)
                      }
                      className={`bg-transparent text-center w-full outline-none ${
                        isJali || isPipe || (isHardware && hasPricePerUnit)
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    /> */}
                    <input
                      type="number"
                      value={row.weight ?? ""}
                      onChange={(e) =>
                        handleChange(i, "weight", e.target.value)
                      }
                      disabled={
                        isJali ||
                        isPipe ||
                        (isHardware && (hasPricePerUnit || isHardwarePerFt))
                      }
                      className={`bg-transparent text-center w-full outline-none ${isJali ||
                        isPipe ||
                        (isHardware && (hasPricePerUnit || isHardwarePerFt))
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                        }`}
                    />
                  </td>
                  <td className="border border-white">
                    <input
                      type="number"
                      step="0.01"
                      value={
                        row.rate !== "" && !isNaN(Number(row.rate))
                          ? Number(row.rate).toFixed(2)
                          : ""
                      }
                      onChange={(e) => handleChange(i, "rate", e.target.value)}
                      className={`bg-transparent text-center w-full outline-none text-white`}
                    />
                  </td>
                  <td className="border border-white">
                    {row.amount
                      ? Math.round(row.amount).toLocaleString("en-US")
                      : ""}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gray-800 font-bold">
              <td colSpan={5}></td>
              <td className="border border-white">TOTAL</td>
              <td className="border border-white text-center">
                {fmtInt(total)}
              </td>
            </tr>
            <tr className="bg-gray-800 font-bold">
              <td colSpan={5}></td>
              <td className="border border-white">DISCOUNT</td>
              <td className="border border-white">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="bg-transparent text-center w-full outline-none"
                />
              </td>
            </tr>
            <tr className="bg-gray-800 font-bold">
              <td colSpan={5}></td>
              <td className="border border-white">RECEIVED</td>
              <td className="border border-white">
                <input
                  type="number"
                  value={received}
                  onChange={(e) => setReceived(Number(e.target.value) || 0)}
                  className="bg-transparent text-center w-full outline-none"
                />
              </td>
            </tr>
            {/* <tr className="bg-gray-800 font-bold">
              <td colSpan={5}></td>
              <td className="border border-white">BALANCE</td>
              <td className="border border-white text-center">
                {fmtInt(totalBalance)}
              </td>
            </tr> */}
            {customerBalance !== 0 && (
              <tr className="bg-gray-800 font-bold">
                <td colSpan={5}></td>
                <td className="border border-white">PREVIOUS BALANCE</td>
                <td className="border border-white text-center">
                  {fmtInt(customerBalance)}
                </td>
              </tr>
            )}
            <tr className="bg-gray-800 font-bold">
              <td colSpan={5}></td>
              <td className="border border-white">INVOICE BALANCE</td>
              <td className="border border-white text-center">
                {fmtInt(balance)}
              </td>
            </tr>
            <tr className="bg-gray-800 font-bold">
              <td colSpan={5}></td>
              <td className="border border-white">TOTAL BALANCE</td>
              <td className="border border-white text-center">
                {fmtInt(customerBalance + balance)}
              </td>
            </tr>

            <tr className="bg-gray-800 font-bold">
              <td colSpan={5}></td>
              <td className="border border-white">LOADING</td>
              <td className="border border-white">
                <input
                  type="number"
                  value={loading}
                  onChange={(e) => setLoading(Number(e.target.value) || 0)}
                  className="bg-transparent text-center w-full outline-none"
                />
              </td>
            </tr>
            <tr className="bg-gray-800 font-bold">
              <td colSpan={5}></td>
              <td className="border border-white">BENDING LABOUR</td>
              <td className="border border-white">
                <input
                  type="number"
                  value={bendingLabour}
                  onChange={(e) =>
                    setBendingLabour(Number(e.target.value) || 0)
                  }
                  className="bg-transparent text-center w-full outline-none"
                />
              </td>
            </tr>
            <tr className="bg-gray-800 font-bold">
              <td colSpan={5}></td>
              <td className="border border-white">CARRIAGE</td>
              <td className="border border-white">
                <input
                  type="number"
                  value={carriage}
                  onChange={(e) => setCarriage(Number(e.target.value) || 0)}
                  className="bg-transparent text-center w-full outline-none"
                />
              </td>
            </tr>
            <tr className="bg-gray-800 font-bold">
              <td colSpan={5}></td>
              <td className="border border-white">GRAND TOTAL</td>
              <td className="border border-white text-center">
                {fmtInt(grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex gap-3">
        <button
          onClick={addRow}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white"
        >
          + Add Row
        </button>
        <button
          onClick={removeRow}
          className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-white"
        >
          - Remove Row
        </button>
        <button
          onClick={newInvoice}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
        >
          New Invoice
        </button>
        <button
          onClick={() => printInvoicePDF(quotationId, customerBalance)}
          className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded text-white"
        >
          Print Invoice
        </button>

      </div>

      {message && (
        <div className="mt-3 bg-red-600 px-4 py-2 rounded text-sm text-white text-center">
          {message}
        </div>
      )}

      <button
        onClick={() => saveQuotation()}
        disabled={isSaving}
        className="mt-5 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white disabled:opacity-50"
      >
        {isSaving ? "Saving..." : quotationId ? "Update Invoice" : "Save"}
      </button>

    </>
  );
};

const QuotationTable = () => (
  <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
    <QuotationTableInner />
  </Suspense>
);

export default QuotationTable;
