import * as types from "./types";
import axios from "axios";

// CreateReport
export const CreateReport = (data) => async (dispatch) => {
  try {
    dispatch({ type: types.CREATE_REPORT_REQUEST });
    const res = await axios.post("http://127.0.0.1:3001/reports/create", data);
    console.log("CreateReport success:", res.data);
    dispatch({
      type: types.CREATE_REPORT_SUCCESS,
      payload: res.data,
    });
    return res.data;
  } catch (error) {
    console.error("CreateReport error:", error);
    const errorMessage = error.response?.data?.details || error.response?.data?.message || error.message;
    dispatch({
      type: types.CREATE_REPORT_ERROR,
      payload: {
        message: errorMessage,
      },
    });
    return { message: "error", details: errorMessage };
  }
};

// UpdateReport
export const UpdateReport = (reportId, data) => async (dispatch) => {
  try {
    dispatch({ type: types.UPDATE_REPORT_REQUEST });
    const res = await axios.put(`http://127.0.0.1:3001/reports/update/${reportId}`, data);
    console.log("UpdateReport success:", res.data);
    dispatch({
      type: types.UPDATE_REPORT_SUCCESS,
      payload: res.data,
    });
    return res.data;
  } catch (error) {
    console.error("UpdateReport error:", error);
    const errorMessage = error.response?.data?.details || error.response?.data?.message || error.message;
    dispatch({
      type: types.UPDATE_REPORT_ERROR,
      payload: {
        message: errorMessage,
      },
    });
    return { message: "error", details: errorMessage };
  }
};

// GET DOCTOR DETAILS
export const GetDoctorDetails = () => async (dispatch) => {
  try {
    dispatch({ type: types.GET_DOCTOR_REQUEST });
    const res = await axios.get("http://127.0.0.1:3001/doctors");
    console.log("this", res);
    const doctors = { doctors: res.data };
    dispatch({
      type: types.GET_DOCTOR_SUCCESS,
      payload: doctors,
    });
  } catch (error) {
    dispatch({
      type: types.GET_DOCTOR_ERROR,
      payload: {
        message: error,
      },
    });
  }
};

export const GetAdminDetails = () => async (dispatch) => {
  try {
    dispatch({ type: types.GET_ADMIN_REQUEST });
    const res = await axios.get("http://127.0.0.1:3001/admin");
    console.log(res.data);
    const admins = { admins: res.data };
    dispatch({
      type: types.GET_ADMIN_SUCCESS,
      payload: admins,
    });
  } catch (error) {
    dispatch({
      type: types.GET_ADMIN_ERROR,
      payload: {
        message: error,
      },
    });
  }
};

export const GetMedicineDetails = (patientid) => async (dispatch) => {
  try {
    dispatch({ type: types.GET_MEDICINE_REQUEST });
    const res = await axios.post(
      `http://127.0.0.1:3001/prescriptions/${patientid}`
    );
    //axios.post
    console.log(res.data);
    const medicines = { medicines: res.data };
    dispatch({
      type: types.GET_MEDICINE_SUCCESS,
      payload: medicines,
    });
  } catch (error) {
    console.log(error);
  }
};

//CREATE BOOKING
export const CreateBooking = (data) => async (dispatch) => {
  try {
    console.log("CreateBooking - Sending data:", JSON.stringify(data, null, 2));
    dispatch({ type: types.CREATE_BOOKING_REQUEST });
    const res = await axios.post(
      `http://127.0.0.1:3001/appointments/create`,
      data
    );
    console.log("CreateBooking - Response:", res);
    return res.data;
    // dispatch({ type: types.CREATE_BOOKING_SUCCESS, payload: res.data.postData });
  } catch (error) {
    console.log("CreateBooking - Error:", error);
    return { message: "Error creating appointment", error: true };
  }
};

// GET ALL PATIENT
export const GetPatients = () => async (dispatch) => {
  try {
    dispatch({ type: types.GET_PATIENT_REQUEST });
    const res = await axios.get(`http://127.0.0.1:3001/patients`);
    console.log("pats", res);
    const patients = { patients: res.data };
    dispatch({
      type: types.GET_PATIENT_SUCCESS,
      payload: patients,
    });
  } catch (error) {
    dispatch({
      type: types.GET_PATIENT_ERROR,
      payload: {
        message: error,
      },
    });
  }
};

// GET ALL DATA
export const GetAllData = () => async (dispatch) => {
  try {
    dispatch({ type: types.GET_ALLDATA_REQUEST });
    const res = await axios.get(`http://127.0.0.1:3001/hospitals`);
    console.log(res.data);
    dispatch({
      type: types.GET_ALLDATA_SUCCESS,
      payload: res.data,
    });
  } catch (error) {
    console.log(error);
  }
};

// GET ALL APPOINTMENT DETAILS
export const GetAppointments = (userType, id) => async (dispatch) => {
  try {
    dispatch({ type: types.GET_APPOINTMENT_DETAILS_REQUEST });
    const res = await axios.get(
      `http://127.0.0.1:3001/appointments/${userType}/${id}`
    );
    console.log("GetAppointments API response:", res.data);
    console.log("Appointments data:", res.data.data);
    console.log("Number of appointments:", res.data.data?.length || 0);
    
    // return res.data;
    const appointments = { appointments: res.data.data || [] }; // Ensure it's always an array
    dispatch({
      type: types.GET_APPOINTMENT_DETAILS_SUCCESS,
      payload: appointments,
    });
  } catch (error) {
    console.error("Error in GetAppointments:", error);
    // Dispatch empty array on error
    dispatch({
      type: types.GET_APPOINTMENT_DETAILS_SUCCESS,
      payload: { appointments: [] },
    });
  }
};

// DELETE APPOINTMENTS
export const DeleteAppointment = (id) => async (dispatch) => {
  try {
    dispatch({ type: types.DELETE_APPOINTMENT_REQUEST });
    const res = await axios.delete(`http://127.0.0.1:3001/appointments/${id}`);
    console.log(res.data);
    // return res.data;
    dispatch({
      type: types.DELETE_APPOINTMENT_SUCCESS,
      payload: id,
    });
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const GetAllReports = (userType, id) => async (dispatch) => {
  try {
    console.log("action :", userType, id);
    dispatch({ type: types.GET_REPORTS_REQUEST });
    const res = await axios.get(
      `http://127.0.0.1:3001/reports/${userType}/${id}`
    );
    console.log("res", res.data);
    const reports = { reports: res.data.data };
    dispatch({
      type: types.GET_REPORTS_SUCCESS,
      payload: reports,
    });
    return res.data;
  } catch (error) {
    console.error("Error in GetAllReports:", error);
    console.error("Error response:", error.response?.data);
    dispatch({
      type: types.GET_REPORTS_FAILURE,
      payload: error.response?.data || { message: "Network error" },
    });
    return { message: "error", details: error.response?.data?.details || error.message };
  }
};

// GET PATIENTS BY DOCTOR
export const GetPatientsByDoctor = () => async (dispatch) => {
  try {
    dispatch({ type: types.GET_PATIENTS_BY_DOCTOR_REQUEST });
    const token = localStorage.getItem("token");
    const res = await axios.get("http://127.0.0.1:3001/doctors/patients", {
      headers: {
        Authorization: token,
      },
    });
    console.log("patients by doctor", res);
    const patients = { patients: res.data };
    dispatch({
      type: types.GET_PATIENTS_BY_DOCTOR_SUCCESS,
      payload: patients,
    });
  } catch (error) {
    dispatch({
      type: types.GET_PATIENTS_BY_DOCTOR_ERROR,
      payload: {
        message: error,
      },
    });
  }
};
