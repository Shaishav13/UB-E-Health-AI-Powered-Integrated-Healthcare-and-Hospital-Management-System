import React from "react";
import { Route, Routes } from "react-router-dom";
import DLogin from "../Pages/Dashboard/Dashboard-Login/DLogin";
import DSignup from "../Pages/Dashboard/Dashboard-Login/Signup/DSignup";
import Add_Admin from "../Pages/Dashboard/Main-Dashboard/AllPages/Admin/Add_Admin";
import Add_Ambulance from "../Pages/Dashboard/Main-Dashboard/AllPages/Admin/Add_Ambulance";
import AddDoctor from "../Pages/Dashboard/Main-Dashboard/AllPages/Admin/Add_Doctor";
import AllReport from "../Pages/Dashboard/Main-Dashboard/AllPages/Doctor/AllReport";
import Check_Appointment from "../Pages/Dashboard/Main-Dashboard/AllPages/Doctor/Check_Appointment";
import Create_Report from "../Pages/Dashboard/Main-Dashboard/AllPages/Doctor/Create_Report";
import Doctor_Profile from "../Pages/Dashboard/Main-Dashboard/AllPages/Doctor/Doctor_Profile";
import Patient_Details from "../Pages/Dashboard/Main-Dashboard/AllPages/Doctor/Patient_Details";
import Book_Appointment from "../Pages/Dashboard/Main-Dashboard/AllPages/Patient/Book_Appointment";
import Patient_Profile from "../Pages/Dashboard/Main-Dashboard/AllPages/Patient/Patient_Profile";
import Payment_Gateway from "../Pages/Dashboard/Main-Dashboard/AllPages/Patient/Payment_Gateway";
import My_Medications from "../Pages/Dashboard/Main-Dashboard/AllPages/Patient/My_Medications";
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
        <Route path="/adminprofile" element={<Admin_Profile />} />
        <Route path="/managedoctors" element={<ManageDoctors />} />
        <Route path="/managepatients" element={<ManagePatients />} />
        ******************** Doctor Part *************************
        <Route path="/reports" element={<AllReport />} />
        <Route path="/checkappointment" element={<Check_Appointment />} />
        <Route path="/createreport" element={<Create_Report />} />
        <Route path="/patientdetails" element={<Patient_Details />} />
        <Route path="/doctorprofile" element={<Doctor_Profile />} />
        ******************** Patient Part *************************
        <Route path="/bookappointment" element={<Book_Appointment />} />
        <Route path="/payment" element={<Payment_Gateway />} />
        <Route path="/patientprofile" element={<Patient_Profile />} />
        <Route path="/mymedications" element={<My_Medications />} />
      </Routes>
    </>
  );
};

export default AllRoutes;
