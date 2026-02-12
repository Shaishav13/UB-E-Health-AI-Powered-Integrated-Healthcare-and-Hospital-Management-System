import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Sidebar from "../../GlobalFiles/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const notify = (text) => toast(text);

const My_Medications = () => {
  const { data } = useSelector((store) => store.auth);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, completed

  useEffect(() => {
    if (data?.user?._id) {
      fetchMedications();
    }
  }, [data]);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `http://127.0.0.1:3001/prescriptions/${data.user._id}`
      );
      console.log("Medications response:", response.data);
      setMedications(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching medications:", error);
      console.error("Error response:", error.response?.data);
      const errorMsg = error.response?.data?.details || error.response?.data?.error || "Failed to load medications";
      notify(`❌ ${errorMsg}`);
      setLoading(false);
    }
  };

  const markAsCompleted = async (medicineId) => {
    try {
      const response = await axios.patch(
        `http://127.0.0.1:3001/prescriptions/complete/${medicineId}`
      );
      console.log("Mark completed response:", response.data);
      notify("✅ Medication marked as completed");
      fetchMedications();
    } catch (error) {
      console.error("Error marking medication:", error);
      console.error("Error response:", error.response?.data);
      const errorMsg = error.response?.data?.details || error.response?.data?.error || "Failed to update medication";
      notify(`❌ ${errorMsg}`);
    }
  };

  const clearCompleted = async () => {
    try {
      await axios.delete(
        `http://127.0.0.1:3001/prescriptions/clear-completed/${data.user._id}`
      );
      notify("🗑️ Completed medications cleared");
      fetchMedications();
    } catch (error) {
      console.error("Error clearing medications:", error);
      notify("Failed to clear medications");
    }
  };

  const filteredMedications = medications.filter((med) => {
    if (filter === "active") return !med.completed;
    if (filter === "completed") return med.completed;
    return true;
  });

  const activeMedsCount = medications.filter((m) => !m.completed).length;
  const completedMedsCount = medications.filter((m) => m.completed).length;

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "patient") return <Navigate to="/dashboard" />;

  return (
    <>
      <ToastContainer />

      <style>{`
        .medications-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          width: 100%;
          position: relative;
        }

        .medications-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="medication-pattern" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="2" fill="rgba(102,126,234,0.05)"/><circle cx="10" cy="10" r="1" fill="rgba(52,211,153,0.05)"/><circle cx="50" cy="10" r="1" fill="rgba(52,211,153,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23medication-pattern)"/></svg>');
          pointer-events: none;
        }

        .medications-content {
          flex: 1;
          padding: 2.5rem 3rem;
          overflow-y: auto;
          position: relative;
          z-index: 1;
        }

        .medications-header {
          text-align: center;
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
        }

        .medications-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .medications-subtitle {
          font-size: 1.1rem;
          color: #64748b;
          font-weight: 500;
        }

        .stats-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-bottom: 2.5rem;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 1px 0 rgba(255, 255, 255, 0.2) inset;
          border: 1px solid rgba(255, 255, 255, 0.2);
          text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
        }

        .stat-card.total::before {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .stat-card.active::before {
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
        }

        .stat-card.completed::before {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.15),
            0 1px 0 rgba(255, 255, 255, 0.3) inset;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 1rem;
          color: #64748b;
          font-weight: 600;
        }

        .stat-card.total .stat-number { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .stat-card.active .stat-number { 
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .stat-card.completed .stat-number { 
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .filter-container {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 0.75rem 1.5rem;
          border: 2px solid rgba(102, 126, 234, 0.2);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: #374151;
        }

        .filter-btn:hover {
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .clear-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .clear-btn:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
        }

        .clear-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .medications-list {
          max-width: 1200px;
          margin: 0 auto;
        }

        .medication-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 1px 0 rgba(255, 255, 255, 0.2) inset;
          border: 1px solid rgba(255, 255, 255, 0.2);
          margin-bottom: 1.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .medication-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
        }

        .medication-card.completed {
          opacity: 0.7;
        }

        .medication-card.completed::before {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
        }

        .medication-card:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.15),
            0 1px 0 rgba(255, 255, 255, 0.3) inset;
        }

        .medication-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .medication-name {
          font-size: 1.4rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .medication-card.completed .medication-name {
          color: #9ca3af;
          text-decoration: line-through;
        }

        .report-info {
          background: rgba(102, 126, 234, 0.1);
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.9rem;
          color: #64748b;
          margin-bottom: 0.5rem;
          border-left: 3px solid #667eea;
        }

        .report-info strong {
          color: #374151;
        }

        .medication-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .detail-item {
          background: rgba(248, 250, 252, 0.8);
          padding: 1rem;
          border-radius: 12px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .detail-item:hover {
          background: rgba(102, 126, 234, 0.05);
          transform: translateY(-2px);
        }

        .detail-label {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 0.5rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .detail-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #374151;
        }

        .medication-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .action-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .complete-btn {
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
          color: white;
        }

        .complete-btn:hover {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(52, 211, 153, 0.4);
        }

        .completed-badge {
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
          color: white;
          padding: 0.75rem 1.25rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(52, 211, 153, 0.3);
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 1px 0 rgba(255, 255, 255, 0.2) inset;
          border: 1px solid rgba(255, 255, 255, 0.2);
          max-width: 600px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }

        .empty-state::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.7;
        }

        .empty-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .empty-text {
          font-size: 1rem;
          color: #64748b;
          font-weight: 500;
        }

        .loading {
          text-align: center;
          padding: 4rem;
          font-size: 1.2rem;
          color: #64748b;
          font-weight: 500;
        }

        /* Table View Styles */
        .table-container {
          max-width: 1400px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 1px 0 rgba(255, 255, 255, 0.2) inset;
          border: 1px solid rgba(255, 255, 255, 0.2);
          overflow: hidden;
          position: relative;
        }

        .table-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .medications-table {
          width: 100%;
          border-collapse: collapse;
        }

        .medications-table thead {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .medications-table th {
          color: white;
          font-weight: 700;
          padding: 1.2rem 1rem;
          text-align: left;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .medications-table tbody tr {
          border-bottom: 1px solid rgba(102, 126, 234, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .medications-table tbody tr:hover {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(52, 211, 153, 0.05) 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
        }

        .medications-table tbody tr:nth-child(even) {
          background: rgba(248, 250, 252, 0.5);
        }

        .medications-table tbody tr:nth-child(odd) {
          background: rgba(255, 255, 255, 0.8);
        }

        .medications-table tbody tr.completed {
          opacity: 0.6;
        }

        .medications-table tbody tr.completed td {
          text-decoration: line-through;
          color: #9ca3af;
        }

        .medications-table td {
          padding: 1.2rem 1rem;
          font-weight: 500;
          color: #374151;
          font-size: 0.95rem;
        }

        .table-actions {
          display: flex;
          gap: 0.5rem;
        }

        .table-action-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .table-complete-btn {
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
          color: white;
        }

        .table-complete-btn:hover {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(52, 211, 153, 0.3);
        }

        .view-toggle {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }

        .view-btn {
          padding: 0.75rem 1.5rem;
          border: 2px solid rgba(102, 126, 234, 0.2);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: #374151;
        }

        .view-btn:hover {
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-2px);
        }

        .view-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        @media (max-width: 768px) {
          .medications-content {
            padding: 1.5rem 1rem;
          }

          .stats-container {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .medication-details {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .filter-container {
            flex-direction: column;
            align-items: center;
          }

          .medication-header {
            flex-direction: column;
            gap: 1rem;
          }

          .medications-title {
            font-size: 2rem;
          }

          .medications-table {
            font-size: 0.85rem;
          }

          .medications-table th,
          .medications-table td {
            padding: 0.75rem 0.5rem;
          }
        }
      `}</style>

      <div className="medications-container">
        <Sidebar />

        <div className="medications-content">
          <div className="medications-header">
            <h1 className="medications-title">💊 My Medications</h1>
            <p className="medications-subtitle">
              Track and manage your prescribed medications
            </p>
          </div>

          {loading ? (
            <div className="loading">Loading medications...</div>
          ) : (
            <>
              <div className="stats-container">
                <div className="stat-card total">
                  <div className="stat-number">{medications.length}</div>
                  <div className="stat-label">Total Medications</div>
                </div>
                <div className="stat-card active">
                  <div className="stat-number">{activeMedsCount}</div>
                  <div className="stat-label">Active</div>
                </div>
                <div className="stat-card completed">
                  <div className="stat-number">{completedMedsCount}</div>
                  <div className="stat-label">Completed</div>
                </div>
              </div>

              <div className="filter-container">
                <button
                  className={`filter-btn ${filter === "all" ? "active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  All Medications
                </button>
                <button
                  className={`filter-btn ${filter === "active" ? "active" : ""}`}
                  onClick={() => setFilter("active")}
                >
                  Active Only
                </button>
                <button
                  className={`filter-btn ${filter === "completed" ? "active" : ""}`}
                  onClick={() => setFilter("completed")}
                >
                  Completed
                </button>
                <button
                  className="clear-btn"
                  onClick={clearCompleted}
                  disabled={completedMedsCount === 0}
                >
                  🗑️ Clear Completed
                </button>
              </div>

              <div className="medications-list">
                {filteredMedications.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      {filter === "all" ? "💊" : filter === "active" ? "✨" : "✅"}
                    </div>
                    <div className="empty-title">
                      {filter === "all"
                        ? "No Medications Yet"
                        : filter === "active"
                        ? "No Active Medications"
                        : "No Completed Medications"}
                    </div>
                    <div className="empty-text">
                      {filter === "all"
                        ? "Your prescribed medications will appear here"
                        : filter === "active"
                        ? "All medications have been completed"
                        : "Mark medications as completed to see them here"}
                    </div>
                  </div>
                ) : (
                  filteredMedications.map((med) => (
                    <div
                      key={med.id}
                      className={`medication-card ${med.completed ? "completed" : ""}`}
                    >
                      <div className="medication-header">
                        <div>
                          <div className="medication-name">💊 {med.name}</div>
                          <div className="report-info">
                            📋 From Report: <strong>{med.disease || "N/A"}</strong> 
                            {med.date && ` (${med.date})`}
                          </div>
                        </div>
                        {med.completed && (
                          <div className="completed-badge">
                            ✅ Completed
                          </div>
                        )}
                      </div>

                      <div className="medication-details">
                        <div className="detail-item">
                          <div className="detail-label">💊 Dosage</div>
                          <div className="detail-value">{med.dosage || "N/A"}</div>
                        </div>
                        <div className="detail-item">
                          <div className="detail-label">🕐 Frequency</div>
                          <div className="detail-value">{med.frequency || "N/A"}</div>
                        </div>
                        <div className="detail-item">
                          <div className="detail-label">📅 Duration</div>
                          <div className="detail-value">{med.duration} days</div>
                        </div>
                      </div>

                      {!med.completed && (
                        <div className="medication-actions">
                          <button
                            className="action-btn complete-btn"
                            onClick={() => markAsCompleted(med.id)}
                          >
                            ✅ Mark as Completed
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default My_Medications;
