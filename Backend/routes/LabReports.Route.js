/*
 * UB E-Health - Lab Reports Routes
 * Copyright (c) 2025-2026 Shaishav
 * Licensed under MIT License
 */

const express = require("express");
const mongoose = require("mongoose");
const {
  createLabTestRequest,
  getPatientLabReports,
  getAllLabTestRequests,
  getLabReportById,
  updateLabReportStatus,
  updateLabReportResults,
  deleteLabReport,
  getPendingLabTests,
  getHomeServiceRequests
} = require("../models/LabReport.model");
const { authenticate: labAuth } = require("../middlewares/labAuth");
const { authenticate: doctorOrLabAuth } = require("../middlewares/doctorOrLabAuth");
const { generateAIInterpretation } = require("../services/geminiAIService");
const { interpretLabReport } = require("../services/aiReportInterpreter");

const router = express.Router();

// Create lab test request (Patient)
router.post("/request", async (req, res) => {
  try {
    const { 
      patientId, 
      testType, 
      testName, 
      homeService, 
      address, 
      preferredDate, 
      preferredTime,
      cost 
    } = req.body;

    if (!patientId || !testType || !testName || !preferredDate || !preferredTime || !cost) {
      return res.status(400).send({ 
        message: "Missing required fields" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).send({ 
        message: "Invalid patient ID" 
      });
    }

    if (homeService && !address) {
      return res.status(400).send({ 
        message: "Address is required for home service" 
      });
    }

    const labReport = await createLabTestRequest({
      patientId,
      testType,
      testName,
      homeService: homeService || false,
      address: homeService ? address : undefined,
      preferredDate,
      preferredTime,
      cost
    });

    console.log(`✅ Lab test requested: ${testName} for patient ${patientId}`);

    res.status(201).send({ 
      message: "Lab test request created successfully", 
      labReport 
    });
  } catch (error) {
    console.error("Error creating lab test request:", error);
    res.status(500).send({ 
      message: "Error creating lab test request", 
      error: error.message 
    });
  }
});

// Get patient lab reports
router.get("/patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).send({ 
        message: "Invalid patient ID" 
      });
    }

    const labReports = await getPatientLabReports(patientId);

    res.status(200).send({ 
      message: "Success", 
      labReports,
      count: labReports.length 
    });
  } catch (error) {
    console.error("Error fetching patient lab reports:", error);
    res.status(500).send({ 
      message: "Error fetching lab reports", 
      error: error.message 
    });
  }
});

// Get patient lab history (Lab Personnel or Doctor)
router.get("/patient/:patientId/history", doctorOrLabAuth, async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).send({ 
        message: "Invalid patient ID" 
      });
    }

    const labReports = await getPatientLabReports(patientId);

    const userIdentifier = req.user.labId || req.user.doctorID;
    console.log(`✅ Lab history accessed by ${userIdentifier} (${req.user.userType}) for patient ${patientId}`);

    res.status(200).send({ 
      message: "Success", 
      labReports,
      count: labReports.length 
    });
  } catch (error) {
    console.error("Error fetching patient lab history:", error);
    res.status(500).send({ 
      message: "Error fetching lab history", 
      error: error.message 
    });
  }
});

// Get all lab test requests (Admin or Lab Personnel)
router.get("/all", labAuth, async (req, res) => {
  try {
    const labReports = await getAllLabTestRequests();

    res.status(200).send({ 
      message: "Success", 
      labReports,
      count: labReports.length 
    });
  } catch (error) {
    console.error("Error fetching all lab reports:", error);
    res.status(500).send({ 
      message: "Error fetching lab reports", 
      error: error.message 
    });
  }
});

// Get pending lab tests (Lab Personnel)
router.get("/pending", labAuth, async (req, res) => {
  try {
    const labReports = await getPendingLabTests();

    res.status(200).send({ 
      message: "Success", 
      labReports,
      count: labReports.length 
    });
  } catch (error) {
    console.error("Error fetching pending lab tests:", error);
    res.status(500).send({ 
      message: "Error fetching pending lab tests", 
      error: error.message 
    });
  }
});

// Get home service requests
router.get("/home-service", labAuth, async (req, res) => {
  try {
    const labReports = await getHomeServiceRequests();

    res.status(200).send({ 
      message: "Success", 
      labReports,
      count: labReports.length 
    });
  } catch (error) {
    console.error("Error fetching home service requests:", error);
    res.status(500).send({ 
      message: "Error fetching home service requests", 
      error: error.message 
    });
  }
});

// Get lab report by ID (Lab Personnel)
router.get("/:reportId", labAuth, async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).send({ 
        message: "Invalid report ID" 
      });
    }

    const labReport = await getLabReportById(reportId);

    if (!labReport) {
      return res.status(404).send({ 
        message: "Lab report not found" 
      });
    }

    res.status(200).send({ 
      message: "Success", 
      labReport 
    });
  } catch (error) {
    console.error("Error fetching lab report:", error);
    res.status(500).send({ 
      message: "Error fetching lab report", 
      error: error.message 
    });
  }
});

// Update lab report status
router.patch("/:reportId/status", async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, labTechnician } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).send({ 
        message: "Invalid report ID" 
      });
    }

    if (!status) {
      return res.status(400).send({ 
        message: "Status is required" 
      });
    }

    const additionalData = {};
    if (labTechnician) {
      additionalData.labTechnician = labTechnician;
    }

    const labReport = await updateLabReportStatus(reportId, status, additionalData);

    if (!labReport) {
      return res.status(404).send({ 
        message: "Lab report not found" 
      });
    }

    console.log(`✅ Lab report status updated: ${reportId} -> ${status}`);

    res.status(200).send({ 
      message: "Status updated successfully", 
      labReport 
    });
  } catch (error) {
    console.error("Error updating lab report status:", error);
    res.status(500).send({ 
      message: "Error updating status", 
      error: error.message 
    });
  }
});

