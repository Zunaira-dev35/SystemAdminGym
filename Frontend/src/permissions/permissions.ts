export const PERMISSIONS = {
  // Dashboard & General
  VIEW_DASHBOARD: "View Dashboard",

  // Members Management
  MEMBER_CREATE: "Create Member",
  MEMBER_EDIT: "Edit Member",
  MEMBER_VIEW: "View Member",
  MEMBER_DELETE: "Delete Member",
  MEMBER_EXPORT: "Export Member",

  // Plans Management
  PLAN_CREATE: "Create Plan",
  PLAN_EDIT: "Edit Plan",
  PLAN_VIEW: "View Plan",
  PLAN_DELETE: "Delete Plan",
  PLAN_EXPORT: "Export Plan",

  PLAN_TRANSFER_CREATE: "Create Plan Transfer",
  PLAN_TRANSFER_EDIT: "Edit Plan Transfer",
  PLAN_TRANSFER_VIEW: "View Plan Transfer",
  PLAN_TRANSFER_DELETE: "Delete Plan Transfer",
  PLAN_TRANSFER_EXPORT: "Export Plan Transfer",

  // Attendance
  ATTENDANCE_MEMBER_CREATE: "Create Member Attendance",
  ATTENDANCE_MEMBER_EDIT: "Edit Member Attendance",
  ATTENDANCE_MEMBER_VIEW: "View Member Attendance",
  ATTENDANCE_MEMBER_DELETE: "Delete Member Attendance",
  ATTENDANCE_MEMBER_EXPORT: "Export Member Attendance",

  ATTENDANCE_EMPLOYEE_VIEW: "View Employee Attendance",
  ATTENDANCE_EMPLOYEE_CREATE: "Create Employee Attendance",
  ATTENDANCE_EMPLOYEE_EDIT: "Edit Employee Attendance",
  ATTENDANCE_EMPLOYEE_DELETE: "Delete Employee Attendance",
  ATTENDANCE_EMPLOYEE_EXPORT: "Export Employee Attendance",
  // Freeze Requests
  FREEZE_REQUEST_CREATE: "Create Freeze Request",
  FREEZE_REQUEST_EDIT: "Edit Freeze Request",
  FREEZE_REQUEST_VIEW: "View Freeze Request",
  FREEZE_REQUEST_DELETE: "Delete Freeze Request",
  FREEZE_REQUEST_EXPORT: "Export Freeze Request",

  // Freeze Requests
  FREEZE_CREATE: "Create Freeze",
  FREEZE_EDIT: "Edit Freeze",
  FREEZE_VIEW: "View Freeze",
  FREEZE_DELETE: "Delete Freeze",
  FREEZE_EXPORT: "Export Freeze",

  // Employees
  EMPLOYEE_CREATE: "Create Employee",
  EMPLOYEE_EDIT: "Edit Employee",
  EMPLOYEE_VIEW: "View Employee",
  EMPLOYEE_DELETE: "Delete Employee",
  EMPLOYEE_EXPORT: "Export Employee",

  // Payroll
  PAYROLL_CREATE: "Create Payroll",
  PAYROLL_EDIT: "Edit Payroll",
  PAYROLL_VIEW: "View Payroll",
  PAYROLL_DELETE: "Delete Payroll",
  PAYROLL_EXPORT: "Export Payroll",

  // Reports & Analytics
  REPORT_VIEW: "View Report",
  REPORT_EXPORT: "Export Report",
  LEDGER_VIEW: "View Ledger",
  LEDGER_EXPORT: "Export Ledger",

  // Tasks
  TASK_CREATE: "Create Task",
  TASK_EDIT: "Edit Task",
  TASK_VIEW: "View Task",
  TASK_DELETE: "Delete Task",
  TASK_EXPORT: "Export Task",

  // Roles & Permissions
  ROLE_CREATE: "Create Role",
  ROLE_EDIT: "Edit Role",
  ROLE_VIEW: "View Role",
  ROLE_DELETE: "Delete Role",
  ROLE_EXPORT: "Export Role",

  PERMISSION_CREATE: "Create Permission",
  PERMISSION_EDIT: "Edit Permission",
  PERMISSION_VIEW: "View Permission",
  PERMISSION_DELETE: "Delete Permission",
  PERMISSION_EXPORT: "Export Permission",

  // Users (Admins / Staff)
  USER_CREATE: "Create User",
  USER_EDIT: "Edit User",
  USER_VIEW: "View User",
  USER_DELETE: "Delete User",
  USER_EXPORT: "Export User",

  // Holidays
  HOLIDAY_CREATE: "Create Holiday",
  HOLIDAY_EDIT: "Edit Holiday",
  HOLIDAY_VIEW: "View Holiday",
  HOLIDAY_DELETE: "Delete Holiday",
  HOLIDAY_EXPORT: "Export Holiday",

  // Leaves
  LEAVE_CREATE: "Create Leave",
  LEAVE_EDIT: "Edit Leave",
  LEAVE_VIEW: "View Leave",
  LEAVE_DELETE: "Delete Leave",
  LEAVE_EXPORT: "Export Leave",

  // Branches
  BRANCH_CREATE: "Create Branch",
  BRANCH_EDIT: "Edit Branch",
  BRANCH_VIEW: "View Branch",
  BRANCH_DELETE: "Delete Branch",
  BRANCH_EXPORT: "Export Branch",

  //Finance - Expense
  EXPENSE_CREATE: "Create Expense",
  EXPENSE_EDIT: "Edit Expense",
  EXPENSE_VIEW: "View Expense",
  EXPENSE_DELETE: "Delete Expense",
  EXPENSE_EXPORT: "Export Expense",

  //Finance - Income
  INCOME_CREATE: "Create Income",
  INCOME_EDIT: "Edit Income",
  INCOME_VIEW: "View Income",
  INCOME_DELETE: "Delete Income",
  INCOME_EXPORT: "Export Income",

  // Shift
  SHIFT_CREATE: "Create Shift",
  SHIFT_EDIT: "Edit Shift",
  SHIFT_VIEW: "View Shift",
  SHIFT_DELETE: "Delete Shift",
  SHIFT_EXPORT: "Export Shift",

  // Fee Collection
  FEE_COLLECTION_CREATE: "Create Fee Collection",
  FEE_COLLECTION_EDIT: "Edit Fee Collection",
  FEE_COLLECTION_VIEW: "View Fee Collection",
  FEE_COLLECTION_DELETE: "Delete Fee Collection",
  FEE_COLLECTION_EXPORT: "Export Fee Collection",
  // Advance Fee Collection
  // ADVANCE_FEE_COLLECTION_CREATE: "Create Advance Fee Collection",
  // ADVANCE_FEE_COLLECTION_EDIT: "Edit Advance Fee Collection",
  // ADVANCE_FEE_COLLECTION_VIEW: "View Advance Fee Collection",
  // ADVANCE_FEE_COLLECTION_DELETE: "Delete Advance Fee Collection",
  // ADVANCE_FEE_COLLECTION_EXPORT: "Export Advance Fee Collection",

  // fee refund
  FEE_REFUND_CREATE: "Create Fee Refund",
  FEE_REFUND_VIEW: "View Fee Refund",
  FEE_REFUND_EXPORT: "Export Fee Refund",

  // Membership Transfer
  MEMBERSHIP_TRANSFER_CREATE: "Create Membership Transfer",
  MEMBERSHIP_TRANSFER_VIEW: "View Membership Transfer",
  MEMBERSHIP_TRANSFER_EXPORT: "Export Membership Transfer",

  // System Settings
  SYSTEM_SETTINGS_CREATE: "Create System Settings",
  SYSTEM_SETTINGS_EDIT: "Edit System Settings",
  SYSTEM_SETTINGS_VIEW: "View System Settings",

  // Public / Member Self-Service
  PUBLIC_CHECKIN_CREATE: "Create Public Checkin",
  BANK_CREATE: "Create Bank",
  BANK_VIEW: "View Bank",
  BANK_EDIT: "Edit Bank",
  BANK_DELETE: "Delete Bank",

  SYSTEM_LOG_VIEW: "View System Logs",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey];

// Module types for CRUD operations
export type ModuleName = "user" | "attendance" | "fee" | "leave" | "branch";
