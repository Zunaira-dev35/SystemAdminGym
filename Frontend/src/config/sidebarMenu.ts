// src/config/sidebarMenu.ts
import {
  Home,
  Users,
  CreditCard,
  UserCheck,
  Snowflake,
  Briefcase,
  DollarSign,
  BarChart3,
  Settings,
  Shield,
  ListTodo,
  Receipt,
  Scan,
  Building2,
  Wallet,
  Book,
  PiggyBank,
  Notebook,
  Banknote,
  NotepadText,
  UserCircle,
  Copy,
  SendToBack,
  Clock,
  Landmark,
  LogsIcon,
  ChartBar,
  Boxes,
  BoxSelect,
  BoxIcon, // ← Add this icon for My Profile
} from "lucide-react";
import { PERMISSIONS } from "@/permissions/permissions";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export type MenuItem = {
  title: string;
  url?: string;
  icon?: any;
  permission?: any; // string | string[]
  children?: MenuItem[];
  showOnlyForMember?: boolean; // New flag
  showOnlyForAdmin?: boolean;  // New flag
  hideForMember?: boolean;     // New flag
  hideForSystemAdmin?: boolean;
  showOnlyForDefault?: boolean;
};

// Helper hook to get current user role (you'll use this in your Sidebar component)
export const useUserRole = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  console.log("user", user)
  return user?.user_type || user?.roles?.[0]?.name || null;
};


// Base menu structure
const baseSidebarMenu: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home, permission: null, hideForSystemAdmin: true },
  { title: "Fee Collection", url: "/fee-collection", icon: Receipt, permission: [PERMISSIONS.FEE_COLLECTION_VIEW, PERMISSIONS.FEE_REFUND_VIEW] },
  { title: "Public Check-in", url: "/check-in", icon: Scan, permission: PERMISSIONS.PUBLIC_CHECKIN_CREATE },

  // This will be hidden for Members
  {
    title: "Members",
    url: "/members",
    icon: Users,
    permission: PERMISSIONS.MEMBER_VIEW,
    hideForMember: true,
  },
  // {
  //   title: "Admin Dashboard",
  //   url: "/admin-dashboard",
  //   icon: Building2,
  //   showOnlyForAdmin: true,

  //   // permission: PERMISSIONS.PACKAGE_VIEW, 
  // },
  {
    title: "Dashboard",
    url: "/system-dashboard",
    icon: Home,
    showOnlyForAdmin: true,
    permission: null,
    // permission: PERMISSIONS.PACKAGE_VIEW,
  },
  {
    title: "Packages",
    url: "/packages",
    icon: Briefcase,
    showOnlyForAdmin: true,
    permission: null,
    // permission: PERMISSIONS.PACKAGE_VIEW,
  },
  {
    title: "Gyms",
    url: "/gyms",
    icon: Building2,
    showOnlyForAdmin: true,
    permission: null,
    // permission: PERMISSIONS.PACKAGE_VIEW,
  },
  {
    title: "Usage",
    url: "/usage",
    icon: ChartBar,
    showOnlyForAdmin: true,
    permission: null,
    // permission: PERMISSIONS.PACKAGE_VIEW,
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: Book,
    showOnlyForAdmin: true,
    permission: null,
    // permission: PERMISSIONS.PACKAGE_VIEW,
  },
  {
    title: "Settings",
    url: "/system-settings",
    icon: Settings,
    showOnlyForAdmin: true,
    permission: null,
    // permission: PERMISSIONS.PACKAGE_VIEW,
  },

  // This will show ONLY for Members
  {
    title: "My Profile",
    url: "/my-profile",
    icon: UserCircle,
    showOnlyForMember: true,
    permission: null, // No permission check needed — role-based only
  },

  { title: "Plans", url: "/plans", icon: CreditCard, permission: PERMISSIONS.PLAN_VIEW },
  { title: "Plan Transfer", url: "/transfer-plan", icon: Copy, permission: PERMISSIONS.PLAN_TRANSFER_VIEW },
  { title: "Membership Transfer", url: "/membership-transfer", icon: Users, permission: PERMISSIONS.MEMBERSHIP_TRANSFER_VIEW },
  { title: "Member Attendance", url: "/member-attendance", icon: UserCheck, permission: PERMISSIONS.ATTENDANCE_MEMBER_VIEW },
  // { title: "My Attendance", url: "/my-attendance", icon: UserCheck, permission: PERMISSIONS.ATTENDANCE_VIEW },
  { title: "Freeze Requests", url: "/freeze-requests", icon: Snowflake, permission: PERMISSIONS.FREEZE_REQUEST_VIEW },
  { title: "Employees", url: "/employees", icon: Briefcase, permission: PERMISSIONS.EMPLOYEE_VIEW },
  // { title: "Payroll", url: "/payroll", icon: DollarSign, permission: PERMISSIONS.PAYROLL_VIEW },
  {

    title: "Finance",
    icon: Banknote,
    permission: [
      PERMISSIONS.EXPENSE_VIEW,
      PERMISSIONS.INCOME_VIEW,
      PERMISSIONS.LEDGER_VIEW,
    ],
    children: [
      {
        title: "Expense",
        url: "/finance/expense",
        icon: Notebook,
        permission: PERMISSIONS.EXPENSE_VIEW,
      },
      {
        title: "Income",
        url: "/finance/income",
        icon: DollarSign,
        permission: PERMISSIONS.INCOME_VIEW,
      },
      {
        title: "Payment Voucher",
        url: "/finance/payment-voucher",
        icon: Receipt,
        permission: PERMISSIONS.LEDGER_VIEW,
      },
      {
        title: "Bank",
        url: "/finance/bank",
        icon: Landmark,
        permission: PERMISSIONS.BANK_VIEW,
      },
      {
        title: "Bank Book",
        url: "/finance/bank-book",
        icon: Banknote,
        permission: PERMISSIONS.LEDGER_VIEW,
      },
      {
        title: "Cash Book",
        url: "/finance/cash-book",
        icon: NotepadText,
        permission: PERMISSIONS.LEDGER_VIEW,
      },
    ],
  },

  // { title: "Tasks", url: "/tasks", icon: ListTodo, permission: PERMISSIONS.TASK_VIEW },
  // { title: "Ledger", url: "/ledger", icon: Wallet, permission: PERMISSIONS.LEDGER_VIEW },
  // { title: "Reports", url: "/reports", icon: BarChart3, permission: PERMISSIONS.REPORT_VIEW },

  { title: "Branches", url: "/branches", icon: Building2, permission: PERMISSIONS.BRANCH_VIEW },

  // { title: "Shifts", url: "/shifts", icon: Clock, permission: PERMISSIONS.SHIFT_VIEW },

  { title: "HRMS", url: "/hrm", icon: Book, permission: [PERMISSIONS.ATTENDANCE_EMPLOYEE_VIEW, PERMISSIONS.LEAVE_VIEW, PERMISSIONS.HOLIDAY_VIEW, PERMISSIONS.PAYROLL_VIEW] },

  // { title: "Permissions", url: "/permissions", icon: Shield, permission: PERMISSIONS.PERMISSION_VIEW },
  { title: "System Logs", url: "/system-logs", icon: LogsIcon, permission: PERMISSIONS.SYSTEM_LOG_VIEW },
  { title: "Settings", url: "/settings", icon: Settings, permission: [PERMISSIONS.SYSTEM_SETTINGS_VIEW, PERMISSIONS.ROLE_VIEW, PERMISSIONS.PERMISSION_VIEW, PERMISSIONS.USER_VIEW] },
  { title: 'Subscriptions', url: "/subscriptions", icon: SendToBack, permission: null, showOnlyForDefault: true },
  { title: 'Packages', url: "/package", icon: BoxIcon, permission: null, showOnlyForDefault: true },
];

