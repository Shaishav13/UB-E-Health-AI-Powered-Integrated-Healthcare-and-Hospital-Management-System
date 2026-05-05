import * as types from "./types";

const initialState = {
  loading: false,
  error: false,
  reports: [],
  doctors: [],
  patients: [],
  medicines: [],
  dashboard: [],
  appointments: [],
};

export default function dataReducer(state = initialState, { type, payload }) {
  switch (type) {
    case types.GET_DOCTOR_REQUEST:
      return {
        ...state,
        loading: true,
        error: false,
      };
    case types.GET_DOCTOR_SUCCESS:
      return {
        ...state,
        loading: false,
        error: false,
        doctors: payload,
      };
    case types.GET_DOCTOR_ERROR:
      return {
        ...state,
        loading: false,
        error: true,
      };
    case types.GET_PATIENT_SUCCESS:
      return {
        ...state,
        loading: false,
        patients: payload,
      };

    case types.GET_ADMIN_REQUEST:
      return {
        ...state,
        loading: true,
        error: false,
      };
    case types.GET_ADMIN_SUCCESS:
      console.log("Admin data received:", payload);
      return {
        ...state,
        loading: false,
        error: false,
        admins: payload,
      };
    case types.GET_ADMIN_ERROR:
      return {
        ...state,
        loading: false,
        error: true,
      };

    case types.GET_MEDICINE_REQUEST:
      return {
        ...state,
        loading: true,
        error: false,
      };
    case types.GET_MEDICINE_SUCCESS:
      return {
        ...state,
        loading: false,
        error: false,
        medicines: payload,
      };
    case types.GET_MEDICINE_ERROR:
      return {
        ...state,
        loading: false,
        error: true,
      };

    case types.GET_ALLDATA_SUCCESS:
      return {
        ...state,
        loading: false,
        dashboard: payload,
      };
    case types.DELETE_APPOINTMENT_SUCCESS:
      return {
        ...state,
        loading: false,
        appointments: state.appointments.filter((ele) => ele._id !== payload),
      };
    case types.GET_APPOINTMENT_DETAILS_SUCCESS:
      return {
        ...state,
        loading: false,
        appointments: payload,
      };
    case types.GET_REPORTS_SUCCESS:
      return {
        ...state,
        loading: false,
        reports: payload,
      };

    case types.GET_PATIENTS_BY_DOCTOR_SUCCESS:
      return {
        ...state,
        loading: false,
        patients: payload,
      };

    default:
      return state;
  }
}
