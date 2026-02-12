import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateReport = (report, user) => {
  const doc = new jsPDF();
  
  // Debug logging - check what we received
  console.log('=== REPORT GENERATOR DEBUG ===');
  console.log('Full report object:', report);
  console.log('Report keys:', Object.keys(report));
  console.log('Patient ID field:', report.patientid);
  console.log('Patient ID type:', typeof report.patientid);
  
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
  
  // Get patient and doctor names - handle both populated and string ID cases
  let patientName = 'N/A';
  let patientInfo = {};
  
  if (report.patientid) {
    if (typeof report.patientid === 'object' && report.patientid.name) {
      // Populated object
      patientName = report.patientid.name;
      patientInfo = report.patientid;
      console.log('Patient data is populated object:', patientInfo);
    } else if (typeof report.patientid === 'string') {
      // Just an ID string
      console.log('Patient data is just an ID string:', report.patientid);
      patientName = report.patientName || 'N/A';
    }
  }
  
  const doctorName = report.doctorid?.name || report.doctorName || 'N/A';
  
  console.log('Extracted patient name:', patientName);
  console.log('Extracted patient info:', patientInfo);
  
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
  
  // Patient Details Section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Patient Details', 20, yPos);
  
  yPos += 2;
  doc.setDrawColor(11, 107, 97);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  
  yPos += 8;
  
  // Extract patient details with better handling
  const patientAge = patientInfo.age || 'N/A';
  const patientGender = patientInfo.gender === 'M' ? 'Male' : patientInfo.gender === 'F' ? 'Female' : patientInfo.gender || 'N/A';
  const patientBloodGroup = patientInfo.bloodgroup || patientInfo.bloodGroup || 'N/A';
  const patientPhone = patientInfo.phonenum || patientInfo.phoneNum || 'N/A';
  const patientEmail = patientInfo.email || 'N/A';
  
  console.log('Final extracted values:');
  console.log('- Age:', patientAge);
  console.log('- Gender:', patientGender);
  console.log('- Blood Group:', patientBloodGroup);
  console.log('- Phone:', patientPhone);
  console.log('- Email:', patientEmail);
  console.log('=== END DEBUG ===');
  
  doc.setFontSize(10);
  
  // Left column - Patient details
  const detailsLeftCol = 20;
  const detailsRightCol = 110;
  
  doc.setFont(undefined, 'bold');
  doc.text('Age:', detailsLeftCol, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(String(patientAge), detailsLeftCol + 30, yPos);
  
  doc.setFont(undefined, 'bold');
  doc.text('Gender:', detailsRightCol, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(patientGender, detailsRightCol + 30, yPos);
  
  yPos += 7;
  
  doc.setFont(undefined, 'bold');
  doc.text('Blood Group:', detailsLeftCol, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(patientBloodGroup, detailsLeftCol + 30, yPos);
  
  doc.setFont(undefined, 'bold');
  doc.text('Phone:', detailsRightCol, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(String(patientPhone), detailsRightCol + 30, yPos);
  
  yPos += 7;
  
  doc.setFont(undefined, 'bold');
  doc.text('Email:', detailsLeftCol, yPos);
  doc.setFont(undefined, 'normal');
  const emailText = doc.splitTextToSize(patientEmail, 160);
  doc.text(emailText, detailsLeftCol + 30, yPos);
  
  yPos += 10;
  
  // Divider line
  doc.setDrawColor(11, 107, 97);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  
  yPos += 10;
  
  // Vital Signs Section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Vital Signs', 20, yPos);
  
  yPos += 10;
  
  // Create vital signs table manually
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setFillColor(240, 240, 240);
  
  // Row 1
  doc.rect(20, yPos, 85, 10, 'F');
  doc.rect(20, yPos, 85, 10);
  doc.text('Temperature', 25, yPos + 7);
  
  doc.setFont(undefined, 'normal');
  doc.rect(105, yPos, 85, 10);
  doc.text(`${report.temperature || 'N/A'} F`, 110, yPos + 7);
  
  yPos += 10;
  
  // Row 2
  doc.setFont(undefined, 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos, 85, 10, 'F');
  doc.rect(20, yPos, 85, 10);
  doc.text('Weight', 25, yPos + 7);
  
  doc.setFont(undefined, 'normal');
  doc.rect(105, yPos, 85, 10);
  doc.text(`${report.weight || 'N/A'} kg`, 110, yPos + 7);
  
  yPos += 10;
  
  // Row 3
  doc.setFont(undefined, 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos, 85, 10, 'F');
  doc.rect(20, yPos, 85, 10);
  doc.text('Blood Pressure', 25, yPos + 7);
  
  doc.setFont(undefined, 'normal');
  doc.rect(105, yPos, 85, 10);
  doc.text(`${report.bp || 'N/A'} mmHg`, 110, yPos + 7);
  
  yPos += 10;
  
  // Row 4
  doc.setFont(undefined, 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos, 85, 10, 'F');
  doc.rect(20, yPos, 85, 10);
  doc.text('Glucose Level', 25, yPos + 7);
  
  doc.setFont(undefined, 'normal');
  doc.rect(105, yPos, 85, 10);
  doc.text(`${report.glucose || 'N/A'} mg/dL`, 110, yPos + 7);
  
  yPos += 15;
  
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
  
  // Footer with doctor signature - place at bottom of current page if space available
  const pageHeight = doc.internal.pageSize.height;
  const footerHeight = 25; // Height needed for footer
  const minFooterY = pageHeight - 30; // Minimum Y position for footer
  
  // Only add new page if current content goes beyond safe zone
  if (yPos > minFooterY - 10) {
    doc.addPage();
    yPos = 20;
  }
  
  // Place footer at bottom of page
  const footerY = Math.max(yPos + 10, minFooterY);
  
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