// Update lab report status (Lab Personnel)
router.put("/update-status/:id", labAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ 
        message: "Invalid report ID" 
      });
    }

    if (!status) {
      return res.status(400).send({ 
        message: "Status is required" 
      });
    }

    // Get lab personnel info from authenticated user
    const labTechnician = {
      labId: req.user.labId,
      email: req.user.email
    };

    const labReport = await updateLabReportStatus(id, status, { labTechnician });

    if (!labReport) {
      return res.status(404).send({ 
        message: "Lab report not found" 
      });
    }

    console.log(`✅ Lab report status updated by ${req.user.labId}: ${id} -> ${status}`);

    res.status(200).send({ 
      message: "Status updated successfully", 
      labReport 
    });
  } catch (error) {
    console.error("Error updating lab report status:", error);
    res.status(500).send({ 
      message: "Error updating status", 
      error: error.message 
    });
  }
});

// Update lab report results
router.put("/:reportId/results", async (req, res) => {
  try {
    const { reportId } = req.params;
    const { results } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).send({ 
        message: "Invalid report ID" 
      });
    }

    if (!results) {
      return res.status(400).send({ 
        message: "Results are required" 
      });
    }

    const labReport = await updateLabReportResults(reportId, results);

    if (!labReport) {
      return res.status(404).send({ 
        message: "Lab report not found" 
      });
    }

    console.log(`✅ Lab report results updated: ${reportId}`);

    res.status(200).send({ 
      message: "Results updated successfully", 
      labReport 
    });
  } catch (error) {
    console.error("Error updating lab report results:", error);
    res.status(500).send({ 
      message: "Error updating results", 
      error: error.message 
    });
  }
});

// Add lab report results (Lab Personnel)
router.put("/add-results/:id", labAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { results } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ 
        message: "Invalid report ID" 
      });
    }

    if (!results) {
      return res.status(400).send({ 
        message: "Results are required" 
      });
    }

    // Add lab personnel info to results
    const resultsWithTechnician = {
      ...results,
      labTechnician: {
        labId: req.user.labId,
        email: req.user.email
      }
    };

    const labReport = await updateLabReportResults(id, resultsWithTechnician);

    if (!labReport) {
      return res.status(404).send({ 
        message: "Lab report not found" 
      });
    }

    console.log(`✅ Lab report results added by ${req.user.labId}: ${id}`);

    res.status(200).send({ 
      message: "Results added successfully", 
      labReport 
    });
  } catch (error) {
    console.error("Error adding lab report results:", error);
    res.status(500).send({ 
      message: "Error adding results", 
      error: error.message 
    });
  }
});

// Update payment status
router.patch("/:reportId/payment", async (req, res) => {
  try {
    const { reportId } = req.params;
    const { paymentStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).send({ 
        message: "Invalid report ID" 
      });
    }

    const labReport = await updateLabReportStatus(reportId, undefined, { paymentStatus });

    if (!labReport) {
      return res.status(404).send({ 
        message: "Lab report not found" 
      });
    }

    res.status(200).send({ 
      message: "Payment status updated", 
      labReport 
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).send({ 
      message: "Error updating payment status", 
      error: error.message 
    });
  }
});

// Delete lab report
router.delete("/:reportId", async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).send({ 
        message: "Invalid report ID" 
      });
    }

    const labReport = await deleteLabReport(reportId);

    if (!labReport) {
      return res.status(404).send({ 
        message: "Lab report not found" 
      });
    }

    console.log(`✅ Lab report deleted: ${reportId}`);

    res.status(200).send({ 
      message: "Lab report deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting lab report:", error);
    res.status(500).send({ 
      message: "Error deleting lab report", 
      error: error.message 
    });
  }
});

// AI Report Interpretation - Generate patient-friendly summary
router.post("/:reportId/interpret", async (req, res) => {
  try {
    const { reportId } = req.params;
    const { useAI } = req.body; // Optional: use true for Gemini AI, false for rule-based

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).send({ 
        message: "Invalid report ID" 
      });
    }

    const labReport = await getLabReportById(reportId);

    if (!labReport) {
      return res.status(404).send({ 
        message: "Lab report not found" 
      });
    }

    // Check if report has results
    if (!labReport.results || !labReport.results.parameters || labReport.results.parameters.length === 0) {
      return res.status(400).send({ 
        message: "This report does not have results to interpret yet" 
      });
    }

    let interpretation;

    // Use Gemini AI if requested and available, otherwise use rule-based
    if (useAI !== false && process.env.GEMINI_API_KEY) {
      try {
        console.log(`🤖 Generating AI interpretation for report: ${reportId}`);
        interpretation = await generateAIInterpretation(labReport);
        console.log(`✅ AI interpretation generated successfully`);
      } catch (aiError) {
        console.warn(`⚠️ AI interpretation failed, falling back to rule-based: ${aiError.message}`);
        interpretation = interpretLabReport(labReport);
      }
    } else {
      // Use rule-based interpretation
      console.log(`📋 Generating rule-based interpretation for report: ${reportId}`);
      interpretation = interpretLabReport(labReport);
    }

    res.status(200).send({ 
      message: "Interpretation generated successfully", 
      interpretation,
      reportId: reportId,
      testName: labReport.testName,
      reportDate: labReport.reportDate || labReport.updatedAt,
      aiPowered: useAI !== false && process.env.GEMINI_API_KEY ? true : false
    });
  } catch (error) {
    console.error("Error generating interpretation:", error);
    res.status(500).send({ 
      message: error.message || "Error generating interpretation", 
      error: error.message 
    });
  }
});

module.exports = router;
