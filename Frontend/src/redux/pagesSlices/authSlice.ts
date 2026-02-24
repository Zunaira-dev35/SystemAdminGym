import { createSlice, createAsyncThunk, isAnyOf } from "@reduxjs/toolkit";
import { ApiRequests } from "../../service/ApiRequests";
import {
  catchAsync,
  handleLoadingErrorParamsForAsycThunk,
  reduxToolKitCaseBuilder,
} from "../../helpers/detectError";
import { toast } from "@/hooks/use-toast";
interface User {
  id: string;
  name: string;
  email: string;
  roles: any[] | null;
  profile_pic: any;
  user_type: any;
  system_maintenance_mode: boolean;
  // add other user properties here...
}

interface AuthState {
  user: User | null;
  countryCode: string;
  permissionList: any[];
  paramsForThunk: Record<string, any>;
  errorMessages: Record<string, string>;
  errorCodes: Record<string, number>;
  errors: Record<string, boolean>;
  loadings: Record<string, boolean>;
  profile_image?: any;
  roles?: any;
  type?: any;
}

const initialState: AuthState = {
  user: null,
  countryCode: "us",
  permissionList: [],
  paramsForThunk: {},
  errorMessages: {},
  errorCodes: {},
  errors: {},
  loadings: {
    login: false,
    fetchUser: false, // Added for fetching user
  },
};

// Login thunk
export const loginAsyncThunk = createAsyncThunk(
  "auth/login",
  catchAsync(async ({ data, callBack }, { rejectWithValue }) => {
    // console.log("data", data);
    try {
      const response = await ApiRequests.login(data);
       localStorage.setItem("token", response.data.data.access_token);
      if (callBack) callBack();

      return response?.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data || { message: "Unknown error" }
      );
    }
    // if (response?.status === 200) {
    //  
    //   // toast.success("Email has sent to confirm your email address");
    // } else {
    //   toast({ title: "Login Failed!", variant: "destructive" });
    // }
  })
);

// Fetch current user thunk
export const fetchUserAsyncThunk = createAsyncThunk(
  "auth/fetchUser",
  catchAsync(async (_) => {
    const token = localStorage.getItem("token");
    // if (!token) {
    //   return rejectWithValue("No token found");
    // }
    const response = await ApiRequests.getCurrentUser(token); // Adjust to your API
    return response?.data;
  })
);

// Get country code thunk
export const getUserCountryCodeAsyncThunk = createAsyncThunk(
  "auth/getUserCountryCode",
  catchAsync(async ({}, _) => {
    const response = await fetch("https://ipapi.co/country/");
    const code = await response.text();
    return code;
  })
);
// export const fetchUserPermissionsAsyncThunk = createAsyncThunk(
//   "auth/fetchUserPermissions",
//   catchAsync(async ({}, _) => {
//     const response = await ApiRequests.getDefaultPermissions(0);
//     return response?.data?.data;
//   })
// );
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loadings[action.payload.key] = action.payload.value;
    },
    storeUser: (state, action) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.loadings = { login: false, fetchUser: false };
      state.errors = {};
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsyncThunk.pending, (state) => {
        state.loadings.login = true;
      })
      .addCase(loginAsyncThunk.fulfilled, (state, action) => {
        state.user = action.payload as User;
        state.loadings.login = false;
        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(true);
        }
      })
      .addCase(loginAsyncThunk.rejected, (state, action) => {
        state.loadings.login = false;
        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(false);
        }
      })
      .addCase(fetchUserAsyncThunk.pending, (state) => {
        state.loadings.fetchUser = true;
      })
      .addCase(fetchUserAsyncThunk.fulfilled, (state, action) => {
        state.user = action.payload as User;
        // console.log("state.user", state.user);
        state.permissionList =
          state.user.roles?.[0]?.permissions.map((item: any) => item.name) ||
          [];
        if (state.user.system_maintenance_mode) {
          localStorage.setItem("system-maintenance-mode", "true");
          // window.location.href = "/maintenance";
        } else {
          localStorage.removeItem("system-maintenance-mode");
        }
        state.loadings.fetchUser = false;
      })
      .addCase(fetchUserAsyncThunk.rejected, (state) => {
        state.user = null;
        state.loadings.fetchUser = false;
        localStorage.removeItem("token"); // Clear invalid token
      })
      .addCase(getUserCountryCodeAsyncThunk.fulfilled, (state, action: any) => {
        state.countryCode = action?.payload?.toLowerCase() || "us";
        // console.log("country code", state.countryCode);
      })
      // .addCase(
      //   fetchUserPermissionsAsyncThunk.fulfilled,
      //   (state, action: any) => {
      //     state.permissionList =
      //       action?.payload?.map((item: any) => item.name) || [];
      //   }
      // )
      .addMatcher(
        isAnyOf(
          ...reduxToolKitCaseBuilder([loginAsyncThunk, fetchUserAsyncThunk])
        ),
        handleLoadingErrorParamsForAsycThunk
      );
  },
});

export default authSlice.reducer;
export const { setLoading, storeUser, logout } = authSlice.actions;
