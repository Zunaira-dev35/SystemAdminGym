import { getIn } from "formik";
import { APIurls } from "../constants.ts";
import apiService from "./index";
export const ApiRequests = {
  getCurrentUser: (params: any) => apiService.get(APIurls.getCurrentUser),
  login: (data: any) => apiService.post(APIurls.login, data),

  getAllPlans: (params: any) => apiService.get(APIurls.getAllPlans, { params }),
  createPlan: (data: any) => apiService.post(APIurls.createPlan, data),
  deletePlan: (data: any) => apiService.delete(APIurls.deletePlan, data),
  togglePlanStatus: (data: any) => apiService.post(APIurls.togglePlanStatus, data),
  getPlanTransfers: (params: any) => apiService.get(APIurls.getPlanTransfers, { params }),
  getAvailablePlans: (params: any) => apiService.get(APIurls.getAvailablePlans, { params }),
  createPlanTransfers: (data: any) => apiService.post(APIurls.createPlanTransfers, data),

  getAllBanks: (params: any) => apiService.get(APIurls.getAllBanks, { params }),
  createBank: (data: any) => apiService.post(APIurls.createBank, data),

  getAllMembers: (params: any) => apiService.get(APIurls.getAllMembers, { params }),
  refrenceMember: (params: any) => apiService.get(APIurls.refrenceMember, { params }),
  createOrUpdateMember: (data: any) =>
    apiService.post(APIurls.createOrUpdateMember, data),
  unfreezMember: (data: any) =>
    apiService.post(APIurls.unfreezMember, data),

  memberDetail: (params: any) => apiService.get(APIurls.memberDetail, { params }),
  memberFee: (params: any) => apiService.get(APIurls.memberFee, { params }),
  memberFreeze: (params: any) => apiService.get(APIurls.memberFreeze, { params }),
  memberAttendance: (params: any) => apiService.get(APIurls.memberAttendance, { params }),
  memberPlanTransfer: (params: any) => apiService.get(APIurls.memberPlanTransfer, { params }),
  memberStats: (params: any) => apiService.get(APIurls.memberStats, { params }),
  deleteMember: (data: any) => apiService.post(APIurls.deleteMember, data),
  deleteFeeCollection: (data: any) => apiService.post(APIurls.deleteFeeCollection, data),
  updateFeeCollection: (data: any) => apiService.post(APIurls.updateFeeCollection, data),

  getAllEmployees: (params: any) =>
    apiService.get(APIurls.getAllEmployees, { params }),
  refrenceEmployee: (params: any) =>
    apiService.get(APIurls.refrenceEmployee, { params }),
  createOrUpdateEmployee: (data: any) =>
    apiService.post(APIurls.createOrUpdateEmployee, data),
  updateUserStatus: (data: any) => apiService.post(APIurls.userUpadteStatus, data),

  getAllBranch: (params: any) => apiService.get(APIurls.getAllBranch, { params }),
  getAllBranchs: (params: any) => apiService.get(APIurls.getAllBranchs, { params }),
  getCurrentBranch: (params: any) => apiService.get(APIurls.getCurrentBranch, { params }),
  createOrUpdateBranch: (data: any) => apiService.post(APIurls.createOrUpdateBranch, data),
  deleteBranch: (data: any) => apiService.post(APIurls.deleteBranch, data),
  toggleBranchStatus: (data: any) => apiService.post(APIurls.toggleBranchStatus, data),
  getGroupPermissionById: (id: any) => apiService.get(APIurls.getGroupPermissionById + "/" + id),

  
 getGroupPermissions : (params: any) => apiService.get(APIurls.getGroupPermissions, { params }),
  createGroupPermissions : (data: any) => apiService.post(APIurls.createGroupPermission, data),
  deleteGroupPermissions : (params: any) => apiService.delete(APIurls.deleteGroupPermission, { params }),
  getDefaultPermissions : (params: any) => apiService.get(APIurls.getDefaultPermissions, { params }),
 getRoles : (params: any) => apiService.get(APIurls.getRoles, { params }),
  createRole: (data: any) => apiService.post(APIurls.createRole, data),
  deleteRole: (params: any) => apiService.delete(APIurls.deleteRole, { params }),

  getFreezeRequest : (params: any) => apiService.get(APIurls.getFreezeRequest, { params }),
  createFreezeRequest: (data: any) => apiService.post(APIurls.createFreezeRequest, data),
  updateFreezeRequest: (data: any) => apiService.post(APIurls.updateFreezeRequest, data),
  createFreeze: (data: any) => apiService.post(APIurls.createFreeze, data),

  // checkImage: (data: any) => apiService.post(APIurls.checkImage, data),

  getUsers: (params: any) => apiService.get(APIurls.getUsers, { params }),
  createOrUpdateUser: (data: any) => apiService.post(APIurls.createOrUpdateUser, data),
  updateUser: (data: any) => apiService.post(APIurls.updateUser, data),
  verifyUserFace: (data: any) => apiService.post(APIurls.verifyUserFace, data),
  verifyUserFingerprint: (data: any) => apiService.post(APIurls.verifyUserFingerprint, data),

  getFeeCollection: (params: any) => apiService.get(APIurls.getFeeCollection, { params }),
  createFeeCollection: (data: any) => apiService.post(APIurls.createFeeCollection, data),
  createAttendence: (data: any) => apiService.post(APIurls.createAttendence, data),
  getAttendence: (params: any) => apiService.get(APIurls.getAttendence, { params }),
  updateAttendence: (data: any) => apiService.post(APIurls.updateAttendence, data),
  deleteAttendence: (data: any) => apiService.delete(APIurls.deleteAttendence, {params: data}),
  getFeeId: (params: any) => apiService.get(APIurls.getFeeId, { params }),

  getAdvanceFeeCollections: (params: any) => apiService.get(APIurls.getAdvanceFeeCollections, { params }),
  storeAdvanceFeeCollection: (data: any) => apiService.post(APIurls.storeAdvanceFeeCollection, data),
  payAdvanceFeeCollection: (data: any) => apiService.post(APIurls.payAdvanceFeeCollection, data),
  cancelAdvanceFeePayment: (data: any) => apiService.post(APIurls.cancelAdvanceFeePayment, data),

  getRefundCollection: (params: any) => apiService.get(APIurls.getRefundCollection, { params }),
  createRefundCollection: (data: any) => apiService.post(APIurls.createRefundCollection, data),

  getAllMembershipTransfers: (params: any) => apiService.get(APIurls.getAllMembershipTransfers, { params }),
  createMembershipTransfer: (data: any) => apiService.post(APIurls.createMembershipTransfer, data),

  getBanks: (params: any) => apiService.get(APIurls.getAllBanks, { params }),
  createBanks: (data: any) => apiService.post(APIurls.createBank, data),

  getSystemLogs: (params: any) => apiService.get(APIurls.getSystemLogs, { params}),

  getLeave: (params: any) => apiService.get(APIurls.getLeave, { params }),
  createLeave: (data: any) => apiService.post(APIurls.createLeave, data),
  processLeave: (data: any) => apiService.post(APIurls.processLeave, data),


  getHoliday: (params: any) => apiService.get(APIurls.getHoliday, { params }),
  createHoliday: (data: any) => apiService.post(APIurls.createHoliday, data),
  deleteHoliday: (id: number) => apiService.delete(APIurls.deleteHoliday, { data: { holiday_id: id } }),

  getExpenseCategory: (params: any) => apiService.get(APIurls.getExpenseCategory, { params }),
  createOrUpdateExpenseCategory: (data: any) => apiService.post(APIurls.createOrUpdateExpenseCategory, data),
  deleteExpenseCategory: (id: number) => apiService.delete(APIurls.deleteExpenseCategory, {data: {category_id: id}}),


  getExpense: (params: any) => apiService.get(APIurls.getExpense, { params }),
  createOrUpdateExpense: (data: any) => apiService.post(APIurls.createOrUpdateExpense, data),
  deleteExpense: (id: number) => apiService.delete(APIurls.deleteExpense, {data: {expense_id: id}}),

  getIncomeCategory: (params: any) => apiService.get(APIurls.getIncomeCategory, { params }),
  createOrUpdateIncomeCategory: (data: any) => apiService.post(APIurls.createOrUpdateIncomeCategory, data),
  deleteIncomeCategory: (id: number) => apiService.delete(APIurls.deleteIncomeCategory, {data: {category_id: id}}),

  getIncomes: (params: any) => apiService.get(APIurls.getIncomes, { params }),
  createOrUpdateIncome: (data: any) => apiService.post(APIurls.createOrUpdateIncome, data),
  deleteIncome: (id: number) => apiService.delete(APIurls.deleteIncome, {data: {income_id: id}}),

    getPaymentVoucher: (params: any) => apiService.get(APIurls.getPaymentVoucher, { params }),
  
  generatePayroll: (data:any) => apiService.post(APIurls.generatePayroll, data),
  getPayroll: (params:any) => apiService.get(APIurls.getPayroll, {params}),
  editPayroll: (data:any) => apiService.post(APIurls.editPayroll, data),
  getDashboardData: (params:any) => apiService.get(APIurls.getDashboardData, {params}),
markAttendenceCheckout: (data: any) => apiService.post(APIurls.markAttendenceCheckout, data),
payPayroll: (data: any) => apiService.post(APIurls.payPayroll, data),

  getShifts: (params: any) => apiService.get(APIurls.getShifts, { params }),
  createShifts: (data: any) => apiService.post(APIurls.createShifts, data),
  getAllShifts: (params: any) => apiService.get(APIurls.getAllShifts, { params }),
  updateShiftStatus: (data: any) => apiService.post(APIurls.updateShiftStatus, data),

  auth: (data: any) => apiService.post(APIurls.auth, data),
  hello: () => apiService.get(APIurls.hello),
  registerDriver: (data: any) => apiService.post(APIurls.registerDriver, data),
  updateDriver: (data: any) => apiService.post(APIurls.updateDriver, data),
  forgotPassword: (data: any) => apiService.post(APIurls.forgotPassword, data),
  resetPassword: (data: any) => apiService.post(APIurls.resetPassword, data),
  getDriver: (params: any) => apiService.get(APIurls.getDriver, { params }),
  getCustomer: (params: any) => apiService.get(APIurls.getCustomer, { params }),
  getCustomerDriverStats: (params: any) =>
    apiService.get(APIurls.getCustomerDriverStats, { params }),
  toggleDriverStatus: (data: any) =>
    apiService.post(APIurls.toggleDriverStatus, data),
  getUserProfileDetails: (params: any) =>
    apiService.get(`${APIurls.getUserProfileDetails}`, { params }),
  getFleetCategory: (params: any) =>
    apiService.get(APIurls.getFleetCategory, { params }),
  getAllFleet: (params: any) => apiService.get(APIurls.getAllFleet, { params }),
  registerFleetCategory: (data: any) =>
    apiService.post(APIurls.registerFleetCategory, data),
  registerFleet: (data: any) => apiService.post(APIurls.registerFleet, data),
  markNotificationAsRead: (data: any) => apiService.post(APIurls.markNotificationAsRead, data),
  markAllNotificationAsRead: () => apiService.post(APIurls.markAllNotificationAsRead),
  getAllNotifications: (params: any) => apiService.get(APIurls.getAllNotifications, { params }),
  getSystemSettings: () => apiService.get(APIurls.getSystemSettings),
  updateSystemSettings: (data: any) => apiService.post(APIurls.updateSystemSettings, data),
  getCashBookCollection: (params: any) => apiService.get(APIurls.getCashBookCollection, { params }),
  getBankBookCollection: (params: any) => apiService.get(APIurls.getBankBookCollection, { params }),
  getLoggedBranch: () => apiService.get(APIurls.getLoggedBranch),

  searchMembers: (data: any) => apiService.post(APIurls.searchMembers, data ),

  createUpdatePackage: (data: any) => apiService.post(APIurls.createUpdatePackage, data ),
  getPackages: (params: any) => apiService.get(APIurls.getPackages, { params }),
  updatePackageStatus: (data: any) => apiService.post(APIurls.updatePackageStatus, data ),
  deletePackage: (data: any) => apiService.post(APIurls.deletePackage, data ),
  createUpdateGym: (data: any) => apiService.post(APIurls.createUpdateGym, data ),
  getGyms: (params: any) => apiService.get(APIurls.getGyms, { params }),
  updateGymStatus: (params: any) => apiService.post(APIurls.updateGymStatus, params ),
  assignGymPackage: (data: any) => apiService.post(APIurls.assignGymPackage, data ),
  getSubscriptionDetails: (params: any) => apiService.get(APIurls.getSubscriptionDetails, { params }),
  updateInvoice: (data: any) => apiService.post(APIurls.updateInvoice, data ),
  getInvoice: (params: any) => apiService.get(APIurls.getInvoice, { params }),
  getInvoiceView: (params: any) => apiService.get(APIurls.getInvoiceView, { params }),
  getSystemDashboard: (params: any) => apiService.get(APIurls.getSystemDashboard, { params }),
  sendPackageMail: (data: any) => apiService.post(APIurls.sendPackageMail, data),
  emailVerification: (params: any) => apiService.get(APIurls.emailVerification, {params} ),



};