import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReport = (report, user) => {
  const doc = new jsPDF();
  
  // Header with hospital name
  doc.setFillColor(11, 107, 97);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('UB E-Health', 105, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('Medical Report', 105, 25, { align: 'center' });
  
  // Reset text color for body
  doc.setTextColor(0, 0, 0);
  
  // Report details section
  let yPos = 45;
  
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Medical Report', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  // Get patient and doctor names
  const patientName = report.patientid?.name || report.patientName || 'N/A';
  const doctorName = report.doctorid?.name || report.doctorName || 'N/A';
  
  // Format date
  const reportDate = report.date ? new Date(report.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'N/A';
  
  // Format time to AM/PM
  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  const reportTime = formatTime(report.time);
  
  // Report information in two columns
  const leftColumn = [
    { label: 'Patient Name:', value: patientName },
    { label: 'Doctor Name:', value: doctorName },
    { label: 'Date:', value: reportDate },
  ];
  
  const rightColumn = [
    { label: 'Time:', value: reportTime },
    { label: 'Report ID:', value: report._id ? String(report._id).slice(-8).toUpperCase() : 'N/A' },
  ];
  
  // Left column
  leftColumn.forEach((item, index) => {
    doc.setFont(undefined, 'bold');
    doc.text(item.label, 20, yPos + (index * 7));
    doc.setFont(undefined, 'normal');
    doc.text(item.value, 55, yPos + (index * 7));
  });
  
  // Right column
  rightColumn.forEach((item, index) => {
    doc.setFont(undefined, 'bold');
    doc.text(item.label, 110, yPos + (index * 7));
    doc.setFont(undefined, 'normal');
    doc.text(item.value, 135, yPos + (index * 7));
  });
  
  yPos += 30;
  
  // Divider line
  doc.setDrawColor(11, 107, 97);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  
  yPos += 10;
  
  // Vital Signs Section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Vital Signs', 20, yPos);
  
  yPos += 8;
  
  const vitalSigns = [
    ['Temperature', `${report.temperature || 'N/A'} F`, 'Weight', `${report.weight || 'N/A'} kg`],
    ['Blood Pressure', `${report.bp || 'N/A'} mmHg`, 'Glucose Level', `${report.glucose || 'N/A'} mg/dL`],
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: vitalSigns,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 45 },
      1: { cellWidth: 45 },
      2: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 45 },
      3: { cellWidth: 45 },
    },
    margin: { left: 20, right: 20 },
  });
  
  yPos = doc.lastAutoTable.finalY + 10;
  
  // Diagnosis Section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Diagnosis', 20, yPos);
  
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  // Disease/Diagnosis box
  doc.setFillColor(250, 250, 250);
  doc.rect(20, yPos, 170, 15, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, yPos, 170, 15);
  
  const diseaseText = report.disease || 'N/A';
  const splitDisease = doc.splitTextToSize(diseaseText, 160);
  doc.text(splitDisease, 25, yPos + 6);
  
  yPos += 20;
  
  // Additional Information Section
  if (report.info && report.info.trim() !== '') {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Additional Information', 20, yPos);
    
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Info box
    const infoText = report.info;
    const splitInfo = doc.splitTextToSize(infoText, 160);
    const infoHeight = Math.max(20, splitInfo.length * 5 + 10);
    
    // Check if we need a new page
    if (yPos + infoHeight > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFillColor(250, 250, 250);
    doc.rect(20, yPos, 170, infoHeight, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, yPos, 170, infoHeight);
    
    doc.text(splitInfo, 25, yPos + 6);
    
    yPos += infoHeight + 10;
  }
  
  // Prescribed Medications Section
  if (report.medications && report.medications.trim() !== '') {
    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Prescribed Medications', 20, yPos);
    
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Medications box
    const medicationsText = report.medications;
    const splitMedications = doc.splitTextToSize(medicationsText, 160);
    const medicationsHeight = Math.max(20, splitMedications.length * 5 + 10);
    
    // Check if we need a new page
    if (yPos + medicationsHeight > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFillColor(255, 250, 240);
    doc.rect(20, yPos, 170, medicationsHeight, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1);
    doc.rect(20, yPos, 170, medicationsHeight);
    
    doc.text(splitMedications, 25, yPos + 6);
    
    yPos += medicationsHeight + 10;
  }
  
  // Suggested Lab Tests Section
  if (report.labTests && report.labTests.trim() !== '') {
    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Suggested Laboratory Tests', 20, yPos);
    
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Lab tests box
    const labTestsText = report.labTests;
    const splitLabTests = doc.splitTextToSize(labTestsText, 160);
    const labTestsHeight = Math.max(20, splitLabTests.length * 5 + 10);
    
    // Check if we need a new page
    if (yPos + labTestsHeight > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFillColor(240, 250, 255);
    doc.rect(20, yPos, 170, labTestsHeight, 'F');
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.rect(20, yPos, 170, labTestsHeight);
    
    doc.text(splitLabTests, 25, yPos + 6);
    
    yPos += labTestsHeight + 10;
  }
  
  // Footer with doctor signature
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 30;
  
  // Ensure we're on the same page or add new page if needed
  if (yPos > footerY - 20) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setDrawColor(11, 107, 97);
  doc.setLineWidth(0.3);
  doc.line(130, footerY, 180, footerY);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Doctor Signature', 155, footerY + 5, { align: 'center' });
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text(doctorName, 155, footerY + 10, { align: 'center' });
  
  // Footer note
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('This is a computer-generated medical report from UB E-Health', 105, pageHeight - 10, { align: 'center' });
  
  // Generate filename
  const fileName = `Medical_Report_${patientName.replace(/\s+/g, '_')}_${reportDate.replace(/\s+/g, '_')}.pdf`;
  
  // Save the PDF
  doc.save(fileName);
};
