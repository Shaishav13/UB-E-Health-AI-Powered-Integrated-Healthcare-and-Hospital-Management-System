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

const notify = (text) => toast(text);

const Book_Appointment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [Loading, setLoading] = useState(false);

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

        /* Dropdown + Input Styling */
        select,
        input[type='text'],
        input[type='date'],
        input[type='number'] {
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1.7px solid rgba(11,107,97,0.25);
          background: #f9fafb;
          font-size: 0.95rem;
          transition: 0.25s ease;
        }

        select:focus,
        input:focus {
          outline: none;
          border-color: #0b6b61;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(11,107,97,0.2);
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

        /* Submit Button */
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
      `}</style>

      {/* ---------------- UI STRUCTURE ---------------- */}
      <div className="book-page-container">
        <Sidebar />

        <div className="appointment-wrapper">
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
                        
                        // If no availability is set, provide default time slots
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
                        // Fallback to default times
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
        </div>
      </div>
    </>
  );
};

export default Book_Appointment;
