import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReturnItem {
  itemName: string;
  qty: number;
  rate: number;
  refundAmount: number;
  refundProfit?: number;
  refundWeight?: number;
}

interface ReturnRecord {
  returnId: string;
  referenceInvoice: string;
  createdAt: string;
  itemReturned?: ReturnItem | ReturnItem[];
  itemsReturned?: ReturnItem[];
  customerName?: string;
}

export const generateReturnPDF = async (returnId: string) => {
  try {
    // === Fetch return data ===
    const res = await fetch(`/api/returns/${returnId}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (!data.success || !data.returnRecord)
      throw new Error("No return record found.");

    const rtn: ReturnRecord = data.returnRecord;
    const items: ReturnItem[] = Array.isArray(rtn.itemsReturned)
      ? rtn.itemsReturned
      : rtn.itemReturned
      ? Array.isArray(rtn.itemReturned)
        ? rtn.itemReturned
        : [rtn.itemReturned]
      : [];

    if (items.length === 0) {
      alert("⚠️ No return items found to print.");
      return;
    }

    // === Page setup: A4-half / A5 ===
    const pageWidth = 419.53; // 148 mm
    const pageHeight = 595.28; // 210 mm
    const marginX = 28; // ≈10 mm each side
    const printableWidth = pageWidth - marginX * 2;
    const rightX = marginX + printableWidth;

    const doc = new jsPDF({
      unit: "pt",
      format: [pageWidth, pageHeight],
    });

    // === Header generator ===
    const drawHeader = (pageNum?: number) => {
      const topMargin = 50;
      const id = rtn.returnId + (pageNum && pageNum > 1 ? ` (${pageNum})` : "");

      doc.setFont("helvetica", "bold").setFontSize(13);
      doc.text("Taha Metals", marginX, topMargin);

      doc.setFont("helvetica", "normal").setFontSize(8);
      doc.text("Return Invoice", marginX, topMargin + 14);

      const dateStr = new Date(rtn.createdAt).toLocaleDateString();
      doc.text(`Date: ${dateStr}`, rightX, topMargin, { align: "right" });

      doc
        .setFont("helvetica", "bold")
        .setFontSize(8)
        .setTextColor(107, 114, 128)
        .text(`Return ID: ${id}`, rightX, topMargin + 12, { align: "right" })
        .text(`Ref Invoice: ${rtn.referenceInvoice}`, rightX, topMargin + 24, {
          align: "right",
        })
        .setTextColor(0, 0, 0);

      if (rtn.customerName)
        doc
          .setFont("helvetica", "bold")
          .setFontSize(9)
          .text(`Customer: ${rtn.customerName}`, marginX, topMargin + 28);

      return topMargin + 42;
    };

    // === Start content ===
    let startY = drawHeader();

    // === Table ===
    const head = [["Qty", "Item", "Weight", "Rate", "Refund"]];
    const body = items.map((it) => [
      String(it.qty),
      it.itemName,
      it.refundWeight
        ? it.refundWeight.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          })
        : "",
      Number(it.rate).toLocaleString("en-US"),
      Number(it.refundAmount).toLocaleString("en-US", {
        maximumFractionDigits: 2,
      }),
    ]);

    (autoTable as any)(doc, {
      head,
      body,
      startY,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [45, 55, 72],
        textColor: 255,
        fontSize: 8,
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: printableWidth * 0.08 },
        1: { halign: "left", cellWidth: printableWidth * 0.38 },
        2: { halign: "center", cellWidth: printableWidth * 0.1 },
        3: { halign: "right", cellWidth: printableWidth * 0.14 },
        4: { halign: "right", cellWidth: printableWidth * 0.14 },
        5: { halign: "right", cellWidth: printableWidth * 0.16 },
      },
      margin: { left: marginX, right: marginX },
      tableWidth: printableWidth,
      didDrawPage: (data: any) => {
        if (data.pageNumber > 1) drawHeader(data.pageNumber);
      },
    });

    // === Totals section ===
    let finalY = (doc as any).lastAutoTable.finalY + 20;
    const totalRefund = items.reduce(
      (sum, it) => sum + (it.refundAmount || 0),
      0
    );

    if (finalY + 80 > pageHeight) {
      doc.addPage();
      finalY = drawHeader((doc as any).internal.getNumberOfPages()) + 10;
    }

    doc
      .setFont("helvetica", "bold")
      .setFontSize(9)
      .text("REFUND TOTAL:", rightX - 120, finalY, { align: "left" })
      .text(`- ${totalRefund.toLocaleString()}`, rightX, finalY, {
        align: "right",
      });

    // === Footer ===
    doc
      .setFont("helvetica", "normal")
      .setFontSize(8)
      .text(
        "System-generated Return Invoice — No signature required",
        marginX + printableWidth / 2,
        pageHeight - 30,
        { align: "center" }
      );

    // === Output / Print ===
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
    console.error("❌ Error generating Return PDF:", err);
    alert("❌ Failed to generate Return PDF.");
  }
};
