import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllEmployeesAsyncThunk,
  createOrUpdateEmployeeAsyncThunk,
  updateUserStatusAsyncThunk,
} from "@/redux/pagesSlices/peopleSlice";
import { RootState } from "@/redux/store";
import { backendBasePath } from "@/constants";
import { format } from "date-fns";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  ChevronsUpDown,
  Check,
  X,
  EyeOff,
  Building2,
  Snowflake,
  Moon,
  Sun,
  FilterIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Briefcase,
  RefreshCw,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Pagination from "@/components/shared/Pagination";
import { serial } from "drizzle-orm/mysql-core";
import { PERMISSIONS } from "@/permissions/permissions";
import { s } from "node_modules/vite/dist/node/types.d-aGj9QkWt";
import Loading from "@/components/shared/loaders/Loading";
import { useLocation, useNavigate } from "react-router-dom";
import CustomCheckbox from "@shared/CustomCheckbox";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react";
import { usePermissions } from "@/permissions/usePermissions";
import { useCallback } from "react";
import { formatDateToShortString, formatTimeTo12Hour } from "@/utils/helper";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { Checkbox } from "@/components/ui/checkbox";
import { exportToPDF } from "@/utils/exportToPdf";

import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";
interface EmployeeFormData {
  id?: number;
  name: string;
  // last_name: string;
  whats_app?: string;
  cnic?: string;
  phone: string;
  profile_image?: File | string | null;
  assign_branch_id: string[];
  designation: string;
  salary: string;
  shift_start_time: string;
  shift_end_time: string;
  rest_days: string[];
  join_date: string;
  password?: string;
}
interface EmployeeFormData {
  id?: number;
  name: string;
  whatsapp_num?: string;
  cnic?: string;
  phone: string;
  profile_image?: File | string | null;
  assign_branch_id: string[];
  designation: string;
  salary: string;
  shift_start_time: string;
  shift_end_time: string;
  rest_days: string[];
  join_date: string;
  password?: string;
}

// Add this new state for errors
export default function Employees() {
  const dispatch = useDispatch();
  const { employees, loadings } = useSelector(
    (state: RootState) => state.people
  );
  const branches = useSelector(
    (state: RootState) => state.plan.branchesList || []
  );
  const { selectedBranchId } = useSelector((state: any) => state.general);
  const { user } = useSelector((state: any) => state.auth);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [confirmToggle, setConfirmToggle] = useState<{
    id: number;
    current: string;
  } | null>(null);
  const [selectedForView, setSelectedForView] = useState<any>(null);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [blackList, setBlackList] = useState(false);
  const { hasPermission } = usePermissions();
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [filter, setFilter] = useState<string>("");

  // console.log("blackList", blackList);
  const [formData, setFormData] = useState<EmployeeFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    profile_image: null,
    assign_branch_id: ["1"],
    designation: "",
    salary: "",
    shift_start_time: "",
    shift_end_time: "",
    rest_days: [],
    join_date: format(new Date(), "yyyy-MM-dd"),
    password: "",
  });
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    console.log("employee rendered!", location.pathname);
  }, [location]);
  // const { user } = useSelector((state: any) => state.auth);

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      let start_date = dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : undefined;

      let end_date = dateRange?.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : start_date;
      await dispatch(
        getAllEmployeesAsyncThunk({
          params: {
            search: searchTerm,
            limit: recordsPerPage,
            page: currentPage,
            filter_status: filter === "all" ? "" : filter,
            filter_branch_id: filterBranchId,
            ...(start_date && { start_date: start_date }),
            ...(end_date && { end_date: end_date }),
          },
        })
      ).unwrap();
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };
  useEffect(() => {
    fetchEmployees();
  }, [
    dispatch,
    searchTerm,
    recordsPerPage,
    currentPage,
    dateRange,
    filter,
    filterBranchId,
  ]);

  const totalRecords = employees.meta?.total || 0;

  // Toggle Status
  const handleToggleStatus = (id: number, current: string) => {
    setConfirmToggle({ id, current });
  };

  const confirmToggleFun = async () => {
    if (!confirmToggle) return;

    const newStatus =
      confirmToggle.current === "active" ? "inactive" : "active";

    await dispatch(
      updateUserStatusAsyncThunk({
        user_id: confirmToggle.id,
        status: newStatus,
        blacklisted: blackList ? 1 : 0,
      })
    ).unwrap();

    toast({ title: "Status updated" });
    fetchEmployees();
    setConfirmToggle(null);
  };

  // Calculate total payroll
  const totalPayroll = employees.data.reduce((sum: number, emp: any) => {
    return sum + (Number(emp.employee_profile?.salary) || 0);
  }, 0);

