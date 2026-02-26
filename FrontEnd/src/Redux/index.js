import { combineReducers } from "redux";
import authReducer from "./auth/reducer";
import dataReducer from "./Datas/reducer";
import { labReportsReducer } from "./LabReports/reducer";
import labPersonnelReducer from "./LabPersonnel/reducer";
import paymentReducer from "./Payments/reducer";

export const rootReducer = combineReducers({
  auth: authReducer,
  data: dataReducer,
  labReports: labReportsReducer,
  labPersonnel: labPersonnelReducer,
  payments: paymentReducer,
});
