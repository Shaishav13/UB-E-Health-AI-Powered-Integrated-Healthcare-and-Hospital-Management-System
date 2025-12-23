import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { CreateBooking } from "../../../../../Redux/Datas/action";
import Sidebar from "../../GlobalFiles/Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCreditCard, FaLock, FaCheckCircle } from "react-icons/fa";

const notify = (text) => toast(text);

const Payment_Gateway = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const appointmentData = location.state?.appointmentData;
  const doctorFees = location.state?.doctorFees || 0;

  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
    paymentMethod: "card",
  });

  useEffect(() => {
    if (!appointmentData) {
      notify("No appointment data found. Redirecting...");
      setTimeout(() => navigate("/bookappointment"), 2000);
    }
  }, [appointmentData, navigate]);

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // Format card number with spaces
    if (name === "cardNumber") {
      value = value.replace(/\s/g, "").replace(/(\d{4})/g, "$1 ").trim();
      if (value.length > 19) return;
    }

    // Format expiry date
    if (name === "expiryDate") {
      value = value.replace(/\D/g, "");
      if (value.length >= 2) {
        value = value.slice(0, 2) + "/" + value.slice(2, 4);
      }
      if (value.length > 5) return;
    }

    // CVV validation
    if (name === "cvv") {
      value = value.replace(/\D/g, "");
      if (value.length > 3) return;
    }

    setPaymentDetails({ ...paymentDetails, [name]: value });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate payment processing
    setTimeout(async () => {
      try {
        // Generate payment ID
        const paymentId = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // Create appointment with payment details
        const payload = {
          ...appointmentData,
          payment_id: paymentId,
          amount: doctorFees,
          status: "confirmed",
        };

        console.log("Payment Gateway - Sending appointment data:", JSON.stringify(payload, null, 2));
        const res = await dispatch(CreateBooking(payload));
        console.log("Payment Gateway - CreateBooking response:", res);

        if (res && res.message === "Successful") {
          setPaymentSuccess(true);
          notify("Payment Successful! Appointment Confirmed.");
          
          setTimeout(() => {
            navigate("/checkappointment");
          }, 3000);
        } else {
          console.error("Payment failed - Response:", res);
          notify(`Payment failed: ${res?.message || "Unknown error"}. Please try again.`);
          setLoading(false);
        }
      } catch (error) {
        notify("An error occurred. Please try again.");
        setLoading(false);
      }
    }, 2000);
  };

  if (!appointmentData) {
    return null;
  }

  return (
    <>
      <ToastContainer />

      <style>{`
        .payment-container {
          display: flex;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          width: 100%;
          position: relative;
        }

        .payment-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.05)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.05)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.03)"/><circle cx="20" cy="80" r="0.5" fill="rgba(255,255,255,0.03)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          pointer-events: none;
        }

        .payment-wrapper {
          flex: 1;
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
        }

        .payment-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
          max-width: 1200px;
          width: 100%;
        }

        @media (max-width: 968px) {
          .payment-content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        .payment-card,
        .summary-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 3rem;
          border-radius: 24px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 1px 0 rgba(255, 255, 255, 0.2) inset,
            0 -1px 0 rgba(0, 0, 0, 0.1) inset;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .payment-card:hover,
        .summary-card:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.15),
            0 1px 0 rgba(255, 255, 255, 0.3) inset;
        }

        .payment-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .payment-header h1 {
          font-size: 2.2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .payment-header p {
          color: #64748b;
          font-size: 1rem;
          font-weight: 500;
        }

        .payment-method-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2.5rem;
          background: #f8fafc;
          padding: 0.5rem;
          border-radius: 16px;
        }

        .payment-tab {
          flex: 1;
          padding: 1rem 1.5rem;
          border: none;
          border-radius: 12px;
          background: transparent;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 600;
          font-size: 0.95rem;
          color: #64748b;
          position: relative;
          overflow: hidden;
        }

        .payment-tab::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .payment-tab span {
          position: relative;
          z-index: 1;
        }

        .payment-tab.active {
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .payment-tab.active::before {
          opacity: 1;
        }

        .form-group {
          margin-bottom: 1.8rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.75rem;
          color: #1e293b;
          font-weight: 600;
          font-size: 0.95rem;
          letter-spacing: 0.01em;
        }

        .form-group input {
          width: 100%;
          padding: 1.2rem 1.5rem;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-size: 1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: #fafbfc;
          color: #1e293b;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 
            0 0 0 4px rgba(102, 126, 234, 0.1),
            0 4px 12px rgba(102, 126, 234, 0.15);
          transform: translateY(-2px);
        }

        .form-group input::placeholder {
          color: #94a3b8;
        }

        .form-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }

        .pay-button {
          width: 100%;
          padding: 1.2rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          position: relative;
          overflow: hidden;
          letter-spacing: 0.02em;
        }

        .pay-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .pay-button:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 
            0 12px 24px rgba(102, 126, 234, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
        }

        .pay-button:hover:not(:disabled)::before {
          left: 100%;
        }

        .pay-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .summary-card h2 {
          font-size: 1.6rem;
          color: #1e293b;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f1f5f9;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid #f1f5f9;
          transition: all 0.2s ease;
        }

        .summary-item:hover {
          background: #f8fafc;
          margin: 0 -1rem;
          padding: 1rem;
          border-radius: 12px;
          border-bottom: 1px solid transparent;
        }

        .summary-item label {
          color: #64748b;
          font-weight: 500;
          font-size: 0.95rem;
        }

        .summary-item span {
          color: #1e293b;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem 0 1rem;
          margin-top: 1rem;
          border-top: 2px solid #667eea;
          font-size: 1.4rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .security-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-top: 2rem;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 12px;
          color: #0369a1;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .success-animation {
          text-align: center;
          padding: 4rem 2rem;
        }

        .success-icon {
          font-size: 6rem;
          color: #10b981;
          animation: successPulse 2s infinite;
          margin-bottom: 1.5rem;
        }

        @keyframes successPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        .success-animation h2 {
          color: #10b981;
          margin: 1.5rem 0;
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .success-animation p {
          color: #64748b;
          font-size: 1.1rem;
          font-weight: 500;
          margin: 0.5rem 0;
        }

        /* Medical icons decoration */
        .payment-card::after {
          content: '⚕️';
          position: absolute;
          top: 2rem;
          right: 2rem;
          font-size: 2rem;
          opacity: 0.1;
        }

        .summary-card::after {
          content: '📋';
          position: absolute;
          top: 2rem;
          right: 2rem;
          font-size: 2rem;
          opacity: 0.1;
        }
      `}</style>

      <div className="payment-container">
        <Sidebar />

        <div className="payment-wrapper">
          <div className="payment-content">
            {/* Payment Form */}
            <div className="payment-card">
              {!paymentSuccess ? (
                <>
                  <div className="payment-header">
                    <h1>
                      <FaCreditCard /> Secure Payment
                    </h1>
                    <p>Complete your payment to confirm appointment</p>
                  </div>

                  <div className="payment-method-tabs">
                    <button
                      className={`payment-tab ${
                        paymentDetails.paymentMethod === "card" ? "active" : ""
                      }`}
                      onClick={() =>
                        setPaymentDetails({
                          ...paymentDetails,
                          paymentMethod: "card",
                        })
                      }
                    >
                      <span>💳 Credit/Debit Card</span>
                    </button>
                    <button
                      className={`payment-tab ${
                        paymentDetails.paymentMethod === "upi" ? "active" : ""
                      }`}
                      onClick={() =>
                        setPaymentDetails({
                          ...paymentDetails,
                          paymentMethod: "upi",
                        })
                      }
                    >
                      <span>📱 UPI</span>
                    </button>
                  </div>

                  <form onSubmit={handlePayment}>
                    {paymentDetails.paymentMethod === "card" ? (
                      <>
                        <div className="form-group">
                          <label>Card Number</label>
                          <input
                            type="text"
                            name="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={paymentDetails.cardNumber}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Card Holder Name</label>
                          <input
                            type="text"
                            name="cardHolder"
                            placeholder="John Doe"
                            value={paymentDetails.cardHolder}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Expiry Date</label>
                            <input
                              type="text"
                              name="expiryDate"
                              placeholder="MM/YY"
                              value={paymentDetails.expiryDate}
                              onChange={handleInputChange}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>CVV</label>
                            <input
                              type="text"
                              name="cvv"
                              placeholder="123"
                              value={paymentDetails.cvv}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="form-group">
                        <label>UPI ID</label>
                        <input
                          type="text"
                          name="upiId"
                          placeholder="yourname@upi"
                          required
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="pay-button"
                      disabled={loading}
                    >
                      <FaLock />
                      {loading ? "Processing..." : `Pay ₹${doctorFees}`}
                    </button>

                    <div className="security-badge">
                      <FaLock />
                      Your payment information is secure and encrypted
                    </div>
                  </form>
                </>
              ) : (
                <div className="success-animation">
                  <FaCheckCircle className="success-icon" />
                  <h2>Payment Successful!</h2>
                  <p>Your appointment has been confirmed.</p>
                  <p>Redirecting to your appointments...</p>
                </div>
              )}
            </div>

            {/* Summary Card */}
            <div className="summary-card">
              <h2>Appointment Summary</h2>

              <div className="summary-item">
                <label>Doctor:</label>
                <span>{appointmentData?.docname || "N/A"}</span>
              </div>

              <div className="summary-item">
                <label>Department:</label>
                <span>{appointmentData?.department || "N/A"}</span>
              </div>

              <div className="summary-item">
                <label>Date:</label>
                <span>{appointmentData?.date || "N/A"}</span>
              </div>

              <div className="summary-item">
                <label>Time:</label>
                <span>{appointmentData?.time || "N/A"}</span>
              </div>

              <div className="summary-item">
                <label>Problem:</label>
                <span>{appointmentData?.problem || "N/A"}</span>
              </div>

              <div className="summary-item">
                <label>Consultation Fee:</label>
                <span>₹{doctorFees}</span>
              </div>

              <div className="summary-total">
                <span>Total Amount:</span>
                <span>₹{doctorFees}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Payment_Gateway;
