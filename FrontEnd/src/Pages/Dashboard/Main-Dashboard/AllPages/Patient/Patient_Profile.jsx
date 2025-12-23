import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { BiTime } from "react-icons/bi";
import { GiAges, GiMeditation } from "react-icons/gi";
import { MdBloodtype, MdEmail } from "react-icons/md";
import { BsFillTelephoneFill, BsHouseFill } from "react-icons/bs";
import { FaRegHospital, FaMapMarkedAlt, FaBirthdayCake } from "react-icons/fa";
import Sidebar from "../../GlobalFiles/Sidebar";
import { useDispatch, useSelector } from "react-redux";
import { message, Modal } from "antd";
import { updatePatient } from "../../../../../Redux/auth/action";
import { GetPatients } from "../../../../../Redux/Datas/action";
import { TbGenderBigender } from "react-icons/tb";
import patientImage from "../../../../../img/patient.png";

const Patient_Profile = () => {
  const { data } = useSelector((store) => store.auth);
  const { patients } = useSelector((store) => store.data.patients);

  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  useEffect(() => {
    dispatch(GetPatients());
  }, []);

  const patient = patients.find((p) => data.user.email === p.email);

  // Add safety check for patient data
  if (!patient) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading patient data...</p>
      </div>
    );
  }

  const success = (text) => messageApi.success(text);
  const error = (text) => messageApi.error(text);

  const showModal = () => {
    console.log("Opening change password modal");
    setFormData({
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setOpen(true);
  };

  const handleCancel = () => setOpen(false);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = () => {
    const { oldPassword, newPassword, confirmNewPassword } = formData;

    if (!oldPassword) {
      return error("Please enter your current password");
    }

    if (!newPassword) {
      return error("Please enter a new password");
    }

    if (newPassword.length < 8) {
      return error("New password must be at least 8 characters long");
    }

    if (oldPassword === newPassword) {
      return error("New password cannot be the same as current password");
    }

    if (newPassword !== confirmNewPassword) {
      return error("New passwords do not match");
    }

    setConfirmLoading(true);

    dispatch(
      updatePatient(
        data.user._id,
        { 
          password: newPassword,
          oldPassword: oldPassword 
        },
        data.token
      )
    ).then((res) => {
      setConfirmLoading(false);
      if (res.message === "password updated") {
        success("Password updated successfully");
        setOpen(false);
        setFormData({
          oldPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } else if (res.message === "Incorrect old password") {
        error("Current password is incorrect");
      } else {
        error("Something went wrong. Please try again.");
      }
    }).catch((err) => {
      setConfirmLoading(false);
      error("Something went wrong. Please try again.");
    });
  };

  const formattedDob = new Date(patient.dob).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  if (data?.isAuthenticated === false) {
    return <Navigate to={"/"} />;
  }

  return (
    <>
      {contextHolder}

      {/* ---------------- Inline CSS ---------------- */}
      <style>{`
        .profile-page-container {
          display: flex;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          min-height: 100vh;
          position: relative;
        }

        .profile-page-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="medical-pattern" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M25 10 L25 40 M10 25 L40 25" stroke="rgba(102,126,234,0.03)" stroke-width="2" fill="none"/></pattern></defs><rect width="100" height="100" fill="url(%23medical-pattern)"/></svg>');
          pointer-events: none;
        }

        .profile-content {
          flex: 1;
          padding: 2.5rem 3rem;
          position: relative;
          z-index: 1;
        }

        .profile-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .profile-title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .profile-subtitle {
          color: #64748b;
          font-size: 1.1rem;
          font-weight: 500;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 2.5rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        @media (max-width: 1024px) {
          .profile-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        /* ------------ Left Profile Card ------------ */
        .left-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 2.5rem 2rem;
          border-radius: 24px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 1px 0 rgba(255, 255, 255, 0.2) inset;
          border: 1px solid rgba(255, 255, 255, 0.2);
          text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .left-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .left-card:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.15),
            0 1px 0 rgba(255, 255, 255, 0.3) inset;
        }

        .profile-image-container {
          position: relative;
          display: inline-block;
          margin-bottom: 2rem;
        }

        .left-card img {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: 4px solid rgba(102, 126, 234, 0.2);
          transition: all 0.3s ease;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .profile-image-container:hover img {
          transform: scale(1.05);
          border-color: rgba(102, 126, 234, 0.5);
          box-shadow: 0 12px 24px rgba(102, 126, 234, 0.2);
        }

        .patient-name {
          font-size: 1.8rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
          letter-spacing: -0.01em;
        }

        .patient-id {
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 2rem;
          padding: 0.5rem 1rem;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 20px;
          display: inline-block;
        }

        .div-line {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
          margin: 1.5rem 0;
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1rem 0;
          padding: 0.75rem;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .info-row:hover {
          background: rgba(102, 126, 234, 0.05);
          transform: translateX(4px);
        }

        .info-text {
          font-size: 1rem;
          font-weight: 500;
          color: #374151;
          flex: 1;
          text-align: left;
        }

        .info-icon {
          font-size: 1.3rem;
          color: #667eea;
          min-width: 20px;
        }

        .password-btn {
          margin-top: 2rem;
          padding: 1rem 2rem;
          width: 100%;
          border: none;
          border-radius: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .password-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .password-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 24px rgba(102, 126, 234, 0.4);
        }

        .password-btn:hover::before {
          left: 100%;
        }

        /* ------------ Right Side Boxes ------------ */
        .right-column {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          align-content: start;
        }

        .section-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 2rem;
          border-radius: 24px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 1px 0 rgba(255, 255, 255, 0.2) inset;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .section-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
        }

        .section-card:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.15),
            0 1px 0 rgba(255, 255, 255, 0.3) inset;
        }

        .section-card h2 {
          text-align: center;
          margin-bottom: 1.5rem;
          color: #1e293b;
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-top: 1rem;
        }

        .stat-item {
          text-align: center;
          padding: 1rem;
          background: rgba(102, 126, 234, 0.05);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .stat-item:hover {
          background: rgba(102, 126, 234, 0.1);
          transform: translateY(-2px);
        }

        .stat-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
        }

        /* Medical icons decoration */
        .section-card:nth-child(1)::after {
          content: '👤';
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          font-size: 1.5rem;
          opacity: 0.1;
        }

        .section-card:nth-child(2)::after {
          content: '🏥';
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          font-size: 1.5rem;
          opacity: 0.1;
        }
      `}</style>

      {/* ---------------- PAGE STRUCTURE ---------------- */}
      <div className="profile-page-container">
        <Sidebar />

        <div className="profile-content">
          <div className="profile-header">
            <h1 className="profile-title">👤 Patient Profile</h1>
            <p className="profile-subtitle">Manage your personal information and account settings</p>
          </div>

          <div className="profile-grid">

            {/* LEFT PROFILE CARD */}
            <div className="left-card">
              <div className="profile-image-container">
                <img src={patientImage} alt="profile" />
              </div>

              <h3 className="patient-name">{patient.name}</h3>
              <div className="patient-id">Patient ID: {patient._id?.slice(-8) || 'N/A'}</div>

              <div className="div-line"></div>

              <div className="info-row">
                <BsFillTelephoneFill className="info-icon" />
                <p className="info-text">{patient.phonenum}</p>
              </div>

              <div className="info-row">
                <MdEmail className="info-icon" />
                <p className="info-text">{patient.email}</p>
              </div>

              <div className="info-row">
                <FaBirthdayCake className="info-icon" />
                <p className="info-text">{formattedDob}</p>
              </div>

              <button className="password-btn" onClick={showModal}>
                🔒 Change Password
              </button>
            </div>

            {/* RIGHT SIDE SECTIONS */}
            <div className="right-column">
              
              {/* PERSONAL INFO */}
              <div className="section-card">
                <h2>📋 Personal Information</h2>

                <div className="info-row">
                  <TbGenderBigender className="info-icon" />
                  <p className="info-text">Gender: {patient.gender}</p>
                </div>

                <div className="info-row">
                  <GiAges className="info-icon" />
                  <p className="info-text">Age: {patient.age} years</p>
                </div>

                <div className="info-row">
                  <MdBloodtype className="info-icon" />
                  <p className="info-text">Blood Group: {patient.bloodgroup}</p>
                </div>

                <div className="info-row">
                  <BsHouseFill className="info-icon" />
                  <p className="info-text">Address: {patient.address}</p>
                </div>

                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-number">A+</div>
                    <div className="stat-label">Health Grade</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">5</div>
                    <div className="stat-label">Visits This Year</div>
                  </div>
                </div>
              </div>

              {/* HOSPITAL INFO */}
              <div className="section-card">
                <h2>🏥 Hospital Information</h2>

                <div className="info-row">
                  <BiTime className="info-icon" />
                  <p className="info-text">Hours: 09:00 AM – 08:00 PM</p>
                </div>

                <div className="info-row">
                  <FaRegHospital className="info-icon" />
                  <p className="info-text">Hospital: IGMC Shimla</p>
                </div>

                <div className="info-row">
                  <FaMapMarkedAlt className="info-icon" />
                  <p className="info-text">Location: Shimla, Himachal Pradesh</p>
                </div>

                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-number">24/7</div>
                    <div className="stat-label">Emergency</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">15+</div>
                    <div className="stat-label">Departments</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        title={
          <div style={{ 
            fontSize: '1.3rem', 
            fontWeight: '700', 
            color: '#0b6b61',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🔒 Change Password
          </div>
        }
        open={open}
        onCancel={handleCancel}
        width={500}
        style={{ top: 50 }}
        bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}
        destroyOnClose={true}
        footer={[
          <button
            key="cancel"
            onClick={handleCancel}
            style={{
              padding: '8px 16px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              background: 'white',
              color: '#000',
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            Cancel
          </button>,
          <button
            key="submit"
            onClick={handleFormSubmit}
            disabled={confirmLoading}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: confirmLoading ? '#ccc' : 'linear-gradient(135deg, #0b6b61, #13a189)',
              color: 'white',
              cursor: confirmLoading ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {confirmLoading ? 'Updating...' : 'Update Password'}
          </button>
        ]}
      >
        <style>{`
          .password-form-container {
            padding: 1rem 0;
          }

          .password-input-group {
            margin-bottom: 1.2rem;
          }

          .password-input-label {
            display: block;
            font-size: 0.9rem;
            font-weight: 600;
            color: #0b6b61;
            margin-bottom: 0.5rem;
          }

          .password-input-field {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background: #f9fafb;
          }

          .password-input-field:focus {
            outline: none;
            border-color: #0b6b61;
            background: white;
            box-shadow: 0 0 0 3px rgba(11, 107, 97, 0.1);
          }

          .password-requirements {
            background: linear-gradient(135deg, #e8f5f3, #f0f9f7);
            padding: 1rem;
            border-radius: 10px;
            margin-top: 1rem;
            border-left: 4px solid #0b6b61;
          }

          .password-requirements h4 {
            margin: 0 0 0.5rem 0;
            font-size: 0.9rem;
            color: #0b6b61;
            font-weight: 600;
          }

          .password-requirements ul {
            margin: 0;
            padding-left: 1.2rem;
            font-size: 0.85rem;
            color: #666;
          }

          .password-requirements li {
            margin: 0.3rem 0;
          }
        `}</style>

        <div className="password-form-container">
          <div className="password-input-group">
            <label className="password-input-label">Current Password</label>
            <input
              name="oldPassword"
              type="password"
              placeholder="Enter your current password"
              value={formData.oldPassword}
              onChange={handleFormChange}
              className="password-input-field"
              required
            />
          </div>

          <div className="password-input-group">
            <label className="password-input-label">New Password</label>
            <input
              name="newPassword"
              type="password"
              placeholder="Enter your new password"
              value={formData.newPassword}
              onChange={handleFormChange}
              className="password-input-field"
              required
            />
          </div>

          <div className="password-input-group">
            <label className="password-input-label">Confirm New Password</label>
            <input
              name="confirmNewPassword"
              type="password"
              placeholder="Re-enter your new password"
              value={formData.confirmNewPassword}
              onChange={handleFormChange}
              className="password-input-field"
              required
            />
          </div>

          <div className="password-requirements">
            <h4>Password Requirements:</h4>
            <ul>
              <li>Must be at least 8 characters long</li>
              <li>Should contain uppercase and lowercase letters</li>
              <li>Should include at least one number</li>
              <li>New password must be different from current password</li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Patient_Profile;
