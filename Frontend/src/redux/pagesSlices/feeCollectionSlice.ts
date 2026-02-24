// src/redux/pagesSlices/feeCollectionSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/lib/axios";
import { toast } from "@/hooks/use-toast";
import { ApiRequests } from "@/service/ApiRequests";

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  reference_num: string;
  profile_image?: string | null;
}

interface Plan {
  id: number;
  name: string;
  fee: number;
  duration_days: number;
}

interface FeeCollection {
  id: number;
  reference_num: string;
  user_id: number;
  plan_id: number;
  plan_start_date: string;
  plan_expire_date: string;
  amount: number;
  deposit_method: string;
  generate_date: string;
  generate_time: string;
  created_by_id: number;
  branch_id: number;
  created_at: string;
  member: Member;
  created_by_user: {
    id: number;
    first_name: string;
    last_name: string;
  };
  plan: Plan;
}

interface FeeCollectionState {
  list: FeeCollection[];
  shifts: any[];
  refund: any[];
  refundSummary: any[];
  transfers: any[];
  systemLogs: any[];
  feeID?: any;
  advanceCollections: FeeCollection[];
  advanceFeeID?: any;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  } | null;
  loadings: {
    fetch: boolean;
    fetchShift: boolean;
    store: boolean;
    storeRefund: boolean;
    fetchRefund: boolean;
    transfers: boolean;
    systemLogs: boolean;
    deleteFeeCollection: boolean;
    fetchAdvance: boolean;
    storeAdvance: boolean;
    updateAdvance: boolean;
    deleteAdvance: boolean;
    payAdvance: boolean;
    cancelAdvance: boolean;
  };
  errors: any;
}

const initialState: FeeCollectionState = {
  list: [],
  shifts: [],
  refund: [],
  refundSummary: [],
  transfers: [],
  feeID: null,
  advanceCollections: [],
  advanceFeeID: null,
  pagination: null,
  loadings: {
    fetch: false,
    fetchShift: false,
    store: false,
    fetchRefund: false,
    storeRefund: false,
    transfers: false,
    systemLogs: false,
    deleteFeeCollection: false,
    fetchAdvance: false,
    storeAdvance: false,
    updateAdvance: false,
    deleteAdvance: false,
    payAdvance: false,
    cancelAdvance: false,
  },
  errors: null,
};

// GET: Fetch all fee collections
export const fetchFeeCollectionsAsyncThunk = createAsyncThunk(
  "feeCollection/fetchAll",
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      filter_branch_id?: string;
    } = {}
  ) => {
    const response = await ApiRequests.getFeeCollection(params);

    // const response = await axios.get("/fee/collection/all", { params });
    return response.data;
  }
);
export const getShiftsAsyncThunk = createAsyncThunk(
  "feeCollection/fetchShifts",
  async (params: any) => {
    const response = await ApiRequests.getShifts(params);

    // const response = await axios.get("/fee/collection/all", { params });
    return response.data;
  }
);
export const getFeeIdAsyncThunk = createAsyncThunk(
  "feeCollection/getFeeId",
  async (params: any) => {
    const response = await ApiRequests.getFeeId(params);
    return response.data;
  }
);

