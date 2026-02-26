import * as types from "./actionTypes";
import axios from "axios";

// Add Lab Personnel
export const addLabPersonnel = (data) => async (dispatch) => {
  try {
    dispatch({ type: types.ADD_LAB_PERSONNEL_REQUEST });
    
    const token = localStorage.getItem("token");
    const res = await axios.post(
      "http://127.0.0.1:3001/lab-personnel/add",
      data,
      {
        headers: {
          Authorization: token,
        },
      }
    );
    
    console.log("Lab personnel added successfully:", res.data);
    
    dispatch({
      type: types.ADD_LAB_PERSONNEL_SUCCESS,
      payload: {
        message: res.data.message,
        labId: res.data.labId,
        email: res.data.email,
      },
    });
    
    return res.data;
  } catch (error) {
    console.error("addLabPersonnel error:", error);
    
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        "Network error";
    
    dispatch({
      type: types.ADD_LAB_PERSONNEL_ERROR,
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

// Get All Lab Personnel
export const getAllLabPersonnel = () => async (dispatch) => {
  try {
    dispatch({ type: types.GET_ALL_LAB_PERSONNEL_REQUEST });
    
    const token = localStorage.getItem("token");
    const res = await axios.get(
      "http://127.0.0.1:3001/lab-personnel/all",
      {
        headers: {
          Authorization: token,
        },
      }
    );
    
    console.log("Lab personnel fetched successfully:", res.data.length);
    
    dispatch({
      type: types.GET_ALL_LAB_PERSONNEL_SUCCESS,
      payload: res.data,
    });
    
    return res.data;
  } catch (error) {
    console.error("getAllLabPersonnel error:", error);
    
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        "Network error";
    
    dispatch({
      type: types.GET_ALL_LAB_PERSONNEL_ERROR,
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

// Get Lab Personnel By ID
export const getLabPersonnelById = (labId) => async (dispatch) => {
  try {
    dispatch({ type: types.GET_LAB_PERSONNEL_BY_ID_REQUEST });
    
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `http://127.0.0.1:3001/lab-personnel/${labId}`,
      {
        headers: {
          Authorization: token,
        },
      }
    );
    
    console.log("Lab personnel fetched successfully:", res.data);
    
    dispatch({
      type: types.GET_LAB_PERSONNEL_BY_ID_SUCCESS,
      payload: res.data,
    });
    
    return res.data;
  } catch (error) {
    console.error("getLabPersonnelById error:", error);
    
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        "Network error";
    
    dispatch({
      type: types.GET_LAB_PERSONNEL_BY_ID_ERROR,
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

// Update Lab Personnel
export const updateLabPersonnel = (labId, data) => async (dispatch) => {
  try {
    dispatch({ type: types.UPDATE_LAB_PERSONNEL_REQUEST });
    
    const token = localStorage.getItem("token");
    const res = await axios.put(
      `http://127.0.0.1:3001/lab-personnel/update/${labId}`,
      data,
      {
        headers: {
          Authorization: token,
        },
      }
    );
    
    console.log("Lab personnel updated successfully:", res.data);
    
    dispatch({
      type: types.UPDATE_LAB_PERSONNEL_SUCCESS,
      payload: {
        message: res.data.message,
        labId: labId,
        updatedData: data, // Include the updated data for optimistic UI update
      },
    });
    
    return res.data;
  } catch (error) {
    console.error("updateLabPersonnel error:", error);
    
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        "Network error";
    
    dispatch({
      type: types.UPDATE_LAB_PERSONNEL_ERROR,
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

// Delete Lab Personnel
export const deleteLabPersonnel = (labId) => async (dispatch) => {
  try {
    dispatch({ type: types.DELETE_LAB_PERSONNEL_REQUEST });
    
    const token = localStorage.getItem("token");
    const res = await axios.delete(
      `http://127.0.0.1:3001/lab-personnel/delete/${labId}`,
      {
        headers: {
          Authorization: token,
        },
      }
    );
    
    console.log("Lab personnel deleted successfully:", res.data);
    
    dispatch({
      type: types.DELETE_LAB_PERSONNEL_SUCCESS,
      payload: {
        message: res.data.message,
        labId: labId,
      },
    });
    
    return res.data;
  } catch (error) {
    console.error("deleteLabPersonnel error:", error);
    
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        "Network error";
    
    dispatch({
      type: types.DELETE_LAB_PERSONNEL_ERROR,
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

// Lab Personnel Login
export const labPersonnelLogin = (credentials) => async (dispatch) => {
  try {
    dispatch({ type: types.LAB_PERSONNEL_LOGIN_REQUEST });
    
    const res = await axios.post(
      "http://127.0.0.1:3001/doctor/login",
      {
        docID: credentials.labId,
        password: credentials.password,
      }
    );
    
    console.log("Lab personnel login successful:", res.data);
    
    // Check if login was successful
    if (res.data.message === "Successful" && res.data.user && res.data.token) {
      // Store token and user data in localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      dispatch({
        type: types.LAB_PERSONNEL_LOGIN_SUCCESS,
        payload: {
          user: res.data.user,
          token: res.data.token,
          message: res.data.message,
        },
      });
      
      return res.data;
    } else {
      // Login failed
      const errorMessage = res.data.message || "Login failed";
      
      dispatch({
        type: types.LAB_PERSONNEL_LOGIN_ERROR,
        payload: {
          message: errorMessage,
        },
      });
      
      return {
        message: errorMessage,
        error: true,
      };
    }
  } catch (error) {
    console.error("labPersonnelLogin error:", error);
    
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        "Network error";
    
    dispatch({
      type: types.LAB_PERSONNEL_LOGIN_ERROR,
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
