// App.tsx - Clean React Router v6 Version (No Wouter!)
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Members from "@/pages/member/Members";
import AddMember from "@/pages/member/AddMember";
import Plans from "@/pages/Plans";
import Attendance from "@/pages/Attendance";
import FreezeRequests from "@/pages/FreezeRequests";
import Employees from "@/pages/employee/Employees";
import Payroll from "@/pages/Payroll";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Ledger from "@/pages/Ledger";
import Permissions from "@/pages/Permissions";
import Tasks from "@/pages/Tasks";
import FeeCollection from "@/pages/FeeCollection";
import PublicAttendance from "@/pages/PublicAttendance";
import Branches from "@/pages/Branches";
import NotFound from "@/pages/not-found";
import FaceAttendance from "./components/faceDetection/FaceAttendance";

import ProtectedRoute from "./ProtectedRoute";
import Layout from "@/components/Layout"; // Your sidebar + header layout
import { PERMISSIONS } from "@/permissions/permissions";
import { SidebarProvider } from "./components/ui/sidebar";
import EditMember from "./pages/member/EditMember";
import PlanTransfer from "./pages/PlanTransfer";
import PlanTransferDetail from "./pages/PlanTransferDetail";
import AddEmployee from "./pages/employee/AddEmployee";
import EditEmployee from "./pages/employee/EditEmployee";

import Shifts from "./pages/Shifts";

