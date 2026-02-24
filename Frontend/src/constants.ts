import { get } from "lodash";
import { updateSystemSettingsAsyncThunk } from "./redux/pagesSlices/generalSlice";

const localhost = (import.meta as any).env.VITE_NODE_ENV === "localhost";
const development = (import.meta as any).env.VITE_NODE_ENV === "development";
export const app_mode = localhost
  ? "localhost"
  : development
  ? "development"
  : "production";

export const apiBasePath =
  (import.meta as any).env.REACT_APP_API_URL ??
  (localhost
    ? "http://localhost:8081/api/"
    : development
    ? "http://192.168.18.66:8081/api/"
    // : "https://gym.snowberrysys.com/api/"); // "https://testgym.snowberrysys.com/api/"
    : "https://gym-saas.snowberrysys.com/api/"); // 
        // : "https://burkhalter.snowdreamstudios.ch/api/"); 

export const backendBasePath =
  (import.meta as any).env.REACT_APP_API_URL ??
  (localhost
    ? "http://localhost:8081"
    : development
    ? "http://192.168.18.66:8081"
    // : "https://gym.snowberrysys.com"); //"http://testgym.snowberrysys.com"
    : "https://gym-saas.b-cdn.net/"); //"https://gym.snowberrysys.com"
      //  : "https://burkhalter.snowdreamstudios.ch/"); 

