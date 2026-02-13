const express = require("express");
const {
  createTables,
  addLabPersonnel,
  getAllLabPersonnel,
  findById,
  updateLabPersonnel,
  deleteLabPersonnel,
  countLabPersonnel,
  findByEmail
} = require("../models/LabPersonnel.model");
const { authenticate } = require("../middlewares/adminAuth");
const { sendLabPersonnelCredentials } = require("../services/notificationService");
require("dotenv").config();

const router = express.Router();

// POST /add - Add new lab personnel (admin only)
router.post("/add", authenticate, async (req, res) => {
  try {
    await createTables();
    
    // Check if email already exists
    const existingLabPersonnel = await findByEmail(req.body.email);
    if (existingLabPersonnel) {
      return res.status(409).send({
        message: "Lab personnel with this email already exists"
      });
    }
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'password', 'phoneNum', 'age', 'gender', 'bloodGroup', 'DOB', 'address', 'specialization', 'qualification'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).send({
        error: "Missing required fields",
        details: missingFields
      });
    }
    
    // Store plain password before hashing
    const plainPassword = req.body.password;
    
    // Add lab personnel (password will be hashed in the model)
    const labPersonnel = await addLabPersonnel(req.body);
    
    console.log("Lab personnel added successfully:", labPersonnel.labId);
    
    // Send credentials email
    try {
      const emailResult = await sendLabPersonnelCredentials(labPersonnel, plainPassword);
      if (emailResult.success) {
        console.log("✅ Credentials email sent to:", labPersonnel.email);
      } else {
        console.warn("⚠️ Failed to send credentials email:", emailResult.error);
        // Don't fail the request if email fails, just log it
      }
    } catch (emailError) {
      console.error("❌ Error sending credentials email:", emailError);
      // Continue even if email fails
    }
    
    return res.status(201).send({
      message: "Lab personnel added successfully",
      labId: labPersonnel.labId,
      email: labPersonnel.email
    });
    
  } catch (error) {
    console.error("Error adding lab personnel:", error);
    
    if (error.message === "Email already exists") {
      return res.status(409).send({
        error: "Email already exists"
      });
    }
    
    return res.status(500).send({
      error: "Failed to add lab personnel",
      details: error.message
    });
  }
});

// GET /all - Get all lab personnel (admin only)
router.get("/all", authenticate, async (req, res) => {
  try {
    await createTables();
    const labPersonnel = await getAllLabPersonnel();
    console.log("Lab personnel returned from DB:", labPersonnel.length);
    return res.status(200).send(labPersonnel);
  } catch (error) {
    console.error("Error fetching lab personnel:", error);
    return res.status(500).send({
      error: "Failed to fetch lab personnel",
      details: error.message
    });
  }
});

// GET /count - Count lab personnel (admin only)
router.get("/count", authenticate, async (req, res) => {
  try {
    await createTables();
    const count = await countLabPersonnel();
    
    return res.status(200).send({
      count: count
    });
    
  } catch (error) {
    console.error("Error counting lab personnel:", error);
    return res.status(500).send({
      error: "Failed to count lab personnel",
      details: error.message
    });
  }
});

// GET /:labId - Get lab personnel by ID
router.get("/:labId", async (req, res) => {
  try {
    await createTables();
    
    const labId = req.params.labId;
    
    // Validate labId format
    if (!labId) {
      return res.status(400).send({
        error: "Lab ID is required"
      });
    }
    
    const labPersonnel = await findById(labId);
    
    if (!labPersonnel) {
      return res.status(404).send({
        error: "Lab personnel not found"
      });
    }
    
    // Remove password from response
    const { password, ...labPersonnelData } = labPersonnel.toObject ? labPersonnel.toObject() : labPersonnel;
    
    return res.status(200).send(labPersonnelData);
    
  } catch (error) {
    console.error("Error fetching lab personnel:", error);
    return res.status(500).send({
      error: "Failed to fetch lab personnel",
      details: error.message
    });
  }
});

// PUT /update/:labId - Update lab personnel (admin only)
router.put("/update/:labId", authenticate, async (req, res) => {
  try {
    await createTables();
    
    const labId = req.params.labId;
    
    // Validate labId
    if (!labId) {
      return res.status(400).send({
        error: "Lab ID is required"
      });
    }
    
    // Check if lab personnel exists
    const existingLabPersonnel = await findById(labId);
    if (!existingLabPersonnel) {
      return res.status(404).send({
        error: "Lab personnel not found"
      });
    }
    
    // If email is being updated, check if new email already exists
    if (req.body.email && req.body.email !== existingLabPersonnel.email) {
      const emailExists = await findByEmail(req.body.email);
      if (emailExists) {
        return res.status(409).send({
          error: "Email already exists"
        });
      }
    }
    
    // Update lab personnel
    await updateLabPersonnel(labId, req.body);
    
    console.log("Lab personnel updated successfully:", labId);
    
    return res.status(200).send({
      message: "Lab personnel updated successfully",
      labId: labId
    });
    
  } catch (error) {
    console.error("Error updating lab personnel:", error);
    return res.status(500).send({
      error: "Failed to update lab personnel",
      details: error.message
    });
  }
});

// DELETE /delete/:labId - Delete lab personnel (admin only)
router.delete("/delete/:labId", authenticate, async (req, res) => {
  try {
    await createTables();
    
    const labId = req.params.labId;
    
    // Validate labId
    if (!labId) {
      return res.status(400).send({
        error: "Lab ID is required"
      });
    }
    
    // Check if lab personnel exists
    const existingLabPersonnel = await findById(labId);
    if (!existingLabPersonnel) {
      return res.status(404).send({
        error: "Lab personnel not found"
      });
    }
    
    // Delete lab personnel
    await deleteLabPersonnel(labId);
    
    console.log("Lab personnel deleted successfully:", labId);
    
    return res.status(200).send({
      message: "Lab personnel deleted successfully",
      labId: labId
    });
    
  } catch (error) {
    console.error("Error deleting lab personnel:", error);
    return res.status(500).send({
      error: "Failed to delete lab personnel",
      details: error.message
    });
  }
});

module.exports = router;