import Hrm from "./pages/Hrm";
import EmployeeAttendanceTab from "./components/hrm/EmployeeAttendanceTab";
import LeaveTab from "./components/hrm/LeaveTab";
import HolidayTab from "./components/hrm/HolidayTab";
import HrmLayout from "./components/HrmLayout";
import IncomePage from "./components/finance/income/IncomePage";
import PaymentVoucherPage from "./components/finance/payment-voucher/PaymentVoucherPage";
import ExpensePage from "./components/finance/expense/ExpensePage";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "./hooks/use-toast";
import { useEffect } from "react";
import pusher from "@/lib/pusher";
import { addNotification } from "./redux/pagesSlices/generalSlice";
import { identity } from "lodash";
import BankBook from "./pages/BankBook";
import CashBook from "./pages/CashBook";
import MemberDetails from "./pages/member/MemberDetails";
import MyProfile from "./pages/MyProfile";
import CreateEditGroupPage from "./pages/CreateEditGroupModal";
import Bank from "./pages/Bank";
import MembershipTransfer from "./pages/MembershipTransfer";
import SystemLogs from "./pages/SystemLogs";
import AttendanceDetail from "./pages/AttendanceDetail";
import PayrollDetail from "./pages/PayrollDetail";
import AddUpdatePackage from "./pages/packages/AddUpdatePackage";
import PackagePage from "./pages/packages/PackagePage";
import GymPage from "./pages/gyms/GymPage";
import CreateUpdateGym from "./pages/gyms/CreateUpdateGym";
import GymDetail from "./pages/gyms/GymDetail";
import Invoices from "./pages/Invoices";
import SystemDashboard from "./pages/SystemDashboard";
import LandingPage from "./pages/LandingPage";
import EmailVerification from "./pages/EmailVerification";
import Trial from "./pages/Trial";
import SuccessPage from "./pages/SuccessPage";
import ErrorPage from "./pages/ErrorPage";
import AllPackages from "./pages/AllPackages";
import SystemSettings from "./pages/SystemSettings";
import Usage from "./pages/Usage";
import DefaultPackages from "./pages/DefaultPackages";
import PackageExpired from "./pages/PackageExpired";
// import FingerprintSignin from "./pages/fingerprint";
function PusherInitializer() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);
  // console.log("user in pusher", user);
  useEffect(() => {
    if (!user) return;
    const channel = pusher.subscribe(`notification-receive-${user.id}`);
    // console.log("channel....", channel);
    channel.bind("NewNotification", (data: any) => {
      // console.log("new notification data", data);
      dispatch(
        addNotification({
          id: data.id,
          name: data.name || "Notification",
          message: data.message,
          type: data.type || "info",
          date: data.date || null,
          time: data.time || null,
          is_read: data.is_read || false,
        })
      );

      // Show toast
      toast({
        title: data.title || "New Notification",
        description: data.message,
        variant: data.type === "error" ? "destructive" : "default",
      });
    });

    return () => {
      pusher.unsubscribe(`notification-receive-${user.id}`);
    };
  }, [dispatch, toast]);

  return null;
}
// Members Nested Routes Component
function MembersRoutes() {
  return (
    <Routes>
      <Route
        index
        element={
          <ProtectedRoute
            element={<Members />}
            permissions={[PERMISSIONS.MEMBER_VIEW]}
          />
        }
      />
      <Route
        path="add"
        element={
          <ProtectedRoute
            element={<AddMember />}
            permissions={[PERMISSIONS.MEMBER_CREATE]}
          />
        }
      />
      <Route
        path="edit/:id"
        element={
          <ProtectedRoute
            element={<EditMember />} // reuse form in edit mode
            permissions={[PERMISSIONS.MEMBER_EDIT]}
          />
        }
      />
      <Route
        path=":id"
        element={
          <ProtectedRoute
            element={<MemberDetails />} // reuse form in edit mode
            permissions={[PERMISSIONS.MEMBER_VIEW]}
          />
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
function PackagesRoutes() {
  return (
    <Routes>
      <Route
        index
        element={
          <ProtectedRoute
            element={<PackagePage />}
          // permissions={[PERMISSIONS.MEMBER_VIEW]}
          />
        }
      />
      <Route
        path="add"
        element={
          <ProtectedRoute
            element={<AddUpdatePackage />}
          // permissions={[PERMISSIONS.MEMBER_CREATE]}
          />
        }
      />
      <Route
        path="edit/:id"
        element={
          <ProtectedRoute
            element={<AddUpdatePackage />} // reuse form in edit mode
          // permissions={[PERMISSIONS.MEMBER_EDIT]}
          />
        }
      />
      {/* 
      <Route
        path=":id"
        element={
          <ProtectedRoute
            element={<MemberDetails />} // reuse form in edit mode
            permissions={[PERMISSIONS.MEMBER_VIEW]}
          />
        }
      /> */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
function EmployeeRoutes() {
  return (
    <Routes>
      <Route
        index
        element={
          <ProtectedRoute
            element={<Employees />}
            permissions={[PERMISSIONS.EMPLOYEE_VIEW]}
          />
        }
      />
      <Route
        path="add"
        element={
          <ProtectedRoute
            element={<AddEmployee />}
            permissions={[PERMISSIONS.EMPLOYEE_CREATE]}
          />
        }
      />
      <Route
        path="edit/:id"
        element={
          <ProtectedRoute
            element={<EditEmployee />} // reuse form in edit mode
            permissions={[PERMISSIONS.EMPLOYEE_EDIT]}
          />
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Main App with Layout
function AppWithLayout() {
  return (
    <Layout>
      <Routes>
        {/* Dashboard */}
        <Route
          path="/dashboard"
          //         element={
          //           <ProtectedRoute
          //           element={
          //   <div className="p-10 text-6xl font-bold text-red-600">
          //     DASHBOARD WORKS! (Route is reachable)
          //   </div>
          // }
          element={<Dashboard />}
        // permissions={[PERMISSIONS.VIEW_DASHBOARD]}
        />

        {/* Members - Nested Routes */}
        <Route path="/members/*" element={<MembersRoutes />} />
        <Route path="/check-in" element={<PublicAttendance />} />
        {/* Other Pages */}
        <Route
          path="/my-profile"
          element={
            <ProtectedRoute
              element={<MemberDetails />} //using MemberDetails to show profile instead ofMyProfile page
              permissions={[PERMISSIONS.MEMBER_VIEW]}
            />
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute
              element={<Plans />}
              permissions={[PERMISSIONS.PLAN_VIEW]}
            />
          }
        />
        <Route
          path="/transfer-plan"
          element={
            <ProtectedRoute
              element={<PlanTransfer />}
              permissions={[PERMISSIONS.PLAN_TRANSFER_VIEW]}
            />
          }
        />
        <Route
          path="/membership-transfer"
          element={
            <ProtectedRoute
              element={<MembershipTransfer />}
              permissions={[PERMISSIONS.MEMBERSHIP_TRANSFER_VIEW]}
            />
          }
        />
        <Route
          path="/plan-transfer/:id"
          element={
            <ProtectedRoute
              element={<PlanTransferDetail />}
              permissions={[PERMISSIONS.PLAN_TRANSFER_VIEW]}
            />
          }
        />
        {/* <Route path="/plan-transfer/:id" element={<PlanTransferDetail />} /> */}
        <Route
          path="/attendance"
          element={
            <ProtectedRoute
              element={<Attendance />}
              permissions={[PERMISSIONS.ATTENDANCE_EMPLOYEE_VIEW]}
            />
          }
        />
        <Route
          path="/my-attendance"
          element={
            <ProtectedRoute
              element={<Attendance />}
              permissions={[PERMISSIONS.ATTENDANCE_EMPLOYEE_VIEW]}
            />
          }
        />
        <Route
          path="/freeze-requests"
          element={
            <ProtectedRoute
              element={<FreezeRequests />}
              permissions={[PERMISSIONS.FREEZE_REQUEST_VIEW]}
            />
          }
        />
        {/* <Route
          path="/employees"
          element={
            <ProtectedRoute
              element={<Employees />}
              permissions={[PERMISSIONS.EMPLOYEE_VIEW]}
            />
          }
        /> */}
        {/* Employee - Nested Routes */}
        <Route path="/employees/*" element={<EmployeeRoutes />} />
        <Route
          path="/payroll"
          element={
            <ProtectedRoute
              element={<Payroll />}
              permissions={[PERMISSIONS.PAYROLL_VIEW]}
            />
          }
        />
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute
              element={<GymDetail />}
              roles={["default"]}
            />
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute
              element={<Reports />}
              permissions={[PERMISSIONS.REPORT_VIEW]}
            />
          }
        />
        <Route
          path="/ledger"
          element={
            <ProtectedRoute
              element={<Ledger />}
              permissions={[PERMISSIONS.LEDGER_VIEW]}
            />
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute
              element={<Tasks />}
              permissions={[PERMISSIONS.TASK_VIEW]}
            />
          }
        />
        <Route
          path="/fee-collection"
          element={
            <ProtectedRoute
              element={<FeeCollection />}
              permissions={[
                PERMISSIONS.FEE_COLLECTION_VIEW,
                PERMISSIONS.FEE_REFUND_VIEW,
              ]}
            />
          }
        />
        <Route
          path="/branches"
          element={
            <ProtectedRoute
              element={<Branches />}
              permissions={[PERMISSIONS.BRANCH_VIEW]}
            />
          }
        />
        <Route
          path="/shifts"
          element={
            <ProtectedRoute
              element={<Shifts />}
              permissions={[PERMISSIONS.SHIFT_VIEW]}
            />
          }
        />
        <Route
          path="/permissions"
          element={
            <ProtectedRoute
              element={<Permissions />}
              permissions={[PERMISSIONS.PERMISSION_VIEW]}
            />
          }
        />
        <Route
          path="/member-attendance"
          element={
            <ProtectedRoute
              element={<Attendance />}
              permissions={[PERMISSIONS.ATTENDANCE_MEMBER_VIEW]}
            />
          }
        />
        <Route
          path="/attendance/detail/:id"
          element={
            <ProtectedRoute
              element={<AttendanceDetail />}
              permissions={[PERMISSIONS.ATTENDANCE_MEMBER_VIEW]}
            />
          }
        />
        <Route
          path="/system-logs"
          element={
            <ProtectedRoute
              element={<SystemLogs />}
              permissions={[PERMISSIONS.SYSTEM_LOG_VIEW]}
            />
          }
        />
        <Route path="/finance">
          <Route index element={<Navigate to="/finance/expense" replace />} />

          <Route
            path="expense"
            element={
              <ProtectedRoute
                element={<ExpensePage />}
                permissions={[PERMISSIONS.EXPENSE_VIEW]}
              />
            }
          />

          <Route
            path="income"
            element={
              <ProtectedRoute
                element={<IncomePage />}
                permissions={[PERMISSIONS.INCOME_VIEW]}
              />
            }
          />

          <Route
            path="payment-voucher"
            element={
              <ProtectedRoute
                element={<PaymentVoucherPage />}
                permissions={[PERMISSIONS.LEDGER_VIEW]}
              />
            }
          />
          <Route
            path="bank"
            element={
              <ProtectedRoute
                element={<Bank />}
                permissions={[PERMISSIONS.LEDGER_VIEW]}
              />
            }
          />
          <Route
            path="bank-book"
            element={
              <ProtectedRoute
                element={<BankBook />}
                permissions={[PERMISSIONS.LEDGER_VIEW]}
              />
            }
          />

          <Route
            path="cash-book"
            element={
              <ProtectedRoute
                element={<CashBook />}
                permissions={[PERMISSIONS.LEDGER_VIEW]}
              />
            }
          />
        </Route>

        {/* <Route
          path="/hrm"
          element={
            <ProtectedRoute
              element={<Hrm />}
              permissions={[PERMISSIONS.ATTENDANCE_VIEW]}
            />
          }
        /> */}

        <Route path="/hrm" element={<HrmLayout />}>
          {/* Default redirect to first allowed tab (handled inside Hrm.tsx) */}
          <Route
            index
            element={<Navigate to="/hrm/employee-attendance" replace />}
          />

          {/* <Route
    path="salary"
    element={
      <ProtectedRoute
        element={<SalaryPage />}  // Create this or reuse Payroll
        permissions={[PERMISSIONS.PAYROLL_VIEW]}
      />
    }
  /> */}

          <Route
            path="payroll"
            element={
              <ProtectedRoute
                element={<Payroll />} // You already have this page
                permissions={[PERMISSIONS.PAYROLL_VIEW]}
              />
            }
          />

          <Route
            path="holiday"
            element={
              <ProtectedRoute
                element={<HolidayTab />}
                permissions={[PERMISSIONS.HOLIDAY_VIEW]}
              />
            }
          />

          <Route
            path="leave"
            element={
              <ProtectedRoute
                element={<LeaveTab />}
                permissions={[PERMISSIONS.LEAVE_VIEW]}
              />
            }
          />

          <Route
            path="employee-attendance"
            element={
              <ProtectedRoute
                element={<EmployeeAttendanceTab />}
                permissions={[PERMISSIONS.ATTENDANCE_EMPLOYEE_VIEW]}
              />
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>
        {/* <Route
          path="/settings"
          element={
            <ProtectedRoute
              element={<Settings />}
              permissions={[PERMISSIONS.SYSTEM_SETTINGS_VIEW]}
            />
          }
        /> */}
        <Route path="/settings">
          <Route
            path="/settings"
            index
            element={
              <ProtectedRoute
                element={<Settings />}
                permissions={[
                  PERMISSIONS.SYSTEM_SETTINGS_VIEW,
                  PERMISSIONS.ROLE_VIEW,
                  PERMISSIONS.PERMISSION_VIEW,
                  PERMISSIONS.USER_VIEW,
                ]}
              />
            }
          />
          <Route
            path="permission"
            element={
              <ProtectedRoute
                element={<CreateEditGroupPage />}
                permissions={[PERMISSIONS.EXPENSE_VIEW]}
              />
            }
          />
          <Route
            path="permission/:id"
            element={
              <ProtectedRoute
                element={<CreateEditGroupPage />}
                permissions={[PERMISSIONS.EXPENSE_VIEW]}
              />
            }
          />
        </Route>
        <Route
          path="/face-detection"
          element={
            <ProtectedRoute
              element={<FaceAttendance />}
              permissions={[PERMISSIONS.SYSTEM_SETTINGS_VIEW]}
            />
          }
        />
        <Route
          path="payroll/:id"
          element={
            <ProtectedRoute
              element={<PayrollDetail />}
              permissions={[PERMISSIONS.PAYROLL_VIEW]}
            />
          }
        />
        <Route
          path="/packages/*"
          element={
            <ProtectedRoute
              roles={["system_admin"]}
              element={<PackagesRoutes />}
            />
          }
        />
        <Route
          path="gyms"
          element={
            <ProtectedRoute
              roles={["system_admin"]}
              element={<GymPage />}
            />
          }
        />
        <Route
          path="gym/detail/:id"
          element={
            <ProtectedRoute
              roles={["system_admin"]}
              element={<GymDetail />}
            />
          }
        />
        <Route
          path="gym/add"
          element={
            <ProtectedRoute
              roles={["system_admin"]}
              element={<CreateUpdateGym />}
            />
          }
        />
        <Route
          path="gym/edit/:id"
          element={
            <ProtectedRoute
              roles={["system_admin"]}
              element={<CreateUpdateGym />}
            />
          }
        />
        <Route
          path="invoices"
          element={
            <ProtectedRoute
              roles={["system_admin"]}
              element={<Invoices />}
            />
          }
        />
        <Route
          path="system-dashboard"
          element={
            <ProtectedRoute
              roles={["system_admin"]}
              element={<SystemDashboard />}
            />
          }
        />
        <Route
          path="system-settings"
          element={
            <ProtectedRoute
              roles={["system_admin"]}
              element={<SystemSettings />}
            />
          }
        />
        <Route
          path="Usage"
          element={
            <ProtectedRoute
              roles={["system_admin"]}
              element={<Usage />}
            />
          }
        />
        <Route
          path="package"
          element={
            <ProtectedRoute
              roles={["default"]}
              element={<DefaultPackages />}
            />
          }
        />
        <Route path="/package-expired" element={<PackageExpired />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

function RootRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
}


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* <SidebarProvider> */}
      <ThemeProvider>
        <AuthProvider>
          <PusherInitializer />
          <TooltipProvider>
            <Router>
              <Routes>
                <Route path="/" element={<RootRoute />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registration" element={<Trial />} />
                <Route path="/all-packages" element={<AllPackages />} />
                <Route path="/email/verification" element={<EmailVerification />} />
                <Route path="/verified-success" element={<SuccessPage />} />
                <Route path="/verification-failed" element={<ErrorPage />} />
                <Route element={<PrivateRouteFallback />}>
                  <Route path="/*" element={<AppWithLayout />} />
                </Route>
              </Routes>

              <Toaster />
            </Router>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
      {/* </SidebarProvider> */}
    </QueryClientProvider>
  );
}

// Simple private route fallback (redirect if not authenticated)
function PrivateRouteFallback() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
