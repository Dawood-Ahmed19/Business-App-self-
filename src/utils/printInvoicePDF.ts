import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const printInvoicePDF = async (quotationId: string, previousBalance: number = 0) => {
  try {
    const res = await fetch(`/api/quotations/${quotationId}`);
    if (!res.ok) throw new Error(await res.text());
    const { quotation } = await res.json();

    const items = quotation.items || [];

    if (items.length === 0 && quotation.bendingLabour > 0) {
      items.push({
        qty: "",
        ft: "",
        item: "Bending Labour",
        guage: "",
        weight: "",
        rate: "",
        amount: quotation.bendingLabour,
      });
    }

    const pageWidth = 595;
    const pageHeight = 420;
    const halfWidth = pageWidth / 2;
    const marginX = 28;
    const printableWidth = halfWidth - marginX * 2;

    const doc = new jsPDF({
      unit: "pt",
      format: [pageWidth, pageHeight],
      orientation: "landscape",
    });

    doc.setFont("helvetica");

    const formatQty = (v: any) => (!v || Number(v) === 0 ? "" : v.toString());
    const formatVal = (v: any) =>
      v === undefined || v === null || v === "" ? "" : Number(v).toLocaleString();

    const drawHeader = (x: number) => {
      doc.setFontSize(13).setFont("helvetica", "bold");
      doc.text("Makkah Steel", x + marginX, 40);

      doc.setFontSize(9).setFont("helvetica", "normal");
      doc.text("Traders", x + marginX + 52, 52);
      doc.text("Choha Road, Kallar", x + marginX, 64);
      doc.text("Cell: 0316-5848572 , 0303-5964402", x + marginX, 76);

      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.text(`Customer: ${quotation.customerName || ""}`, x + marginX, 90);

      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.text(`Contact: ${quotation.contactNumber || ""}`, x + marginX, 102);

      doc.setFont("helvetica", "normal").setFontSize(9);
      doc.text(
        `Date: ${new Date(quotation.date).toLocaleDateString()}`,
        x + halfWidth - marginX,
        40,
        { align: "right" }
      );
      doc.text(
        `Quotation ID: ${quotation.quotationId}`,
        x + halfWidth - marginX,
        52,
        { align: "right" }
      );

      return 110;
    };

    const drawTable = (
      x: number,
      startY: number,
      rows: any[],
      showHeader: boolean
    ) => {
      autoTable(doc, {
        startY,
        head: showHeader
          ? [["Qty", "Ft", "Item", "Guage", "Weight", "Rate", "Amount"]]
          : [],
        body: rows.map((r) => [
          formatQty(r.qty),
          formatQty(r.ft),
          r.item || "",
          r.guage || "",
          formatVal(r.weight),
          formatVal(r.rate),
          formatVal(r.amount),
        ]),
        margin: { left: x + marginX, right: marginX },
        tableWidth: printableWidth,
        styles: {
          fontSize: 8,
          cellPadding: 3,
          textColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 1,
        },
        pageBreak: "auto",
      });

      return (doc as any).lastAutoTable.finalY;
    };

    const renderTotalsAndFooter = (startY: number) => {

      const ROW_HEIGHT = 14;
      const footerImageHeight = 40;
      const padding = 30;

      const REQUIRED_SPACE =
        items.length * ROW_HEIGHT + footerImageHeight + padding;

      if (startY + REQUIRED_SPACE > pageHeight) {
        doc.addPage();
        startY = 40;
      }


      const paid =
        quotation.payments?.reduce(
          (s: number, p: any) => s + p.amount,
          0
        ) || 0;

      const balance = quotation.grandTotal - paid;

      const rows = [
        ["TOTAL", quotation.total],
        ["DISCOUNT", quotation.discount],
        ["LOADING", quotation.loading || 0],
        ["PREVIOUS BALANCE", previousBalance],
        ["INVOICE BALANCE", balance],
        ["RECEIVED", quotation.payments?.[0]?.amount || 0],
        ["GRAND TOTAL", quotation.grandTotal],
        ["TOTAL BALANCE", previousBalance + balance],

      ];

      if (quotation.bendingLabour > 0) {
        rows.push(["BENDING LABOUR", quotation.bendingLabour]);
      }

      doc.setFontSize(8);

      rows.forEach(([label, val], i) => {
        doc.setFont("helvetica", label === "GRAND TOTAL" ? "bold" : "normal");

        doc.text(label + ":", halfWidth - marginX - 120, startY + i * 14);
        doc.text(val.toLocaleString(), halfWidth - marginX, startY + i * 14, {
          align: "right",
        });

        doc.text(label + ":", pageWidth - marginX - 120, startY + i * 14);
        doc.text(val.toLocaleString(), pageWidth - marginX, startY + i * 14, {
          align: "right",
        });
      });

      const footerHeight = 40;
      const footerY = pageHeight - footerHeight - 20;

      const img = new Image();
      img.src = "/urduText.png";
      img.onload = () => {
        doc.addImage(img, "PNG", marginX, footerY, printableWidth, footerHeight);
        doc.addImage(
          img,
          "PNG",
          halfWidth + marginX,
          footerY,
          printableWidth,
          footerHeight
        );

        const blob = doc.output("blob");
        const url = URL.createObjectURL(blob);
        window.open(url)?.print();
      };
    };

    // ===== FLOW =====
    if (items.length <= 12) {
      const leftStart = drawHeader(0);
      const rightStart = drawHeader(halfWidth);

      const leftEnd = drawTable(0, leftStart, items, true);
      const rightEnd = drawTable(halfWidth, rightStart, items, true);

      renderTotalsAndFooter(Math.max(leftEnd, rightEnd) + 20);
    } else {
      let index = 0;
      const ROWS_FIRST = 15;
      const ROWS_OTHER = 22;

      while (index < items.length) {
        const isFirst = index === 0;
        if (index > 0) doc.addPage();

        const leftStart = isFirst ? drawHeader(0) : 40;
        const rightStart = isFirst ? drawHeader(halfWidth) : 40;

        const max = isFirst ? ROWS_FIRST : ROWS_OTHER;
        const pageRows = items.slice(index, index + max);
        index += max;

        const leftEnd = drawTable(0, leftStart, pageRows, isFirst);
        const rightEnd = drawTable(halfWidth, rightStart, pageRows, isFirst);

        if (index >= items.length) {
          renderTotalsAndFooter(Math.max(leftEnd, rightEnd) + 20);
        }
      }
    }
  } catch (err) {
    console.error(err);
    alert("Print failed");
  }
};