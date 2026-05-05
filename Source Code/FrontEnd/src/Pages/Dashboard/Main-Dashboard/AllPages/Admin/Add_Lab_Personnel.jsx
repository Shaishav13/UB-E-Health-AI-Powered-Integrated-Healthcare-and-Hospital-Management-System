import React, { useState } from "react";
import labAvatar from "../../../../../img/doctoravatar.png";
import { useSelector } from "react-redux";
import Sidebar from "../../GlobalFiles/Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Navigate } from "react-router-dom";
import axios from "axios";
import Footer from "../../../../../Components/Footer";

const notify = (text) => toast(text);

const AddLabPersonnel = () => {
  const { data } = useSelector((store) => store.auth);
  const [loading, setLoading] = useState(false);

  const initData = {
    name: "",
    email: "",
    phoneNum: "",
    age: "",
    gender: "",
    bloodGroup: "",
    DOB: "",
    address: "",
    specialization: "",
    qualification: "",
    password: "",
  };

  const [labPersonnelValue, setLabPersonnelValue] = useState(initData);
  const [passwordStrength, setPasswordStrength] = useState("");

  const HandleLabPersonnelChange = (e) => {
    const { name, value } = e.target;
    setLabPersonnelValue({ ...labPersonnelValue, [name]: value });

    // Check password strength
    if (name === "password") {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    if (password.length === 0) {
      setPasswordStrength("");
      return;
    }
    if (password.length < 6) {
      setPasswordStrength("weak");
      return;
    }
    if (password.length >= 6 && password.length < 10) {
      setPasswordStrength("medium");
      return;
    }
    if (password.length >= 10) {
      setPasswordStrength("strong");
      return;
    }
  };

  const HandleLabPersonnelSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = data?.token;
      const response = await axios.post(
        "http://127.0.0.1:3001/lab-personnel/add",
        labPersonnelValue,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (response.data.message === "Lab personnel added successfully") {
        notify(`Lab Personnel Added Successfully! Lab ID: ${response.data.labId} ✔`);
        notify("Login credentials sent via email ✔");
        setLabPersonnelValue(initData);
        setPasswordStrength("");
      }
    } catch (error) {
      console.error("Error adding lab personnel:", error);
      
      if (error.response?.status === 409) {
        notify("Lab personnel with this email already exists");
      } else if (error.response?.data?.error) {
        notify(error.response.data.error);
      } else {
        notify("Something went wrong. Please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "admin") return <Navigate to="/dashboard" />;

  return (
    <>
      <ToastContainer />

      {/* ---------- INLINE MODERN CSS ---------- */}
      <style>
        {`
          .add-lab-page {
            display: flex;
            align-items: flex-start !important;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
            position: relative;
          }

          .add-lab-page::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="lab-pattern" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="2" fill="rgba(11,107,97,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23lab-pattern)"/></svg>');
            pointer-events: none;
          }

          .add-lab-content {
            margin: 0 !important;
            padding: 2rem 1.5rem !important;
            flex: 1;
            position: relative;
            z-index: 1;
          }

          .add-lab-title {
            font-size: 2.25rem;
            font-weight: 800;
            background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 0 0 1.5rem 0;
            letter-spacing: -0.02em;
            text-align: center;
          }

          .add-lab-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            padding: 2.5rem;
            border-radius: 22px;
            max-width: 800px;
            margin: 0 auto;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .add-lab-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
            border-radius: 22px 22px 0 0;
          }

          .lab-avatar {
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

          .password-strength {
            margin-top: 0.5rem;
            font-size: 0.875rem;
            font-weight: 600;
          }

          .password-strength.weak {
            color: #dc3545;
          }

          .password-strength.medium {
            color: #ffc107;
          }

          .password-strength.strong {
            color: #28a745;
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

          .submit-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #09584f, #0e8573);
            transform: translateY(-3px);
            box-shadow: 0 8px 18px rgba(0,0,0,0.14);
          }

          .submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          @media (max-width: 768px) {
            .add-lab-content {
              padding: 1.5rem 1rem;
            }

            .add-lab-title {
              font-size: 1.5rem;
            }

            .add-lab-card {
              padding: 1.5rem;
            }
          }
        `}
      </style>

      {/* ---------- PAGE LAYOUT ---------- */}
      <div className="add-lab-page">
        <Sidebar />

        <div className="add-lab-content">
          <h1 className="add-lab-title">🧪 Add Lab Personnel</h1>

          <div className="add-lab-card">
            <img src={labAvatar} alt="lab personnel avatar" className="lab-avatar" />

            <form onSubmit={HandleLabPersonnelSubmit}>
              {/* --- Name --- */}
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  required
                  value={labPersonnelValue.name}
                  onChange={HandleLabPersonnelChange}
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
                  value={labPersonnelValue.email}
                  onChange={HandleLabPersonnelChange}
                />
              </div>

              {/* --- Phone --- */}
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phoneNum"
                  placeholder="Contact Number"
                  required
                  value={labPersonnelValue.phoneNum}
                  onChange={HandleLabPersonnelChange}
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
                  min="18"
                  max="70"
                  value={labPersonnelValue.age}
                  onChange={HandleLabPersonnelChange}
                />
              </div>

              {/* --- Gender --- */}
              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={labPersonnelValue.gender}
                  onChange={HandleLabPersonnelChange}
                  required
                >
                  <option value="">Choose Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* --- Blood Group --- */}
              <div className="form-group">
                <label>Blood Group</label>
                <select
                  name="bloodGroup"
                  required
                  value={labPersonnelValue.bloodGroup}
                  onChange={HandleLabPersonnelChange}
                >
                  <option value="">Select Blood Group</option>
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                  <option>O+</option>
                  <option>O-</option>
                </select>
              </div>

              {/* --- DOB --- */}
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="DOB"
                  required
                  value={labPersonnelValue.DOB}
                  onChange={HandleLabPersonnelChange}
                />
              </div>

              {/* --- Address --- */}
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Full Address"
                  required
                  value={labPersonnelValue.address}
                  onChange={HandleLabPersonnelChange}
                />
              </div>

              {/* --- Specialization --- */}
              <div className="form-group">
                <label>Specialization</label>
                <select
                  name="specialization"
                  required
                  value={labPersonnelValue.specialization}
                  onChange={HandleLabPersonnelChange}
                >
                  <option value="">Select Specialization</option>
                  <option>Hematology</option>
                  <option>Biochemistry</option>
                  <option>Microbiology</option>
                  <option>Pathology</option>
                  <option>Clinical Chemistry</option>
                  <option>Immunology</option>
                  <option>Molecular Biology</option>
                  <option>Cytology</option>
                  <option>Histopathology</option>
                </select>
              </div>

              {/* --- Qualification --- */}
              <div className="form-group">
                <label>Qualification</label>
                <input
                  type="text"
                  name="qualification"
                  placeholder="e.g., B.Sc MLT, M.Sc Microbiology"
                  required
                  value={labPersonnelValue.qualification}
                  onChange={HandleLabPersonnelChange}
                />
              </div>

              {/* --- Password --- */}
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  required
                  minLength="6"
                  value={labPersonnelValue.password}
                  onChange={HandleLabPersonnelChange}
                />
                {passwordStrength && (
                  <div className={`password-strength ${passwordStrength}`}>
                    Password Strength: {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                  </div>
                )}
              </div>

              {/* --- Submit Button --- */}
              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? "Adding Lab Personnel..." : "Add Lab Personnel"}
              </button>
            </form>
          </div>
        </div>
      </div>
    <Footer />
      </>
  );
};

export default AddLabPersonnel;
