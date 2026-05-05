import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "./DSignup.css";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  CheckPatientExists,
  sendVerification,
} from "../../../../Redux/auth/action";

const notify = (text) => toast(text);

const DSignup = () => {
  const [code, setCode] = useState("");
  const [verification, setVerification] = useState(0);
  const [isVisible, setVisible] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [lastResendTime, setLastResendTime] = useState(0);
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formValue, setFormValue] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    Handlechange(e);
  };
  const handleCode = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 4 digits
    if (/^\d{0,4}$/.test(value)) {
      setCode(value);
    }
  };
  const [email, setEmail] = useState("");

  const HandleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("visible", isVisible);
    if (!isVisible) {
      console.log(formValue.password, confirmationPassword);
      if (confirmationPassword === formValue.password) {
        console.log(formValue);
        dispatch(CheckPatientExists({ email: email })).then((res) => {
          console.log(res);
          if (res.message === "Patient already exists") {
            setLoading(false);
            notify("Patient Already Exists. Redirecting to Login Page");
            setTimeout(() => {
              return navigate("/");
            }, 3000);
          } else {
            notify("Verifying Email...");
            console.log(formValue.email);
            dispatch(sendVerification({ email: email })).then((res) => {
              console.log("Res", res);
              if (res.message === "successful") {
                notify(
                  "Verification code sent on email. Please check your email"
                );
                setVerification(res.code);
                console.log(verification);
                setVisible(true);
                setLoading(false);
              } else if (res.message === "error") {
                setLoading(false);
                return notify("Something went wrong, Please try Again");
              }
            });
          }
        });
      } else {
        setLoading(false);
        return notify("Passwords do not match");
      }
    } else {
      const enteredCode = parseInt(code);
      const expectedCode = parseInt(verification);
      
      if (code === "" || isNaN(enteredCode)) {
        setLoading(false);
        return notify("Please enter the verification code");
      }
      
      if (expectedCode === enteredCode) {
        setLoading(false);
        return navigate("/adddetails", { state: formValue });
      } else {
        setLoading(false);
        return notify("Wrong Verification Code");
      }
    }
  };
  const Handlechange = (e) => {
    setFormValue({
      ...formValue,
      [e.target.name]: e.target.value,
    });
  };

  const checkPasswordsMatch = (e) => {
    const newConfirmPassword = e.target.value;
    setConfirmationPassword(newConfirmPassword);
    
    if (newConfirmPassword !== formValue.password) {
      notify("Passwords do not match");
      return false;
    } else return true;
  };

  const handleResendCode = () => {
    // Prevent spam clicking - allow resend only after 30 seconds
    const now = Date.now();
    const timeSinceLastResend = now - lastResendTime;
    const cooldownTime = 30000; // 30 seconds
    
    if (timeSinceLastResend < cooldownTime && lastResendTime > 0) {
      const remainingTime = Math.ceil((cooldownTime - timeSinceLastResend) / 1000);
      notify(`⏰ Please wait ${remainingTime} seconds before requesting another code`);
      return;
    }
    
    setResendLoading(true);
    setLastResendTime(now);
    notify("Resending verification code...");
    
    dispatch(sendVerification({ email: email })).then((res) => {
      console.log("Resend Res", res);
      if (res.message === "successful") {
        notify("✅ New verification code sent! Please check your email");
        setVerification(res.code);
        setCode(""); // Clear the input field
        setResendLoading(false);
      } else if (res.message === "error") {
        setResendLoading(false);
        notify("❌ Failed to resend code. Please try again");
      }
    }).catch((error) => {
      setResendLoading(false);
      notify("❌ Network error. Please try again");
      console.error("Resend error:", error);
    });
  };

  return (
    <>
      <ToastContainer />

      <div className="mainSignupPage">
        <div className="outerBox">
          <h1>Signup As Patient</h1>
          <div>
            <form onSubmit={HandleSubmit}>
              <h3>Name</h3>
              <input
                type="text"
                name="name"
                value={formValue.name}
                onChange={Handlechange}
                required
              />
              <h3>Email</h3>
              <input
                type="text"
                name="email"
                value={formValue.email}
                onChange={handleEmailChange}
                required
              />
              <h3>Password</h3>
              <input
                type="password"
                name="password"
                value={formValue.password}
                onChange={Handlechange}
                required
              />
              <h3>Confirm Password</h3>
              <input
                type="password"
                name="confirmpassword"
                value={confirmationPassword}
                onChange={checkPasswordsMatch}
                required
              />
              {isVisible ? (
                <>
                  <h3>Verification Code</h3>
                  <div className="verification-info">
                    📧 We've sent a 4-digit verification code to <strong>{email}</strong>
                    <br />
                    Please check your email and enter the code below.
                    {email.includes('ethereal.email') && (
                      <div style={{ marginTop: '8px', fontSize: '13px' }}>
                        💡 <strong>Testing Mode:</strong> Check your email at{' '}
                        <a 
                          href="https://ethereal.email/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#0b6b61' }}
                        >
                          ethereal.email
                        </a>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    name="verification"
                    value={code}
                    onChange={handleCode}
                    placeholder="Enter 4-digit code"
                    className="verification-input"
                    maxLength="4"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    required
                  />
                  <div className="resend-section">
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      Didn't receive the code?
                    </span>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendLoading}
                      className="resend-button"
                    >
                      {resendLoading ? '⏳ Sending...' : '🔄 Resend Code'}
                    </button>
                  </div>
                </>
              ) : null}

              <button type="submit" style={{
                marginTop: '10px'
              }}>
                {loading ? "Loading..." : 
                 isVisible ? "Verify Code & Continue" : "Send Verification Code"}
              </button>

              {/* ********************************************************* */}
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default DSignup;
