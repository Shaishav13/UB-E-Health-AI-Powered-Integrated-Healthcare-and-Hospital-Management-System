import React, { useState } from "react";
import { AiOutlineUserAdd } from "react-icons/ai";
import { FaAmbulance, FaUsers, FaPills } from "react-icons/fa";
import { BsBookmarkPlus, BsFillBookmarkCheckFill } from "react-icons/bs";
import { CgProfile } from "react-icons/cg";
import { TbReportMedical } from "react-icons/tb";
import { Link } from "react-router-dom";
import { ImMenu } from "react-icons/im";
import { FiLogOut } from "react-icons/fi";
import { RiAdminLine } from "react-icons/ri";
import { MdDashboardCustomize } from "react-icons/md";
import { HiUserGroup } from "react-icons/hi2";
import { useDispatch, useSelector } from "react-redux";
import { authLogout } from "../../../../Redux/auth/action";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  const dispatch = useDispatch();

  const {
    data: { user },
  } = useSelector((state) => state.auth);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Use a single hover handler for the entire sidebar with debouncing
  const handleSidebarMouseEnter = () => {
    if (!isOpen) {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      const timeout = setTimeout(() => {
        setHovered(true);
      }, 100); // Small delay to prevent glitching
      setHoverTimeout(timeout);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    const timeout = setTimeout(() => {
      setHovered(false);
    }, 100); // Small delay to prevent glitching
    setHoverTimeout(timeout);
  };

  return (
    <>
      {/* ================= INLINE CSS ================= */}
      <style>{`
        .sidebar-container {
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
        }

        .sidebar-modern {
          height: 100vh;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          border-right: 1px solid rgba(148, 163, 184, 0.1);
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease;
          overflow: hidden;
          box-shadow: 0 0 40px rgba(0, 0, 0, 0.1);
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .sidebar-modern::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at top right, rgba(14, 165, 233, 0.05) 0%, transparent 50%),
                      radial-gradient(circle at bottom left, rgba(20, 184, 166, 0.05) 0%, transparent 50%);
          pointer-events: none;
        }

        .sidebar-collapsed {
          width: 80px;
        }

        .sidebar-hover-expand {
          width: 280px;
        }

        .sidebar-open {
          width: 280px;
        }

        /* Mobile Overlay */
        .sidebar-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .sidebar-overlay.active {
          display: block;
          opacity: 1;
        }

        /* ---------------- Header ---------------- */
        .sidebar-header {
          display: flex;
          justify-content: ${isOpen || hovered ? 'space-between' : 'center'};
          align-items: center;
          padding: ${isOpen || hovered ? '2rem 1.5rem' : '2rem 0.5rem'};
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          position: relative;
          z-index: 1;
          flex-shrink: 0;
          min-height: 80px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-logo {
          font-size: ${isOpen || hovered ? '1.8rem' : '1.2rem'};
          font-weight: 800;
          background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          opacity: 1;
          transition: all 0.4s ease;
          letter-spacing: ${isOpen || hovered ? '-0.02em' : '-0.05em'};
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          filter: drop-shadow(0 0 20px rgba(14, 165, 233, 0.3));
        }

        .menu-btn {
          font-size: 1.5rem;
          cursor: pointer;
          color: #e2e8f0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0.5rem;
          border-radius: 0.75rem;
          background: rgba(14, 165, 233, 0.1);
          border: 1px solid rgba(14, 165, 233, 0.2);
          position: ${isOpen || hovered ? 'static' : 'absolute'};
          top: ${isOpen || hovered ? 'auto' : '2rem'};
          right: ${isOpen || hovered ? 'auto' : '0.5rem'};
          z-index: 2;
        }

        .menu-btn:hover {
          transform: rotate(90deg);
          color: white;
          background: rgba(14, 165, 233, 0.2);
          border-color: rgba(14, 165, 233, 0.4);
          box-shadow: 0 0 20px rgba(14, 165, 233, 0.3);
        }

        /* Mobile Menu Button */
        .mobile-menu-btn {
          display: none;
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 1001;
          font-size: 1.5rem;
          cursor: pointer;
          color: white;
          padding: 0.75rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%);
          box-shadow: 0 4px 20px rgba(14, 165, 233, 0.4);
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .mobile-menu-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 25px rgba(14, 165, 233, 0.5);
        }

        .mobile-menu-btn:active {
          transform: scale(0.95);
        }

        /* ---------------- Link Container ---------------- */
        .sidebar-links {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 1.5rem 0 0 0;
          position: relative;
          z-index: 1;
          min-height: 0;
        }

        .side-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          text-decoration: none;
          color: #cbd5e1;
          font-size: 0.95rem;
          font-weight: 500;
          border-radius: 0.75rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          margin: 0.25rem 1rem;
          position: relative;
          overflow: hidden;
          min-height: 48px;
        }

        .side-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .side-link:hover {
          color: white;
          background: rgba(14, 165, 233, 0.1);
          transform: translateX(8px);
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
        }

        .side-link:hover::before {
          opacity: 1;
        }

        .side-link.active {
          color: white;
          background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%);
          transform: translateX(8px);
          box-shadow: 
            0 8px 20px rgba(14, 165, 233, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
        }

        .side-icon {
          font-size: 1.2rem;
          min-width: 20px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 1;
        }

        .side-link:hover .side-icon {
          transform: scale(1.1);
        }

        .side-link span {
          position: relative;
          z-index: 1;
        }

        /* Main links container */
        .main-links {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          padding-bottom: 1rem;
        }

        /* Logout spacing */
        .logout-area {
          margin-top: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1.5rem 0;
          position: relative;
          flex-shrink: 0;
          background: linear-gradient(180deg, transparent 0%, rgba(30, 41, 59, 0.8) 100%);
          transform: translateY(0);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .logout-area .side-link {
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.2);
          background: rgba(248, 113, 113, 0.05);
          display: flex !important;
          visibility: visible !important;
          margin: 0 1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 48px;
          align-items: center;
        }

        .logout-area .side-link:hover {
          color: white;
          background: #f87171;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(248, 113, 113, 0.3);
        }

        /* Section titles */
        .nav-section-title {
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0 1.5rem;
          margin: 1.5rem 0 0.75rem;
          opacity: ${isOpen || hovered ? 1 : 0};
          transition: opacity 0.3s ease;
        }

        /* ========================================
           RESPONSIVE DESIGN - MOBILE & TABLET
           ======================================== */

        /* Tablet (768px - 991px) */
        @media (max-width: 991px) and (min-width: 768px) {
          .sidebar-collapsed {
            width: 70px;
          }

          .sidebar-hover-expand,
          .sidebar-open {
            width: 240px;
          }

          .sidebar-header {
            padding: ${isOpen || hovered ? '1.5rem 1rem' : '1.5rem 0.5rem'};
            min-height: 70px;
          }

          .sidebar-logo {
            font-size: ${isOpen || hovered ? '1.5rem' : '1rem'};
          }

          .side-link {
            padding: 0.875rem 1rem;
            font-size: 0.9rem;
            margin: 0.2rem 0.75rem;
          }

          .menu-btn {
            font-size: 1.3rem;
            padding: 0.4rem;
          }
        }

        /* Mobile (< 768px) */
        @media (max-width: 767px) {
          .sidebar-container {
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1000;
            height: 100vh;
          }

          .sidebar-modern {
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1000;
            width: 280px !important;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            box-shadow: 4px 0 30px rgba(0, 0, 0, 0.3);
          }

          .sidebar-modern.sidebar-open {
            transform: translateX(0);
          }

          .sidebar-collapsed,
          .sidebar-hover-expand {
            width: 280px !important;
          }

          .mobile-menu-btn {
            display: block;
          }

          .sidebar-header {
            justify-content: space-between !important;
            padding: 1.5rem 1rem !important;
          }

          .sidebar-logo {
            font-size: 1.5rem !important;
            letter-spacing: -0.02em !important;
          }

          .menu-btn {
            position: static !important;
            font-size: 1.3rem;
          }

          .side-link {
            padding: 1rem 1.25rem;
            margin: 0.25rem 0.75rem;
            min-height: 52px;
          }

          .side-link span {
            display: block !important;
          }

          .side-icon {
            font-size: 1.3rem;
          }

          /* Disable hover effects on mobile */
          .sidebar-modern:hover {
            width: 280px !important;
          }

          .side-link:hover {
            transform: translateX(0);
          }

          /* Better touch targets */
          .logout-area .side-link {
            min-height: 52px;
          }
        }

        /* Extra small mobile (< 375px) */
        @media (max-width: 374px) {
          .sidebar-modern {
            width: 260px !important;
          }

          .sidebar-logo {
            font-size: 1.3rem !important;
          }

          .side-link {
            font-size: 0.875rem;
            padding: 0.875rem 1rem;
          }

          .mobile-menu-btn {
            top: 0.75rem;
            left: 0.75rem;
            padding: 0.625rem;
            font-size: 1.3rem;
          }
        }

        /* Landscape mobile */
        @media (max-height: 500px) and (max-width: 767px) {
          .sidebar-header {
            min-height: 60px;
            padding: 1rem !important;
          }

          .sidebar-logo {
            font-size: 1.2rem !important;
          }

          .side-link {
            padding: 0.75rem 1rem;
            min-height: 44px;
          }

          .main-links {
            padding-bottom: 0.5rem;
          }

          .logout-area {
            padding: 1rem 0;
          }
        }

        /* Scrollbar styling */
        .sidebar-links::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-links::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .sidebar-links::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }

        .sidebar-links::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Smooth scrolling */
        .main-links {
          scroll-behavior: smooth;
        }

        /* Prevent text selection on mobile */
        @media (max-width: 767px) {
          .sidebar-modern {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
        }
      `}</style>

      {/* ================= MOBILE OVERLAY ================= */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
      />

      {/* ================= MOBILE MENU BUTTON ================= */}
      <ImMenu 
        className="mobile-menu-btn" 
        onClick={toggleMenu}
      />

      {/* ================= SIDEBAR ================= */}
      <div className="sidebar-container">
        <div
          className={`
            sidebar-modern
            ${isOpen ? "sidebar-open" : hovered ? "sidebar-hover-expand" : "sidebar-collapsed"}
          `}
          onMouseEnter={handleSidebarMouseEnter}
          onMouseLeave={handleSidebarMouseLeave}
        >
          {/* HEADER */}
          <div className="sidebar-header">
            <span className="sidebar-logo">
              {isOpen || hovered ? "🏥 HMS" : "HMS"}
            </span>
            <ImMenu className="menu-btn" onClick={toggleMenu} />
          </div>

          {/* LINKS */}
          <div className="sidebar-links">
            <div className="main-links">

              <Link
                className="side-link"
                to="/dashboard"
              >
                <MdDashboardCustomize className="side-icon" />
                {(isOpen || hovered) && <span>Dashboard</span>}
              </Link>

              {/* PATIENT MENU */}
              {user?.userType === "patient" && (
                <>
                  <Link
                    className="side-link"
                    to="/patientprofile"
                  >
                    <CgProfile className="side-icon" />
                    {(isOpen || hovered) && <span>Profile</span>}
                  </Link>

                  <Link
                    className="side-link"
                    to="/bookappointment"
                  >
                    <BsBookmarkPlus className="side-icon" />
                    {(isOpen || hovered) && <span>Book Appointment</span>}
                  </Link>

                  <Link
                    className="side-link"
                    to="/mymedications"
                  >
                    <FaPills className="side-icon" />
                    {(isOpen || hovered) && <span>My Medications</span>}
                  </Link>
                </>
              )}

              {/* ADMIN MENU */}
              {user?.userType === "admin" && (
                <>
                  <Link
                    className="side-link"
                    to="/addoctor"
                  >
                    <AiOutlineUserAdd className="side-icon" />
                    {(isOpen || hovered) && <span>Add Doctor</span>}
                  </Link>

                  <Link
                    className="side-link"
                    to="/addadmin"
                  >
                    <RiAdminLine className="side-icon" />
                    {(isOpen || hovered) && <span>Add Admin</span>}
                  </Link>

                  <Link
                    className="side-link"
                    to="/addambulance"
                  >
                    <FaAmbulance className="side-icon" />
                    {(isOpen || hovered) && <span>Add Ambulance</span>}
                  </Link>

                  <Link
                    className="side-link"
                    to="/managedoctors"
                  >
                    <HiUserGroup className="side-icon" />
                    {(isOpen || hovered) && <span>Manage Doctors</span>}
                  </Link>

                  <Link
                    className="side-link"
                    to="/managepatients"
                  >
                    <FaUsers className="side-icon" />
                    {(isOpen || hovered) && <span>Manage Patients</span>}
                  </Link>

                  <Link
                    className="side-link"
                    to="/adminprofile"
                  >
                    <CgProfile className="side-icon" />
                    {(isOpen || hovered) && <span>Profile</span>}
                  </Link>
                </>
              )}

              {/* DOCTOR MENU */}
              {user?.userType === "doctor" && (
                <>
                  <Link
                    className="side-link"
                    to="/doctorprofile"
                  >
                    <CgProfile className="side-icon" />
                    {(isOpen || hovered) && <span>Profile</span>}
                  </Link>

                  <Link
                    className="side-link"
                    to="/patientdetails"
                  >
                    <FaUsers className="side-icon" />
                    {(isOpen || hovered) && <span>Patients</span>}
                  </Link>
                </>
              )}

              {/* COMMON SECTIONS */}
              {user?.userType !== "admin" && (
                <>
                  <Link
                    className="side-link"
                    to="/checkappointment"
                  >
                    <BsFillBookmarkCheckFill className="side-icon" />
                    {(isOpen || hovered) && <span>My Appointments</span>}
                  </Link>

                  <Link
                    className="side-link"
                    to="/reports"
                  >
                    <TbReportMedical className="side-icon" />
                    {(isOpen || hovered) && <span>Reports</span>}
                  </Link>
                </>
              )}

            </div>

            {/* LOGOUT */}
            <div className="logout-area">
              <Link
                className="side-link"
                to="/"
                onClick={() => dispatch(authLogout())}
                title="Logout"
              >
                <FiLogOut className="side-icon" />
                {(isOpen || hovered) && <span>Logout</span>}
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
