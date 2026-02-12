const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// Get notification preferences
router.get("/preferences/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).send({ 
        message: "Invalid patient ID format" 
      });
    }
    
    const Patient = mongoose.model('Patient');
    const patient = await Patient.findById(patientId);
    
    if (!patient) {
      return res.status(404).send({ 
        message: "Patient not found" 
      });
    }
    
    // Return notification preferences or defaults
    const preferences = patient.notificationPreferences || {
      appointmentReminders: true,
      medicationReminders: true,
      labTestReminders: true,
      followUpReminders: true,
      generalNotifications: true
    };
    
    res.status(200).send({ 
      message: "Success", 
      preferences 
    });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res.status(500).send({ 
      message: "Error fetching preferences", 
      error: error.message 
    });
  }
});

// Update notification preferences
router.put("/preferences/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const preferences = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).send({ 
        message: "Invalid patient ID format" 
      });
    }
    
    const Patient = mongoose.model('Patient');
    const patient = await Patient.findByIdAndUpdate(
      patientId,
      { notificationPreferences: preferences },
      { new: true }
    );
    
    if (!patient) {
      return res.status(404).send({ 
        message: "Patient not found" 
      });
    }
    
    console.log(`✅ Updated notification preferences for patient ${patientId}`);
    
    res.status(200).send({ 
      message: "Preferences updated successfully", 
      preferences: patient.notificationPreferences 
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).send({ 
      message: "Error updating preferences", 
      error: error.message 
    });
  }
});

// Test notification endpoint (for development)
router.post("/test/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { type } = req.body; // 'appointment', 'medication', or 'labtest'
    
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).send({ 
        message: "Invalid patient ID format" 
      });
    }
    
    const Patient = mongoose.model('Patient');
    const patient = await Patient.findById(patientId);
    
    if (!patient) {
      return res.status(404).send({ 
        message: "Patient not found" 
      });
    }
    
    const { sendEmail, emailTemplates } = require('../services/notificationService');
    
    let emailData;
    
    switch(type) {
      case 'appointment':
        emailData = emailTemplates.appointmentReminder(
          patient.name,
          'Dr. Test Doctor',
          'February 15, 2026',
          '10:00 AM'
        );
        break;
      case 'medication':
        emailData = emailTemplates.medicationReminder(
          patient.name,
          [
            { name: 'Test Medicine', dosage: '500mg', frequency: 'Twice daily' }
          ]
        );
        break;
      case 'labtest':
        emailData = emailTemplates.labTestReminder(
          patient.name,
          'Complete Blood Count\nLipid Profile',
          'Routine Checkup',
          'Dr. Test Doctor'
        );
        break;
      default:
        return res.status(400).send({ 
          message: "Invalid notification type. Use 'appointment', 'medication', or 'labtest'" 
        });
    }
    
    const result = await sendEmail(patient.email, emailData.subject, emailData.html);
    
    if (result.success) {
      res.status(200).send({ 
        message: "Test notification sent successfully",
        messageId: result.messageId
      });
    } else {
      res.status(500).send({ 
        message: "Failed to send test notification",
        error: result.error
      });
    }
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).send({ 
      message: "Error sending test notification", 
      error: error.message 
    });
  }
});

module.exports = router;
