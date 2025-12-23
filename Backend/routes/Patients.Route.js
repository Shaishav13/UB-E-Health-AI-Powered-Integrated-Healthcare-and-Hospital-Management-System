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
  const { password, oldPassword } = req.body;
  
  try {
    // If changing password, verify old password first
    if (oldPassword) {
      const patient = await findCred(id);
      
      if (!patient) {
        return res.status(404).send({ message: "Patient not found" });
      }
      
      const bcrypt = require("bcrypt");
      const isOldPasswordValid = await bcrypt.compare(oldPassword, patient.password);
      
      if (!isOldPasswordValid) {
        return res.status(400).send({ message: "Incorrect old password" });
      }
    }
    
    // Update password
    await updatePass(password, id);
    const updatedPatient = await findCred(id);
    
    return res.status(200).send({
      message: "password updated",
      user: { ...updatedPatient.toObject(), userType: "patient" },
    });
  } catch (error) {
    console.log("Password update error:", error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

module.exports = router;
