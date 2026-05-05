const express = require("express");
const mongoose = require("mongoose");
const {
  createReport,
  getLastReportId,
  getDoctorReports,
  getPatientReports,
  updateReport,
} = require("../models/Report.model");
const { createMedicine } = require("../models/Prescription.model");
const { markAppointmentCompleted } = require("../models/Appointment.model");
const router = express.Router();

router.get("/:userType/:id", async (req, res) => {
  const id = req.params.id;
  const userType = req.params.userType;
  console.log("route :", userType, id);

  try {
    // Validate ObjectId format - MongoDB ObjectIds are 24 character hex strings
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ 
        message: "Invalid ID format", 
        details: `ID '${id}' is not a valid ObjectId` 
      });
    }

    // Validate userType
    if (!['doctor', 'patient'].includes(userType)) {
      return res.status(400).send({ 
        message: "Invalid user type", 
        details: `UserType '${userType}' must be either 'doctor' or 'patient'` 
      });
    }

    const reports =
      userType === "doctor"
        ? await getDoctorReports(id)
        : await getPatientReports(id);
    
    console.log("=== BACKEND REPORTS DEBUG ===");
    console.log("Number of reports:", reports.length);
    if (reports.length > 0) {
      console.log("First report raw:", reports[0]);
      console.log("First report patientid:", reports[0].patientid);
      console.log("First report patientid type:", typeof reports[0].patientid);
      console.log("Is patientid populated?", reports[0].patientid && typeof reports[0].patientid === 'object' && reports[0].patientid.name);
    }
    console.log("=== END BACKEND DEBUG ===");
    
    // Format the dates in the reports
    const formattedReports = reports.map(report => {
      const reportObj = report.toObject ? report.toObject() : report;
      
      console.log("Processing report:", report._id);
      console.log("Report patientid before formatting:", reportObj.patientid);
      
      return {
        ...reportObj,
        date: report.date ? new Date(report.date).toISOString().split('T')[0] : null, // Format as YYYY-MM-DD
        name: report.patientid?.name || report.doctorid?.name || "Unknown",
        id: report._id,
        // Ensure populated data is included
        patientid: reportObj.patientid,
        doctorid: reportObj.doctorid
      };
    });
    
    console.log("=== FORMATTED REPORTS DEBUG ===");
    console.log("First formatted report patientid:", formattedReports[0]?.patientid);
    console.log("=== END FORMATTED DEBUG ===");
    
    console.log("router reports", formattedReports);
    console.log("First report patientid:", formattedReports[0]?.patientid);
    res.status(200).send({ message: "Successful", data: formattedReports });
  } catch (error) {
    console.error("Error in reports route:", error);
    res.status(400).send({ 
      message: "Error fetching reports", 
      details: error.message,
      error: error.toString()
    });
  }
});

