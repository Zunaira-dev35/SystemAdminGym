// src/pages/Payroll.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DollarSign,
  Download,
  FileText,
  Calendar,
  TrendingUp,
  Edit2,
  Save,
  X,
  Filter,
  RotateCcw,
  Search,
  Edit,
  Notebook,
  CreditCard,
  Banknote,
  Eye,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DetailDrawer } from "@/components/shared/DetailDrawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppDispatch, RootState } from "@/redux/store";
import {
  editPayrollAsyncThunk,
  generatePayrollAsyncThunk,
  getPayrollAsyncThunk,
  payPayrollAsyncThunk,
} from "@/redux/pagesSlices/generalSlice";
import Pagination from "@/components/shared/Pagination";

// Export Libraries
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Fixed import
import Loading from "@/components/shared/loaders/Loading";

import CustomCheckbox from "@shared/CustomCheckbox";
import { PERMISSIONS } from "@/permissions/permissions";
import { usePermissions } from "@/permissions/usePermissions";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { backendBasePath } from "@/constants";
import PayrollReceiptModal from "@/components/shared/modal/PayrollReceiptModal";
import { HrmActionsProvider } from "@/contexts/HrmActionsContext";
import { useOutletContext, useLocation, useNavigate } from "react-router-dom";
import PayrollActions from "@/components/PayrollActions";
import { getBanksAsyncThunk } from "@/redux/pagesSlices/financeSlice";
import { exportToPDF } from "@/utils/exportToPdf";
import { formatDateToShortString } from "@/utils/helper";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { Badge } from "@/components/ui/badge";

const monthMap: Record<string, string> = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

const monthNames = Object.keys(monthMap);
const currentYearNum = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) =>
  (currentYearNum - 2 + i).toString(),
);

