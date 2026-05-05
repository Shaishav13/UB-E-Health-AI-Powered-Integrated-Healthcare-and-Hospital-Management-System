import * as types from "./actionTypes";

const initialState = {
  loading: false,
  error: null,
  currentOrder: null,
  verifiedPayment: null,
  paymentHistory: [],
  paymentDetails: null,
  paymentMethods: [],
  refundDetails: null
};

const paymentReducer = (state = initialState, action) => {
  switch (action.type) {
    // Create payment order
    case types.CREATE_PAYMENT_ORDER_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case types.CREATE_PAYMENT_ORDER_SUCCESS:
      return {
        ...state,
        loading: false,
        currentOrder: action.payload,
        error: null
      };
    case types.CREATE_PAYMENT_ORDER_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Verify payment
    case types.VERIFY_PAYMENT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case types.VERIFY_PAYMENT_SUCCESS:
      return {
        ...state,
        loading: false,
        verifiedPayment: action.payload,
        error: null
      };
    case types.VERIFY_PAYMENT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Get payment history
    case types.GET_PAYMENT_HISTORY_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case types.GET_PAYMENT_HISTORY_SUCCESS:
      return {
        ...state,
        loading: false,
        paymentHistory: action.payload,
        error: null
      };
    case types.GET_PAYMENT_HISTORY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Get payment details
    case types.GET_PAYMENT_DETAILS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case types.GET_PAYMENT_DETAILS_SUCCESS:
      return {
        ...state,
        loading: false,
        paymentDetails: action.payload,
        error: null
      };
    case types.GET_PAYMENT_DETAILS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Request refund
    case types.REQUEST_REFUND_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case types.REQUEST_REFUND_SUCCESS:
      return {
        ...state,
        loading: false,
        refundDetails: action.payload,
        error: null
      };
    case types.REQUEST_REFUND_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Get payment methods
    case types.GET_PAYMENT_METHODS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case types.GET_PAYMENT_METHODS_SUCCESS:
      return {
        ...state,
        loading: false,
        paymentMethods: action.payload,
        error: null
      };
    case types.GET_PAYMENT_METHODS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Clear payment state
    case types.CLEAR_PAYMENT_STATE:
      return initialState;

    default:
      return state;
  }
};

export default paymentReducer;
