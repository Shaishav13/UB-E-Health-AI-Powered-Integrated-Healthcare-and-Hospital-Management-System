import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../../GlobalFiles/Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { 
  FaUserMd, 
  FaUsers, 
  FaAmbulance, 
  FaFileAlt, 
  FaUserShield,
  FaFlask,
  FaCalendarCheck,
  FaChartLine,
  FaArrowUp,
  FaArrowDown
} from "react-icons/fa";
import Footer from "../../../../../Components/Footer";

const notify = (text) => toast(text);

const Admin_Dashboard = () => {
  const { data } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalReports: 0,
    totalAmbulances: 0,
    totalAdmins: 0,
    totalLabPersonnel: 0,
    recentAppointments: [],
    recentPatients: [],
    recentDoctors: []
  });

  useEffect(() => {
    if (data?.user) {
      fetchDashboardData();
    }
  }, [data]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data with proper error handling for each endpoint
      const fetchWithFallback = async (url, fallback = []) => {
        try {
          const response = await axios.get(url);
          return response.data;
        } catch (error) {
          console.log(`Endpoint ${url} not available, using fallback`);
          return fallback;
        }
      };

      // Fetch all data
      const [
        patients,
        doctors,
        appointments,
        labReports,
        ambulances,
        admins,
        labPersonnel
      ] = await Promise.all([
        fetchWithFallback("http://127.0.0.1:3001/patients"),
        fetchWithFallback("http://127.0.0.1:3001/doctors"),
        fetchWithFallback("http://127.0.0.1:3001/appointments"),
        fetchWithFallback("http://127.0.0.1:3001/lab-reports"),
        fetchWithFallback("http://127.0.0.1:3001/ambulance"),
        fetchWithFallback("http://127.0.0.1:3001/admin"),
        fetchWithFallback("http://127.0.0.1:3001/lab-personnel")
      ]);

      // Count reports from appointments (reports are linked to appointments)
      const reportsCount = appointments.filter(apt => apt.reportId).length;

      setStatistics({
        totalPatients: Array.isArray(patients) ? patients.length : 0,
        totalDoctors: Array.isArray(doctors) ? doctors.length : 0,
        totalAppointments: Array.isArray(appointments) ? appointments.length : 0,
        totalReports: reportsCount + (Array.isArray(labReports) ? labReports.length : 0),
        totalAmbulances: Array.isArray(ambulances) ? ambulances.length : 0,
        totalAdmins: Array.isArray(admins) ? admins.length : 0,
        totalLabPersonnel: Array.isArray(labPersonnel) ? labPersonnel.length : 0,
        recentAppointments: Array.isArray(appointments) ? appointments.slice(-5).reverse() : [],
        recentPatients: Array.isArray(patients) ? patients.slice(-5).reverse() : [],
        recentDoctors: Array.isArray(doctors) ? doctors.slice(-5).reverse() : []
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      notify("⚠️ Some dashboard data could not be loaded");
      setLoading(false);
    }
  };

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "admin") return <Navigate to="/dashboard" />;

  return (
    <>
      <ToastContainer />

      <style>{`
        .admin-dashboard-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          width: 100%;
          position: relative;
        }

        .admin-dashboard-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="admin-pattern" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="2" fill="rgba(11,107,97,0.05)"/><circle cx="10" cy="10" r="1" fill="rgba(19,161,137,0.05)"/><circle cx="50" cy="10" r="1" fill="rgba(19,161,137,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23admin-pattern)"/></svg>');
          pointer-events: none;
        }

        .admin-dashboard-content {
          flex: 1;
          padding: 2.5rem 3rem;
          overflow-y: auto;
          position: relative;
          z-index: 1;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 3rem;
          padding-bottom: 1.5rem;
        }

        .dashboard-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .dashboard-subtitle {
          font-size: 1.1rem;
          color: #64748b;
          font-weight: 500;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
          max-width: 1400px;
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
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
        }

        .stat-card.patients::before {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }

        .stat-card.doctors::before {
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
        }

        .stat-card.appointments::before {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }

        .stat-card.reports::before {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .stat-card.ambulances::before {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .stat-card.admins::before {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        }

        .stat-card.lab::before {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.15),
            0 1px 0 rgba(255, 255, 255, 0.3) inset;
        }

        .stat-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          color: white;
        }

        .stat-card.patients .stat-icon {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }

        .stat-card.doctors .stat-icon {
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
        }

        .stat-card.appointments .stat-icon {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }

        .stat-card.reports .stat-icon {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .stat-card.ambulances .stat-icon {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .stat-card.admins .stat-icon {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        }

        .stat-card.lab .stat-icon {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 0.375rem 0.75rem;
          border-radius: 8px;
        }

        .stat-trend.up {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
        }

        .stat-trend.down {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 800;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 1rem;
          color: #64748b;
          font-weight: 600;
        }

        .quick-actions {
          max-width: 1400px;
          margin: 0 auto 3rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .action-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
          cursor: pointer;
          text-align: center;
        }

        .action-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          border-color: #0b6b61;
        }

        .action-icon {
          width: 50px;
          height: 50px;
          margin: 0 auto 1rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: white;
        }

        .action-title {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .action-description {
          font-size: 0.85rem;
          color: #64748b;
        }

        .recent-activity {
          max-width: 1400px;
          margin: 0 auto;
        }

        .activity-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
        }

        .activity-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid rgba(11, 107, 97, 0.1);
        }

        .activity-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #374151;
        }

        .view-all-btn {
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-all-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(11, 107, 97, 0.3);
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-item {
          padding: 1rem;
          background: rgba(248, 250, 252, 0.8);
          border-radius: 12px;
          border-left: 3px solid #0b6b61;
          transition: all 0.3s ease;
        }

        .activity-item:hover {
          background: rgba(11, 107, 97, 0.05);
          transform: translateX(4px);
        }

        .activity-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .activity-item-name {
          font-weight: 600;
          color: #374151;
        }

        .activity-item-badge {
          padding: 0.25rem 0.75rem;
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
          color: white;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .activity-item-details {
          font-size: 0.85rem;
          color: #64748b;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 2rem;
          color: #64748b;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .loading {
          text-align: center;
          padding: 4rem;
          font-size: 1.2rem;
          color: #64748b;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .admin-dashboard-content {
            padding: 1.5rem 1rem;
          }

          .dashboard-title {
            font-size: 2rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .activity-grid {
            grid-template-columns: 1fr;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="admin-dashboard-container">
        <Sidebar />

        <div className="admin-dashboard-content">
          <div className="dashboard-header">
            <h1 className="dashboard-title">
              <FaChartLine /> Admin Dashboard
            </h1>
            <p className="dashboard-subtitle">
              Welcome back! Here's what's happening with your healthcare system today.
            </p>
          </div>

          {loading ? (
            <div className="loading">Loading dashboard data...</div>
          ) : (
            <>
              {/* Statistics Grid */}
              <div className="stats-grid">
                <div className="stat-card patients" onClick={() => navigate("/managepatients")}>
                  <div className="stat-card-header">
                    <div className="stat-icon">
                      <FaUsers />
                    </div>
                    <div className="stat-trend up">
                      <FaArrowUp /> 12%
                    </div>
                  </div>
                  <div className="stat-number">{statistics.totalPatients}</div>
                  <div className="stat-label">Total Patients</div>
                </div>

                <div className="stat-card doctors" onClick={() => navigate("/managedoctors")}>
                  <div className="stat-card-header">
                    <div className="stat-icon">
                      <FaUserMd />
                    </div>
                    <div className="stat-trend up">
                      <FaArrowUp /> 8%
                    </div>
                  </div>
                  <div className="stat-number">{statistics.totalDoctors}</div>
                  <div className="stat-label">Active Doctors</div>
                </div>

                <div className="stat-card appointments">
                  <div className="stat-card-header">
                    <div className="stat-icon">
                      <FaCalendarCheck />
                    </div>
                    <div className="stat-trend up">
                      <FaArrowUp /> 15%
                    </div>
                  </div>
                  <div className="stat-number">{statistics.totalAppointments}</div>
                  <div className="stat-label">Appointments</div>
                </div>

                <div className="stat-card reports">
                  <div className="stat-card-header">
                    <div className="stat-icon">
                      <FaFileAlt />
                    </div>
                    <div className="stat-trend up">
                      <FaArrowUp /> 10%
                    </div>
                  </div>
                  <div className="stat-number">{statistics.totalReports}</div>
                  <div className="stat-label">Medical Reports</div>
                </div>

                <div className="stat-card ambulances" onClick={() => navigate("/addambulance")}>
                  <div className="stat-card-header">
                    <div className="stat-icon">
                      <FaAmbulance />
                    </div>
                  </div>
                  <div className="stat-number">{statistics.totalAmbulances}</div>
                  <div className="stat-label">Ambulances</div>
                </div>

                <div className="stat-card lab" onClick={() => navigate("/viewlabpersonnel")}>
                  <div className="stat-card-header">
                    <div className="stat-icon">
                      <FaFlask />
                    </div>
                  </div>
                  <div className="stat-number">{statistics.totalLabPersonnel}</div>
                  <div className="stat-label">Lab Personnel</div>
                </div>

                <div className="stat-card admins">
                  <div className="stat-card-header">
                    <div className="stat-icon">
                      <FaUserShield />
                    </div>
                  </div>
                  <div className="stat-number">{statistics.totalAdmins}</div>
                  <div className="stat-label">System Admins</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <h2 className="section-title">
                  <FaChartLine /> Quick Actions
                </h2>
                <div className="actions-grid">
                  <div className="action-card" onClick={() => navigate("/addoctor")}>
                    <div className="action-icon">
                      <FaUserMd />
                    </div>
                    <div className="action-title">Add Doctor</div>
                    <div className="action-description">Register a new doctor to the system</div>
                  </div>

                  <div className="action-card" onClick={() => navigate("/addlabpersonnel")}>
                    <div className="action-icon">
                      <FaFlask />
                    </div>
                    <div className="action-title">Add Lab Personnel</div>
                    <div className="action-description">Add new laboratory staff member</div>
                  </div>

                  <div className="action-card" onClick={() => navigate("/addambulance")}>
                    <div className="action-icon">
                      <FaAmbulance />
                    </div>
                    <div className="action-title">Add Ambulance</div>
                    <div className="action-description">Register new ambulance service</div>
                  </div>

                  <div className="action-card" onClick={() => navigate("/managedoctors")}>
                    <div className="action-icon">
                      <FaUserMd />
                    </div>
                    <div className="action-title">Manage Doctors</div>
                    <div className="action-description">View and manage doctor accounts</div>
                  </div>

                  <div className="action-card" onClick={() => navigate("/managepatients")}>
                    <div className="action-icon">
                      <FaUsers />
                    </div>
                    <div className="action-title">Manage Patients</div>
                    <div className="action-description">View and manage patient records</div>
                  </div>

                  <div className="action-card" onClick={() => navigate("/viewlabpersonnel")}>
                    <div className="action-icon">
                      <FaFlask />
                    </div>
                    <div className="action-title">View Lab Personnel</div>
                    <div className="action-description">Manage laboratory staff</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="recent-activity">
                <h2 className="section-title">
                  <FaChartLine /> Recent Activity
                </h2>
                <div className="activity-grid">
                  {/* Recent Patients */}
                  <div className="activity-card">
                    <div className="activity-header">
                      <div className="activity-title">Recent Patients</div>
                      <button className="view-all-btn" onClick={() => navigate("/managepatients")}>
                        View All
                      </button>
                    </div>
                    <div className="activity-list">
                      {statistics.recentPatients.length > 0 ? (
                        statistics.recentPatients.map((patient, index) => (
                          <div key={index} className="activity-item">
                            <div className="activity-item-header">
                              <div className="activity-item-name">{patient.name}</div>
                              <div className="activity-item-badge">New</div>
                            </div>
                            <div className="activity-item-details">
                              {patient.email} • {patient.phoneNum}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-state">
                          <div className="empty-icon">👥</div>
                          <div>No recent patients</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Doctors */}
                  <div className="activity-card">
                    <div className="activity-header">
                      <div className="activity-title">Recent Doctors</div>
                      <button className="view-all-btn" onClick={() => navigate("/managedoctors")}>
                        View All
                      </button>
                    </div>
                    <div className="activity-list">
                      {statistics.recentDoctors.length > 0 ? (
                        statistics.recentDoctors.map((doctor, index) => (
                          <div key={index} className="activity-item">
                            <div className="activity-item-header">
                              <div className="activity-item-name">Dr. {doctor.name}</div>
                              <div className="activity-item-badge">{doctor.department}</div>
                            </div>
                            <div className="activity-item-details">
                              {doctor.email} • ₹{doctor.fees} consultation
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-state">
                          <div className="empty-icon">👨‍⚕️</div>
                          <div>No recent doctors</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Admin_Dashboard;
