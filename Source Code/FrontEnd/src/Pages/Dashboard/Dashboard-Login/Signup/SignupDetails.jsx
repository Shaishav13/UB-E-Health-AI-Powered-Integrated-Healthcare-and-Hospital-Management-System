import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import "./DSignup.css";
import { PatientSignup, mailCreds } from "../../../../Redux/auth/action";
const notify = (text) => toast(text);
const SignupDetails = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const creds = location.state;
  console.log("location", creds);
  const [loading, setLoading] = useState(false);
  const [formValue, setFormValue] = useState({
    name: creds.name,
    phonenum: "",
    email: creds.email,
    password: creds.password,
    age: "",
    gender: "",
    bloodgroup: "",
    dob: "",
    address: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If DOB is changed, auto-calculate age
    if (name === 'dob' && value) {
      const birthDate = new Date(value);
      const today = new Date();
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setFormValue({ ...formValue, [name]: value, age: age });
    } else {
      setFormValue({ ...formValue, [name]: value });
    }
  };

  const HandleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formValue.phonenum || formValue.phonenum.length < 10) {
      notify("Please enter a valid 10-digit phone number");
      return;
    }
    
    if (!formValue.age || formValue.age < 1 || formValue.age > 120) {
      notify("Please enter a valid age between 1 and 120");
      return;
    }
    
    if (!formValue.gender || formValue.gender === "") {
      notify("Please select your gender");
      return;
    }
    
    if (!formValue.bloodgroup || formValue.bloodgroup === "") {
      notify("Please select your blood group");
      return;
    }
    
    if (!formValue.dob) {
      notify("Please select your date of birth");
      return;
    }
    
    if (!formValue.address || formValue.address.trim().length < 5) {
      notify("Please enter a valid address (minimum 5 characters)");
      return;
    }
    
    setLoading(true);
    console.log(formValue);
    dispatch(PatientSignup(formValue)).then((res) => {
      console.log(res);
      if (!res || res.error || res.message === "error") {
        setLoading(false);
        return notify("Something went wrong, Please try Again");
      } else if (res.message === "Registered") {
        notify("Your signup is complete. Sending login Credentials...");
        let data = { email: formValue.email, userType: "patient" };
        dispatch(mailCreds(data)).then((res) => {
          console.log("res", res);
          if (res && res.message === "successful") {
            notify("Account Details Sent. Login to continue.");
            setTimeout(() => {
              return navigate("/");
            }, 3000);
          } else {
            setLoading(false);
            notify("Account created but failed to send credentials. Please use forgot password.");
            setTimeout(() => {
              return navigate("/");
            }, 3000);
          }
        }).catch((error) => {
          console.log("mailCreds error:", error);
          setLoading(false);
          notify("Account created but failed to send credentials. Please use forgot password.");
          setTimeout(() => {
            return navigate("/");
          }, 3000);
        });
        setLoading(false);
      } else if (res.message && res.message.includes("already exists")) {
        setLoading(false);
        notify("An account with this email already exists. Please login instead.");
        setTimeout(() => {
          return navigate("/");
        }, 3000);
      }
    }).catch((error) => {
      console.log("PatientSignup error:", error);
      setLoading(false);
      notify("Network error. Please check your connection and try again.");
    });
  };
  return (
    <>
      <ToastContainer />

      <div className="mainSignupPage">
        <div className="outerBox">
          <h1>Add Your Details</h1>
          <div>
            <form onSubmit={HandleSubmit}>
              <h3>Phone Number</h3>
              <input
                type="number"
                name="phonenum"
                value={formValue.phonenum}
                onChange={handleChange}
                required
              />
              <h3>Date of Birth</h3>
              <div className="inputdiv">
                <input
                  type="date"
                  placeholder="dd-mm-yy"
                  name="dob"
                  value={formValue.dob}
                  onChange={handleChange}
                  required
                />
              </div>
              <h3>Age</h3>
              <input
                type="number"
                name="age"
                value={formValue.age}
                onChange={handleChange}
                readOnly
                placeholder="Age"
                style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                required
              />
              <h3>Gender</h3>
              <div className="inputdiv">
                <select
                  name="gender"
                  value={formValue.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <h3>Blood Group</h3>
              <div className="inputdiv">
                <select
                  name="bloodgroup"
                  value={formValue.bloodgroup}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <h3>Address</h3>
              <input
                type="text"
                name="address"
                value={formValue.address}
                onChange={handleChange}
                required
              />
              <button type="submit">{loading ? "Loading..." : "Submit"}</button>

              {/* ********************************************************* */}
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
export default SignupDetails;
