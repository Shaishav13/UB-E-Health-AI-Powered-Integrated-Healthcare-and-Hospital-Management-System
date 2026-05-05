/*
 * UB E-Health - Razorpay Payment Service
 * Copyright (c) 2025-2026 Shaishav
 * Licensed under MIT License
 */

const crypto = require("crypto");

// Mock Razorpay for development (replace with actual Razorpay SDK in production)
class RazorpayService {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_demo_key";
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || "demo_secret_key";
    this.enabled = process.env.RAZORPAY_ENABLED === "true";
  }

  /**
   * Create a Razorpay order
   * @param {Object} options - Order options
   * @param {Number} options.amount - Amount in smallest currency unit (paise for INR)
   * @param {String} options.currency - Currency code (default: INR)
   * @param {String} options.receipt - Receipt ID
   * @param {Object} options.notes - Additional notes
   * @returns {Promise<Object>} Order details
   */
  async createOrder(options) {
    const { amount, currency = "INR", receipt, notes = {} } = options;

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    // In development mode, return mock order
    if (!this.enabled) {
      return {
        id: `order_${Date.now()}${Math.floor(Math.random() * 10000)}`,
        entity: "order",
        amount: amount,
        amount_paid: 0,
        amount_due: amount,
        currency: currency,
        receipt: receipt,
        status: "created",
        attempts: 0,
        notes: notes,
        created_at: Math.floor(Date.now() / 1000)
      };
    }

    // Production: Use actual Razorpay SDK
    try {
      const Razorpay = require("razorpay");
      const instance = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret
      });

      const order = await instance.orders.create({
        amount: amount,
        currency: currency,
        receipt: receipt,
        notes: notes
      });

      return order;
    } catch (error) {
      console.error("Razorpay order creation error:", error);
      throw new Error(`Failed to create Razorpay order: ${error.message}`);
    }
  }

  /**
   * Verify payment signature
   * @param {Object} data - Payment verification data
   * @param {String} data.razorpayOrderId - Razorpay order ID
   * @param {String} data.razorpayPaymentId - Razorpay payment ID
   * @param {String} data.razorpaySignature - Razorpay signature
   * @returns {Boolean} Verification result
   */
  verifyPaymentSignature(data) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;

    // In development mode, always return true
    if (!this.enabled) {
      return true;
    }

    // Production: Verify signature
    try {
      const text = `${razorpayOrderId}|${razorpayPaymentId}`;
      const generated_signature = crypto
        .createHmac("sha256", this.keySecret)
        .update(text)
        .digest("hex");

      return generated_signature === razorpaySignature;
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }

  /**
   * Fetch payment details
   * @param {String} paymentId - Razorpay payment ID
   * @returns {Promise<Object>} Payment details
   */
  async fetchPayment(paymentId) {
    if (!this.enabled) {
      return {
        id: paymentId,
        entity: "payment",
        amount: 50000,
        currency: "INR",
        status: "captured",
        method: "card",
        captured: true,
        created_at: Math.floor(Date.now() / 1000)
      };
    }

    try {
      const Razorpay = require("razorpay");
      const instance = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret
      });

      const payment = await instance.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error("Fetch payment error:", error);
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }
  }

  /**
   * Process refund
   * @param {String} paymentId - Razorpay payment ID
   * @param {Number} amount - Refund amount in smallest currency unit
   * @param {Object} options - Refund options
   * @returns {Promise<Object>} Refund details
   */
  async processRefund(paymentId, amount, options = {}) {
    if (!this.enabled) {
      return {
        id: `rfnd_${Date.now()}${Math.floor(Math.random() * 10000)}`,
        entity: "refund",
        amount: amount,
        currency: "INR",
        payment_id: paymentId,
        status: "processed",
        created_at: Math.floor(Date.now() / 1000),
        ...options
      };
    }

    try {
      const Razorpay = require("razorpay");
      const instance = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret
      });

      const refund = await instance.payments.refund(paymentId, {
        amount: amount,
        ...options
      });

      return refund;
    } catch (error) {
      console.error("Refund processing error:", error);
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  /**
   * Fetch refund details
   * @param {String} refundId - Razorpay refund ID
   * @returns {Promise<Object>} Refund details
   */
  async fetchRefund(refundId) {
    if (!this.enabled) {
      return {
        id: refundId,
        entity: "refund",
        amount: 50000,
        currency: "INR",
        status: "processed",
        created_at: Math.floor(Date.now() / 1000)
      };
    }

    try {
      const Razorpay = require("razorpay");
      const instance = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret
      });

      const refund = await instance.refunds.fetch(refundId);
      return refund;
    } catch (error) {
      console.error("Fetch refund error:", error);
      throw new Error(`Failed to fetch refund: ${error.message}`);
    }
  }

  /**
   * Get payment methods
   * @returns {Array} Available payment methods
   */
  getPaymentMethods() {
    return [
      { id: "card", name: "Credit/Debit Card", icon: "💳" },
      { id: "upi", name: "UPI", icon: "📱" },
      { id: "netbanking", name: "Net Banking", icon: "🏦" },
      { id: "wallet", name: "Wallet", icon: "👛" }
    ];
  }

  /**
   * Calculate convenience fee
   * @param {Number} amount - Base amount
   * @param {String} method - Payment method
   * @returns {Number} Convenience fee
   */
  calculateConvenienceFee(amount, method = "card") {
    const feeRates = {
      card: 0.02, // 2%
      upi: 0,     // Free
      netbanking: 0.01, // 1%
      wallet: 0.015 // 1.5%
    };

    const rate = feeRates[method] || 0;
    return Math.round(amount * rate);
  }
}

module.exports = new RazorpayService();
