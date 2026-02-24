// src/redux/pagesSlices/planSlice.ts

import { createSlice, createAsyncThunk, isAnyOf } from "@reduxjs/toolkit";
import { ApiRequests } from "../../service/ApiRequests";
import {
  catchAsync,
  handleLoadingErrorParamsForAsycThunk,
  reduxToolKitCaseBuilder,
} from "../../helpers/detectError";
import { toast } from "@/hooks/use-toast";

// Types from API responses
export interface Branch {
  id: number;
  name: string;
  type: "main" | "other";
  status: "active" | "inactive";
  created_at: string | null;
  updated_at: string | null;
}

export interface Plan {
  id: number;
  name: string;
  description: string | null;
  fee: number;
  duration_days: number;
  status: "active" | "inactive";
  branch_id: number;
  created_at: string | null;
  updated_at: string | null;
}
export interface Bank {
  id?: number;
  name: string;
  account_num: string | null;
}

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

interface PlanState {
  branchesList: Branch[];
  currentBranch?: any;
  branches: {
    data: Branch[];
    meta: PaginationMeta;
  };
  plans: {
    data: Plan[];
    meta: PaginationMeta;
  };
  banks: {
    data: Bank[];
    meta: PaginationMeta;
  };
  planTransfer: {
    data: Plan[];
    meta: PaginationMeta;
  };
  availablePlans: {
    data: any[];
  };
  paramsForThunk: Record<string, any>;
  loadings: Record<string, boolean>;
  errors: Record<string, boolean>;
  errorMessages: Record<string, string>;
  errorCodes: Record<string, number>;
}