// POST: Store new fee collection
export const storeFeeCollectionAsyncThunk = createAsyncThunk(
  "feeCollection/store",
  async (
    data: {
      user_id: number;
      plan_id: number;
      plan_start_date: string;
      deposit_method: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await ApiRequests.createFeeCollection(data); // Your single update endpoint

      //   const response = await axios.post("/fee/collection/store", data);
      toast({ title: "Fee collected successfully!" });
      return response.data;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.errors ||
        err.response?.data?.message ||
        "Failed to collect fee";

      // toast({
      //   title: "Error",
      //   description:
      //     typeof errorMsg === "string" ? errorMsg : "Validation failed",
      //   variant: "destructive",
      // });

      return rejectWithValue(
        err.response?.data || { message: "Unknown error" }
      );
    }
  }
);
export const updateFeeCollectionAsyncThunk = createAsyncThunk(
  "updateFeeCollectionAsyncThunk/store",
  async (
    data: {
      generate_date: number;
      fee_collection_id: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await ApiRequests.updateFeeCollection(data); // Your single update endpoint

      //   const response = await axios.post("/fee/collection/store", data);
      toast({ title: "Fee updated successfully!" });
      return response.data;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.errors ||
        err.response?.data?.message ||
        "Failed to updated fee";

      // toast({
      //   title: "Error",
      //   description:
      //     typeof errorMsg === "string" ? errorMsg : "Validation failed",
      //   variant: "destructive",
      // });

      return rejectWithValue(
        err.response?.data || { message: "Unknown error" }
      );
    }
  }
);
export const storeRefundCollectionAsyncThunk = createAsyncThunk(
  "refundCollection/store",
  async (
    data: {
      user_id: number;
      plan_id: number;
      plan_start_date: string;
      deposit_method: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await ApiRequests.createRefundCollection(data); // Your single update endpoint
      toast({ title: "Refund collected successfully!" });
      return response.data;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.errors ||
        err.response?.data?.message ||
        "Failed to Refund";
      return rejectWithValue(
        err.response?.data || { message: "Unknown error" }
      );
    }
  }
);
export const fetchRefundCollectionsAsyncThunk = createAsyncThunk(
  "refundCollection/fetchAll",
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      filter_branch_id?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await ApiRequests.getRefundCollection(params);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data || { message: "Unknown error" }
      );
    }
  }
);
export const createMembershipTransferAsyncThunk = createAsyncThunk(
  "membershipTransfer/store",
  async (
    payload: { from_member_id: number; to_member_id: number; notes: string },
    { rejectWithValue }
  ) => {
    try {
      console.log("Thunk received payload:", payload);

      const response = await ApiRequests.createMembershipTransfer(payload); // ← now sends JSON

      toast({ title: "Membership Transfer successfully!" });
      return response.data;
    } catch (err: any) {
      console.log("Full API error:", err.response?.data);

      const errorMsg =
        err.response?.data?.errors ||
        err.response?.data?.message ||
        "Failed to create Membership Transfer";

      return rejectWithValue(
        err.response?.data || { message: "Unknown error" }
      );
    }
  }
);
export const getAllMembershipTransfersAsyncThunk = createAsyncThunk(
  "membershipTransfer/fetchAll",
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      filter_branch_id?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await ApiRequests.getAllMembershipTransfers(params);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data || { message: "Unknown error" }
      );
    }
  }
);
export const getSystemLogsAsyncThunk = createAsyncThunk(
  "feeCollection/systemLogs",
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      filter_branch_id?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await ApiRequests.getSystemLogs(params);
      return response.data;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.errors ||
        err.response?.data?.message ||
        "Failed to fetch System logs ";

      return rejectWithValue(
        err.response?.data || { message: "Unknown error" }
      );
    }
  }
);
export const deleteFeeCollectionAsyncThunk = createAsyncThunk(
  "deleteFeeCollection/delete",
  async (payload, { rejectWithValue }) => {
    try {
      console.log("Thunk received payload:", payload);
      const response = await ApiRequests.deleteFeeCollection(payload); // ← now sends JSON
      return response.data;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.errors ||
        err.response?.data?.message ||
        "Failed to create Membership Transfer";

      return rejectWithValue(
        err.response?.data || { message: "Unknown error" }
      );
    }
  }
);
export const fetchAdvanceFeeCollectionsAsyncThunk = createAsyncThunk(
  "feeCollection/fetchAdvanceFeeCollections",
  async ({ params }: { params: any }, { rejectWithValue }) => {
    try {
      // Assume endpoint is /api/advance-fee-collections or add query param
      const response = await ApiRequests.getAdvanceFeeCollections(params);
      return response.data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch advance fee collections",
        variant: "destructive",
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const storeAdvanceFeeCollectionAsyncThunk = createAsyncThunk(
  "feeCollection/storeAdvanceFeeCollection",
  async (
    { data,  }: { data: FormData; },
    { rejectWithValue }
  ) => {
    try {
      const response = await ApiRequests.storeAdvanceFeeCollection(data);
      return response.data;
    } catch (error: any) {
     
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
export const payAdvanceFeeCollectionAsyncThunk = createAsyncThunk(
  "feeCollection/payAdvanceFeeCollection",
  async (data, { rejectWithValue }) => {
    try {
      const response = await ApiRequests.payAdvanceFeeCollection(data);  // ← NEW API call
      toast({ title: "Success", description: "Advance fee payment processed" });
      return response.data;
    } catch (error: any) {
    
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const cancelAdvanceFeePaymentAsyncThunk = createAsyncThunk(
  "feeCollection/cancelAdvanceFeePayment",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await ApiRequests.cancelAdvanceFeePayment(id);  // ← NEW API call
      toast({ title: "Success", description: "Advance fee payment canceled" });
      return response.data;
    } catch (error: any) {
      
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
const feeCollectionSlice = createSlice({
  name: "feeCollection",
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.errors = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchFeeCollectionsAsyncThunk.pending, (state) => {
        state.loadings.fetch = true;
        state.errors = null;
      })
      .addCase(fetchFeeCollectionsAsyncThunk.fulfilled, (state, action) => {
        state.loadings.fetch = false;
        state.list = action.payload.data;
        // console.log("action.payload.data",action.payload.data)
        state.pagination = {
          current_page: action.payload.data.fee_collections.current_page,
          last_page: action.payload.data.fee_collections.last_page,
          per_page: action.payload.data.fee_collections.per_page,
          total: action.payload.data.fee_collections.total,
          from: action.payload.data.fee_collections.from,
          to: action.payload.data.fee_collections.to,
        };
      })
      .addCase(fetchFeeCollectionsAsyncThunk.rejected, (state, action) => {
        state.loadings.fetch = false;
        state.errors = action.payload || action.error;
      })
      .addCase(getShiftsAsyncThunk.pending, (state) => {
        state.loadings.fetchShift = true;
        state.errors = null;
      })
      .addCase(getShiftsAsyncThunk.fulfilled, (state, action) => {
        state.loadings.fetchShift = false;
        // console.log("shifts",action.payload.data)
        state.shifts = action.payload.data;
        state.pagination = {
          current_page: action.payload.data.current_page,
          last_page: action.payload.data.last_page,
          per_page: action.payload.data.per_page,
          total: action.payload.data.total,
          from: action.payload.data.from,
          to: action.payload.data.to,
        };
      })
      .addCase(getShiftsAsyncThunk.rejected, (state, action) => {
        state.loadings.fetchShift = false;
        state.errors = action.payload || action.error;
      })

      // Store
      .addCase(storeFeeCollectionAsyncThunk.pending, (state) => {
        state.loadings.store = true;
        state.errors = null;
      })
      .addCase(storeFeeCollectionAsyncThunk.fulfilled, (state, action) => {
        state.loadings.store = false;
        // Optionally prepend new record
        // state.list.unshift(action.payload.data);
      })
      .addCase(storeFeeCollectionAsyncThunk.rejected, (state, action) => {
        state.loadings.store = false;
        state.errors = action.payload;
      })
      .addCase(getFeeIdAsyncThunk.pending, (state) => {
        state.loadings.store = true;
        state.errors = null;
      })
      .addCase(getFeeIdAsyncThunk.fulfilled, (state, action) => {
        state.loadings.store = false;
        // console.log("action.payload.data",action.payload.data)
        state.feeID = action.payload.data;
      })
      .addCase(getFeeIdAsyncThunk.rejected, (state, action) => {
        state.loadings.store = false;
        state.errors = action.payload;
      })
      .addCase(fetchRefundCollectionsAsyncThunk.pending, (state) => {
        state.loadings.fetchRefund = true;
        state.errors = null;
      })
      .addCase(fetchRefundCollectionsAsyncThunk.fulfilled, (state, action) => {
        state.loadings.fetchRefund = false;
        state.refund = action.payload.data.refunds;
        state.refundSummary = action.payload.data.summary;
        // console.log("action.payload.data",action.payload.data)
        state.pagination = {
          current_page: action.payload.data.refunds.current_page,
          last_page: action.payload.data.refunds.last_page,
          per_page: action.payload.data.refunds.per_page,
          total: action.payload.data.refunds.total,
          from: action.payload.data.refunds.from,
          to: action.payload.data.refunds.to,
        };
      })
      .addCase(fetchRefundCollectionsAsyncThunk.rejected, (state, action) => {
        state.loadings.fetchRefund = false;
        state.errors = action.payload || action.error;
      })
      // Store
      .addCase(storeRefundCollectionAsyncThunk.pending, (state) => {
        state.loadings.storeRefund = true;
        state.errors = null;
      })
      .addCase(storeRefundCollectionAsyncThunk.fulfilled, (state, action) => {
        state.loadings.storeRefund = false;
      })
      .addCase(storeRefundCollectionAsyncThunk.rejected, (state, action) => {
        state.loadings.storeRefund = false;
        state.errors = action.payload;
      })
      .addCase(getAllMembershipTransfersAsyncThunk.pending, (state) => {
        state.loadings.transfers = true;
        state.errors = null;
      })
      .addCase(
        getAllMembershipTransfersAsyncThunk.fulfilled,
        (state, action) => {
          state.loadings.transfers = false;
          state.transfers = action.payload.data;
          console.log("action.payload.data", action.payload.data);
          state.pagination = {
            current_page: action.payload.data.current_page,
            last_page: action.payload.data.last_page,
            per_page: action.payload.data.per_page,
            total: action.payload.data.total,
            from: action.payload.data.from,
            to: action.payload.data.to,
          };
        }
      )
      .addCase(
        getAllMembershipTransfersAsyncThunk.rejected,
        (state, action) => {
          state.loadings.transfers = false;
          state.errors = action.payload || action.error;
        }
      )
      // Store
      .addCase(createMembershipTransferAsyncThunk.pending, (state) => {
        state.loadings.transfers = true;
        state.errors = null;
      })
      .addCase(
        createMembershipTransferAsyncThunk.fulfilled,
        (state, action) => {
          state.loadings.transfers = false;
        }
      )
      .addCase(createMembershipTransferAsyncThunk.rejected, (state, action) => {
        state.loadings.transfers = false;
        state.errors = action.payload;
      })
      .addCase(getSystemLogsAsyncThunk.pending, (state) => {
        state.loadings.systemLogs = true;
        state.errors = null;
      })
      .addCase(getSystemLogsAsyncThunk.fulfilled, (state, action) => {
        state.loadings.systemLogs = false;
        state.systemLogs = action.payload.data;
        console.log("action.payload.data", action.payload.data);
      })
      .addCase(getSystemLogsAsyncThunk.rejected, (state, action) => {
        state.loadings.systemLogs = false;
        state.errors = action.payload || action.error;
      })
      .addCase(deleteFeeCollectionAsyncThunk.pending, (state) => {
        state.loadings.deleteFeeCollection = true;
        state.errors = null;
      })
      .addCase(deleteFeeCollectionAsyncThunk.fulfilled, (state, action) => {
        state.loadings.deleteFeeCollection = false;
      })
      .addCase(deleteFeeCollectionAsyncThunk.rejected, (state, action) => {
        state.loadings.deleteFeeCollection = false;
      })
      .addCase(fetchAdvanceFeeCollectionsAsyncThunk.pending, (state) => {
        state.loadings.fetchAdvance = true;
        state.errors = null;
      })
      .addCase(fetchAdvanceFeeCollectionsAsyncThunk.fulfilled, (state, action) => {
        state.loadings.fetchAdvance = false;
        console.log("action.payload.data",action.payload.data)
        state.advanceCollections = action.payload.data || action.payload.data || [];
        state.pagination = action.payload;
      })
      .addCase(fetchAdvanceFeeCollectionsAsyncThunk.rejected, (state, action) => {
        state.loadings.fetchAdvance = false;
        state.errors = action.payload || action.error;
      })
      // Store Advance Fee Collection
      .addCase(storeAdvanceFeeCollectionAsyncThunk.pending, (state) => {
        state.loadings.storeAdvance = true;
        state.errors = null;
      })
      .addCase(storeAdvanceFeeCollectionAsyncThunk.fulfilled, (state, action) => {
        state.loadings.storeAdvance = false;
        // state.advanceCollections.unshift(action.payload); // Add to advance list
      })
      .addCase(storeAdvanceFeeCollectionAsyncThunk.rejected, (state, action) => {
        state.loadings.storeAdvance = false;
        state.errors = action.payload;
      })
      // Pay Advance Fee Collection
      .addCase(payAdvanceFeeCollectionAsyncThunk.pending, (state) => {
        state.loadings.payAdvance = true;
        state.errors = null;
      })
      .addCase(payAdvanceFeeCollectionAsyncThunk.fulfilled, (state, action) => {
        state.loadings.payAdvance = false;
        // Update the specific collection status
        const index = state.advanceCollections.findIndex(item => item.id === action.meta.arg.id);
        if (index !== -1) {
          state.advanceCollections[index] = { ...state.advanceCollections[index], ...action.payload };
        }
      })
      .addCase(payAdvanceFeeCollectionAsyncThunk.rejected, (state, action) => {
        state.loadings.payAdvance = false;
        state.errors = action.payload;
      })
      // Cancel Advance Fee Payment
      .addCase(cancelAdvanceFeePaymentAsyncThunk.pending, (state) => {
        state.loadings.cancelAdvance = true;
        state.errors = null;
      })
      .addCase(cancelAdvanceFeePaymentAsyncThunk.fulfilled, (state, action) => {
        state.loadings.cancelAdvance = false;
      
      })
      .addCase(cancelAdvanceFeePaymentAsyncThunk.rejected, (state, action) => {
        state.loadings.cancelAdvance = false;
        state.errors = action.payload || action.error;
      })
      ;
  },
});

export const { clearErrors } = feeCollectionSlice.actions;
export default feeCollectionSlice.reducer;
