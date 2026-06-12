import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExpenseEntry {
  date: string;
  description: string;
  amount: number;
}

export const printExpenseSheet = async (monthKey: string) => {
  try {
    const res = await fetch(`/api/expenses?month=${monthKey}`);
    const data = await res.json();

    if (!data.success) {
      alert("Failed to fetch expense data.");
      return;
    }

    const entries: ExpenseEntry[] = data.entries || [];
    const total = entries.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // === Header ===
    const formattedMonth = new Date(`${monthKey}-01`).toLocaleString(
      "default",
      {
        month: "long",
        year: "numeric",
      }
    );

    doc.setFont("helvetica", "bold").setFontSize(20);
    doc.text("Makkah Steel Traders", 40, 50);

    doc.setFont("helvetica", "bold").setFontSize(14);
    doc.text(`Monthly Expenses — ${formattedMonth}`, 40, 80);

    doc
      .setFont("helvetica", "normal")
      .setFontSize(10)
      .text(`Printed: ${new Date().toLocaleDateString()}`, pageWidth - 60, 50, {
        align: "right",
      });

    // === Table ===
    const head = [["#", "Date", "Description", "Amount (Rs)"]];
    const body = entries.map((e, i) => [
      String(i + 1),
      new Date(e.date).toLocaleDateString(),
      e.description || "-",
      e.amount?.toLocaleString("en-US") || "0",
    ]);

    (autoTable as any)(doc, {
      head,
      body,
      startY: 110,
      theme: "grid",
      styles: {
        fontSize: 10,
        halign: "center",
        valign: "middle",
        cellPadding: 6,
        lineColor: [220, 220, 220],
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 30,
        lineWidth: 0.2,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: 40, halign: "center" },
        1: { cellWidth: 100, halign: "center" },
        2: { cellWidth: "auto", halign: "left" },
        3: { cellWidth: 100, halign: "right" },
      },
      margin: { left: 40, right: 40 },
      didDrawPage: function () {
        const internal = doc.internal as any;
        const pageCount = internal.getNumberOfPages();
        const pageCurrent = internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8).setFont("helvetica", "normal");
        doc.text(
          `Page ${pageCurrent} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 20,
          { align: "center" }
        );
      },
    });

    // === Totals ===
    const finalY = (doc as any).lastAutoTable.finalY + 20;

    // horizontal line above total
    doc.setDrawColor(200);
    doc.line(40, finalY - 10, pageWidth - 40, finalY - 10);

    // total label right-aligned
    doc
      .setFont("helvetica", "bold")
      .setFontSize(12)
      .text(
        `Total Expenses: ${total.toLocaleString("en-US")} Rs`,
        pageWidth - 60,
        finalY,
        { align: "right" }
      );

    // === Open print window ===
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(blobUrl);
    printWindow?.addEventListener("load", () => {
      printWindow.focus();
      printWindow.print();
    });
  } catch (err) {
    console.error("Error printing expense sheet:", err);
    alert("Failed to print expense sheet.");
  }
};
