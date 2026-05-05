/*
 * UB E-Health - Lab Report Model
 * Copyright (c) 2025-2026 Shaishav
 * Licensed under MIT License
 */

const mongoose = require("mongoose");

const labReportSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },
  testType: {
    type: String,
    required: true,
    enum: [
      "Complete Blood Count (CBC)",
      "Hemoglobin Test",
      "Blood Sugar (Fasting)",
      "Blood Sugar (Random)",
      "Lipid Profile",
      "Liver Function Test (LFT)",
      "Kidney Function Test (KFT)",
      "Thyroid Profile",
      "Vitamin D Test",
      "Vitamin B12 Test",
      "Urine Routine",
      "HbA1c Test",
      "Other"
    ]
  },
  testName: {
    type: String,
    required: true
  },
  homeService: {
    type: Boolean,
    default: false
  },
  address: {
    type: String,
    required: function() { return this.homeService; }
  },
  preferredDate: {
    type: Date,
    required: true
  },
  preferredTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["Pending", "Sample Collected", "Processing", "Completed", "Cancelled"],
    default: "Pending"
  },
  sampleCollectedDate: {
    type: Date
  },
  results: {
    parameters: [{
      name: String,
      value: String,
      unit: String,
      normalRange: String,
      status: {
        type: String,
        enum: ["Normal", "High", "Low", "Critical"]
      }
    }],
    summary: String,
    remarks: String,
    technician: String
  },
  reportDate: {
    type: Date
  },
  reportFile: {
    fileName: String,
    filePath: String
  },
  cost: {
    type: Number,
    required: true
  },
  payment_id: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending"
  },
  labTechnician: {
    name: String,
    id: String
  }
}, { timestamps: true });

const LabReport = mongoose.model("LabReport", labReportSchema);

// Create lab test request
const createLabTestRequest = async (data) => {
  const labReport = new LabReport(data);
  return await labReport.save();
};

// Get all lab reports for a patient
const getPatientLabReports = async (patientId) => {
  return await LabReport.find({ patientId })
    .populate("patientId", "name email age gender bloodGroup phone")
    .sort({ createdAt: -1 });
};

// Get all lab test requests (for admin)
const getAllLabTestRequests = async () => {
  return await LabReport.find()
    .populate("patientId", "name email phone address")
    .sort({ createdAt: -1 });
};

// Get lab report by ID
const getLabReportById = async (reportId) => {
  return await LabReport.findById(reportId)
    .populate("patientId", "name email age gender bloodGroup phone");
};

// Update lab report status
const updateLabReportStatus = async (reportId, status, additionalData = {}) => {
  const updateData = { status, ...additionalData };
  
  if (status === "Sample Collected") {
    updateData.sampleCollectedDate = new Date();
  } else if (status === "Completed") {
    updateData.reportDate = new Date();
  }
  
  return await LabReport.findByIdAndUpdate(
    reportId,
    updateData,
    { new: true }
  );
};

// Update lab report results
const updateLabReportResults = async (reportId, results) => {
  return await LabReport.findByIdAndUpdate(
    reportId,
    { 
      results,
      status: "Completed",
      reportDate: new Date()
    },
    { new: true }
  );
};

// Delete lab report
const deleteLabReport = async (reportId) => {
  return await LabReport.findByIdAndDelete(reportId);
};

// Get pending lab test requests
const getPendingLabTests = async () => {
  return await LabReport.find({ 
    status: { $in: ["Pending", "Sample Collected", "Processing"] }
  })
    .populate("patientId", "name email phone address")
    .sort({ preferredDate: 1 });
};

// Get home service requests
const getHomeServiceRequests = async () => {
  return await LabReport.find({ 
    homeService: true,
    status: { $in: ["Pending", "Sample Collected"] }
  })
    .populate("patientId", "name email phone address")
    .sort({ preferredDate: 1 });
};

module.exports = {
  LabReport,
  createLabTestRequest,
  getPatientLabReports,
  getAllLabTestRequests,
  getLabReportById,
  updateLabReportStatus,
  updateLabReportResults,
  deleteLabReport,
  getPendingLabTests,
  getHomeServiceRequests
};