// Function to filter menu based on role and permissions
export const getSidebarMenu = (userRole: string | null, userPermissions: string[] = []): MenuItem[] => {
  const isMember = userRole === "member";
  const isSystemAdmin = userRole === "system_admin";
  const isDefault = userRole === "default";

  console.log("isMember", isMember, " userRole", userRole);

  return baseSidebarMenu
    .filter((item) => {
      // Hide items meant to be hidden for members
      if (isMember && item.hideForMember) return false;

      // Show items only for members
      if (item.showOnlyForMember && !isMember) return false;
      if (item.showOnlyForMember && isMember) return true;

      if (isSystemAdmin && item.hideForSystemAdmin) return false;
      if (item.showOnlyForAdmin && !isSystemAdmin) return false;
      if (item.showOnlyForAdmin && isSystemAdmin) return true;

      if (item.showOnlyForDefault && !isDefault) return false;
      if (item.showOnlyForDefault && isDefault) return true;


      // Permission check
      if (!item.permission) return true;

      if (Array.isArray(item.permission)) {
        return item.permission.some((perm) => userPermissions.includes(perm));
      }

      return userPermissions.includes(item.permission);
    })
    .map((item) => ({
      ...item,
      children: item.children
        ? item.children.filter((child) => {
          if (!child.permission) return true;
          if (Array.isArray(child.permission)) {
            return child.permission.some((perm) => userPermissions.includes(perm));
          }
          return userPermissions.includes(child.permission);
        })
        : undefined,
    }));
};

export default baseSidebarMenu; // Keep default export if needed elsewhere