import React from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../Components/ProtectedRoute";
import DLogin from "../Pages/Dashboard/Dashboard-Login/DLogin";
import DSignup from "../Pages/Dashboard/Dashboard-Login/Signup/DSignup";
import Add_Admin from "../Pages/Dashboard/Main-Dashboard/AllPages/Admin/Add_Admin";
import Add_Ambulance from "../Pages/Dashboard/Main-Dashboard/AllPages/Admin/Add_Ambulance";
import AddDoctor from "../Pages/Dashboard/Main-Dashboard/AllPages/Admin/Add_Doctor";
import Add_Lab_Personnel from "../Pages/Dashboard/Main-Dashboard/AllPages/Admin/Add_Lab_Personnel";
import View_Lab_Personnel from "../Pages/Dashboard/Main-Dashboard/AllPages/Admin/View_Lab_Personnel";
import Admin_Dashboard from "../Pages/Dashboard/Main-Dashboard/AllPages/Admin/Admin_Dashboard";
import Lab_Dashboard from "../Pages/Dashboard/Main-Dashboard/AllPages/Laboratory/Lab_Dashboard";
import Lab_Test_Requests from "../Pages/Dashboard/Main-Dashboard/AllPages/Laboratory/Lab_Test_Requests";
import Enter_Test_Results from "../Pages/Dashboard/Main-Dashboard/AllPages/Laboratory/Enter_Test_Results";
import Home_Service_Requests from "../Pages/Dashboard/Main-Dashboard/AllPages/Laboratory/Home_Service_Requests";
import AllReport from "../Pages/Dashboard/Main-Dashboard/AllPages/Doctor/AllReport";
import Check_Appointment from "../Pages/Dashboard/Main-Dashboard/AllPages/Doctor/Check_Appointment";
import Create_Report from "../Pages/Dashboard/Main-Dashboard/AllPages/Doctor/Create_Report";
import Doctor_Profile from "../Pages/Dashboard/Main-Dashboard/AllPages/Doctor/Doctor_Profile";
import PatientDetails from "../Pages/Dashboard/Main-Dashboard/AllPages/Doctor/Patient_Details_Hybrid";
import Book_Appointment from "../Pages/Dashboard/Main-Dashboard/AllPages/Patient/Book_Appointment";
import Book_Lab_Test from "../Pages/Dashboard/Main-Dashboard/AllPages/Patient/Book_Lab_Test";
import Patient_Profile from "../Pages/Dashboard/Main-Dashboard/AllPages/Patient/Patient_Profile";
import Payment_Gateway from "../Pages/Dashboard/Main-Dashboard/AllPages/Patient/Payment_Gateway";
import My_Medications from "../Pages/Dashboard/Main-Dashboard/AllPages/Patient/My_Medications";
import My_Appointments from "../Pages/Dashboard/Main-Dashboard/AllPages/Patient/My_Appointments";
import Notification_Settings from "../Pages/Dashboard/Main-Dashboard/AllPages/Patient/Notification_Settings";
import Health_Trends from "../Pages/Dashboard/Main-Dashboard/AllPages/Patient/Health_Trends";
import My_Documents from "../Pages/Dashboard/Main-Dashboard/AllPages/Patient/My_Documents";
import Payment_History from "../Pages/Dashboard/Main-Dashboard/AllPages/Patient/Payment_History";
import Patient_Documents from "../Pages/Dashboard/Main-Dashboard/AllPages/Doctor/Patient_Documents";
import Patient_Dashboard from "../Pages/Dashboard/Main-Dashboard/AllPages/Patient/Patient_Dashboard";
import Doctor_Dashboard from "../Pages/Dashboard/Main-Dashboard/AllPages/Doctor/Doctor_Dashboard";
import FrontPage from "../Pages/Dashboard/Main-Dashboard/GlobalFiles/FrontPage";
import Admin_Profile from "../Pages/Dashboard/Main-Dashboard/AllPages/Admin/Admin_Profile";
import ManageDoctors from "../Pages/Dashboard/Main-Dashboard/AllPages/Admin/Manage_Doctors";
import ManagePatients from "../Pages/Dashboard/Main-Dashboard/AllPages/Admin/Manage_Patients";
import SignupDetails from "../Pages/Dashboard/Dashboard-Login/Signup/SignupDetails";
const AllRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<DLogin />} />
        <Route path="/signup" element={<DSignup />} />
        <Route path="/adddetails" element={<SignupDetails />} />
        <Route path="/dashboard" element={<FrontPage />} />
        <Route path="/addoctor" element={<AddDoctor />} />
        <Route path="/addambulance" element={<Add_Ambulance />} />
        <Route path="/addadmin" element={<Add_Admin />} />
        <Route path="/admindashboard" element={<ProtectedRoute element={<Admin_Dashboard />} allowedRoles={["admin"]} />} />
        <Route path="/adminprofile" element={<Admin_Profile />} />
        <Route path="/managedoctors" element={<ManageDoctors />} />
        <Route path="/managepatients" element={<ManagePatients />} />
        <Route path="/addlabpersonnel" element={<ProtectedRoute element={<Add_Lab_Personnel />} allowedRoles={["admin"]} />} />
        <Route path="/viewlabpersonnel" element={<ProtectedRoute element={<View_Lab_Personnel />} allowedRoles={["admin"]} />} />
        {/* ******************** Laboratory Part ************************* */}
        <Route path="/labdashboard" element={<ProtectedRoute element={<Lab_Dashboard />} allowedRoles={["laboratory"]} />} />
        <Route path="/labtestrequests" element={<ProtectedRoute element={<Lab_Test_Requests />} allowedRoles={["laboratory"]} />} />
        <Route path="/entertestresults/:id" element={<ProtectedRoute element={<Enter_Test_Results />} allowedRoles={["laboratory"]} />} />
        <Route path="/homeservicerequests" element={<ProtectedRoute element={<Home_Service_Requests />} allowedRoles={["laboratory"]} />} />
        {/* ******************** Doctor Part ************************* */}
        <Route path="/doctor/dashboard" element={<Doctor_Dashboard />} />
        <Route path="/reports" element={<AllReport />} />
        <Route path="/checkappointment" element={<Check_Appointment />} />
        <Route path="/createreport" element={<Create_Report />} />
        <Route path="/patientdetails" element={<PatientDetails />} />
        <Route path="/doctorprofile" element={<Doctor_Profile />} />
        {/* ******************** Patient Part ************************* */}
        <Route path="/patient/dashboard" element={<Patient_Dashboard />} />
        <Route path="/patient/book-appointment" element={<Book_Appointment />} />
        <Route path="/patient/book-lab-test" element={<Book_Lab_Test />} />
        <Route path="/patient/payment" element={<Payment_Gateway />} />
        <Route path="/patient/profile" element={<Patient_Profile />} />
        <Route path="/patient/medications" element={<My_Medications />} />
        <Route path="/patient/appointments" element={<My_Appointments />} />
        <Route path="/patient/notifications" element={<Notification_Settings />} />
        <Route path="/patient/health-trends" element={<Health_Trends />} />
        <Route path="/patient/documents" element={<My_Documents />} />
        <Route path="/patient/reports" element={<AllReport />} />
        <Route path="/patient/payment-history" element={<Payment_History />} />
        {/* Legacy routes for backward compatibility */}
        <Route path="/bookappointment" element={<Book_Appointment />} />
        <Route path="/booklabtest" element={<Book_Lab_Test />} />
        <Route path="/payment" element={<Payment_Gateway />} />
        <Route path="/patientprofile" element={<Patient_Profile />} />
        <Route path="/mymedications" element={<My_Medications />} />
        <Route path="/myappointments" element={<My_Appointments />} />
        <Route path="/notificationsettings" element={<Notification_Settings />} />
        <Route path="/healthtrends" element={<Health_Trends />} />
        <Route path="/mydocuments" element={<My_Documents />} />
        <Route path="/patientdocuments" element={<Patient_Documents />} />
      </Routes>
    </>
  );
};

export default AllRoutes;
