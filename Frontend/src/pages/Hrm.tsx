// pages/Hrm.tsx ← FINAL WORKING VERSION
import { PERMISSIONS, type PermissionValue } from "@/permissions/permissions";
import { usePermissions } from "@/permissions/usePermissions";
import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Users, CalendarDays, ScrollText, Wallet, Clock } from "lucide-react";
import { useHrmActions } from "@/contexts/HrmActionsContext";  // ← ADD THIS

interface TabItem {
  label: string;
  path: string;
  permission: PermissionValue;
  icon: React.ElementType;
}

const HRM_TABS: TabItem[] = [
  {
    label: "Employee Attendance",
    path: "/hrm/employee-attendance",
    permission: PERMISSIONS.ATTENDANCE_EMPLOYEE_VIEW,
    icon: Users,
  },
  {
    label: "Holiday",
    path: "/hrm/holiday",
    permission: PERMISSIONS.HOLIDAY_VIEW,
    icon: CalendarDays,
  },
  {
    label: "Leave Management",
    path: "/hrm/leave",
    permission: PERMISSIONS.LEAVE_VIEW,
    icon: ScrollText,
  },
  {
    label: "Payroll",
    path: "/hrm/payroll",
    permission: PERMISSIONS.PAYROLL_VIEW,
    icon: Wallet,
  },
];

const Hrm: React.FC = () => {
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const { actions } = useHrmActions();  // ← GET ACTIONS FROM CONTEXT

  const accessibleTabs = HRM_TABS.filter((tab) =>
    hasPermission(tab.permission)
  );

  const currentTab = accessibleTabs.find(
    (tab) => tab.path === location.pathname
  );

  useEffect(() => {
    if (accessibleTabs.length === 0) {
      navigate("/access-denied");
      return;
    }
    if (!currentTab) {
      navigate(accessibleTabs[0].path, { replace: true });
    }
  }, [location.pathname, accessibleTabs, currentTab, navigate]);

  if (accessibleTabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            You don't have permission to access any HRM module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-6 flex justify-between items-start  flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">HRMS</h1>
          <p className="text-muted-foreground">
            Manage HR operations: attendance, leave, holiday & payroll
          </p>
        </div>

        {/* BUTTONS APPEAR HERE */}
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      </div>

      <div className="bg-muted rounded-sm px-1.5 py-1 inline-flex gap-1 max-w-fit mx-6 mt-6 overflow-x-auto">
        {accessibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;

          return (
            <Link key={tab.path} to={tab.path}>
              <div
                className={`flex items-center gap-2 px-5 py-2 rounded-sm transition-all cursor-pointer whitespace-nowrap
                  ${isActive
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex-1 px-6 pt-6" />
    </div>
  );
};

export default Hrm;