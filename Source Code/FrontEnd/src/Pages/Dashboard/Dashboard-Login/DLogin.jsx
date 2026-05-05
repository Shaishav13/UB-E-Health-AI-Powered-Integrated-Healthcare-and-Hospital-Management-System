import React, { useState } from "react";
import banner from "../../../img/banner.png";
import admin from "../../../img/admin.jpg";
import "./DLogin.css";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  AdminLogin,
  DoctorLogin,
  forgetPassword,
  patientLogin,
} from "../../../Redux/auth/action";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Drawer } from "antd";

const notify = (text) => toast(text);

// Detect user type from the identifier entered:
// - Contains "@"        → Patient (email login)
// - Starts with "L" or is numeric → Doctor / Lab personnel (ID login)
// - Equals "admin"     → Admin
const detectUserType = (id) => {
  const val = id.trim();
  if (!val) return null;
  if (val.toLowerCase() === "admin") return "admin";
  if (val.includes("@")) return "patient";
  // numeric or starts with L (lab)
  if (/^\d+$/.test(val) || /^[Ll]\d*$/.test(val)) return "doctor";
  return null;
};

const DLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formValue, setFormValue] = useState({ ID: "", password: "" });

  // Forgot password drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [forgetEmail, setForgetEmail] = useState("");
  const [forgetLoading, setForgetLoading] = useState(false);

  const handleChange = (e) =>
    setFormValue({ ...formValue, [e.target.name]: e.target.value });

  // Derive hint label from what the user is typing
  const userType = detectUserType(formValue.ID);
  const idLabel =
    userType === "patient"
      ? "Email"
      : userType === "doctor"
      ? "Doctor / Lab ID"
      : userType === "admin"
      ? "Username"
      : "Email / ID / Username";

  const idPlaceholder =
    userType === "patient"
      ? "Enter your email"
      : userType === "doctor"
      ? "Enter your ID (e.g. 1, 2, L1, L2)"
      : userType === "admin"
      ? "admin"
      : "Enter email, ID or username";

  const handleSubmit = (e) => {
    e.preventDefault();
    const { ID, password } = formValue;

    if (!ID || !password) return notify("Please fill in all fields");

    const type = detectUserType(ID);

    if (!type) {
      return notify(
        "Could not detect account type. Use your email, numeric ID, Lab ID (L1…) or 'admin'."
      );
    }

    setLoading(true);

    if (type === "patient") {
      dispatch(patientLogin({ email: ID.trim(), password })).then((res) => {
        setLoading(false);
        if (res?.message === "Successful") {
          notify("Login Successful");
          return navigate("/dashboard");
        }
        if (res?.message === "Wrong credentials") return notify("Wrong credentials");
        if (res?.message === "Patient not found") return notify("Patient not found");
        notify("Something went wrong. Please try again.");
      }).catch(() => {
        setLoading(false);
        notify("Network error. Please check your connection.");
      });

    } else if (type === "doctor") {
      dispatch(DoctorLogin({ docID: ID.trim(), password })).then((res) => {
        setLoading(false);
        if (res?.message === "Successful") {
          notify("Login Successful");
          return navigate("/dashboard");
        }
        if (res?.message === "Wrong credentials") return notify("Wrong credentials");
        if (res?.message === "Doctor not found") return notify("Doctor / Lab personnel not found");
        if (res?.message?.includes("Invalid Doctor ID"))
          return notify("Invalid ID. Use a numeric ID (1, 2…) or Lab ID (L1, L2…)");
        notify("Something went wrong. Please try again.");
      }).catch(() => {
        setLoading(false);
        notify("Network error. Please check your connection.");
      });

    } else if (type === "admin") {
      dispatch(AdminLogin({ adminID: ID.trim(), password })).then((res) => {
        setLoading(false);
        if (res?.message === "Successful") {
          notify("Login Successful");
          return navigate("/dashboard");
        }
        if (res?.message === "Wrong credentials") return notify("Wrong credentials");
        notify("Something went wrong. Please try again.");
      }).catch(() => {
        setLoading(false);
        notify("Network error. Please check your connection.");
      });
    }
  };

  const handleForgotPassword = () => {
    if (!forgetEmail) return notify("Please enter your email address");
    setForgetLoading(true);
    dispatch(forgetPassword({ email: forgetEmail, userType: "patient" })).then((res) => {
      setForgetLoading(false);
      if (res?.message === "User not found") return notify("No patient found with this email");
      if (res?.message === "successful") {
        setForgetEmail("");
        setDrawerOpen(false);
        return notify("✅ Credentials sent to your email!");
      }
      notify("Failed to send email. Please try again.");
    });
  };

  return (
    <>
      <ToastContainer />

      <div className="mainLoginPage">
        {/* Left banner */}
        <div className="leftside">
          <img src={banner} alt="banner" />
        </div>

        {/* Right form */}
        <div className="rightside">
          <h1>Login</h1>

          <div className="Profileimg">
            <img src={admin} alt="profile" />
          </div>

          {/* Subtle hint badge */}
          {userType && (
            <div className="usertype-badge" data-type={userType}>
              {userType === "patient" && "🧑‍⚕️ Patient"}
              {userType === "doctor" && "👨‍⚕️ Doctor / Lab Personnel"}
              {userType === "admin" && "🔐 Admin"}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <h3>{idLabel}</h3>
            <input
              type={userType === "patient" ? "email" : "text"}
              name="ID"
              value={formValue.ID}
              onChange={handleChange}
              placeholder={idPlaceholder}
              required
              autoComplete="username"
            />

            <h3>Password</h3>
            <input
              type="password"
              name="password"
              value={formValue.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* Forgot password & sign up — only relevant for patients */}
            <p style={{ marginTop: "10px" }}>
              Forgot Password?{" "}
              <span onClick={() => setDrawerOpen(true)}>Get it on Email!</span>
            </p>
            <p style={{ marginTop: "10px" }}>
              New here?{" "}
              <span onClick={() => navigate("/signup")}>Sign up!</span>
            </p>
          </form>

         { /* Login hint
          <div className="login-hint">
            <p>
              <strong>Patients</strong> — use your email &amp; password
            </p>
            <p>
              <strong>Doctors / Lab</strong> — use your assigned ID &amp; password
            </p>
            <p>
              <strong>Admin</strong> — use <em>admin</em> &amp; your password
            </p>
          </div>*/}
        </div>
      </div> 

      {/* Forgot password drawer */}
      <Drawer
        title={<div style={{ fontSize: "20px", fontWeight: "600" }}>🔑 Forgot Password</div>}
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={400}
      >
        <div style={{ padding: "10px 0" }}>
          <div
            style={{
              backgroundColor: "#e8f4f8",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #b3d9e6",
            }}
          >
            <p style={{ margin: 0, fontSize: "14px", color: "#0b6b61" }}>
              📧 Enter your registered email address and we'll send your
              credentials to your email.
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "16px",
                fontWeight: "500",
                marginBottom: "8px",
                color: "#333",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your registered email"
              value={forgetEmail}
              onChange={(e) => setForgetEmail(e.target.value)}
              required
              style={{
                width: "100%",
                height: "45px",
                borderRadius: "8px",
                border: "2px solid #d1d5db",
                fontSize: "16px",
                paddingLeft: "15px",
                outline: "none",
              }}
            />
          </div>

          <button
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              fontWeight: "600",
              background: "linear-gradient(135deg, #0b6b61 0%, #13a189 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: forgetLoading ? "not-allowed" : "pointer",
              opacity: forgetLoading ? 0.7 : 1,
            }}
            onClick={handleForgotPassword}
            disabled={forgetLoading}
          >
            {forgetLoading ? "Sending..." : "📨 Send Credentials"}
          </button>
        </div>
      </Drawer>
    </>
  );
};

export default DLogin;
