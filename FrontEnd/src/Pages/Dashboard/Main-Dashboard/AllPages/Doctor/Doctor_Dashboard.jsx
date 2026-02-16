import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../../GlobalFiles/Sidebar";
import axios from "axios";
import { 
  FaCalendarCheck, FaFileAlt, FaPills, FaUsers, 
  FaClock, FaChartLine, FaRobot, FaSearch,
  FaUserMd, FaStethoscope, FaHeartbeat
} from "react-icons/fa";

const Doctor_Dashboard = () => {
  const { data } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    reportsGenerated: 0,
    prescriptionsIssued: 0
  });
  
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [nextPatient, setNextPatient] = useState(null);
  const [loading, setLoading] = useState(true);

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
        `http://127.0.0.1:3001/appointments/doctor/${data.user._id}`
      );
      const appointments = appointmentsRes.data.data || [];
      
      // Filter today's appointments
      const today = new Date().toDateString();
      const todayAppts = appointments.filter(apt => 
        new Date(apt.date).toDateString() === today
      );
      
      // Find next patient
      const now = new Date();
      const upcoming = todayAppts
        .filter(apt => {
          const aptTime = new Date(`${apt.date} ${apt.time}`);
          return aptTime > now && apt.status !== 'completed';
        })
        .sort((a, b) => {
          const timeA = new Date(`${a.date} ${a.time}`);
          const timeB = new Date(`${b.date} ${b.time}`);
          return timeA - timeB;
        });
      
      if (upcoming.length > 0) {
        setNextPatient(upcoming[0]);
      }
      
      setTodaySchedule(todayAppts);
      
      // Fetch reports
      const reportsRes = await axios.get(
        `http://127.0.0.1:3001/reports/doctor/${data.user._id}`
      );
      const reports = reportsRes.data.data || [];
      
      // Fetch prescriptions
      const prescriptionsRes = await axios.get(
        `http://127.0.0.1:3001/prescriptions/doctor/${data.user._id}`
      );
      const prescriptions = prescriptionsRes.data.prescriptions || [];
      
      // Get unique patients
      const uniquePatients = new Set(appointments.map(apt => apt.patientId?._id || apt.patientId));
      
      setStats({
        todayAppointments: todayAppts.length,
        totalPatients: uniquePatients.size,
        reportsGenerated: reports.length,
        prescriptionsIssued: prescriptions.length
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Check Appointments",
      icon: <FaCalendarCheck />,
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      path: "/checkappointment",
      description: "View & manage appointments",
      badge: stats.todayAppointments
    },
    {
      title: "Create Report",
      icon: <FaFileAlt />,
      color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      path: "/createreport",
      description: "Generate patient report"
    },
    {
      title: "All Reports",
      icon: <FaFileAlt />,
      color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      path: "/reports",
      description: "View medical reports"
    },
    {
      title: "Patient Search",
      icon: <FaSearch />,
      color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      path: "/patientdetails",
      description: "Search patient records"
    },
    {
      title: "AI Assistant",
      icon: <FaRobot />,
      color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      path: null,
      description: "Diagnosis helper",
      comingSoon: true
    },
    {
      title: "Analytics",
      icon: <FaChartLine />,
      color: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
      path: null,
      description: "Performance metrics",
      comingSoon: true
    }
  ];

  const handleActionClick = (action) => {
    if (action.comingSoon) {
      alert(`${action.title}\n\nThis feature is coming soon! We're working on implementing ${action.description.toLowerCase()}.`);
      return;
    }
    if (action.path) {
      navigate(action.path);
    }
  };

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "doctor") return <Navigate to="/dashboard" />;

  return (
    <>
      <style>{`
        .doctor-dashboard-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          position: relative;
          overflow-x: hidden;
        }

        .doctor-dashboard-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="doctor-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(102,126,234,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23doctor-grid)"/></svg>');
          pointer-events: none;
        }

        .doctor-dashboard-content {
          flex: 1;
          margin-left: 80px;
          padding: 2rem 3rem;
          overflow-y: auto;
          position: relative;
          z-index: 1;
          transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .doctor-welcome-section {
          margin-bottom: 3rem;
        }

        .doctor-welcome-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .doctor-welcome-title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        .doctor-welcome-subtitle {
          font-size: 1.1rem;
          color: #64748b;
          font-weight: 500;
        }

        .doctor-badge {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.95);
          padding: 1rem 1.5rem;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .doctor-badge-icon {
          font-size: 2rem;
          color: #667eea;
        }

        .doctor-badge-text {
          display: flex;
          flex-direction: column;
        }

        .doctor-badge-label {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 600;
        }

        .doctor-badge-value {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .doctor-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .doctor-stat-card {
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

        .doctor-stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--card-color);
        }

        .doctor-stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.15);
        }

        .doctor-stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .doctor-stat-icon {
          font-size: 2.5rem;
          opacity: 0.2;
        }

        .doctor-stat-value {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .doctor-stat-label {
          font-size: 1rem;
          color: #64748b;
          font-weight: 600;
        }

        .next-patient-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
          margin-bottom: 3rem;
          position: relative;
          overflow: hidden;
        }

        .next-patient-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 300px;
          height: 300px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }

        .next-patient-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .next-patient-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pulse-icon {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .next-patient-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .next-patient-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .next-patient-detail {
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

        .today-schedule-section {
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

        .schedule-timeline {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .schedule-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.5rem;
          border-left: 4px solid #667eea;
          margin-bottom: 1rem;
          background: rgba(248, 250, 252, 0.8);
          border-radius: 12px;
          transition: all 0.3s ease;
          position: relative;
        }

        .schedule-item:hover {
          background: rgba(102, 126, 234, 0.05);
          transform: translateX(8px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
        }

        .schedule-item.completed {
          opacity: 0.6;
          border-left-color: #10b981;
        }

        .schedule-time {
          font-size: 1.1rem;
          font-weight: 700;
          color: #667eea;
          min-width: 80px;
        }

        .schedule-info {
          flex: 1;
        }

        .schedule-patient {
          font-size: 1.2rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 0.3rem;
        }

        .schedule-department {
          font-size: 0.95rem;
          color: #64748b;
          font-weight: 500;
        }

        .schedule-status {
          padding: 0.4rem 0.8rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .schedule-status.pending {
          background: rgba(251, 191, 36, 0.1);
          color: #d97706;
        }

        .schedule-status.completed {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
        }

        .quick-actions-section {
          margin-bottom: 3rem;
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
          position: relative;
        }

        .action-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
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

        .empty-schedule {
          text-align: center;
          padding: 4rem 2rem;
          color: #64748b;
        }

        .empty-schedule-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .loading {
          text-align: center;
          padding: 4rem;
          font-size: 1.2rem;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .doctor-dashboard-content {
            padding: 1.5rem 1rem;
            margin-left: 0;
          }

          .doctor-welcome-title {
            font-size: 2rem;
          }

          .doctor-stats-grid,
          .quick-actions-grid {
            grid-template-columns: 1fr;
          }

          .doctor-welcome-header {
            flex-direction: column;
          }

          .schedule-item {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>

      <div className="doctor-dashboard-container">
        <Sidebar />

        <div className="doctor-dashboard-content">
          {/* Welcome Section */}
          <div className="doctor-welcome-section">
            <div className="doctor-welcome-header">
              <div>
                <h1 className="doctor-welcome-title">Welcome, Dr. {data.user.name}! 👨‍⚕️</h1>
                <p className="doctor-welcome-subtitle">Here's your practice overview for today</p>
              </div>
              <div className="doctor-badge">
                <FaStethoscope className="doctor-badge-icon" />
                <div className="doctor-badge-text">
                  <span className="doctor-badge-label">Specialization</span>
                  <span className="doctor-badge-value">{data.user.department || 'General'}</span>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading your dashboard...</div>
          ) : (
            <>
              {/* Next Patient Card */}
              {nextPatient && (
                <div className="next-patient-card">
                  <div className="next-patient-header">
                    <h2 className="next-patient-title">
                      <FaHeartbeat className="pulse-icon" /> Next Patient
                    </h2>
                    <span className="next-patient-badge">Upcoming</span>
                  </div>
                  <div className="next-patient-details">
                    <div className="next-patient-detail">
                      <span className="detail-label">Patient Name</span>
                      <span className="detail-value">{nextPatient.patientId?.name || 'N/A'}</span>
                    </div>
                    <div className="next-patient-detail">
                      <span className="detail-label">Time</span>
                      <span className="detail-value">{nextPatient.time}</span>
                    </div>
                    <div className="next-patient-detail">
                      <span className="detail-label">Department</span>
                      <span className="detail-value">{nextPatient.department}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="doctor-stats-grid">
                <div className="doctor-stat-card" style={{ '--card-color': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <div className="doctor-stat-header">
                    <div>
                      <div className="doctor-stat-value">{stats.todayAppointments}</div>
                      <div className="doctor-stat-label">Today's Appointments</div>
                    </div>
                    <FaCalendarCheck className="doctor-stat-icon" style={{ color: '#667eea' }} />
                  </div>
                </div>

                <div className="doctor-stat-card" style={{ '--card-color': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <div className="doctor-stat-header">
                    <div>
                      <div className="doctor-stat-value">{stats.totalPatients}</div>
                      <div className="doctor-stat-label">Total Patients</div>
                    </div>
                    <FaUsers className="doctor-stat-icon" style={{ color: '#f5576c' }} />
                  </div>
                </div>

                <div className="doctor-stat-card" style={{ '--card-color': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <div className="doctor-stat-header">
                    <div>
                      <div className="doctor-stat-value">{stats.reportsGenerated}</div>
                      <div className="doctor-stat-label">Reports Generated</div>
                    </div>
                    <FaFileAlt className="doctor-stat-icon" style={{ color: '#00f2fe' }} />
                  </div>
                </div>

                <div className="doctor-stat-card" style={{ '--card-color': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                  <div className="doctor-stat-header">
                    <div>
                      <div className="doctor-stat-value">{stats.prescriptionsIssued}</div>
                      <div className="doctor-stat-label">Prescriptions Issued</div>
                    </div>
                    <FaPills className="doctor-stat-icon" style={{ color: '#38f9d7' }} />
                  </div>
                </div>
              </div>

              {/* Today's Schedule */}
              <div className="today-schedule-section">
                <h2 className="section-title"><FaClock /> Today's Schedule</h2>
                <div className="schedule-timeline">
                  {todaySchedule.length > 0 ? (
                    todaySchedule.map((apt, index) => (
                      <div key={index} className={`schedule-item ${apt.status === 'completed' ? 'completed' : ''}`}>
                        <div className="schedule-time">{apt.time}</div>
                        <div className="schedule-info">
                          <div className="schedule-patient">{apt.patientId?.name || 'Patient'}</div>
                          <div className="schedule-department">{apt.department}</div>
                        </div>
                        <span className={`schedule-status ${apt.status || 'pending'}`}>
                          {apt.status || 'Pending'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="empty-schedule">
                      <FaCalendarCheck className="empty-schedule-icon" />
                      <p>No appointments scheduled for today</p>
                    </div>
                  )}
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
                        {action.badge && <span className="action-badge">{action.badge}</span>}
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
    </>
  );
};

export default Doctor_Dashboard;
