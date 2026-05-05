const express = require("express");
const {
  findIfExists,
  createTables,
  addAdmin,
  getAdminCredFromEmail,
  findCred,
  updatePass,
  getAllAdmins,
} = require("../models/Admin.model");
const { getDoctorCredFromEmail, getAllDoctors, updateDoctor, deleteDoctor } = require("../models/Doctor.model");
const { getPatientCredFromEmail, getAllPatients, updatePatient, deletePatient } = require("../models/Patient.model");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    await createTables();
    const admins = await getAllAdmins();
    
    // Add the hardcoded system admin to the list
    const systemAdmin = {
      _id: "admin",
      name: "System Administrator",
      phonenum: "1234567890",
      email: "admin@hospital.com",
      age: 35,
      gender: "Not specified",
      dob: new Date("1988-01-01"),
      address: "Hospital Administration Office",
      password: "admin@123" // For password change functionality
    };
    
    // Add system admin to the list if not already present
    const hasSystemAdmin = admins.some(admin => admin.email === "admin@hospital.com");
    if (!hasSystemAdmin) {
      admins.push(systemAdmin);
    }
    
    console.log("Admins returned:", admins);
    res.status(200).send(admins);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

router.post("/register", async (req, res) => {
  try {
    await createTables();
    const admin = await findIfExists(req.body.email);
    console.log(admin);
    if (admin.length > 0) {
      return res.send({
        message: "Admin already exists",
      });
    }
    const value = req.body;
    await addAdmin(value);
    const data = await findIfExists(req.body.email);
    const email = data[0].email;
    console.log(email);
    return res.send({ email, message: "Registered" });
  } catch (error) {
    res.send({ message: "error" });
  }
});

router.post("/login", async (req, res) => {
  const { adminID, password } = req.body;
  try {
    // Check for hardcoded admin credentials
    if (adminID === "admin" && password === "admin@123") {
      const token = jwt.sign({ adminId: "admin" }, process.env.KEY, {
        expiresIn: "24h",
      });
      res.send({
        message: "Successful",
        user: { 
          id: "admin", 
          username: "admin", 
          userType: "admin",
          name: "System Administrator",
          email: "admin@hospital.com", // Add email for profile matching
          phonenum: "1234567890",
          age: 35,
          gender: "Not specified",
          dob: new Date("1988-01-01"),
          address: "Hospital Administration Office"
        },
        token: token,
      });
    } else {
      res.send({ message: "Wrong credentials" });
    }
  } catch (error) {
    console.log("Admin login error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

router.patch("/:adminId", async (req, res) => {
  const id = req.params.adminId;
  const password = req.body.password;
  try {
    await updatePass(password, id);
    const admin = await findCred(id);
    if (admin[0].password === password) {
      return res.status(200).send({
        message: "password updated",
        user: { ...admin[0], userType: "admin" },
      });
    } else {
      return res.status(404).send({ message: `password not updated` });
    }
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Serror" });
  }
});

router.post("/verification", async (req, res) => {
  console.log(req.body);
  const verificationCode = Math.floor(1000 + Math.random() * 9000);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_MAIL, // generated gmail user
      pass: process.env.SMTP_PASSWORD, // generated gmail password
    },
  });

  var mailOptions = {
    from: process.env.SMTP_MAIL,
    to: req.body.email,
    subject: "Verification Code",
    text: `Your verification code is: ${verificationCode} .`,
  };

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      console.log("error sending email", error);
      return res.send({ message: "error" });
    }
    console.log(info.messageId);
    res.status(200).send({ message: "successful", code: verificationCode });
  });
});

