import { createSlice, createAsyncThunk, isAnyOf } from "@reduxjs/toolkit";
import { ApiRequests } from "../../service/ApiRequests";
import {
  catchAsync,
  handleLoadingErrorParamsForAsycThunk,
  reduxToolKitCaseBuilder,
} from "../../helpers/detectError";
import { toast } from "@/hooks/use-toast";

// Types from API responses
export type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  created_at: string;
  read: boolean;
};
export interface Shift {
  id: number;
  name: string;
  type: "main" | "other";
  status: "active" | "inactive";
  created_at: string | null;
  updated_at: string | null;
}
export interface Payroll {
  id: number;
  user_id: number;
  basic_salary: string;
  payroll_month: string;
  cheat_minutes: number;
  cheat_deduction: string;
  absent_days: number;
  absent_deduction: string;
  leave_days: number;
  holiday_days: number;
  net_payable: string;
  created_at: string;
  updated_at: string;
  user: User;
}
export interface Attendance {
  id: number;
  user_id: number;
  user_type: string;
  date: string;
  checkin_time: string;
  checkout_time: string;
  created_by_id: number;
  checkin_type: string;
  branch_id: number;
  created_at: string;
  updated_at: string;
  user: User;
}
export interface User {
  id: number;
  email: string;
  phone: string;
  reference_num: string | null,
  first_name: string;
  last_name: string;
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

interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
}

interface CompanySettings {
  id: number;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string | null;
  timezone_id: number;
  currency_id: number;
  country_id: number;
  email_notification_status: number;
  allow_higher_branch_access: number;
  higher_branch_allowed_days: number;
}
export interface Gym {
  id: number;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string | null;
  password?: string;
}
export interface Package {
  id: number;
  name: string;
  price: number;
  duration: "monthly" | "yearly" | "lifetime" | string;
  branch_limit: number;
  user_limit: number;
  member_limit: number;
  employee_limit: number;
  is_app_avail: number | boolean;
  status: "active" | "inactive";
  created_by: number;
}
export interface CashBook {
  id: number;
  payment_method: string;
  debit_amount: number;
  credit_amount: number;
  date: string;
  time: string;
  description: string;
  transaction_type: string;
  source: string;
  reference_num: string;
  expense_id: number | null;
  income_id: number | null;
  fee_collection_id: number | null;
  created_by: number;
  branch_id: number;
  running_balance: number;
}

interface PlanState {
  notifications: Notification[];
  shifts: {
    data: Shift[];
    meta: PaginationMeta;
  };
  employeeAttendances: {
    data: Attendance[];
    meta: PaginationMeta;
  };
  packages: {
    data: Package[];
    meta: PaginationMeta;
  };
  gym: {
    data: Gym[];
    meta: PaginationMeta;
  }
  subscriptionDetails: any;
  invoice: {
    data: any;
    meta: PaginationMeta;
  }
  sendPackageMail: any;
  emailVerification: any;
  systemDashboard: any; 
  memberAttendances: {
    data: Attendance[];
    meta: PaginationMeta;
  };
  payrolls: {
    data: Payroll[];
    meta: PaginationMeta;
    summary: {
      avg_payroll: number,
      total_employees_paid: number,
      total_payroll: number
    }
  }
  cashBooks: {
    data: CashBook[];
    meta: PaginationMeta,
    opening_balance: number,
    closing_balance: number,
    system_currency: string;
  }
  bankBooks: {
    data: CashBook[];
    meta: PaginationMeta,
    opening_balance: number,
    closing_balance: number,
    system_currency: string;
  }
  loggedBranch: {
    id: number;
    name: string
  }
  dashboardData: any;
  selectedBranchId: string;
  systemSettings: CompanySettings;
  paramsForThunk: Record<string, any>;
  loadings: Record<string, boolean>;
  errors: Record<string, boolean>;
  errorMessages: Record<string, string>;
  errorCodes: Record<string, number>;
}

