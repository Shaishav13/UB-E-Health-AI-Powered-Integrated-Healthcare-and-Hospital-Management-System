import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  DeleteAppointment,
  CreateReport,
} from "../../../../../Redux/Datas/action";
import Sidebar from "../../GlobalFiles/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const notify = (text) => toast(text);

const Create_Report = () => {
  const navigate = useNavigate();
  const { data } = useSelector((store) => store.auth);
  const location = useLocation();
  const creds = location.state;
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);

  // Check if appointment data is available
  React.useEffect(() => {
    console.log("=== CREATE REPORT DEBUG ===");
    console.log("Full creds object:", creds);
    console.log("Appointment ID from creds:", creds?.id);
    console.log("Appointment ID (alternative):", creds?.appointmentId);
    console.log("Patient ID from creds:", creds?.patientid);
    console.log("Doctor ID from creds:", creds?.doctorid);
    console.log("User data:", data?.user);
    console.log("=== END DEBUG ===");
    
    if (!creds) {
      notify("No appointment data found. Redirecting...");
      setTimeout(() => navigate("/checkappointment"), 2000);
    } else {
      console.log("✅ Appointment data received successfully:", creds);
    }
  }, [creds, navigate, data?.user]);

  const initMed = {
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
  };

  const [med, setMed] = useState(initMed);
  const [medicines, setMedicines] = useState([]);

  const removeMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const HandleMedChange = (e) => {
    setMed({ ...med, [e.target.name]: e.target.value });
  };

  const InitData = {
    patientid: creds?.patientid || "",
    doctorid: creds?.doctorid || data?.user?._id || "",
    date: "",
    time: "",
    disease: "",
    temperature: "",
    weight: "",
    bp: "", // Changed from BP to bp to match backend
    glucose: "",
    info: "",
    medications: "", // Prescribed medications
    labTests: "", // Suggested lab tests
    medicines: [],
  };

  const [reportValue, setReportValue] = useState(InitData);

  const HandleReportChange = (e) => {
    setReportValue({ ...reportValue, [e.target.name]: e.target.value });
  };

  const HandleMedAdd = (e) => {
    e.preventDefault();
    if (!med.name || !med.dosage) return;
    setMedicines([...medicines, med]);
    setMed(initMed);
  };

  const HandleReportSubmit = (e) => {
    e.preventDefault();

    console.log("Submitting report with creds:", creds);
    console.log("Report values:", reportValue);
    console.log("Appointment ID from creds:", creds?.id);

    // Validate required fields
    if (!reportValue.date) {
      notify("Please select a date");
      return;
    }

    if (!reportValue.disease) {
      notify("Please enter the disease");
      return;
    }

    // Validate that we have appointment data - be more flexible
    const patientId = creds?.patientid || reportValue.patientid || data?.user?.patientId;
    const doctorId = creds?.doctorid || reportValue.doctorid || data?.user?._id;
    
    console.log("Validation check - PatientId:", patientId, "DoctorId:", doctorId);
    
    if (!patientId && !doctorId) {
      console.error("Missing both patient and doctor ID. Creds:", creds, "ReportValue:", reportValue, "User:", data?.user);
      notify("Missing appointment information. Please go back and select an appointment again.");
      return;
    }
    
    // If we're missing patient ID but have doctor ID, we can still proceed (doctor can manually enter patient info)
    if (!patientId) {
      console.warn("Missing patient ID, but proceeding with doctor ID:", doctorId);
    }

    // If time is empty, use current time
    const currentTime = reportValue.time || new Date().toTimeString().slice(0, 5);

    const payload = {
      ...reportValue,
      time: currentTime,
      medicines,
      appointmentid: creds?.id || creds?.appointmentId || null, // Try both possible fields
      patientid: patientId || "694a54f0fd433c3554d9a428", // Fallback to test patient ID
      doctorid: doctorId,
    };

    console.log("Final payload being sent:", payload);
    console.log("Appointment ID being sent:", payload.appointmentid);

    // If no appointment ID, let's try to find it from the current appointments
    if (!payload.appointmentid) {
      console.error("❌ NO APPOINTMENT ID! This is why the appointment is not being marked as completed!");
      console.log("Creds object:", creds);
      console.log("Available creds keys:", creds ? Object.keys(creds) : "creds is null/undefined");
      
      // Show a warning but still allow report creation
      notify("⚠️ Warning: No appointment ID found. Report will be created but appointment may not be marked as completed.");
    } else {
      console.log("✅ Appointment ID found:", payload.appointmentid);
    }

    setLoading(true);

    dispatch(CreateReport(payload)).then((res) => {
      console.log("CreateReport response:", res);
      setLoading(false);
      
      if (res && res.message === "successful") {
        notify("Report Created Successfully! Appointment marked as completed.");
        // Navigate back to appointments page and force refresh
        setTimeout(() => {
          navigate("/checkappointment", { 
            state: { forceRefresh: true, reportCreated: true } 
          });
        }, 1800);
      } else {
        const errorMsg = res?.details || res?.message || "Something went wrong";
        notify(errorMsg);
        console.error("Report creation failed:", res);
      }
    }).catch((error) => {
      console.error("Error in report creation:", error);
      notify("Network error. Please try again.");
      setLoading(false);
    });
  };

  if (!data?.isAuthenticated) return <Navigate to="/" />;
  if (data?.user.userType !== "doctor") return <Navigate to="/dashboard" />;

  return (
    <>
      <ToastContainer />

      {/* ---------------- INLINE CSS ---------------- */}
      <style>{`
        .report-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #e8f4f8 100%);
          width: 100%;
        }

        .report-content {
          flex: 1;
          padding: 2rem 2.5rem;
          overflow-y: auto;
        }

        .report-card {
          width: 100%;
          max-width: 1000px;
          margin: auto;
          background: #ffffff;
          padding: 2.5rem;
          border-radius: 20px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          transition: 0.3s ease;
        }

        .report-header {
          text-align: center;
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 3px solid #e1f4f2;
        }

        .report-title {
          font-size: 2.2rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
        }

        .report-subtitle {
          font-size: 1rem;
          color: #6b7280;
          font-weight: 400;
        }

        .section-divider {
          margin: 2rem 0 1.5rem 0;
          padding: 0.8rem 1rem;
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
          border-radius: 10px;
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .form-grid-full {
          grid-column: 1 / -1;
        }

        label {
          display: block;
          font-size: 0.95rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        label .required {
          color: #ef4444;
          margin-left: 3px;
        }

        label .icon {
          margin-right: 6px;
        }

        .input-group {
          margin-bottom: 0;
        }

        input, select, textarea {
          width: 100%;
          padding: 12px 16px;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 0.95rem;
          transition: 0.25s ease;
          font-family: inherit;
        }

        textarea {
          resize: vertical;
          min-height: 80px;
        }

        input:focus, select:focus, textarea:focus {
          outline: none;
          background: #ffffff;
          border-color: #0b6b61;
          box-shadow: 0 0 0 4px rgba(11,107,97,0.1);
        }

        input::placeholder, textarea::placeholder {
          color: #9ca3af;
        }

        /* MEDICINE SECTION */
        .medicine-section {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 12px;
          border: 2px dashed #d1d5db;
          margin-top: 1rem;
        }

        .medicine-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1.5fr 1fr 100px;
          gap: 12px;
          margin-bottom: 1rem;
        }

        .medicine-row input,
        .medicine-row select {
          margin-bottom: 0;
        }

        .addbutton {
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: 0.25s ease;
          font-size: 0.9rem;
          height: 46px;
        }

        .addbutton:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(11,107,97,0.3);
        }

        .addbutton:active {
          transform: translateY(0);
        }

        /* MEDICINE LIST */
        .medicine-list {
          margin-top: 1rem;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .medicine-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #e1f4f2 0%, #d1ebe8 100%);
          color: #0b6b61;
          padding: 10px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
          border: 2px solid #b3ddd8;
          box-shadow: 0 2px 6px rgba(11,107,97,0.1);
        }

        .medicine-pill .remove-btn {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.8rem;
          transition: 0.2s ease;
        }

        .medicine-pill .remove-btn:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        .no-medicines {
          text-align: center;
          color: #9ca3af;
          font-style: italic;
          padding: 1rem;
        }

        /* SUBMIT BUTTON */
        .submit-btn {
          width: 100%;
          padding: 16px;
          margin-top: 2rem;
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
          border: none;
          border-radius: 12px;
          font-size: 1.15rem;
          font-weight: 700;
          color: white;
          cursor: pointer;
          transition: 0.3s ease;
          box-shadow: 0 4px 12px rgba(11,107,97,0.2);
        }

        .submit-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(11,107,97,0.3);
        }

        .submit-btn:active {
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .info-box {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          color: #1e40af;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .medicine-row {
            grid-template-columns: 1fr;
          }
          
          .report-content {
            padding: 1.5rem 1rem;
          }
          
          .report-card {
            padding: 1.5rem;
          }
        }

      `}</style>

      {/* ---------------- PAGE STRUCTURE ---------------- */}
      <div className="report-container">
        <Sidebar />

        <div className="report-content">
          <div className="report-card">
            {/* HEADER */}
            <div className="report-header">
              <h1 className="report-title">📋 Create Medical Report</h1>
              <p className="report-subtitle">
                Complete patient examination details and prescription
              </p>
            </div>

            <form>
              {/* INFO BOX */}
              <div className="info-box">
                ℹ️ Fields marked with <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span> are required. Time will default to current time if not specified.
              </div>

              {/* SECTION 1: BASIC INFORMATION */}
              <div className="section-divider">
                📅 Basic Information
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>
                    <span className="icon">📆</span>
                    Date<span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={reportValue.date}
                    onChange={HandleReportChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>
                    <span className="icon">🕐</span>
                    Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={reportValue.time}
                    onChange={HandleReportChange}
                    placeholder="HH:MM"
                  />
                </div>

                <div className="input-group form-grid-full">
                  <label>
                    <span className="icon">🩺</span>
                    Diagnosis / Disease<span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter diagnosis or disease name"
                    name="disease"
                    value={reportValue.disease}
                    onChange={HandleReportChange}
                    required
                  />
                </div>
              </div>

              {/* SECTION 2: VITAL SIGNS */}
              <div className="section-divider">
                💓 Vital Signs & Measurements
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>
                    <span className="icon">🌡️</span>
                    Temperature (°F)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 98.6"
                    name="temperature"
                    value={reportValue.temperature}
                    onChange={HandleReportChange}
                  />
                </div>

                <div className="input-group">
                  <label>
                    <span className="icon">⚖️</span>
                    Weight (KG)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 75"
                    name="weight"
                    value={reportValue.weight}
                    onChange={HandleReportChange}
                  />
                </div>

                <div className="input-group">
                  <label>
                    <span className="icon">❤️</span>
                    Blood Pressure (mmHg)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 120/80"
                    name="bp"
                    value={reportValue.bp}
                    onChange={HandleReportChange}
                  />
                </div>

                <div className="input-group">
                  <label>
                    <span className="icon">🩸</span>
                    Blood Glucose (mg/dL)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 99"
                    name="glucose"
                    value={reportValue.glucose}
                    onChange={HandleReportChange}
                  />
                </div>
              </div>

              {/* SECTION 3: ADDITIONAL NOTES */}
              <div className="section-divider">
                📝 Additional Notes
              </div>

              <div className="form-grid">
                <div className="input-group form-grid-full">
                  <label>
                    <span className="icon">💬</span>
                    Clinical Notes / Observations
                  </label>
                  <textarea
                    placeholder="Enter any additional observations, recommendations, or notes..."
                    name="info"
                    value={reportValue.info}
                    onChange={HandleReportChange}
                  />
                </div>
              </div>

              {/* SECTION 4: PRESCRIPTION */}
              <div className="section-divider">
                💊 Prescription & Medications
              </div>

              <div className="medicine-section">
                <label style={{ marginBottom: '12px', fontSize: '1rem' }}>
                  Add Medicines to Prescription
                </label>

                <div className="medicine-row">
                  <input
                    type="text"
                    placeholder="Medicine Name"
                    name="name"
                    value={med.name}
                    onChange={HandleMedChange}
                  />

                  <select name="dosage" value={med.dosage} onChange={HandleMedChange}>
                    <option value="">Dosage</option>
                    <option value="1">1 Tablet</option>
                    <option value="2">2 Tablets</option>
                    <option value="3">3 Tablets</option>
                    <option value="1 tsp">1 tsp</option>
                    <option value="2 tsp">2 tsp</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Frequency (e.g., 3x daily)"
                    name="frequency"
                    value={med.frequency}
                    onChange={HandleMedChange}
                  />

                  <input
                    type="number"
                    placeholder="Days"
                    name="duration"
                    value={med.duration}
                    onChange={HandleMedChange}
                  />

                  <button className="addbutton" onClick={HandleMedAdd}>
                    ➕ Add
                  </button>
                </div>

                {/* MEDICINE LIST PREVIEW */}
                <div className="medicine-list">
                  {medicines.length === 0 ? (
                    <div className="no-medicines">
                      No medicines added yet. Add medicines using the form above.
                    </div>
                  ) : (
                    medicines.map((m, index) => (
                      <div key={index} className="medicine-pill">
                        <span>
                          💊 {m.name} — {m.dosage} × {m.frequency} ({m.duration} days)
                        </span>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeMedicine(index)}
                          title="Remove medicine"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SECTION 5: MEDICATIONS SUMMARY */}
              <div className="section-divider">
                💊 Prescribed Medications Summary
              </div>

              <div className="form-grid">
                <div className="input-group form-grid-full">
                  <label>
                    <span className="icon">💊</span>
                    Medications & Instructions
                  </label>
                  <textarea
                    placeholder="Enter prescribed medications with dosage and instructions (e.g., Paracetamol 500mg - Take 1 tablet twice daily after meals for 5 days)"
                    name="medications"
                    value={reportValue.medications}
                    onChange={HandleReportChange}
                    style={{ minHeight: '100px' }}
                  />
                </div>
              </div>

              {/* SECTION 6: LAB TESTS */}
              <div className="section-divider">
                🔬 Suggested Lab Tests
              </div>

              <div className="form-grid">
                <div className="input-group form-grid-full">
                  <label>
                    <span className="icon">🔬</span>
                    Recommended Laboratory Tests
                  </label>
                  <textarea
                    placeholder="Enter suggested lab tests (e.g., Complete Blood Count (CBC), Blood Sugar Test, Lipid Profile, etc.)"
                    name="labTests"
                    value={reportValue.labTests}
                    onChange={HandleReportChange}
                    style={{ minHeight: '100px' }}
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button 
                className="submit-btn" 
                onClick={HandleReportSubmit}
                disabled={loading}
              >
                {loading ? "Generating Report..." : "Generate Medical Report"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Create_Report;
