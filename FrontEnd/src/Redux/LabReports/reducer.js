import * as types from "./actionTypes";

const initialState = {
  labReports: [],
  homeServiceRequests: [],
  patientHistory: [],
  loading: false,
  error: null,
  message: null,
};

export const labReportsReducer = (state = initialState, action) => {
  switch (action.type) {
    // Get All Lab Reports
    case types.GET_ALL_LAB_REPORTS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case types.GET_ALL_LAB_REPORTS_SUCCESS:
      return {
        ...state,
        loading: false,
        labReports: action.payload,
        error: null,
      };
    case types.GET_ALL_LAB_REPORTS_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload.message,
      };

    // Update Lab Report Status
    case types.UPDATE_LAB_REPORT_STATUS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case types.UPDATE_LAB_REPORT_STATUS_SUCCESS:
      return {
        ...state,
        loading: false,
        message: action.payload.message,
        error: null,
      };
    case types.UPDATE_LAB_REPORT_STATUS_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload.message,
      };

    // Add Lab Report Results
    case types.ADD_LAB_REPORT_RESULTS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case types.ADD_LAB_REPORT_RESULTS_SUCCESS:
      return {
        ...state,
        loading: false,
        message: action.payload.message,
        error: null,
      };
    case types.ADD_LAB_REPORT_RESULTS_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload.message,
      };

    // Get Home Service Requests
    case types.GET_HOME_SERVICE_REQUESTS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case types.GET_HOME_SERVICE_REQUESTS_SUCCESS:
      return {
        ...state,
        loading: false,
        homeServiceRequests: action.payload,
        error: null,
      };
    case types.GET_HOME_SERVICE_REQUESTS_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload.message,
      };

    // Get Patient Lab History
    case types.GET_PATIENT_LAB_HISTORY_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case types.GET_PATIENT_LAB_HISTORY_SUCCESS:
      return {
        ...state,
        loading: false,
        patientHistory: action.payload,
        error: null,
      };
    case types.GET_PATIENT_LAB_HISTORY_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload.message,
      };

    default:
      return state;
  }
};
