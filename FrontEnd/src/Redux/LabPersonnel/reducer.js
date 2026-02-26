import * as types from "./actionTypes";

const initialState = {
  loading: false,
  error: false,
  message: "",
  labPersonnelList: [],
  labPersonnel: null,
};

export default function labPersonnelReducer(state = initialState, { type, payload }) {
  switch (type) {
    // Add Lab Personnel
    case types.ADD_LAB_PERSONNEL_REQUEST:
      return {
        ...state,
        loading: true,
        error: false,
        message: "",
      };
    case types.ADD_LAB_PERSONNEL_SUCCESS:
      return {
        ...state,
        loading: false,
        error: false,
        message: payload.message,
      };
    case types.ADD_LAB_PERSONNEL_ERROR:
      return {
        ...state,
        loading: false,
        error: true,
        message: payload.message,
      };

    // Get All Lab Personnel
    case types.GET_ALL_LAB_PERSONNEL_REQUEST:
      return {
        ...state,
        loading: true,
        error: false,
        message: "",
      };
    case types.GET_ALL_LAB_PERSONNEL_SUCCESS:
      return {
        ...state,
        loading: false,
        error: false,
        labPersonnelList: payload,
      };
    case types.GET_ALL_LAB_PERSONNEL_ERROR:
      return {
        ...state,
        loading: false,
        error: true,
        message: payload.message,
      };

    // Get Lab Personnel By ID
    case types.GET_LAB_PERSONNEL_BY_ID_REQUEST:
      return {
        ...state,
        loading: true,
        error: false,
        message: "",
      };
    case types.GET_LAB_PERSONNEL_BY_ID_SUCCESS:
      return {
        ...state,
        loading: false,
        error: false,
        labPersonnel: payload,
      };
    case types.GET_LAB_PERSONNEL_BY_ID_ERROR:
      return {
        ...state,
        loading: false,
        error: true,
        message: payload.message,
      };

    // Update Lab Personnel
    case types.UPDATE_LAB_PERSONNEL_REQUEST:
      return {
        ...state,
        loading: true,
        error: false,
        message: "",
      };
    case types.UPDATE_LAB_PERSONNEL_SUCCESS:
      return {
        ...state,
        loading: false,
        error: false,
        message: payload.message,
        // Update the lab personnel in the list if it exists
        labPersonnelList: state.labPersonnelList.map((person) =>
          person.labId === payload.labId
            ? { ...person, ...payload.updatedData }
            : person
        ),
        // Update the single lab personnel if it's the one being viewed
        labPersonnel:
          state.labPersonnel && state.labPersonnel.labId === payload.labId
            ? { ...state.labPersonnel, ...payload.updatedData }
            : state.labPersonnel,
      };
    case types.UPDATE_LAB_PERSONNEL_ERROR:
      return {
        ...state,
        loading: false,
        error: true,
        message: payload.message,
      };

    // Delete Lab Personnel
    case types.DELETE_LAB_PERSONNEL_REQUEST:
      return {
        ...state,
        loading: true,
        error: false,
        message: "",
      };
    case types.DELETE_LAB_PERSONNEL_SUCCESS:
      return {
        ...state,
        loading: false,
        error: false,
        message: payload.message,
        labPersonnelList: state.labPersonnelList.filter(
          (person) => person.labId !== payload.labId
        ),
      };
    case types.DELETE_LAB_PERSONNEL_ERROR:
      return {
        ...state,
        loading: false,
        error: true,
        message: payload.message,
      };

    // Lab Personnel Login
    case types.LAB_PERSONNEL_LOGIN_REQUEST:
      return {
        ...state,
        loading: true,
        error: false,
        message: "",
      };
    case types.LAB_PERSONNEL_LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        error: false,
        message: payload.message,
        labPersonnel: payload.user,
      };
    case types.LAB_PERSONNEL_LOGIN_ERROR:
      return {
        ...state,
        loading: false,
        error: true,
        message: payload.message,
      };

    default:
      return state;
  }
}
