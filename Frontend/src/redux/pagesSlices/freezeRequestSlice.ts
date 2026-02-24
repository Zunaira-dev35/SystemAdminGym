// src/redux/pagesSlices/freezeRequestSlice.ts

import { createSlice, createAsyncThunk, PayloadAction, isAnyOf } from "@reduxjs/toolkit";
import { ApiRequests } from "../../service/ApiRequests";
import {
  catchAsync,
  handleLoadingErrorParamsForAsycThunk,
  reduxToolKitCaseBuilder,
} from "../../helpers/detectError";
import { toast } from "@/hooks/use-toast";

// ==================== TYPES ====================

export interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  reference_num: string;
  profile_image: string | null;
  user_type: string;
  status: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface FreezeRequest {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  duration_days: number;
  branch_id: number;
  created_at: string;
  updated_at: string;
  generate_date: string;
  generate_time: string;
  reference_num: string;

  // Relations
  member: Member;
  created_by_user: User;
  approved_by_user?: User | null;
  rejected_by_user?: User | null;
}

interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
  links: any[];
  first_page_url: string;
  last_page_url: string;
  next_page_url: string | null;
  prev_page_url: string | null;
  path: string;
}

interface FreezeRequestState {
  list: FreezeRequest[];
  pagination: PaginationMeta | null;
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };

  selectedRequest: FreezeRequest | null;

  loadings: Record<string, boolean>;
  errors: Record<string, string | null>;
}

const initialState: FreezeRequestState = {
  list: [],
  pagination: null,
  stats: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  },
  selectedRequest: null,

  loadings: {
    fetch: false,
    create: false,
    updateStatus: false,
    createFreeze: false,
  },
  errors: {},
};

// ==================== THUNKS ====================

// 1. Fetch all freeze requests
export const fetchFreezeRequestsAsyncThunk = createAsyncThunk(
  "freezeRequest/fetchFreezeRequests",
  catchAsync(async (params: any ) => {
    const response = await ApiRequests.getFreezeRequest(params);
    return response?.data?.data;
  })
);

// 2. Create new freeze request
export const createFreezeRequest = createAsyncThunk(
  "freezeRequest/create",
  catchAsync(async (formData: FormData) => {
    const response = await ApiRequests.createFreezeRequest(formData);
    toast({ title: "Freeze request submitted successfully" });
    return response?.data?.data as FreezeRequest;
  })
);

// 3. Update status (Approve or Reject) → uses one API
export const updateFreezeRequestStatus = createAsyncThunk(
  "freezeRequest/updateStatus",
   catchAsync(async (formData: FormData) => {

    // const formData = new FormData();
    // formData.append("freeze_request_id", id);
    // formData.append("status", status);
    // if (reason) formData.append("reason", reason);
console.log("data",formData)
    const response = await ApiRequests.updateFreezeRequest(formData); // Your single update endpoint
    toast({
      title: status === "approved" ? "Freeze request approved" : "Freeze request rejected",
    });
    return response?.data?.data as FreezeRequest;
  })
);
export const createFreeze = createAsyncThunk(
  "freeze/create",
  catchAsync(async (formData: FormData) => {
    const response = await ApiRequests.createFreeze(formData);
    toast({ title: "Freeze successfully" });
    return response?.data?.data as FreezeRequest;
  })
);

// ==================== SLICE ====================

const freezeRequestSlice = createSlice({
  name: "freezeRequest",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loadings[action.payload.key] = action.payload.value;
    },
    // clearSelectedUser: (state) => {
    //   state.selectedUser = null;
    // },
  },
extraReducers: (builder) => {
  // FETCH
  builder.addCase(fetchFreezeRequestsAsyncThunk.pending, (state) => {
    state.loadings.fetch = true;
    state.errors.fetch = null;
  });
  builder.addCase(fetchFreezeRequestsAsyncThunk.fulfilled, (state, action: PayloadAction<any>) => {
    state.loadings.fetch = false;

    const { freeze_requests, total_freeze_requests, pending_freeze_requests, approve_freeze_requests, rejected_freeze_requests } = action.payload;

    state.list = freeze_requests.data;
    state.pagination = { ...freeze_requests };
    delete (state.pagination as any).data;

    state.stats = {
      total: total_freeze_requests,
      pending: pending_freeze_requests,
      approved: approve_freeze_requests,
      rejected: rejected_freeze_requests,
    };
  });
  builder.addCase(fetchFreezeRequestsAsyncThunk.rejected, (state, action) => {
    state.loadings.fetch = false;
    state.errors.fetch = action.error.message || "Failed to fetch requests";
  });

  // CREATE
  builder.addCase(createFreezeRequest.pending, (state) => {
    state.loadings.create = true;
    state.errors.create = null;
  });
  builder.addCase(createFreezeRequest.fulfilled, (state, action) => {
    state.loadings.create = false;
    state.list.unshift(action.payload);
    state.stats.total += 1;
    state.stats.pending += 1;
  });
  builder.addCase(createFreezeRequest.rejected, (state, action) => {
    state.loadings.create = false;
    state.errors.create = action.error.message || "Failed to create";
  });

  // UPDATE STATUS
  builder.addCase(updateFreezeRequestStatus.pending, (state) => {
    state.loadings.updateStatus = true;
    state.errors.updateStatus = null;
  });
  builder.addCase(updateFreezeRequestStatus.fulfilled, (state, action) => {
    state.loadings.updateStatus = false;

    const updated = action.payload;
    const idx = state.list.findIndex(r => r.id === updated.id);
    if (idx !== -1) {
      const old = state.list[idx];
      state.list[idx] = updated;

      if (old.status === "pending") {
        state.stats.pending -= 1;
        if (updated.status === "approved") state.stats.approved += 1;
        if (updated.status === "rejected") state.stats.rejected += 1;
      }
    }
  });
  builder.addCase(updateFreezeRequestStatus.rejected, (state, action) => {
    state.loadings.updateStatus = false;
    state.errors.updateStatus = action.error.message || "Failed to update status";
  });
    builder.addCase(createFreeze.pending, (state) => {
    state.loadings.createFreeze = true;
    state.errors.createFreeze = null;
  });
  builder.addCase(createFreeze.fulfilled, (state, action) => {
    state.loadings.createFreeze = false;
    state.list.unshift(action.payload);
    state.stats.total += 1;
    state.stats.pending += 1;
  });
  builder.addCase(createFreeze.rejected, (state, action) => {
    state.loadings.createFreeze = false;
    state.errors.createFreeze = action.error.message || "Failed to create";
  });
},
});

export default freezeRequestSlice.reducer;
export const { clearSelectedRequest, clearErrors } = freezeRequestSlice.actions;
