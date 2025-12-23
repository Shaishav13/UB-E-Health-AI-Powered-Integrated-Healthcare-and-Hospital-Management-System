const express = require("express");
const mongoose = require("mongoose");
const { 
  getPatientMedicine, 
  markAsCompleted, 
  removeMedicine,
  clearCompleted 
} = require("../models/Prescription.model");

const router = express.Router();

// Get all medicines for a patient
router.post("/:patientId", async (req, res) => {
  const id = req.params.patientId;
  console.log("Fetching medicines for patient:", id);
  
  try {
    // Validate ObjectId format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ 
        error: "Invalid patient ID format", 
        details: `ID '${id}' is not a valid ObjectId` 
      });
    }

    const medicines = await getPatientMedicine(id);
    console.log("Medicines fetched:", medicines.length, "records");
    if (medicines.length > 0) {
      console.log("Sample medicine:", medicines[0]);
    }
    res.status(200).send(medicines);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    console.error("Error details:", error.message);
    res.status(400).send({ 
      error: "Failed to fetch medicines",
      details: error.message 
    });
  }
});

// Mark medicine as completed
router.patch("/complete/:medicineId", async (req, res) => {
  const id = req.params.medicineId;
  console.log("Marking medicine as completed:", id);
  try {
    await markAsCompleted(id);
    console.log("Medicine marked as completed successfully");
    res.status(200).send({ message: "Medicine marked as completed" });
  } catch (error) {
    console.error("Error marking medicine as completed:", error);
    console.error("Error details:", error.message);
    res.status(400).send({ 
      error: "Failed to mark medicine as completed",
      details: error.message 
    });
  }
});

// Delete a specific medicine
router.delete("/:medicineId", async (req, res) => {
  const id = req.params.medicineId;
  try {
    await removeMedicine(id);
    res.status(200).send({ message: "Medicine deleted" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

// Clear all completed medicines for a patient
router.delete("/clear-completed/:patientId", async (req, res) => {
  const id = req.params.patientId;
  try {
    await clearCompleted(id);
    res.status(200).send({ message: "Completed medicines cleared" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

module.exports = router;
