const express = require("express");
const {
  getAllDoctors,
  createTables,
  findById,
  findIfExists,
  addDoctor,
  updatePass,
  addAvailableTimes,
} = require("../models/Doctor.model");
const { getPatientsByDoctor } = require("../models/Patient.model");
const { authenticate } = require("../middlewares/doctorAuth");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    await createTables();
    const doctors = await getAllDoctors();
    console.log("Doctors returned from DB:", doctors.length);
    res.status(200).send(doctors);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

router.post("/register", async (req, res) => {
  try {
    await createTables();
    const doctor = await findIfExists(req.body.email);
    if (doctor.length > 0) {
      return res.send({
        message: "Doctor already exists",
      });
    }
    const value = req.body;
    console.log(value);
    await addDoctor(value);
    const data = await findIfExists(req.body.email);
    const email = data[0].email;
    console.log(email);
    return res.send({ email, message: "Registered" });
  } catch (error) {
    res.send({ message: "error" });
  }
});

router.post("/login", async (req, res) => {
  const { docID, password } = req.body;
  try {
    // Validate that docID is a number
    const doctorId = parseInt(docID);
    if (isNaN(doctorId) || doctorId <= 0) {
      return res.status(400).send({ 
        message: "Invalid Doctor ID. Please enter a valid numeric ID" 
      });
    }
    
    // Find doctor by numeric doctorId
    const doctor = await findById(doctorId);
    
    if (!doctor) {
      return res.status(404).send({ message: "Doctor not found" });
    }
    
    // Use bcrypt to compare the password with the hashed password
    const bcrypt = require("bcrypt");
    const isPasswordValid = await bcrypt.compare(password, doctor.password);
    
    if (isPasswordValid) {
      const token = jwt.sign({ doctorId: doctor.doctorId }, process.env.KEY, {
        expiresIn: "24h",
      });
      res.send({
        message: "Successful",
        user: { ...doctor.toObject(), userType: "doctor" },
        token: token,
      });
    } else {
      res.send({ message: "Wrong credentials" });
    }
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

router.post("/availability", async (req, res) => {
  console.log(req.body);
  const docId = parseInt(req.body.id);
  const startMorningTime = req.body.MAS;
  const endMorningTime = req.body.MAE;
  const startEveningTime = req.body.EAS;
  const endEveningTime = req.body.EAE;
  try {
    const doctor = await findById(docId);
    if (doctor) {
      const times = [];
      let currentTime = startMorningTime;

      while (currentTime <= endMorningTime) {
        times.push(currentTime);
        const [hours, minutes] = currentTime.split(":");
        const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
        const newTime = totalMinutes + 15;
        const newHours = Math.floor(newTime / 60);
        const newMinutes = newTime % 60;
        currentTime = `${newHours.toString().padStart(2, "0")}:${newMinutes
          .toString()
          .padStart(2, "0")}`;
      }
      currentTime = startEveningTime;
      while (currentTime <= endEveningTime) {
        times.push(currentTime);
        const [hours, minutes] = currentTime.split(":");
        const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
        const newTime = totalMinutes + 15;
        const newHours = Math.floor(newTime / 60);
        const newMinutes = newTime % 60;
        currentTime = `${newHours.toString().padStart(2, "0")}:${newMinutes
          .toString()
          .padStart(2, "0")}`;
        console.log(currentTime);
      }
      console.log(times);
      await addAvailableTimes(docId, times);
      res.send({
        message: "Successful",
        user: { ...doctor.toObject(), userType: "doctor" },
      });
    } else {
      res.status(404).send({ message: "Doctor not found" });
    }
  } catch (error) {
    console.log({ message: "Available times error" });
    console.log(error);
    res.status(500).send({ message: "Internal server error" });
  }
});

router.patch("/:doctorId", async (req, res) => {
  const doctorId = parseInt(req.params.doctorId);
  const password = req.body.password;
  try {
    await updatePass(password, doctorId);
    const doctor = await findById(doctorId);
    if (doctor && doctor.password) {
      // Use bcrypt to compare the new password
      const bcrypt = require("bcrypt");
      const isPasswordMatch = await bcrypt.compare(password, doctor.password);
      if (isPasswordMatch) {
        return res.status(200).send({
          message: "password updated",
          user: { ...doctor.toObject(), userType: "doctor" },
        });
      } else {
        return res.send({ message: `password not updated` });
      }
    } else {
      return res.status(404).send({ message: "Doctor not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "error" });
  }
});

router.get("/patients", authenticate, async (req, res) => {
  try {
    const doctorID = req.body.doctorID;
    const patients = await getPatientsByDoctor(doctorID);
    res.status(200).send(patients);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

// Change password endpoint with bcrypt verification
router.post("/change-password", async (req, res) => {
  try {
    const { doctorId, oldPassword, newPassword } = req.body;
    
    console.log("Password change request for doctor:", doctorId);
    
    if (!doctorId || !oldPassword || !newPassword) {
      return res.status(400).send({ error: "All fields are required" });
    }
    
    // Find doctor using the model function
    const doctor = await findById(parseInt(doctorId));
    
    if (!doctor) {
      return res.status(404).send({ error: "Doctor not found" });
    }
    
    // Verify old password using bcrypt
    const bcrypt = require("bcrypt");
    const isMatch = await bcrypt.compare(oldPassword, doctor.password);
    
    if (!isMatch) {
      return res.status(400).send({ error: "Incorrect old password" });
    }
    
    // Update password using the model function (it will hash automatically)
    await updatePass(newPassword, parseInt(doctorId));
    
    console.log("Password updated successfully for doctor:", doctorId);
    res.status(200).send({ message: "Password updated successfully" });
    
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).send({ error: "Failed to update password" });
  }
});

module.exports = router;
