import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../../GlobalFiles/Sidebar";
import axios from "axios";
import { FaCalendarAlt, FaPills, FaFlask, FaFileAlt, FaChartLine, FaAmbulance, FaUserMd, FaHeart } from "react-icons/fa";
import Footer from "../../../../../Components/Footer";

const Patient_Dashboard = () => {
  const { data } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    activeMedications: 0,
    pendingLabTests: 0,
    totalReports: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextAppointment, setNextAppointment] = useState(null);

  useEffect(() => {
    if (data?.user?._id) {
      fetchDashboardData();
    }
  }, [data]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments
      const appointmentsRes = await axios.get(
        `http://127.0.0.1:3001/appointments/patient/${data.user._id}`
      );
      const appointments = appointmentsRes.data.data || [];
      const upcoming = appointments.filter(apt => 
        new Date(apt.date) >= new Date() && apt.status !== 'completed'
      );
      
      // Find next appointment
      if (upcoming.length > 0) {
        const sorted = upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
        setNextAppointment(sorted[0]);
      }
      
      // Fetch medications
      const medsRes = await axios.get(
        `http://127.0.0.1:3001/prescriptions/patient/${data.user._id}`
      );
      const medications = medsRes.data.prescriptions || [];
      const active = medications.filter(med => med.status === 'active');
      
      setStats({
        upcomingAppointments: upcoming.length,
        activeMedications: active.length,
        pendingLabTests: 0, // Can be enhanced
        totalReports: appointments.filter(apt => apt.status === 'completed').length
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Book Appointment",
      icon: <FaCalendarAlt />,
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      path: "/patient/book-appointment",
      description: "Schedule a visit with a doctor"
    },
    {
      title: "My Medications",
      icon: <FaPills />,
      color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      path: "/patient/medications",
      description: "View prescriptions & refills"
    },
    {
      title: "Lab Tests",
      icon: <FaFlask />,
      color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      path: "/patient/book-lab-test",
      description: "Book lab tests & view results"
    },
    {
      title: "My Reports",
      icon: <FaFileAlt />,
      color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      path: "/patient/reports",
      description: "Access medical reports"
    },
    {
      title: "Health Trends",
      icon: <FaChartLine />,
      color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      path: "/patient/health-trends",
      description: "Track your health metrics"
    },
    {
      title: "Emergency",
      icon: <FaAmbulance />,
      color: "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)",
      path: null, // No path - will show alert
      description: "Request ambulance service",
      comingSoon: true
    }
  ];

  const handleActionClick = (action) => {
    if (action.comingSoon) {
      alert("🚑 Emergency Service\n\nThis feature is coming soon! We're working on implementing a dedicated emergency ambulance request system.\n\nFor immediate emergencies, please call your local emergency number.");
      return;
    }
    if (action.path) {
      navigate(action.path);
    }
  };

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "patient") return <Navigate to="/dashboard" />;

  return (
    <>
      <style>{`
        .dashboard-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          position: relative;
          overflow-x: hidden;
        }

        .dashboard-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(102,126,234,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
          pointer-events: none;
        }

        .dashboard-content {
          flex: 1;
          margin-left: 80px;
          padding: 2rem 3rem;
          overflow-y: auto;
          position: relative;
          z-index: 1;
          transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .welcome-section {
          margin-bottom: 3rem;
        }

        .welcome-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .welcome-title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        .welcome-subtitle {
          font-size: 1.1rem;
          color: #64748b;
          font-weight: 500;
        }

        .health-score {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.95);
          padding: 1rem 1.5rem;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .health-score-icon {
          font-size: 2rem;
          color: #ef4444;
          animation: heartbeat 1.5s ease-in-out infinite;
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .health-score-text {
          display: flex;
          flex-direction: column;
        }

        .health-score-label {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 600;
        }

        .health-score-value {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
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
          background: var(--card-color);
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.15);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .stat-icon {
          font-size: 2.5rem;
          opacity: 0.2;
        }

        .stat-value {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 1rem;
          color: #64748b;
          font-weight: 600;
        }

        .quick-actions-section {
          margin-bottom: 3rem;
        }

        .section-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .action-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          border: 2px solid transparent;
        }

        .action-card.coming-soon {
          opacity: 0.8;
        }

        .action-card.coming-soon::after {
          content: 'Coming Soon';
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 0.3rem 0.8rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .action-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--action-color);
          opacity: 0.05;
          transition: opacity 0.3s ease;
        }

        .action-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          border-color: rgba(102, 126, 234, 0.3);
        }

        .action-card:hover::before {
          opacity: 0.1;
        }

        .action-icon-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: var(--action-color);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .action-icon {
          font-size: 1.8rem;
          color: white;
        }

        .action-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .action-description {
          font-size: 0.95rem;
          color: #64748b;
          line-height: 1.5;
        }

        .next-appointment-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
          margin-bottom: 3rem;
        }

        .appointment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .appointment-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .appointment-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .appointment-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .appointment-detail {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .detail-label {
          font-size: 0.85rem;
          opacity: 0.9;
        }

        .detail-value {
          font-size: 1.2rem;
          font-weight: 700;
        }

        .loading {
          text-align: center;
          padding: 4rem;
          font-size: 1.2rem;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .dashboard-content {
            padding: 1.5rem 1rem;
            margin-left: 0;
          }

          .welcome-title {
            font-size: 2rem;
          }

          .stats-grid,
          .quick-actions-grid {
            grid-template-columns: 1fr;
          }

          .welcome-header {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>

      <div className="dashboard-container">
        <Sidebar />

        <div className="dashboard-content">
          {/* Welcome Section */}
          <div className="welcome-section">
            <div className="welcome-header">
              <div>
                <h1 className="welcome-title">Welcome back, {data.user.name}! 👋</h1>
                <p className="welcome-subtitle">Here's your health overview for today</p>
              </div>
              <div className="health-score">
                <FaHeart className="health-score-icon" />
                <div className="health-score-text">
                  <span className="health-score-label">Health Score</span>
                  <span className="health-score-value">85/100</span>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading your dashboard...</div>
          ) : (
            <>
              {/* Next Appointment Card */}
              {nextAppointment && (
                <div className="next-appointment-card">
                  <div className="appointment-header">
                    <h2 className="appointment-title">📅 Next Appointment</h2>
                    <span className="appointment-badge">Upcoming</span>
                  </div>
                  <div className="appointment-details">
                    <div className="appointment-detail">
                      <span className="detail-label">Doctor</span>
                      <span className="detail-value">{nextAppointment.docname}</span>
                    </div>
                    <div className="appointment-detail">
                      <span className="detail-label">Department</span>
                      <span className="detail-value">{nextAppointment.department}</span>
                    </div>
                    <div className="appointment-detail">
                      <span className="detail-label">Date & Time</span>
                      <span className="detail-value">
                        {new Date(nextAppointment.date).toLocaleDateString()} at {nextAppointment.time}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card" style={{ '--card-color': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <div className="stat-header">
                    <div>
                      <div className="stat-value">{stats.upcomingAppointments}</div>
                      <div className="stat-label">Upcoming Appointments</div>
                    </div>
                    <FaCalendarAlt className="stat-icon" style={{ color: '#667eea' }} />
                  </div>
                </div>

                <div className="stat-card" style={{ '--card-color': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <div className="stat-header">
                    <div>
                      <div className="stat-value">{stats.activeMedications}</div>
                      <div className="stat-label">Active Medications</div>
                    </div>
                    <FaPills className="stat-icon" style={{ color: '#f5576c' }} />
                  </div>
                </div>

                <div className="stat-card" style={{ '--card-color': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <div className="stat-header">
                    <div>
                      <div className="stat-value">{stats.pendingLabTests}</div>
                      <div className="stat-label">Pending Lab Tests</div>
                    </div>
                    <FaFlask className="stat-icon" style={{ color: '#00f2fe' }} />
                  </div>
                </div>

                <div className="stat-card" style={{ '--card-color': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                  <div className="stat-header">
                    <div>
                      <div className="stat-value">{stats.totalReports}</div>
                      <div className="stat-label">Total Reports</div>
                    </div>
                    <FaFileAlt className="stat-icon" style={{ color: '#38f9d7' }} />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions-section">
                <h2 className="section-title">⚡ Quick Actions</h2>
                <div className="quick-actions-grid">
                  {quickActions.map((action, index) => (
                    <div
                      key={index}
                      className={`action-card ${action.comingSoon ? 'coming-soon' : ''}`}
                      style={{ '--action-color': action.color }}
                      onClick={() => handleActionClick(action)}
                    >
                      <div className="action-icon-wrapper" style={{ background: action.color }}>
                        <div className="action-icon">{action.icon}</div>
                      </div>
                      <h3 className="action-title">{action.title}</h3>
                      <p className="action-description">{action.description}</p>
                    </div>
                  ))}
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

export default Patient_Dashboard;