export default function Payroll() {
  const { setActions } = useOutletContext<{
    setActions: (actions: React.ReactNode) => void;
  }>();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const { selectedBranchId } = useSelector((state: any) => state.general);
  const { branchesList } = useSelector((state: any) => state.plan);
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const authUser = useSelector((state: any) => state.auth?.user);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [banks, setBanks] = useState<any[]>([]);
  useEffect(() => {
    // if (hasPermission(PERMISSIONS.BANK_VIEW)) { // optional: add permission check
    dispatch(
      getBanksAsyncThunk({
        disable_page_param: 1,
        filter_branch_id: authUser?.logged_branch?.id,
      }),
    )
      .unwrap()
      .then((response: any) => {
        // console.log("response?.data", response?.data);
        setBanks(response?.data || []); // adjust according to your API response structure
      })
      .catch((err) => {
        // console.error("Failed to load banks:", err);
        toast({
          title: "Error",
          description: err.response.data.errors || "Failed to load bank list",
          variant: "destructive",
        });
      });
    // }
  }, [dispatch, authUser?.logged_branch?.id]);
  const today = new Date();
  const currentMonthName = today
    .toLocaleString("en-US", { month: "long" })
    .toLowerCase();
  const currentYearStr = today.getFullYear().toString();

  // States
  const [filterMonth, setFilterMonth] = useState<string | null>(
    currentMonthName,
  );
  const [filterYear, setFilterYear] = useState<string | null>(currentYearStr);
  const [tempMonth, setTempMonth] = useState(filterMonth || currentMonthName);
  const [tempYear, setTempYear] = useState(filterYear || currentYearStr);
  const [genMonth, setGenMonth] = useState(currentMonthName);
  const [genYear, setGenYear] = useState(currentYearStr);

  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [tempFilterMonth, setTempFilterMonth] = useState(filterMonth);
  const [tempFilterYear, setTempFilterYear] = useState(filterYear);
  // Modal states
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<String>("");
  const [openPayrollReceipt, setOpenPayrollReceipt] = useState(false);
  const [selectedPayrollRecord, setSelectedPayrollRecord] = useState<any>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedPayrollForPayment, setSelectedPayrollForPayment] =
    useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "cash" | "bank" | ""
  >("");
  const [payLoading, setPayLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    payroll_month: "",
    user_id: 0,
    // cheat_minutes: 0,
    // absent_days: 0,
    // leave_days: 0,
    // holiday_days: 0,
    cheat_deduction: 0,
    absent_deduction: 0,
    net_payable: 0,
  });

  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined,
  );

  // New states for Generate Payroll dialog
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<
    string | undefined
  >(undefined);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  // const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(undefined);
  const [startDateError, setStartDateError] = useState("");
  const [endDateError, setEndDateError] = useState("");
  // const [generateLoading, setGenerateLoading] = useState(false);
  const { payrolls, loadings } = useSelector(
    (state: RootState) => state.general,
  );
  const generateLoading = loadings.generatePayroll;
  const editLoading = loadings.editLoading;
  const getLoading = loadings.getPayroll;
  // Filters
  const payrollMonthFilter =
    filterMonth && filterYear ? `${filterYear}-${monthMap[filterMonth]}` : null;

  const branchId = selectedBranchId === "all" ? undefined : selectedBranchId;

  function convertCurrencySymbol(symbol: string): string {
    if (!symbol) return "";
    if (symbol === "\u20a8") {
      return "Rs";
    }
    return symbol;
  }
  // Filter text for display
  const filterText = useMemo(() => {
    if (!filterMonth && !filterYear) return "Filter by Month/Year";
    const monthName = filterMonth
      ? monthNames
          .find((m) => m === filterMonth)
          ?.charAt(0)
          .toUpperCase() + filterMonth.slice(1)
      : "";
    return `${monthName || ""} ${filterYear || ""}`.trim();
  }, [filterMonth, filterYear]);

  // Handle filter apply
  const handleFilter = () => {
    setFilterMonth(tempFilterMonth === "all" ? null : tempFilterMonth);
    setFilterYear(tempFilterYear === "all" ? null : tempFilterYear);
    setFilterOpen(false);
    setCurrentPage(1);
  };

  const navigate = useNavigate();
  // Fetch payrolls
  const fetchPayrolls = useCallback(() => {
    const params: any = {
      page: currentPage,
      limit: recordsPerPage,
      search: searchTerm,
      filter_branch_id: filterBranchId,
    };

    if (payrollMonthFilter && authUser?.user_type === "other")
      params.payroll_month = payrollMonthFilter;
    if (branchId) params.filter_branch_id = branchId;

    dispatch(getPayrollAsyncThunk(params));
  }, [
    dispatch,
    currentPage,
    recordsPerPage,
    payrollMonthFilter,
    branchId,
    searchTerm,
    filterBranchId,
  ]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  // Handlers
  // const handleGeneratePayroll = () => {
  //   const monthToGenerate = `${genYear}-${monthMap[genMonth]}`;
  //   dispatch(generatePayrollAsyncThunk({ payroll_month: monthToGenerate }))
  //     .unwrap()
  //     .then(() => {
  //       toast({
  //         title: "Success",
  //         description: "Payroll generated successfully!",
  //       });
  //       setGenModalOpen(false);
  //       fetchPayrolls();
  //     })
  //     .catch((err) => {
  //       toast({
  //         title: "Error",
  //         description: err.message || "Failed to generate payroll",
  //         variant: "destructive",
  //       });
  //     });
  // };
  const handleConfirmPayment = async () => {
    if (!selectedPayrollForPayment || !selectedPaymentMethod) return;

    setPayLoading(true);

    try {
      const data = new FormData();
      data.append("payroll_id", selectedPayrollForPayment.id);
      data.append("payment_method", selectedPaymentMethod);
      if (selectedPaymentMethod === "bank") {
        if (!selectedBankId) {
          // setErrors("Please select a bank account for bank transfer");
          return;
        }
        data.append("bank_id", selectedBankId);
      }
      await dispatch(payPayrollAsyncThunk({ data })).unwrap();

      toast({
        title: "Payment Successful",
        description: `${selectedPayrollForPayment.user?.name}'s payroll has been marked as paid via ${selectedPaymentMethod}.`,
      });

      setPayModalOpen(false);
      fetchPayrolls();
    } catch (err: any) {
      toast({
        title: "Payment Failed",
        description:
          err?.response?.data?.errors ||
          err.message ||
          "Could not process payment",
        variant: "destructive",
      });
    } finally {
      setPayLoading(false);
    }
  };
  const applyFilter = () => {
    setFilterMonth(tempMonth);
    setFilterYear(tempYear);
    setCurrentPage(1);
    setFilterModalOpen(false);
  };

  const clearFilter = () => {
    setFilterMonth(null);
    setFilterYear(null);
    setTempMonth(currentMonthName);
    setTempYear(currentYearStr);
    setCurrentPage(1);
    setFilterModalOpen(false);
  };

  const openEditModal = (record: any) => {
    setEditingRecord(record);
    setEditForm({
      payroll_month: record.payroll_month,
      user_id: record.user?.id || 0,
      // cheat_minutes: record.cheat_minutes || 0,
      // absent_days: record.absent_days || 0,
      // leave_days: record.leave_days || 0,
      // holiday_days: record.holiday_days || 0,
      cheat_deduction: record.cheat_deduction || 0,
      absent_deduction: record.absent_deduction || 0,
      net_payable: record.net_payable || 0,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;
    dispatch(editPayrollAsyncThunk({ id: editingRecord.id, ...editForm }))
      .unwrap()
      .then(() => {
        toast({
          title: "Updated",
          description: "Payroll updated successfully",
        });
        setEditModalOpen(false);
        fetchPayrolls();
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err.response?.data?.errors || "Failed to update",
          variant: "destructive",
        });
      });
  };

  const displayFilterText =
    filterMonth && filterYear
      ? `${
          filterMonth.charAt(0).toUpperCase() + filterMonth.slice(1)
        } ${filterYear}`
      : "All Time";

  // Export CSV
  const csvData =
    payrolls?.data?.map((r: any) => ({
      "Employee Name": `${r.user?.first_name} ${r.user?.last_name}`,
      "Reference No": r.user?.reference_num || "",
      "Basic Salary": r.basic_salary,
      "Absent Days": r.absent_days || 0,
      "Leave Days": r.leave_days || 0,
      "Cheat Deduction": r.cheat_deduction || 0,
      "Absent Deduction": r.absent_deduction || 0,
      "Total Deduction": (
        parseFloat(r.absent_deduction || "0") +
        parseFloat(r.cheat_deduction || "0")
      ).toFixed(2),
      "Net Payable": r.net_payable,
      "Payroll Month": r.payroll_month,
    })) || [];

  // Fixed PDF Export
  const exportPDF = useCallback(() => {
    const dataToExport =
      selectedIds.size > 0
        ? payrolls?.data?.filter((r: any) => selectedIds.has(r.id))
        : payrolls?.data || [];

    if (dataToExport.length === 0) {
      toast({ title: "No payroll records to export", variant: "destructive" });
      return;
    }

    // Get selected branch info
    const selectedBranch = filterBranchId
      ? branchesList?.find((b: any) => b.id === Number(filterBranchId))
      : null;

    // Format period (Month + Year)
    const periodText =
      filterMonth && filterYear
        ? `${filterMonth.charAt(0).toUpperCase() + filterMonth.slice(1)} ${filterYear}`
        : "All Time";

    // Currency (fallback to PKR/Rs)
    const rawCurrency = payrolls?.data?.[0]?.system_currency || "Rs";
    const currency = convertCurrencySymbol(rawCurrency);

    const totalNetPayable = dataToExport.reduce(
      (sum: number, record: any) => sum + parseFloat(record.net_payable || 0),
      0,
    );

    exportToPDF({
      title: "Payroll Report",
      subtitle: `${periodText}`,
      filenamePrefix: "Payroll",

      // dateRange: undefined,

      branchInfo: selectedBranch
        ? {
            name: selectedBranch.name || "All Branches",
            address: selectedBranch.address || "",
            reference_num: selectedBranch.reference_num,
          }
        : null,

      columns: [
        { title: "Employee", dataKey: "employee", align: "left", width: 40 },
        // { title: "Ref No",       dataKey: "refNo",        align: "left", width: 35 },
        {
          title: "Basic Salary",
          dataKey: "basicSalary",
          align: "left",
          width: 35,
        },
        { title: "Time Period", dataKey: "month", align: "left", width: 55 },
        {
          title: "Deductions",
          dataKey: "deductions",
          align: "left",
          width: 40,
        },
        {
          title: "Net Payable",
          dataKey: "netPayable",
          align: "left",
          width: 50,
        },
        {
          title: "Status",
          dataKey: "status",
          align: "left",
          width: 50,
        },
      ],

      data: dataToExport,

      getRowData: (record: any) => ({
        employee: ` ${record.user?.name || ""} 
  ${record.user?.reference_num || "—"} `.trim(),
        // refNo: record.user?.reference_num || "—",
        basicSalary: `${currency} ${parseFloat(record.basic_salary || 0).toLocaleString("en-IN")}`,
        month:
          `${formatDateToShortString(record.period_start)} - ${" "} ${formatDateToShortString(record.period_end)}` ||
          "—",
        deductions: `${currency} ${(
          parseFloat(record.absent_deduction || "0") +
          parseFloat(record.cheat_deduction || "0")
        ).toFixed(2)}`,
        netPayable: `${currency} ${parseFloat(
          record.net_payable || 0,
        ).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}`,
        status: `${record.status.toUpperCase() || ""} `,
      }),

      footerCallback: (doc: jsPDF, finalY: number) => {
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(
          `Total Net Payable: ${currency} ${totalNetPayable.toLocaleString("en-IN")}`,
          14,
          finalY + 10,
        );
      },
    });
  }, [
    payrolls?.data,
    selectedIds,
    filterMonth,
    filterYear,
    filterBranchId,
    branchesList,
  ]);

  const handleGeneratePayroll = async (payload: {
    start_date: string;
    end_date: string;
    employee_id?: string;
    branch_id?: string;
  }) => {
    // Validate
    if (!payload.start_date || !payload.end_date) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (new Date(payload.start_date) > new Date(payload.end_date)) {
      toast({
        title: "Error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    // setGenerateLoading(true);

    try {
      await dispatch(
        generatePayrollAsyncThunk({
          start_date: payload.start_date,
          end_date: payload.end_date,
          user_id: payload.employee_id || null, // null = all employees
          // branch_id: payload.branch_id || null,      // null = all branches
        }),
      ).unwrap();

      toast({
        title: "Success",
        description: payload.employee_id
          ? `Payroll generated for ${
              selectedEmployeeName || "selected employee"
            }`
          : "Payroll generated for all employees",
      });

      // Refresh list
      fetchPayrolls(); // or dispatch your fetch thunk again

      // Reset form states
      setStartDate("");
      setEndDate("");
      setSelectedEmployeeId(undefined);
      setSelectedEmployeeName("");
      // setSelectedBranchId(undefined);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.errors ||
          error.message ||
          "Failed to generate payroll",
        variant: "destructive",
      });
    } finally {
      // setGenerateLoading(false);
    }
  };
  useEffect(() => {
    setActions(
      <PayrollActions
        selectedCount={selectedIds.size}
        onExportPDF={exportPDF}
        filterText={displayFilterText}
        authUser={authUser}
        onFilterChange={(month, year) => {
          setFilterMonth(month);
          setFilterYear(year);
          setCurrentPage(1);
        }}
        onGeneratePayroll={handleGeneratePayroll} // ← This is your new handler
        generateLoading={generateLoading}
      />,
    );

    return () => setActions(null);
  }, [
    selectedIds.size,
    exportPDF,
    displayFilterText,
    generateLoading,
    setActions,
    authUser,
  ]);
  return (
    // <HrmActionsProvider actions={actionButtons}>
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      {authUser?.user_type === "other" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Payroll
              </CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {authUser?.system_currency}{" "}
                {Number(payrolls?.summary?.total_payroll || 0).toLocaleString(
                  "en-IN",
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {displayFilterText}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Employees Paid
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {payrolls?.summary?.total_employees_paid || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Attendance
              </CardTitle>
              <Calendar className="h-5 w-5 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {payrolls?.summary?.avg_attendance_days || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Days per employee
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table + Pagination */}
      <Card>
        <CardHeader>
          <div className="flex justify-between flex-wrap items-center">
            <CardTitle className="flex gap-2">
              <Notebook className="text-primary" /> Payroll
            </CardTitle>
            {authUser?.user_type === "other" && (
              <div className="flex items-center gap-2">
                <HeaderBranchFilter onBranchChange={setFilterBranchId} />
                {/* Date Filter Button/Dialog – moved here */}
                <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-2 bg-background h-2.5 mt-2 border-input text-sm"
                    >
                      <Filter className="h-4 w-4" />
                      {filterText}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Filter Payroll</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div>
                        <Label>Month</Label>
                        <Select
                          value={tempFilterMonth || "all"}
                          onValueChange={setTempFilterMonth}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Months</SelectItem>
                            {monthNames.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m.charAt(0).toUpperCase() + m.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Year</Label>
                        <Select
                          value={tempFilterYear || ""}
                          onValueChange={setTempFilterYear}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Years" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            {years.map((y) => (
                              <SelectItem key={y} value={y}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setFilterOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleFilter}>Apply Filter</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 mt-1 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search employee..."
                    className="pl-10 w-64"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* <TableHead className="w-12">
                      <CustomCheckbox
                        checked={selectAll}
                        onChange={(checked) => {
                          setSelectAll(checked);
                          if (checked) {
                            setSelectedIds(new Set(payrolls?.data?.map((r: any) => r.id) || []));
                          } else {
                            setSelectedIds(new Set());
                          }
                        }}
                      />
                    </TableHead> */}
                    <TableHead>Employee</TableHead>
                    <TableHead>Basic Salary</TableHead>
                    <TableHead>Time Period</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Payable</TableHead>
                    <TableHead>Status</TableHead>
                    {authUser?.user_type === "other" && (
                      <TableHead>Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        <Loading />
                      </TableCell>
                    </TableRow>
                  ) : !payrolls?.data?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-10 text-muted-foreground"
                      >
                        No Payroll Data
                      </TableCell>
                    </TableRow>
                  ) : (
                    payrolls.data.map((record: any) => (
                      <TableRow
                        key={record.id}
                        // className="hover:bg-muted/50 cursor-pointer"
                        // onClick={() => {
                        //   setSelectedEmployee(record);
                        //   setDetailDrawerOpen(true);
                        // }}
                      >
                        {/* <TableCell>
                            <CustomCheckbox
                              checked={selectedIds.has(record.id)}
                              onChange={(checked) => {
                                const newIds = new Set(selectedIds);
                                if (checked) newIds.add(record.id);
                                else newIds.delete(record.id);
                                setSelectedIds(newIds);
                                setSelectAll(newIds.size === payrolls?.data?.length && payrolls?.data?.length > 0);
                              }}
                            />
                          </TableCell> */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              {record?.user?.profile_image ? (
                                <AvatarImage
                                  src={`${backendBasePath}${record?.user?.profile_image}`}
                                  alt={record?.user?.name}
                                />
                              ) : null}
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {record?.user?.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {record?.user?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: {record?.user?.reference_num}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {record?.system_currency}{" "}
                          {parseFloat(record.basic_salary).toLocaleString(
                            "en-IN",
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDateToShortString(record.period_start)} -{" "}
                          {formatDateToShortString(record.period_end)}
                        </TableCell>
                        <TableCell className="text-primary">
                          {record?.system_currency}{" "}
                          {(
                            parseFloat(record.absent_deduction || "0") +
                            parseFloat(record.cheat_deduction || "0")
                          ).toFixed(2)}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {record?.system_currency}{" "}
                          {parseFloat(record.net_payable).toLocaleString(
                            "en-IN",
                            { minimumFractionDigits: 2 },
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          <Badge
                            variant={
                              record?.status === "paid"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {record?.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex gap-2">
                          {authUser?.user_type === "other" && (
                            <div className="flex items-center gap-2">
                              {/* Existing Edit button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  navigate(`/payroll/${record.id}`)
                                }
                              >
                                <Eye className="h-5 w-5" />
                              </Button>
                              {record?.status !== "paid" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditModal(record)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}

                              {/* Existing View Slip */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayrollRecord(record);
                                  setOpenPayrollReceipt(true);
                                }}
                              >
                                View Slip
                              </Button>

                              {/* ← NEW: Pay Button */}
                              {record.status === "unpaid" && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className=""
                                  onClick={() => {
                                    setSelectedPayrollForPayment(record);
                                    setSelectedPaymentMethod(""); // reset
                                    setPayModalOpen(true);
                                  }}
                                  disabled={
                                    record.status === "paid" || payLoading
                                  } // optional: disable if already paid
                                >
                                  <Banknote className="h-4 w-4 mr-1" />
                                  Pay
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                recordsPerPage={recordsPerPage}
                setRecordsPerPage={setRecordsPerPage}
                totalRecords={payrolls?.meta.total || 0}
                recordsPerPageOptions={[5, 10, 20, 50]}
              />
            </div>
          </>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Edit Payroll - {selectedEmployee?.user?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {[
              // "cheat_minutes",
              "cheat_deduction",
              // "absent_days",
              "absent_deduction",
              // "leave_days",
              // "holiday_days",
              "net_payable",
            ].map((key) => (
              <div key={key}>
                <Label className="capitalize">{key.replace(/_/g, " ")}</Label>
                <Input
                  type="number"
                  value={(editForm as any)[key]}
                  onChange={(e) =>
                    setEditForm({ ...editForm, [key]: +e.target.value })
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={editLoading}>
              <Save className="h-4 w-4 mr-2" />
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payroll Payment</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedPayrollForPayment?.user?.name} •{" "}
              {selectedPayrollForPayment?.system_currency}{" "}
              {parseFloat(
                selectedPayrollForPayment?.net_payable || 0,
              ).toLocaleString("en-IN")}
            </p>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label>Select Payment Method</Label>
              <Select
                value={selectedPaymentMethod}
                onValueChange={(value: "cash" | "bank") =>
                  setSelectedPaymentMethod(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" /> Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="bank">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Bank Transfer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {selectedPaymentMethod === "bank" && (
                <div className="space-y-2 mt-6 animate-fade-in">
                  <Label className="flex items-center gap-2">
                    {/* <Building2 className="h-4 w-4" /> */}
                    Select Bank
                    <span className="text-red-500">*</span>
                  </Label>

                  {banks.length > 0 ? (
                    <Select
                      value={selectedBankId}
                      onValueChange={setSelectedBankId}
                      required
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choose bank account" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map((bank: any) => (
                          <SelectItem key={bank.id} value={bank.id.toString()}>
                            {bank.reference_num}
                            {/* {bank.name &&
                                                  ` (${bank.name})`} */}
                            {bank.name && ` - ${bank.name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                      No bank accounts found for this branch
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedPaymentMethod && (
              <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-1">
                <p className="font-medium">Payment Summary</p>
                <p>
                  Amount:{" "}
                  <strong>
                    {selectedPayrollForPayment?.system_currency}{" "}
                    {parseFloat(
                      selectedPayrollForPayment?.net_payable,
                    ).toLocaleString("en-IN")}
                  </strong>
                </p>
                <p>
                  Method:{" "}
                  <strong className="capitalize">
                    {selectedPaymentMethod}
                  </strong>
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPayModalOpen(false)}
              disabled={payLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={!selectedPaymentMethod || payLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {payLoading ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PayrollReceiptModal
        receipt={selectedPayrollRecord}
        open={openPayrollReceipt}
        onClose={() => setOpenPayrollReceipt(false)}
      />
    </div>
    // </HrmActionsProvider>
  );
}
