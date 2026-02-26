import React, { useEffect, useState } from "react";
import { BiTime } from "react-icons/bi";
import { GiAges, GiMeditation } from "react-icons/gi";
import { MdEmail } from "react-icons/md";
import { BsFillTelephoneFill, BsHouseFill, BsGenderAmbiguous } from "react-icons/bs";
import { FaRegHospital, FaMapMarkedAlt, FaBirthdayCake } from "react-icons/fa";
import Sidebar from "../../GlobalFiles/Sidebar";
import { useDispatch, useSelector } from "react-redux";
import { message, Modal } from "antd";
import { UpdateAdmin } from "../../../../../Redux/auth/action";
import { GetAdminDetails } from "../../../../../Redux/Datas/action";
import { Navigate } from "react-router-dom";
import adminImage from "../../../../../img/profile.png";
import Footer from "../../../../../Components/Footer";

const Admin_Profile = () => {
  const { data } = useSelector((store) => store.auth);
  const { admins, loading, error: dataError } = useSelector((store) => store.data);
  const dispatch = useDispatch();

  // Fix: Add proper null checks and error handling
  const admin = admins && Array.isArray(admins) 
    ? admins.find((x) => x.email === data?.user?.email)
    : null;

  // Debug logging
  useEffect(() => {
    console.log("Admin Profile Debug:");
    console.log("Auth data:", JSON.stringify(data, null, 2));
    console.log("Admins from Redux:", admins);
    console.log("Found admin:", admin);
    console.log("User email:", data?.user?.email);
    console.log("User object:", JSON.stringify(data?.user, null, 2));
  }, [data, admins, admin]);

  useEffect(() => {
    dispatch(GetAdminDetails());
  }, [dispatch]);

  // password state
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const [msgApi, contextHolder] = message.useMessage();

  const success = (t) => msgApi.success(t);
  const error = (t) => msgApi.error(t);

  const submitPassword = () => {
    if (formData.oldPassword !== data?.user?.password)
      return error("Old password incorrect");

    if (formData.newPassword === data?.user?.password)
      return error("New password cannot be same as old");

    if (formData.newPassword !== formData.confirmNewPassword)
      return error("Passwords do not match");

    setConfirmLoading(true);

    dispatch(UpdateAdmin(data.user._id, { password: formData.newPassword }, data.token))
      .then((res) => {
        if (res.message === "password updated") {
          success("Password updated successfully");
          setOpen(false);
        } else error("Something went wrong");
      })
      .finally(() => setConfirmLoading(false));
  };

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user?.userType !== "admin") return <Navigate to="/dashboard" />;

  // -------------------- LOADING STATE --------------------
  if (loading) {
    return (
      <div className="profile-page">
        <Sidebar />
        <div className="profile-container">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh',
            fontSize: '1.2rem',
            color: '#0b6b61'
          }}>
            Loading admin profile...
          </div>
        </div>
      </div>
    );
  }

  // -------------------- ERROR STATE --------------------
  if (dataError || (!admin && !loading)) {
    return (
      <div className="profile-page">
        <Sidebar />
        <div className="profile-container">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh',
            fontSize: '1.2rem',
            color: '#dc3545'
          }}>
            <p>Unable to load admin profile</p>
            <p style={{ fontSize: '1rem', color: '#666' }}>
              Debug info: {admins ? `Found ${admins.length} admins` : 'No admins data'}, 
              User email: {data?.user?.email || 'No email'}
            </p>
            <button 
              onClick={() => dispatch(GetAdminDetails())}
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

  const formattedDob = admin?.dob ? new Date(admin.dob).toLocaleDateString("en-US") : "Not available";

  return (
    <>
      {contextHolder}

      {/* ======== INLINE CSS ======== */}
      <style>
        {`
          .profile-page {
            display: flex;
            min-height: 100vh;
            background: #f5f7f8;
          }

          .profile-container {
            flex: 1;
            padding: 2.5rem;
          }

          .profile-wrapper {
            display: flex;
            gap: 2rem;
            flex-wrap: wrap;
            justify-content: center;
          }

          .profile-card {
            background: white;
            padding: 2rem;
            width: 320px;
            border-radius: 22px;
            box-shadow: 0 4px 18px rgba(0,0,0,0.1);
            transition: .25s ease;
            text-align: center;
          }

          .profile-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 26px rgba(0,0,0,0.15);
          }

          .profile-card img {
            width: 130px;
            border-radius: 50%;
            margin-bottom: 1rem;
            filter: drop-shadow(0 4px 10px rgba(0,0,0,0.18));
          }

          .profile-title {
            font-size: 2rem;
            color: #0b6b61;
            font-weight: 700;
            margin-bottom: 1.5rem;
          }

          .info-item {
            display: flex;
            align-items: center;
            gap: .8rem;
            margin: .75rem 0;
            font-size: 1.05rem;
            color: #444;
          }

          .info-item svg {
            font-size: 1.4rem;
            color: #0b6b61;
          }

          .section-card {
            background: white;
            padding: 2rem;
            flex: 1;
            border-radius: 22px;
            min-width: 350px;
            max-width: 520px;
            box-shadow: 0 4px 18px rgba(0,0,0,0.1);
            transition: .25s ease;
          }

          .section-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 26px rgba(0,0,0,0.15);
          }

          .section-card h2 {
            text-align: center;
            margin-bottom: 1.2rem;
            font-weight: 700;
            color: #0b6b61;
          }

          .change-btn {
            padding: .7rem 1.1rem;
            margin-top: 1rem;
            background: linear-gradient(135deg, #0b6b61, #13a189);
            border: none;
            border-radius: 12px;
            color: white;
            cursor: pointer;
            font-weight: 600;
            transition: .25s ease;
          }

          .change-btn:hover {
            background: linear-gradient(135deg, #09584f, #0f8571);
            transform: translateY(-3px);
          }

          .input-modal {
            display: flex;
            flex-direction: column;
            gap: .8rem;
          }

          .input-modal input {
            padding: .8rem;
            font-size: 1rem;
            border-radius: 12px;
            border: 2px solid #d0dada;
            transition: .25s ease;
          }

          .input-modal input:focus {
            border-color: #0b6b61;
            outline: none;
            box-shadow: 0 0 0 3px rgba(11,107,97,0.18);
          }
        `}
      </style>

      {/* ======== PAGE LAYOUT ======== */}
      <div className="profile-page">
        <Sidebar />

        <div className="profile-container">
          <h1 className="profile-title">Admin Profile</h1>

          <div className="profile-wrapper">
            {/* LEFT CARD */}
            <div className="profile-card">
              <img src={adminImage} alt="Admin" />

              <div className="info-item">
                <GiMeditation /> <p>{admin?.name || "Not available"}</p>
              </div>

              <div className="info-item">
                <BsFillTelephoneFill /> <p>{admin?.phonenum || admin?.phoneNum || "Not available"}</p>
              </div>

              <div className="info-item">
                <MdEmail /> <p>{admin?.email || "Not available"}</p>
              </div>

              <div className="info-item">
                <FaBirthdayCake /> <p>{formattedDob}</p>
              </div>

              <button className="change-btn" onClick={() => setOpen(true)}>
                Change Password
              </button>
            </div>

            {/* RIGHT SECTION - Info */}
            <div className="section-card">
              <h2>Personal Information</h2>

              <div className="info-item">
                <BsGenderAmbiguous /> <p>{admin?.gender || "Not specified"}</p>
              </div>

              <div className="info-item">
                <GiAges /> <p>{admin?.age || "Not specified"}</p>
              </div>

              <div className="info-item">
                <BsHouseFill /> <p>{admin?.address || "Not provided"}</p>
              </div>
            </div>

            {/* HOSPITAL INFO */}
            <div className="section-card">
              <h2>Hospital Details</h2>

              <div className="info-item">
                <BiTime /> <p>09:00 AM - 08:00 PM</p>
              </div>

              <div className="info-item">
                <FaRegHospital /> <p>IGMC Shimla</p>
              </div>

              <div className="info-item">
                <FaMapMarkedAlt />
                <p>Shimla, Himachal Pradesh, India</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PASSWORD MODAL */}
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
        confirmLoading={confirmLoading}
        onOk={submitPassword}
        onCancel={() => setOpen(false)}
        okText="Update Password"
        cancelText="Cancel"
        width={500}
        style={{ top: 20 }}
      >
        <style>{`
          .admin-password-form {
            padding: 1rem 0;
          }

          .admin-password-input-group {
            margin-bottom: 1.2rem;
          }

          .admin-password-label {
            display: block;
            font-size: 0.9rem;
            font-weight: 600;
            color: #0b6b61;
            margin-bottom: 0.5rem;
          }

          .admin-password-input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background: #f9fafb;
          }

          .admin-password-input:focus {
            outline: none;
            border-color: #0b6b61;
            background: white;
            box-shadow: 0 0 0 3px rgba(11, 107, 97, 0.1);
          }

          .admin-password-requirements {
            background: linear-gradient(135deg, #e8f5f3, #f0f9f7);
            padding: 1rem;
            border-radius: 10px;
            margin-top: 1rem;
            border-left: 4px solid #0b6b61;
          }

          .admin-password-requirements h4 {
            margin: 0 0 0.5rem 0;
            font-size: 0.9rem;
            color: #0b6b61;
            font-weight: 600;
          }

          .admin-password-requirements ul {
            margin: 0;
            padding-left: 1.2rem;
            font-size: 0.85rem;
            color: #666;
          }

          .admin-password-requirements li {
            margin: 0.3rem 0;
          }
        `}</style>

        <div className="admin-password-form">
          <div className="admin-password-input-group">
            <label className="admin-password-label">Current Password</label>
            <input 
              name="oldPassword" 
              placeholder="Enter your current password" 
              type="password" 
              onChange={handleChange}
              className="admin-password-input"
              required
            />
          </div>

          <div className="admin-password-input-group">
            <label className="admin-password-label">New Password</label>
            <input 
              name="newPassword" 
              placeholder="Enter your new password" 
              type="password" 
              onChange={handleChange}
              className="admin-password-input"
              required
            />
          </div>

          <div className="admin-password-input-group">
            <label className="admin-password-label">Confirm New Password</label>
            <input 
              name="confirmNewPassword" 
              placeholder="Re-enter your new password" 
              type="password" 
              onChange={handleChange}
              className="admin-password-input"
              required
            />
          </div>

          <div className="admin-password-requirements">
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
    <Footer />
      </>
  );
};

export default Admin_Profile;
