import React, { useState } from "react";
import { Radio } from "antd";
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

const DLogin = () => {
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const toSignUp = () => {
    return navigate("/signup");
  };

  const onClose = () => {
    setOpen(false);
  };

  // ************************************************
  const [Loading, setLoading] = useState(false);
  const [placement, setPlacement] = useState("Patient");
  const [formValue, setFormValue] = useState({
    ID: "",
    password: "",
  });
  const dispatch = useDispatch();

  const Handlechange = (e) => {
    setFormValue({ ...formValue, [e.target.name]: e.target.value });
  };
  const navigate = useNavigate();
  const HandleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    if (formValue.ID !== "" && formValue.password !== "") {
      if (placement === "Patient") {
        // For patients, send email and password
        let data = {
          email: formValue.ID, // ID field contains email for patients
          password: formValue.password,
        };
        dispatch(patientLogin(data)).then((res) => {
          if (res && res.message === "Successful") {
            notify("Login Successful");
            setLoading(false);
            return navigate("/dashboard");
          }
          if (res && res.message === "Wrong credentials") {
            setLoading(false);
            notify("Wrong credentials");
          }
          if (res && res.message === "Patient not found") {
            setLoading(false);
            notify("Patient not found");
          }
          if (!res || res.error || res.message === "Error") {
            setLoading(false);
            notify("Something went Wrong, Please Try Again");
          }
        }).catch((error) => {
          console.log("Login error:", error);
          setLoading(false);
          notify("Network error. Please check your connection.");
        });
      } else if (placement === "Doctor") {
        // For doctors and lab personnel, send docID and password
        let data = {
          docID: formValue.ID,
          password: formValue.password,
        };
        console.log(data);
        dispatch(DoctorLogin(data)).then((res) => {
          if (res && res.message === "Successful") {
            notify("Login Successful");
            setLoading(false);
            // Redirect based on userType
            return navigate("/dashboard");
          }
          if (res && res.message === "Wrong credentials") {
            setLoading(false);

            notify("Wrong credentials");
          }
          if (res && res.message === "Doctor not found") {
            setLoading(false);

            notify("Doctor/Lab personnel not found");
          }
          if (res && res.message === "Internal server error") {
            setLoading(false);

            notify("Server error. Please try again later.");
          }
          if (res && res.message && res.message.includes("Invalid Doctor ID")) {
            setLoading(false);

            notify("Invalid ID. Please enter a numeric ID (1, 2, 3) or Lab ID (L1, L2, L3)");
          }
          if (!res || res.error || res.message === "Error") {
            setLoading(false);

            notify("Something went Wrong, Please Try Again");
          }
        }).catch((error) => {
          console.log("Login error:", error);
          setLoading(false);
          notify("Network error. Please check your connection.");
        });
      } else if (placement === "Admin") {
        // For admin, send adminID (username) and password
        let data = {
          adminID: formValue.ID, // Should be "admin"
          password: formValue.password, // Should be "admin@123"
        };
        dispatch(AdminLogin(data)).then((res) => {
          if (res && res.message === "Successful") {
            notify("Login Successful");
            setLoading(false);

            return navigate("/dashboard");
          }
          if (res && res.message === "Wrong credentials") {
            setLoading(false);

            notify("Wrong credentials");
          }
          if (!res || res.error || res.message === "Error") {
            setLoading(false);

            notify("Something went Wrong, Please Try Again");
          }
        }).catch((error) => {
          console.log("Login error:", error);
          setLoading(false);
          notify("Network error. Please check your connection.");
        });
      }
    }
  };

  const placementChange = (e) => {
    setPlacement(e.target.value);
  };

  const [ForgetPassword, setForgetPassword] = useState({
    email: "",
  });

  const HandleForgetPassword = (e) => {
    setForgetPassword({ ...ForgetPassword, [e.target.name]: e.target.value });
  };

  const [forgetLoading, setforgetLoading] = useState(false);

  const HandleChangePassword = () => {
    if (ForgetPassword.email === "") {
      return notify("Please enter your email address");
    }
    setforgetLoading(true);
    // Send forgot password request for patient
    const data = {
      email: ForgetPassword.email,
      userType: "patient",
    };
    dispatch(forgetPassword(data)).then((res) => {
      if (res.message === "User not found") {
        setforgetLoading(false);
        return notify("No patient found with this email");
      }
      if (res.message === "successful") {
        setForgetPassword({
          email: "",
        });
        onClose();
        setforgetLoading(false);
        return notify("✅ Credentials sent to your email!");
      }
      setforgetLoading(false);
      return notify("Failed to send email. Please try again.");
    });
  };

  return (
    <>
      <ToastContainer />

      <div className="mainLoginPage">
        <div className="leftside">
          <img src={banner} alt="banner" />
        </div>
        <div className="rightside">
          <h1>Login</h1>
          <div>
            <Radio.Group
              value={placement}
              onChange={placementChange}
              className={"radiogroup"}
            >
              <Radio.Button value="Patient" className={"radiobutton"}>
                Patient
              </Radio.Button>
              <Radio.Button value="Doctor" className={"radiobutton"}>
                Doctor/Lab
              </Radio.Button>
              <Radio.Button value="Admin" className={"radiobutton"}>
                Admin
              </Radio.Button>
            </Radio.Group>
          </div>
          <div className="Profileimg">
            <img src={admin} alt="profile" />
          </div>
          <div>
            <form onSubmit={HandleSubmit}>
              <h3>
                {placement === "Patient" ? "Email" : 
                 placement === "Doctor" ? "Doctor ID" : 
                 "Username"}
              </h3>
              <input
                type={placement === "Patient" ? "email" : "text"}
                name="ID"
                value={formValue.ID}
                onChange={Handlechange}
                placeholder={placement === "Patient" ? "Enter your email" : 
                           placement === "Doctor" ? "Enter ID (1, 2, 3 for Doctor or L1, L2, L3 for Lab)" : 
                           "Enter username (admin)"}
                required
              />
              <h3>Password</h3>
              <input
                type="password"
                name="password"
                value={formValue.password}
                onChange={Handlechange}
                placeholder={placement === "Admin" ? "Enter password" : "Enter your password"}
                required
              />
              <button type="submit">{Loading ? "Loading..." : "Submit"}</button>
              {placement === "Patient" ? (
                <>
                  <p style={{ marginTop: "10px" }}>
                    Forgot Password?{" "}
                    <span
                      style={{ color: "blue", cursor: "pointer" }}
                      onClick={showDrawer}
                    >
                      Get it on Email!
                    </span>
                  </p>
                  <p style={{ marginTop: "10px" }}>
                    New here?{" "}
                    <span
                      style={{ color: "blue", cursor: "pointer" }}
                      onClick={toSignUp}
                    >
                      Sign up!
                    </span>
                  </p>
                </>
              ) : null}

              {/* ********************************************************* */}
              <Drawer
                title={
                  <div style={{ fontSize: "20px", fontWeight: "600" }}>
                    🔑 Forgot Password
                  </div>
                }
                placement="right"
                onClose={onClose}
                open={open}
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
                      Patient ID and password to your email.
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
                      name="email"
                      value={ForgetPassword.email}
                      onChange={HandleForgetPassword}
                      required
                      style={{
                        width: "100%",
                        height: "45px",
                        borderRadius: "8px",
                        border: "2px solid #d1d5db",
                        fontSize: "16px",
                        paddingLeft: "15px",
                        outline: "none",
                        transition: "all 0.3s ease",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#0b6b61";
                        e.target.style.boxShadow = "0 0 0 3px rgba(11, 107, 97, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d1d5db";
                        e.target.style.boxShadow = "none";
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
                      transition: "all 0.3s ease",
                    }}
                    onClick={HandleChangePassword}
                    disabled={forgetLoading}
                    onMouseEnter={(e) => {
                      if (!forgetLoading) {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 4px 12px rgba(11, 107, 97, 0.3)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    {forgetLoading ? "Sending..." : "📨 Send Credentials"}
                  </button>
                </div>
              </Drawer>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default DLogin;
