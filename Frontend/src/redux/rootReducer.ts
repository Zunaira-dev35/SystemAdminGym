import { combineReducers } from "@reduxjs/toolkit";
import auth from "./pagesSlices/authSlice";
import people from "./pagesSlices/peopleSlice";
import user from "./pagesSlices/userSlice";
import plan from "./pagesSlices/planSlice";
import freezeRequest from "./pagesSlices/freezeRequestSlice";
import feeCollection from "./pagesSlices/feeCollectionSlice";
import hrm from "./pagesSlices/hrmSlice";
import general from "./pagesSlices/generalSlice";
import finance from "./pagesSlices/financeSlice"
const rootReducer = combineReducers({
  auth,
  people,
  user,
  plan,
  freezeRequest,
  feeCollection,
  hrm,
  general,
  finance
});

export default rootReducer;