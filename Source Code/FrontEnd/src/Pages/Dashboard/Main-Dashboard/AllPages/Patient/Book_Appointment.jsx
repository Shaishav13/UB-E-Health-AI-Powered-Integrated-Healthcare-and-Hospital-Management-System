import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  CreateBooking,
  GetDoctorDetails,
} from "../../../../../Redux/Datas/action";
import Sidebar from "../../GlobalFiles/Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { convertTo12Hour } from "../../../../../utils/timeFormat";
import axios from "axios";
import Footer from "../../../../../Components/Footer";

const notify = (text) => toast(text);

const Book_Appointment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [Loading, setLoading] = useState(false);
  const [appointmentType, setAppointmentType] = useState("doctor"); // "doctor" or "labtest"

  const {
    data: { user },
  } = useSelector((state) => state.auth);

  const { doctors } = useSelector((store) => store.data);

  const [chosenDoctor, setChosenDoctor] = useState(null);

  // Initialize form values with fallback
  const InitValue = {
    patientId: user?._id || "",
    docemail: "",
    date: "",
    time: "",
  };

  const [BookAppoint, setBookAppoint] = useState(InitValue);

  // Lab test form state
  const [labTestForm, setLabTestForm] = useState({
    testType: "Complete Blood Count (CBC)",
    testName: "",
    homeService: false,
    address: "",
    preferredDate: "",
    preferredTime: "09:00 AM",
    cost: 500
  });

  const testTypes = [
    { name: "Complete Blood Count (CBC)", cost: 500 },
    { name: "Hemoglobin Test", cost: 200 },
    { name: "Blood Sugar (Fasting)", cost: 150 },
    { name: "Blood Sugar (Random)", cost: 150 },
    { name: "Lipid Profile", cost: 800 },
    { name: "Liver Function Test (LFT)", cost: 1000 },
    { name: "Kidney Function Test (KFT)", cost: 1000 },
    { name: "Thyroid Profile", cost: 600 },
    { name: "Vitamin D Test", cost: 1200 },
    { name: "Vitamin B12 Test", cost: 800 },
    { name: "Urine Routine", cost: 300 },
    { name: "HbA1c Test", cost: 500 }
  ];

  const timeSlots = [
    "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM",
    "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
    "04:00 PM", "05:00 PM", "06:00 PM"
  ];

  useEffect(() => {
    dispatch(GetDoctorDetails());
  }, []);

  // Add safety check for user
  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading user data...</p>
      </div>
    );
  }

  // Check if user is authenticated and is a patient
  if (!user._id || user.userType !== 'patient') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Access denied. Please log in as a patient.</p>
        <button onClick={() => navigate('/')}>Go to Login</button>
      </div>
    );
  }

  const handleDoctor = (e) => {
    const doctor =
      e.target.value !== ""
        ? doctors.find((doctor) => doctor.name === e.target.value)
        : null;

    setChosenDoctor(doctor);
    setBookAppoint({
      ...BookAppoint,
      docemail: doctor?.email || "",
      docname: doctor?.name || "",
    });
  };

  const HandleAppointment = (e) => {
    setBookAppoint({ ...BookAppoint, [e.target.name]: e.target.value });
  };

  const HandleDepartment = (e) => {
    setBookAppoint({ ...BookAppoint, department: e.target.value });
    setChosenDoctor(null);
  };

  const HandleOnSubmitAppointment = (e) => {
    e.preventDefault();

    if (!chosenDoctor) {
      notify("Please select a doctor");
      return;
    }

    // Prepare appointment data
    const appointmentData = {
      patientId: user._id,
      docemail: BookAppoint.docemail,
      docname: BookAppoint.docname,
      department: BookAppoint.department,
      date: BookAppoint.date,
      time: BookAppoint.time,
      problem: BookAppoint.problem || "General Consultation",
      docid: chosenDoctor._id || chosenDoctor.doctorId,
    };

    // Navigate to payment page with appointment data
    navigate("/payment", {
      state: {
        appointmentData: appointmentData,
        doctorFees: chosenDoctor.fees,
      },
    });
  };

  const handleTestTypeChange = (e) => {
    const selectedTest = testTypes.find(t => t.name === e.target.value);
    setLabTestForm({
      ...labTestForm,
      testType: e.target.value,
      testName: e.target.value,
      cost: selectedTest ? selectedTest.cost : 0
    });
  };

  const handleLabTestSubmit = async (e) => {
    e.preventDefault();

    if (!labTestForm.testName || !labTestForm.preferredDate || !labTestForm.preferredTime) {
      notify("❌ Please fill all required fields");
      return;
    }

    if (labTestForm.homeService && !labTestForm.address) {
      notify("❌ Please provide address for home service");
      return;
    }

    try {
      const requestData = {
        patientId: user._id,
        testType: labTestForm.testType,
        testName: labTestForm.testName,
        homeService: labTestForm.homeService,
        address: labTestForm.homeService ? labTestForm.address : user.address,
        preferredDate: labTestForm.preferredDate,
        preferredTime: labTestForm.preferredTime,
        cost: labTestForm.homeService ? labTestForm.cost + 50 : labTestForm.cost
      };

      await axios.post("http://127.0.0.1:3001/lab-reports/request", requestData);

      notify("✅ Lab test booked successfully!");
      
      setLabTestForm({
        testType: "Complete Blood Count (CBC)",
        testName: "",
        homeService: false,
        address: "",
        preferredDate: "",
        preferredTime: "09:00 AM",
        cost: 500
      });
    } catch (error) {
      console.error("Error booking lab test:", error);
      notify("❌ Failed to book lab test");
    }
  };

  return (
    <>
      <ToastContainer />

      {/* ---------------- Inline CSS ---------------- */}
      <style>{`
        .book-page-container {
          display: flex;
          background: #f5f7f8;
          min-height: 100vh;
          width: 100%;
        }

        .appointment-wrapper {
          flex: 1;
          padding: 2.5rem 3rem;
        }

        .toggle-container {
          max-width: 700px;
          margin: 0 auto 2rem;
          display: flex;
          gap: 1rem;
          background: white;
          padding: 0.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .toggle-btn {
          flex: 1;
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          background: transparent;
          color: #64748b;
        }

        .toggle-btn.active {
          background: linear-gradient(135deg, #0b6b61 0%, #0a5a52 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(11,107,97,0.3);
        }

        .toggle-btn:hover:not(.active) {
          background: #f1f5f9;
        }

        .appointment-card {
          background: #ffffff;
          padding: 2rem 2.5rem;
          border-radius: 18px;
          max-width: 700px;
          margin: auto;
          box-shadow: 0 4px 16px rgba(0,0,0,0.07);
          transition: 0.25s ease;
        }

        .appointment-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 26px rgba(0,0,0,0.10);
        }

        .appointment-card h1 {
          font-size: 1.9rem;
          margin-bottom: 0.7rem;
          color: #0b6b61;
          font-weight: 700;
          text-align: center;
        }

        .appointment-card h2 {
          font-size: 1.3rem;
          margin-bottom: 1.5rem;
          color: #444;
          font-weight: 600;
          text-align: center;
        }

        label {
          font-size: 0.95rem;
          font-weight: 600;
          color: #0b6b61;
          display: block;
          margin-bottom: 6px;
        }

        .inputdiv {
          margin-bottom: 1.2rem;
        }

        select,
        input[type='text'],
        input[type='date'],
        input[type='number'],
        textarea {
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1.7px solid rgba(11,107,97,0.25);
          background: #f9fafb;
          font-size: 0.95rem;
          transition: 0.25s ease;
        }

        select:focus,
        input:focus,
        textarea:focus {
          outline: none;
          border-color: #0b6b61;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(11,107,97,0.2);
        }

        textarea {
          resize: vertical;
          min-height: 100px;
          font-family: inherit;
        }

        .dateofAppointment {
          margin-top: 1rem;
        }

        .dateofAppointment p {
          font-size: 1rem;
          font-weight: 600;
          color: #0b6b61;
          margin-bottom: 6px;
        }

        .book_formsubmitbutton {
          width: 100%;
          padding: 12px;
          margin-top: 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          background: #0b6b61;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: 0.25s ease;
        }

        .book_formsubmitbutton:hover {
          background: #0a5a52;
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(11,107,97,0.25);
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 1rem;
        }

        .checkbox-group:hover {
          background: #f0f4ff;
        }

        .checkbox-input {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .checkbox-label {
          font-weight: 600;
          color: #374151;
          cursor: pointer;
        }

        .home-service-badge {
          display: inline-block;
          padding: 0.375rem 0.75rem;
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
          color: white;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-left: 0.5rem;
        }

        .cost-summary {
          background: linear-gradient(135deg, #0b6b61 0%, #0a5a52 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .cost-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          font-size: 0.95rem;
        }

        .cost-total {
          display: flex;
          justify-content: space-between;
          font-size: 1.3rem;
          font-weight: 700;
          padding-top: 0.75rem;
          border-top: 2px solid rgba(255, 255, 255, 0.3);
        }

        .info-box {
          background: #f0fdf4;
          border-left: 4px solid #34d399;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .info-title {
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .info-text {
          color: #64748b;
          font-size: 0.9rem;
          line-height: 1.6;
        }
      `}</style>

      {/* ---------------- UI STRUCTURE ---------------- */}
      <div className="book-page-container">
        <Sidebar />

        <div className="appointment-wrapper">
          {/* Toggle Buttons */}
          <div className="toggle-container">
            <button
              className={`toggle-btn ${appointmentType === "doctor" ? "active" : ""}`}
              onClick={() => setAppointmentType("doctor")}
            >
              👨‍⚕️ Doctor Appointment
            </button>
            <button
              className={`toggle-btn ${appointmentType === "labtest" ? "active" : ""}`}
              onClick={() => setAppointmentType("labtest")}
            >
              🧪 Lab Test
            </button>
          </div>

          {/* Doctor Appointment Form */}
          {appointmentType === "doctor" && (
            <div className="appointment-card">
              <h1>Book Appointment</h1>
              <h2>Select Department & Doctor</h2>

              <form onSubmit={HandleOnSubmitAppointment}>
                {/* Department */}
                <div className="inputdiv">
                  <label>Department</label>
                  <select
                    name="department"
                    value={BookAppoint.department || ""}
                    onChange={HandleDepartment}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="ENT">ENT</option>
                    <option value="Ophthalmologist">Ophthalmologist</option>
                    <option value="Anesthesiologist">Anesthesiologist</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="Oncologist">Oncologist</option>
                    <option value="Psychiatrist">Psychiatrist</option>
                  </select>
                </div>

                {/* Doctor */}
                <div className="inputdiv">
                  <label>Doctor</label>
                  <select
                    name="doctor"
                    value={BookAppoint.docname || ""}
                    onChange={handleDoctor}
                    required
                  >
                    <option value="">
                      {!doctors || doctors.length === 0 ? "Loading doctors..." : "Select"}
                    </option>
                    {doctors && doctors.map((doctor) =>
                      doctor.department === BookAppoint.department ? (
                        <option key={doctor._id || doctor.doctorId || doctor.name} value={doctor.name}>
                          {doctor.name}
                        </option>
                      ) : null
                    )}
                  </select>
                </div>

                {/* Fees */}
                <div className="inputdiv">
                  <label>Fees</label>
                  <input
                    type="number"
                    placeholder="Fees"
                    name="fees"
                    value={chosenDoctor?.fees || ""}
                    readOnly
                  />
                </div>

                {/* Problem */}
                <div className="inputdiv">
                  <label>Problem</label>
                  <input
                    type="text"
                    placeholder="Describe your issue"
                    name="problem"
                    onChange={HandleAppointment}
                    value={BookAppoint.problem || ""}
                  />
                </div>

                {/* Date & Time */}
                <div className="dateofAppointment">
                  <p>Date & Time</p>
                  <div className="inputdiv">
                    <input
                      type="date"
                      name="date"
                      value={BookAppoint.date}
                      onChange={HandleAppointment}
                      required
                    />

                    <select
                      name="time"
                      value={BookAppoint.time}
                      onChange={HandleAppointment}
                      required
                    >
                      <option value="">Select Time</option>
                      {chosenDoctor && (() => {
                        try {
                          let availableTimes = [];
                          
                          if (Array.isArray(chosenDoctor.availability)) {
                            availableTimes = chosenDoctor.availability;
                          } else if (typeof chosenDoctor.availability === 'string' && chosenDoctor.availability.length > 0) {
                            availableTimes = JSON.parse(chosenDoctor.availability);
                          }
                          
                          if (availableTimes.length === 0) {
                            availableTimes = [
                              "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                              "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
                            ];
                          }
                          
                          return availableTimes.map((time) => (
                            <option key={time} value={time}>
                              {convertTo12Hour(time)}
                            </option>
                          ));
                        } catch (error) {
                          console.error('Error parsing availability:', error);
                          const defaultTimes = [
                            "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                            "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
                          ];
                          return defaultTimes.map((time) => (
                            <option key={time} value={time}>
                              {convertTo12Hour(time)}
                            </option>
                          ));
                        }
                      })()}
                    </select>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" className="book_formsubmitbutton">
                  Proceed to Payment
                </button>
              </form>
            </div>
          )}

          {/* Lab Test Form */}
          {appointmentType === "labtest" && (
            <div className="appointment-card">
              <h1>🧪 Book Lab Test</h1>
              <h2>Home Sample Collection Service</h2>

              <form onSubmit={handleLabTestSubmit}>
                {/* Test Type */}
                <div className="inputdiv">
                  <label>Select Test Type *</label>
                  <select
                    value={labTestForm.testType}
                    onChange={handleTestTypeChange}
                    required
                  >
                    {testTypes.map((test) => (
                      <option key={test.name} value={test.name}>
                        {test.name} - ₹{test.cost}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Home Service */}
                <div className="info-box">
                  <div className="info-title">🏠 Home Sample Collection</div>
                  <div className="info-text">
                    Our trained technician will visit your home to collect the sample.
                    Additional charge: ₹50
                  </div>
                </div>

                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    id="homeService"
                    checked={labTestForm.homeService}
                    onChange={(e) =>
                      setLabTestForm({ ...labTestForm, homeService: e.target.checked })
                    }
                  />
                  <label className="checkbox-label" htmlFor="homeService">
                    Request Home Sample Collection
                    {labTestForm.homeService && (
                      <span className="home-service-badge">+₹50</span>
                    )}
                  </label>
                </div>

                {labTestForm.homeService && (
                  <div className="inputdiv">
                    <label>Home Address *</label>
                    <textarea
                      value={labTestForm.address}
                      onChange={(e) =>
                        setLabTestForm({ ...labTestForm, address: e.target.value })
                      }
                      placeholder="Enter your complete address"
                      required
                    />
                  </div>
                )}

                {/* Preferred Date */}
                <div className="inputdiv">
                  <label>Preferred Date *</label>
                  <input
                    type="date"
                    value={labTestForm.preferredDate}
                    onChange={(e) =>
                      setLabTestForm({ ...labTestForm, preferredDate: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                {/* Preferred Time */}
                <div className="inputdiv">
                  <label>Preferred Time *</label>
                  <select
                    value={labTestForm.preferredTime}
                    onChange={(e) =>
                      setLabTestForm({ ...labTestForm, preferredTime: e.target.value })
                    }
                    required
                  >
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cost Summary */}
                <div className="cost-summary">
                  <div className="cost-row">
                    <span>Test Cost:</span>
                    <span>₹{labTestForm.cost}</span>
                  </div>
                  {labTestForm.homeService && (
                    <div className="cost-row">
                      <span>Home Service Charge:</span>
                      <span>₹50</span>
                    </div>
                  )}
                  <div className="cost-total">
                    <span>Total Amount:</span>
                    <span>₹{labTestForm.homeService ? labTestForm.cost + 50 : labTestForm.cost}</span>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" className="book_formsubmitbutton">
                  🧪 Book Lab Test
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Book_Appointment;