export const APIurls = {
  // auth
  getCurrentUser: "user/current",
  login: "login",
  // _____PLANS_____
  getAllPlans: "plan/all",
  createPlan: "plan/store",
  deletePlan: "plan/delete",
  togglePlanStatus: "plan/update-status",
  getPlanTransfers:"plan/transfer/all",
  getAvailablePlans:"plan/transfer/available/plans",
  createPlanTransfers: "plan/transfer/store",

  getAllBanks: "finance/bank/all",
  createBank: "finance/bank/store",

  // _____MEMBERS_____
  getAllMembers: "member/all",
  createOrUpdateMember: "member/store",
  unfreezMember: "member/unfreeze",
  refrenceMember: "member/create/reference",
  memberDetail: "member/details",
  memberFee: "member/fee-collections",
  memberFreeze: "member/member-freeze-requests",
  memberAttendance: "member/attendances",
  memberPlanTransfer: "member/plan-transfers",
  memberStats: "member/stats",
  deleteMember: "member/delete",


  // ___EMPLOYEES____
  getAllEmployees: "employee/all",
  createOrUpdateEmployee: "employee/store",
  refrenceEmployee: "employee/create/reference",
  userUpadteStatus:"user/update-status",

  // _______BRANCH____
  getAllBranch: "branch/all",
  getAllBranchs: "branch/all/fetch",
  createOrUpdateBranch: "branch/store",
  toggleBranchStatus: "branch/update-status",
  deleteBranch: "branch/delete",
  getCurrentBranch: "logged-branch",

// ___PERMISSIONS________
  getGroupPermissions: "user/permission-groups",
  createGroupPermission: "user/permission-group/store",
  deleteGroupPermission: "user/permission-group/delete",
  getDefaultPermissions: "user/permission-default",
  getGroupPermissionById: "user/permission-group/edit",
  getRoles: "user/roles",
  createRole: "user/role/store",
  deleteRole: "user/role/delete",

  getFreezeRequest: "member/freeze-requests",
  createFreezeRequest: "member/freeze-request-store",
  updateFreezeRequest: "member/freeze-request-update-status",
  createFreeze:"member/freeze",
  getFeeCollection:"fee/collection/all",
  createFeeCollection: "fee/collection/store",
  deleteFeeCollection: "fee/collection/delete",
  updateFeeCollection: "fee/collection/edit",
  checkImage:"user/check",
  getFeeId: "fee/collection/create/reference",
  createRefundCollection: "fee/collection/refund",
  getRefundCollection: "fee/collection/refund/list",

  getAdvanceFeeCollections: "fee/collection/advance/all",
  storeAdvanceFeeCollection: "fee/collection/advance/store",
  payAdvanceFeeCollection: "fee/collection/advance/apply",
  cancelAdvanceFeePayment: "fee/collection/advance/cancel",

  createMembershipTransfer: "membership/transfer",
  getAllMembershipTransfers: "membership",

  // getBanks: "bank/store",
  // createBanks: "bank/all",

  getSystemLogs: "system-logs",

  createAttendence:'attendance/store',
  getAttendence: "attendance/all",
  updateAttendence: "attendance/update",
  deleteAttendence: "attendance/delete",

  getLeave: "leave/all",
  createLeave: "leave/store",
  processLeave: "leave/process",

  getHoliday: "holiday/all",
  createHoliday: "holiday/store",
  deleteHoliday: "holiday/delete",

  createOrUpdateExpense: "finance/expense/store",
  getExpense: "finance/expense/all",
  deleteExpense: "finance/expense/delete",

  getExpenseCategory: "finance/expense/category/all",
  createOrUpdateExpenseCategory: "finance/expense/category/store",
  deleteExpenseCategory: "finance/expense/category/delete",

  getIncomeCategory: "finance/income/category/all",
  createOrUpdateIncomeCategory: "finance/income/category/store",
  deleteIncomeCategory: "finance/income/category/delete",

  getIncomes: "finance/income/all",
  createOrUpdateIncome: "finance/income/store",
  deleteIncome: "finance/income/delete",

    getPaymentVoucher: "finance/payment-vouchers",


  generatePayroll:"payroll/generate",
  getPayroll: "payroll",
  editPayroll: "payroll/edit",
  getDashboardData:"dashboard",

markAttendenceCheckout: "attendance/checkout",
  getShifts: "employee/shift/all",
  createShifts: "employee/shift/store",
  getAllShifts: "employee/shift/all",
  updateShiftStatus: "employee/shift/inactive",
  verifyUserFace: "verify-user-face",
  verifyUserFingerprint: "verify-user-fingerprint",
// getUsers: "user/all",
  auth: "admin/authAdminPanel",
  hello: "hello",
  forgotPassword: "forgotPassword",
  resetPassword: "resetPassword",
  registerDriver: "admin/registerDriver",
  getDriver: "admin/getAllDriversPassengers",
  updateDriver: "admin/updateDriver",
  getCustomer: "admin/getAllDriversPassengers",
  getCustomerDriverStats: "getDriverCustomerStats",
  toggleDriverStatus: "admin/updateDriverCustomerStatus",
  getUserProfileDetails: "getUserProfileDetails",
  getFleetCategory: "customer/fleet/categories",
  getAllFleet: "admin/getAllFleets",
  registerFleetCategory: "admin/addFleetCategory",
  registerFleet: "admin/registerFleet",
  // getAllRoles: "hr/roles",
  // addUserRole: "hr/role/users",
  getSearchAllUsers: "search/user",
  getUsers: "user/all",
  createOrUpdateUser: "user/store",
  updateUser: "update-user-profile",
  toggleUserStatus: "user/enable-disable",
  getAllNotifications: "notification/all",
  markNotificationAsRead: "notification/mark/read",
  markAllNotificationAsRead: "notification/mark/all/read",
  getSystemSettings :"system/settings",
  updateSystemSettings : "system/setting/store",
  getCashBookCollection :"finance/cash-book",
  getBankBookCollection :"finance/bank-book",
  getLoggedBranch: "logged-branch",
  payPayroll: "payroll/pay",

  searchMembers: "member/search",

  createUpdatePackage: "package/store",
  getPackages: "package/all",
  updatePackageStatus: "package/update/status",
  deletePackage: "package/delete",
  createUpdateGym: "gym/store",
  getGyms: "gym/all",
  updateGymStatus: "gym/update/status",
  assignGymPackage: "gym/assign/package",
  getSubscriptionDetails: "gym/subscription-details",
  updateInvoice: "invoice/edit",
  getInvoice: "invoice/all",
  getInvoiceView: "invoice/view",
  getSystemDashboard: "system/dashboard",
  sendPackageMail: "gym/send-package-mail",
  emailVerification: "gym/email-verification",
  
};
