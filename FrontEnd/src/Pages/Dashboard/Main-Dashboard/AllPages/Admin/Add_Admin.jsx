import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AdminRegister, mailCreds } from "../../../../../Redux/auth/action";
import Sidebar from "../../GlobalFiles/Sidebar";
import admin from "../../../../../img/admin.jpg";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Navigate } from "react-router-dom";

const notify = (text) => toast(text);

const Add_Admin = () => {
  const { data } = useSelector((store) => store.auth);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);

  const InitData = {
    adminName: "",
    phoneNum: "",
    email: "",
    age: "",
    gender: "",
    DOB: "",
    address: "",
  };

  const [AdminValue, setAdminValue] = useState(InitData);

  const HandleAdminChange = (e) => {
    setAdminValue({ ...AdminValue, [e.target.name]: e.target.value });
  };

  const HandleAdminSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    dispatch(AdminRegister(AdminValue)).then((res) => {
      if (res.message === "Admin already exists") {
        setLoading(false);
        return notify("Admin Already Exists");
      }
      if (res.message === "error") {
        setLoading(false);
        return notify("Something went wrong. Please try again.");
      }

      notify("Admin Added. Sending login credentials...");

      const mailData = {
        email: res.email,
        userType: "admin",
      };

      dispatch(mailCreds(mailData)).then((res) => {
        setLoading(false);
        if (res.message === "successful") {
          notify("Credentials sent successfully.");
        } else {
          notify("Failed to send mail. Try again.");
        }
      });

      setAdminValue(InitData);
    });
  };

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "admin") return <Navigate to="/dashboard" />;

  return (
    <>
      <ToastContainer />

      {/* ---------------- Inline CSS ---------------- */}
      <style>
        {`
          .admin-page {
            display: flex;
            min-height: 100vh;
            background: #f5f7f8;
          }

          .admin-content {
            flex: 1;
            padding: 2.5rem 3rem;
          }

          h1.admin-title {
            color: #0b6b61;
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            text-shadow: 0px 1px 2px rgba(0,0,0,0.09);
          }

          .admin-card {
            width: 100%;
            max-width: 680px;
            background: #ffffff;
            padding: 2rem;
            border-radius: 22px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.1);
            transition: .25s ease;
          }

          .admin-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 16px 26px rgba(0,0,0,0.15);
          }

          .admin-avatar {
            width: 140px;
            height: 140px;
            border-radius: 50%;
            object-fit: cover;
            display: block;
            margin: 0 auto 1.5rem auto;
            border: 4px solid #0b6b61;
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          }

          .form-group {
            margin-bottom: 1.3rem;
          }

          .form-group label {
            display: block;
            font-weight: 600;
            color: #0b6b61;
            margin-bottom: .4rem;
          }

          .form-group input,
          .form-group select {
            width: 100%;
            padding: .75rem 1rem;
            border-radius: 12px;
            border: 2px solid #d0dada;
            background: white;
            font-size: 1rem;
            color: #444;
            transition: .25s ease;
          }

          .form-group input:focus,
          .form-group select:focus {
            border-color: #0b6b61;
            box-shadow: 0 0 0 3px rgba(11, 107, 97, 0.15);
            outline: none;
          }

          .admin-submit-btn {
            width: 100%;
            margin-top: 1rem;
            padding: .9rem;
            border: none;
            border-radius: 14px;
            background: linear-gradient(135deg, #0b6b61, #139b86);
            color: white;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: .25s ease;
          }

          .admin-submit-btn:hover {
            background: linear-gradient(135deg, #0a5f56, #0f8775);
            transform: translateY(-3px);
            box-shadow: 0 8px 18px rgba(0,0,0,0.15);
          }
        `}
      </style>

      {/* ---------------- PAGE STRUCTURE ---------------- */}
      <div className="admin-page">
        <Sidebar />

        <div className="admin-content">
          <h1 className="admin-title">Add Admin</h1>

          <div className="admin-card">
            <img src={admin} alt="admin" className="admin-avatar" />

            <form onSubmit={HandleAdminSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="adminName"
                  placeholder="Full Name"
                  value={AdminValue.adminName}
                  onChange={HandleAdminChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  name="age"
                  placeholder="Age"
                  value={AdminValue.age}
                  onChange={HandleAdminChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Number</label>
                <input
                  type="number"
                  name="phoneNum"
                  placeholder="Phone Number"
                  value={AdminValue.phoneNum}
                  onChange={HandleAdminChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="example@mail.com"
                  value={AdminValue.email}
                  onChange={HandleAdminChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={AdminValue.gender}
                  onChange={HandleAdminChange}
                  required
                >
                  <option value="">Choose Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label>Birthdate</label>
                <input
                  type="date"
                  name="DOB"
                  value={AdminValue.DOB}
                  onChange={HandleAdminChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={AdminValue.address}
                  onChange={HandleAdminChange}
                  required
                />
              </div>

              <button type="submit" className="admin-submit-btn">
                {loading ? "Loading..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Add_Admin;