const exportPDF = useCallback(() => {
  const selectedEmployees = employees?.data?.filter((e: any) => selectedIds.has(e.id)) || [];

  if (selectedEmployees.length === 0) return;

  const selectedBranch = filterBranchId
    ? branches?.find((b: any) => b.id === Number(filterBranchId))
    : null;

  exportToPDF({
    title: "Employees Report",
    // subtitle: `${selectedEmployees.length} employee${selectedEmployees.length !== 1 ? "s" : ""} selected`,
    filenamePrefix: "Employees",

    // dateRange: dateRange ? { from: dateRange.from, to: dateRange.to } : undefined,

    branchInfo: selectedBranch
      ? {
          name: selectedBranch.name,
          address: selectedBranch.address,
          reference_num: selectedBranch.reference_num,
        }
      : null,

    columns: [
      { title: "Name",        dataKey: "name",        align: "left",   width: 65 },
      { title: "Employee ID", dataKey: "employeeId",  align: "center", width: 45 },
      { title: "Designation", dataKey: "designation", align: "center", width: 60 },
      { title: "Salary",      dataKey: "salary",      align: "center", width: 50 },
      { title: "Status",      dataKey: "status",      align: "center", width: 45 },

      // { title: "Password", dataKey: "password", align: "center", width: 50 },
    ],

    data: selectedEmployees,

    getRowData: (employee: any) => {
      const profile = employee.employee_profile || {};

      const name = (employee.name || "—").toUpperCase();
      const salary = profile.salary
        ? `Rs. ${Number(profile.salary).toLocaleString()}`
        : "—";

      return {
        name,
        employeeId: employee.reference_num || "—",
        designation: profile.designation || "—",
        salary,
        status: employee.status === "active" ? "Active" : "Inactive",

        // password: user?.type === "default" ? (employee.password_string || "—") : undefined,
      };
    },
  });
}, [
  employees?.data,
  selectedIds,
  filterBranchId,
  branches,
  // user?.type,
]);
//  const exportPDF = useCallback(() => {
//   const selectedData = employees?.data?.filter((e: any) => selectedIds.has(e.id)) || [];

//   const isAdmin = user?.type === "default";

//   const doc = new jsPDF("l", "mm", "a4");
//   doc.setFontSize(20);
//   doc.text("Employees Report", 14, 22);

//   doc.setFontSize(11);
//   doc.text(
//     `Generated: ${format(new Date(), "dd MMM yyyy • hh:mm a")} • ${selectedData.length} employee${selectedData.length > 1 ? "s" : ""}`,
//     14,
//     32
//   );

//   const tableData = selectedData.map((e: any) => {
//     const profile = e.employee_profile || {};

//     const row = [
//       e.name || "—",
//       e.reference_num || "—",
//       profile.designation || "—",
//       profile.salary ? `Rs. ${Number(profile.salary).toLocaleString()}` : "—",
//       e.status === "active" ? "Active" : "Inactive",
//     ];

//     // if (isAdmin) {
//     //   row.splice(3, 0, e.password_string || "—");
//     // }

//     return row;
//   });

