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
const metricsService = require("./services/metricsService");

const app = express();
const httpServer = http.createServer(app);
const { connectDB } = require("./configs/db");

// ── Redis client (Req 2.7, 20.6) ──────────────────────────────────────────────
// Import early so the connection is established before the HTTP server starts.
// The redis module registers its own 'error' event handler, so unhandled
// rejection won't crash the process.  We surface a warning here so operators
// know Redis is unavailable; core messaging falls back to DB-only mode.
const { redis, isRedisConnected } = require("./configs/redis");

redis.on("error", (err) => {
  // Already logged inside configs/redis.js – add a top-level warning so it
  // appears in the main server log stream as well.
  console.warn("[Server] Redis error (chat features may be degraded):", err.message);
});

// ── Request metrics middleware (Req 20.2, 20.3) ───────────────────────────────
// Mount before routes so every request is timed.
app.use(metricsService.requestMetricsMiddleware);

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
    // ── 1. Connect to MongoDB ────────────────────────────────────────────────
    await connectDB();
    console.log("Database initialization complete.");

    // ── 2. Verify Redis connection (Req 2.7, 20.6) ──────────────────────────
    // Non-fatal: the server continues even if Redis is unavailable.
    // Socket.io will run in single-node mode and rate-limiting / presence
    // features will degrade gracefully.
    const redisOk = await isRedisConnected();
    if (redisOk) {
      console.log("✓ Redis connection verified.");
    } else {
      console.warn(
        "⚠ Redis is not reachable – chat presence, typing indicators, and " +
        "rate limiting will be unavailable until Redis recovers."
      );
    }

    // ── 3. Initialize notification scheduler ────────────────────────────────
    const { initializeNotificationScheduler } = require("./services/notificationService");
    initializeNotificationScheduler();

    // ── 3b. Initialize HIPAA data retention scheduler (Req 19.6, 22.2) ──────
    const { scheduleRetentionJob } = require("./services/dataRetentionService");
    scheduleRetentionJob();

    // ── 4. Initialize Socket.io server (Req 2.1, 20.7) ──────────────────────
    // createSocketServer attaches the Socket.io server to the *same* HTTP
    // server and port as Express, configures CORS, JWT auth middleware, the
    // Redis pub/sub adapter for horizontal scaling, and registers all domain
    // event handlers (send_message, typing_start/stop, message_read, etc.).
    const { createSocketServer } = require("./socket/socketServer");
    const io = createSocketServer(httpServer);

    // Expose the io instance on the app so route handlers can emit events
    // without creating circular dependencies (e.g. for REST-triggered events).
    app.set("io", io);

    console.log(`✓ Socket.io server running on port ${process.env.port} (same as Express)`);
    console.log(`Listening at port ${process.env.port}`);

    // ── 5. Start background metrics collector (Req 20.1, 20.5, 20.6) ────────
    metricsService.startCollector();
  } catch (err) {
    console.error("Error during server initialization:", err);
    process.exit(1); // Exit if critical init fails
  }
});
