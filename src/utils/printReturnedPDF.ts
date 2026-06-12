import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ReturnItem {
  itemName: string;
  qty: number;
  rate: number;
  refundAmount: number;
  refundProfit?: number;
  refundWeight?: number;
  contactNumber?: string;
}

interface ReturnRecord {
  returnId: string;
  referenceInvoice: string;
  createdAt: string;
  itemReturned?: ReturnItem | ReturnItem[];
  itemsReturned?: ReturnItem[];
  customerName?: string;
  contactNumber?: string;
}

// Helper to chunk array into groups of n
function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export const printReturnPDF = async (returnId: string) => {
  try {
    // === Fetch return record ===
    const res = await fetch(`/api/returns/${returnId}`);
    if (!res.ok) {
      alert("Failed to fetch return data for printing.");
      return;
    }
    const data = await res.json();
    if (!data.success || !data.returnRecord) {
      alert("No return record found.");
      return;
    }
    const rtn: ReturnRecord = data.returnRecord;

    // === Normalize item schema and map returnValue to refundWeight ===
    const items: ReturnItem[] = (
      Array.isArray(rtn.itemsReturned)
        ? rtn.itemsReturned
        : rtn.itemReturned
          ? Array.isArray(rtn.itemReturned)
            ? rtn.itemReturned
            : [rtn.itemReturned]
          : []
    ).map((item: any) => ({
      ...item,
      refundWeight:
        item.refundWeight !== undefined && item.refundWeight !== null
          ? item.refundWeight
          : item.returnValue !== undefined && item.returnValue !== null
            ? item.returnValue
            : undefined,
    }));

    if (items.length === 0) {
      alert("No return items found to print.");
      return;
    }

    // === Fetch inventory (for descriptive item names) ===
    const inventoryRes = await fetch("/api/inventory");
    const inventoryData = await inventoryRes.json();
    const inventoryItems = inventoryData.success
      ? inventoryData.items || []
      : [];

    const getDisplayItem = (itemName: string) => {
      const invItem = inventoryItems.find((inv: any) => inv.name === itemName);
      if (!invItem) return itemName;
      if (invItem.type.toLowerCase().includes("pillar"))
        return `${invItem.type} ${invItem.size || ""}${invItem.gote &&
          invItem.gote.trim() !== "" &&
          invItem.gote.toLowerCase() !== "without gote"
          ? invItem.gote
          : ""
          } - ${invItem.guage || ""}`.trim();
      if (invItem.type.toLowerCase() === "hardware")
        return `${invItem.name} ${invItem.size || ""}${invItem.color && invItem.color.trim() !== "" ? invItem.color : ""
          }`.trim();
      return `${invItem.type}${invItem.size || ""}${invItem.guage || ""
        }`.trim();
    };

    // ====== PAGE CONFIG ======
    const pageWidth = 842; // A4 landscape
    const pageHeight = 595;
    const halfWidth = pageWidth / 2;
    const marginX = 28;
    const printableWidth = halfWidth - marginX * 2;
    const lineGap = 12;
    const MAX_ITEMS_PER_PAGE = 18;

    const doc = new jsPDF({
      unit: "pt",
      format: [pageWidth, pageHeight],
      orientation: "landscape",
    });

    doc.setFont("helvetica");

    // ====== HELPERS ======
    const formatQty = (val: any) =>
      !val || Number(val) === 0 ? "" : val.toString();
    const formatVal = (val: any) => (!val ? "" : Number(val).toLocaleString());

    const chunk = (arr: any[], size: number) =>
      Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
      );

    const pages = chunk(items, MAX_ITEMS_PER_PAGE);

    // ====== HEADER ======
    const drawHeader = (x: number) => {
      doc.setFontSize(13).setFont("helvetica", "bold");
      doc.text("Makkah Steel", x + marginX, 40);

      doc.setFontSize(8).setFont("helvetica", "normal");
      doc.text("Traders", x + marginX + 65, 52);
      doc.text("Choha Road, Kallar", x + marginX, 64);
      doc.text("Cell: 0316-5848572 , 0303-5964402", x + marginX, 76);

      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.text(`Customer: ${rtn.customerName || ""}`, x + marginX, 90);

      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.text(`Contact: ${rtn.contactNumber || ""}`, x + marginX, 102);

      doc.setFont("helvetica", "normal").setFontSize(8);
      doc.text(
        `Date: ${new Date(rtn.createdAt).toLocaleDateString()}`,
        x + halfWidth - marginX,
        40,
        { align: "right" }
      );
      doc.text(`Return ID: ${rtn.returnId}`, x + halfWidth - marginX, 52, {
        align: "right",
      });
      doc.text(
        `Ref Invoice: ${rtn.referenceInvoice}`,
        x + halfWidth - marginX,
        64,
        { align: "right" }
      );

      return 110;
    };

    // ====== TABLE ======
    const drawTable = (
      x: number,
      y: number,
      rows: any[],
      showHeader: boolean
    ) => {
      autoTable(doc, {
        startY: y,
        head: showHeader ? [["Qty", "Item", "Weight", "Rate", "Refund"]] : [],
        body: rows.map((r) => [
          formatQty(r.qty),
          getDisplayItem(r.itemName),
          r.refundWeight !== undefined && r.refundWeight !== null
            ? Number(r.refundWeight).toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })
            : "",
          formatVal(r.rate),
          `- ${Number(r.refundAmount).toLocaleString("en-US", {
            maximumFractionDigits: 2,
          })}`,
        ]),
        margin: { left: x + marginX, right: marginX },
        tableWidth: printableWidth,
        styles: { fontSize: 9, cellPadding: 3 },
      });

      return (doc as any).lastAutoTable.finalY + 10;
    };

    // ====== TOTALS ======
    const drawTotals = (x: number, y: number) => {
      const totalRefund = items.reduce(
        (sum, it) => sum + (it.refundAmount || 0),
        0
      );

      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.text("REFUND TOTAL:", x + halfWidth - marginX - 120, y, {
        align: "left",
      });
      doc.text(
        `- ${totalRefund.toLocaleString()}`,
        x + halfWidth - marginX,
        y,
        {
          align: "right",
        }
      );

      return y + 14;
    };

    // ====== DRAW ALL PAGES ======
    pages.forEach((page, i) => {
      if (i) doc.addPage();

      const showHeader = i === 0;
      const isLast = i === pages.length - 1;

      const leftStart = showHeader ? drawHeader(0) : 40;
      const rightStart = showHeader ? drawHeader(halfWidth) : 40;

      const leftEnd = drawTable(0, leftStart, page, showHeader);
      const rightEnd = drawTable(halfWidth, rightStart, page, showHeader);

      if (isLast) {
        const y = Math.max(leftEnd, rightEnd) + 10;

        const leftTotalsEnd = drawTotals(0, y);
        const rightTotalsEnd = drawTotals(halfWidth, y);

        const footerY = Math.max(leftTotalsEnd, rightTotalsEnd) + 10;

        doc
          .setFont("helvetica", "normal")
          .setFontSize(8)
          .text(
            "This return invoice from Makkah Steel Traders is valid without a signature.",
            marginX + printableWidth / 2,
            footerY,
            { align: "center" }
          );
        doc
          .setFont("helvetica", "normal")
          .setFontSize(8)
          .text(
            "This return invoice from Makkah Steel Traders is valid without a signature.",
            halfWidth + marginX + printableWidth / 2,
            footerY,
            { align: "center" }
          );
      }
    });

    // === Output ===
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(blobUrl);
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        printWindow.focus();
        printWindow.print();
      });
    } else {
      alert("Please allow pop-ups to enable printing.");
    }
  } catch (err) {
    console.error("❌ Error printing Return PDF:", err);
    alert("❌ Failed to print Return PDF");
  }
};