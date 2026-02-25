import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Sidebar from "../../GlobalFiles/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const notify = (text) => toast(text);

const Book_Lab_Test = () => {
  const { data } = useSelector((store) => store.auth);
  const [formData, setFormData] = useState({
    testType: "Complete Blood Count (CBC)",
    testName: "",
    homeService: false,
    address: "",
    preferredDate: "",
    preferredTime: "09:00 AM",
    cost: 0
  });

  const testTypes = [
    { name: "Complete Blood Count (CBC)", cost: 500 },
    { name: "Hemoglobin Test", cost: 200 },
    { name: "Blood Sugar (Fasting)", cost: 150 },
    { name: "Blood Sugar (Random)", cost: 150 },
    { name: "Lipid Profile", cost: 800 },
    { name: "Liver Function Test (LFT)", cost: 1000 },
    { name: "Kidney Function Test (KFT)", cost: 1000 },
    { name: "Thyroid Profile", cost: 600 },
    { name: "Vitamin D Test", cost: 1200 },
    { name: "Vitamin B12 Test", cost: 800 },
    { name: "Urine Routine", cost: 300 },
    { name: "HbA1c Test", cost: 500 },
    { name: "Other", cost: 0 }
  ];

  const timeSlots = [
    "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM",
    "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
    "04:00 PM", "05:00 PM", "06:00 PM"
  ];

  const handleTestTypeChange = (e) => {
    const selectedTest = testTypes.find(t => t.name === e.target.value);
    setFormData({
      ...formData,
      testType: e.target.value,
      testName: e.target.value === "Other" ? "" : e.target.value,
      cost: selectedTest ? selectedTest.cost : 0
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.testName || !formData.preferredDate || !formData.preferredTime) {
      notify("❌ Please fill all required fields");
      return;
    }

    if (formData.homeService && !formData.address) {
      notify("❌ Please provide address for home service");
      return;
    }

    try {
      // Generate payment ID
      const paymentId = `PAY${Date.now()}${Math.floor(Math.random() * 10000)}`;
      
      const requestData = {
        patientId: data.user._id,
        testType: formData.testType,
        testName: formData.testName,
        homeService: formData.homeService,
        address: formData.homeService ? formData.address : data.user.address,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        cost: formData.homeService ? formData.cost + 50 : formData.cost,
        payment_id: paymentId,
        paymentStatus: "completed"
      };

      // Create lab test request
      const response = await axios.post("http://127.0.0.1:3001/lab-reports/request", requestData);

      // Create payment record
      if (response.data && response.data.labReport) {
        try {
          const paymentData = {
            paymentId: paymentId,
            razorpayOrderId: `order_${Date.now()}`,
            razorpayPaymentId: `pay_${Date.now()}`,
            razorpaySignature: "mock_signature",
            amount: totalCost,
            currency: "INR",
            status: "completed",
            patientId: data.user._id,
            patientEmail: data.user.email,
            patientPhone: data.user.phonenum || data.user.phone || "N/A",
            paymentType: "lab_test",
            referenceId: response.data.labReport._id,
            referenceModel: "LabReport",
            paymentMethod: "card",
            transactionDate: new Date().toISOString(),
            description: `Lab Test: ${formData.testName}${formData.homeService ? ' (Home Service)' : ''}`,
            invoiceGenerated: true,
            invoiceDate: new Date().toISOString()
          };

          await axios.post("http://127.0.0.1:3001/payments/create-record", paymentData);
          console.log("✅ Payment record created for lab test");
        } catch (paymentError) {
          console.error("Error creating payment record:", paymentError);
          // Don't fail the booking if payment record creation fails
        }
      }

      notify("✅ Lab test booked successfully!");
      
      setFormData({
        testType: "Complete Blood Count (CBC)",
        testName: "",
        homeService: false,
        address: "",
        preferredDate: "",
        preferredTime: "09:00 AM",
        cost: 0
      });
    } catch (error) {
      console.error("Error booking lab test:", error);
      notify("❌ Failed to book lab test");
    }
  };

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "patient") return <Navigate to="/dashboard" />;

  const totalCost = formData.homeService ? formData.cost + 50 : formData.cost;

  return (
    <>
      <ToastContainer />


      <style>{`
        .lab-test-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .lab-test-content {
          flex: 1;
          padding: 2.5rem 3rem;
          overflow-y: auto;
        }

        .lab-test-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .lab-test-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .lab-test-subtitle {
          font-size: 1.1rem;
          color: #64748b;
          font-weight: 500;
        }

        .booking-form {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 2.5rem;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 0.875rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .checkbox-group:hover {
          background: #f0f4ff;
        }

        .checkbox-input {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .checkbox-label {
          font-weight: 600;
          color: #374151;
          cursor: pointer;
        }

        .home-service-badge {
          display: inline-block;
          padding: 0.375rem 0.75rem;
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
          color: white;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-left: 0.5rem;
        }

        .cost-summary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .cost-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          font-size: 0.95rem;
        }

        .cost-total {
          display: flex;
          justify-content: space-between;
          font-size: 1.3rem;
          font-weight: 700;
          padding-top: 0.75rem;
          border-top: 2px solid rgba(255, 255, 255, 0.3);
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .info-box {
          background: #f0fdf4;
          border-left: 4px solid #34d399;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .info-title {
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .info-text {
          color: #64748b;
          font-size: 0.9rem;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .lab-test-content {
            padding: 1.5rem 1rem;
          }

          .booking-form {
            padding: 1.5rem;
          }

          .lab-test-title {
            font-size: 2rem;
          }
        }
      `}</style>

      <div className="lab-test-container">
        <Sidebar />

        <div className="lab-test-content">
          <div className="lab-test-header">
            <h1 className="lab-test-title">🧪 Book Lab Test</h1>
            <p className="lab-test-subtitle">
              Book lab tests with home sample collection service
            </p>
          </div>

          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h2 className="section-title">Test Information</h2>

              <div className="form-group">
                <label className="form-label">Select Test Type *</label>
                <select
                  className="form-select"
                  value={formData.testType}
                  onChange={handleTestTypeChange}
                  required
                >
                  {testTypes.map((test) => (
                    <option key={test.name} value={test.name}>
                      {test.name} {test.cost > 0 && `- ₹${test.cost}`}
                    </option>
                  ))}
                </select>
              </div>

              {formData.testType === "Other" && (
                <div className="form-group">
                  <label className="form-label">Test Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.testName}
                    onChange={(e) =>
                      setFormData({ ...formData, testName: e.target.value })
                    }
                    placeholder="Enter test name"
                    required
                  />
                </div>
              )}
            </div>

            <div className="form-section">
              <h2 className="section-title">Home Service</h2>

              <div className="info-box">
                <div className="info-title">🏠 Home Sample Collection</div>
                <div className="info-text">
                  Our trained technician will visit your home to collect the sample.
                  Additional charge: ₹50
                </div>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  id="homeService"
                  checked={formData.homeService}
                  onChange={(e) =>
                    setFormData({ ...formData, homeService: e.target.checked })
                  }
                />
                <label className="checkbox-label" htmlFor="homeService">
                  Request Home Sample Collection
                  {formData.homeService && (
                    <span className="home-service-badge">+₹50</span>
                  )}
                </label>
              </div>

              {formData.homeService && (
                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label className="form-label">Home Address *</label>
                  <textarea
                    className="form-textarea"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Enter your complete address"
                    required
                  />
                </div>
              )}
            </div>

            <div className="form-section">
              <h2 className="section-title">Preferred Schedule</h2>

              <div className="form-group">
                <label className="form-label">Preferred Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.preferredDate}
                  onChange={(e) =>
                    setFormData({ ...formData, preferredDate: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Time *</label>
                <select
                  className="form-select"
                  value={formData.preferredTime}
                  onChange={(e) =>
                    setFormData({ ...formData, preferredTime: e.target.value })
                  }
                  required
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="cost-summary">
              <div className="cost-row">
                <span>Test Cost:</span>
                <span>₹{formData.cost}</span>
              </div>
              {formData.homeService && (
                <div className="cost-row">
                  <span>Home Service Charge:</span>
                  <span>₹50</span>
                </div>
              )}
              <div className="cost-total">
                <span>Total Amount:</span>
                <span>₹{totalCost}</span>
              </div>
            </div>

            <button type="submit" className="submit-btn">
              💳 Pay & Book Lab Test
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Book_Lab_Test;