router.post("/create", async (req, res) => {
  const payload = req.body;
  console.log("=== REPORT CREATION DEBUG ===");
  console.log("Full payload:", JSON.stringify(payload, null, 2));
  console.log("Appointment ID from payload:", payload.appointmentid);
  console.log("Patient ID from payload:", payload.patientid);
  console.log("Doctor ID from payload:", payload.doctorid);
  console.log("=== END DEBUG ===");
  
  try {
    // Validate required fields
    if (!payload.patientid || !payload.doctorid || !payload.date || !payload.disease) {
      return res.status(400).send({ 
        message: "Missing required fields", 
        details: "patientid, doctorid, date, and disease are required" 
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(payload.patientid)) {
      return res.status(400).send({ 
        message: "Invalid patient ID format", 
        details: `Patient ID '${payload.patientid}' is not a valid ObjectId` 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(payload.doctorid)) {
      return res.status(400).send({ 
        message: "Invalid doctor ID format", 
        details: `Doctor ID '${payload.doctorid}' is not a valid ObjectId` 
      });
    }

    const data = { ...req.body };
    delete data.medicines;
    delete data.appointmentid;
    
    console.log("Report data to save:", data);
    
    // Create the report
    const createdReport = await createReport(data);
    console.log("Report created:", createdReport);

    // ── Assign patient to doctor when report is created ───────────────────
    // A report being created means the doctor has treated this patient.
    // Set Patient.docID = doctor's numeric doctorId so the chat system
    // (and Patient Details page) recognises the assignment.
    try {
      const Doctor = mongoose.model('Doctor');
      const PatientModel = mongoose.model('Patient');

      const doctor = await Doctor.findById(payload.doctorid);
      if (doctor && doctor.doctorId) {
        const updateResult = await PatientModel.findByIdAndUpdate(
          payload.patientid,
          { docID: doctor.doctorId },
          { new: true }
        );
        if (updateResult) {
          console.log(
            `✅ Patient ${updateResult.name} (${payload.patientid}) assigned to doctor ${doctor.name} (doctorId: ${doctor.doctorId})`
          );
        } else {
          console.warn(`⚠️ Patient ${payload.patientid} not found for assignment`);
        }
      } else {
        console.warn(`⚠️ Doctor ${payload.doctorid} not found or has no numeric doctorId`);
      }
    } catch (assignErr) {
      // Non-fatal — log and continue; report was already created
      console.error('❌ Error assigning patient to doctor:', assignErr.message);
    }
    // ─────────────────────────────────────────────────────────────────────
    
    // Add medicines to medication table if any
    if (payload.medicines && payload.medicines.length > 0) {
      const reportId = await getLastReportId();
      console.log("Last report ID:", reportId);
      
      const med = { rows: payload.medicines, reportid: reportId.id };
      
      // Use Promise.all for better error handling
      await Promise.all(med.rows.map(async (row) => {
        const array = Object.values(row);
        array.push(med.reportid);
        console.log("Creating medicine with array:", array);
        return await createMedicine(array);
      }));
    }
    
    // Mark the appointment as completed instead of deleting it
    if (payload.appointmentid) {
      console.log("🎯 Attempting to mark appointment as completed:", payload.appointmentid);
      console.log("Appointment ID type:", typeof payload.appointmentid);
      console.log("Is valid ObjectId?", mongoose.Types.ObjectId.isValid(payload.appointmentid));
      
      try {
        const result = await markAppointmentCompleted(payload.appointmentid);
        if (result) {
          console.log("✅ Appointment marked as completed successfully:", result._id);
          console.log("New appointment status:", result.status);
        } else {
          console.log("⚠️ No appointment found with ID:", payload.appointmentid);
        }
      } catch (error) {
        console.error("❌ Error marking appointment as completed:", error);
        // Don't fail the entire request if appointment update fails
      }
    } else {
      console.log("⚠️ No appointmentid provided in payload - attempting to find appointment by patient/doctor/date/time");
      
      // Try to find the appointment by patient, doctor, date, and time
      try {
        const appointmentDate = new Date(payload.date);
        console.log("Searching for appointment with:");
        console.log("- Patient ID:", payload.patientid);
        console.log("- Doctor ID:", payload.doctorid);
        console.log("- Date:", appointmentDate);
        console.log("- Time:", payload.time);
        
        const appointment = await mongoose.connection.db.collection('appointments').findOne({
          patientId: new mongoose.Types.ObjectId(payload.patientid),
          doctorId: new mongoose.Types.ObjectId(payload.doctorid),
          date: appointmentDate,
          time: payload.time,
          status: { $ne: 'completed' } // Only find non-completed appointments
        });
        
        if (appointment) {
          console.log("✅ Found appointment to mark as completed:", appointment._id);
          const result = await markAppointmentCompleted(appointment._id);
          console.log("✅ Appointment marked as completed successfully:", result._id);
        } else {
          console.log("❌ No matching appointment found to mark as completed");
          console.log("This might be why the appointment is still showing in the doctor's list");
        }
      } catch (error) {
        console.error("❌ Error finding and marking appointment as completed:", error);
      }
    }
    
    res.status(200).send({ message: "successful", reportId: createdReport._id });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).send({ 
      message: "Error creating report", 
      details: error.message,
      error: error.toString()
    });
  }
});

router.put("/update/:reportId", async (req, res) => {
  const reportId = req.params.reportId;
  const updateData = req.body;
  
  console.log("Updating report:", reportId, "with data:", updateData);
  
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).send({ 
        message: "Invalid report ID format", 
        details: `Report ID '${reportId}' is not a valid ObjectId` 
      });
    }

    // Remove fields that shouldn't be updated
    const allowedFields = ['disease', 'temperature', 'weight', 'bp', 'glucose', 'info'];
    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const updatedReport = await updateReport(reportId, filteredData);
    
    if (!updatedReport) {
      return res.status(404).send({ 
        message: "Report not found", 
        details: `No report found with ID '${reportId}'` 
      });
    }

    console.log("Report updated successfully:", updatedReport);
    res.status(200).send({ message: "successful", report: updatedReport });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).send({ 
      message: "Error updating report", 
      details: error.message,
      error: error.toString()
    });
  }
});

// AI Interpretation for Doctor Reports
router.post("/:reportId/interpret-doctor-report", async (req, res) => {
  try {
    const { reportId } = req.params;
    const { interpretDoctorReport } = require("../services/doctorReportAI");

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).send({ 
        message: "Invalid report ID" 
      });
    }

    // Get the report
    const Report = require("../models/Report.model").Report;
    const report = await Report.findById(reportId)
      .populate("patientid", "name age gender")
      .populate("doctorid", "name specialization");

    if (!report) {
      return res.status(404).send({ 
        message: "Report not found" 
      });
    }

    console.log(`🤖 Generating AI interpretation for doctor report: ${reportId}`);

    // Generate interpretation
    const interpretation = await interpretDoctorReport(report);

    console.log(`✅ Doctor report interpretation generated (AI: ${interpretation.aiPowered})`);

    res.status(200).send({ 
      message: "Interpretation generated successfully", 
      interpretation 
    });
  } catch (error) {
    console.error("Error interpreting doctor report:", error);
    res.status(500).send({ 
      message: "Error generating interpretation", 
      error: error.message 
    });
  }
});

module.exports = router;
