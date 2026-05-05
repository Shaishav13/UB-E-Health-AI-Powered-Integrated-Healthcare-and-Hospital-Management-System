const express = require("express");
const {
  addPatient,
  getAllPatients,
  createTable,
  findCred,
  findIfExists,
  updatePass,
} = require("../models/Patient.model");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    await createTable();
    const patients = await getAllPatients();
    res.status(200).send(patients);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

router.post("/signup", async (req, res) => {
  console.log(req.body);
  try {
    // Check if patient already exists
    const existingPatient = await findIfExists(req.body.email);
    if (existingPatient.length > 0) {
      return res.status(400).send({ message: "Patient already exists with this email" });
    }
    
    await addPatient(req.body);
    return res.send({
      message: "Registered",
    });
  } catch (error) {
    console.log("Patient signup error:", error);
    
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).send({ message: "Patient already exists with this email" });
    }
    
    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).send({ message: `Validation error: ${validationErrors.join(', ')}` });
    }
    
    res.status(500).send({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find patient by email
    const patientArray = await findIfExists(email);
    if (patientArray.length === 0) {
      return res.status(404).send({ message: "Patient not found" });
    }
    
    const patient = patientArray[0];
    
    // Use bcrypt to compare the password with the hashed password
    const bcrypt = require("bcrypt");
    const isPasswordValid = await bcrypt.compare(password, patient.password);
    
    if (isPasswordValid) {
      const token = jwt.sign({ patientId: patient._id }, process.env.KEY, {
        expiresIn: "24h",
      });
      res.send({
        message: "Successful",
        user: { ...patient.toObject(), userType: "patient" },
        token: token,
      });
    } else {
      res.send({ message: "Wrong credentials" });
    }
  } catch (error) {
    console.log("Patient login error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

router.post("/check", async (req, res) => {
  try {
    const patient = await findIfExists(req.body.email);
    console.log(patient);
    if (patient.length > 0) {
      return res.send({
        message: "Patient already exists",
      });
    } else {
      return res.send({
        message: "Patient does not exist",
      });
    }
  } catch (error) {
    res.send({ message: "error" });
  }
});

router.patch("/:patientId", async (req, res) => {
  const id = req.params.patientId;
  const { password, oldPassword, name, phonenum, address, profilePicture } = req.body;
  
  try {
    // If changing password, verify old password first
    if (password && oldPassword) {
      const patient = await findCred(id);
      
      if (!patient) {
        return res.status(404).send({ message: "Patient not found" });
      }
      
      const bcrypt = require("bcrypt");
      const isOldPasswordValid = await bcrypt.compare(oldPassword, patient.password);
      
      if (!isOldPasswordValid) {
        return res.status(400).send({ message: "Incorrect old password" });
      }
      
      // Update password
      await updatePass(password, id);
    }
    
    // Update profile fields if provided
    const updateData = {};
    if (name) updateData.name = name;
    if (phonenum) updateData.phonenum = phonenum;
    if (address) updateData.address = address;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    
    if (Object.keys(updateData).length > 0) {
      const { updatePatient } = require("../models/Patient.model");
      await updatePatient({ id, ...updateData });
    }
    
    const updatedPatient = await findCred(id);
    
    return res.status(200).send({
      message: password ? "password updated" : "profile updated",
      user: { ...updatedPatient.toObject(), userType: "patient" },
    });
  } catch (error) {
    console.log("Patient update error:", error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

// Get patient activity history
router.get("/:patientId/activity", async (req, res) => {
  const patientId = req.params.patientId;
  
  try {
    const Appointment = require("../models/Appointment.model");
    const { getPatientReports } = require("../models/Report.model");
    const { getPatientLabReports } = require("../models/LabReport.model");
    const { Prescription } = require("../models/Prescription.model");
    
    // Get all activity data
    const [appointments, reports, labReports, prescriptions] = await Promise.all([
      Appointment.find({ patientid: patientId }).populate('doctorid').sort({ date: -1 }).limit(10),
      getPatientReports(patientId),
      getPatientLabReports(patientId),
      Prescription.find({ patientid: patientId }).populate('doctorid').sort({ createdAt: -1 }).limit(10)
    ]);
    
    res.status(200).send({
      appointments: appointments || [],
      reports: reports || [],
      labReports: labReports || [],
      prescriptions: prescriptions || []
    });
  } catch (error) {
    console.log("Activity fetch error:", error);
    res.status(500).send({ error: "Failed to fetch activity history" });
  }
});

module.exports = router;
