import axios from "axios";
import * as types from "./actionTypes";

const API_URL = "http://127.0.0.1:3001";

/**
 * Create payment order
 */
export const createPaymentOrder = (paymentData) => async (dispatch, getState) => {
  dispatch({ type: types.CREATE_PAYMENT_ORDER_REQUEST });

  try {
    const { token } = getState().auth.data;
    
    const config = {
      headers: {
        Authorization: token,
        "Content-Type": "application/json"
      }
    };

    const response = await axios.post(
      `${API_URL}/payments/create-order`,
      paymentData,
      config
    );

    dispatch({
      type: types.CREATE_PAYMENT_ORDER_SUCCESS,
      payload: response.data.data
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    
    dispatch({
      type: types.CREATE_PAYMENT_ORDER_FAILURE,
      payload: errorMessage
    });

    throw error;
  }
};

/**
 * Verify payment
 */
export const verifyPayment = (verificationData) => async (dispatch, getState) => {
  dispatch({ type: types.VERIFY_PAYMENT_REQUEST });

  try {
    const { token } = getState().auth.data;
    
    const config = {
      headers: {
        Authorization: token,
        "Content-Type": "application/json"
      }
    };

    const response = await axios.post(
      `${API_URL}/payments/verify`,
      verificationData,
      config
    );

    dispatch({
      type: types.VERIFY_PAYMENT_SUCCESS,
      payload: response.data.data
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    
    dispatch({
      type: types.VERIFY_PAYMENT_FAILURE,
      payload: errorMessage
    });

    throw error;
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = (filters = {}) => async (dispatch, getState) => {
  dispatch({ type: types.GET_PAYMENT_HISTORY_REQUEST });

  try {
    const { token } = getState().auth.data;
    
    const config = {
      headers: {
        Authorization: token
      },
      params: filters
    };

    const response = await axios.get(
      `${API_URL}/payments/history`,
      config
    );

    dispatch({
      type: types.GET_PAYMENT_HISTORY_SUCCESS,
      payload: response.data.data
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    
    dispatch({
      type: types.GET_PAYMENT_HISTORY_FAILURE,
      payload: errorMessage
    });

    throw error;
  }
};

/**
 * Get payment details
 */
export const getPaymentDetails = (paymentId) => async (dispatch, getState) => {
  dispatch({ type: types.GET_PAYMENT_DETAILS_REQUEST });

  try {
    const { token } = getState().auth.data;
    
    const config = {
      headers: {
        Authorization: token
      }
    };

    const response = await axios.get(
      `${API_URL}/payments/${paymentId}`,
      config
    );

    dispatch({
      type: types.GET_PAYMENT_DETAILS_SUCCESS,
      payload: response.data.data
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    
    dispatch({
      type: types.GET_PAYMENT_DETAILS_FAILURE,
      payload: errorMessage
    });

    throw error;
  }
};

/**
 * Request refund
 */
export const requestRefund = (paymentId, refundData) => async (dispatch, getState) => {
  dispatch({ type: types.REQUEST_REFUND_REQUEST });

  try {
    const { token } = getState().auth.data;
    
    const config = {
      headers: {
        Authorization: token,
        "Content-Type": "application/json"
      }
    };

    const response = await axios.post(
      `${API_URL}/payments/${paymentId}/refund`,
      refundData,
      config
    );

    dispatch({
      type: types.REQUEST_REFUND_SUCCESS,
      payload: response.data.data
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    
    dispatch({
      type: types.REQUEST_REFUND_FAILURE,
      payload: errorMessage
    });

    throw error;
  }
};

/**
 * Get payment methods
 */
export const getPaymentMethods = () => async (dispatch) => {
  dispatch({ type: types.GET_PAYMENT_METHODS_REQUEST });

  try {
    const response = await axios.get(`${API_URL}/payments/methods/available`);

    dispatch({
      type: types.GET_PAYMENT_METHODS_SUCCESS,
      payload: response.data.data
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    
    dispatch({
      type: types.GET_PAYMENT_METHODS_FAILURE,
      payload: errorMessage
    });

    throw error;
  }
};

/**
 * Clear payment state
 */
export const clearPaymentState = () => ({
  type: types.CLEAR_PAYMENT_STATE
});
