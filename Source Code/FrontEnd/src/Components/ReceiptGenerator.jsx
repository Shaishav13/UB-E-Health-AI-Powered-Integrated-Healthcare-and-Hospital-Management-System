import React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Helper to format date nicely
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

// Helper to convert 24-hour time to 12-hour AM/PM format
const convertTo12Hour = (time24) => {
  if (!time24) return "N/A";
  
  try {
    const [hours24, minutes] = time24.split(':');
    let hours = parseInt(hours24, 10);
    const mins = minutes || "00";
    
    if (isNaN(hours)) return time24;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    
    if (hours === 0) {
      hours = 12;
    } else if (hours > 12) {
      hours = hours - 12;
    }
    
    return `${hours}:${mins} ${period}`;
  } catch (error) {
    console.error('Error converting time:', error);
    return time24;
  }
};

// Generate receipt PDF
const generateReceipt = (appointmentData, patientData) => {
  const doc = new jsPDF();
  
  // Hospital header
  doc.setFillColor(11, 107, 97);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text("UB E-Health", 105, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text("Your Health, Our Priority", 105, 22, { align: 'center' });
  doc.text("Phone: +91-1234567890 | Email: info@ehealthhub.com", 105, 28, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Token section - prominent
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(15, 40, 180, 25, 3, 3, 'F');
  
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text("Appointment Token", 20, 50);
  
  doc.setFontSize(22);
  doc.setTextColor(11, 107, 97);
  doc.text(appointmentData.tokenId || "N/A", 20, 60);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Queue Number: ${appointmentData.queueNumber || "N/A"}`, 120, 55);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text("Show this token at reception", 120, 62);

  // Patient details section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text("Patient Information", 15, 75);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 77, 195, 77);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  let yPos = 85;
  const leftCol = 20;
  const rightCol = 110;
  
  // Left column
  doc.setFont(undefined, 'bold');
  doc.text("Name:", leftCol, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(patientData.name || "N/A", leftCol + 25, yPos);
  
  yPos += 7;
  doc.setFont(undefined, 'bold');
  doc.text("Age:", leftCol, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(String(patientData.age || "N/A"), leftCol + 25, yPos);
  
  yPos += 7;
  doc.setFont(undefined, 'bold');
  doc.text("Blood Group:", leftCol, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(patientData.bloodgroup || "N/A", leftCol + 25, yPos);
  
  // Right column
  yPos = 85;
  doc.setFont(undefined, 'bold');
  doc.text("Date:", rightCol, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(formatDate(appointmentData.date), rightCol + 25, yPos);
  
  yPos += 7;
  doc.setFont(undefined, 'bold');
  doc.text("Time:", rightCol, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(convertTo12Hour(appointmentData.time) || "N/A", rightCol + 25, yPos);
  
  yPos += 7;
  doc.setFont(undefined, 'bold');
  doc.text("Doctor:", rightCol, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(appointmentData.docname || "N/A", rightCol + 25, yPos);

  // Two column section for tests and prescription
  yPos = 115;
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text("Medical Details", 15, yPos);
  doc.line(15, yPos + 2, 195, yPos + 2);
  
  yPos += 10;
  
  // Left column - Lab Tests (smaller)
  const labTestX = 15;
  const labTestWidth = 65;
  
  doc.setFillColor(250, 250, 250);
  doc.rect(labTestX, yPos, labTestWidth, 80, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(labTestX, yPos, labTestWidth, 80);
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text("Suggested Lab Tests", labTestX + 3, yPos + 7);
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text("(To be filled by doctor)", labTestX + 3, yPos + 13);
  
  // Placeholder lines for tests
  doc.setDrawColor(220, 220, 220);
  for(let i = 0; i < 8; i++) {
    doc.line(labTestX + 3, yPos + 20 + (i * 7), labTestX + labTestWidth - 3, yPos + 20 + (i * 7));
  }
  
  // Right column - Prescription (larger)
  const prescX = labTestX + labTestWidth + 5;
  const prescWidth = 110;
  
  doc.setFillColor(255, 255, 255);
  doc.rect(prescX, yPos, prescWidth, 80, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(prescX, yPos, prescWidth, 80);
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text("Doctor's Prescription & Notes", prescX + 3, yPos + 7);
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text("Diagnosis, Treatment & Medication Details", prescX + 3, yPos + 13);
  
  // Placeholder lines
  doc.setDrawColor(220, 220, 220);
  for(let i = 0; i < 8; i++) {
    doc.line(prescX + 3, yPos + 20 + (i * 7), prescX + prescWidth - 3, yPos + 20 + (i * 7));
  }

  // Footer section
  yPos = 210;
  
  doc.setFillColor(245, 245, 245);
  doc.rect(15, yPos, 180, 25, 'F');
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text("Important Instructions:", 20, yPos + 7);
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.text("* Please arrive 15 minutes before your appointment time", 20, yPos + 12);
  doc.text("* Bring this receipt and your ID proof", 20, yPos + 17);
  doc.text("* Consultation fee paid: Rs." + (appointmentData.amount || "0"), 20, yPos + 22);
  
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`Receipt ID: ${appointmentData.payment_id || "N/A"} | Generated: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

  // Save the PDF
  const fileName = `Receipt_${appointmentData.tokenId || 'appointment'}.pdf`;
  doc.save(fileName);
};

// Component to trigger download
const ReceiptGenerator = ({ appointmentData, patientData, buttonText = "Download Receipt" }) => {
  
  const handleDownload = () => {
    if (!appointmentData || !patientData) {
      alert("Missing appointment or patient data");
      return;
    }
    
    try {
      generateReceipt(appointmentData, patientData);
    } catch (error) {
      console.error("Error generating receipt:", error);
      alert("Failed to generate receipt. Please try again.");
    }
  };

  return (
    <button 
      onClick={handleDownload}
      style={{
        padding: '10px 20px',
        background: 'linear-gradient(135deg, #0b6b61, #139b86)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.3s ease',
      }}
      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
    >
      📄 {buttonText}
    </button>
  );
};

export default ReceiptGenerator;
export { generateReceipt };
