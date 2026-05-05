/*
 * UB E-Health - Payment Routes
 * Copyright (c) 2025-2026 Shaishav
 * Licensed under MIT License
 */

const express = require("express");
const router = express.Router();
const {
  Payment,
  createPaymentOrder,
  getPaymentById,
  getPaymentByOrderId,
  getPatientPayments,
  getPaymentHistory,
  updatePaymentStatus
} = require("../models/Payment.model");
const razorpayService = require("../services/razorpayService");
const { authenticate: patientAuth } = require("../middlewares/patientAuth");

/**
 * @route   POST /payments/create-order
 * @desc    Create a new payment order
 * @access  Private (Patient)
 */
router.post("/create-order", patientAuth, async (req, res) => {
  try {
    const {
      amount,
      paymentType,
      referenceId,
      referenceModel,
      description,
      metadata
    } = req.body;

    // Validate required fields
    if (!amount || !paymentType || !referenceId || !referenceModel) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Get patient ID from middleware
    const patientID = req.body.patientID;
    
    // Get patient details from database
    const Patient = require("../models/Patient.model");
    const patientData = await Patient.findCred(patientID);
    
    if (!patientData) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    // Create payment record in database
    const payment = await createPaymentOrder({
      amount,
      patientId: patientID,
      patientEmail: patientData.email,
      patientPhone: patientData.phonenum || patientData.phone,
      paymentType,
      referenceId,
      referenceModel,
      description,
      metadata,
      status: "pending"
    });

    // Create Razorpay order
    const razorpayOrder = await razorpayService.createOrder({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: payment.paymentId,
      notes: {
        paymentId: payment.paymentId,
        paymentType,
        patientId: patientID.toString()
      }
    });

    // Update payment with Razorpay order ID
    payment.razorpayOrderId = razorpayOrder.id;
    payment.status = "processing";
    await payment.save();

    res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      data: {
        paymentId: payment.paymentId,
        razorpayOrderId: razorpayOrder.id,
        amount: payment.amount,
        currency: "INR",
        razorpayKeyId: razorpayService.keyId
      }
    });
  } catch (error) {
    console.error("Create payment order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
      error: error.message
    });
  }
});

/**
 * @route   POST /payments/verify
 * @desc    Verify payment and update status
 * @access  Private (Patient)
 */
router.post("/verify", patientAuth, async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    // Validate required fields
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification data"
      });
    }

    // Get payment by Razorpay order ID
    const payment = await getPaymentByOrderId(razorpayOrderId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Verify signature
    const isValid = razorpayService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    if (!isValid) {
      payment.status = "failed";
      payment.errorDescription = "Invalid payment signature";
      await payment.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    // Mark payment as completed
    await payment.markCompleted({
      razorpayPaymentId,
      razorpaySignature
    });

    // Update reference model (Appointment/LabReport) status
    const RefModel = require(`../models/${payment.referenceModel}.model`);
    if (payment.referenceModel === "Appointment") {
      await RefModel.updateAppointment(payment.referenceId, {
        status: "confirmed",
        payment_id: payment.paymentId
      });
    } else if (payment.referenceModel === "LabReport") {
      await RefModel.updateLabReportStatus(payment.referenceId, "Paid", {
        paymentStatus: "Paid"
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        paymentId: payment.paymentId,
        invoiceNumber: payment.invoiceNumber,
        status: payment.status,
        amount: payment.amount
      }
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message
    });
  }
});

/**
 * @route   GET /payments/history
 * @desc    Get payment history for logged-in patient
 * @access  Private (Patient)
 */
router.get("/history", patientAuth, async (req, res) => {
  try {
    const patientId = req.body.patientID;
    const { status, paymentType, startDate, endDate } = req.query;

    const filters = { patientId };
    if (status) filters.status = status;
    if (paymentType) filters.paymentType = paymentType;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const payments = await getPaymentHistory(filters);

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
      error: error.message
    });
  }
});

/**
 * @route   GET /payments/:paymentId
 * @desc    Get payment details by ID
 * @access  Private (Patient)
 */
router.get("/:paymentId", patientAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await getPaymentById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Verify patient owns this payment
    if (payment.patientId.toString() !== req.body.patientID.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message
    });
  }
});

/**
 * @route   POST /payments/:paymentId/refund
 * @desc    Request refund for a payment
 * @access  Private (Patient)
 */
router.post("/:paymentId/refund", patientAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const payment = await getPaymentById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Verify patient owns this payment
    if (payment.patientId.toString() !== req.body.patientID.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    // Validate refund amount
    const refundAmount = amount || payment.amount;
    if (refundAmount > (payment.amount - payment.refundAmount)) {
      return res.status(400).json({
        success: false,
        message: "Refund amount exceeds available balance"
      });
    }

    // Process refund through Razorpay
    const refund = await razorpayService.processRefund(
      payment.razorpayPaymentId,
      refundAmount * 100, // Convert to paise
      { notes: { reason } }
    );

    // Update payment record
    await payment.processRefund(refundAmount, reason);
    payment.refundId = refund.id;
    await payment.save();

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: {
        refundId: refund.id,
        refundAmount,
        status: payment.status
      }
    });
  } catch (error) {
    console.error("Refund processing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process refund",
      error: error.message
    });
  }
});

/**
 * @route   POST /payments/create-record
 * @desc    Create payment record directly (for completed payments)
 * @access  Public (used by appointment and lab test booking)
 */
router.post("/create-record", async (req, res) => {
  try {
    const paymentData = req.body;

    // Validate required fields
    if (!paymentData.paymentId || !paymentData.amount || !paymentData.patientId) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment fields"
      });
    }

    // Generate invoice number if not provided
    if (!paymentData.invoiceNumber) {
      paymentData.invoiceNumber = await Payment.generateInvoiceNumber();
    }

    // Create payment record
    const payment = new Payment(paymentData);
    await payment.save();

    console.log(`✅ Payment record created: ${payment.paymentId}`);

    res.status(201).json({
      success: true,
      message: "Payment record created successfully",
      data: payment
    });
  } catch (error) {
    console.error("Create payment record error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment record",
      error: error.message
    });
  }
});

/**
 * @route   GET /payments/methods
 * @desc    Get available payment methods
 * @access  Public
 */
router.get("/methods/available", (req, res) => {
  try {
    const methods = razorpayService.getPaymentMethods();
    
    res.status(200).json({
      success: true,
      data: methods
    });
  } catch (error) {
    console.error("Get payment methods error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment methods",
      error: error.message
    });
  }
});

module.exports = router;
