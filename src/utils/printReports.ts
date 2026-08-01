import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportItem {
  date: string;
  quotationId: string;
  grandTotal: number;
  profit: number;
  loading?: number;
}

// Helper for custom date formatting (always DD-MM-YYYY)
function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// MONTHLY REPORT
export const printMonthlyReport = async (
  month: number,
  year: number,
  quotations: ReportItem[],
  totalAmount: number,
  totalProfit: number,
  netMonthlyProfit: number,
  monthlyExpenses: number,
  salariesPaid: number
) => {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const formattedMonth = new Date(year, month - 1).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    // HEADER
    doc.setFont("helvetica", "bold").setFontSize(20);
    doc.text("Makkah Steel", 40, 50);
    doc.setFontSize(14).text(`Monthly Report — ${formattedMonth}`, 40, 80);
    doc
      .setFont("helvetica", "normal")
      .setFontSize(10)
      .text(`Printed: ${new Date().toLocaleDateString()}`, pageWidth - 60, 50, {
        align: "right",
      });

    // MAIN TABLE
    const head = [["#", "Date", "Bill No", "Amount (Rs)", "Profit (Rs)"]];
    const body = quotations.map((q, i) => [
      String(i + 1),
      new Date(q.date).toLocaleDateString(),
      q.quotationId,
      q.grandTotal.toLocaleString("en-US"),
      q.profit.toLocaleString("en-US"),
    ]);

    (autoTable as any)(doc, {
      head,
      body,
      startY: 110,
      theme: "grid",
      styles: {
        fontSize: 10,
        valign: "middle",
        cellPadding: 6,
        lineColor: [220, 220, 220],
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 30,
        fontStyle: "bold",
        lineWidth: 0.2,
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      tableWidth: "auto",
      margin: { left: 40, right: 40 },
      didDrawPage: function () {
        const internal = doc.internal as any;
        const pageCount = internal.getNumberOfPages();
        const pageCurrent = internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8);
        doc.text(
          `Page ${pageCurrent} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 20,
          { align: "center" }
        );
      },
    });

    // TOTALS BOX
    const finalY = (doc as any).lastAutoTable.finalY + 25;
    doc.setDrawColor(200);
    doc.line(40, finalY - 10, pageWidth - 40, finalY - 10);

    const summaryHead = [["Description", "Amount (Rs)"]];
    const summaryBody = [
      ["Total Sales", `${totalAmount.toLocaleString("en-US")}`],
      ["Total Profit", `${totalProfit.toLocaleString("en-US")}`],
      ["Total Expenses", `${monthlyExpenses.toLocaleString("en-US")}`],
      ["Salaries Paid", `${salariesPaid.toLocaleString("en-US")}`],
      ["Net Profit", `${netMonthlyProfit.toLocaleString("en-US")}`],
    ];

    (autoTable as any)(doc, {
      startY: finalY,
      head: summaryHead,
      body: summaryBody,
      theme: "grid",
      styles: {
        fontSize: 10,
        halign: "right",
        cellPadding: 6,
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 30,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      tableWidth: 200,
      margin: { left: pageWidth - 240, right: 40 },
      columnStyles: {
        0: { cellWidth: 100, halign: "left" },
        1: { cellWidth: 100, halign: "right" },
      },
    });

    // DYNAMIC FILENAME
    const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });
    const filename = `Reports (${monthName} ${year}).pdf`;
    doc.save(filename);
  } catch (err) {
    console.error("Error printing monthly report:", err);
    alert("Failed to print report.");
  }
};

// GENERIC REPORT (custom, yearly, all)
export const printGenericReport = async (
  title: string,
  quotations: ReportItem[],
  totalAmount: number,
  totalProfit: number,
  filterType?: string,
  fromDate?: string,
  toDate?: string,
  year?: number
) => {
  try {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const totalLoading = quotations.reduce(
      (sum, q) => sum + (q.loading || 0),
      0
    );


    // HEADER
    doc.setFont("helvetica", "bold").setFontSize(20);
    doc.text("Makkah Steel", 40, 50);
    doc.setFontSize(14).text(title, 40, 80);
    doc.setFontSize(10).text(
      `Printed: ${new Date().toLocaleDateString()}`,
      pageWidth - 60,
      50,
      { align: "right" }
    );

    // TABLE
    const head = [["#", "Date", "Bill No", "Amount (Rs)", "Profit (Rs)"]];
    const body = quotations.map((q, i) => [
      String(i + 1),
      new Date(q.date).toLocaleDateString(),
      q.quotationId,
      q.grandTotal.toLocaleString("en-US"),
      q.profit.toLocaleString("en-US"),
    ]);

    (autoTable as any)(doc, {
      head,
      body,
      startY: 110,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [0, 0, 0], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 40, right: 40 },
      didDrawPage: () => {
        const internal = doc.internal as any;
        doc.setFontSize(8);
        doc.text(
          `Page ${internal.getCurrentPageInfo().pageNumber}`,
          pageWidth / 2,
          pageHeight - 20,
          { align: "center" }
        );
      },
    });

    // TOTALS
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    (autoTable as any)(doc, {
      startY: finalY,
      head: [["Description", "Amount (Rs)"]],
      headStyles: { fillColor: [0, 0, 0] },
      body: [
        ["Total Sales", totalAmount.toLocaleString("en-US")],
        ["Total Profit", totalProfit.toLocaleString("en-US")],
        ["Total Loading", totalLoading.toLocaleString("en-US")],
      ],
      tableWidth: 200,
      margin: { left: pageWidth - 240 },
      styles: { fontSize: 10, cellPadding: 6 },
    });

    // DYNAMIC FILENAME
    let filename = "Reports.pdf";
    if (filterType === "custom" && fromDate && toDate) {
      filename = `Reports (${formatDate(fromDate)} - ${formatDate(toDate)}).pdf`;
    } else if (filterType === "yearly" && year) {
      filename = `Reports (${year}).pdf`;
    } else {
      // fallback: today's date
      const today = new Date();
      const formatted = formatDate(today.toISOString());
      filename = `Reports (${formatted}).pdf`;
    }

    doc.save(filename);
  } catch (err) {
    console.error("Print error:", err);
    alert("Failed to print report.");
  }
};