const initialState: PlanState = {
  branchesList: [],
  currentBranch: null,
  branches: {
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
  plans: {
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
  banks: {
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
  planTransfer: {
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
  availablePlans: {
    data: [],
  },
  branchesList: [],
  paramsForThunk: {},
  loadings: {
    getAllBranches: true,
    branchesList: true,
    createOrUpdateBranch: false,
    deleteBranch: false,
    toggleBranchStatus: false,
    currentBranch: false,
    getAllPlans: true, // ← THIS WAS MISSING → caused the crash
    createPlan: false,
    deletePlan: false,
    togglePlanStatus: false,
    getPlanTransfers: false,
    availablePlan: false,
  },
  errors: {},
  errorMessages: {},
  errorCodes: {},
};

// ==================== THUNKS ====================
// export const getBranchesListAsyncThunk = createAsyncThunk(
//   "plan/getBranches",
//   catchAsync(async (params: any = {}) => {
//     const response = await ApiRequests.getAllBranch(params);
//     return response?.data?.data;
//   })
// )
export const getAllBranchesAsyncThunk = createAsyncThunk(
  "plan/getAllBranches",
  catchAsync(async (params: any = {}) => {
    const response = await ApiRequests.getAllBranch(params);
    return response?.data?.data;
  })
);

export const createOrUpdateBranchAsyncThunk = createAsyncThunk(
  "plan/createOrUpdateBranch",
  catchAsync(async ({ data }: { data: FormData }) => {
    const response = await ApiRequests.createOrUpdateBranch(data);
    // toast({ title: data.get("id") ? "Branch updated" : "Branch created" });
    return response?.data?.data as Branch;
  })
);

export const deleteBranchAsyncThunk = createAsyncThunk(
  "plan/deleteBranch",
  catchAsync(async (id: number) => {
    await ApiRequests.deleteBranch({ id });
    toast({ title: "Branch deleted" });
    return id;
  })
);

export const toggleBranchStatusAsyncThunk = createAsyncThunk(
  "plan/toggleBranchStatus",
  catchAsync(async (data: any) => {
    const response = await ApiRequests.toggleBranchStatus(data);
    return response?.data?.data;
  })
);

// Plans
export const getAllPlansAsyncThunk = createAsyncThunk(
  "plan/getAllPlans",
  catchAsync(async ({ params }) => {
    // console.log("getAllPlansAsyncThunk params", params);
    const response = await ApiRequests.getAllPlans(params);
    return response?.data?.data;
  })
);

export const createPlanAsyncThunk = createAsyncThunk(
  "plan/createPlan",
  catchAsync(async ({ data }: { data: FormData }) => {
    const response = await ApiRequests.createPlan(data);
    toast({ title: data.get("id") ? "Plan updated" : "Plan created" });
    return response?.data?.data as Plan;
  })
);
export const getPlanTransfersAsyncThunk = createAsyncThunk(
  "plan/getPlanTransfers",
  catchAsync(async ({ params }) => {
    // console.log("getPlanTransfersAsyncThunk params", params);
    const response = await ApiRequests.getPlanTransfers(params);
    return response?.data?.data;
  })
);
export const getAvailablePlansAsyncThunk = createAsyncThunk(
  "plan/getAvailablePlans",
  catchAsync(async ({ params }) => {
    // console.log("getAvailablePlansAsyncThunk params", params);
    const response = await ApiRequests.getAvailablePlans(params);
    return response?.data?.data;
  })
);

export const createPlanTransfersAsyncThunk = createAsyncThunk(
  "plan/createPlanTransfers",
  catchAsync(async ({ data }: { data: FormData }) => {
    // console.log("data in craete tranfer plan", data);
    const response = await ApiRequests.createPlanTransfers(data);
    // toast({ title: data.get("id") ? "Plan updated" : "Plan created" });
    return response?.data?.data as Plan;
  })
);
// redux slice
// export const createAttendenceAsyncThunk = createAsyncThunk(
//   "attendance/create",
//   catchAsync(async ({ data }: { data: FormData }) => {
//     console.log("FormData received in thunk:", [...data.entries()]);
//     const response = await ApiRequests.createAttendence(data);
//     return response?.data?.data;
//   })
// );

export const deletePlanAsyncThunk = createAsyncThunk(
  "plan/deletePlan",
  catchAsync(async (params: any = {}) => {
    const response = await ApiRequests.deletePlan(params);
    toast({ title: "Plan deleted" });
    return response;
  })
);

export const togglePlanStatusAsyncThunk = createAsyncThunk(
  "plan/togglePlanStatus",
  catchAsync(
    async ({
      plan_id,
      status,
    }: {
      plan_id: number;
      status: "active" | "inactive";
    }) => {
      const response = await ApiRequests.togglePlanStatus({ plan_id });
      return { plan_id, status: response?.data?.data?.status || status };
    }
  )
);
export const getBranchesListAsyncThunk = createAsyncThunk(
  "plan/getBranchesList",
  catchAsync(async (params: any = {}) => {
    const response = await ApiRequests.getAllBranch(params);
    return response?.data?.data;
  })
);
export const getBranchesListsAsyncThunk = createAsyncThunk(
  "plan/getBranchesLists",
  catchAsync(async (params: any = {}) => {
    const response = await ApiRequests.getAllBranchs(params);
    return response?.data?.data;
  })
);
export const getCurrentBranchAsyncThunk = createAsyncThunk(
  "plan/getCurrentBranch",
  catchAsync(async (params: any = {}) => {
    const response = await ApiRequests.getCurrentBranch(params);
    return response?.data?.data;
  })
);
export const getAllBanksAsyncThunk = createAsyncThunk(
  "plan/getAllBanks",
  catchAsync(async ({ params }) => {
    // console.log("getAllBanksAsyncThunk params", params);
    const response = await ApiRequests.getAllBanks(params);
    return response?.data?.data;
  })
);

export const createBankAsyncThunk = createAsyncThunk(
  "plan/createBank",
  catchAsync(async ({ data }: { data: FormData }) => {
    const response = await ApiRequests.createBank(data);
    toast({ title: data.get("id") ? "Bank updated" : "Bank created" });
    return response?.data?.data as Bank;
  })
);
// ==================== SLICE ====================

const planSlice = createSlice({
  name: "plan",
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
    builder

      // Branches
      // .addCase(getBranchesListAsyncThunk.fulfilled, (state, action) => {
      //   state.branchesList = action.payload as Branch[];
      //   console.log("state.branchesList", action.payload);
      // })
      .addCase(getAllBranchesAsyncThunk.pending, (state) => {
        state.loadings.getAllBranches = true;
      })
      .addCase(getAllBranchesAsyncThunk.fulfilled, (state, action) => {
        const payload = action.payload as any;
        state.branches.data = payload.data;
        state.branches.meta = {
          current_page: payload.current_page,
          from: payload.from,
          to: payload.to,
          per_page: payload.per_page,
          total: payload.total,
          last_page: payload.last_page,
          next_page_url: payload.next_page_url,
          prev_page_url: payload.prev_page_url,
        };
        state.loadings.getAllBranches = false;
      })
      .addCase(getAllBranchesAsyncThunk.rejected, (state) => {
        state.loadings.getAllBranches = false;
      })
      .addCase(getCurrentBranchAsyncThunk.pending, (state) => {
        state.loadings.currentBranch = true;
      })
      .addCase(getCurrentBranchAsyncThunk.fulfilled, (state, action) => {
        const payload = action.payload as any;
        // console.log("currentBranch", action.payload);
        state.currentBranch = payload;
        state.loadings.currentBranch = false;
      })
      .addCase(getCurrentBranchAsyncThunk.rejected, (state) => {
        state.loadings.currentBranch = false;
      })

      // Create/Update Branch
      .addCase(createOrUpdateBranchAsyncThunk.fulfilled, (state, action) => {
        const branch = action.payload;
        const index = state.branches.data.findIndex((b) => b.id === branch.id);
        if (index >= 0) {
          state.branches.data[index] = branch;
        } else {
          state.branches.data.unshift(branch);
          state.branches.meta.total += 1;
        }
      })

      // Delete Branch
      .addCase(deleteBranchAsyncThunk.fulfilled, (state, action) => {
        const id = action.payload;
        state.branches.data = state.branches.data.filter((b) => b.id !== id);
        state.branches.meta.total -= 1;
      })

      // Toggle Branch Status - Optimistic
      .addCase(toggleBranchStatusAsyncThunk.pending, (state, action) => {
        const { id, status } = action.meta.arg;
        const branch = state.branches.data.find((b) => b.id === id);
        if (branch) branch.status = status;
      })
      .addCase(toggleBranchStatusAsyncThunk.fulfilled, (state, action) => {
        const { id, status } = action.payload as any;
        // console.log("toggleBranchStatusAsyncThunk.fulfilled", action.payload);
        const branch = state.branches.data.find((b) => b.id === id);
        if (branch) branch.status = status;
      })
      .addCase(toggleBranchStatusAsyncThunk.rejected, (state, action) => {
        const { id, status } = action.meta.arg;
        const branch = state.branches.data.find((b) => b.id === id);
        if (branch) branch.status = status === "active" ? "inactive" : "active";
      })

      // Plans
      .addCase(getAllPlansAsyncThunk.pending, (state) => {
        state.loadings.getAllPlans = true;
      })
      .addCase(getAllPlansAsyncThunk.fulfilled, (state, action) => {
        const payload = action.payload;
        // console.log("getAllPlansAsyncThunk.fulfilled payload", payload);
        state.plans = payload;
        state.plans.meta = {
          current_page: payload.current_page,
          from: payload.from,
          to: payload.to,
          per_page: payload.per_page,
          total: payload.total,
          last_page: payload.last_page,
          next_page_url: payload.next_page_url,
          prev_page_url: payload.prev_page_url,
        };
        state.loadings.getAllPlans = false;
      })
      .addCase(getAllPlansAsyncThunk.rejected, (state) => {
        state.loadings.getAllPlans = false;
      })

      // Create/Update Plan
      .addCase(createPlanTransfersAsyncThunk.fulfilled, (state, action) => {
        const plan = action.payload;
        // const index = state.plans.data.findIndex((p) => p.id === plan.id);
        // if (index >= 0) {
        //   state.plans.data[index] = plan;
        // } else {
        //   state.plans.data.unshift(plan);
        //   state.plans.meta.total += 1;
        // }
      })
      .addCase(getPlanTransfersAsyncThunk.pending, (state) => {
        state.loadings.getPlanTransfers = true;
      })
      .addCase(getPlanTransfersAsyncThunk.fulfilled, (state, action) => {
        const payload = action.payload;
        // console.log("getPlanTransfersAsyncThunk.fulfilled payload", payload);
        state.planTransfer.data = payload.data;
        state.planTransfer.meta = {
          current_page: payload.current_page,
          from: payload.from,
          to: payload.to,
          per_page: payload.per_page,
          total: payload.total,
          last_page: payload.last_page,
          next_page_url: payload.next_page_url,
          prev_page_url: payload.prev_page_url,
        };
        state.loadings.getPlanTransfers = false;
      })
      .addCase(getPlanTransfersAsyncThunk.rejected, (state) => {
        state.loadings.getPlanTransfers = false;
      })
      .addCase(getAvailablePlansAsyncThunk.pending, (state) => {
        state.loadings.availablePlan = true;
      })
      .addCase(getAvailablePlansAsyncThunk.fulfilled, (state, action) => {
        const payload = action.payload;
        // console.log("availablePlan.fulfilled payload", payload);
        state.availablePlans.data = payload;
        // state.availablePlans.meta = {
        //   current_page: payload.current_page,
        //   from: payload.from,
        //   to: payload.to,
        //   per_page: payload.per_page,
        //   total: payload.total,
        //   last_page: payload.last_page,
        //   next_page_url: payload.next_page_url,
        //   prev_page_url: payload.prev_page_url,
        // };
        state.loadings.availablePlan = false;
      })
      .addCase(getAvailablePlansAsyncThunk.rejected, (state) => {
        state.loadings.availablePlan = false;
      })

      // Create/Update Plan
      .addCase(createPlanAsyncThunk.fulfilled, (state, action) => {
        const plan = action.payload;
        // const index = state.plans.data.findIndex((p) => p.id === plan.id);
        // if (index >= 0) {
        //   state.plans.data[index] = plan;
        // } else {
        //   state.plans.data.unshift(plan);
        //   state.plans.meta.total += 1;
        // }
      })

      // Delete Plan
      .addCase(deletePlanAsyncThunk.fulfilled, (state, action) => {
        const id = action.payload;
        state.plans.data = state.plans.data.filter((p) => p.id !== id);
        state.plans.meta.total -= 1;
      })

      // Toggle Plan Status
      .addCase(togglePlanStatusAsyncThunk.pending, (state, action) => {
        const { id, status } = action.meta.arg;
        // const plan = state.plans.data.find((p) => p.id === id);
        // if (plan) plan.status = status;
      })
      .addCase(togglePlanStatusAsyncThunk.fulfilled, (state, action) => {
        const { id, status } = action.payload;
        // const plan = state.plans.data.find((p) => p.id === id);
        // if (plan) plan.status = status;
      })
      .addCase(togglePlanStatusAsyncThunk.rejected, (state, action) => {
        const { id, status } = action.meta.arg;
        // const plan = state.plans.data.find((p) => p.id === id);
        // if (plan) plan.status = status === "active" ? "inactive" : "active";
      })
      .addCase(getBranchesListAsyncThunk.pending, (state, action) => {
        state.loadings.branchesList = true;
      })
      .addCase(getBranchesListAsyncThunk.fulfilled, (state, action) => {
        const payload = action.payload as any;
        state.branchesList = payload?.data || [];
        state.loadings.branchesList = false;
      })
      .addCase(getBranchesListAsyncThunk.rejected, (state, action) => {
        state.loadings.branchesList = false;
      })
      .addCase(getAllBanksAsyncThunk.pending, (state) => {
        state.loadings.getAllBanks = true;
      })
      .addCase(getAllBanksAsyncThunk.fulfilled, (state, action) => {
        const payload = action.payload;
        // console.log("getAllBanksAsyncThunk.fulfilled payload", payload);
        state.banks = payload;
        state.banks.meta = {
          current_page: payload.current_page,
          from: payload.from,
          to: payload.to,
          per_page: payload.per_page,
          total: payload.total,
          last_page: payload.last_page,
          next_page_url: payload.next_page_url,
          prev_page_url: payload.prev_page_url,
        };
        state.loadings.getAllBanks = false;
      })
      .addCase(getAllBanksAsyncThunk.rejected, (state) => {
        state.loadings.getAllBanks = false;
      })
      .addCase(getBranchesListsAsyncThunk.pending, (state) => {
        state.loadings.getAllBranches = true;
      })
      .addCase(getBranchesListsAsyncThunk.fulfilled, (state, action) => {
        const payload = action.payload;
        // console.log("getBranchesListsAsyncThunk.fulfilled payload", payload);
        state.branches = payload;
        state.branches.meta = {
          current_page: payload.current_page,
          from: payload.from,
          to: payload.to,
          per_page: payload.per_page,
          total: payload.total,
          last_page: payload.last_page,
          next_page_url: payload.next_page_url,
          prev_page_url: payload.prev_page_url,
        };
        state.loadings.getAllBranches = false;
      })
      .addCase(getBranchesListsAsyncThunk.rejected, (state) => {
        state.loadings.getAllBranches = false;
      })
      // Global loading/error handler
      .addMatcher(
        isAnyOf(
          ...reduxToolKitCaseBuilder([
            getAllBranchesAsyncThunk,
            getBranchesListsAsyncThunk,
            createOrUpdateBranchAsyncThunk,
            deleteBranchAsyncThunk,
            toggleBranchStatusAsyncThunk,
            getAllPlansAsyncThunk,
            createPlanAsyncThunk,
            getAllBanksAsyncThunk,
            createBankAsyncThunk,
            deletePlanAsyncThunk,
            togglePlanStatusAsyncThunk,
          ])
        ),
        handleLoadingErrorParamsForAsycThunk
      );
  },
});

export default planSlice.reducer;
