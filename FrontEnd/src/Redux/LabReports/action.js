import * as types from "./actionTypes";
import axios from "axios";

// Get All Lab Reports
export const getAllLabReports = () => async (dispatch) => {
  try {
    dispatch({ type: types.GET_ALL_LAB_REPORTS_REQUEST });
    
    const token = localStorage.getItem("token");
    const res = await axios.get(
      "http://127.0.0.1:3001/lab-reports/all",
      {
        headers: {
          Authorization: token,
        },
      }
    );
    
    console.log("Lab reports fetched successfully:", res.data.length);
    
    dispatch({
      type: types.GET_ALL_LAB_REPORTS_SUCCESS,
      payload: res.data,
    });
    
    return res.data;
  } catch (error) {
    console.error("getAllLabReports error:", error);
    
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        "Network error";
    
    dispatch({
      type: types.GET_ALL_LAB_REPORTS_ERROR,
      payload: {
        message: errorMessage,
        details: error.response?.data?.details,
      },
    });
    
    // Return error response so frontend can handle it
    return {
      message: errorMessage,
      error: true,
      details: error.response?.data?.details,
    };
  }
};

// Update Lab Report Status
export const updateLabReportStatus = (id, status) => async (dispatch) => {
  try {
    dispatch({ type: types.UPDATE_LAB_REPORT_STATUS_REQUEST });
    
    const token = localStorage.getItem("token");
    const res = await axios.put(
      `http://127.0.0.1:3001/lab-reports/update-status/${id}`,
      { status },
      {
        headers: {
          Authorization: token,
        },
      }
    );
    
    console.log("Lab report status updated successfully:", res.data);
    
    dispatch({
      type: types.UPDATE_LAB_REPORT_STATUS_SUCCESS,
      payload: res.data.labReport,
    });
    
    return res.data;
  } catch (error) {
    console.error("updateLabReportStatus error:", error);
    
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        "Network error";
    
    dispatch({
      type: types.UPDATE_LAB_REPORT_STATUS_ERROR,
      payload: {
        message: errorMessage,
        details: error.response?.data?.details,
      },
    });
    
    // Return error response so frontend can handle it
    return {
      message: errorMessage,
      error: true,
      details: error.response?.data?.details,
    };
  }
};

// Add Lab Report Results
export const addLabReportResults = (id, results) => async (dispatch) => {
  try {
    dispatch({ type: types.ADD_LAB_REPORT_RESULTS_REQUEST });
    
    const token = localStorage.getItem("token");
    const res = await axios.put(
      `http://127.0.0.1:3001/lab-reports/add-results/${id}`,
      { results },
      {
        headers: {
          Authorization: token,
        },
      }
    );
    
    console.log("Lab report results added successfully:", res.data);
    
    dispatch({
      type: types.ADD_LAB_REPORT_RESULTS_SUCCESS,
      payload: res.data.labReport,
    });
    
    return res.data;
  } catch (error) {
    console.error("addLabReportResults error:", error);
    
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        "Network error";
    
    dispatch({
      type: types.ADD_LAB_REPORT_RESULTS_ERROR,
      payload: {
        message: errorMessage,
        details: error.response?.data?.details,
      },
    });
    
    // Return error response so frontend can handle it
    return {
      message: errorMessage,
      error: true,
      details: error.response?.data?.details,
    };
  }
};

// Get Home Service Requests
export const getHomeServiceRequests = () => async (dispatch) => {
  try {
    dispatch({ type: types.GET_HOME_SERVICE_REQUESTS_REQUEST });
    
    const token = localStorage.getItem("token");
    const res = await axios.get(
      "http://127.0.0.1:3001/lab-reports/home-service",
      {
        headers: {
          Authorization: token,
        },
      }
    );
    
    console.log("Home service requests fetched successfully:", res.data.count);
    
    dispatch({
      type: types.GET_HOME_SERVICE_REQUESTS_SUCCESS,
      payload: res.data.labReports,
    });
    
    return res.data;
  } catch (error) {
    console.error("getHomeServiceRequests error:", error);
    
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        "Network error";
    
    dispatch({
      type: types.GET_HOME_SERVICE_REQUESTS_ERROR,
      payload: {
        message: errorMessage,
        details: error.response?.data?.details,
      },
    });
    
    // Return error response so frontend can handle it
    return {
      message: errorMessage,
      error: true,
      details: error.response?.data?.details,
    };
  }
};

// Get Patient Lab History
export const getPatientLabHistory = (patientId) => async (dispatch) => {
  try {
    dispatch({ type: types.GET_PATIENT_LAB_HISTORY_REQUEST });
    
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `http://127.0.0.1:3001/lab-reports/patient/${patientId}/history`,
      {
        headers: {
          Authorization: token,
        },
      }
    );
    
    console.log("Patient lab history fetched successfully:", res.data.count);
    
    dispatch({
      type: types.GET_PATIENT_LAB_HISTORY_SUCCESS,
      payload: res.data.labReports,
    });
    
    return res.data;
  } catch (error) {
    console.error("getPatientLabHistory error:", error);
    
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        "Network error";
    
    dispatch({
      type: types.GET_PATIENT_LAB_HISTORY_ERROR,
      payload: {
        message: errorMessage,
        details: error.response?.data?.details,
      },
    });
    
    // Return error response so frontend can handle it
    return {
      message: errorMessage,
      error: true,
      details: error.response?.data?.details,
    };
  }
};
