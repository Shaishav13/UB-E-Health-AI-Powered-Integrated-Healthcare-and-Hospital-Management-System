import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPaymentHistory, requestRefund } from "../../../../../Redux/Payments/action";
import Sidebar from "../../GlobalFiles/Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaDownload, FaReceipt, FaFilter, FaUndo, FaCheckCircle, FaClock, FaTimes } from "react-icons/fa";
import InvoiceGenerator from "../../../../../Components/InvoiceGenerator";

const notify = (text) => toast(text);

const Payment_History = () => {
  const dispatch = useDispatch();
  const paymentsState = useSelector((state) => state.payments);
  const { paymentHistory = [], loading = false } = paymentsState || {};
  
  // Get patient data from Redux store
  const patientData = useSelector((state) => state.patient?.patient);
  
  console.log("Payments Redux State:", paymentsState);
  console.log("Payment History:", paymentHistory);
  
  const [filters, setFilters] = useState({
    status: "",
    paymentType: "",
    startDate: "",
    endDate: ""
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    try {
      console.log("Loading payment history with filters:", filters);
      const result = await dispatch(getPaymentHistory(filters));
      console.log("Payment history result:", result);
      
      if (result && result.success) {
        console.log(`✅ Loaded ${result.count} payments`);
      }
    } catch (error) {
      console.error("Payment history error:", error);
      console.error("Error response:", error.response?.data);
      notify(`Failed to load payment history: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const applyFilters = () => {
    loadPaymentHistory();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      paymentType: "",
      startDate: "",
      endDate: ""
    });
    dispatch(getPaymentHistory({}));
  };

  const handleRefundRequest = async () => {
    if (!refundReason.trim()) {
      notify("Please provide a reason for refund");
      return;
    }

    try {
      await dispatch(requestRefund(selectedPayment.paymentId, {
        reason: refundReason
      }));
      
      notify("Refund request submitted successfully");
      setShowRefundModal(false);
      setRefundReason("");
      loadPaymentHistory();
    } catch (error) {
      notify("Failed to process refund request");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <FaCheckCircle style={{ color: "#10b981" }} />;
      case "pending":
      case "processing":
        return <FaClock style={{ color: "#f59e0b" }} />;
      case "failed":
        return <FaTimes style={{ color: "#ef4444" }} />;
      case "refunded":
      case "partially_refunded":
        return <FaUndo style={{ color: "#6366f1" }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#10b981";
      case "pending":
      case "processing":
        return "#f59e0b";
      case "failed":
        return "#ef4444";
      case "refunded":
      case "partially_refunded":
        return "#6366f1";
      default:
        return "#64748b";
    }
  };

  const getPaymentTypeLabel = (type) => {
    const labels = {
      appointment: "Appointment",
      lab_test: "Lab Test",
      prescription: "Prescription",
      other: "Other"
    };
    return labels[type] || type;
  };

  return (
    <>
      <ToastContainer />
      
      <style>{`
        .payment-history-container {
          display: flex;
          min-height: 100vh;
        }

        .payment-history-wrapper {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
          margin-left: 80px;
          transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .payment-history-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 2rem;
          border-radius: 20px;
          margin-bottom: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .payment-history-header h1 {
          font-size: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .payment-history-header p {
          color: #64748b;
          font-size: 1rem;
        }

        .filter-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 1.5rem;
          border-radius: 16px;
          margin-bottom: 2rem;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
        }

        .filter-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          padding: 0.5rem 0;
        }

        .filter-toggle h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #1e293b;
          font-size: 1.1rem;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .filter-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #475569;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .filter-group select,
        .filter-group input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .filter-group select:focus,
        .filter-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .filter-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .filter-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .filter-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .filter-btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }

        .filter-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .payments-grid {
          display: grid;
          gap: 1.5rem;
        }

        .payment-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          border-left: 4px solid transparent;
        }

        .payment-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
        }

        .payment-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .payment-info h3 {
          font-size: 1.2rem;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        .payment-id {
          color: #64748b;
          font-size: 0.85rem;
          font-family: monospace;
        }

        .payment-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .payment-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin: 1rem 0;
          padding: 1rem 0;
          border-top: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
        }

        .detail-item label {
          display: block;
          color: #64748b;
          font-size: 0.85rem;
          margin-bottom: 0.25rem;
        }

        .detail-item span {
          color: #1e293b;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .payment-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .action-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .action-btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .empty-state {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 4rem 2rem;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .empty-state-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          color: #1e293b;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #64748b;
          font-size: 1rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 20px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-header h2 {
          color: #1e293b;
          font-size: 1.5rem;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #64748b;
          transition: color 0.3s ease;
        }

        .modal-close:hover {
          color: #1e293b;
        }

        .modal-body textarea {
          width: 100%;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          resize: vertical;
          min-height: 120px;
          font-family: inherit;
        }

        .modal-body textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .modal-btn {
          flex: 1;
          padding: 0.875rem;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .modal-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .modal-btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }

        .modal-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        @media (max-width: 768px) {
          .payment-history-wrapper {
            padding: 1rem;
            margin-left: 0;
          }

          .filter-grid {
            grid-template-columns: 1fr;
          }

          .payment-details {
            grid-template-columns: 1fr;
          }

          .payment-actions {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 991px) and (min-width: 769px) {
          .payment-history-wrapper {
            margin-left: 70px;
          }
        }
      `}</style>

      <div className="payment-history-container">
        <Sidebar />

        <div className="payment-history-wrapper">
          <div className="payment-history-header">
            <h1>💳 Payment History</h1>
            <p>View and manage all your payment transactions</p>
          </div>

          <div className="filter-section">
            <div className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
              <h3>
                <FaFilter /> Filters
              </h3>
              <span>{showFilters ? "▲" : "▼"}</span>
            </div>

            {showFilters && (
              <>
                <div className="filter-grid">
                  <div className="filter-group">
                    <label>Status</label>
                    <select name="status" value={filters.status} onChange={handleFilterChange}>
                      <option value="">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Payment Type</label>
                    <select name="paymentType" value={filters.paymentType} onChange={handleFilterChange}>
                      <option value="">All Types</option>
                      <option value="appointment">Appointment</option>
                      <option value="lab_test">Lab Test</option>
                      <option value="prescription">Prescription</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                    />
                  </div>

                  <div className="filter-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>

                <div className="filter-actions">
                  <button className="filter-btn filter-btn-primary" onClick={applyFilters}>
                    Apply Filters
                  </button>
                  <button className="filter-btn filter-btn-secondary" onClick={clearFilters}>
                    Clear Filters
                  </button>
                </div>
              </>
            )}
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <h3>Loading payments...</h3>
            </div>
          ) : paymentHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <h3>No payments found</h3>
              <p>Your payment history will appear here</p>
            </div>
          ) : (
            <div className="payments-grid">
              {paymentHistory.map((payment) => (
                <div
                  key={payment._id}
                  className="payment-card"
                  style={{ borderLeftColor: getStatusColor(payment.status) }}
                >
                  <div className="payment-card-header">
                    <div className="payment-info">
                      <h3>{getPaymentTypeLabel(payment.paymentType)}</h3>
                      <div className="payment-id">{payment.paymentId}</div>
                    </div>
                    <div
                      className="payment-status"
                      style={{
                        background: `${getStatusColor(payment.status)}15`,
                        color: getStatusColor(payment.status)
                      }}
                    >
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </div>
                  </div>

                  <div className="payment-details">
                    <div className="detail-item">
                      <label>Amount</label>
                      <span>₹{payment.amount}</span>
                    </div>
                    <div className="detail-item">
                      <label>Date</label>
                      <span>{new Date(payment.transactionDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <label>Method</label>
                      <span style={{ textTransform: "capitalize" }}>{payment.paymentMethod}</span>
                    </div>
                    {payment.invoiceNumber && (
                      <div className="detail-item">
                        <label>Invoice</label>
                        <span>{payment.invoiceNumber}</span>
                      </div>
                    )}
                  </div>

                  {payment.description && (
                    <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0.5rem 0" }}>
                      {payment.description}
                    </p>
                  )}

                  <div className="payment-actions">
                    {payment.invoiceGenerated && (
                      <InvoiceGenerator payment={payment} patientData={patientData} />
                    )}
                    
                    {payment.status === "completed" && payment.refundAmount === 0 && (
                      <button
                        className="action-btn action-btn-secondary"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowRefundModal(true);
                        }}
                      >
                        <FaUndo /> Request Refund
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Refund</h2>
              <button className="modal-close" onClick={() => setShowRefundModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <label style={{ display: "block", marginBottom: "0.5rem", color: "#475569", fontWeight: 600 }}>
                Reason for Refund
              </label>
              <textarea
                placeholder="Please provide a reason for requesting a refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={() => setShowRefundModal(false)}>
                Cancel
              </button>
              <button className="modal-btn modal-btn-primary" onClick={handleRefundRequest}>
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Payment_History;
