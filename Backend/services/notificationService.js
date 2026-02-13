const nodemailer = require('nodemailer');
const cron = require('node-cron');
const mongoose = require('mongoose');
const { calculateAge } = require('../utils/ageCalculator');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email templates
const emailTemplates = {
  appointmentReminder: (patientName, doctorName, date, time) => ({
    subject: '🏥 Appointment Reminder - UB E-Health',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0b6b61 0%, #0a5850 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #0b6b61; }
          .button { display: inline-block; padding: 12px 30px; background: #0b6b61; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 UB E-Health</h1>
            <p>Appointment Reminder</p>
          </div>
          <div class="content">
            <h2>Hello ${patientName},</h2>
            <p>This is a friendly reminder about your upcoming appointment.</p>
            
            <div class="info-box">
              <h3>📅 Appointment Details</h3>
              <p><strong>Doctor:</strong> ${doctorName}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time:</strong> ${time}</p>
            </div>
            
            <p>Please arrive 10 minutes early for check-in.</p>
            <p>If you need to reschedule or cancel, please log in to your account.</p>
            
            <a href="http://localhost:3000/dashboard" class="button">View Appointment</a>
            
            <div class="footer">
              <p>This is an automated reminder from UB E-Health</p>
              <p>You can manage your notification preferences in your account settings</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  medicationReminder: (patientName, medications) => ({
    subject: '💊 Medication Reminder - UB E-Health',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .med-item { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
          .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💊 UB E-Health</h1>
            <p>Medication Reminder</p>
          </div>
          <div class="content">
            <h2>Hello ${patientName},</h2>
            <p>Don't forget to take your medications today!</p>
            
            <h3>Your Active Medications:</h3>
            ${medications.map(med => `
              <div class="med-item">
                <p><strong>💊 ${med.name}</strong></p>
                <p>Dosage: ${med.dosage}</p>
                <p>Frequency: ${med.frequency}</p>
              </div>
            `).join('')}
            
            <p>Taking your medications as prescribed is important for your health.</p>
            
            <a href="http://localhost:3000/dashboard" class="button">View All Medications</a>
            
            <div class="footer">
              <p>This is an automated reminder from UB E-Health</p>
              <p>You can manage your notification preferences in your account settings</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  labTestReminder: (patientName, labTests, disease, doctorName) => ({
    subject: '🔬 Lab Test Reminder - UB E-Health',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .test-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔬 UB E-Health</h1>
            <p>Lab Test Reminder</p>
          </div>
          <div class="content">
            <h2>Hello ${patientName},</h2>
            <p>Dr. ${doctorName} has recommended the following lab tests for your condition: <strong>${disease}</strong></p>
            
            <div class="test-box">
              <h3>Recommended Tests:</h3>
              ${labTests.split('\n').map(test => test.trim() ? `<p>✓ ${test.trim()}</p>` : '').join('')}
            </div>
            
            <p>Please schedule these tests at your earliest convenience.</p>
            
            <a href="http://localhost:3000/dashboard" class="button">View Details</a>
            
            <div class="footer">
              <p>This is an automated reminder from UB E-Health</p>
              <p>You can manage your notification preferences in your account settings</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  labPersonnelCredentials: (name, labId, password, specialization, qualification) => ({
    subject: '🧪 Your Lab Personnel Account - UB E-Health',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #8b5cf6; }
          .credential-item { background: #f3f4f6; padding: 12px; margin: 10px 0; border-radius: 5px; font-family: monospace; }
          .warning { background: #fef3c7; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧪 UB E-Health</h1>
            <p>Lab Personnel Account Created</p>
          </div>
          <div class="content">
            <h2>Welcome ${name}!</h2>
            <p>Your laboratory personnel account has been successfully created in the UB E-Health Management System.</p>
            
            <div class="credentials-box">
              <h3>🔐 Your Login Credentials</h3>
              <div class="credential-item">
                <strong>Lab ID:</strong> ${labId}
              </div>
              <div class="credential-item">
                <strong>Password:</strong> ${password}
              </div>
              <div class="credential-item">
                <strong>Login URL:</strong> http://localhost:3000/dashboard-login
              </div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> Please use the "Doctor/Lab" login option and enter your Lab ID (${labId}). We strongly recommend changing your password after your first login.
            </div>
            
            <div class="credentials-box">
              <h3>👤 Your Profile Information</h3>
              <p><strong>Specialization:</strong> ${specialization}</p>
              <p><strong>Qualification:</strong> ${qualification}</p>
            </div>
            
            <p>As a lab personnel member, you will have access to:</p>
            <ul>
              <li>View and manage lab test requests</li>
              <li>Update test status</li>
              <li>Enter test results</li>
              <li>Manage home service requests</li>
            </ul>
            
            <a href="http://localhost:3000/dashboard-login" class="button">Login Now</a>
            
            <div class="footer">
              <p>This is an automated email from UB E-Health</p>
              <p>If you did not expect this email, please contact the administrator</p>
              <p>Copyright © 2025-2026 UB E-Health Management Hub</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"UB E-Health" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error);
    return { success: false, error: error.message };
  }
};

// Check and send appointment reminders
const checkAppointmentReminders = async () => {
  try {
    const Appointment = mongoose.model('Appointment');
    const Patient = mongoose.model('Patient');
    
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    // Find appointments for tomorrow
    const appointments = await Appointment.find({
      date: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      },
      status: { $ne: 'completed' }
    })
    .populate('patientId')
    .populate('doctorId');
    
    console.log(`📅 Found ${appointments.length} appointments for tomorrow`);
    
    for (const appointment of appointments) {
      if (!appointment.patientId || !appointment.doctorId) continue;
      
      const patient = await Patient.findById(appointment.patientId._id);
      
      // Check if patient has appointment reminders enabled
      if (patient && patient.notificationPreferences?.appointmentReminders) {
        const { subject, html } = emailTemplates.appointmentReminder(
          appointment.patientId.name,
          appointment.doctorId.name,
          appointment.date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          appointment.time
        );
        
        await sendEmail(appointment.patientId.email, subject, html);
      }
    }
  } catch (error) {
    console.error('❌ Error checking appointment reminders:', error);
  }
};

// Check and send medication reminders
const checkMedicationReminders = async () => {
  try {
    const Prescription = mongoose.model('Prescription');
    const Patient = mongoose.model('Patient');
    
    // Get all active (non-completed) medications
    const medications = await Prescription.find({ completed: false });
    
    // Group by patient
    const patientMeds = {};
    for (const med of medications) {
      if (!patientMeds[med.patientid]) {
        patientMeds[med.patientid] = [];
      }
      patientMeds[med.patientid].push(med);
    }
    
    console.log(`💊 Found medications for ${Object.keys(patientMeds).length} patients`);
    
    for (const [patientId, meds] of Object.entries(patientMeds)) {
      const patient = await Patient.findById(patientId);
      
      // Check if patient has medication reminders enabled
      if (patient && patient.notificationPreferences?.medicationReminders) {
        const { subject, html } = emailTemplates.medicationReminder(
          patient.name,
          meds
        );
        
        await sendEmail(patient.email, subject, html);
      }
    }
  } catch (error) {
    console.error('❌ Error checking medication reminders:', error);
  }
};

// Check and send lab test reminders
const checkLabTestReminders = async () => {
  try {
    const Report = mongoose.model('Report');
    const Patient = mongoose.model('Patient');
    
    // Get reports with lab tests from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const reports = await Report.find({
      labTests: { $exists: true, $ne: '' },
      date: { $gte: sevenDaysAgo }
    })
    .populate({
      path: 'patientid',
      model: 'Patient'
    })
    .populate({
      path: 'doctorid',
      model: 'Doctor'
    });
    
    console.log(`🔬 Found ${reports.length} reports with lab tests`);
    
    for (const report of reports) {
      if (!report.patientid || !report.doctorid) continue;
      
      const patient = await Patient.findById(report.patientid._id);
      
      // Check if patient has lab test reminders enabled
      if (patient && patient.notificationPreferences?.labTestReminders) {
        const { subject, html } = emailTemplates.labTestReminder(
          report.patientid.name,
          report.labTests,
          report.disease,
          report.doctorid.name
        );
        
        await sendEmail(report.patientid.email, subject, html);
      }
    }
  } catch (error) {
    console.error('❌ Error checking lab test reminders:', error);
  }
};

// Initialize cron jobs
const initializeNotificationScheduler = () => {
  console.log('🔔 Initializing notification scheduler...');
  
  // Check appointment reminders daily at 9 AM
  cron.schedule('0 9 * * *', () => {
    console.log('⏰ Running appointment reminder check...');
    checkAppointmentReminders();
  });
  
  // Check medication reminders daily at 8 AM
  cron.schedule('0 8 * * *', () => {
    console.log('⏰ Running medication reminder check...');
    checkMedicationReminders();
  });
  
  // Check lab test reminders every Monday at 10 AM
  cron.schedule('0 10 * * 1', () => {
    console.log('⏰ Running lab test reminder check...');
    checkLabTestReminders();
  });
  
  // Update patient ages daily at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('⏰ Running patient age update...');
    updatePatientAges();
  });
  
  console.log('✅ Notification scheduler initialized');
  console.log('📅 Appointment reminders: Daily at 9:00 AM');
  console.log('💊 Medication reminders: Daily at 8:00 AM');
  console.log('🔬 Lab test reminders: Every Monday at 10:00 AM');
  console.log('🎂 Patient age updates: Daily at midnight');
};

// Update all patient ages based on DOB
const updatePatientAges = async () => {
  try {
    const Patient = mongoose.model('Patient');
    
    const patients = await Patient.find({});
    let updatedCount = 0;
    
    console.log(`🎂 Checking ages for ${patients.length} patients...`);
    
    for (const patient of patients) {
      if (patient.dob) {
        const calculatedAge = calculateAge(patient.dob);
        
        if (patient.age !== calculatedAge) {
          patient.age = calculatedAge;
          await patient.save();
          updatedCount++;
          console.log(`✅ Updated age for ${patient.name}: ${patient.age} years old`);
        }
      }
    }
    
    console.log(`🎂 Age update complete. Updated ${updatedCount} patient(s).`);
  } catch (error) {
    console.error('❌ Error updating patient ages:', error);
  }
};

// Send lab personnel credentials email
const sendLabPersonnelCredentials = async (labPersonnel, plainPassword) => {
  try {
    const { subject, html } = emailTemplates.labPersonnelCredentials(
      labPersonnel.name,
      labPersonnel.labId,
      plainPassword,
      labPersonnel.specialization,
      labPersonnel.qualification
    );
    
    const result = await sendEmail(labPersonnel.email, subject, html);
    
    if (result.success) {
      console.log(`✅ Lab personnel credentials sent to ${labPersonnel.email}`);
      return { success: true, message: 'Credentials email sent successfully' };
    } else {
      console.error(`❌ Failed to send credentials to ${labPersonnel.email}:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Error sending lab personnel credentials:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  emailTemplates,
  checkAppointmentReminders,
  checkMedicationReminders,
  checkLabTestReminders,
  initializeNotificationScheduler,
  updatePatientAges,
  sendLabPersonnelCredentials
};