const initialState: PlanState = {
  selectedBranchId: localStorage.getItem("selectedBranchId") || "all",
  systemSettings: {
    id: 0,
    company_name: "",
    company_email: "",
    company_phone: "",
    company_address: "",
    timezone_id: 0,
    currency_id: 0,
    country_id: 0,
    email_notification_status: 0,
    allow_higher_branch_access: 0,
    higher_branch_allowed_days: 0
  },
  notifications: [],
  packages: {
    data: [],
    meta: {
      current_page: 1,
      per_page: 10,
      total: 0,
    },
  },
  gym: {
    data: [],
    meta: {
      current_page: 1,
      per_page: 10,
      total: 0,
    },
  },
  invoice: {
    data: [],
    meta: {
      current_page: 1,
      per_page: 10,
      total: 0,
    },
  },
  systemDashboard: {},
  emailVerification: {},
  sendPackageMail: {},
  shifts: {
    data: [],
    meta: {
      current_page: 1,
      per_page: 10,
      total: 0,
    },
  },
  payrolls: {
    data: [],
    meta: {
      current_page: 1,
      per_page: 10,
      total: 0,
    },
    summary: {
      avg_payroll: 0,
      total_employees_paid: 0,
      total_payroll: 0
    }
  },
  employeeAttendances: {
    data: [],
    meta: {
      current_page: 1,
      per_page: 10,
      total: 0,
    },
  },
  memberAttendances: {
    data: [],
    meta: {
      current_page: 1,
      per_page: 10,
      total: 0,
    },
  },
  cashBooks: {
    data: [],
    meta: {
      current_page: 1,
      per_page: 10,
      total: 0
    },
    opening_balance: 0,
    closing_balance: 0,
    system_currency: ""
  },
  bankBooks: {
    data: [],
    meta: {
      current_page: 1,
      per_page: 10,
      total: 0
    },
    opening_balance: 0,
    closing_balance: 0,
    system_currency: ""
  },
  dashboardData: {},
  paramsForThunk: {},
  loggedBranch: {
    id: 0,
    name: ""
  },
  loadings: {
    createShift: false,
    getAllShifts: false,
    updateShiftStatus: false,
    getPackages: false,
    createUpdatePackage: false,
    updatePackageStatus: false,
    deletePackage: false,
    createUpdateGym: false,
    updateInvoice: false,
    getInvoice: false,
    getInvoiceView: false,
    getGym: false,
    getSubscriptionDetails: false,
    updateGymStatus: false,
    getSystemDashboard: false,
    emailVerification: false,
    sendPackageMail: false,
  },
  errors: {},
  errorMessages: {},
  errorCodes: {},
};

// ==================== THUNKS ====================

export const createShiftAsyncThunk = createAsyncThunk(
  "general/createShifts",
  catchAsync(async ({ data }: { data: FormData }) => {
    const response = await ApiRequests.createShifts(data);
    // toast({ title: data.get("id") ? "Plan updated" : "Plan created" });
    return response?.data?.data as Shift;
  })
)

