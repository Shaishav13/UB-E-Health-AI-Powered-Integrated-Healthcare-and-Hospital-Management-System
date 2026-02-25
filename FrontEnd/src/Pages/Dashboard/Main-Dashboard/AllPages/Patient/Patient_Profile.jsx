import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { BiTime } from "react-icons/bi";
import { GiAges } from "react-icons/gi";
import { MdBloodtype, MdEmail, MdEdit, MdHistory } from "react-icons/md";
import { BsFillTelephoneFill, BsHouseFill, BsCamera } from "react-icons/bs";
import { FaRegHospital, FaMapMarkedAlt, FaBirthdayCake, FaSave, FaTimes } from "react-icons/fa";
import Sidebar from "../../GlobalFiles/Sidebar";
import { useDispatch, useSelector } from "react-redux";
import { message, Modal, Tabs, Timeline, Tag } from "antd";
import { updatePatient } from "../../../../../Redux/auth/action";
import { GetPatients } from "../../../../../Redux/Datas/action";
import { TbGenderBigender } from "react-icons/tb";
import patientImage from "../../../../../img/patient.png";
import axios from "axios";
import Footer from "../../../../../Components/Footer";

const Patient_Profile = () => {
  const { data } = useSelector((store) => store.auth);
  const { patients } = useSelector((store) => store.data.patients);
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [activityData, setActivityData] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [profileData, setProfileData] = useState({
    name: "",
    phonenum: "",
    address: "",
    profilePicture: null,
  });

  useEffect(() => {
    dispatch(GetPatients());
  }, [dispatch]);

  const patient = patients?.find((p) => data.user.email === p.email);

  useEffect(() => {
    if (patient) {
      setProfileData({
        name: patient.name || "",
        phonenum: patient.phonenum || "",
        address: patient.address || "",
        profilePicture: patient.profilePicture || null,
      });
    }
  }, [patient]);

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
    setFormData({
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    setActivityOpen(false);
    if (editMode) {
      setEditMode(false);
      setProfileData({
        name: patient.name || "",
        phonenum: patient.phonenum || "",
        address: patient.address || "",
        profilePicture: patient.profilePicture || null,
      });
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePictureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        error("Image size should be less than 1MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        // Compress the image if needed
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set max dimensions
          const maxWidth = 400;
          const maxHeight = 400;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setProfileData({ ...profileData, profilePicture: compressedBase64 });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
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

  const handleProfileSave = () => {
    setConfirmLoading(true);
    
    dispatch(
      updatePatient(
        data.user._id,
        {
          name: profileData.name,
          phonenum: profileData.phonenum,
          address: profileData.address,
          profilePicture: profileData.profilePicture,
        },
        data.token
      )
    ).then((res) => {
      setConfirmLoading(false);
      if (res.message === "profile updated" || res.message === "password updated") {
        success("Profile updated successfully");
        setEditMode(false);
        dispatch(GetPatients());
      } else {
        error("Failed to update profile");
      }
    }).catch((err) => {
      setConfirmLoading(false);
      error("Something went wrong. Please try again.");
    });
  };

  const fetchActivityHistory = async () => {
    setLoadingActivity(true);
    try {
      const response = await axios.get(
        `http://127.0.0.1:3001/patients/${data.user._id}/activity`
      );
      setActivityData(response.data);
      setActivityOpen(true);
    } catch (err) {
      error("Failed to load activity history");
      console.error(err);
    } finally {
      setLoadingActivity(false);
    }
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

      <style>{`
        .profile-page-container {
          display: flex;
          background: linear-gradient(135deg, #e8f5f3 0%, #f0f9f7 100%);
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
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="medical-pattern" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M25 10 L25 40 M10 25 L40 25" stroke="rgba(11,107,97,0.03)" stroke-width="2" fill="none"/></pattern></defs><rect width="100" height="100" fill="url(%23medical-pattern)"/></svg>');
          pointer-events: none;
        }

        .profile-content {
          flex: 1;
          padding: 2rem 2.5rem;
          position: relative;
          z-index: 1;
        }

        .profile-header {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border-left: 4px solid #0b6b61;
        }

        .profile-title {
          font-size: 2rem;
          font-weight: 700;
          color: #0b6b61;
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .profile-subtitle {
          color: #64748b;
          font-size: 0.95rem;
          font-weight: 400;
          margin-left: 2.5rem;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        @media (max-width: 1024px) {
          .profile-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }

        .left-card {
          background: white;
          padding: 2rem 1.5rem;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          border-top: 4px solid #0b6b61;
        }

        .left-card:hover {
          box-shadow: 0 8px 24px rgba(11, 107, 97, 0.15);
        }

        .profile-image-container {
          position: relative;
          display: inline-block;
          margin-bottom: 1.5rem;
        }

        .left-card img {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          border: 4px solid #0b6b61;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(11, 107, 97, 0.2);
          object-fit: cover;
        }

        .profile-image-container:hover img {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(11, 107, 97, 0.3);
        }

        .camera-overlay {
          position: absolute;
          bottom: 0;
          right: 0;
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: 3px solid white;
        }

        .camera-overlay:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(11, 107, 97, 0.4);
        }

        .camera-overlay svg {
          color: white;
          font-size: 1rem;
        }

        .hidden-file-input {
          display: none;
        }

        .patient-name {
          font-size: 1.6rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .patient-id {
          color: #0b6b61;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          padding: 0.4rem 1rem;
          background: rgba(11, 107, 97, 0.1);
          border-radius: 20px;
          display: inline-block;
        }

        .div-line {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(11, 107, 97, 0.2), transparent);
          margin: 1.25rem 0;
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0.75rem 0;
          padding: 0.65rem;
          border-radius: 10px;
          transition: all 0.2s ease;
        }

        .info-row:hover {
          background: rgba(11, 107, 97, 0.05);
        }

        .info-text {
          font-size: 0.95rem;
          font-weight: 500;
          color: #374151;
          flex: 1;
          text-align: left;
        }

        .info-input {
          flex: 1;
          padding: 0.5rem;
          border: 2px solid rgba(11, 107, 97, 0.3);
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 500;
          color: #374151;
        }

        .info-input:focus {
          outline: none;
          border-color: #0b6b61;
          box-shadow: 0 0 0 3px rgba(11, 107, 97, 0.1);
        }

        .info-icon {
          font-size: 1.2rem;
          color: #0b6b61;
          min-width: 20px;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          margin-top: 1.5rem;
        }

        .password-btn, .edit-btn, .save-btn, .cancel-btn, .activity-btn {
          padding: 0.75rem 1.5rem;
          flex: 1;
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .password-btn {
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
        }

        .edit-btn {
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
        }

        .save-btn {
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
        }

        .cancel-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .activity-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          width: 100%;
        }

        .password-btn:hover, .edit-btn:hover, .save-btn:hover, .cancel-btn:hover, .activity-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        .right-column {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          align-content: start;
        }

        .section-card {
          background: white;
          padding: 1.75rem;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          position: relative;
          border-top: 3px solid #0b6b61;
        }

        .section-card:hover {
          box-shadow: 0 8px 24px rgba(11, 107, 97, 0.15);
          transform: translateY(-4px);
        }

        .section-card h2 {
          text-align: left;
          margin-bottom: 1.25rem;
          color: #0b6b61;
          font-size: 1.2rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
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
          background: linear-gradient(135deg, rgba(11, 107, 97, 0.05) 0%, rgba(19, 161, 137, 0.05) 100%);
          border-radius: 12px;
          transition: all 0.2s ease;
          border: 1px solid rgba(11, 107, 97, 0.1);
        }

        .stat-item:hover {
          background: linear-gradient(135deg, rgba(11, 107, 97, 0.1) 0%, rgba(19, 161, 137, 0.1) 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(11, 107, 97, 0.1);
        }

        .stat-number {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0b6b61;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 500;
        }

        .activity-timeline {
          max-height: 400px;
          overflow-y: auto;
          padding-right: 10px;
        }

        .activity-timeline::-webkit-scrollbar {
          width: 6px;
        }

        .activity-timeline::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .activity-timeline::-webkit-scrollbar-thumb {
          background: #0b6b61;
          border-radius: 10px;
        }

        .activity-timeline::-webkit-scrollbar-thumb:hover {
          background: #09584f;
        }
      `}</style>

      <div className="profile-page-container">
        <Sidebar />

        <div className="profile-content">
          <div className="profile-header">
            <h1 className="profile-title">
              <span>👤</span> Patient Profile
            </h1>
            <p className="profile-subtitle">Manage your personal information and account settings</p>
          </div>

          <div className="profile-grid">
            <div className="left-card">
              <div className="profile-image-container">
                <img 
                  src={profileData.profilePicture || patientImage} 
                  alt="profile" 
                />
                {editMode && (
                  <>
                    <div 
                      className="camera-overlay"
                      onClick={() => document.getElementById('profile-picture-input').click()}
                    >
                      <BsCamera />
                    </div>
                    <input
                      id="profile-picture-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePictureUpload}
                      className="hidden-file-input"
                    />
                  </>
                )}
              </div>

              {editMode ? (
                <>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    className="info-input"
                    style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: '700' }}
                  />
                </>
              ) : (
                <h3 className="patient-name">{patient.name}</h3>
              )}
              
              <div className="patient-id">Patient ID: {patient._id?.slice(-8) || 'N/A'}</div>

              <div className="div-line"></div>

              <div className="info-row">
                <BsFillTelephoneFill className="info-icon" />
                {editMode ? (
                  <input
                    type="text"
                    name="phonenum"
                    value={profileData.phonenum}
                    onChange={handleProfileChange}
                    className="info-input"
                  />
                ) : (
                  <p className="info-text">{patient.phonenum}</p>
                )}
              </div>

              <div className="info-row">
                <MdEmail className="info-icon" />
                <p className="info-text">{patient.email}</p>
              </div>

              <div className="info-row">
                <FaBirthdayCake className="info-icon" />
                <p className="info-text">{formattedDob}</p>
              </div>

              {editMode ? (
                <div className="action-buttons">
                  <button className="save-btn" onClick={handleProfileSave} disabled={confirmLoading}>
                    <FaSave /> {confirmLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button className="cancel-btn" onClick={handleCancel}>
                    <FaTimes /> Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="action-buttons">
                    <button className="password-btn" onClick={showModal}>
                      🔒 Password
                    </button>
                    <button className="edit-btn" onClick={() => setEditMode(true)}>
                      <MdEdit /> Edit
                    </button>
                  </div>
                  <button className="activity-btn" onClick={fetchActivityHistory} disabled={loadingActivity}>
                    <MdHistory /> {loadingActivity ? 'Loading...' : 'Activity History'}
                  </button>
                </>
              )}
            </div>

            <div className="right-column">
              <div className="section-card">
                <h2>📋 Personal Information</h2>

                <div className="info-row">
                  <TbGenderBigender className="info-icon" />
                  <p className="info-text">{patient.gender}</p>
                </div>

                <div className="info-row">
                  <GiAges className="info-icon" />
                  <p className="info-text">{patient.age} years old</p>
                </div>

                <div className="info-row">
                  <MdBloodtype className="info-icon" />
                  <p className="info-text">{patient.bloodgroup}</p>
                </div>

                <div className="info-row">
                  <BsHouseFill className="info-icon" />
                  {editMode ? (
                    <input
                      type="text"
                      name="address"
                      value={profileData.address}
                      onChange={handleProfileChange}
                      className="info-input"
                      placeholder="Enter address"
                    />
                  ) : (
                    <p className="info-text">{patient.address}</p>
                  )}
                </div>

                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-number">A+</div>
                    <div className="stat-label">Health Grade</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{activityData?.appointments?.length || 0}</div>
                    <div className="stat-label">Total Visits</div>
                  </div>
                </div>
              </div>

              <div className="section-card">
                <h2>🏥 Hospital Information</h2>

                <div className="info-row">
                  <BiTime className="info-icon" />
                  <p className="info-text">09:00 AM – 08:00 PM</p>
                </div>

                <div className="info-row">
                  <FaRegHospital className="info-icon" />
                  <p className="info-text">IGMC Shimla</p>
                </div>

                <div className="info-row">
                  <FaMapMarkedAlt className="info-icon" />
                  <p className="info-text">Shimla, Himachal Pradesh</p>
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

      <Footer />

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

      <Modal
        title={
          <div style={{ 
            fontSize: '1.3rem', 
            fontWeight: '700', 
            color: '#667eea',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <MdHistory /> Activity History
          </div>
        }
        open={activityOpen}
        onCancel={handleCancel}
        width={800}
        style={{ top: 20 }}
        footer={[
          <button
            key="close"
            onClick={handleCancel}
            style={{
              padding: '8px 24px',
              border: 'none',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Close
          </button>
        ]}
      >
        {activityData && (
          <Tabs defaultActiveKey="1">
            <Tabs.TabPane tab={`Appointments (${activityData.appointments?.length || 0})`} key="1">
              <div className="activity-timeline">
                <Timeline>
                  {activityData.appointments?.length > 0 ? (
                    activityData.appointments.map((apt, idx) => (
                      <Timeline.Item key={idx} color="blue">
                        <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {new Date(apt.date).toLocaleDateString()} at {apt.time}
                        </p>
                        <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                          Doctor: {apt.doctorid?.name || 'N/A'}
                        </p>
                        <Tag color={apt.status === 'Completed' ? 'green' : apt.status === 'Cancelled' ? 'red' : 'blue'}>
                          {apt.status}
                        </Tag>
                      </Timeline.Item>
                    ))
                  ) : (
                    <p style={{ textAlign: 'center', color: '#999' }}>No appointments found</p>
                  )}
                </Timeline>
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane tab={`Medical Reports (${activityData.reports?.length || 0})`} key="2">
              <div className="activity-timeline">
                <Timeline>
                  {activityData.reports?.length > 0 ? (
                    activityData.reports.map((report, idx) => (
                      <Timeline.Item key={idx} color="green">
                        <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {new Date(report.date).toLocaleDateString()}
                        </p>
                        <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                          Disease: {report.disease}
                        </p>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>
                          Doctor: {report.doctorid?.name || 'N/A'}
                        </p>
                      </Timeline.Item>
                    ))
                  ) : (
                    <p style={{ textAlign: 'center', color: '#999' }}>No medical reports found</p>
                  )}
                </Timeline>
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane tab={`Lab Tests (${activityData.labReports?.length || 0})`} key="3">
              <div className="activity-timeline">
                <Timeline>
                  {activityData.labReports?.length > 0 ? (
                    activityData.labReports.map((lab, idx) => (
                      <Timeline.Item key={idx} color="purple">
                        <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {lab.testName}
                        </p>
                        <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                          {new Date(lab.preferredDate).toLocaleDateString()}
                        </p>
                        <Tag color={
                          lab.status === 'Completed' ? 'green' : 
                          lab.status === 'Processing' ? 'blue' : 
                          lab.status === 'Cancelled' ? 'red' : 'orange'
                        }>
                          {lab.status}
                        </Tag>
                        {lab.homeService && <Tag color="cyan">Home Service</Tag>}
                      </Timeline.Item>
                    ))
                  ) : (
                    <p style={{ textAlign: 'center', color: '#999' }}>No lab tests found</p>
                  )}
                </Timeline>
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane tab={`Prescriptions (${activityData.prescriptions?.length || 0})`} key="4">
              <div className="activity-timeline">
                <Timeline>
                  {activityData.prescriptions?.length > 0 ? (
                    activityData.prescriptions.map((presc, idx) => (
                      <Timeline.Item key={idx} color="orange">
                        <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          Prescription #{presc.prescriptionNumber}
                        </p>
                        <p style={{ color: '#666', marginBottom: '0.25rem' }}>
                          {new Date(presc.createdAt).toLocaleDateString()}
                        </p>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>
                          Doctor: {presc.doctorid?.name || 'N/A'}
                        </p>
                        <p style={{ color: '#666', fontSize: '0.85rem' }}>
                          Medications: {presc.medications?.length || 0}
                        </p>
                      </Timeline.Item>
                    ))
                  ) : (
                    <p style={{ textAlign: 'center', color: '#999' }}>No prescriptions found</p>
                  )}
                </Timeline>
              </div>
            </Tabs.TabPane>
          </Tabs>
        )}
      </Modal>
    </>
  );
};

export default Patient_Profile;
