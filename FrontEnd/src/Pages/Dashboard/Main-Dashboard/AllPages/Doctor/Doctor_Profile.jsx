import React, { useEffect, useState } from "react";
import { BiMoney, BiTime } from "react-icons/bi";
import { MdCastForEducation, MdEmail, MdEdit } from "react-icons/md";
import { BsFillTelephoneFill, BsHouseFill, BsCamera } from "react-icons/bs";
import { AiFillClockCircle } from "react-icons/ai";
import { FaRegHospital, FaMapMarkedAlt, FaBirthdayCake, FaSave, FaTimes } from "react-icons/fa";
import Sidebar from "../../GlobalFiles/Sidebar";
import { useDispatch, useSelector } from "react-redux";
import { message, Modal } from "antd";
import { UpdateDoctor, availabilityRegister } from "../../../../../Redux/auth/action";
import { GetDoctorDetails } from "../../../../../Redux/Datas/action";
import { Navigate } from "react-router-dom";
import doctorImage from "../../../../../img/doctoravatar.png";
import { convertTo12Hour } from "../../../../../utils/timeFormat";
import Footer from "../../../../../Components/Footer";

const Doctor_Profile = () => {
  const { data } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const { doctors, loading, error: dataError } = useSelector((store) => store.data);

  const doctor = doctors && Array.isArray(doctors) 
    ? doctors.find((d) => d.email === data?.user?.email)
    : null;

  useEffect(() => {
    dispatch(GetDoctorDetails());
  }, [dispatch]);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();
  const success = (text) => messageApi.success(text);
  const error = (text) => messageApi.error(text);

  const [formData, setFormData] = useState({ oldPass: "", newPass: "", confirmNewPass: "" });
  const [availabilityForm, setAvailabilityForm] = useState({});
  const [profileData, setProfileData] = useState({
    name: "",
    phoneNum: "",
    address: "",
    education: "",
    fees: "",
    profilePicture: null,
  });

  useEffect(() => {
    if (doctor) {
      setProfileData({
        name: doctor.name || "",
        phoneNum: doctor.phoneNum || "",
        address: doctor.address || "",
        education: doctor.education || "",
        fees: doctor.fees || "",
        profilePicture: doctor.profilePicture || null,
      });
    }
  }, [doctor]);

  const showPassModal = () => {
    setFormData({ oldPass: "", newPass: "", confirmNewPass: "" });
    setDetailsOpen(true);
  };

  const showAvailabilityModal = () => {
    setAvailabilityForm({
      id: data?.user?.doctorId,
      MAS: "",
      MAE: "",
      EAS: "",
      EAE: "",
    });
    setAvailabilityOpen(true);
  };

  const handleCancel = () => {
    setAvailabilityOpen(false);
    setDetailsOpen(false);
    if (editMode) {
      setEditMode(false);
      setProfileData({
        name: doctor.name || "",
        phoneNum: doctor.phoneNum || "",
        address: doctor.address || "",
        education: doctor.education || "",
        fees: doctor.fees || "",
        profilePicture: doctor.profilePicture || null,
      });
    }
  };

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleAvailChange = (e) => setAvailabilityForm({ ...availabilityForm, [e.target.name]: e.target.value });
  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });

  const handlePictureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        error("Image size should be less than 1MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
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
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setProfileData({ ...profileData, profilePicture: compressedBase64 });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const submitPasswordChange = async () => {
    if (!formData.oldPass || !formData.newPass || !formData.confirmNewPass) {
      return error("All fields are required");
    }
    
    if (formData.newPass !== formData.confirmNewPass) {
      return error("New passwords do not match");
    }
    
    if (formData.oldPass === formData.newPass) {
      return error("New password must be different from old password");
    }

    setConfirmLoading(true);
    
    dispatch(
      UpdateDoctor(
        data.user.doctorId,
        {
          password: formData.newPass,
          oldPassword: formData.oldPass
        },
        data.token
      )
    ).then((res) => {
      setConfirmLoading(false);
      if (res.message === "password updated") {
        success("Password updated successfully");
        setDetailsOpen(false);
        setFormData({ oldPass: "", newPass: "", confirmNewPass: "" });
      } else if (res.message === "Incorrect old password") {
        error("Current password is incorrect");
      } else {
        error("Failed to update password");
      }
    }).catch((err) => {
      setConfirmLoading(false);
      error("Something went wrong. Please try again.");
    });
  };

  const handleProfileSave = () => {
    setConfirmLoading(true);
    
    dispatch(
      UpdateDoctor(
        data.user.doctorId,
        {
          name: profileData.name,
          phoneNum: profileData.phoneNum,
          address: profileData.address,
          education: profileData.education,
          fees: parseFloat(profileData.fees),
          profilePicture: profileData.profilePicture,
        },
        data.token
      )
    ).then((res) => {
      setConfirmLoading(false);
      if (res.message === "profile updated" || res.message === "password updated") {
        success("Profile updated successfully");
        setEditMode(false);
        dispatch(GetDoctorDetails());
      } else {
        error("Failed to update profile");
      }
    }).catch((err) => {
      setConfirmLoading(false);
      error("Something went wrong. Please try again.");
    });
  };

  const submitAvailability = () => {
    dispatch(availabilityRegister(availabilityForm)).then((res) => {
      if (res.message === "Successful") {
        success("Availability updated");
        setAvailabilityOpen(false);
        dispatch(GetDoctorDetails());
      } else error("Something went wrong");
    });
  };

  const dobDate = doctor?.DOB ? new Date(doctor.DOB) : null;
  const formattedDob = dobDate ? dobDate.toLocaleDateString("en-US") : "Not available";

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user?.userType !== "doctor") return <Navigate to="/dashboard" />;

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #e8f5f3 0%, #f0f9f7 100%)' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ fontSize: '1.2rem', color: '#0b6b61' }}>Loading doctor profile...</p>
        </div>
      </div>
    );
  }

  if (dataError || !doctor) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #e8f5f3 0%, #f0f9f7 100%)' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ fontSize: '1.2rem', color: '#dc3545', marginBottom: '1rem' }}>Unable to load doctor profile</p>
          <button 
            onClick={() => dispatch(GetDoctorDetails())}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0b6b61',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {contextHolder}

      <style>{`
        .doctor-profile-container {
          display: flex;
          background: linear-gradient(135deg, #e8f5f3 0%, #f0f9f7 100%);
          min-height: 100vh;
          position: relative;
        }

        .doctor-profile-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="medical-pattern" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M25 10 L25 40 M10 25 L40 25" stroke="rgba(11,107,97,0.03)" stroke-width="2" fill="none"/></pattern></defs><rect width="100" height="100" fill="url(%23medical-pattern)"/></svg>');
          pointer-events: none;
        }

        .doctor-main {
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

        .profile-wrapper {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        @media (max-width: 1024px) {
          .profile-wrapper {
            grid-template-columns: 1fr;
          }
        }

        .profile-card {
          background: white;
          padding: 2rem 1.5rem;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          text-align: center;
          transition: all 0.3s ease;
          border-top: 4px solid #0b6b61;
          height: fit-content;
        }

        .profile-card:hover {
          box-shadow: 0 8px 24px rgba(11, 107, 97, 0.15);
        }

        .profile-image-container {
          position: relative;
          display: inline-block;
          margin-bottom: 1.5rem;
        }

        .profile-img {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          border: 4px solid #0b6b61;
          object-fit: cover;
          box-shadow: 0 4px 12px rgba(11, 107, 97, 0.2);
          transition: all 0.3s ease;
        }

        .profile-image-container:hover .profile-img {
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

        .doctor-name {
          font-size: 1.6rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .doctor-id {
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

        .info-line {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem;
          font-size: 0.95rem;
          color: #374151;
          font-weight: 500;
          border-radius: 10px;
          transition: all 0.2s ease;
          margin: 0.75rem 0;
        }

        .info-line:hover {
          background: rgba(11, 107, 97, 0.05);
        }

        .info-icon {
          color: #0b6b61;
          font-size: 1.2rem;
          min-width: 20px;
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

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          margin-top: 1.5rem;
        }

        .action-btn {
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

        .availability-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          width: 100%;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .detail-card {
          background: white;
          padding: 1.75rem;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          border-top: 3px solid #0b6b61;
        }

        .detail-card:hover {
          box-shadow: 0 8px 24px rgba(11, 107, 97, 0.15);
          transform: translateY(-4px);
        }

        .detail-title {
          font-weight: 700;
          font-size: 1.2rem;
          margin-bottom: 1.25rem;
          color: #0b6b61;
          text-align: left;
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
      `}</style>

      <div className="doctor-profile-container">
        <Sidebar />

        <div className="doctor-main">
          <div className="profile-header">
            <h1 className="profile-title">
              <span>👨‍⚕️</span> Doctor Profile
            </h1>
            <p className="profile-subtitle">Manage your professional information and account settings</p>
          </div>

          <div className="profile-wrapper">
            <div className="profile-card">
              <div className="profile-image-container">
                <img 
                  src={profileData.profilePicture || data?.user?.image || doctorImage} 
                  alt="doctor" 
                  className="profile-img" 
                />
                {editMode && (
                  <>
                    <div 
                      className="camera-overlay"
                      onClick={() => document.getElementById('doctor-profile-picture-input').click()}
                    >
                      <BsCamera />
                    </div>
                    <input
                      id="doctor-profile-picture-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePictureUpload}
                      className="hidden-file-input"
                    />
                  </>
                )}
              </div>

              {editMode ? (
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="info-input"
                  style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '1.4rem', fontWeight: '700' }}
                />
              ) : (
                <h3 className="doctor-name">{doctor?.name || "Not available"}</h3>
              )}
              
              <div className="doctor-id">Doctor ID: {doctor?.doctorId || 'N/A'}</div>

              <div className="div-line"></div>

              <div className="info-line">
                <BsFillTelephoneFill className="info-icon" />
                {editMode ? (
                  <input
                    type="text"
                    name="phoneNum"
                    value={profileData.phoneNum}
                    onChange={handleProfileChange}
                    className="info-input"
                  />
                ) : (
                  <p>{doctor?.phoneNum || doctor?.phonenum || "Not available"}</p>
                )}
              </div>

              <div className="info-line">
                <MdEmail className="info-icon" />
                <p>{doctor?.email || "Not available"}</p>
              </div>

              <div className="info-line">
                <FaBirthdayCake className="info-icon" />
                <p>{formattedDob}</p>
              </div>

              {editMode ? (
                <div className="action-buttons">
                  <button className="action-btn save-btn" onClick={handleProfileSave} disabled={confirmLoading}>
                    <FaSave /> {confirmLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button className="action-btn cancel-btn" onClick={handleCancel}>
                    <FaTimes /> Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="action-buttons">
                    <button className="action-btn password-btn" onClick={showPassModal}>
                      🔒 Password
                    </button>
                    <button className="action-btn edit-btn" onClick={() => setEditMode(true)}>
                      <MdEdit /> Edit
                    </button>
                  </div>
                  <button className="action-btn availability-btn" onClick={showAvailabilityModal}>
                    🕐 Set Availability
                  </button>
                </>
              )}
            </div>

            <div className="details-grid">
              <div className="detail-card">
                <h2 className="detail-title">💼 Professional Info</h2>

                <div className="info-line">
                  <BiMoney className="info-icon" />
                  {editMode ? (
                    <input
                      type="number"
                      name="fees"
                      value={profileData.fees}
                      onChange={handleProfileChange}
                      className="info-input"
                      placeholder="Consultation fees"
                    />
                  ) : (
                    <p>{doctor?.fees ? `₹${doctor.fees}` : "Not set"}</p>
                  )}
                </div>

                <div className="info-line">
                  <AiFillClockCircle className="info-icon" />
                  <p>{doctor?.availability && Array.isArray(doctor.availability) && doctor.availability.length > 0 
                      ? doctor.availability.map(time => convertTo12Hour(time)).join("  |  ") 
                      : "Not set"}</p>
                </div>

                <div className="info-line">
                  <MdCastForEducation className="info-icon" />
                  {editMode ? (
                    <input
                      type="text"
                      name="education"
                      value={profileData.education}
                      onChange={handleProfileChange}
                      className="info-input"
                      placeholder="Education"
                    />
                  ) : (
                    <p>{doctor?.education || "Not specified"}</p>
                  )}
                </div>

                <div className="info-line">
                  <BsHouseFill className="info-icon" />
                  {editMode ? (
                    <input
                      type="text"
                      name="address"
                      value={profileData.address}
                      onChange={handleProfileChange}
                      className="info-input"
                      placeholder="Address"
                    />
                  ) : (
                    <p>{doctor?.address || "Not provided"}</p>
                  )}
                </div>

                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-number">{doctor?.department || 'N/A'}</div>
                    <div className="stat-label">Department</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{doctor?.age || 'N/A'}</div>
                    <div className="stat-label">Age</div>
                  </div>
                </div>
              </div>

              <div className="detail-card">
                <h2 className="detail-title">🏥 Hospital Details</h2>

                <div className="info-line">
                  <BiTime className="info-icon" />
                  <p>09:00 AM – 08:00 PM</p>
                </div>

                <div className="info-line">
                  <FaRegHospital className="info-icon" />
                  <p>IGMC Shimla</p>
                </div>

                <div className="info-line">
                  <FaMapMarkedAlt className="info-icon" />
                  <p>Shimla, Himachal Pradesh, India</p>
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
        open={detailsOpen}
        onOk={submitPasswordChange}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
        okText="Update Password"
        cancelText="Cancel"
        width={500}
        style={{ top: 20 }}
      >
        <style>{`
          .doctor-password-form {
            padding: 1rem 0;
          }

          .doctor-password-input-group {
            margin-bottom: 1.2rem;
          }

          .doctor-password-label {
            display: block;
            font-size: 0.9rem;
            font-weight: 600;
            color: #0b6b61;
            margin-bottom: 0.5rem;
          }

          .doctor-password-input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background: #f9fafb;
          }

          .doctor-password-input:focus {
            outline: none;
            border-color: #0b6b61;
            background: white;
            box-shadow: 0 0 0 3px rgba(11, 107, 97, 0.1);
          }

          .doctor-password-requirements {
            background: linear-gradient(135deg, #e8f5f3, #f0f9f7);
            padding: 1rem;
            border-radius: 10px;
            margin-top: 1rem;
            border-left: 4px solid #0b6b61;
          }

          .doctor-password-requirements h4 {
            margin: 0 0 0.5rem 0;
            font-size: 0.9rem;
            color: #0b6b61;
            font-weight: 600;
          }

          .doctor-password-requirements ul {
            margin: 0;
            padding-left: 1.2rem;
            font-size: 0.85rem;
            color: #666;
          }

          .doctor-password-requirements li {
            margin: 0.3rem 0;
          }
        `}</style>

        <div className="doctor-password-form">
          <div className="doctor-password-input-group">
            <label className="doctor-password-label">Current Password</label>
            <input
              name="oldPass"
              type="password"
              placeholder="Enter your current password"
              onChange={handleFormChange}
              className="doctor-password-input"
              required
            />
          </div>

          <div className="doctor-password-input-group">
            <label className="doctor-password-label">New Password</label>
            <input
              name="newPass"
              type="password"
              placeholder="Enter your new password"
              onChange={handleFormChange}
              className="doctor-password-input"
              required
            />
          </div>

          <div className="doctor-password-input-group">
            <label className="doctor-password-label">Confirm New Password</label>
            <input
              name="confirmNewPass"
              type="password"
              placeholder="Re-enter your new password"
              onChange={handleFormChange}
              className="doctor-password-input"
              required
            />
          </div>

          <div className="doctor-password-requirements">
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
            color: '#0b6b61',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🕐 Set Availability
          </div>
        }
        open={availabilityOpen}
        onOk={submitAvailability}
        onCancel={handleCancel}
        okText="Save Availability"
        cancelText="Cancel"
        width={550}
        style={{ top: 20 }}
      >
        <style>{`
          .availability-form {
            padding: 1rem 0;
          }

          .availability-section {
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border-radius: 12px;
            border-left: 4px solid #0b6b61;
          }

          .availability-section-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #0b6b61;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .availability-time-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }

          .availability-input-group {
            margin-bottom: 0;
          }

          .availability-label {
            display: block;
            font-size: 0.85rem;
            font-weight: 600;
            color: #666;
            margin-bottom: 0.5rem;
          }

          .availability-input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background: white;
          }

          .availability-input:focus {
            outline: none;
            border-color: #0b6b61;
            box-shadow: 0 0 0 3px rgba(11, 107, 97, 0.1);
          }

          .availability-info {
            background: linear-gradient(135deg, #e8f5f3, #f0f9f7);
            padding: 1rem;
            border-radius: 10px;
            margin-top: 1rem;
            border-left: 4px solid #0b6b61;
          }

          .availability-info h4 {
            margin: 0 0 0.5rem 0;
            font-size: 0.9rem;
            color: #0b6b61;
            font-weight: 600;
          }

          .availability-info p {
            margin: 0;
            font-size: 0.85rem;
            color: #666;
            line-height: 1.5;
          }
        `}</style>

        <div className="availability-form">
          <div className="availability-section">
            <div className="availability-section-title">
              🌅 Morning Availability
            </div>
            <div className="availability-time-group">
              <div className="availability-input-group">
                <label className="availability-label">Start Time</label>
                <input
                  name="MAS"
                  type="time"
                  onChange={handleAvailChange}
                  className="availability-input"
                  placeholder="09:00"
                />
              </div>
              <div className="availability-input-group">
                <label className="availability-label">End Time</label>
                <input
                  name="MAE"
                  type="time"
                  onChange={handleAvailChange}
                  className="availability-input"
                  placeholder="12:00"
                />
              </div>
            </div>
          </div>

          <div className="availability-section">
            <div className="availability-section-title">
              🌆 Evening Availability
            </div>
            <div className="availability-time-group">
              <div className="availability-input-group">
                <label className="availability-label">Start Time</label>
                <input
                  name="EAS"
                  type="time"
                  onChange={handleAvailChange}
                  className="availability-input"
                  placeholder="14:00"
                />
              </div>
              <div className="availability-input-group">
                <label className="availability-label">End Time</label>
                <input
                  name="EAE"
                  type="time"
                  onChange={handleAvailChange}
                  className="availability-input"
                  placeholder="18:00"
                />
              </div>
            </div>
          </div>

          <div className="availability-info">
            <h4>💡 Availability Guidelines:</h4>
            <p>
              Set your available time slots for patient appointments. 
              Patients will be able to book appointments during these hours. 
              You can update your availability anytime.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Doctor_Profile;
