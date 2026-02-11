import React, { useEffect, useState } from "react";
import { BiMoney, BiTime } from "react-icons/bi";
import { GiMeditation } from "react-icons/gi";
import { MdCastForEducation, MdEmail } from "react-icons/md";
import { BsFillTelephoneFill, BsHouseFill } from "react-icons/bs";
import { AiFillClockCircle } from "react-icons/ai";
import { FaRegHospital, FaMapMarkedAlt, FaBirthdayCake } from "react-icons/fa";
import Sidebar from "../../GlobalFiles/Sidebar";
import { useDispatch, useSelector } from "react-redux";
import { message, Modal } from "antd";
import { UpdateDoctor, availabilityRegister } from "../../../../../Redux/auth/action";
import { GetDoctorDetails } from "../../../../../Redux/Datas/action";
import { Navigate } from "react-router-dom";
import doctorImage from "../../../../../img/doctoravatar.png";
import { convertTo12Hour } from "../../../../../utils/timeFormat";

const Doctor_Profile = () => {
  const { data } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const { doctors, loading, error: dataError } = useSelector((store) => store.data);

  // Fix: Add proper null checks and error handling
  const doctor = doctors && Array.isArray(doctors) 
    ? doctors.find((d) => d.email === data?.user?.email)
    : null;

  useEffect(() => {
    dispatch(GetDoctorDetails());
  }, [dispatch]);

  // -------------------- MODAL STATES --------------------
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();
  const success = (text) => messageApi.success(text);
  const error = (text) => messageApi.error(text);

  const showPassModal = () => {
    setFormData({ oldPass: "", newPass: "", confirmNewPass: "" });
    setDetailsOpen(true);
  };

  const showAvailabilityModal = () => {
    setAvailabilityForm({
      id: data?.user?._id,
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
  };

  // -------------------- PASSWORD CHANGE --------------------
  const [formData, setFormData] = useState({});
  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
    
    try {
      // Send to backend to verify old password and update
      const response = await fetch(`http://127.0.0.1:3001/doctors/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: data.user.doctorId || data.user._id,
          oldPassword: formData.oldPass,
          newPassword: formData.newPass,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.message === "Password updated successfully") {
        success("Password updated successfully");
        setDetailsOpen(false);
        setFormData({ oldPass: "", newPass: "", confirmNewPass: "" });
      } else {
        error(result.error || "Failed to update password");
      }
    } catch (err) {
      console.error("Password change error:", err);
      error("Failed to update password. Please try again.");
    } finally {
      setConfirmLoading(false);
    }
  };

  // -------------------- AVAILABILITY CHANGE --------------------
  const [availabilityForm, setAvailabilityForm] = useState({});
  const handleAvailChange = (e) =>
    setAvailabilityForm({ ...availabilityForm, [e.target.name]: e.target.value });

  const submitAvailability = () => {
    dispatch(availabilityRegister(availabilityForm)).then((res) => {
      if (res.message === "Successful") {
        success("Availability updated");
        setAvailabilityOpen(false);
      } else error("Something went wrong");
    });
  };

  // -------------------- DOB FORMAT --------------------
  const dobDate = doctor?.dob ? new Date(doctor.dob) : null;
  const formattedDob = dobDate ? dobDate.toLocaleDateString("en-US") : "Not available";

  // -------------------- AUTH CHECK --------------------
  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user?.userType !== "doctor") return <Navigate to="/dashboard" />;

  // -------------------- LOADING STATE --------------------
  if (loading) {
    return (
      <div className="doctor-profile-container">
        <Sidebar />
        <div className="doctor-main">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh',
            fontSize: '1.2rem',
            color: '#0b6b61'
          }}>
            Loading doctor profile...
          </div>
        </div>
      </div>
    );
  }

  // -------------------- ERROR STATE --------------------
  if (dataError || !doctor) {
    return (
      <div className="doctor-profile-container">
        <Sidebar />
        <div className="doctor-main">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh',
            fontSize: '1.2rem',
            color: '#dc3545'
          }}>
            <p>Unable to load doctor profile</p>
            <button 
              onClick={() => dispatch(GetDoctorDetails())}
              style={{
                padding: '10px 20px',
                backgroundColor: '#0b6b61',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {contextHolder}

      {/* ----------- INLINE MODERN UI CSS ----------- */}
      <style>{`
        .doctor-profile-container {
          display: flex;
          min-height: 100vh;
          background: #f5f7f8;
        }

        .doctor-main {
          flex: 1;
          padding: 2rem 3rem;
        }

        .profile-wrapper {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        /* CARD */
        .profile-card {
          background: #ffffff;
          padding: 2rem;
          border-radius: 20px;
          width: 320px;
          height: fit-content;
          box-shadow: 0 4px 14px rgba(0,0,0,0.1);
          transition: 0.25s ease;
        }
        .profile-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 22px rgba(0,0,0,0.15);
        }

        .profile-img {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          object-fit: cover;
          display: block;
          margin: auto;
          border: 4px solid #0b6b61;
        }

        .info-line {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          font-size: 1rem;
          color: #444;
          font-weight: 600;
        }

        .info-icon {
          color: #0b6b61;
          font-size: 1.4rem;
        }

        .action-btn {
          width: 100%;
          margin-top: 1rem;
          padding: 10px;
          border-radius: 10px;
          border: none;
          background: #0b6b61;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: 0.25s;
        }
        .action-btn:hover {
          background: #0a5a52;
          transform: translateY(-2px);
        }

        /* RIGHT SIDE GRID */
        .details-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .detail-card {
          background: #fff;
          padding: 1.5rem;
          border-radius: 20px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.1);
          transition: .25s ease;
        }
        .detail-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 22px rgba(0,0,0,0.15);
        }

        .detail-title {
          font-weight: 700;
          font-size: 1.4rem;
          margin-bottom: .8rem;
          color: #0b6b61;
          text-align: center;
        }

      `}</style>

      {/* -------------------- PAGE STRUCTURE -------------------- */}
      <div className="doctor-profile-container">
        <Sidebar />

        <div className="doctor-main">
          <h1 style={{ color: "#0b6b61", fontWeight: "700", marginBottom: "1.5rem" }}>
            Doctor Profile
          </h1>

          <div className="profile-wrapper">

            {/* LEFT CARD */}
            <div className="profile-card">
              <img src={data?.user?.image || doctorImage} alt="doctor" className="profile-img" />

              <div className="info-line">
                <GiMeditation className="info-icon" />
                <p>{doctor?.name || "Not available"}</p>
              </div>

              <div className="info-line">
                <BsFillTelephoneFill className="info-icon" />
                <p>{doctor?.phonenum || doctor?.phoneNum || "Not available"}</p>
              </div>

              <div className="info-line">
                <MdEmail className="info-icon" />
                <p>{doctor?.email || "Not available"}</p>
              </div>

              <div className="info-line">
                <FaBirthdayCake className="info-icon" />
                <p>{formattedDob}</p>
              </div>

              <button className="action-btn" onClick={showPassModal}>Change Password</button>
              <button className="action-btn" onClick={showAvailabilityModal}>Set Availability</button>
            </div>

            {/* RIGHT DETAILS */}
            <div className="details-grid">

              {/* OTHER INFO */}
              <div className="detail-card">
                <h2 className="detail-title">Other Info</h2>

                <div className="info-line">
                  <BiMoney className="info-icon" />
                  <p>{doctor?.fees ? `${doctor.fees} Rs` : "Not set"}</p>
                </div>

                <div className="info-line">
                  <AiFillClockCircle className="info-icon" />
                  <p>{doctor?.availability && Array.isArray(doctor.availability) && doctor.availability.length > 0 
                      ? doctor.availability.map(time => convertTo12Hour(time)).join("  |  ") 
                      : "Not set"}</p>
                </div>

                <div className="info-line">
                  <MdCastForEducation className="info-icon" />
                  <p>{doctor?.department || "Not specified"}</p>
                </div>

                <div className="info-line">
                  <BsHouseFill className="info-icon" />
                  <p>{doctor?.address || "Not provided"}</p>
                </div>
              </div>

              {/* HOSPITAL INFO */}
              <div className="detail-card">
                <h2 className="detail-title">Hospital Details</h2>

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
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* -------- PASSWORD MODAL -------- */}
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

      {/* -------- AVAILABILITY MODAL -------- */}
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

          /* Modal Footer Buttons */
          .ant-modal-footer {
            border-top: 1px solid #f0f0f0;
            padding: 16px 24px;
            text-align: right;
          }

          .ant-modal-footer .ant-btn {
            height: 40px;
            padding: 0 20px;
            font-weight: 600;
            border-radius: 8px;
            font-size: 1rem;
          }

          .ant-modal-footer .ant-btn-default {
            border: 2px solid #d9d9d9;
            color: #666;
          }

          .ant-modal-footer .ant-btn-default:hover {
            border-color: #0b6b61;
            color: #0b6b61;
          }

          .ant-modal-footer .ant-btn-primary {
            background: linear-gradient(135deg, #0b6b61, #13a189) !important;
            border: none !important;
            color: white !important;
          }

          .ant-modal-footer .ant-btn-primary:hover {
            background: linear-gradient(135deg, #09584f, #0f8571) !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(11, 107, 97, 0.3);
          }
        `}</style>

        <div className="availability-form">
          {/* Morning Section */}
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

          {/* Evening Section */}
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

          {/* Info Box */}
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