export const getAllShiftsAsyncThunk = createAsyncThunk(
  "general/getAllShifts",
  catchAsync(async ({ params }) => {
    console.log("it come here");
    const response = await ApiRequests.getAllShifts(params);
    return response?.data?.data;
  })
)
export const updateShiftStatusAsyncThunk = createAsyncThunk(
  "general/updateShiftStatus",
  catchAsync(async (data) => {
    const response = await ApiRequests.updateShiftStatus(data);
    return response?.data?.data;
  })
);
export const generatePayrollAsyncThunk = createAsyncThunk(
  "general/generatePayroll",
  catchAsync(async (data) => {
    const response = await ApiRequests.generatePayroll(data);
    return response?.data?.data as any;
  })
);
export const getPayrollAsyncThunk = createAsyncThunk(
  "general/getPayroll",
  catchAsync(async (params) => {
    const response = await ApiRequests.getPayroll(params);
    return response?.data?.data as any;
  })
);
export const editPayrollAsyncThunk = createAsyncThunk(
  "general/editPayroll",
  catchAsync(async (data) => {
    const response = await ApiRequests.editPayroll(data);
    return response?.data?.data as any;
  })
);
export const payPayrollAsyncThunk = createAsyncThunk(
  "general/payPayroll",
  catchAsync(async ({ data }) => {
    const response = await ApiRequests.payPayroll(data);
    return response?.data?.data as any;
  })
);
export const getEmployeesAttendanceAsyncThunk = createAsyncThunk(
  "general/employeeAttendance",
  catchAsync(async (params) => {
    const response = await ApiRequests.getAttendence(params);
    return response?.data?.data as any;
  })
);
export const getMembersAttendanceAsyncThunk = createAsyncThunk(
  "general/memberAttendance",
  catchAsync(async (params) => {
    const response = await ApiRequests.getAttendence(params);
    return response?.data?.data as any;
  })
);
export const getDashboardDataAsyncThunk = createAsyncThunk(
  "general/getDashboardData",
  catchAsync(async (params) => {
    const response = await ApiRequests.getDashboardData(params);
    return response?.data?.data as any;
  })
);
export const getAllNotificationsAsyncThunk = createAsyncThunk(
  "general/getAllNotifications",
  catchAsync(async (params) => {
    const response = await ApiRequests.getAllNotifications(params);
    return response?.data?.data as any;
  })
)
export const markNotificationAsReadAsyncThunk = createAsyncThunk(
  "general/markNotificationAsRead",
  catchAsync(async (data) => {
    const response = await ApiRequests.markNotificationAsRead(data);
    return response?.data?.data as any;
  })
);
export const markAllNotificationAsReadAsyncThunk = createAsyncThunk(
  "general/markAllNotificationAsRead",
  catchAsync(async () => {
    const response = await ApiRequests.markAllNotificationAsRead();
    return response?.data?.data as any;
  })
);
export const getSystemSettingsAsyncThunk = createAsyncThunk(
  "general/getSystemSettings",
  catchAsync(async () => {
    const response = await ApiRequests.getSystemSettings();
    return response?.data?.data as any;
  })
);
export const updateSystemSettingsAsyncThunk = createAsyncThunk(
  "general/updateSystemSettings",
  catchAsync(async (data) => {
    const response = await ApiRequests.updateSystemSettings(data);
    return response?.data?.data as any;
  })
);
export const getCashBookCollectionAsyncThunk = createAsyncThunk(
  "general/getCashBookCollection",
  catchAsync(async (params) => {
    const response = await ApiRequests.getCashBookCollection(params);
    return response?.data?.data as any;
  })
);
export const getBankBookCollectionAsyncThunk = createAsyncThunk(
  "general/getBankBookCollection",
  catchAsync(async (params) => {
    const response = await ApiRequests.getBankBookCollection(params);
    return response?.data?.data as any;
  })
);
export const loggedBranchAsyncThunk = createAsyncThunk(
  "general/loggedBranch",
  catchAsync(async () => {
    const response = await ApiRequests.getLoggedBranch();
    return response?.data?.data as any;
  })
);