router.post("/mailCreds", async (req, res) => {
  try {
    console.log(req.body);
    const user = req.body;
    
    // Check if email is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_MAIL || !process.env.SMTP_PASSWORD) {
      console.log("Email not configured - skipping email notification");
      return res.status(200).send({ 
        message: "email_not_configured",
        info: "Email service not configured. User created successfully but email notification skipped."
      });
    }
    
    const creds =
      user.userType === "admin"
        ? await getAdminCredFromEmail(req.body.email)
        : user.userType === "doctor"
        ? await getDoctorCredFromEmail(req.body.email)
        : await getPatientCredFromEmail(req.body.email);
    console.log("creds", creds);
    
    // Prepare login credentials based on user type
    let loginId, loginPassword, loginMethod;
    
    if (user.userType === "doctor") {
      loginId = creds[0].doctorId; // Use numeric doctor ID
      loginPassword = "Doctor2123"; // Use default doctor password
      loginMethod = "Doctor ID";
    } else if (user.userType === "admin") {
      loginId = "admin";
      loginPassword = "admin@123";
      loginMethod = "Username";
    } else {
      // Patient
      loginId = creds[0].email;
      loginPassword = "Contact admin for password reset";
      loginMethod = "Email";
    }
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_MAIL, // generated user
        pass: process.env.SMTP_PASSWORD, // generated password
      },
    });

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: user.email,
      subject: "🏥 UB E-Health - Login Credentials",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0b6b61;">🏥 UB E-Health</h2>
          <h3 style="color: #d32f2f;">🔐 Your Login Credentials</h3>
          <p>Hello,</p>
          <p>Welcome to UB E-Health! Your account has been successfully created.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0b6b61;">Login Information:</h3>
            <p><strong>User Type:</strong> ${user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}</p>
            <p><strong>${loginMethod}:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 16px; color: #d32f2f; font-weight: bold;">${loginId}</code></p>
            <p><strong>Password:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 16px; color: #d32f2f; font-weight: bold;">${loginPassword}</code></p>
          </div>
          
          <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #0b6b61;">🔗 Login Steps:</h4>
            <ol style="margin-bottom: 0;">
              <li>Go to: <a href="http://localhost:3000/" style="color: #0b6b61;">http://localhost:3000/</a></li>
              <li>Select "${user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}" from the dropdown</li>
              <li>Enter your ${loginMethod.toLowerCase()} and password</li>
              <li>Click "Sign In"</li>
            </ol>
          </div>
          
          ${user.userType === "doctor" ? `
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h4 style="margin-top: 0; color: #856404;">⚠️ Important for Doctors</h4>
            <ul style="margin-bottom: 0; color: #856404;">
              <li>Your Doctor ID is a simple number (${loginId})</li>
              <li>Use this ID to log in, not your email</li>
              <li>You can change your password after logging in</li>
            </ul>
          </div>
          ` : ''}
          
          <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h4 style="margin-top: 0; color: #721c24;">🛡️ Security Reminder</h4>
            <ul style="margin-bottom: 0; color: #721c24;">
              <li>Keep your login credentials secure</li>
              <li>Don't share your password with anyone</li>
              <li>Change your password after first login</li>
            </ul>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Best regards,<br>
            UB E-Health Team<br>
            <em>This is an automated message, please do not reply.</em>
          </p>
        </div>
      `,
      text: `UB E-Health - Login Credentials\n\nHello,\n\nWelcome to UB E-Health! Your account has been successfully created.\n\nLogin Information:\nUser Type: ${user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}\n${loginMethod}: ${loginId}\nPassword: ${loginPassword}\n\nLogin at: http://localhost:3000/\n\nBest regards,\nUB E-Health Team`
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.log(error);
        return res.send({ message: "error" });
      }
      console.log(info.messageId);
      return res.status(200).send({ message: "successful" });
    });
  } catch (error) {
    res.send({ message: "error" });
  }
});

