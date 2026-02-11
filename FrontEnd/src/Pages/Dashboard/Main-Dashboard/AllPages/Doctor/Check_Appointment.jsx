import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import CollapsibleTable from "../../../../../Components/Table/CollapsibleTable";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  DeleteAppointment,
  GetAppointments,
} from "../../../../../Redux/Datas/action";
import Sidebar from "../../GlobalFiles/Sidebar";
import { generateReceipt } from "../../../../../Components/ReceiptGenerator";
import { convertTo12Hour } from "../../../../../utils/timeFormat";

const notify = (text) => toast(text);

const Check_Appointment = () => {
  const { data } = useSelector((store) => store.auth);
  const { patients = [] } = useSelector((store) => store.data.patients || {});
  const { doctors = [] } = useSelector((store) => store.data.doctors || {});
  const { appointments } = useSelector((store) => store.data.appointments);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (data?.user?.userType && data?.user?._id) {
      console.log("Fetching appointments for:", data.user.userType, data.user._id);
      dispatch(GetAppointments(data.user.userType, data.user._id));
    }
  }, [dispatch, data?.user?.userType, data?.user?._id]);

  // Handle force refresh from navigation state
  useEffect(() => {
    if (location.state?.forceRefresh) {
      console.log("Force refresh requested from navigation state");
      refreshAppointments();
      // Clear the state to prevent repeated refreshes
      navigate(location.pathname, { replace: true });
    }
  }, [location.state]);

  // Add effect to refresh appointments when returning to this page
  useEffect(() => {
    const handleFocus = () => {
      console.log("Page focused - refreshing appointments");
      refreshAppointments();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Also refresh when component mounts
  useEffect(() => {
    refreshAppointments();
  }, []);

  // Add debugging to see what appointments are being received
  useEffect(() => {
    console.log("=== APPOINTMENTS DEBUG ===");
    console.log("Raw appointments from Redux:", appointments);
    console.log("Is appointments an array?", Array.isArray(appointments));
    console.log("Appointments length:", appointments?.length);
    console.log("User type:", data?.user?.userType);
    console.log("=== END DEBUG ===");
  }, [appointments, data?.user?.userType]);

  // Add a refresh function
  const refreshAppointments = () => {
    if (data?.user?.userType && data?.user?._id) {
      console.log("Refreshing appointments...");
      dispatch(GetAppointments(data.user.userType, data.user._id));
    }
  };

  // Add safety checks for data loading - only check for appointments
  const isLoading = !appointments || appointments === undefined;
  
  if (!data?.user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading user data...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        <style>{`
          .loading-container {
            display: flex;
            min-height: 100vh;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          }
          .loading-content {
            flex: 1;
            padding: 2.5rem 3rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #e2e8f0;
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .loading-text {
            margin-top: 1.5rem;
            font-size: 1.1rem;
            color: #6b7280;
          }
        `}</style>
        <div className="loading-container">
          <Sidebar />
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">Loading appointments...</p>
          </div>
        </div>
      </>
    );
  }

  // Ensure appointments is an array (backend now filters out completed appointments)
  const appointmentsArray = Array.isArray(appointments) ? appointments : [];

  console.log("Final appointmentsArray:", appointmentsArray);
  console.log("appointmentsArray length:", appointmentsArray.length);

  // Show message if no pending appointments
  if (appointmentsArray.length === 0) {
    return (
      <>
        <style>{`
          .no-appointments {
            display: flex;
            min-height: 100vh;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          }
          .no-appointments-content {
            flex: 1;
            padding: 2.5rem 3rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .no-appointments-card {
            background: white;
            padding: 3rem 2.5rem;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 100%;
          }
          .no-appointments-icon {
            font-size: 4rem;
            margin-bottom: 1.5rem;
            animation: float 3s ease-in-out infinite;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .no-appointments-title {
            font-size: 1.75rem;
            font-weight: 700;
            background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1rem;
          }
          .no-appointments-message {
            font-size: 1rem;
            color: #6b7280;
            margin-bottom: 2rem;
            line-height: 1.6;
          }
          .refresh-btn {
            background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%);
            color: white;
            border: none;
            padding: 0.875rem 1.75rem;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
          }
          .refresh-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(14, 165, 233, 0.4);
          }
          .refresh-btn:active {
            transform: translateY(0);
          }
        `}</style>
        <div className="no-appointments">
          <Sidebar />
          <div className="no-appointments-content">
            <div className="no-appointments-card">
              <div className="no-appointments-icon">📅</div>
              <h2 className="no-appointments-title">No Current Appointments</h2>
              <p className="no-appointments-message">
                {data.user.userType === "doctor" 
                  ? "You don't have any pending appointments at the moment. All appointments have been completed or there are no new bookings."
                  : "You don't have any upcoming appointments. Book an appointment with a doctor to get started."
                }
              </p>
              <button className="refresh-btn" onClick={refreshAppointments}>
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const patient =
    data.user.userType === "patient"
      ? patients?.find((patient) => patient._id === data.user._id)
      : appointmentsArray.map((appointment) => {
          // For doctor view, get patient from populated patientId
          return appointment.patientId || patients?.find(
            (patient) => patient._id === appointment.patientId
          );
        });

  const doctor =
    data.user.userType === "patient"
      ? appointmentsArray.map((appointment) => {
          // For patient view, get doctor from populated doctorId
          return appointment.doctorId || doctors?.find(
            (doctor) => doctor._id === appointment.doctorId
          );
        })
      : doctors?.find((doctor) => doctor._id === data.user._id);

  const createData = (
    id,
    name,
    date,
    time,
    phonenum,
    department,
    fees,
    problem,
    buttonText,
    hasReceipt = false
  ) => ({
    id,
    name,
    date,
    time,
    buttonText,
    hasReceipt,
    details: [{ 
      phonenum: String(phonenum || "N/A"), 
      department: String(department || "N/A"), 
      problem: String(problem || "N/A"), 
      fees: fees || "N/A" 
    }],
  });

  const columns = [
    { userType: data.user.userType, label: "Name", align: "left" },
    { label: "Date", align: "right" },
    { label: "Time", align: "right" },
    {
      label:
        data.user.userType === "patient"
          ? "Cancel Appointment"
          : "Generate Report",
      align: "right",
    },
  ];

  const datas = appointmentsArray.map((appointment, index) => {
    const appointmentId = appointment._id || appointment.id;
    const appointmentDate = appointment.date ? new Date(appointment.date).toISOString().split('T')[0] : "N/A"; // Format as YYYY-MM-DD
    const appointmentTime = appointment.time ? convertTo12Hour(appointment.time) : "N/A";
    const appointmentProblem = appointment.reason || appointment.problem || "N/A";
    const hasReceipt = !!(appointment.tokenId && appointment.payment_id); // Check if receipt exists
    
    // Debug logging
    console.log("=== APPOINTMENT RECEIPT CHECK ===");
    console.log("Appointment ID:", appointmentId);
    console.log("tokenId:", appointment.tokenId);
    console.log("payment_id:", appointment.payment_id);
    console.log("hasReceipt:", hasReceipt);
    console.log("User type:", data.user.userType);
    console.log("Full appointment object:", appointment);
    console.log("================================");
    
    if (data.user.userType === "patient") {
      // For patient view, show doctor details
      const doctorInfo = Array.isArray(doctor) ? doctor[index] : appointment.doctorId;
      return createData(
        appointmentId,
        doctorInfo?.name || "Unknown Doctor",
        appointmentDate,
        appointmentTime,
        String(doctorInfo?.phoneNum || doctorInfo?.phonenum || "N/A"),
        doctorInfo?.department || "N/A",
        doctorInfo?.fees || "N/A",
        appointmentProblem,
        "Cancel",
        hasReceipt
      );
    } else {
      // For doctor view, show patient details
      const patientInfo = Array.isArray(patient) ? patient[index] : appointment.patientId;
      return createData(
        appointmentId,
        patientInfo?.name || "Unknown Patient",
        appointmentDate,
        appointmentTime,
        String(patientInfo?.phonenum || "N/A"),
        doctor?.department || "N/A",
        doctor?.fees || "N/A",
        appointmentProblem,
        "Generate Report",
        false // Doctors don't need receipt download
      );
    }
  });

  // Handler for downloading receipt
  const handleDownloadReceipt = (appointmentId) => {
    console.log("Download receipt for appointment:", appointmentId);
    const appointment = appointmentsArray.find((a) => (a.id || a._id) === appointmentId);
    
    if (!appointment) {
      notify("Appointment not found");
      return;
    }
    
    if (!appointment.tokenId || !appointment.payment_id) {
      notify("Receipt not available for this appointment");
      return;
    }
    
    try {
      // Generate and download the receipt
      generateReceipt(appointment, data.user);
      notify("Receipt downloaded successfully");
    } catch (error) {
      console.error("Error generating receipt:", error);
      notify("Failed to generate receipt");
    }
  };

  const clicked = (index) => {
    console.log("Generate Report clicked for appointment:", index);
    console.log("User type:", data.user.userType);
    console.log("User data:", data.user);
    
    if (data.user.userType === "patient") {
      console.log("Executing PATIENT logic - deleting appointment");
      dispatch(DeleteAppointment(index)).then((res) => {
        if (res?.message === "successful") {
          notify("Appointment Cancelled");
          // Refresh appointments after successful deletion
          refreshAppointments();
        } else {
          notify("Error cancelling appointment");
        }
      }).catch((error) => {
        console.error("Error deleting appointment:", error);
        notify("Error cancelling appointment");
      });
    } else {
      console.log("Executing DOCTOR logic - navigating to create report");
      // For doctor - find the appointment and navigate to create report
      const appointment = appointmentsArray.find((a) => (a.id || a._id) === index);
      console.log("Found appointment:", appointment);
      console.log("Appointment patientId:", appointment?.patientId);
      console.log("Appointment doctorId:", appointment?.doctorId);
      
      if (appointment) {
        // Handle both populated and non-populated patient/doctor data
        let patientId, doctorId;
        
        // If patientId is an object (populated), get its _id, otherwise use it directly
        if (typeof appointment.patientId === 'object' && appointment.patientId !== null) {
          patientId = appointment.patientId._id;
        } else {
          patientId = appointment.patientId;
        }
        
        // If doctorId is an object (populated), get its _id, otherwise use it directly
        if (typeof appointment.doctorId === 'object' && appointment.doctorId !== null) {
          doctorId = appointment.doctorId._id;
        } else {
          doctorId = appointment.doctorId;
        }
        
        // Fallback to current user's ID for doctor
        doctorId = doctorId || data.user._id;
        
        // Prepare appointment data for the Create_Report component
        const appointmentData = {
          id: appointment._id || appointment.id,
          appointmentId: appointment._id || appointment.id, // Add both for compatibility
          patientid: patientId,
          doctorid: doctorId,
          patientName: appointment.patientId?.name || "Unknown Patient",
          doctorName: data.user.name,
          date: appointment.date,
          time: appointment.time,
          reason: appointment.reason || appointment.problem
        };
        
        console.log("Final appointment data for navigation:", appointmentData);
        navigate("/createreport", { state: appointmentData });
      } else {
        console.error("No appointment found with ID:", index);
        notify("Appointment not found. Please try again.");
      }
    }
  };

  if (!data?.isAuthenticated) return <Navigate to={"/"} />;
  if (data?.user.userType === "admin") return <Navigate to={"/dashboard"} />;

  return (
    <>
      <ToastContainer />

      {/* ---------------- Enhanced Inline CSS ---------------- */}
      <style>{`
        .appointments-page {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          width: 100%;
          position: relative;
        }

        .appointments-page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="appointment-pattern" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="2" fill="rgba(102,126,234,0.05)"/><circle cx="10" cy="10" r="1" fill="rgba(52,211,153,0.05)"/><circle cx="50" cy="10" r="1" fill="rgba(52,211,153,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23appointment-pattern)"/></svg>');
          pointer-events: none;
        }

        .appointments-content {
          flex: 1;
          padding: 2.5rem 3rem;
          position: relative;
          z-index: 1;
        }

        .appointments-title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 2rem;
          text-align: center;
          letter-spacing: -0.02em;
        }

        .appointments-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 2.5rem;
          border-radius: 24px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 1px 0 rgba(255, 255, 255, 0.2) inset;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          max-width: 1400px;
          margin: 0 auto;
        }

        .appointments-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .appointments-card:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 32px 64px rgba(0, 0, 0, 0.15),
            0 1px 0 rgba(255, 255, 255, 0.3) inset;
        }

        .table-wrapper {
          border-radius: 16px;
          overflow: hidden;
          margin-top: 0;
          background: rgba(248, 250, 252, 0.8);
        }

        /* Enhanced Material-UI Table Styling */
        .MuiTableContainer-root {
          border-radius: 16px !important;
          box-shadow: none !important;
          background: transparent !important;
        }

        .MuiTable-root {
          background: transparent !important;
        }

        .MuiTableHead-root .MuiTableRow-root {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        }

        .MuiTableHead-root .MuiTableCell-root {
          background: transparent !important;
          color: white !important;
          font-weight: 700 !important;
          font-size: 0.95rem !important;
          padding: 1.2rem 1rem !important;
          border: none !important;
          position: relative !important;
        }

        .MuiTableHead-root .MuiTableCell-root::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(255, 255, 255, 0.3);
        }

        .MuiTableBody-root .MuiTableRow-root {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .MuiTableBody-root .MuiTableRow-root:hover {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(52, 211, 153, 0.08) 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15) !important;
        }

        .MuiTableBody-root .MuiTableCell-root {
          border-bottom: 1px solid rgba(102, 126, 234, 0.1) !important;
          font-weight: 500 !important;
          padding: 1rem !important;
          color: #374151 !important;
        }

        .MuiTableBody-root .MuiTableRow-root:nth-child(even) .MuiTableCell-root {
          background: rgba(248, 250, 252, 0.5) !important;
        }

        .MuiTableBody-root .MuiTableRow-root:nth-child(odd) .MuiTableCell-root {
          background: rgba(255, 255, 255, 0.8) !important;
        }

        /* Enhanced Collapse Section */
        .MuiCollapse-root .MuiBox-root {
          background: rgba(248, 250, 252, 0.9) !important;
          border-radius: 12px !important;
          margin: 0.5rem !important;
          padding: 1rem !important;
        }

        .MuiCollapse-root .MuiTypography-h6 {
          color: #374151 !important;
          font-weight: 700 !important;
          margin-bottom: 1rem !important;
        }

        .MuiCollapse-root .MuiTable-root {
          background: rgba(255, 255, 255, 0.8) !important;
          border-radius: 8px !important;
          overflow: hidden !important;
        }

        .MuiCollapse-root .MuiTableHead-root .MuiTableCell-root {
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          font-size: 0.9rem !important;
          padding: 0.8rem !important;
        }

        .MuiCollapse-root .MuiTableBody-root .MuiTableCell-root {
          font-size: 0.9rem !important;
          padding: 0.8rem !important;
          border-bottom: 1px solid rgba(52, 211, 153, 0.1) !important;
        }

        /* Enhanced IconButton */
        .MuiIconButton-root {
          background: rgba(102, 126, 234, 0.1) !important;
          border-radius: 8px !important;
          transition: all 0.3s ease !important;
        }

        .MuiIconButton-root:hover {
          background: rgba(102, 126, 234, 0.2) !important;
          transform: scale(1.1) !important;
        }

        .MuiIconButton-root .MuiSvgIcon-root {
          color: #667eea !important;
        }

        /* Enhanced Ant Design Button */
        .ant-btn {
          border-radius: 12px !important;
          font-weight: 600 !important;
          padding: 0.5rem 1.2rem !important;
          height: auto !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .ant-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          border: none !important;
          color: white !important;
        }

        .ant-btn-primary:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4) !important;
        }

        .ant-btn-dangerous {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
          border: none !important;
          color: white !important;
        }

        .ant-btn-dangerous:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4) !important;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .appointments-content {
            padding: 1.5rem 1rem;
          }

          .appointments-card {
            padding: 1.5rem;
          }

          .appointments-title {
            font-size: 2rem;
          }
        }
      `}</style>

      {/* ---------------- Page Layout ---------------- */}
      <div className="appointments-page">
        <Sidebar />

        <div className="appointments-content">
          <h1 className="appointments-title">📅 Appointment Details</h1>

          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <button 
              onClick={refreshAppointments}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🔄 Refresh Appointments
            </button>
          </div>

          <div className="appointments-card">
            <div className="table-wrapper">
              <CollapsibleTable 
                data={datas} 
                columns={columns} 
                onDelete={clicked}
                onDownloadReceipt={data.user.userType === "patient" ? handleDownloadReceipt : null}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Check_Appointment;