export const createUpdatePackageAsyncThunk = createAsyncThunk(
  "package/createUpdatePackage",
  catchAsync(async ({ data }: { data: FormData }) => {
    const response = await ApiRequests.createUpdatePackage(data);
    return response?.data?.data as any;
  })
);
export const getPackagesAsyncThunk = createAsyncThunk(
  "package/getPackages",
  catchAsync(async (params) => {
    const response = await ApiRequests.getPackages(params);
    return response?.data?.data as any;
  })
);
export const updatePackageStatusAsyncThunk = createAsyncThunk(
  "package/updatePackageStatus",
  catchAsync(async (data) => {
    const response = await ApiRequests.updatePackageStatus(data);
    return response?.data?.data as any;
  })
);
export const deletePackageAsyncThunk = createAsyncThunk(
  "package/deletePackage",
  catchAsync(async (data) => {
    const response = await ApiRequests.deletePackage(data);
    return response?.data?.data as any;
  })
);
export const createUpdateGymAsyncThunk = createAsyncThunk(
  "gym/createUpdateGym",
  catchAsync(async ({ data }: { data: FormData }) => {
    const response = await ApiRequests.createUpdateGym(data);
    return response?.data?.data as any;
  })
);
export const getGymAsyncThunk = createAsyncThunk(
  "gym/getGym",
  catchAsync(async (params) => {
    const response = await ApiRequests.getGyms(params);
    return response?.data?.data as any;
  })
);
export const assignGymPackageAsyncThunk = createAsyncThunk(
  "gym/assignGymPackage",
  catchAsync(async (data) => {
    const response = await ApiRequests.assignGymPackage(data);
    return response?.data?.data as any;
  })
);
export const getSubscriptionDetailsAsyncThunk = createAsyncThunk(
  "gym/getSubscriptionDetails",
  catchAsync(async ({ gym_id }: { gym_id: number | string }) => {
    const response = await ApiRequests.getSubscriptionDetails({ gym_id });
    return response?.data?.data;
  })
);
export const updateGymStatusAsyncThunk = createAsyncThunk(
  "gym/updateGymStatus",
  catchAsync(async (params) => {
    const response = await ApiRequests.updateGymStatus(params);
    return response?.data?.data as any;
  })
);
export const updateInvoiceAsyncThunk = createAsyncThunk(
  "invoice/updateInvoice",
  catchAsync(async ({ data }: { data: FormData }) => {
    const response = await ApiRequests.updateInvoice(data);
    return response?.data?.data as any;
  })
);
export const getInvoiceAsyncThunk = createAsyncThunk(
  "invoice/getInvoice",
  catchAsync(async (params) => {
    const response = await ApiRequests.getInvoice(params);
    return response?.data?.data as any;
  })
);
export const getInvoiceViewAsyncThunk = createAsyncThunk(
  "invoice/getInvoiceView",
  catchAsync(async ({invoice_id}: {invoice_id: number}) => {
    const response = await ApiRequests.getInvoiceView({invoice_id});
    return response?.data?.data as any;
  })
);
export const getSystemDashboardAsyncThunk = createAsyncThunk(
  "dashboard/getSystemDashboard",
  catchAsync(async (params) => {
    const response =  await ApiRequests.getSystemDashboard(params);
    return response?.data?.data as any;
  })
)
export const sendPackageMailAsyncThunk = createAsyncThunk (
  "gym/sendPackageMail",
  catchAsync(async({data}: {data: FormData}) => {
    const response = await ApiRequests.sendPackageMail(data);
    return response?.data as any
  })
)
export const emailVerificationAsyncThunk = createAsyncThunk(
  "gym/emailVerification",
  catchAsync(async (params) => {
    const response =  await ApiRequests.emailVerification(params);
    console.log('response email', response)
    return response?.data as any;
  })
)



// ==================== SLICE ====================

