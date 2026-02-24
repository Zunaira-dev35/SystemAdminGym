import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
// import customToast from "../../hooks/customToast";
import { toast } from '@/hooks/use-toast';

interface ErrorState {
  errorMessage: string | null;
  errorCode: number | string | null;
  models: Record<string, boolean>;
}

const initialState: ErrorState = {
  errorMessage: null,
  errorCode: null,
  models: {},
};

interface ReloadPayload {
  errorCode: number;
  errorMessage: string;
}

export const handleErrorSlice = createSlice({
  name: "handleErrors",
  initialState,
  reducers: {
    setError: (
      state,
      action: PayloadAction<{ errorMessage?: string; errorCode?: number | string }>
    ) => {

      state.errorMessage = action.payload.errorMessage ?? null;
      state.errorCode = action.payload.errorCode ?? null;

      // customToast.error(action.payload.errorMessage || "Something went wrong", {
      //   autoClose: 5000,
      //   closeButton: true,
      // });
       toast({title:action.payload.errorMessage || "Something went wrong", variant: 'destructive' });
    },
    resetError: (state) => {
      state.errorMessage = null;
      state.errorCode = null;
    },
    setErrorForReload: (state, action: PayloadAction<ReloadPayload>) => {
      state.models["reload"] = true;
      state.errorCode = action.payload.errorCode;
      state.errorMessage = action.payload.errorMessage;
    },
    setSuccess: (state, action: PayloadAction<{ message: string }>) => {
              console.log(state)

      customToast.success(action.payload.message, {
        autoClose: 5000,
        closeButton: true,
      });
    },
  },
});

export const {
  setError,
  resetError,
  setErrorForReload,
  setSuccess,
} = handleErrorSlice.actions;

export default handleErrorSlice.reducer;
