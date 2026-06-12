import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Payment {
  amount: number;
  date: string;
}

interface Quotation {
  _id: string;
  quotationId: string;
  date: string;
  total: number;
  discount: number;
  loading?: number;
  carriage?: number;
  bendingLabour?: number;
  grandTotal: number;
  payments?: Payment[];
  items?: any[];
  customerName?: string;
}

function formatQty(val: number | string | undefined) {
  if (val == null || val === "" || isNaN(Number(val)) || Number(val) === 0)
    return "";
  const num = Number(val);
  const whole = Math.floor(num);
  const frac = +(num - whole).toFixed(2);
  if (frac === 0.5) return whole > 0 ? `${whole} - 1/2` : "1/2";
  if (frac === 0) return `${whole}`;
  return num.toString();
}

function formatValue(val: number | string | undefined) {
  if (val == null || val === "" || isNaN(Number(val)) || Number(val) === 0)
    return "";
  return Number(val).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export const generateInvoicePDF = async (quotationId: string, previousBalance: number = 0) => {
  try {
    const res = await fetch(`/api/quotations/${quotationId}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (!data.success || !data.quotation?.items)
      throw new Error("No quotation items found.");

    const quotation: Quotation = data.quotation;
    const items = quotation.items || [];

    // === Page setup (A5 portrait) ===
    const pageWidth = 419.53;
    const pageHeight = 595.28;
    const marginX = 28;
    const printableWidth = pageWidth - marginX * 2;
    const lineGap = 16;

    const doc = new jsPDF({
      unit: "pt",
      format: [pageWidth, pageHeight],
      orientation: "portrait",
    });

    doc.setFont("helvetica");

    // === Header ===
    const drawHeader = (topY: number = 40) => {
      // "Makkah Steel"
      doc.setFont("helvetica", "bold").setFontSize(18);
      const steelText = "Makkah Steel";
      const steelX = marginX;
      doc.text(steelText, steelX, topY);

      // "Traders" right-aligned under "Makkah Steel"
      doc.setFont("helvetica", "normal").setFontSize(12);
      const tradersText = "Traders";
      const steelWidth = doc.getTextWidth(steelText);
      const tradersWidth = doc.getTextWidth(tradersText);
      const tradersX = steelX + steelWidth - tradersWidth;
      doc.text(tradersText, tradersX, topY + 18);

      // Address
      doc.setFont("helvetica", "normal").setFontSize(10);
      doc.text("Choha Road, Kallar", marginX, topY + 38);
      doc.text("Cell: 0316-5848572 , 0303-5964402", marginX, topY + 54);

      // Customer Name
      if (quotation.customerName)
        doc
          .setFont("helvetica", "bold")
          .setFontSize(12)
          .text(`Customer: ${quotation.customerName}`, marginX, topY + 74);

      // Date and Quotation ID (right side)
      const dateStr = new Date(quotation.date).toLocaleDateString();
      doc.setFont("helvetica", "normal").setFontSize(10);
      doc.text(`Date: ${dateStr}`, pageWidth - marginX, topY, {
        align: "right",
      });
      doc
        .setFont("helvetica", "bold")
        .setFontSize(10)
        .setTextColor(107, 114, 128)
        .text(
          `Quotation ID: ${quotation.quotationId}`,
          pageWidth - marginX,
          topY + 18,
          { align: "right" }
        )
        .setTextColor(0, 0, 0);

      return topY + 90;
    };

    // === Table ===
    const startY = drawHeader(40) + lineGap;
    const head = [["Qty", "Ft", "Item", "Guage", "Weight", "Rate", "Amount"]];
    const body = items.map((r: any) => [
      formatQty(r.qty),
      formatQty(r.ft),
      r.item || "",
      r.guage || "",
      formatValue(r.weight),
      formatValue(r.rate),
      formatValue(r.amount),
    ]);

    (autoTable as any)(doc, {
      head,
      body,
      startY,
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: [100, 100, 100],
        lineWidth: 0.3,
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineColor: [100, 100, 100],
        lineWidth: 0.4,
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { halign: "center", cellWidth: printableWidth * 0.07 },
        1: { halign: "center", cellWidth: printableWidth * 0.07 },
        2: { halign: "left", cellWidth: printableWidth * 0.32 },
        3: { halign: "center", cellWidth: printableWidth * 0.12 },
        4: { halign: "right", cellWidth: printableWidth * 0.12 },
        5: { halign: "right", cellWidth: printableWidth * 0.12 },
        6: { halign: "right", cellWidth: printableWidth * 0.18 },
      },
      margin: { left: marginX, right: marginX },
      tableWidth: printableWidth,
      pageBreak: "auto",
      didDrawPage: (data: any) => {
        // Footer on every page
        doc.setFont("helvetica", "normal").setFontSize(8);
        doc.text(
          `Makkah Steel — Quality and Trust Since 2025`,
          pageWidth / 2,
          pageHeight - 30,
          { align: "center" }
        );
      },
    });

    // === Totals Section ===
    let finalY = (doc as any).lastAutoTable?.finalY
      ? (doc as any).lastAutoTable.finalY + 18
      : 180;

    const paid = quotation.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const balance = quotation.grandTotal - paid;

    const labelX = pageWidth - marginX - 150;
    const valueX = pageWidth - marginX;

    const drawRow = (label: string, value: number | string, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(11);
      doc.text(`${label}:`, labelX, finalY, { align: "left" });
      doc.text(String(value), valueX, finalY, { align: "right" });
      finalY += 16;
    };

    drawRow("TOTAL", quotation.total.toLocaleString());
    drawRow("DISCOUNT", quotation.discount.toLocaleString());
    drawRow("LOADING", (quotation.loading || 0).toLocaleString());
    drawRow("PREVIOUS BALANCE", previousBalance.toLocaleString());
    drawRow("INVOICE BALANCE", balance.toLocaleString());
    drawRow("TOTAL BALANCE", (previousBalance + balance).toLocaleString());
    if (quotation.bendingLabour && Number(quotation.bendingLabour) > 0) {
      drawRow(
        "BENDING LABOUR",
        Number(quotation.bendingLabour).toLocaleString()
      );
    }

    if (quotation.carriage && Number(quotation.carriage) > 0) {
      drawRow("CARRIAGE", Number(quotation.carriage).toLocaleString());
    }
    drawRow("GRAND TOTAL", quotation.grandTotal.toLocaleString(), true);

    // === Output ===
    const filename = `invoice_${quotation.quotationId || quotation._id}.pdf`;
    doc.save(filename);
  } catch (err) {
    console.error("❌ Error generating PDF:", err);
    alert("❌ Failed to generate PDF.");
  }
};