//   const headers = [
//     "Name",
//     "Employee ID",
//     "Designation",
//     // ...(isAdmin ? ["Password"] : []),
//     "Salary",
//     "Status",
//   ];

//   autoTable(doc, {
//     head: [headers],
//     body: tableData,
//     startY: 45,
//     styles: { fontSize: 10, cellPadding: 5 },
//     headStyles: { fillColor: [124, 59, 237], textColor: [255, 255, 255] },
//     columnStyles: {
//       0: { cellWidth: 55 },
//       1: { cellWidth: 40 },  
//       2: { cellWidth: 50 }, 
//       // ...(isAdmin ? { 3: { cellWidth: 45 } } : {}), 
//       4: { cellWidth: 40 }, 
//       5: { cellWidth: 40 },
//     },
//     alternateRowStyles: { fillColor: [248, 250, 252] },
//   });

//   doc.save(`Employees_Selected_${selectedIds.size}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
// }, [employees?.data, selectedIds, user?.type]);
  console.log("user currency", user);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      // currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage your gym staff</p>
        </div>
        <div className="flex gap-4">
          {hasPermission(PERMISSIONS.EMPLOYEE_EXPORT) && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportPDF}
              className={`mr-2 ${
                selectedIds.size === 0 ? "cursor-not-allowed" : ""
              }`}
              disabled={selectedIds.size === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}
          <Button
            permission={[PERMISSIONS.EMPLOYEE_CREATE]}
            onClick={() => navigate("/employees/add")}
            // onClick={() => openForm()}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Employee
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {/* <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Employees
            </CardTitle>
            <Briefcase className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {employees.meta?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Active
            </CardTitle>
            <Briefcase className="h-5 w-5 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {employees.data.filter((e: any) => e.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Payroll
            </CardTitle>
            <Briefcase className="h-5 w-5 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              Rs. {totalPayroll.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap">
            <CardTitle>All Employees</CardTitle>
            <div className="relative  flex gap-3 flex-wrap">
              <HeaderBranchFilter onBranchChange={setFilterBranchId} />
              <div className="w-32">
                <Select
                  value={filter}
                  onValueChange={(value) => {
                    setFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <FilterIcon className="h-4 w-4" />
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">All</span>
                    </SelectItem>
                    <SelectItem value={"active"}>
                      <div className="flex gap-2">Active</div>
                    </SelectItem>
                    <SelectItem value={"inactive"}>
                      <div className="flex gap-2">Inactive</div>
                    </SelectItem>
                  
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              {/* Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "min-w-[240px] justify-start text-left font-normal bg-background border-input mt-2",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd MMM yyyy")} –{" "}
                          {format(dateRange.to, "dd MMM yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd MMM yyyy")
                      )
                    ) : (
                      <span>Filter by joining date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range: DateRange | undefined) => {
                      setDateRange(range);
                      setCurrentPage(1);
                    }}
                    numberOfMonths={1} // ← you can change to 1 or 3
                  />
                </PopoverContent>
              </Popover>
              {dateRange && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setDateRange(undefined);
                    setCurrentPage(1);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <CustomCheckbox
                    checked={selectAll}
                    onChange={(checked) => {
                      setSelectAll(checked);
                      if (checked) {
                        setSelectedIds(
                          new Set(employees?.data?.map((e: any) => e.id) || [])
                        );
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Employee ID</TableHead>
                {user?.type === "default" && <TableHead>Password</TableHead>}
                <TableHead>Designation</TableHead>
                {/* <TableHead>Shift</TableHead> */}
                {/* <TableHead>Rest Day</TableHead> */}
                <TableHead>Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadings.getEmployees ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <Loading />
                  </TableCell>
                </TableRow>
              ) : employees?.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                employees?.data.map((emp: any) => {
                  const profile = emp.employee_profile || {};
                  const restDay = Array.isArray(profile.rest_days)
                    ? profile.rest_days
                        .map(
                          (d: string) => d.charAt(0).toUpperCase() + d.slice(1)
                        )
                        .join(", ")
                    : "—";

                  return (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <CustomCheckbox
                          checked={selectedIds.has(emp.id)}
                          onChange={(checked) => {
                            const newIds = new Set(selectedIds);
                            if (checked) newIds.add(emp.id);
                            else newIds.delete(emp.id);
                            setSelectedIds(newIds);
                            setSelectAll(
                              newIds.size === employees?.data?.length &&
                                employees.data.length > 0
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {emp.profile_image ? (
                              <AvatarImage
                                src={`${backendBasePath}${emp.profile_image}`}
                                alt={emp.first_name}
                              />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {emp.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{emp.name}</p>
                            {/* <p className="text-xs text-muted-foreground">
                              ID: {emp.reference_num}
                            </p> */}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="text-sm">{emp?.reference_num}</p>
                        </div>
                      </TableCell>
                      {user?.type === "default" && (
                        <TableCell>
                          <div>
                            <p className="text-sm">{emp?.password_string}</p>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>{profile.designation || "—"}</TableCell>

                      {/* <TableCell>
                        {emp?.employee_shifts && emp?.employee_shifts.length > 0 ? (
                          <div className="space-y-1">
                            {emp?.employee_shifts?.map((shift: any) => (
                              <div key={shift.id} className="text-xs">
                                <span className="font-medium">
                                  {shift.shift.name}
                                </span>
                                <span className="text-muted-foreground ml-1">
                                  ({shift.shift.start_time.substring(0, 5)} -{" "}
                                  {shift.shift.end_time.substring(0, 5)})
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell> */}

                      {/* <TableCell>                        {profile?.shift.rest_days.map((d:any)=>
                        <p className="bg-red-500">{d}</p>)}
                        </TableCell> */}

                      <TableCell className="font-medium">
                        {(profile.salary && (
                          <p>
                            {" "}
                            {profile.system_currency}{" "}
                            {profile.salary.toLocaleString()}
                          </p>
                        )) ||
                          "—"}
                      </TableCell>

                      <TableCell>
                        {/* <Switch
                          checked={emp.status === "active"}
                          onCheckedChange={() =>
                            handleToggleStatus(emp.id, emp.status)
                          }
                        /> */}
                        <TableCell>
                          <Badge
                            variant={
                              emp.status === "active" ? "default" : "secondary"
                            }
                            className={`font-medium ${
                              emp.status === "active"
                                ? "bg-chart-3/10 text-chart-3 border-chart-3/20"
                                : "bg-chart-5/10 text-chart-5 border-chart-5/20"
                            }`}
                          >
                            {emp.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableCell>

                      <TableCell className="text-right space-x-1">
                        <Button
                          permission={[PERMISSIONS.EMPLOYEE_VIEW]}
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedForView(emp)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          permission={[PERMISSIONS.EMPLOYEE_EDIT]}
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/employees/edit/${emp.id}`)}

                          // onClick={() => openForm(emp)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          permission={[PERMISSIONS.EMPLOYEE_EDIT]}
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(emp.id, emp.status)}
                          // className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          {/* <Switch className="h-4 w-4" /> */}
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        {/* <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button> */}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
        {!loadings.getEmployees && (
          <Pagination
            recordsPerPage={recordsPerPage}
            setRecordsPerPage={setRecordsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalRecords={totalRecords}
            className="bg-theme-white"
            recordsPerPageOptions={[5, 10, 20, 50]}
          />
        )}
      </Card>

      {/* View Details Dialog */}
      <Dialog
        open={!!selectedForView}
        onOpenChange={() => setSelectedForView(null)}
      >
        {/* Apply max-h-screen/full and overflow-hidden to the content wrapper */}
        <DialogContent className="max-w-2xl sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-screen overflow-hidden">
          {/* 1. Fixed Header */}
          <DialogHeader className="pt-6 px-6">
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>

          {selectedForView && (
            // 2. Scrollable Content Area:
            //    - h-[calc(100vh-120px)] uses dynamic height calculation to fill the screen
            //      minus space for the header/padding.
            //    - md:h-auto allows it to resize naturally on larger screens/desktop.
            <div className="overflow-y-auto px-6 pb-6 h-[calc(100vh-120px)] sm:h-auto sm:max-h-[80vh] scrollbar-thin">
              {/* Employee Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  {selectedForView.profile_image && (
                    <AvatarImage
                      className="h-20 w-20 object-contain rounded-full"
                      src={`${backendBasePath}${selectedForView.profile_image}`}
                    />
                  )}
                  <AvatarFallback>{selectedForView.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{selectedForView.name}</h2>
                  <p className="text-lg text-muted-foreground">
                    {selectedForView.employee_profile?.designation ||
                      "No designation"}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Employee Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                {/* ... all your detail fields below ... */}

                <div>
                  <Label>Reference Number</Label>
                  <p className="font-medium">
                    {selectedForView?.reference_num}
                  </p>
                </div>
                <div>
                  <Label>Base Branch</Label>
                  <div>
                    <span className="bg-muted-foreground/10 py-0.5 text-xs px-2 rounded-2xl">
                      {selectedForView?.branch.reference_num}
                    </span>{" "}
                    <span className="font-medium">
                      {selectedForView?.branch.name}
                    </span>
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="font-medium">{selectedForView.phone}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{selectedForView.email ?? "-"}</p>
                </div>
                <div>
                  <Label>Assigned Branches</Label>

                  {selectedForView.assign_branches?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedForView.assign_branches.map((ab: any) => {
                        const branch = branches?.find(
                          (b: any) => b.id === ab.branch_id
                        );

                        return branch ? (
                          // <Badge
                          //   key={ab.id}
                          //   variant="secondary"
                          //   className="text-xs"
                          // >
                          //   {branch.name}
                          // </Badge>
                          <div>
                            <span className="bg-muted-foreground/10 py-0.5 text-xs px-2 rounded-2xl">
                              {branch?.reference_num}
                            </span>{" "}
                            <span className="font-medium">{branch?.name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-xs">None</div>
                  )}
                </div>

                <div>
                  <Label>Salary</Label>
                  <p className="font-medium">
                    {selectedForView.employee_profile?.system_currency}{" "}
                    {selectedForView.employee_profile?.salary.toLocaleString() ||
                      "—"}
                  </p>
                </div>

                {/* Shifts Section */}
                {/* <div>
                  <Label>Shifts</Label>
                  {selectedForView?.employee_shifts &&
                  selectedForView?.employee_shifts.length > 0 ? (
                    <div className="space-y-3">
                      {selectedForView.employee_shifts.map(
                        (employeeShift: any) => (
                          <div
                            key={employeeShift.id}
                            className="text-sm border-b pb-2 last:border-b-0 last:pb-0"
                          >
                            <p className="font-semibold text-foreground">
                              {employeeShift?.shift?.name}{" "}
                              <span className="bg-muted-foreground/10 py-0.5 px-2 text-xs rounded-2xl">
                                {employeeShift?.shift?.reference_num}
                              </span>
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {formatTimeTo12Hour(
                                employeeShift.shift.start_time
                              )}{" "}
                              -{" "}
                              {formatTimeTo12Hour(employeeShift.shift.end_time)}
                            </p>
                            <div className="pt-1">
                              <span className="font-medium text-xs">
                                Rest Days:{" "}
                              </span>
                              <span className="text-xs text-green-600 font-medium">
                                {Array.isArray(employeeShift.shift.rest_days) &&
                                employeeShift.shift.rest_days.length > 0
                                  ? employeeShift.shift.rest_days
                                      .map(
                                        (d: string) =>
                                          d.charAt(0).toUpperCase() + d.slice(1)
                                      )
                                      .join(", ")
                                  : "None"}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="font-medium text-muted-foreground">—</p>
                  )}
                </div> */}

                {/* Remaining Fields */}
                <div>
                  <Label>Join Date</Label>
                  <p className="font-medium">
                    {(selectedForView.employee_profile?.join_date &&
                      formatDateToShortString(
                        selectedForView.employee_profile?.join_date
                      )) ||
                      "—"}
                  </p>
                </div>
                <div>
                  <Label>CNIC</Label>
                  <p className="font-medium">
                    {selectedForView?.employee_profile?.cnic ?? "-"}
                  </p>
                </div>
                <div>
                  <Label>Address</Label>
                  <p className="font-medium max-w-2xs">
                    {selectedForView?.employee_profile?.address ?? "-"}
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-fit">
                  <Label>Status</Label>
                  <Badge
                    variant={
                      selectedForView.status === "active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedForView.status}
                  </Badge>
                </div>

                {/* // Place this inside the DialogContent, after the basic employee details grid */}
                <div className="mt-8 space-y-6 col-span-2">
                  <Label className="text-lg font-semibold tracking-tight">
                    Shift Schedule
                  </Label>

                  {selectedForView?.employee_shifts?.length > 0 ? (
                    <div className="space-y-6">
                      {/* WEEKDAYS SECTION */}
                      {selectedForView.employee_shifts
                        .filter((shift: any) => shift.type === "week_day")
                        .map((shift: any) => (
                          <div
                            key={shift.id}
                            className="border border-primary/30 rounded-xl overflow-hidden !bg-gradient-to-b from-primary/5 to-transparent shadow-sm"
                          >
                            {/* Header */}
                            <div className="bg-primary/10 px-4 py-3 border-b border-primary/20">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {/* <div className="p-2 bg-primary/20 rounded-lg">
                                    <Calendar className="h-5 w-5 text-primary" />
                                  </div> */}
                                  <div>
                                    <h4 className="font-semibold  text-lg">
                                      Weekdays
                                    </h4>
                                    <p className="text-xs  mt-0.5">
                                      Standard timings applied to all working
                                      weekdays
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Morning Shift */}
                                {(shift.morning_start_time ||
                                  shift.morning_end_time) && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      {/* <Sun className="h-4 w-4 text-amber-600" /> */}
                                      <span className="font-medium text-muted-foreground">
                                        Morning Shift
                                      </span>
                                    </div>
                                    <div className="bg-background border rounded-md px-4 py-3">
                                      <p className="font-medium">
                                        {formatTimeTo12Hour(
                                          shift.morning_start_time
                                        ) || "--:--"}
                                        <span className="mx-2 text-muted-foreground">
                                          →
                                        </span>
                                        {formatTimeTo12Hour(
                                          shift.morning_end_time
                                        ) || "--:--"}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Evening Shift */}
                                {(shift.evening_start_time ||
                                  shift.evening_end_time) && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      {/* <Moon className="h-4 w-4 text-indigo-600" /> */}
                                      <span className="font-medium text-muted-foreground">
                                        Evening Shift
                                      </span>
                                    </div>
                                    <div className="bg-background border rounded-md px-4 py-3">
                                      <p className="font-medium">
                                        {formatTimeTo12Hour(
                                          shift.evening_start_time
                                        ) || "--:--"}
                                        <span className="mx-2 text-muted-foreground">
                                          →
                                        </span>
                                        {formatTimeTo12Hour(
                                          shift.evening_end_time
                                        ) || "--:--"}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* No shifts case */}
                                {!shift.morning_start_time &&
                                  !shift.morning_end_time &&
                                  !shift.evening_start_time &&
                                  !shift.evening_end_time && (
                                    <div className="col-span-2 text-center py-8 text-muted-foreground italic">
                                      No standard weekday timings defined
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        ))}

                      {/* REST / SPECIAL DAYS SECTION */}
                      <div className="border rounded-xl overflow-hidden bg-muted/10 ">
                        {/* Header */}
                        <div className="bg-muted/30 px-6 py-4 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* <div className="p-2 bg-muted rounded-lg">
                                <Snowflake className="h-5 w-5 text-blue-500" />
                              </div> */}
                              <div>
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                  Rest / Special Days
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs"
                                  >
                                    {
                                      selectedForView.employee_shifts.filter(
                                        (s: any) => s.type === "rest_day"
                                      ).length
                                    }
                                  </Badge>
                                </h4>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  Custom schedules or full rest days
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Rest days list */}
                        <div className="p-6 space-y-5 ">
                          {selectedForView.employee_shifts
                            .filter((shift: any) => shift.type === "rest_day")
                            .map((shift: any) => (
                              <div
                                key={shift.id}
                                className="border rounded-lg p-5  bg-gradient-to-b from-primary/5 to-transparent hover:bg-card/80 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <h5 className="font-medium text-base">
                                    {shift.rest_day_name}
                                  </h5>
                                  <Badge variant="outline" className="text-xs">
                                    Special Day
                                  </Badge>
                                </div>

                                {shift.morning_start_time ||
                                shift.morning_end_time ||
                                shift.evening_start_time ||
                                shift.evening_end_time ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Morning */}
                                    {(shift.morning_start_time ||
                                      shift.morning_end_time) && (
                                      <div className="space-y-2 ">
                                        <div className="flex items-center gap-2">
                                          {/* <Sun className="h-4 w-4 text-amber-600" /> */}
                                          <span className="text-sm font-medium text-muted-foreground">
                                            Morning
                                          </span>
                                        </div>
                                        <div className="bg-background border rounded-md px-4 py-3">
                                          <p className="font-medium">
                                            {formatTimeTo12Hour(
                                              shift.morning_start_time
                                            ) || "--:--"}
                                            <span className="mx-2 text-muted-foreground">
                                              →
                                            </span>
                                            {formatTimeTo12Hour(
                                              shift.morning_end_time
                                            ) || "--:--"}
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {/* Evening */}
                                    {(shift.evening_start_time ||
                                      shift.evening_end_time) && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          {/* <Moon className="h-4 w-4 text-indigo-600" /> */}
                                          <span className="text-sm font-medium text-muted-foreground">
                                            Evening
                                          </span>
                                        </div>
                                        <div className="bg-background border rounded-md px-4 py-3">
                                          <p className="font-medium">
                                            {formatTimeTo12Hour(
                                              shift.evening_start_time
                                            ) || "--:--"}
                                            <span className="mx-2 text-muted-foreground">
                                              →
                                            </span>
                                            {formatTimeTo12Hour(
                                              shift.evening_end_time
                                            ) || "--:--"}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 bg-green-50/40 rounded-lg border border-green-200">
                                    <p className="text-green-700 font-medium">
                                      Full Rest Day — No shifts scheduled
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}

                          {selectedForView.employee_shifts.filter(
                            (s: any) => s.type === "rest_day"
                          ).length === 0 && (
                            <div className="text-center py-10 text-muted-foreground italic bg-muted/30 rounded-lg">
                              No special or rest days configured for this
                              employee
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground italic bg-muted/30 rounded-lg border border-dashed">
                      No shift schedule information available for this employee
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Toggle Confirmation */}
      <AlertDialog
        open={!!confirmToggle}
        onOpenChange={() => setConfirmToggle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {confirmToggle?.current === "active" ? "deactivate" : "activate"}{" "}
              this employee?
              <div className="flex items-center space-x-3 mt-2">
                <Checkbox
                  id="blackList"
                  checked={blackList}
                  onCheckedChange={(checked) => {
                    setBlackList(checked as boolean);
                    if (!checked) {
                      setBlackList(false);
                    }
                  }}
                  className="h-5 w-5 text-primary focus:ring-primary"
                />
                <Label
                  htmlFor="blackList"
                  className="text-base font-medium cursor-pointer"
                >
                  Add to black List?
                </Label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleFun}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
