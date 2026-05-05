import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaDownload } from "react-icons/fa";

const InvoiceGenerator = ({ payment, patientData }) => {
  const generateInvoice = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Colors
    const primaryColor = [102, 126, 234]; // #667eea
    const darkGray = [51, 51, 51];
    const lightGray = [128, 128, 128];
    const bgGray = [245, 245, 245];

    // Header Background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 50, "F");

    // Hospital Logo/Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("UB E-Health", 20, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Healthcare Management System", 20, 33);
    doc.text("Phone: +91 1234567890 | Email: info@ubehealth.com", 20, 40);

    // Invoice Title
    doc.setFillColor(...bgGray);
    doc.rect(0, 50, pageWidth, 15, "F");
    doc.setTextColor(...darkGray);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", pageWidth / 2, 60, { align: "center" });

    // Invoice Details Box
    const invoiceBoxY = 75;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.rect(20, invoiceBoxY, pageWidth - 40, 35);

    // Left side - Invoice Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("Invoice Number:", 25, invoiceBoxY + 10);
    doc.text("Invoice Date:", 25, invoiceBoxY + 18);
    doc.text("Payment ID:", 25, invoiceBoxY + 26);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...lightGray);
    doc.text(payment.invoiceNumber || "N/A", 65, invoiceBoxY + 10);
    doc.text(
      new Date(payment.invoiceDate || payment.transactionDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }),
      65,
      invoiceBoxY + 18
    );
    doc.text(payment.paymentId, 65, invoiceBoxY + 26);

    // Right side - Status
    const statusX = pageWidth - 60;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("Status:", statusX, invoiceBoxY + 10);
    
    // Status badge
    const statusColor = payment.status === "completed" ? [16, 185, 129] : 
                       payment.status === "refunded" ? [239, 68, 68] : [245, 158, 11];
    doc.setFillColor(...statusColor);
    doc.roundedRect(statusX, invoiceBoxY + 13, 35, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(payment.status.toUpperCase(), statusX + 17.5, invoiceBoxY + 18.5, { align: "center" });

    // Patient Details Section
    const patientY = 125;
    doc.setFillColor(...primaryColor);
    doc.rect(20, patientY, pageWidth - 40, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PATIENT DETAILS", 25, patientY + 5.5);

    doc.setTextColor(...darkGray);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Name:", 25, patientY + 18);
    doc.text("Email:", 25, patientY + 26);
    doc.text("Phone:", 25, patientY + 34);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...lightGray);
    doc.text(patientData?.name || payment.patientId?.name || "N/A", 50, patientY + 18);
    doc.text(patientData?.email || payment.patientEmail || "N/A", 50, patientY + 26);
    doc.text(patientData?.phonenum || payment.patientPhone || "N/A", 50, patientY + 34);

    // Service Details Table
    const tableY = patientY + 45;
    doc.setFillColor(...primaryColor);
    doc.rect(20, tableY, pageWidth - 40, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("SERVICE DETAILS", 25, tableY + 5.5);

    // Table
    const tableData = [
      [
        payment.description || `${payment.paymentType} Payment`,
        new Date(payment.transactionDate).toLocaleDateString("en-IN"),
        payment.paymentMethod.toUpperCase(),
        `Rs. ${payment.amount.toFixed(2)}`
      ]
    ];

    doc.autoTable({
      startY: tableY + 12,
      head: [["Description", "Date", "Payment Method", "Amount"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
        halign: "left"
      },
      bodyStyles: {
        fontSize: 9,
        textColor: darkGray
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 30, halign: "right" }
      },
      margin: { left: 20, right: 20 }
    });

    // Summary Box
    const summaryY = doc.lastAutoTable.finalY + 10;
    const summaryX = pageWidth - 90;
    
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.rect(summaryX, summaryY, 70, 35);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...darkGray);
    doc.text("Subtotal:", summaryX + 5, summaryY + 10);
    doc.text("Tax (0%):", summaryX + 5, summaryY + 18);
    
    if (payment.refundAmount > 0) {
      doc.setTextColor(239, 68, 68);
      doc.text("Refund:", summaryX + 5, summaryY + 26);
    }

    // Total
    doc.setFillColor(...primaryColor);
    doc.rect(summaryX, summaryY + 28, 70, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", summaryX + 5, summaryY + 33);

    // Amounts
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...darkGray);
    doc.text(`Rs. ${payment.amount.toFixed(2)}`, summaryX + 65, summaryY + 10, { align: "right" });
    doc.text("Rs. 0.00", summaryX + 65, summaryY + 18, { align: "right" });
    
    if (payment.refundAmount > 0) {
      doc.setTextColor(239, 68, 68);
      doc.text(`-Rs. ${payment.refundAmount.toFixed(2)}`, summaryX + 65, summaryY + 26, { align: "right" });
    }

    const finalAmount = payment.amount - (payment.refundAmount || 0);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${finalAmount.toFixed(2)}`, summaryX + 65, summaryY + 33, { align: "right" });

    // Refund Info (if applicable)
    if (payment.refundAmount > 0) {
      const refundY = summaryY + 45;
      doc.setFillColor(254, 242, 242);
      doc.rect(20, refundY, pageWidth - 40, 20, "F");
      doc.setTextColor(239, 68, 68);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("REFUND INFORMATION", 25, refundY + 7);
      doc.setFont("helvetica", "normal");
      doc.text(`Refund Amount: Rs. ${payment.refundAmount.toFixed(2)}`, 25, refundY + 13);
      doc.text(`Refund Date: ${new Date(payment.refundDate).toLocaleDateString("en-IN")}`, 25, refundY + 17);
      if (payment.refundReason) {
        doc.text(`Reason: ${payment.refundReason}`, 25, refundY + 21);
      }
    }

    // Footer
    const footerY = pageHeight - 30;
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.3);
    doc.line(20, footerY, pageWidth - 20, footerY);

    doc.setFontSize(8);
    doc.setTextColor(...lightGray);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for choosing UB E-Health!", pageWidth / 2, footerY + 7, { align: "center" });
    doc.text("This is a computer-generated invoice and does not require a signature.", pageWidth / 2, footerY + 12, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.text("For any queries, please contact us at support@ubehealth.com or call +91 1234567890", pageWidth / 2, footerY + 17, { align: "center" });

    // Watermark (if refunded)
    if (payment.status === "refunded") {
      doc.setTextColor(239, 68, 68);
      doc.setFontSize(60);
      doc.setFont("helvetica", "bold");
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.1 }));
      doc.text("REFUNDED", pageWidth / 2, pageHeight / 2, {
        align: "center",
        angle: 45
      });
      doc.restoreGraphicsState();
    }

    // Save PDF
    const fileName = `Invoice_${payment.invoiceNumber || payment.paymentId}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };

  return (
    <button
      onClick={generateInvoice}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.6rem 1.2rem",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        border: "none",
        borderRadius: "10px",
        fontSize: "0.9rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.4)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
      }}
    >
      <FaDownload /> Download Invoice
    </button>
  );
};

export default InvoiceGenerator;
