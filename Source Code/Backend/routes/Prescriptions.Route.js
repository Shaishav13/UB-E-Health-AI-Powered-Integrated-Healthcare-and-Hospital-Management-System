/*
 * UB E-Health - Prescription Routes
 * API endpoints for prescription management
 * Copyright (c) 2025-2026 Shaishav
 * Licensed under MIT License
 */

const express = require("express");
const router = express.Router();
const {
  Prescription,
  createPrescription,
  getPrescriptionById,
  getPrescriptionByNumber,
  getPatientMedicine,
  requestRefill,
  updatePrescriptionStatus,
  markAsCompleted,
  removeMedicine,
  clearCompleted
} = require("../models/Prescription.model");
const {
  generatePrescriptionQR,
  checkDrugInteractions,
  calculateEndDate,
  generateReminderSchedule,
  validatePrescription,
  formatPrescriptionForDisplay
} = require("../services/prescriptionService");

// Create new prescription with QR code
router.post("/create", async (req, res) => {
  try {
    const prescriptionData = req.body;

    // Validate prescription data
    const validation = validatePrescription(prescriptionData);
    if (!validation.isValid) {
      return res.status(400).send({
        message: "Validation failed",
        errors: validation.errors
      });
    }

    // Check for drug interactions
    const interactions = checkDrugInteractions(prescriptionData.medications);
    
    // Calculate end dates for medications
    prescriptionData.medications = prescriptionData.medications.map(med => ({
      ...med,
      startDate: med.startDate || new Date(),
      endDate: calculateEndDate(med.startDate || new Date(), med.duration)
    }));

    // Set prescription expiry date (longest medication duration + 30 days)
    const latestEndDate = new Date(Math.max(...prescriptionData.medications.map(m => new Date(m.endDate))));
    latestEndDate.setDate(latestEndDate.getDate() + 30);
    prescriptionData.expiryDate = latestEndDate;

    // Create prescription
    const prescription = await createPrescription(prescriptionData);

    // Generate QR code
    const populatedPrescription = await getPrescriptionById(prescription._id);
    const qrCode = await generatePrescriptionQR(populatedPrescription);
    
    // Update prescription with QR code
    prescription.qrCode = qrCode;
    await prescription.save();

    res.status(201).send({
      message: "Prescription created successfully",
      prescription: formatPrescriptionForDisplay(populatedPrescription),
      interactions: interactions.length > 0 ? interactions : null,
      qrCode
    });
  } catch (error) {
    console.error("Error creating prescription:", error);
    res.status(500).send({
      message: "Error creating prescription",
      error: error.message
    });
  }
});

// Get prescription by ID
router.get("/:id", async (req, res) => {
  try {
    const prescription = await getPrescriptionById(req.params.id);
    
    if (!prescription) {
      return res.status(404).send({ message: "Prescription not found" });
    }

    res.status(200).send({
      message: "Prescription retrieved successfully",
      prescription: formatPrescriptionForDisplay(prescription)
    });
  } catch (error) {
    console.error("Error fetching prescription:", error);
    res.status(500).send({
      message: "Error fetching prescription",
      error: error.message
    });
  }
});

// Get prescription by prescription number (for QR code verification)
router.get("/verify/:prescriptionNumber", async (req, res) => {
  try {
    const prescription = await getPrescriptionByNumber(req.params.prescriptionNumber);
    
    if (!prescription) {
      return res.status(404).send({ message: "Prescription not found" });
    }

    res.status(200).send({
      message: "Prescription verified successfully",
      prescription: formatPrescriptionForDisplay(prescription),
      isValid: prescription.status === 'active' && new Date(prescription.expiryDate) > new Date()
    });
  } catch (error) {
    console.error("Error verifying prescription:", error);
    res.status(500).send({
      message: "Error verifying prescription",
      error: error.message
    });
  }
});

// Get all prescriptions for a patient
router.get("/patient/:patientId", async (req, res) => {
  try {
    const prescriptions = await getPatientMedicine(req.params.patientId);
    
    res.status(200).send({
      message: "Prescriptions retrieved successfully",
      prescriptions
    });
  } catch (error) {
    console.error("Error fetching patient prescriptions:", error);
    res.status(500).send({
      message: "Error fetching prescriptions",
      error: error.message
    });
  }
});

