/*
 * UB E-Health - Prescription Management Service
 * Handles prescription generation, QR codes, and drug interactions
 * Copyright (c) 2025-2026 Shaishav
 * Licensed under MIT License
 */

const QRCode = require('qrcode');

/**
 * Generate QR code for prescription
 * @param {Object} prescription - Prescription data
 * @returns {Promise<String>} Base64 encoded QR code
 */
async function generatePrescriptionQR(prescription) {
  try {
    const qrData = {
      prescriptionNumber: prescription.prescriptionNumber,
      patientName: prescription.patientid?.name || 'Unknown',
      doctorName: prescription.doctorid?.name || 'Unknown',
      issueDate: prescription.issueDate,
      medications: prescription.medications.map(med => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration
      })),
      verifyUrl: `${process.env.APP_URL || 'http://localhost:3000'}/verify-prescription/${prescription.prescriptionNumber}`
    };

    // Generate QR code as base64 data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Check for drug interactions
 * @param {Array} medications - Array of medication names
 * @returns {Array} Array of potential interactions
 */
function checkDrugInteractions(medications) {
  // Common drug interaction database (simplified)
  const interactions = {
    'Aspirin': ['Warfarin', 'Ibuprofen', 'Naproxen'],
    'Warfarin': ['Aspirin', 'Ibuprofen', 'Vitamin K'],
    'Ibuprofen': ['Aspirin', 'Warfarin', 'Naproxen'],
    'Metformin': ['Alcohol', 'Contrast Dye'],
    'Lisinopril': ['Potassium Supplements', 'Spironolactone'],
    'Simvastatin': ['Grapefruit Juice', 'Clarithromycin'],
    'Amoxicillin': ['Methotrexate', 'Warfarin'],
    'Ciprofloxacin': ['Antacids', 'Dairy Products', 'Theophylline'],
    'Prednisone': ['NSAIDs', 'Warfarin', 'Vaccines'],
    'Levothyroxine': ['Calcium', 'Iron', 'Antacids']
  };

  const warnings = [];
  const medNames = medications.map(m => m.name || m);

  for (let i = 0; i < medNames.length; i++) {
    for (let j = i + 1; j < medNames.length; j++) {
      const med1 = medNames[i];
      const med2 = medNames[j];

      // Check if med1 interacts with med2
      if (interactions[med1] && interactions[med1].includes(med2)) {
        warnings.push({
          severity: 'HIGH',
          medication1: med1,
          medication2: med2,
          warning: `${med1} may interact with ${med2}. Consult your doctor.`,
          recommendation: 'Monitor for side effects and inform your doctor immediately if you experience any unusual symptoms.'
        });
      }

      // Check if med2 interacts with med1
      if (interactions[med2] && interactions[med2].includes(med1)) {
        warnings.push({
          severity: 'HIGH',
          medication1: med2,
          medication2: med1,
          warning: `${med2} may interact with ${med1}. Consult your doctor.`,
          recommendation: 'Monitor for side effects and inform your doctor immediately if you experience any unusual symptoms.'
        });
      }
    }
  }

  // Remove duplicates
  const uniqueWarnings = warnings.filter((warning, index, self) =>
    index === self.findIndex((w) => (
      w.medication1 === warning.medication1 && w.medication2 === warning.medication2
    ))
  );

  return uniqueWarnings;
}

/**
 * Calculate medication end date
 * @param {Date} startDate - Start date
 * @param {String} duration - Duration string (e.g., "7 days", "2 weeks")
 * @returns {Date} End date
 */
function calculateEndDate(startDate, duration) {
  const start = new Date(startDate);
  const durationLower = duration.toLowerCase();

  // Extract number and unit
  const match = durationLower.match(/(\d+)\s*(day|days|week|weeks|month|months)/);
  
  if (!match) {
    // Default to 7 days if duration format is not recognized
    start.setDate(start.getDate() + 7);
    return start;
  }

  const amount = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'day':
    case 'days':
      start.setDate(start.getDate() + amount);
      break;
    case 'week':
    case 'weeks':
      start.setDate(start.getDate() + (amount * 7));
      break;
    case 'month':
    case 'months':
      start.setMonth(start.getMonth() + amount);
      break;
  }

  return start;
}

