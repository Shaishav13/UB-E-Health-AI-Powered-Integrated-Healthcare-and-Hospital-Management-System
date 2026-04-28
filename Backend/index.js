/*
 * UB E-Health - Backend Server
 * Copyright (c) 2025 Shaishav
 * Licensed under MIT License - see LICENSE file for details
 */

const http = require("http");
const express = require("express");
require("dotenv").config();
const cors = require("cors");
const adminRouter = require("./routes/Admins.Route");
const ambulanceRouter = require("./routes/Ambulances.Route");
const appointmentRouter = require("./routes/Appointments.Route");
const doctorRouter = require("./routes/Doctors.Route");
const hospitalRouter = require("./routes/Hospitals.Route");
const patientRouter = require("./routes/Patients.Route");
const prescriptionRouter = require("./routes/Prescriptions.Route");
const reportRouter = require("./routes/Reports.Route");
const notificationRouter = require("./routes/Notifications.Route");
const analyticsRouter = require("./routes/Analytics.Route");
const documentsRouter = require("./routes/Documents.Route");
const labReportsRouter = require("./routes/LabReports.Route");
const labPersonnelRouter = require("./routes/LabPersonnel.Route");
const paymentsRouter = require("./routes/Payments.Route");
const chatbotRouter = require("./routes/Chatbot.Route");
const chatRouter = require("./routes/Chat.Route");

const app = express();
const httpServer = http.createServer(app);
const { connectDB } = require("./configs/db");

// Increase payload limit for profile picture uploads (base64 images)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.get("/", (req, res) => {
  res.send("Healthcare System");
});

app.use("/admin", adminRouter);
app.use("/ambulances", ambulanceRouter);
app.use("/appointments", appointmentRouter);
app.use("/doctors", doctorRouter);
app.use("/hospitals", hospitalRouter);
app.use("/patients", patientRouter);
app.use("/prescriptions", prescriptionRouter);
app.use("/reports", reportRouter);
app.use("/notifications", notificationRouter);
app.use("/analytics", analyticsRouter);
app.use("/documents", documentsRouter);
app.use("/lab-reports", labReportsRouter);
app.use("/lab-personnel", labPersonnelRouter);
app.use("/payments", paymentsRouter);
app.use("/chatbot", chatbotRouter);
app.use("/api/chat", chatRouter);

// Models will be imported as needed in routes

httpServer.listen(process.env.port, async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    console.log("Database initialization complete.");

    // Initialize notification scheduler
    const { initializeNotificationScheduler } = require("./services/notificationService");
    initializeNotificationScheduler();

    // Initialize Socket.io server for real-time chat (Req 2.1, 20.7)
    const { createSocketServer } = require("./socket/socketServer");
    createSocketServer(httpServer);

    console.log(`Listening at port ${process.env.port}`);
  } catch (err) {
    console.error("Error during database initialization:", err);
    process.exit(1); // Exit if DB init fails
  }
});