const generalSlice = createSlice({
  name: "general",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loadings[action.payload.key] = action.payload.value;
    },
    setBranchId: (state, action) => {
      console.log("action.payload", action.payload)
      state.selectedBranchId = action.payload
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload)
    }
    // clearSelectedUser: (state) => {
    //   state.selectedUser = null;
    // },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllShiftsAsyncThunk.fulfilled, (state, action) => {
        state.shifts = action.payload as any;
      })
      .addCase(createShiftAsyncThunk.fulfilled, (state, action: any) => {
        const index = state.shifts.data.findIndex((item: any) => item.id === action.payload.id);
        if (index !== -1) {
          state.shifts.data[index] = action.payload;
        } else {
          state.shifts.data.unshift(action.payload);
        }
      })
      .addCase(updateShiftStatusAsyncThunk.pending, (state, action: any) => {
        state.loadings.updateShiftStatus = false;
      })
      .addCase(updateShiftStatusAsyncThunk.fulfilled, (state, action: any) => {
        console.log("action.payload in updateShiftStatusAsyncThunk", action.payload);
        const index = state.shifts.data.findIndex((item: any) => item.id === action.payload.id);
        state.loadings.updateShiftStatus = true;
        if (index !== -1) {
          state.shifts.data[index] = action.payload;
        } else {
          state.shifts.data.unshift(action.payload);
        }
      })
      .addCase(updateShiftStatusAsyncThunk.rejected, (state, action: any) => {
        state.loadings.updateShiftStatus = false;
      })
      .addCase(getPayrollAsyncThunk.fulfilled, (state, action: any) => {
        state.payrolls = {
          data: action.payload.data,
          meta: {
            total: action.payload.total as any,
            per_page: action.payload.per_page as any,
            current_page: action.payload.current_page as any
          },
          summary: action.payload.summary
        }
      })
      .addCase(editPayrollAsyncThunk.fulfilled, (state, action: any) => {
        const index = state.payrolls.data.findIndex((item: any) => item.id === action.payload.id);
        if (index != -1) {
          state.payrolls.data[index] = action.payload
        }
      })
      .addCase(payPayrollAsyncThunk.fulfilled, (state, action: any) => {
        //  const index = state.payrolls.data.findIndex((item: any) => item.id === action.payload.id);
        //  if(index!= -1){
        //   state.payrolls.data[index] = action.payload
        //  }
      })
      .addCase(getEmployeesAttendanceAsyncThunk.fulfilled, (state, action: any) => {
        state.employeeAttendances = {
          data: action.payload.data,
          meta: {
            total: action.payload.total as any,
            per_page: action.payload.per_page as any,
            current_page: action.payload.current_page as any
          }
        }
      })
      .addCase(getMembersAttendanceAsyncThunk.fulfilled, (state, action: any) => {
        state.memberAttendances = {
          data: action.payload.data,
          meta: {
            total: action.payload.total as any,
            per_page: action.payload.per_page as any,
            current_page: action.payload.current_page as any
          }
        }
      }).
      addCase(getDashboardDataAsyncThunk.fulfilled, (state, action: any) => {
        state.dashboardData = action.payload
      })
      .addCase(getAllNotificationsAsyncThunk.fulfilled, (state, action: any) => {
        state.notifications = action.payload
      })
      .addCase(markNotificationAsReadAsyncThunk.fulfilled, (state, action: any) => {
        state.notifications = state.notifications.map((item: any) => {
          if (item.id == action.meta.arg.notification_id) {
            item.is_read = 1
          }
          return item
        })
      })
      .addCase(markAllNotificationAsReadAsyncThunk.fulfilled, (state, action: any) => {
        state.notifications = state.notifications.map((item: any) => {
          item.is_read = 1
          return item
        })
      })
      .addCase(getSystemSettingsAsyncThunk.fulfilled, (state, action: any) => {
        state.systemSettings = action.payload
      })
      .addCase(updateSystemSettingsAsyncThunk.fulfilled, (state, action: any) => {
        state.systemSettings = action.payload
      })
      .addCase(getCashBookCollectionAsyncThunk.fulfilled, (state, action: any) => {
        state.cashBooks = {
          data: action.payload.cash_transactions.data,
          meta: {
            total: action.payload.cash_transactions.total as any,
            per_page: action.payload.cash_transactions.per_page as any,
            current_page: action.payload.cash_transactions.current_page as any
          },
          opening_balance: action.payload.opening_balance,
          closing_balance: action.payload.closing_balance,
          system_currency: action.payload.system_currency
        }
      })
      .addCase(getBankBookCollectionAsyncThunk.fulfilled, (state, action: any) => {
        state.bankBooks = {
          data: action.payload.bank_transactions.data,
          meta: {
            total: action.payload.bank_transactions.total as any,
            per_page: action.payload.bank_transactions.per_page as any,
            current_page: action.payload.bank_transactions.current_page as any
          },
          opening_balance: action.payload.opening_balance,
          closing_balance: action.payload.closing_balance,
          system_currency: action.payload.system_currency
        }
      })
      .addCase(loggedBranchAsyncThunk.fulfilled, (state, action: any) => {
        state.loggedBranch = action.payload
      })
      .addCase(getPackagesAsyncThunk.pending, (state) => {
        state.loadings.getPackages = true;
      })
      .addCase(getPackagesAsyncThunk.fulfilled, (state, action) => {
        state.loadings.getPackages = false;
        state.packages = {
          data: action.payload.data || [],
          meta: {
            current_page: action.payload.current_page || 1,
            per_page: action.payload.per_page || 10,
            total: action.payload.total || 0,
          },
        };
      })
      .addCase(getPackagesAsyncThunk.rejected, (state) => {
        state.loadings.getPackages = false;
      })

      .addCase(createUpdatePackageAsyncThunk.pending, (state) => {
        state.loadings.createUpdatePackage = true;
      })
      .addCase(createUpdatePackageAsyncThunk.fulfilled, (state, action) => {
        state.loadings.createUpdatePackage = false;
        // state.packages.data.unshift(action.payload);
        // state.packages.meta.total += 1;
      })
      .addCase(createUpdatePackageAsyncThunk.rejected, (state) => {
        state.loadings.createUpdatePackage = false;
      })
      .addCase(updatePackageStatusAsyncThunk.fulfilled, (state, action: any) => {
        const index = state.packages.data.findIndex((item: any) => item.id === action.payload.id);
        if (index !== -1) {
          state.packages.data[index] = action.payload;
        }
      })
      .addCase(updatePackageStatusAsyncThunk.pending, (state, action: any) => {
        state.loadings.updatePackageStatus = false;
      })
      .addCase(updatePackageStatusAsyncThunk.rejected, (state, action) => {
        state.loadings.updatePackageStatus = false;
      })
      .addCase(deletePackageAsyncThunk.fulfilled, (state, action: any) => {
        state.packages.data = state.packages.data.filter((item: any) => item.id !== action.meta.arg.id);
        state.packages.meta.total -= 1;
      })
      .addCase(deletePackageAsyncThunk.pending, (state, action: any) => {
        state.loadings.deletePackage = false;
      })
      .addCase(deletePackageAsyncThunk.rejected, (state, action) => {
        state.loadings.deletePackage = false;
      })
      .addCase(createUpdateGymAsyncThunk.pending, (state) => {
        state.loadings.createUpdateGym = true;
      })
      .addCase(createUpdateGymAsyncThunk.fulfilled, (state, action) => {
        state.loadings.createUpdateGym = false;
        state.packages.data.unshift(action.payload);
        state.packages.meta.total += 1;
      })
      .addCase(createUpdateGymAsyncThunk.rejected, (state) => {
        state.loadings.createUpdateGym = false;
      })
      .addCase(getGymAsyncThunk.pending, (state) => {
        state.loadings.getGym = true;
      })
      .addCase(getGymAsyncThunk.fulfilled, (state, action) => {
        state.loadings.getGym = false;
        state.gym = action.payload;
      })
      .addCase(getGymAsyncThunk.rejected, (state) => {
        state.loadings.getGym = false;
      })
      .addCase(assignGymPackageAsyncThunk.fulfilled, (state, action) => {
        state.gym = action.payload;
      })
      .addCase(getSubscriptionDetailsAsyncThunk.pending, (state) => {
        state.loadings.getSubscriptionDetails = true;
      })
      .addCase(getSubscriptionDetailsAsyncThunk.fulfilled, (state, action) => {
        state.subscriptionDetails = action.payload;
        state.loadings.getSubscriptionDetails = false;
      })
      .addCase(getSubscriptionDetailsAsyncThunk.rejected, (state) => {
        state.loadings.getSubscriptionDetails = false;
      })
      .addCase(updateGymStatusAsyncThunk.pending, (state, action: any) => {
        state.loadings.updateGymStatus = false;
      })
      .addCase(updateGymStatusAsyncThunk.fulfilled, (state, action: any) => {
        state.gym = action.payload;
      })
      .addCase(updateGymStatusAsyncThunk.rejected, (state, action) => {
        state.loadings.updateGymStatus = false;
      })
      .addCase(updateInvoiceAsyncThunk.pending, (state) => {
        state.loadings.updateInvoice = true;
      })
      .addCase(updateInvoiceAsyncThunk.fulfilled, (state, action) => {
        state.loadings.updateInvoice = false;
        const index = state.invoice.data.findIndex((item: any) => item.id === action.payload.id);
        if (index !== -1) {
          state.invoice.data[index] = action.payload;
        }
      })
      .addCase(updateInvoiceAsyncThunk.rejected, (state) => {
        state.loadings.updateInvoice = false;
      })
      .addCase(getInvoiceAsyncThunk.pending, (state) => {
        state.loadings.getInvoice = true;
      })
      .addCase(getInvoiceAsyncThunk.fulfilled, (state, action) => {
        state.loadings.getInvoice = false;
        state.invoice = action.payload;
      })
      .addCase(getInvoiceAsyncThunk.rejected, (state) => {
        state.loadings.getInvoice = false;
      })
      .addCase(getSystemDashboardAsyncThunk.pending, (state) => {
        state.loadings.getSystemDashboard = true;
      })
      .addCase(getSystemDashboardAsyncThunk.fulfilled, (state, action) => {
        state.loadings.getSystemDashboard = false;
        state.systemDashboard = action.payload;
      })
      .addCase(getSystemDashboardAsyncThunk.rejected, (state) => {
        state.loadings.getSystemDashboard = false;
      })
      .addCase(emailVerificationAsyncThunk.fulfilled, (state, action) => {
  console.log('FULFILLED emailVerification payload:', action.payload);
  state.loadings.emailVerification = false;
  state.emailVerification = action.payload;
})
      .addCase(emailVerificationAsyncThunk.pending, (state) => {
        state.loadings.emailVerification = true;
      })
      .addCase(emailVerificationAsyncThunk.rejected, (state) => {
        state.loadings.emailVerification = false;
      })
      .addCase(sendPackageMailAsyncThunk.fulfilled, (state, action) => {
        state.loadings.sendPackageMail = false;
        state.emailVerification = action.payload;
      })
      .addCase(sendPackageMailAsyncThunk.pending, (state) => {
        state.loadings.sendPackageMail = true
      })
      .addCase(sendPackageMailAsyncThunk.rejected, (state) => {
        state.loadings.sendPackageMail = false
      })

      // Global loading/error handler
      .addMatcher(
        isAnyOf(
          ...reduxToolKitCaseBuilder([
            getAllShiftsAsyncThunk,
            createShiftAsyncThunk,
            updateShiftStatusAsyncThunk,
            generatePayrollAsyncThunk,
            getPayrollAsyncThunk,
            editPayrollAsyncThunk,
            getEmployeesAttendanceAsyncThunk,
            getMembersAttendanceAsyncThunk,
            getBankBookCollectionAsyncThunk,
            getCashBookCollectionAsyncThunk,
            getPackagesAsyncThunk,
            createUpdatePackageAsyncThunk,
            updatePackageStatusAsyncThunk,
            deletePackageAsyncThunk,
            createUpdateGymAsyncThunk,
            getGymAsyncThunk,
            getSubscriptionDetailsAsyncThunk,
            updateGymStatusAsyncThunk,
            updateInvoiceAsyncThunk,
            getInvoiceAsyncThunk,
            getSystemDashboardAsyncThunk,
            emailVerificationAsyncThunk,
            sendPackageMailAsyncThunk,
          ])
        ),
        handleLoadingErrorParamsForAsycThunk
      );
  },
});
export const { setBranchId, addNotification } = generalSlice.actions;
export default generalSlice.reducer;