router.post("/forgot", async (req, res) => {
  try {
    const { email, userType } = req.body;
    console.log("Forgot password request:", { email, userType });
    
    let user;
    let userId;
    let tempPassword;
    
    // Generate a temporary password
    const generateTempPassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    
    if (userType === "patient") {
      user = await getPatientCredFromEmail(email);
      if (!user || user.length === 0) {
        return res.send({ message: "User not found" });
      }
      
      // Generate temporary password and update in database
      tempPassword = generateTempPassword();
      const bcrypt = require("bcrypt");
      const hashedTempPassword = await bcrypt.hash(tempPassword, 10);
      
      // Update patient password
      const { updatePatientPassword } = require("../models/Patient.model");
      await updatePatientPassword(user[0]._id, hashedTempPassword);
      
      userId = user[0].email; // Patients login with email
      
    } else if (userType === "doctor") {
      user = await getDoctorCredFromEmail(email);
      if (!user || user.length === 0) {
        return res.send({ message: "User not found" });
      }
      
      // Generate temporary password and update in database
      tempPassword = generateTempPassword();
      const bcrypt = require("bcrypt");
      const hashedTempPassword = await bcrypt.hash(tempPassword, 10);
      
      // Update doctor password
      const { updateDoctorPassword } = require("../models/Doctor.model");
      await updateDoctorPassword(user[0]._id, hashedTempPassword);
      
      userId = user[0].doctorId || user[0]._id.toString(); // Use doctorId if available
      
    } else if (userType === "admin") {
      // Admin has fixed credentials, no password reset needed
      userId = "admin";
      tempPassword = "admin@123"; // Fixed admin password
      
    } else {
      return res.send({ message: "Invalid user type" });
    }
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_MAIL, // generated user
        pass: process.env.SMTP_PASSWORD, // generated password
      },
    });
    
    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject: "Password Reset - UB E-Health",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0b6b61;">🏥 UB E-Health</h2>
          <h3 style="color: #d32f2f;">🔐 Password Reset</h3>
          <p>Hello,</p>
          <p>You requested a password reset for your account. We've generated a temporary password for you.</p>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin-top: 0; color: #856404;">⚠️ Important Security Notice</h3>
            <p style="margin-bottom: 0; color: #856404;">This is a temporary password. Please change it immediately after logging in for security reasons.</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0b6b61;">Login Information:</h3>
            ${userType === "patient" ? `
              <p><strong>Login Method:</strong> Email + Password</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 16px; color: #d32f2f; font-weight: bold;">${tempPassword}</code></p>
            ` : userType === "doctor" ? `
              <p><strong>Login Method:</strong> Doctor ID + Password</p>
              <p><strong>Doctor ID:</strong> ${userId}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 16px; color: #d32f2f; font-weight: bold;">${tempPassword}</code></p>
            ` : `
              <p><strong>Login Method:</strong> Username + Password</p>
              <p><strong>Username:</strong> ${userId}</p>
              <p><strong>Password:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 16px; color: #d32f2f; font-weight: bold;">${tempPassword}</code></p>
            `}
          </div>
          
          <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #0b6b61;">🔗 Login Steps:</h4>
            <ol style="margin-bottom: 0;">
              <li>Go to: <a href="http://localhost:3000/" style="color: #0b6b61;">http://localhost:3000/</a></li>
              <li>Use the login credentials above</li>
              <li><strong>Important:</strong> Change your password immediately after logging in</li>
            </ol>
          </div>
          
          <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h4 style="margin-top: 0; color: #721c24;">🛡️ Security Reminder</h4>
            <ul style="margin-bottom: 0; color: #721c24;">
              <li>This temporary password expires in 24 hours</li>
              <li>Change it immediately after logging in</li>
              <li>Don't share this password with anyone</li>
              <li>If you didn't request this reset, contact support immediately</li>
            </ul>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Best regards,<br>
            UB E-Health Team<br>
            <em>This is an automated message, please do not reply.</em>
          </p>
        </div>
      `,
      text: `Password Reset - UB E-Health\n\nHello,\n\nYou requested a password reset. Here are your temporary login credentials:\n\n${userType === "patient" ? `Email: ${email}\nTemporary Password: ${tempPassword}` : userType === "doctor" ? `Doctor ID: ${userId}\nTemporary Password: ${tempPassword}` : `Username: ${userId}\nPassword: ${tempPassword}`}\n\nIMPORTANT: This is a temporary password. Please change it immediately after logging in.\n\nLogin at: http://localhost:3000/\n\nIf you didn't request this reset, please contact support.\n\nBest regards,\nUB E-Health Team`
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email:", error);
        return res.send({ message: "error" });
      }
      console.log("Password reset email sent:", info.messageId);
      return res.status(200).send({ message: "successful" });
    });
  } catch (error) {
    console.log("Error in forgot password:", error);
    res.send({ message: "error" });
  }
});

// Doctor management routes
router.get("/doctors", async (req, res) => {
  try {
    await createTables();
    const doctors = await getAllDoctors();
    res.status(200).send(doctors);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

router.put("/doctors/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Update doctor request - ID:", id);
    console.log("Update doctor request - Body:", JSON.stringify(req.body, null, 2));
    const doctorData = { ...req.body, doctorId: id }; // Use doctorId instead of id
    console.log("Doctor data to update:", JSON.stringify(doctorData, null, 2));
    await updateDoctor(doctorData);
    res.status(200).send({ message: "Doctor updated successfully" });
  } catch (error) {
    console.error("Error updating doctor:", error);
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    if (error.code) {
      console.error("PostgreSQL error code:", error.code);
    }
    if (error.detail) {
      console.error("PostgreSQL error detail:", error.detail);
    }
    if (error.hint) {
      console.error("PostgreSQL error hint:", error.hint);
    }
    const errorMessage = error.message || error.toString() || "Something went wrong";
    const errorDetails = error.detail || error.code || error.hint || "Unknown error";
    console.error("Sending error response:", { error: errorMessage, details: errorDetails });
    res.status(400).send({ 
      error: errorMessage,
      details: errorDetails
    });
  }
});

router.delete("/doctors/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Delete doctor request - ID:", id);
    await deleteDoctor(id);
    res.status(200).send({ message: "Doctor deleted successfully. All associated patients have been unassigned." });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    if (error.code) {
      console.error("PostgreSQL error code:", error.code);
    }
    if (error.detail) {
      console.error("PostgreSQL error detail:", error.detail);
    }
    if (error.hint) {
      console.error("PostgreSQL error hint:", error.hint);
    }
    const errorMessage = error.message || error.toString() || "Something went wrong";
    const errorDetails = error.detail || error.code || error.hint || "Unknown error";
    console.error("Sending error response:", { error: errorMessage, details: errorDetails });
    res.status(400).send({ 
      error: errorMessage,
      details: errorDetails
    });
  }
});

// Patient management routes
router.get("/patients", async (req, res) => {
  try {
    const { createTable } = require("../models/Patient.model");
    await createTable();
    const patients = await getAllPatients();
    res.status(200).send(patients);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

router.put("/patients/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const patientData = { ...req.body, id };
    await updatePatient(patientData);
    res.status(200).send({ message: "Patient updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

router.delete("/patients/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await deletePatient(id);
    res.status(200).send({ message: "Patient deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

module.exports = router;
