import { Table, Descriptions } from "antd";
import React, { useEffect, useState } from "react";
import {
  FaUserPlus,
  FaUserMd,
  FaAmbulance,
  FaFileAlt,
  FaChartLine,
  FaUsers,
  FaCalendarCheck,
  FaFlask,
  FaPlus,
  FaEye,
  FaCog,
  FaHeartbeat
} from "react-icons/fa";
import { BsFillBookmarkCheckFill } from "react-icons/bs";
import { MdPayment } from "react-icons/md";
import { RiAdminLine } from "react-icons/ri";
import patient from "../../../../img/patient.png";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  GetAllData,
  GetPatients,
  GetDoctorDetails,
  GetMedicineDetails,
  GetAppointments,
  GetAdminDetails,
  GetAllReports
} from "../../../../Redux/Datas/action";
import Footer from "../../../../Components/Footer";

const FrontPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    data: { user }
  } = useSelector((state) => state.auth);

  const { patients } = useSelector((store) => store.data.patients);
  const { doctors } = useSelector((store) => store.data.doctors);
  const { medicines } = useSelector((store) => store.data.medicines);
  const { reports } = useSelector((store) => store.data.reports);
  const reportCount = useSelector(
    (store) => store.data.reports
  )?.reports?.length;

  const {
    dashboard: { data }
  } = useSelector((store) => store.data);

  const [recentActivity, setRecentActivity] = useState([]);

  const patientColumns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Age", dataIndex: "age", key: "age" },
    { title: "Disease", dataIndex: "disease", key: "disease" },
    { title: "Blood Group", dataIndex: "bloodgroup", key: "bloodgroup" },
    { title: "Gender", dataIndex: "gender", key: "gender" },
    { title: "Email", dataIndex: "email", key: "email" }
  ];

  const doctorColumns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Age", dataIndex: "age", key: "age" },
    { title: "Gender", dataIndex: "gender", key: "gender" },
    { title: "Phone Number", dataIndex: "phonenum", key: "phonenum" },
    { title: "Department", dataIndex: "department", key: "department" },
    { title: "Email", dataIndex: "email", key: "email" }
  ];

  const patientMedication = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Dosage", dataIndex: "dosage", key: "dosage" },
    { title: "Frequency", dataIndex: "frequency", key: "frequency" },
    { title: "Duration", dataIndex: "duration", key: "duration" },
    { title: "Report Date & Time", dataIndex: "datetime", key: "dateTime" }
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Redirect patients to new modern dashboard
    if (user?.userType === "patient") {
      navigate("/patient/dashboard");
      return;
    }

    // Redirect doctors to new modern dashboard
    if (user?.userType === "doctor") {
      navigate("/doctor/dashboard");
      return;
    }

    dispatch(GetPatients());
    dispatch(GetDoctorDetails());
    dispatch(GetAllData());

    if (user?.userType === undefined) {
      navigate("/");
    }

    if (user?.userType !== "admin") {
      dispatch(GetAllReports(user?.userType, user?._id));
      dispatch(GetMedicineDetails(user?._id));
      dispatch(GetAppointments(user?.userType, user?._id));
    } else {
      dispatch(GetAdminDetails());
    }
  }, []);

  // Generate recent activity for admin
  useEffect(() => {
    if (user?.userType === "admin" && patients && doctors) {
      const activities = [];
      
      // Recent patients
      const recentPatients = patients.slice(-3).reverse();
      recentPatients.forEach(p => {
        activities.push({
          type: 'patient',
          icon: <FaUserPlus />,
          title: 'New Patient Registered',
          description: p.name,
          time: 'Recently',
          color: '#0b6b61'
        });
      });

      // Recent doctors
      const recentDoctors = doctors.slice(-2).reverse();
      recentDoctors.forEach(d => {
        activities.push({
          type: 'doctor',
          icon: <FaUserMd />,
          title: 'New Doctor Added',
          description: `Dr. ${d.name} - ${d.department}`,
          time: 'Recently',
          color: '#13a189'
        });
      });

      setRecentActivity(activities.slice(0, 5));
    }
  }, [patients, doctors, user]);

  const details = patients?.find((p) => p._id === user?._id);

  // Quick actions for admin
  const adminQuickActions = [
    {
      title: "Add Doctor",
      icon: <FaUserMd />,
      color: "linear-gradient(135deg, #0b6b61 0%, #13a189 100%)",
      path: "/adddoctor",
      description: "Register new doctor"
    },
    {
      title: "Add Ambulance",
      icon: <FaAmbulance />,
      color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      path: "/addambulance",
      description: "Add ambulance service"
    },
    {
      title: "Add Lab Personnel",
      icon: <FaFlask />,
      color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      path: "/addlabpersonnel",
      description: "Register lab staff"
    },
    {
      title: "Manage Doctors",
      icon: <FaEye />,
      color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      path: "/managedoctors",
      description: "View & manage doctors"
    },
    {
      title: "Manage Patients",
      icon: <FaUsers />,
      color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      path: "/managepatients",
      description: "View patient records"
    },
    {
      title: "System Settings",
      icon: <FaCog />,
      color: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
      path: null,
      description: "Configure system",
      comingSoon: true
    }
  ];

  const handleActionClick = (action) => {
    if (action.comingSoon) {
      alert(`${action.title}\n\nThis feature is coming soon!`);
      return;
    }
    if (action.path) {
      navigate(action.path);
    }
  };

  return (
    <>
      <style>{`
        .admin-dashboard-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          position: relative;
          overflow-x: hidden;
        }

        .admin-dashboard-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="admin-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(11,107,97,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23admin-grid)"/></svg>');
          pointer-events: none;
        }

        .admin-dashboard-content {
          flex: 1;
          margin-left: 80px;
          padding: 2rem 3rem;
          overflow-y: auto;
          position: relative;
          z-index: 1;
          transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .admin-welcome-section {
          margin-bottom: 3rem;
        }

        .admin-welcome-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .admin-welcome-title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        .admin-welcome-subtitle {
          font-size: 1.1rem;
          color: #64748b;
          font-weight: 500;
        }

        .admin-badge {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.95);
          padding: 1rem 1.5rem;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .admin-badge-icon {
          font-size: 2rem;
          color: #0b6b61;
        }

        .admin-badge-text {
          display: flex;
          flex-direction: column;
        }

        .admin-badge-label {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 600;
        }

        .admin-badge-value {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .admin-stat-card {
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

        .admin-stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--card-color);
        }

        .admin-stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.15);
        }

        .admin-stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .admin-stat-icon {
          font-size: 2.5rem;
          opacity: 0.2;
        }

        .admin-stat-value {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .admin-stat-label {
          font-size: 1rem;
          color: #64748b;
          font-weight: 600;
        }

        .system-health-card {
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
          color: white;
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(11, 107, 97, 0.3);
          margin-bottom: 3rem;
          position: relative;
          overflow: hidden;
        }

        .system-health-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 300px;
          height: 300px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }

        .system-health-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .system-health-title {
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

        .system-health-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .system-health-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .system-health-detail {
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

        .section-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
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
          border-color: rgba(11, 107, 97, 0.3);
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

        .recent-activity-section {
          margin-bottom: 3rem;
        }

        .activity-timeline {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .activity-item {
          display: flex;
          gap: 1.5rem;
          padding: 1.5rem;
          border-left: 4px solid #0b6b61;
          margin-bottom: 1rem;
          background: rgba(248, 250, 252, 0.8);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .activity-item:hover {
          background: rgba(11, 107, 97, 0.05);
          transform: translateX(8px);
          box-shadow: 0 4px 12px rgba(11, 107, 97, 0.1);
        }

        .activity-icon-wrapper {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          background: var(--activity-color);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activity-icon {
          font-size: 1.5rem;
          color: white;
        }

        .activity-info {
          flex: 1;
        }

        .activity-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 0.3rem;
        }

        .activity-description {
          font-size: 0.95rem;
          color: #64748b;
          font-weight: 500;
        }

        .activity-time {
          font-size: 0.85rem;
          color: #94a3b8;
          font-weight: 500;
        }

        .empty-activity {
          text-align: center;
          padding: 4rem 2rem;
          color: #64748b;
        }

        .empty-activity-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .welcome-message {
          background: linear-gradient(135deg, rgba(11, 107, 97, 0.1) 0%, rgba(19, 161, 137, 0.1) 100%);
          padding: 2rem;
          border-radius: 20px;
          text-align: center;
          margin-bottom: 2rem;
          border: 1px solid rgba(11, 107, 97, 0.2);
        }

        .welcome-message h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .welcome-message p {
          color: #64748b;
          font-size: 1rem;
          margin: 0;
        }

        .profileCard {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          display: flex;
          gap: 2.5rem;
          padding: 2.5rem;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          max-width: 1000px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }

        .profileCard::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
        }

        .profileCard:hover {
          transform: translateY(-8px);
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.15);
        }

        .profileImg {
          flex-shrink: 0;
        }

        .profileImg img {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid rgba(11, 107, 97, 0.2);
          transition: all 0.3s ease;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .profileImg:hover img {
          transform: scale(1.05);
          border-color: rgba(11, 107, 97, 0.5);
          box-shadow: 0 12px 24px rgba(11, 107, 97, 0.2);
        }

        .descriptionBox {
          flex: 1;
        }

        .subHeading {
          font-size: 2rem;
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 2rem;
          margin-top: 3rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          text-align: center;
        }

        .labtests-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .labtest-card-dashboard {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 1.8rem;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .labtest-card-dashboard::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }

        .labtest-card-dashboard:hover {
          transform: translateY(-8px);
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.15);
        }

        .labtest-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid rgba(59, 130, 246, 0.1);
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .labtest-title-dashboard {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .labtest-icon {
          font-size: 1.5rem;
        }

        .labtest-disease {
          font-size: 1.2rem;
          font-weight: 700;
          color: #374151;
        }

        .labtest-date-dashboard {
          background: rgba(59, 130, 246, 0.1);
          padding: 0.4rem 0.8rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #2563eb;
        }

        .labtest-content-dashboard {
          background: rgba(240, 250, 255, 0.8);
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1rem;
          border-left: 3px solid #3b82f6;
        }

        .labtest-label-dashboard {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.8rem;
        }

        .labtest-text-dashboard {
          color: #374151;
          font-weight: 500;
          line-height: 1.6;
        }

        .labtest-item {
          padding: 0.4rem 0;
          font-size: 0.95rem;
        }

        .labtest-footer-dashboard {
          background: rgba(248, 250, 252, 0.8);
          padding: 0.8rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .doctor-info-dashboard {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .doctor-label {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 600;
        }

        .doctor-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #374151;
        }

        .empty-labtests-dashboard {
          grid-column: 1 / -1;
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .empty-labtests-dashboard::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }

        .empty-icon-dashboard {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.7;
        }

        .empty-title-dashboard {
          font-size: 1.5rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .empty-text-dashboard {
          font-size: 1rem;
          color: #64748b;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .admin-dashboard-content {
            padding: 1.5rem 1rem;
            margin-left: 0;
          }

          .admin-welcome-title {
            font-size: 2rem;
          }

          .admin-stats-grid,
          .quick-actions-grid {
            grid-template-columns: 1fr;
          }

          .admin-welcome-header {
            flex-direction: column;
          }

          .activity-item {
            flex-direction: column;
            gap: 1rem;
          }

          .labtests-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .labtest-card-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="admin-dashboard-container">
        <Sidebar />

        <div className="admin-dashboard-content">
          {/* Admin Dashboard */}
          {user?.userType === "admin" && (
            <>
              {/* Welcome Section */}
              <div className="admin-welcome-section">
                <div className="admin-welcome-header">
                  <div>
                    <h1 className="admin-welcome-title">Welcome, Admin</h1>
                    <p className="admin-welcome-subtitle">System overview and management dashboard</p>
                  </div>
                  <div className="admin-badge">
                    <RiAdminLine className="admin-badge-icon" />
                    <div className="admin-badge-text">
                      <span className="admin-badge-label">Role</span>
                      <span className="admin-badge-value">Administrator</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Health Card */}
              <div className="system-health-card">
                <div className="system-health-header">
                  <h2 className="system-health-title">
                    <FaHeartbeat className="pulse-icon" /> System Health
                  </h2>
                  <span className="system-health-badge">All Systems Operational</span>
                </div>
                <div className="system-health-details">
                  <div className="system-health-detail">
                    <span className="detail-label">Total Users</span>
                    <span className="detail-value">{(data?.patient || 0) + (data?.doctor || 0) + (data?.admin || 0)}</span>
                  </div>
                  <div className="system-health-detail">
                    <span className="detail-label">Active Services</span>
                    <span className="detail-value">{data?.ambulance || 0}</span>
                  </div>
                  <div className="system-health-detail">
                    <span className="detail-label">Total Reports</span>
                    <span className="detail-value">{data?.report || 0}</span>
                  </div>
                  <div className="system-health-detail">
                    <span className="detail-label">Appointments</span>
                    <span className="detail-value">{data?.appointment || 0}</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card" style={{ '--card-color': 'linear-gradient(135deg, #0b6b61 0%, #13a189 100%)' }}>
                  <div className="admin-stat-header">
                    <div>
                      <div className="admin-stat-value">{data?.patient || 0}</div>
                      <div className="admin-stat-label">Total Patients</div>
                    </div>
                    <FaUserPlus className="admin-stat-icon" style={{ color: '#0b6b61' }} />
                  </div>
                </div>

                <div className="admin-stat-card" style={{ '--card-color': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <div className="admin-stat-header">
                    <div>
                      <div className="admin-stat-value">{data?.doctor || 0}</div>
                      <div className="admin-stat-label">Active Doctors</div>
                    </div>
                    <FaUserMd className="admin-stat-icon" style={{ color: '#f5576c' }} />
                  </div>
                </div>

                <div className="admin-stat-card" style={{ '--card-color': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <div className="admin-stat-header">
                    <div>
                      <div className="admin-stat-value">{data?.appointment || 0}</div>
                      <div className="admin-stat-label">Appointments</div>
                    </div>
                    <BsFillBookmarkCheckFill className="admin-stat-icon" style={{ color: '#00f2fe' }} />
                  </div>
                </div>

                <div className="admin-stat-card" style={{ '--card-color': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                  <div className="admin-stat-header">
                    <div>
                      <div className="admin-stat-value">{data?.ambulance || 0}</div>
                      <div className="admin-stat-label">Ambulances</div>
                    </div>
                    <FaAmbulance className="admin-stat-icon" style={{ color: '#38f9d7' }} />
                  </div>
                </div>

                <div className="admin-stat-card" style={{ '--card-color': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                  <div className="admin-stat-header">
                    <div>
                      <div className="admin-stat-value">{data?.admin || 0}</div>
                      <div className="admin-stat-label">System Admins</div>
                    </div>
                    <RiAdminLine className="admin-stat-icon" style={{ color: '#fa709a' }} />
                  </div>
                </div>

                <div className="admin-stat-card" style={{ '--card-color': 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}>
                  <div className="admin-stat-header">
                    <div>
                      <div className="admin-stat-value">{data?.report || 0}</div>
                      <div className="admin-stat-label">Medical Reports</div>
                    </div>
                    <FaFileAlt className="admin-stat-icon" style={{ color: '#30cfd0' }} />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions-section">
                <h2 className="section-title">⚡ Quick Actions</h2>
                <div className="quick-actions-grid">
                  {adminQuickActions.map((action, index) => (
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

              {/* Recent Activity */}
              <div className="recent-activity-section">
                <h2 className="section-title"><FaChartLine /> Recent Activity</h2>
                <div className="activity-timeline">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div key={index} className="activity-item">
                        <div className="activity-icon-wrapper" style={{ '--activity-color': activity.color, background: activity.color }}>
                          <div className="activity-icon">{activity.icon}</div>
                        </div>
                        <div className="activity-info">
                          <div className="activity-title">{activity.title}</div>
                          <div className="activity-description">{activity.description}</div>
                        </div>
                        <div className="activity-time">{activity.time}</div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-activity">
                      <FaChartLine className="empty-activity-icon" />
                      <p>No recent activity to display</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Patient Dashboard */}
          {user?.userType === "patient" && (
            <>
              <div className="welcome-message">
                <h3>👋 Welcome back, {details?.name || 'Patient'}!</h3>
                <p>Your health journey continues here. Check your appointments, medications, and reports.</p>
              </div>

              <h2 className="subHeading">📋 My Health Profile</h2>

              <div className="profileCard">
                <div className="profileImg">
                  <img src={patient} alt="patient" />
                </div>

                <Descriptions
                  layout="vertical"
                  bordered
                  className="descriptionBox"
                  column={2}
                >
                  <Descriptions.Item label="👤 Full Name">
                    {details?.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="📞 Phone Number">
                    {details?.phonenum}
                  </Descriptions.Item>
                  <Descriptions.Item label="🏠 Address">
                    {details?.address}
                  </Descriptions.Item>
                  <Descriptions.Item label="🩸 Blood Group">
                    {details?.bloodgroup}
                  </Descriptions.Item>
                  <Descriptions.Item label="📊 Total Reports">
                    {reportCount || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="🔬 Pending Lab Tests">
                    {reports?.filter(r => r.labTests && r.labTests.trim() !== '').length || 0}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              <h2 className="subHeading">🔬 Suggested Lab Tests</h2>
              <div className="labtests-grid">
                {reports && reports.length > 0 && reports.some(report => report.labTests && report.labTests.trim() !== '') ? (
                  reports
                    .filter(report => report.labTests && report.labTests.trim() !== '')
                    .map((report) => (
                      <div key={report._id || report.id || Math.random()} className="labtest-card-dashboard">
                        <div className="labtest-card-header">
                          <div className="labtest-title-dashboard">
                            <span className="labtest-icon">🔬</span>
                            <span className="labtest-disease">{report.disease || 'Medical Report'}</span>
                          </div>
                          <div className="labtest-date-dashboard">
                            📅 {report.date ? new Date(report.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'N/A'}
                          </div>
                        </div>
                        
                        <div className="labtest-content-dashboard">
                          <div className="labtest-label-dashboard">Recommended Tests:</div>
                          <div className="labtest-text-dashboard">
                            {report.labTests.split('\n').map((line, index) => (
                              line.trim() && <div key={index} className="labtest-item">✓ {line.trim()}</div>
                            ))}
                          </div>
                        </div>

                        <div className="labtest-footer-dashboard">
                          <div className="doctor-info-dashboard">
                            <span className="doctor-label">👨‍⚕️ Prescribed by:</span>
                            <span className="doctor-name">{report.doctorid?.name || report.doctorName || 'Doctor'}</span>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="empty-labtests-dashboard">
                    <div className="empty-icon-dashboard">🔬</div>
                    <div className="empty-title-dashboard">No Lab Tests Suggested</div>
                    <div className="empty-text-dashboard">Your doctor's recommended lab tests will appear here</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default FrontPage;
