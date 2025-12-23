import React, { useState } from "react";
import doctor from "../../../../../img/doctoravatar.png";
import { useDispatch, useSelector } from "react-redux";
import { DoctorRegister, mailCreds } from "../../../../../Redux/auth/action";
import Sidebar from "../../GlobalFiles/Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Navigate } from "react-router-dom";

const notify = (text) => toast(text);

const AddDoctor = () => {
  const { data } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const initData = {
    doctorName: "",
    phoneNum: "",
    email: "",
    age: "",
    gender: "",
    bloodGroup: "",
    DOB: "",
    address: "",
    education: "",
    department: "",
    fees: "",
  };

  const [doctorValue, setDoctorValue] = useState(initData);

  const HandleDoctorChange = (e) => {
    setDoctorValue({ ...doctorValue, [e.target.name]: e.target.value });
  };

  const HandleDoctorSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Map frontend field names to backend field names
    const doctorData = {
      name: doctorValue.doctorName,
      phoneNum: doctorValue.phoneNum,
      email: doctorValue.email,
      password: "Doctor2123", // Default password
      age: doctorValue.age,
      gender: doctorValue.gender,
      bloodGroup: doctorValue.bloodGroup,
      DOB: doctorValue.DOB,
      address: doctorValue.address,
      education: doctorValue.education,
      department: doctorValue.department,
      fees: doctorValue.fees,
    };

    dispatch(DoctorRegister(doctorData)).then((res) => {
      if (res.message === "Doctor already exists") {
        setLoading(false);
        return notify("Doctor Already Exists");
      }
      if (res.message === "error") {
        setLoading(false);
        return notify("Something went wrong. Please try again");
      }

      notify("Doctor Added ✔ Sending Login Details...");

      const payload = {
        email: res.email,
        userType: "doctor",
      };

      dispatch(mailCreds(payload)).then((info) => {
        if (info.message === "successful") {
          setLoading(false);
          return notify("Login Details Sent ✔");
        } else {
          setLoading(false);
          return notify("Error sending login details");
        }
      });

      setDoctorValue(initData);
    });
  };

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "admin") return <Navigate to="/dashboard" />;

  return (
    <>
      <ToastContainer />

      {/* ---------- INLINE MODERN CSS ---------- */}
      <style>
        {`
          .add-doc-page {
            display: flex;
            min-height: 100vh;
            background: #f5f7f8;
          }

          .add-doc-content {
            flex: 1;
            padding: 2.5rem 3rem;
          }

          .add-doc-title {
            font-size: 2rem;
            font-weight: 700;
            color: #0b6b61;
            margin-bottom: 1.5rem;
          }

          .add-doc-card {
            background: white;
            padding: 2rem;
            border-radius: 22px;
            max-width: 800px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.12);
            transition: .25s ease;
          }

          .add-doc-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 26px rgba(0,0,0,0.15);
          }

          .doctor-avatar {
            width: 130px;
            display: block;
            margin: 0 auto 1.5rem auto;
            filter: drop-shadow(0 4px 10px rgba(0,0,0,0.12));
          }

          .form-group {
            margin-bottom: 1.3rem;
          }

          .form-group label {
            font-weight: 600;
            color: #0b6b61;
            margin-bottom: .4rem;
            display: block;
          }

          .form-group input,
          .form-group select {
            width: 100%;
            padding: .75rem 1rem;
            font-size: 1rem;
            border-radius: 12px;
            border: 2px solid #d0dada;
            transition: .25s ease;
            background: white;
          }

          .form-group input:focus,
          .form-group select:focus {
            outline: none;
            border-color: #0b6b61;
            box-shadow: 0 0 0 3px rgba(11,107,97,0.15);
          }

          .submit-btn {
            width: 100%;
            padding: .9rem;
            background: linear-gradient(135deg, #0b6b61, #139b86);
            color: white;
            border: none;
            font-weight: 600;
            font-size: 1.1rem;
            border-radius: 14px;
            cursor: pointer;
            transition: .25s ease;
            margin-top: 1rem;
          }

          .submit-btn:hover {
            background: linear-gradient(135deg, #09584f, #0e8573);
            transform: translateY(-3px);
            box-shadow: 0 8px 18px rgba(0,0,0,0.14);
          }
        `}
      </style>

      {/* ---------- PAGE LAYOUT ---------- */}
      <div className="add-doc-page">
        <Sidebar />

        <div className="add-doc-content">
          <h1 className="add-doc-title">Add Doctor</h1>

          <div className="add-doc-card">
            <img src={doctor} alt="doctor avatar" className="doctor-avatar" />

            <form onSubmit={HandleDoctorSubmit}>
              {/* --- Doctor Name --- */}
              <div className="form-group">
                <label>Doctor Name</label>
                <input
                  type="text"
                  name="doctorName"
                  placeholder="Full Name"
                  required
                  value={doctorValue.doctorName}
                  onChange={HandleDoctorChange}
                />
              </div>

              {/* --- Age --- */}
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  name="age"
                  placeholder="Age"
                  required
                  value={doctorValue.age}
                  onChange={HandleDoctorChange}
                />
              </div>

              {/* --- Phone --- */}
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="number"
                  name="phoneNum"
                  placeholder="Contact Number"
                  required
                  value={doctorValue.phoneNum}
                  onChange={HandleDoctorChange}
                />
              </div>

              {/* --- Email --- */}
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="abc@xyz.com"
                  required
                  value={doctorValue.email}
                  onChange={HandleDoctorChange}
                />
              </div>

              {/* --- Gender --- */}
              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={doctorValue.gender}
                  onChange={HandleDoctorChange}
                  required
                >
                  <option value="">Choose Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>

              {/* --- Blood Group --- */}
              <div className="form-group">
                <label>Blood Group</label>
                <select
                  name="bloodGroup"
                  required
                  value={doctorValue.bloodGroup}
                  onChange={HandleDoctorChange}
                >
                  <option value="">Select</option>
                  <option>A+</option><option>A-</option>
                  <option>B+</option><option>B-</option>
                  <option>AB+</option><option>AB-</option>
                  <option>O+</option><option>O-</option>
                </select>
              </div>

              {/* --- DOB --- */}
              <div className="form-group">
                <label>Birthdate</label>
                <input
                  type="date"
                  name="DOB"
                  required
                  value={doctorValue.DOB}
                  onChange={HandleDoctorChange}
                />
              </div>

              {/* --- Address --- */}
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  required
                  value={doctorValue.address}
                  onChange={HandleDoctorChange}
                />
              </div>

              {/* --- Education --- */}
              <div className="form-group">
                <label>Education</label>
                <input
                  type="text"
                  name="education"
                  placeholder="MBBS / MD / etc"
                  required
                  value={doctorValue.education}
                  onChange={HandleDoctorChange}
                />
              </div>

              {/* --- Department --- */}
              <div className="form-group">
                <label>Department</label>
                <select
                  name="department"
                  required
                  value={doctorValue.department}
                  onChange={HandleDoctorChange}
                >
                  <option value="">Select</option>
                  <option>Cardiology</option>
                  <option>Neurology</option>
                  <option>ENT</option>
                  <option>Ophthalmologist</option>
                  <option>Anesthesiologist</option>
                  <option>Dermatologist</option>
                  <option>Oncologist</option>
                  <option>Psychiatrist</option>
                </select>
              </div>

              {/* --- Fees --- */}
              <div className="form-group">
                <label>Fees</label>
                <input
                  type="number"
                  name="fees"
                  placeholder="e.g. 500"
                  required
                  value={doctorValue.fees}
                  onChange={HandleDoctorChange}
                />
              </div>

              {/* --- Submit Button --- */}
              <button className="submit-btn" type="submit">
                {loading ? "Loading..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddDoctor;
