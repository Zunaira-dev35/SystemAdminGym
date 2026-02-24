import { createSlice, createAsyncThunk, isAnyOf } from "@reduxjs/toolkit";
import { ApiRequests } from "../../service/ApiRequests";
import {
  catchAsync,
  handleLoadingErrorParamsForAsycThunk,
  reduxToolKitCaseBuilder,
} from "../../helpers/detectError";
import { toast } from "@/hooks/use-toast";
import { Employee } from "@shared/schema";

// Unified User Type (Member or Employee)
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  reference_num: string;
  user_type: "member" | "employee" | "other";
  status: "active" | "inactive";
  profile_image: string | null;
  role_group_id: number;
  base_branch_id?: number;
  created_at: string | null;
  updated_at: string;
  roles?: Array<{ id: number; name: string }>;
  member_profile?: any;
  // Add more fields if needed
}

// Pagination meta shared by both member & employee lists
interface PaginationMeta {
  current_page: number;
  from: number | null;
  to: number | null;
  per_page: number;
  total: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

interface MemberListResponse {
  current_page: number;
  data: User[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

interface PeopleState {
  members: {
    data: User[];
    meta: PaginationMeta;
  };
  memberRefId?: null;
  memberDetail?: any;
  memberFee?: any;
  memberFreeze?: any;
  memberAttendance?: any;
  memberPlanTransfer?: any;
  memberStats?: any;
  employeeRefId?: null;
  verifyUserFace?: boolean;
  employees: {
    data: User[];
    meta: PaginationMeta;
  };
  selectedUser: User | null;

  loadings: Record<string, boolean>;
  errors: Record<string, boolean>;
  errorMessages: Record<string, string>;
  paramsForThunk: Record<string, any>;
}

const initialState: PeopleState = {
  members: {
    data: [],
    meta: {
      current_page: 1,
      from: null,
      to: null,
      per_page: 10,
      total: 0,
      last_page: 1,
      next_page_url: null,
      prev_page_url: null,
    },
  },
  memberRefId: null,
  memberDetail: [],
  memberFee: [],
  memberStats: [],
  memberFreeze: [],
  memberAttendance: [],
  memberPlanTransfer: [],
  employeeRefId: null,
  verifyUserFace: false,
  employees: {
    data: [],
    meta: {
      current_page: 1,
      from: null,
      to: null,
      per_page: 10,
      total: 0,
      last_page: 1,
      next_page_url: null,
      prev_page_url: null,
    },
  },
  selectedUser: null,

  loadings: {
    getMembers: true,
    getEmployees: true,
    toggleStatus: false,
    memberDetail: false,
    memberFee: false,
    memberFreeze: false,
    memberAttendance: false,
    memberPlanTransfer: false,
    searchMembers: false,
  },
  errors: {},
  errorMessages: {},
  paramsForThunk: {},
};

// Thunks

export const getAllMembersAsyncThunk = createAsyncThunk(
  "people/getAllMembers",
  catchAsync(async (params: any, { rejectWithValue }) => {
    try {
      const response = await ApiRequests.getAllMembers(params);
      // console.log("reposnse", response);
      return response?.data as MemberListResponse;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed" });
    }
  })
);

export const getAllSearchedMembersAsyncThunk = createAsyncThunk(
  "people/getAllSearchedMembers",
  catchAsync(async ({ data }: { data: FormData }, { rejectWithValue }) => {
    try {
      const response = await ApiRequests.searchMembers(data);
      console.log("search response:", response);
      return response?.data;
    } catch (error: any) {
      console.error("Search failed:", error.response?.data);
      return rejectWithValue(error.response?.data || { message: "Search failed" });
    }
  })
);

export const getRefrenceMembersAsyncThunk = createAsyncThunk(
  "people/getRefrenceMembers",
  catchAsync(async (params: any, { rejectWithValue }) => {
    try {
      const response = await ApiRequests.refrenceMember(params);
      // console.log("reposnse", response);
      return response?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed" });
    }
  })
);

export const getAllEmployeesAsyncThunk = createAsyncThunk(
  "people/getAllEmployees",
  catchAsync(async ({ params }) => {
    const response = await ApiRequests.getAllEmployees(params);
    return response?.data?.data; // assuming same structure as members or single object
  })
);
export const refrenceEmployeeAsyncThunk = createAsyncThunk(
  "people/refrenceEmployee",
  catchAsync(async ({ params }) => {
    const response = await ApiRequests.refrenceEmployee(params);
    return response?.data?.data; // assuming same structure as members or single object
  })
);

export const createOrUpdateMemberAsyncThunk = createAsyncThunk(
  "people/createOrUpdateMember",
  catchAsync(
    async (
      { data, callBack }: { data: any; callBack?: () => void },
      { rejectWithValue }
    ) => {
      try {
        const response = await ApiRequests.createOrUpdateMember(data);
        toast({
          title: data.id
            ? "Member updated successfully"
            : "Member created successfully",
        });
        if (callBack) callBack();
        return response?.data?.data as User;
      } catch (error: any) {
        return rejectWithValue(error.response?.data || { message: "Failed" });
      }
    }
  )
);
export const deleteMemberAsyncThunk = createAsyncThunk(
  "people/deleteMember",
  catchAsync(async (payload, { rejectWithValue }) => {
    try {
      console.log("data", payload);
      const response = await ApiRequests.deleteMember(payload);

      // if (callBack) callBack();
      return response?.data?.data as User;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed" });
    }
  })
);
export const verifyUserFaceAsyncThunk = createAsyncThunk(
  "people/verifyUserFace",
  catchAsync(
    async (
      { data, callBack }: { data: any; callBack?: () => void },
      { rejectWithValue }
    ) => {
      try {
        const response = await ApiRequests.verifyUserFace(data);
        // toast({
        //   title: data.id
        //     ? "Member updated successfully"
        //     : "Member created successfully",
        // });
        if (callBack) callBack();
        return response?.data;
      } catch (error: any) {
        return rejectWithValue(error.response?.data || { message: "Failed" });
      }
    }
  )
);
export const verifyUserFingerprintAsyncThunk = createAsyncThunk(
  "people/verifyUserFingerprint",
  catchAsync(
    async (
      { data, callBack }: { data: any; callBack?: () => void },
      { rejectWithValue }
    ) => {
      try {
        const response = await ApiRequests.verifyUserFingerprint(data);
        // toast({
        //   title: data.id
        //     ? "Member updated successfully"
        //     : "Member created successfully",
        // });
        if (callBack) callBack();
        return response?.data;
      } catch (error: any) {
        return rejectWithValue(error.response?.data || { message: "Failed" });
      }
    }
  )
);
export const unfreezMemberAsyncThunk = createAsyncThunk(
  "people/unfreezMember",
  catchAsync(
    async (
      { user_id, callBack }: { user_id: any; callBack?: () => void },
      _
    ) => {
      // console.log("data", user_id);
      const response = await ApiRequests.unfreezMember({ user_id });
      toast({ title: "Member unfreezed successfully" });
      if (callBack) callBack();
      return response?.data?.data as User;
    }
  )
);

export const createOrUpdateEmployeeAsyncThunk = createAsyncThunk(
  "people/createOrUpdateEmployee",
  // catchAsync(async ({ data, callBack }: { data: any; callBack?: () => void }, _) => {
  catchAsync(async (formData: FormData, { callBack, rejectWithValue }) => {
    // for (const [key, value] of formData.entries()) {
    // }

    try {
      const response = await ApiRequests.createOrUpdateEmployee(formData);
      toast({
        title: response.data.id
          ? "Employee updated successfully"
          : "Employee created successfully",
      });
      if (callBack) callBack();
      return response?.data?.data as User;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed" });
    }
  })
);

export const updateUserStatusAsyncThunk = createAsyncThunk(
  "people/updateUserStatus",
  catchAsync(
    async (
      {
        user_id,
        status,
        blacklisted,
      }: { user_id: number; status: "active" | "inactive"; blacklisted: any },
      { getState }
    ) => {
      const response = await ApiRequests.updateUserStatus({
        user_id,
        status,
        blacklisted,
      });
      return { user_id, status: response?.data?.data?.status || status };
    }
  )
);
export const getAllPlansAsyncThunk = createAsyncThunk(
  "people/getAllPlans",
  catchAsync(async (params: any = {}) => {
    // console.log("getAllPlansAsyncThunk params", params);
    const response = await ApiRequests.getAllPlans(params);
    return response?.data?.data;
  })
);
// Inside peopleSlice.ts – replace the old memberDetail/memberFee/etc thunks with these:

export const memberDetailAsyncThunk = createAsyncThunk(
  "people/memberDetail",
  catchAsync(async (params: any, { rejectWithValue }) => {
    try {
      const response = await ApiRequests.memberDetail(params);
      return response?.data?.data; // Laravel paginated format: response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed" });
    }
  })
);

export const memberFeeAsyncThunk = createAsyncThunk(
  "people/memberFee",
  catchAsync(async (params: any, { rejectWithValue }) => {
    try {
      const response = await ApiRequests.memberFee(params);
      return response?.data?.data; // Adjust based on actual response structure
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed" });
    }
  })
);

export const memberFreezeAsyncThunk = createAsyncThunk(
  "people/memberFreeze",
  catchAsync(async (params: any, { rejectWithValue }) => {
    try {
      const response = await ApiRequests.memberFreeze(params);
      return response?.data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed" });
    }
  })
);

export const memberAttendanceAsyncThunk = createAsyncThunk(
  "people/memberAttendance",
  catchAsync(async (params: any, { rejectWithValue }) => {
    try {
      const response = await ApiRequests.memberAttendance(params);
      return response?.data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed" });
    }
  })
);

export const memberPlanTransferAsyncThunk = createAsyncThunk(
  "people/memberPlanTransfer",
  catchAsync(async (params: any, { rejectWithValue }) => {
    try {
      const response = await ApiRequests.memberPlanTransfer(params);
      return response?.data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed" });
    }
  })
);
export const memberStatsAsyncThunk = createAsyncThunk(
  "people/memberStats",
  catchAsync(async (params: any, { rejectWithValue }) => {
    try {
      const response = await ApiRequests.memberStats(params);
      return response?.data?.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Failed" });
    }
  })
);
// Slice
const peopleSlice = createSlice({
  name: "people",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loadings[action.payload.key] = action.payload.value;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Members
      .addCase(getAllMembersAsyncThunk.pending, (state) => {
        state.loadings.getMembers = true;
      })
      .addCase(getAllMembersAsyncThunk.fulfilled, (state: any, action) => {
        const payload = action.payload as MemberListResponse;
        state.members.data = payload.data;
        state.members.meta = {
          current_page: payload.current_page,
          from: payload.from,
          to: payload.to,
          per_page: payload.per_page,
          total: payload.total,
          last_page: payload.last_page,
          next_page_url: payload.next_page_url,
          prev_page_url: payload.prev_page_url,
        };
        state.loadings.getMembers = false;
      })
      .addCase(getAllMembersAsyncThunk.rejected, (state) => {
        state.loadings.getMembers = false;
      })
      .addCase(getRefrenceMembersAsyncThunk.pending, (state) => {
        state.loadings.getMembers = true;
      })
      .addCase(getRefrenceMembersAsyncThunk.fulfilled, (state: any, action) => {
        const payload = action.payload;
        state.memberRefId = payload.data;
        state.loadings.getMembers = false;
      })
      .addCase(getRefrenceMembersAsyncThunk.rejected, (state) => {
        state.loadings.getMembers = false;
      })
      .addCase(verifyUserFaceAsyncThunk.pending, (state) => {
        state.loadings.verifyUserFace = true;
      })
      .addCase(verifyUserFaceAsyncThunk.fulfilled, (state: any, action) => {
        const payload = action.payload;
        // console.log("verifyUserFaceAsyncThunk",action.payload)
        state.verifyUserFace = payload.data;
        state.loadings.verifyUserFace = false;
      })
      .addCase(verifyUserFaceAsyncThunk.rejected, (state) => {
        state.loadings.verifyUserFace = false;
      })
      .addCase(verifyUserFingerprintAsyncThunk.pending, (state) => {
        state.loadings.verifyUserFace = true;
      })
      .addCase(
        verifyUserFingerprintAsyncThunk.fulfilled,
        (state: any, action) => {
          const payload = action.payload;
          // console.log("verifyUserFingerprintAsyncThunk",action.payload)
          state.verifyUserFace = payload.data;
          state.loadings.verifyUserFace = false;
        }
      )
      .addCase(verifyUserFingerprintAsyncThunk.rejected, (state) => {
        state.loadings.verifyUserFace = false;
      })
      .addCase(refrenceEmployeeAsyncThunk.pending, (state) => {
        state.loadings.getMembers = true;
      })
      .addCase(refrenceEmployeeAsyncThunk.fulfilled, (state: any, action) => {
        const payload = action.payload;
        // console.log("payload", payload);
        state.employeeRefId = payload;
        state.loadings.getMembers = false;
      })
      .addCase(refrenceEmployeeAsyncThunk.rejected, (state) => {
        state.loadings.getMembers = false;
      })

      // Get All Employees
      .addCase(getAllEmployeesAsyncThunk.pending, (state) => {
        state.loadings.getEmployees = true;
      })
      .addCase(getAllEmployeesAsyncThunk.fulfilled, (state, action) => {
        const payload = action.payload;

        // Handle both paginated list and single object response
        if (Array.isArray(payload)) {
          state.employees.data = payload;
          state.employees.meta = {
            current_page: 1,
            total: payload.length,
            per_page: 10,
            last_page: 1,
            from: 1,
            to: payload.length,
            next_page_url: null,
            prev_page_url: null,
          };
        } else if (payload && payload.data && Array.isArray(payload.data)) {
          // Laravel paginated format
          state.employees.data = payload.data;
          state.employees.meta = {
            current_page: payload.current_page,
            from: payload.from,
            to: payload.to,
            per_page: payload.per_page,
            total: payload.total,
            last_page: payload.last_page,
            next_page_url: payload.next_page_url,
            prev_page_url: payload.prev_page_url,
          };
        } else {
          // Single employee
          state.employees.data = payload ? [payload] : [];
        }
        state.loadings.getEmployees = false;
      })
      .addCase(getAllEmployeesAsyncThunk.rejected, (state) => {
        state.loadings.getEmployees = false;
      })

      // Create/Update Member
      .addCase(createOrUpdateMemberAsyncThunk.fulfilled, (state, action) => {
        const user = action.payload;
        // const existingIndex = state.members.data.findIndex(
        //   (u) => u.id === user.id
        // );

        // if (existingIndex >= 0) {
        //   state.members.data[existingIndex] = user;
        // } else {
        //   state.members.data.unshift(user);
        //   state.members.meta.total += 1;
        // }
      })
      .addCase(deleteMemberAsyncThunk.fulfilled, (state, action) => {
        const user = action.payload;
      })
      // Create/Update Employee
      .addCase(createOrUpdateEmployeeAsyncThunk.fulfilled, (state, action) => {
        const user = action.payload;
        const existingIndex = state.employees.data.findIndex(
          (u) => u.id === user.id
        );

        if (existingIndex >= 0) {
          state.employees.data[existingIndex] = user;
        } else {
          state.employees.data.unshift(user);
          if (!Array.isArray(action.meta.arg)) state.employees.meta.total += 1;
        }
      })

      // Toggle User Status - Optimistic Update
      .addCase(updateUserStatusAsyncThunk.pending, (state, action) => {
        const { user_id, status } = action.meta.arg;
        const newStatus = status;

        // Update in members
        // const memberIndex = state.members.data.findIndex(
        //   (u) => u.id === user_id
        // );
        // if (memberIndex !== -1) {
        //   state.members.data[memberIndex].status = newStatus;
        // }

        // // Update in employees
        // const empIndex = state.employees.data.findIndex(
        //   (u) => u.id === user_id
        // );
        // if (empIndex !== -1) {
        //   state.employees.data[empIndex].status = newStatus;
        // }

        // if (state.selectedUser?.id === user_id) {
        //   state.selectedUser.status = newStatus;
        // }
      })
      .addCase(updateUserStatusAsyncThunk.fulfilled, (state, action) => {
        const { user_id, status } = action.payload;
        // Already updated optimistically
        toast({
          title: `User ${status === "active" ? "activated" : "deactivated"
            } successfully`,
        });
      })
      .addCase(updateUserStatusAsyncThunk.rejected, (state, action) => {
        const { user_id, status } = action.meta.arg;
        const previousStatus = status === "active" ? "inactive" : "active";

        // Revert in members
        // const memberIndex = state.members.data.findIndex(
        //   (u) => u.id === user_id
        // );
        // if (memberIndex !== -1)
        //   state.members.data[memberIndex].status = previousStatus;

        // // Revert in employees
        // const empIndex = state.employees.data.findIndex(
        //   (u) => u.id === user_id
        // );
        // if (empIndex !== -1)
        //   state.employees.data[empIndex].status = previousStatus;

        // if (state.selectedUser?.id === user_id) {
        //   state.selectedUser.status = previousStatus;
        // }

        toast({ title: "Failed to update status", variant: "destructive" });
      })
      .addCase(memberDetailAsyncThunk.pending, (state) => {
        state.loadings.memberDetail = true;
      })
      .addCase(memberDetailAsyncThunk.fulfilled, (state, action) => {
        state.memberDetail = action.payload; // Now storing the full paginated object or direct data
        state.loadings.memberDetail = false;
      })
      .addCase(memberDetailAsyncThunk.rejected, (state) => {
        state.loadings.memberDetail = false;
      })

      .addCase(memberFeeAsyncThunk.pending, (state) => {
        state.loadings.memberFee = true;
      })
      .addCase(memberFeeAsyncThunk.fulfilled, (state, action) => {
        state.memberFee = action.payload;
        state.loadings.memberFee = false;
      })
      .addCase(memberFeeAsyncThunk.rejected, (state) => {
        state.loadings.memberFee = false;
      })

      .addCase(memberFreezeAsyncThunk.pending, (state) => {
        state.loadings.memberFreeze = true;
      })
      .addCase(memberFreezeAsyncThunk.fulfilled, (state, action) => {
        state.memberFreeze = action.payload;
        state.loadings.memberFreeze = false;
      })
      .addCase(memberFreezeAsyncThunk.rejected, (state) => {
        state.loadings.memberFreeze = false;
      })

      .addCase(memberAttendanceAsyncThunk.pending, (state) => {
        state.loadings.memberAttendance = true;
      })
      .addCase(memberAttendanceAsyncThunk.fulfilled, (state, action) => {
        state.memberAttendance = action.payload;
        state.loadings.memberAttendance = false;
      })
      .addCase(memberAttendanceAsyncThunk.rejected, (state) => {
        state.loadings.memberAttendance = false;
      })

      .addCase(memberPlanTransferAsyncThunk.pending, (state) => {
        state.loadings.memberPlanTransfer = true;
      })
      .addCase(memberPlanTransferAsyncThunk.fulfilled, (state, action) => {
        state.memberPlanTransfer = action.payload;
        state.loadings.memberPlanTransfer = false;
      })
      .addCase(memberPlanTransferAsyncThunk.rejected, (state) => {
        state.loadings.memberPlanTransfer = false;
      })
      .addCase(memberStatsAsyncThunk.pending, (state) => {
        state.loadings.memberStats = true;
      })
      .addCase(memberStatsAsyncThunk.fulfilled, (state, action) => {
        state.memberStats = action.payload;
        state.loadings.memberStats = false;
      })
      .addCase(memberStatsAsyncThunk.rejected, (state) => {
        state.loadings.memberStats = false;
      })
      .addCase(getAllSearchedMembersAsyncThunk.pending, (state) => {
        state.loadings.searchMembers = true;
      })
      .addCase(getAllSearchedMembersAsyncThunk.fulfilled, (state, action) => {
        state.loadings.searchMembers = false;
      })
      .addCase(getAllSearchedMembersAsyncThunk.rejected, (state) => {
        state.loadings.searchMembers = false;
      })
      // Global loading/error handler
      .addMatcher(
        isAnyOf(
          ...reduxToolKitCaseBuilder([
            getAllMembersAsyncThunk,
            getAllEmployeesAsyncThunk,
            createOrUpdateMemberAsyncThunk,
            createOrUpdateEmployeeAsyncThunk,
            updateUserStatusAsyncThunk,
            getAllSearchedMembersAsyncThunk
          ])
        ),
        handleLoadingErrorParamsForAsycThunk
      );
  },
});

export default peopleSlice.reducer;
export const { setLoading, clearSelectedUser } = peopleSlice.actions;