// Get all prescriptions by a doctor
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorid: req.params.doctorId })
      .populate('patientid', 'name age gender phone')
      .populate('doctorid', 'name specialization')
      .sort({ createdAt: -1 });
    
    res.status(200).send({
      message: "Prescriptions retrieved successfully",
      prescriptions: prescriptions.map(p => formatPrescriptionForDisplay(p))
    });
  } catch (error) {
    console.error("Error fetching doctor prescriptions:", error);
    res.status(500).send({
      message: "Error fetching prescriptions",
      error: error.message
    });
  }
});

// Request refill for a medication
router.post("/:id/refill", async (req, res) => {
  try {
    const { medicationIndex } = req.body;
    
    const prescription = await requestRefill(req.params.id, medicationIndex);
    
    if (!prescription) {
      return res.status(404).send({ message: "Prescription not found" });
    }

    res.status(200).send({
      message: "Refill requested successfully",
      prescription: formatPrescriptionForDisplay(await getPrescriptionById(prescription._id))
    });
  } catch (error) {
    console.error("Error requesting refill:", error);
    res.status(500).send({
      message: "Error requesting refill",
      error: error.message
    });
  }
});

// Update prescription status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'completed', 'cancelled', 'expired'].includes(status)) {
      return res.status(400).send({ message: "Invalid status" });
    }

    const prescription = await updatePrescriptionStatus(req.params.id, status);
    
    if (!prescription) {
      return res.status(404).send({ message: "Prescription not found" });
    }

    res.status(200).send({
      message: "Prescription status updated successfully",
      prescription: formatPrescriptionForDisplay(await getPrescriptionById(prescription._id))
    });
  } catch (error) {
    console.error("Error updating prescription status:", error);
    res.status(500).send({
      message: "Error updating prescription status",
      error: error.message
    });
  }
});

// Check drug interactions
router.post("/check-interactions", async (req, res) => {
  try {
    const { medications } = req.body;
    
    if (!medications || !Array.isArray(medications)) {
      return res.status(400).send({ message: "Medications array is required" });
    }

    const interactions = checkDrugInteractions(medications);
    
    res.status(200).send({
      message: "Drug interactions checked",
      hasInteractions: interactions.length > 0,
      interactions
    });
  } catch (error) {
    console.error("Error checking drug interactions:", error);
    res.status(500).send({
      message: "Error checking drug interactions",
      error: error.message
    });
  }
});

// Get medication reminders schedule
router.get("/:id/reminders", async (req, res) => {
  try {
    const prescription = await getPrescriptionById(req.params.id);
    
    if (!prescription) {
      return res.status(404).send({ message: "Prescription not found" });
    }

    const reminders = prescription.medications.map(med => ({
      medication: med.name,
      schedule: generateReminderSchedule(med),
      startDate: med.startDate,
      endDate: med.endDate
    }));

    res.status(200).send({
      message: "Reminders retrieved successfully",
      reminders
    });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    res.status(500).send({
      message: "Error fetching reminders",
      error: error.message
    });
  }
});

// Legacy endpoints for backward compatibility
router.post("/markascompleted/:id", async (req, res) => {
  try {
    const prescription = await markAsCompleted(req.params.id);
    res.status(200).send({
      message: "Prescription marked as completed",
      prescription
    });
  } catch (error) {
    console.error("Error marking as completed:", error);
    res.status(500).send({
      message: "Error marking as completed",
      error: error.message
    });
  }
});

router.delete("/remove/:id", async (req, res) => {
  try {
    await removeMedicine(req.params.id);
    res.status(200).send({ message: "Prescription removed successfully" });
  } catch (error) {
    console.error("Error removing prescription:", error);
    res.status(500).send({
      message: "Error removing prescription",
      error: error.message
    });
  }
});

router.delete("/clearcompleted/:patientId", async (req, res) => {
  try {
    await clearCompleted(req.params.patientId);
    res.status(200).send({ message: "Completed prescriptions cleared" });
  } catch (error) {
    console.error("Error clearing completed:", error);
    res.status(500).send({
      message: "Error clearing completed prescriptions",
      error: error.message
    });
  }
});

module.exports = router;
