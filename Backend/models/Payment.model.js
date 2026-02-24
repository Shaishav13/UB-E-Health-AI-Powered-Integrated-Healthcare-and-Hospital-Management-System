/*
 * UB E-Health - Payment Model
 * Copyright (c) 2025-2026 Shaishav
 * Licensed under MIT License
 */

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  // Payment identification
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayOrderId: {
    type: String,
    sparse: true
  },
  razorpayPaymentId: {
    type: String,
    sparse: true
  },
  razorpaySignature: {
    type: String
  },

  // Payment details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: "INR"
  },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed", "refunded", "partially_refunded"],
    default: "pending"
  },

  // User information
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },
  patientEmail: {
    type: String,
    required: true
  },
  patientPhone: {
    type: String,
    required: true
  },

  // Payment type and reference
  paymentType: {
    type: String,
    enum: ["appointment", "lab_test", "prescription", "other"],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  referenceModel: {
    type: String,
    enum: ["Appointment", "LabReport", "Prescription"],
    required: true
  },

  // Payment method
  paymentMethod: {
    type: String,
    enum: ["card", "upi", "netbanking", "wallet", "cash"],
    default: "card"
  },

  // Transaction details
  transactionDate: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String
  },

  // Refund information
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String
  },
  refundDate: {
    type: Date
  },
  refundId: {
    type: String
  },

  // Invoice details
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  invoiceGenerated: {
    type: Boolean,
    default: false
  },
  invoiceDate: {
    type: Date
  },

  // Additional metadata
  metadata: {
    type: Map,
    of: String
  },

  // Error tracking
  errorCode: {
    type: String
  },
  errorDescription: {
    type: String
  }
}, { timestamps: true });

// Generate unique payment ID
paymentSchema.statics.generatePaymentId = function() {
  return `PAY${Date.now()}${Math.floor(Math.random() * 10000)}`;
};

// Generate invoice number
paymentSchema.statics.generateInvoiceNumber = async function() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const count = await this.countDocuments({
    invoiceGenerated: true,
    createdAt: {
      $gte: new Date(date.getFullYear(), date.getMonth(), 1),
      $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
    }
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `INV${year}${month}${sequence}`;
};

// Instance method to mark as completed
paymentSchema.methods.markCompleted = async function(razorpayData) {
  this.status = "completed";
  this.razorpayPaymentId = razorpayData.razorpayPaymentId;
  this.razorpaySignature = razorpayData.razorpaySignature;
  this.transactionDate = new Date();
  
  if (!this.invoiceGenerated) {
    this.invoiceNumber = await this.constructor.generateInvoiceNumber();
    this.invoiceGenerated = true;
    this.invoiceDate = new Date();
  }
  
  return await this.save();
};

// Instance method to process refund
paymentSchema.methods.processRefund = async function(amount, reason) {
  if (this.status !== "completed") {
    throw new Error("Can only refund completed payments");
  }
  
  if (amount > (this.amount - this.refundAmount)) {
    throw new Error("Refund amount exceeds available balance");
  }
  
  this.refundAmount += amount;
  this.refundReason = reason;
  this.refundDate = new Date();
  
  if (this.refundAmount >= this.amount) {
    this.status = "refunded";
  } else {
    this.status = "partially_refunded";
  }
  
  return await this.save();
};

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = {
  Payment,
  
  // Create payment order
  createPaymentOrder: async (data) => {
    const paymentId = Payment.generatePaymentId();
    const payment = new Payment({
      ...data,
      paymentId
    });
    return await payment.save();
  },
  
  // Get payment by ID
  getPaymentById: async (paymentId) => {
    return await Payment.findOne({ paymentId })
      .populate("patientId", "name email phone");
  },
  
  // Get payment by Razorpay order ID
  getPaymentByOrderId: async (razorpayOrderId) => {
    return await Payment.findOne({ razorpayOrderId })
      .populate("patientId", "name email phone");
  },
  
  // Get all payments for a patient
  getPatientPayments: async (patientId) => {
    return await Payment.find({ patientId })
      .sort({ createdAt: -1 })
      .populate("patientId", "name email phone");
  },
  
  // Get payment history with filters
  getPaymentHistory: async (filters = {}) => {
    const query = {};
    
    if (filters.patientId) query.patientId = filters.patientId;
    if (filters.status) query.status = filters.status;
    if (filters.paymentType) query.paymentType = filters.paymentType;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }
    
    return await Payment.find(query)
      .sort({ createdAt: -1 })
      .populate("patientId", "name email phone");
  },
  
  // Update payment status
  updatePaymentStatus: async (paymentId, status, additionalData = {}) => {
    return await Payment.findOneAndUpdate(
      { paymentId },
      { status, ...additionalData },
      { new: true }
    );
  },
  
  // Get payment statistics
  getPaymentStats: async (patientId = null) => {
    const match = patientId ? { patientId: mongoose.Types.ObjectId(patientId) } : {};
    
    const stats = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);
    
    return stats;
  }
};
