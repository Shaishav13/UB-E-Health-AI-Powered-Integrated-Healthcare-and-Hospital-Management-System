import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Sidebar from "../../GlobalFiles/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import ReceiptGenerator from "../../../../../Components/ReceiptGenerator";
import { convertTo12Hour } from "../../../../../utils/timeFormat";

const notify = (text) => toast(text);

const My_Appointments = () => {
  const { data } = useSelector((store) => store.auth);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (data?.user?._id) {
      fetchAppointments();
    }
  }, [data]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://127.0.0.1:3001/appointments/patient/${data.user._id}/all`
      );
      console.log("Appointments:", response.data);
      setAppointments(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      notify("Failed to load appointments");
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === "upcoming") return apt.status === "confirmed" || apt.status === "paid";
    if (filter === "completed") return apt.status === "completed";
    if (filter === "cancelled") return apt.status === "cancelled";
    return true;
  });

  const upcomingCount = appointments.filter(a => a.status === "confirmed" || a.status === "paid").length;
  const completedCount = appointments.filter(a => a.status === "completed").length;

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "patient") return <Navigate to="/dashboard" />;

  return (
    <>
      <ToastContainer />

      <style>{`
        .appointments-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          width: 100%;
        }

        .appointments-content {
          flex: 1;
          padding: 2.5rem 3rem;
          overflow-y: auto;
        }

        .appointments-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .appointments-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }

        .stat-box {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          text-align: center;
          transition: 0.3s ease;
        }

        .stat-box:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }

        .stat-number {
          font-size: 2.2rem;
          font-weight: 700;
          color: #0b6b61;
          margin-bottom: 0.3rem;
        }

        .stat-label {
          font-size: 0.95rem;
          color: #64748b;
          font-weight: 500;
        }

        .filter-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 0.7rem 1.5rem;
          border: 2px solid #e2e8f0;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          color: #64748b;
          transition: all 0.3s ease;
        }

        .filter-btn:hover {
          border-color: #0b6b61;
          color: #0b6b61;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #0b6b61, #139b86);
          color: white;
          border-color: transparent;
        }

        .appointments-list {
          max-width: 1200px;
          margin: 0 auto;
        }

        .appointment-card {
          background: white;
          padding: 1.8rem;
          border-radius: 16px;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transition: 0.3s ease;
          border-left: 4px solid #0b6b61;
        }

        .appointment-card:hover {
          transform: translateX(4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }

        .appointment-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .doctor-info h3 {
          font-size: 1.3rem;
          color: #1e293b;
          margin-bottom: 0.3rem;
          font-weight: 700;
        }

        .doctor-info p {
          color: #64748b;
          font-size: 0.95rem;
        }

        .token-badge {
          background: linear-gradient(135deg, #0b6b61, #139b86);
          color: white;
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 1.1rem;
          text-align: center;
        }

        .token-label {
          font-size: 0.75rem;
          opacity: 0.9;
          margin-bottom: 0.2rem;
        }

        .appointment-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.2rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 10px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
        }

        .detail-label {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 0.3rem;
          font-weight: 500;
        }

        .detail-value {
          font-size: 1rem;
          color: #1e293b;
          font-weight: 600;
        }

        .status-badge {
          display: inline-block;
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-confirmed {
          background: #d1fae5;
          color: #065f46;
        }

        .status-completed {
          background: #e0e7ff;
          color: #3730a3;
        }

        .status-cancelled {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .appointment-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #64748b;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #1e293b;
        }

        @media (max-width: 768px) {
          .appointments-content {
            padding: 1.5rem;
          }

          .appointment-header {
            flex-direction: column;
          }

          .appointment-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="appointments-container">
        <Sidebar />

        <div className="appointments-content">
          <div className="appointments-header">
            <h1 className="appointments-title">📅 My Appointments</h1>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
              View and manage your medical appointments
            </p>
          </div>

          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-number">{appointments.length}</div>
              <div className="stat-label">Total Appointments</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">{upcomingCount}</div>
              <div className="stat-label">Upcoming</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">{completedCount}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>

          <div className="filter-tabs">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}
              onClick={() => setFilter("upcoming")}
            >
              Upcoming
            </button>
            <button
              className={`filter-btn ${filter === "completed" ? "active" : ""}`}
              onClick={() => setFilter("completed")}
            >
              Completed
            </button>
            <button
              className={`filter-btn ${filter === "cancelled" ? "active" : ""}`}
              onClick={() => setFilter("cancelled")}
            >
              Cancelled
            </button>
          </div>

          <div className="appointments-list">
            {loading ? (
              <div className="empty-state">
                <h3>Loading appointments...</h3>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="empty-state">
                <h3>No appointments found</h3>
                <p>You don't have any {filter !== "all" ? filter : ""} appointments yet.</p>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div key={appointment._id} className="appointment-card">
                  <div className="appointment-header">
                    <div className="doctor-info">
                      <h3>Dr. {appointment.docname || "N/A"}</h3>
                      <p>{appointment.department || "General"}</p>
                    </div>
                    {appointment.tokenId && (
                      <div className="token-badge">
                        <div className="token-label">Token</div>
                        <div>{appointment.tokenId}</div>
                        <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                          Queue: #{appointment.queueNumber}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="appointment-details">
                    <div className="detail-item">
                      <span className="detail-label">Date</span>
                      <span className="detail-value">
                        {new Date(appointment.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Time</span>
                      <span className="detail-value">{convertTo12Hour(appointment.time)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Fee Paid</span>
                      <span className="detail-value">₹{appointment.amount || "0"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status</span>
                      <span className={`status-badge status-${appointment.status}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>

                  {appointment.reason && (
                    <div style={{ marginBottom: '1rem', padding: '0.8rem', background: '#f8fafc', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Reason: </span>
                      <span style={{ color: '#1e293b' }}>{appointment.reason}</span>
                    </div>
                  )}

                  <div className="appointment-actions">
                    {appointment.tokenId && appointment.payment_id && (
                      <ReceiptGenerator
                        appointmentData={appointment}
                        patientData={data.user}
                        buttonText="Download Receipt"
                      />
                    )}
                    {!appointment.tokenId && (
                      <span style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        Receipt not available for this appointment
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default My_Appointments;
