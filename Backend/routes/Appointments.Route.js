const express = require("express");
const mongoose = require("mongoose");
const {
  createAppointment,
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  getPendingAppointmentsByPatient,
  deleteAppointment,
  findById,
} = require("../models/Appointment.model");
const { getDoctorCredFromEmail, findById: findDoctorById } = require("../models/Doctor.model");
const router = express.Router();

// Mock Razorpay for demo purposes (since no account available)
// In production, uncomment and configure real Razorpay
// const Razorpay = require("razorpay");
// const crypto = require("crypto");
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// Create mock order (for demo purposes)
router.post("/create-order", async (req, res) => {
  const { docemail } = req.body;
  try {
    const doctor = await getDoctorCredFromEmail(docemail);
    if (doctor.length === 0) {
      return res.status(404).send({ message: "Doctor not found" });
    }
    const doctorDetails = await findDoctorById(doctor[0].id);
    const amount = doctorDetails[0].fees * 100; // Amount in paisa

    // Mock order creation
    const mockOrder = {
      id: `mock_order_${Date.now()}`,
      amount: amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    // In production, uncomment the real Razorpay code:
    // const options = { amount: amount, currency: "INR", receipt: mockOrder.receipt };
    // const order = await razorpay.orders.create(options);

    res.status(200).send({
      message: "Mock order created",
      order_id: mockOrder.id,
      amount: mockOrder.amount,
      currency: mockOrder.currency,
      key_id: "mock_key_id", // Mock key for frontend
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error creating mock order" });
  }
});

// Mock payment verification and create appointment
router.post("/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentData } = req.body;

  // Mock verification (always pass for demo)
  // In production, use real Razorpay signature verification
  // const sign = razorpay_order_id + "|" + razorpay_payment_id;
  // const expectedSign = crypto
  //   .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
  //   .update(sign.toString())
  //   .digest("hex");
  // if (razorpay_signature !== expectedSign) {
  //   return res.status(400).send({ message: "Payment verification failed" });
  // }

  try {
    const doctor = await getDoctorCredFromEmail(appointmentData.docemail);
    if (doctor.length > 0) {
      const appointment = {
        patientId: appointmentData.patientId,
        doctorId: doctor[0]._id,
        docname: appointmentData.docname || doctor[0].name,
        department: appointmentData.department || doctor[0].department,
        date: appointmentData.date,
        time: appointmentData.time,
        reason: appointmentData.problem || appointmentData.reason || "General Consultation",
        payment_id: razorpay_payment_id || `mock_payment_${Date.now()}`,
        amount: appointmentData.amount,
        status: 'paid'
      };
      
      console.log("Payment verification - Creating appointment:", JSON.stringify(appointment, null, 2));
      await createAppointment(appointment);
      res.status(200).send({ message: "Appointment booked successfully (mock payment)" });
    } else {
      res.status(404).send({ message: "Doctor not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error booking appointment" });
  }
});

router.get("/:userType/:id", async (req, res) => {
  const id = req.params.id;
  const userType = req.params.userType;
  try {
    const appointments =
      userType === "doctor"
        ? await getAppointmentsByDoctor(id) // Already filters out completed appointments
        : await getPendingAppointmentsByPatient(id); // Use pending appointments for patients too
    res.status(200).send({ message: "successful", data: appointments });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "error" });
  }
});

// New route to get ALL appointments for a patient (including completed)
router.get("/patient/:id/all", async (req, res) => {
  const id = req.params.id;
  try {
    const appointments = await getAppointmentsByPatient(id);
    res.status(200).send(appointments);
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "error" });
  }
});

router.post("/create", async (req, res) => {
  const payload = req.body;
  console.log("Received appointment payload:", JSON.stringify(payload, null, 2));

  try {
    const doctor = await getDoctorCredFromEmail(req.body.docemail);
    if (doctor.length > 0) {
      const appointment = {
        patientId: payload.patientId,
        doctorId: doctor[0]._id,
        docname: payload.docname || doctor[0].name,
        department: payload.department || doctor[0].department,
        date: payload.date,
        time: payload.time,
        reason: payload.problem || payload.reason || "General Consultation",
        payment_id: payload.payment_id || null,
        amount: payload.amount || null,
        status: payload.status || 'pending',
        tokenId: payload.tokenId || null,
        queueNumber: payload.queueNumber || null,
        receiptGenerated: payload.receiptGenerated || null
      };
      
      console.log("Creating appointment with data:", JSON.stringify(appointment, null, 2));
      const result = await createAppointment(appointment);
      console.log("Appointment created successfully:", result._id);
      res.status(200).send({ message: "Successful" });
    } else {
      console.log("Doctor not found for email:", req.body.docemail);
      res.status(404).send({ message: "Doctor not found" });
    }
  } catch (error) {
    console.error("Appointment creation error:", error);
    res.status(500).send({ message: "Error creating appointment", error: error.message });
  }
});

router.delete("/:appointmentId", async (req, res) => {
  const id = req.params.appointmentId;
  console.log("Deleting appointment with ID:", id);
  
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ 
        message: "Invalid appointment ID format", 
        details: `Appointment ID '${id}' is not a valid ObjectId` 
      });
    }

    const appointment = await findById(id);
    console.log("Found appointment:", appointment);
    
    if (appointment) {
      await deleteAppointment(id);
      console.log("Appointment deleted successfully");
      res.status(200).send({ message: "successful" });
    } else {
      console.log("Appointment not found");
      res.status(404).send({ message: "Appointment not found" });
    }
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).send({ message: "Error deleting appointment", details: error.message });
  }
});

module.exports = router;
