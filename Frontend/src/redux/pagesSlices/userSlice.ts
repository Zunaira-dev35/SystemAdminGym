import { createSlice, createAsyncThunk, isAnyOf } from "@reduxjs/toolkit";
import { ApiRequests } from "../../service/ApiRequests";
import {
  catchAsync,
  handleLoadingErrorParamsForAsycThunk,
  reduxToolKitCaseBuilder,
} from "../../helpers/detectError";
// import { toast } from "react-toastify";
interface UserList {
  page: number;
  total: number;
  results: any[];
}
interface GroupPermissions {
  page: number;
  total: number;
  results: any[];
}
interface defaultPermissions {
  page: number;
  total: number;
  results: any[];
}
interface Roles{
  page: number;
  total: number;
  results: any[];
}
interface SingleGroupPermission {
  name: string;
  permissions: any[];
}
interface UserState {
  userList: UserList;
  roles: Roles;
  singleGroupPermission: SingleGroupPermission;
  groupPermissions: GroupPermissions;
  defaultPermissions: defaultPermissions;
  paramsForThunk: Record<string, any>;
  errorMessages: Record<string, string>;
  errorCodes: Record<string, number>;
  errors: Record<string, boolean>;
  loadings: Record<string, boolean>;
}

const initialState: UserState = {
  singleGroupPermission: {
    name: "",
    permissions: [],
  },
  roles: {
    page:1,
    total:10,
    results: [],
  },
  userList: {
    page:1,
    total:10,
    results: [],
  },
  groupPermissions: {
    page:1,
    total:10,
    results: [],
  },
  defaultPermissions: {
    page:1,
    total:10,
    results: [],
  },
  paramsForThunk: {},
  errorMessages: {},
  errorCodes: {},
  errors: {},
  loadings: {
    getUser : false,   
    createOrUpdateUser : false,
    getGroupPermission : false,
    createOrUpdateGroupPermission : false,
    getDefaultPermissions : false,
    getRoles : false,
    getPermissionsById : false,
  },
};
export const getUserListAsyncThunk = createAsyncThunk("user/getUserList",  catchAsync(async ({ params, callBack }, _) => {
    const response = await ApiRequests.getUsers(params);
    if (callBack) callBack();
    return response?.data?.data;
}));
export const createOrUpdateUserAsyncThunk = createAsyncThunk(
  "user/createOrUpdateUser",
  catchAsync(async (formData: FormData, { getState }) => {
    console.log("Sending FormData:");
    for (const [key, value] of formData.entries()) {
      console.log(key, "→", value);
    }

    const response = await ApiRequests.createOrUpdateUser(formData);
    return response?.data?.data;
  })
);
export const updateUserAsyncThunk = createAsyncThunk(
  "user/updateUser",
  catchAsync(async (formData: FormData, { getState }) => {
    // console.log("Sending FormData:");
    // for (const [key, value] of formData.entries()) {
    //   // console.log(key, "→", value);
    // }

    const response = await ApiRequests.updateUser(formData);
    return response?.data?.data;
  })
);
export const toggleUserStatus = createAsyncThunk("user/toggleUserStatus",  catchAsync(async ({ data, callBack }, _) => {
    const response = await ApiRequests.toggleUserStatus(data);
    if (callBack) callBack();
    return response?.data?.data;
}))
export const getGroupPermissionsAsyncThunk = createAsyncThunk("user/getGroupPermissions",  catchAsync(async ({ params, callBack }, _) => {
    const response = await ApiRequests.getGroupPermissions(params);
    if (callBack) callBack();
    return response?.data?.data;
}))
export const createOrUpdateGroupPermissionsAsyncThunk = createAsyncThunk("user/createGroupPermissions",  catchAsync(async ({ data, callBack }, _) => {
    const response = await ApiRequests.createGroupPermissions(data);
    if (callBack) callBack();
    // console.log("data is folloing", data);
    // if(data.id){
    //   toast.success("Group Permission updated successfully");
    // }else{
    //   toast.success("Group Permission created successfully");
    // }
    
    return response?.data?.data;
}));
export const deleteGroupPermissionsAsyncThunk = createAsyncThunk("user/deleteGroupPermissions",  catchAsync(async ({ params, callBack }, _) => {
    const response = await ApiRequests.deleteGroupPermissions(params);
    if (callBack) callBack();
    return response?.data?.data;
}))
export const getDefaultPermissionsAsyncThunk = createAsyncThunk("user/getDefaultPermissions",  catchAsync(async ({ params,callBack }, _) => {
    const response = await ApiRequests.getDefaultPermissions(params);
    if (callBack) callBack();
    return response?.data?.data;
}));
export const getRolesAsyncThunk = createAsyncThunk("user/getRoles",  catchAsync(async ({ params,callBack }, _) => {
    const response = await ApiRequests.getRoles(params);
    if (callBack) callBack();
    return response?.data?.data;
}));
export const createOrUpdateRoleAsyncThunk = createAsyncThunk("user/createRole",  catchAsync(async ({ data,callBack }, _) => {
    const response = await ApiRequests.createRole(data);
    if (callBack) callBack();
    return response?.data?.data;
}));
export const deleteRoleAsyncThunk = createAsyncThunk("user/deleteRole",  catchAsync(async ({ params,callBack }, _) => {
    const response = await ApiRequests.deleteRole(params);
    if (callBack) callBack();
    return response?.data?.data;
}));
export const getGroupPermissionByIdAsyncThunk = createAsyncThunk("user/getGroupPermissionById",  catchAsync(async ({ id,callBack }, _) => {
    const response = await ApiRequests.getGroupPermissionById(id);
    if (callBack) callBack();
    return response?.data?.data;
}))
const UserSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loadings[action.payload.key] = action.payload.value;
    },
  
  },
  extraReducers: (builder) => {
    builder
    .addCase(getUserListAsyncThunk.pending, (state) => {
        state.loadings.getUser = true;
      })
      .addCase(getUserListAsyncThunk.fulfilled, (state, action:any) => {
          state.userList = {
            ...state.userList,
            results: action.payload.data || [],
            page: action.payload.current_page || 1,
            total: action.payload.total || 0,
          };
          state.loadings.getUser = false;
        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(true);
        }

      })
      .addCase(getUserListAsyncThunk.rejected, (state, action) => {
        state.loadings.getUser = false;

        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(false);
        }
      })
      .addCase(createOrUpdateUserAsyncThunk.pending, (state) => {
        state.loadings.createOrUpdateUser = true;
      })
      .addCase(createOrUpdateUserAsyncThunk.fulfilled, (state, action:any) => {
          // state.groupPermissions = {
          //   ...state.groupPermissions,
          //   results: action.payload.data || [],
          //   page: action.payload.current_page || 1,
          //   total: action.payload.total || 0,
          // };
          state.loadings.createOrUpdateUser = false;
        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(true);
        }

      })
      .addCase(createOrUpdateUserAsyncThunk.rejected, (state, action) => {
        state.loadings.createOrUpdateUser = false;

        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(false);
        }
      })
      .addCase(updateUserAsyncThunk.pending, (state) => {
        state.loadings.createOrUpdateUser = true;
      })
      .addCase(updateUserAsyncThunk.fulfilled, (state, action:any) => {
          state.loadings.createOrUpdateUser = false;
        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(true);
        }
      })
      .addCase(updateUserAsyncThunk.rejected, (state, action) => {
        state.loadings.createOrUpdateUser = false;
        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(false);
        }
      })
      
      .addCase(createOrUpdateGroupPermissionsAsyncThunk.pending, (state) => {
        state.loadings.createOrUpdateGroupPermission = true;
      })
      .addCase(createOrUpdateGroupPermissionsAsyncThunk.fulfilled, (state, action:any) => {
          // state.groupPermissions = {
          //   ...state.groupPermissions,
          //   results: action.payload.data || [],
          //   page: action.payload.current_page || 1,
          //   total: action.payload.total || 0,
          // };
          state.loadings.createOrUpdateGroupPermission = false;
        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(true);
        }

      })
      .addCase(createOrUpdateGroupPermissionsAsyncThunk.rejected, (state, action) => {
        state.loadings.createOrUpdateGroupPermission = false;

        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(false);
        }
      })
    .addCase(toggleUserStatus.pending, (state, action: any) => {
        const { user_id, is_active } = action.meta.arg.data;
        // Store the original is_active value for the user in paramsForThunk
        state.userList.results = state.userList.results.map((user: any) => {
          if (user.id.toString() === user_id.toString()) {
            // Store the original is_active value
            state.paramsForThunk[user_id] = { original_is_active: user.is_active };
            return {
              ...user,
              is_active, // Optimistic update
            };
          }
          return user;
        });
      })      
       .addCase(toggleUserStatus.fulfilled, (state, action: any) => {
        const { user_id } = action.meta.arg.data;
        state.userList.results = state.userList.results.map((user: any) => {
          if (user.id === user_id) {
            return {
              ...user,
              is_active: action.payload.is_active,
            };
          }
          return user;
        });
        // Clean up the stored original value
        delete state.paramsForThunk[user_id];
        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(true);
        }
      }).addCase(toggleUserStatus.rejected, (state, action) => {
        const { user_id } = action.meta.arg.data;
        // Revert to the original is_active value stored in paramsForThunk
        state.userList.results = state.userList.results.map((user: any) => {
          if (user.id.toString() === user_id.toString()) {
            return {
              ...user,
              is_active: state.paramsForThunk[user_id]?.original_is_active ?? user.is_active,
            };
          }
          return user;
        });
        // Clean up the stored original value
        delete state.paramsForThunk[user_id];
        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(false);
        }
      })
      .addCase(getGroupPermissionsAsyncThunk.pending, (state) => {
        state.loadings.getGroupPermission = true;
      })
      .addCase(getGroupPermissionsAsyncThunk.fulfilled, (state, action:any) => {
          state.groupPermissions = {
            ...state.groupPermissions,
            results: action.payload.data || [],
            page: action.payload.current_page || 1,
            total: action.payload.total || 0,
          };
          state.loadings.getGroupPermission = false;
        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(true);
        }

      })
      .addCase(getGroupPermissionByIdAsyncThunk.rejected, (state, action) => {
        state.loadings.getPermissionsById = false;

        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(false);
        }
      })
      .addCase(getGroupPermissionByIdAsyncThunk.pending, (state) => {
        state.loadings.getPermissionsById = true;
      })
      .addCase(getGroupPermissionByIdAsyncThunk.fulfilled, (state, action:any) => {
          state.singleGroupPermission = {
            ...state.singleGroupPermission,
            permissions: action.payload.permissions || [],
            name: action.payload.name,
        
          };
          state.loadings.getPermissionsById = false;
        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(true);
        }

      })
      .addCase(getGroupPermissionsAsyncThunk.rejected, (state, action) => {
        state.loadings.getGroupPermission = false;

        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(false);
        }
      })
      .addCase(getDefaultPermissionsAsyncThunk.pending, (state) => {
        state.loadings.getDefaultPermissions = true;
      })
      .addCase(getDefaultPermissionsAsyncThunk.fulfilled, (state, action:any) => {
          state.defaultPermissions = {
            ...state.defaultPermissions,
            results: action.payload || [],
            page: action.payload.current_page || 1,
            total: action.payload.total || 0,
          };
          state.loadings.getDefaultPermissions = false;
        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(true);
        }

      })
      .addCase(getDefaultPermissionsAsyncThunk.rejected, (state, action) => {
        state.loadings.getDefaultPermissions = false;

        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(false);
        }
      })
      .addCase(getRolesAsyncThunk.pending, (state) => {
        state.loadings.getRoles = true;
      })
      .addCase(getRolesAsyncThunk.fulfilled, (state, action:any) => {
          state.roles = {
            ...state.roles,
            results: action.payload.data || [],
            page: action.payload.current_page || 1,
            total: action.payload.total || 0,
          };
          state.loadings.getRoles = false;
        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(true);
        }

      })
      .addCase(getRolesAsyncThunk.rejected, (state, action) => {
        state.loadings.getRoles = false;

        if (action.meta.arg.callBack) {
          action.meta.arg.callBack(false);
        }
      })
      .addMatcher(
        // isAsyncThunk will run when the action is an asyncthunk exists from giver asycntthunks
        isAnyOf(
          ...reduxToolKitCaseBuilder([
            getUserListAsyncThunk,
            getDefaultPermissionsAsyncThunk,
            getGroupPermissionsAsyncThunk,
            createOrUpdateGroupPermissionsAsyncThunk
          ])
        ),
        handleLoadingErrorParamsForAsycThunk
      );
  },
});

export default UserSlice.reducer;
export const { setLoading } = UserSlice.actions;