// src/redux/pagesSlices/planSlice.ts

import { createSlice, createAsyncThunk, isAnyOf } from "@reduxjs/toolkit";
import { ApiRequests } from "../../service/ApiRequests";
import {
  catchAsync,
  handleLoadingErrorParamsForAsycThunk,
  reduxToolKitCaseBuilder,
} from "../../helpers/detectError";
import { toast } from "@/hooks/use-toast";

export interface Attendence {
  id: number;
  user_id: number;
  date: string;
  checkin_time: string | null;
  checkout_time: string | null;
  checkin_type: string;
  created_at?: string;
  updated_at?: string;
}

interface Leave {
  id: number;
  user_id: number;
  user?: {
    first_name: string;
    last_name?: string;
    reference_num?: string;
  };
  leave_title: string;
  apply_reason: string;
  start_date: string;
  end_date: string;
  leave_mode: "single" | "multiple";
  status: "pending" | "approved" | "rejected" | "on-hold";
  doc_url?: string | null;
  hold_reason?: string | null;
  reject_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Holiday {
  id: number;
  start_date: string;
  end_date: string;
  note?: string;
  created_by_user?: any;
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

interface HrmState {
  attendence: {
    data: Attendence[];
    meta: PaginationMeta;
  };
  holiday: { data: Holiday[]; meta: PaginationMeta };
  leave: { data: Leave[]; meta: PaginationMeta };
  paramsForThunk: Record<string, any>;
  loadings: Record<string, boolean>;
  errors: Record<string, boolean>;
  errorMessages: Record<string, string>;
  errorCodes: Record<string, number>;
}

const initialState: HrmState = {
  attendence: {
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
  holiday: {
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
  leave: {
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

  paramsForThunk: {},
  loadings: {
    getAllAttendence: true,
    createOrUpdateAttendence: false,
    getAllHoliday: false,
    getAllLeave: false,
    createOrUpdateHoliday: false,
    createOrUpdateLeave: false,
    createAttendence: false, 
    markAttendenceCheckout: false,
  },
  errors: {},
  errorMessages: {},
  errorCodes: {},
};

// ==================== THUNKS ====================

export const getAttendenceAsyncThunk = createAsyncThunk(
  "plan/getAttendence",
  catchAsync(async ({ params }) => {
    console.log("getAttendenceAsyncThunk params", params);
    const response = await ApiRequests.getAttendence(params);
    return response?.data?.data;
  })
);
export const createAttendenceAsyncThunk = createAsyncThunk(
  "attendance/create",
  catchAsync(async ({ data }: { data: FormData }) => {
    // console.log("craeting", data);

    // console.log("FormData received in thunk:", [...data.entries()]);
    const response = await ApiRequests.createAttendence(data);
    return response?.data?.data;
  })
);
export const markAttendenceCheckoutAsyncThunk = createAsyncThunk(
  "attendance/markCheckout",
  catchAsync(async ({ data }: { data: any }) => {
    console.log("marking", data);
    const response = await ApiRequests.markAttendenceCheckout(data);
    return response?.data?.data;
  })
);
export const updateAttendenceAsyncThunk = createAsyncThunk(
  "attendance/update",
  catchAsync(async ({ data }: { data: any }) => {
    const response = await ApiRequests.updateAttendence(data);
    return response?.data?.data;
  })
);

export const deleteAttendenceAsyncThunk = createAsyncThunk(
  "attendance/delete",
  catchAsync(async ({ attendance_id }: { attendance_id: number }) => {
    await ApiRequests.deleteAttendence({
      id: attendance_id,
      attendance_id: attendance_id,
    });
    return attendance_id;
  })
);

export const getLeaveAsyncThunk = createAsyncThunk(
  "plan/getLeave",
  catchAsync(async ({ params }: { params: any }) => {
    const response = await ApiRequests.getLeave(params);
    console.log("Get Leave Response:", response);
    return response?.data?.data;
  })
);

//holidy
export const getHolidayAsyncThunk = createAsyncThunk(
  "plan/getHoliday",
  catchAsync(async ({ params }) => {
    console.log("getHolidayAsyncThunk params", params);
    const response = await ApiRequests.getHoliday(params);
    return response?.data?.data;
  })
);

export const createHolidayAsyncThunk = createAsyncThunk(
  "holiday/create",
  catchAsync(async ({ data }: { data: any }) => {
    const response = await ApiRequests.createHoliday(data);
    return response?.data?.data;
  })
);

export const deleteHolidayAsyncThunk = createAsyncThunk(
  "holiday/delete",
  catchAsync(async ({ id }: { id: number }) => {
    await ApiRequests.deleteHoliday(id);
    return id;
  })
);

export const createLeaveAsyncThunk = createAsyncThunk(
  "leave/create",
  catchAsync(async ({ data }: { data: FormData }) => {
    console.log("FormData received in leave thunk:", [...data.entries()]);
    const response = await ApiRequests.createLeave(data);
    return response?.data?.data;
  })
);

export const processLeaveAsyncThunk = createAsyncThunk(
  "leave/process",
  catchAsync(
    async (data: {
      leave_id: number;
      status: string;
      hold_reason?: string;
      reject_reason?: string;
    }) => {
      const response = await ApiRequests.processLeave(data);
      return response?.data?.data;
    }
  )
);

// ==================== SLICE ====================

const hrmSlice = createSlice({
  name: "hrm",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loadings[action.payload.key] = action.payload.value;
    },
  },
  extraReducers: (builder) => {
    builder

      // Branches
      .addCase(getAttendenceAsyncThunk.pending, (state) => {
        state.loadings.getAllAttendence = true;
      })
      .addCase(getAttendenceAsyncThunk.fulfilled, (state, action) => {
        const payload = action.payload as any;
        state.attendence.data = payload.data;
        state.attendence.meta = {
          current_page: payload.current_page,
          from: payload.from,
          to: payload.to,
          per_page: payload.per_page,
          total: payload.total,
          last_page: payload.last_page,
          next_page_url: payload.next_page_url,
          prev_page_url: payload.prev_page_url,
        };
        state.loadings.getAllAttendence = false;
      })
      .addCase(getAttendenceAsyncThunk.rejected, (state) => {
        state.loadings.getAllAttendence = false;
      })

      // Create/Update Attendec
      .addCase(createAttendenceAsyncThunk.fulfilled, (state, action) => {
        const newRecord = action.payload;
        const exists = state.attendence.data.some(
          (item) => item.id === newRecord.id
        );
        if (!exists) {
          state.attendence.data.unshift(newRecord);
          state.attendence.meta.total += 1;
        }
      })
      .addCase(createAttendenceAsyncThunk.rejected, (state) => {
        state.loadings.createOrUpdateAttendence = false;
      })
      .addCase(createAttendenceAsyncThunk.pending, (state) => {
        state.loadings.createOrUpdateAttendence = true;
      })

      .addCase(deleteAttendenceAsyncThunk.fulfilled, (state, action) => {
        const id = action.payload;
        state.attendence.data = state.attendence.data.filter(
          (i) => i.id !== id
        );
        state.attendence.meta.total -= 1;
        toast({
          title: "Success",
          description: "Attendance record deleted successfully",
          variant: "success",
        });
      })
      .addCase(deleteAttendenceAsyncThunk.rejected, (state) => {
        state.loadings.deleteAttendence = false;
        toast({
          title: "Error",
          description: "Failed to create holiday",
          variant: "destructive",
        });
      })
      .addCase(deleteAttendenceAsyncThunk.pending, (state) => {
        state.loadings.deleteAttendence = true;
      })

      .addCase(updateAttendenceAsyncThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.attendence.data.findIndex(
          (i) => i.id === updated.id
        );
        if (index !== -1) {
          state.attendence.data[index] = updated;
        }
      })
      .addCase(updateAttendenceAsyncThunk.rejected, (state) => {
        state.loadings.updateAttendence = false;
      })
      .addCase(updateAttendenceAsyncThunk.pending, (state) => {
        state.loadings.updateAttendence = true;
      })

      .addCase(getLeaveAsyncThunk.fulfilled, (state, action) => {
        const payload = action.payload as any;
        state.leave.data = payload.data;
        state.leave.meta = {
          current_page: payload.current_page,
          from: payload.from,
          to: payload.to,
          per_page: payload.per_page,
          total: payload.total,
          last_page: payload.last_page,
          next_page_url: payload.next_page_url,
          prev_page_url: payload.prev_page_url,
        };
        state.loadings.getAllLeave = false;
      })
      .addCase(getLeaveAsyncThunk.rejected, (state) => {
        state.loadings.getAllLeave = false;
      })
      .addCase(getLeaveAsyncThunk.pending, (state) => {
        state.loadings.getAllLeave = true;
      })

      .addCase(getHolidayAsyncThunk.fulfilled, (state, action) => {
        const payload = action.payload as any;
        state.holiday.data = payload.data || [];
        state.holiday.meta = {
          current_page: payload.current_page,
          from: payload.from,
          to: payload.to,
          per_page: payload.per_page,
          total: payload.total,
          last_page: payload.last_page,
          next_page_url: payload.next_page_url,
          prev_page_url: payload.prev_page_url,
        };
        state.loadings.getAllHoliday = false;
      })
      .addCase(getHolidayAsyncThunk.rejected, (state) => {
        state.loadings.getAllHoliday = false;
        toast({
          title: "Error",
          description: "Failed to create holiday",
          variant: "destructive",
        });
      })
      .addCase(getHolidayAsyncThunk.pending, (state) => {
        state.loadings.getAllHoliday = true;
      })

      .addCase(createHolidayAsyncThunk.fulfilled, (state, action) => {
        const holiday = action.payload;
        state.holiday.data.unshift(holiday);
        state.holiday.meta.total += 1;
        toast({
          title: "Success",
          description: "Holiday created successfully",
          variant: "success",
        });
      })
      .addCase(createHolidayAsyncThunk.pending, (state) => {
        state.loadings.createOrUpdateHoliday = true;
      })
      .addCase(createHolidayAsyncThunk.rejected, (state) => {
        state.loadings.createOrUpdateHoliday = false;
      })

      .addCase(deleteHolidayAsyncThunk.fulfilled, (state, action) => {
        const id = action.payload;
        state.holiday.data = state.holiday.data.filter((i) => i.id !== id);
        state.holiday.meta.total -= 1;
        toast({
          title: "Success",
          description: "Holiday deleted successfully",
          variant: "success",
        });
      })
      .addCase(deleteHolidayAsyncThunk.pending, (state) => {
        state.loadings.deleteHoliday = true;
      })
      .addCase(deleteHolidayAsyncThunk.rejected, (state) => {
        state.loadings.deleteHoliday = false;
        toast({
          title: "Error",
          description: "Failed to delete holiday",
          variant: "destructive",
        });
      })

      .addCase(createLeaveAsyncThunk.fulfilled, (state, action) => {
        const leave = action.payload;
        state.leave.data.unshift(leave);
        state.leave.meta.total += 1;
        toast({
          title: "Success",
          description: "Leave created successfully",
          variant: "success",
        });
      })
      .addCase(createLeaveAsyncThunk.pending, (state) => {
        state.loadings.createOrUpdateLeave = true;
      })
      .addCase(createLeaveAsyncThunk.rejected, (state) => {
        state.loadings.createOrUpdateLeave = false;
      })

      .addCase(processLeaveAsyncThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.leave.data.findIndex(
          (l: any) => l.id === updated.id
        );
        if (index !== -1) state.leave.data[index] = updated;
        toast({
          title: "Success",
          description: "Leave processed successfully",
          variant: "success",
        });
      })
      .addCase(processLeaveAsyncThunk.rejected, (state) => {
        state.loadings.createOrUpdateLeave = false;
        toast({
          title: "Error",
          description: "Failed to process leave",
          variant: "destructive",
        });
      })
      .addCase(processLeaveAsyncThunk.pending, (state) => {
        state.loadings.createOrUpdateLeave = true;
      })
    //   .addCase(createAttendenceAsyncThunk.pending, (state) => {
    //   state.loadings.createAttendence = true;
    // })
    // .addCase(createAttendenceAsyncThunk.fulfilled, (state, action) => {
    //   state.loadings.createAttendence = false;
    //   // state.loadings.createOrUpdateAttendence = false;
    // })
    // .addCase(createAttendenceAsyncThunk.rejected, (state) => {
    //   state.loadings.createAttendence = false;
    //   // state.loadings.createOrUpdateAttendence = false;
    // })
    .addCase(markAttendenceCheckoutAsyncThunk.pending, (state) => {
      state.loadings.markAttendenceCheckout = true;
    })
    .addCase(markAttendenceCheckoutAsyncThunk.fulfilled, (state, action) => {
      state.loadings.markAttendenceCheckout = false;
    })
    .addCase(markAttendenceCheckoutAsyncThunk.rejected, (state) => {
      state.loadings.markAttendenceCheckout = false;
    })
      // .addCase(createAttendenceAsyncThunk.pending, (state) => {
      //   state.loadings.createOrUpdateAttendence = true;
      // })

      // .addCase(createAttendenceAsyncThunk.rejected, (state) => {
      //   state.loadings.createOrUpdateAttendence = false;
      // })

      // .addCase(updateAttendenceAsyncThunk.pending, (state) => {
      //   state.loadings.createOrUpdateAttendence = true;
      // })

      // .addCase(updateAttendenceAsyncThunk.rejected, (state) => {
      //   state.loadings.createOrUpdateAttendence = false;
      // })

      // .addCase(deleteAttendenceAsyncThunk.rejected, (state, action) => {
      //   toast({
      //     title: "Error",
      //     description: "Failed to delete attendance record",
      //     variant: "destructive"
      //   });
      // })

      // Global loading/error handler
      .addMatcher(
        isAnyOf(
          ...reduxToolKitCaseBuilder([
            getAttendenceAsyncThunk,
            createAttendenceAsyncThunk,
            updateAttendenceAsyncThunk,
            deleteAttendenceAsyncThunk,
            getLeaveAsyncThunk,
            getHolidayAsyncThunk,
            createHolidayAsyncThunk,
            deleteHolidayAsyncThunk,
            createLeaveAsyncThunk,
            processLeaveAsyncThunk,
            markAttendenceCheckoutAsyncThunk,
          ])
        ),
        handleLoadingErrorParamsForAsycThunk
      );
  },
});

export default hrmSlice.reducer;