/**
 * Generate medication reminders schedule
 * @param {Object} medication - Medication object
 * @returns {Array} Array of reminder times
 */
function generateReminderSchedule(medication) {
  const reminders = [];
  const frequency = medication.frequency.toLowerCase();

  // Parse frequency
  if (frequency.includes('once') || frequency.includes('1 time')) {
    reminders.push({ time: '09:00', label: 'Morning' });
  } else if (frequency.includes('twice') || frequency.includes('2 times')) {
    reminders.push(
      { time: '09:00', label: 'Morning' },
      { time: '21:00', label: 'Night' }
    );
  } else if (frequency.includes('thrice') || frequency.includes('3 times')) {
    reminders.push(
      { time: '09:00', label: 'Morning' },
      { time: '14:00', label: 'Afternoon' },
      { time: '21:00', label: 'Night' }
    );
  } else if (frequency.includes('four') || frequency.includes('4 times')) {
    reminders.push(
      { time: '08:00', label: 'Morning' },
      { time: '13:00', label: 'Afternoon' },
      { time: '18:00', label: 'Evening' },
      { time: '22:00', label: 'Night' }
    );
  } else {
    // Default to twice daily
    reminders.push(
      { time: '09:00', label: 'Morning' },
      { time: '21:00', label: 'Night' }
    );
  }

  return reminders;
}

/**
 * Validate prescription data
 * @param {Object} prescriptionData - Prescription data to validate
 * @returns {Object} Validation result
 */
function validatePrescription(prescriptionData) {
  const errors = [];

  if (!prescriptionData.patientid) {
    errors.push('Patient ID is required');
  }

  if (!prescriptionData.doctorid) {
    errors.push('Doctor ID is required');
  }

  if (!prescriptionData.medications || prescriptionData.medications.length === 0) {
    errors.push('At least one medication is required');
  } else {
    prescriptionData.medications.forEach((med, index) => {
      if (!med.name) errors.push(`Medication ${index + 1}: Name is required`);
      if (!med.dosage) errors.push(`Medication ${index + 1}: Dosage is required`);
      if (!med.frequency) errors.push(`Medication ${index + 1}: Frequency is required`);
      if (!med.duration) errors.push(`Medication ${index + 1}: Duration is required`);
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format prescription for display
 * @param {Object} prescription - Prescription object
 * @returns {Object} Formatted prescription
 */
function formatPrescriptionForDisplay(prescription) {
  return {
    prescriptionNumber: prescription.prescriptionNumber,
    issueDate: new Date(prescription.issueDate).toLocaleDateString(),
    expiryDate: prescription.expiryDate ? new Date(prescription.expiryDate).toLocaleDateString() : 'N/A',
    status: prescription.status,
    patient: {
      name: prescription.patientid?.name || 'Unknown',
      age: prescription.patientid?.age || 'N/A',
      gender: prescription.patientid?.gender || 'N/A'
    },
    doctor: {
      name: prescription.doctorid?.name || 'Unknown',
      specialization: prescription.doctorid?.specialization || 'N/A'
    },
    diagnosis: prescription.diagnosis || 'N/A',
    medications: prescription.medications.map(med => ({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      instructions: med.instructions || 'Take as directed',
      refillsRemaining: med.refillsRemaining || 0,
      endDate: med.endDate ? new Date(med.endDate).toLocaleDateString() : 'N/A'
    })),
    notes: prescription.notes || '',
    qrCode: prescription.qrCode
  };
}

module.exports = {
  generatePrescriptionQR,
  checkDrugInteractions,
  calculateEndDate,
  generateReminderSchedule,
  validatePrescription,
  formatPrescriptionForDisplay
};
