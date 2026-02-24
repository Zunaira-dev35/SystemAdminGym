// src/pages/hrm/AttendanceTabContent.tsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAttendenceAsyncThunk,
  createAttendenceAsyncThunk,
  updateAttendenceAsyncThunk,
  deleteAttendenceAsyncThunk,
} from "@/redux/pagesSlices/hrmSlice";
import { getAllEmployeesAsyncThunk } from "@/redux/pagesSlices/peopleSlice";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronsUpDown,
  Check,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Pagination from "../shared/Pagination";
import Loading from "../shared/loaders/Loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { backendBasePath } from "@/constants";
import { PERMISSIONS } from "@/permissions/permissions";
import { DialogDescription } from "@radix-ui/react-dialog";
import DeleteConfirmationModal from "../shared/modal/DeleteConfirmationModal";
import { usePermissions } from "@/permissions/usePermissions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatDateToShortString, formatTimeTo12Hour } from "@/utils/helper";
import CustomCheckbox from "@shared/CustomCheckbox";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { HrmActionsProvider } from "@/contexts/HrmActionsContext";
import { useOutletContext } from "react-router-dom";
import AttendanceActions from "../AttendanceActions";
import { HeaderBranchFilter } from "../HeaderBranchFilter";
import { getCurrentBranchAsyncThunk } from "@/redux/pagesSlices/planSlice";
import { getShiftsAsyncThunk } from "@/redux/pagesSlices/feeCollectionSlice";
import { RootState } from "@/redux/store";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react"; // import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { addDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { exportToPDF } from "@/utils/exportToPdf";
interface FormErrors {
  user_id?: string;
  date?: string;
  check_in?: string;
  attendance_type?: string;
  // shift_id?: string;
}

export default function EmployeeAttendanceTab() {
  const dispatch = useDispatch<any>();
  const { attendence, loadings } = useSelector((state: any) => state.hrm);
  const { employees } = useSelector((state: any) => state.people);
  const { branchesList } = useSelector((state: any) => state.plan);

  const { setActions } = useOutletContext<{
    setActions: (actions: React.ReactNode) => void;
  }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Dialog states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const authUser = useSelector((state: any) => state.auth?.user);
  const [openEmployeeSelect, setOpenEmployeeSelect] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    date: new Date().toISOString().split("T")[0],
    check_in: "",
    check_out: "",
    // shift_id: "",
    attendance_type: "",
  });
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const { hasPermission } = usePermissions();
  const { selectedBranchId } = useSelector((state: any) => state.general);
  const { user } = useSelector((state: any) => state.auth);
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [selectedAttendanceType, setSelectedAttendanceType] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const { currentBranch } = useSelector((state: RootState) => state.plan);
  const { shifts, loadings: fetchShifts } = useSelector(
    (state: RootState) => state.feeCollection
  );
  const navigate = useNavigate();

  const fetchAttendance = () => {
    let startDate = dateRange?.from
      ? format(dateRange.from, "yyyy-MM-dd")
      : undefined;

    let endDate = dateRange?.to
      ? format(dateRange.to, "yyyy-MM-dd")
      : startDate;
    dispatch(
      getAttendenceAsyncThunk({
        params: {
          user_type: "employee",
          page: currentPage,
          limit: recordsPerPage,
          ...(startDate && { start_date: startDate }),
          ...(endDate && { end_date: endDate }),
          search: searchTerm || undefined,
          filter_branch_id: filterBranchId,
        },
      })
    );
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentPage, recordsPerPage, searchTerm, filterBranchId, dateRange]);
  useEffect(() => {
    dispatch(getCurrentBranchAsyncThunk({ disable_page_param: 1 }));
  }, [dispatch]);
  // useEffect(() => {
  //   if (currentBranch?.id) {
  //     dispatch(
  //       getShiftsAsyncThunk({
  //         disable_page_param: 1,
  //         filter_status: "active",
  //         filter_branch_id: currentBranch.id,
  //       })
  //     );
  //   }
  // }, [dispatch, currentBranch]);
  useEffect(() => {
    if (
      // (isApplyDialogOpen || isEditDialogOpen) &&
      (!employees.data || employees.data.length === 0) &&
      hasPermission(PERMISSIONS.EMPLOYEE_VIEW)
    ) {
      dispatch(
        getAllEmployeesAsyncThunk({ params: { disable_page_param: 1 } })
      );
    }
  }, [isApplyDialogOpen, isEditDialogOpen, dispatch]);
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, searchTerm, filterBranchId]);

  const employeeList = employees?.data?.data || employees?.data || [];
  console.log("employeeList", employees);
  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (authUser.user_type === "employee" && authUser?.id) {
      setFormData({
        ...formData,
        user_id: String(authUser?.id),
      });
    } else if (!formData.user_id) {
      newErrors.user_id = "Please select an employee";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    if (!formData.check_in) {
      newErrors.check_in = "Check-in time is required";
    }
    // if (!formData.shift_id && !selectedShift) {
    //   newErrors.shift_id = "Shift is required";
    // } 

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reusable Error Message Component
  const ErrorMessage = ({ field }: { field: keyof FormErrors }) => {
    if (!errors[field]) return null;
    return <p className="text-red-500 text-xs mt-1">{errors[field]}</p>;
  };

  const openAddDialog = () => {
    setIsEditMode(false);
    setSelectedRecord(null);
    setFormData({
      user_id: "",
      date: new Date().toISOString().split("T")[0],
      check_in: "",
      check_out: "",
    });
    setErrors({});
    setIsAddEditOpen(true);
  };

  const openEditDialog = (record: any) => {
    setIsEditMode(true);
    setSelectedRecord(record);
    setFormData({
      user_id: String(record.user_id),
      date: record.date,
      check_in: record.checkin_time?.substring(0, 5) || "",
      check_out: record.checkout_time?.substring(0, 5) || "",
      // shift_id: record.shift.id || "",
    });
    setSelectedShift(record.shift?.id?.toString() || "");
    setErrors({});
    setIsAddEditOpen(true);
  };

  const openDeleteDialog = (id: number) => {
    setRecordToDelete(id);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    const payload = new FormData();
    payload.append("user_id", formData.user_id);
    payload.append("user_type", "employee");
    payload.append("date", formData.date);
    // payload.append("shift_id", selectedShift);

    payload.append("checkin_type", "manual");

    if (formData.check_in) {
      payload.append("checkin_time", formData.check_in);
    }
    if (formData.check_out) {
      payload.append("checkout_time", formData.check_out);
    }
    if (selectedAttendanceType) {
      payload.append("attendance_type", selectedAttendanceType);
    }

    if (isEditMode && selectedRecord?.id) {
      payload.append("attendance_id", String(selectedRecord.id));
    }

    try {
      if (isEditMode) {
        await dispatch(updateAttendenceAsyncThunk({ data: payload })).unwrap();
        toast({
          title: "Success",
          description: "Attendance updated successfully!",
        });
      } else {
        await dispatch(createAttendenceAsyncThunk({ data: payload })).unwrap();
        toast({
          title: "Success",
          description: "Attendance marked successfully!",
        });
      }
      setIsAddEditOpen(false);
      setErrors({});
      fetchAttendance();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.errors || "Operation failed",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;

    try {
      setActionLoading(recordToDelete);
      await dispatch(
        deleteAttendenceAsyncThunk({ attendance_id: recordToDelete })
      ).unwrap();
      toast({
        title: "Success",
        description: "Attendance deleted successfully",
      });
      fetchAttendance();
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to delete attendance",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
      setIsDeleteOpen(false);
      setRecordToDelete(null);
    }
  };

  const exportPDF = useCallback(() => {
    const selectedRecords = attendence.data.filter((r: any) =>
      selectedIds.has(r.id)
    );

    if (selectedRecords.length === 0) {
      toast({ title: "No records selected", variant: "destructive" });
      return;
    }

    // Get selected branch info
    const selectedBranch = filterBranchId
      ? branchesList?.find((b: any) => b.id === Number(filterBranchId))
      : null;

    exportToPDF({
      title: "Employee Attendance Report",
      // subtitle: `${selectedRecords.length} record${selectedRecords.length !== 1 ? "s" : ""} selected`,
      filenamePrefix: "Employee_Attendance",

      dateRange: dateRange ? {
        from: dateRange.from,
        to: dateRange.to
      } : undefined,

      branchInfo: selectedBranch
        ? {
          name: selectedBranch.name || "—",
          address: selectedBranch.address || "",
          reference_num: selectedBranch.reference_num,
        }
        : null,

      columns: [
        { title: "Employee", dataKey: "employee", align: "left", width: 45 },
        { title: "ID", dataKey: "id", align: "center", width: 40 },
        { title: "Date", dataKey: "date", align: "center", width: 45 },
        { title: "Shift", dataKey: "shift", align: "center", width: 70 },
        { title: "Check In", dataKey: "checkIn", align: "center", width: 35 },
        { title: "Check Out", dataKey: "checkOut", align: "center", width: 35 },
      ],

      data: selectedRecords,

      getRowData: (record: any) => {
        const user = record.user || {};
        const shift = record.shift || {};

        const shiftText = [
          record.attendance_type || "—",
          record.shift_start_time && record.shift_end_time
            ? `${formatTimeTo12Hour(record.shift_start_time)} - ${formatTimeTo12Hour(record.shift_end_time)}`
            : ""
        ].filter(Boolean).join("  ");

        return {
          employee: (user.name || "—").toUpperCase(),
          id: user.reference_num || "—",
          date: formatDateToShortString(record.date) || "—",
          shift: shiftText || "—",
          checkIn: record.checkin_time ? formatTimeTo12Hour(record.checkin_time) : "—",
          checkOut: record.checkout_time ? formatTimeTo12Hour(record.checkout_time) : "—",
        };
      },
    });
  }, [
    attendence.data,
    selectedIds,
    dateRange,
    filterBranchId,
    branchesList,
  ]);
  //   const exportPDF = useCallback(() => {
  //   const selectedRecords = attendence.data.filter((r: any) =>
  //     selectedIds.has(r.id)
  //   );

  //   if (selectedRecords.length === 0) {
  //     toast({ title: "No records selected", variant: "destructive" });
  //     return;
  //   }

  //   const doc = new jsPDF("l", "mm", "a4");

  //   doc.setFontSize(18);
  //   doc.text("Employee Attendance Report", 14, 20);

  //   doc.setFontSize(12);
  //   doc.text(
  //     `Generated on: ${format(new Date(), "dd MMM yyyy • hh:mm a")} • ${selectedRecords.length} record(s)`,
  //     14,
  //     30
  //   );

  //   let periodY = 38;
  //   doc.setFontSize(11);
  //   if (dateRange?.from && dateRange?.to) {
  //     doc.text(
  //       `Period: ${format(dateRange.from, "dd MMM yyyy")} – ${format(dateRange.to, "dd MMM yyyy")}`,
  //       14,
  //       periodY
  //     );
  //   } else if (dateRange?.from) {
  //     doc.text(`Date: ${format(dateRange.from, "dd MMM yyyy")}`, 14, periodY);
  //   } else {
  //     doc.text("Period: All Available Records", 14, periodY);
  //   }

  //   const tableData = selectedRecords.map((record: any) => {
  //     const user = record.user || {};
  //     const shift = record.shift || {};

  //     return [
  //       user.name || "—",                                   
  //       user.reference_num || "—",                          
  //       formatDateToShortString(record.date) || "—",        
  //       [
  //         record.attendance_type || "—",
  //         record.shift_start_time && record.shift_end_time
  //           ? `${formatTimeTo12Hour(record.shift_start_time)} - ${formatTimeTo12Hour(record.shift_end_time)}`
  //           : ""
  //       ].filter(Boolean).join("  "),                      
  //       record.checkin_time ? formatTimeTo12Hour(record.checkin_time) : "—",  
  //       record.checkout_time ? formatTimeTo12Hour(record.checkout_time) : "—", 
  //     ];
  //   });

  //   autoTable(doc, {
  //     head: [["Employee", "ID", "Date", "Shift", "Check In", "Check Out"]],
  //     body: tableData,
  //     startY: 48,
  //     styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak" },
  //     headStyles: {
  //       fillColor: [124, 59, 237],
  //       textColor: [255, 255, 255],
  //       fontStyle: "bold",
  //     },
  //     columnStyles: {
  //       0: { cellWidth: 40 },   
  //       1: { cellWidth: 35 },   
  //       2: { cellWidth: 45 },   
  //       3: { cellWidth: 65 },   
  //       4: { cellWidth: 40 },   
  //       5: { cellWidth: 40 },  
  //     },
  //     alternateRowStyles: { fillColor: [248, 250, 252] },
  //     margin: { top: 48 },
  //   });

  //   doc.save(`Employee_Attendance_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  // }, [attendence.data, selectedIds, dateRange]);

  // const actionButtons = (
  //   <>
  //     {hasPermission(PERMISSIONS.ATTENDANCE_EMPLOYEE_EXPORT) && (
  //       <Button variant="outline" size="sm" onClick={exportPDF}>
  //         <Download className="h-4 w-4 mr-2" />
  //         PDF ({selectedIds.size})
  //       </Button>
  //     )}
  //   </>
  // );

  useEffect(() => {
    setActions(
      <AttendanceActions
        selectedCount={selectedIds.size}
        onExportPDF={exportPDF}
      />
    );

    // Cleanup when leaving the tab
    return () => setActions(null);
  }, [selectedIds.size, exportPDF, setActions]);


  return (
    // <HrmActionsProvider actions={actionButtons}>
    <div className="px-6">
      {/* <div className="flex flex-col gap-4 pb-2 md:flex-row md:items-center md:justify-end">

        <div>
          <h1 className="text-3xl font-bold">Employee Attendance</h1>
          <p className="text-muted-foreground">Manage employee attendance</p>
        </div>
        {hasPermission(PERMISSIONS.ATTENDANCE_EMPLOYEE_EXPORT) && (
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF ({selectedIds.size})
          </Button>
        )}
      </div> */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>Attendance Records</CardTitle>
            </div>
            <div className="flex gap-3 flex-wrap">
              <HeaderBranchFilter onBranchChange={setFilterBranchId} />

              <div className="relative">
                <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-9 w-64"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              {/* Date Range Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[280px] justify-start text-left font-normal bg-background border-input mt-2",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd MMM")} -{" "}
                          {format(dateRange.to, "dd MMM yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd MMM yyyy")
                      )
                    ) : (
                      <span>Select date range</span>
                    )}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    initialFocus
                    className="rounded-md border"
                  />

                  <div className="p-3 border-t flex flex-wrap gap-2 justify-between items-center">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setDateRange({ from: new Date(), to: new Date() })
                        }
                      >
                        Today
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setDateRange({
                            from: new Date(),
                            to: addDays(new Date(), -1),
                          })
                        }
                      >
                        Yesterday
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setDateRange({
                            from: startOfMonth(new Date()),
                            to: endOfMonth(new Date()),
                          })
                        }
                      >
                        This Month
                      </Button>
                    </div>

                    {/* <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDateRange(undefined)}
                    >
                      Clear
                    </Button> */}
                  </div>
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
              <Button
                permission={[PERMISSIONS.ATTENDANCE_EMPLOYEE_CREATE]}
                onClick={() => {
                  authUser.user_type === "employee"
                    ? navigate("/check-in")
                    : openAddDialog();
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Attendance
              </Button>
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
                          new Set(attendence.data.map((r: any) => r.id))
                        );
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadings.getAllAttendence ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Loading />
                  </TableCell>
                </TableRow>
              ) : attendence.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                attendence.data.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <CustomCheckbox
                        checked={selectedIds.has(record.id)}
                        onChange={(checked) => {
                          const newIds = new Set(selectedIds);
                          if (checked) newIds.add(record.id);
                          else newIds.delete(record.id);
                          setSelectedIds(newIds);
                          setSelectAll(
                            newIds.size === attendence.data.length &&
                            attendence.data.length > 0
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {record.user?.profile_image && (
                            <AvatarImage
                              src={`${backendBasePath}${record.user.profile_image}`}
                            />
                          )}
                          <AvatarFallback>
                            {record.user?.name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{record.user?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {record.user?.reference_num}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDateToShortString(record.date)}
                    </TableCell>
                    <TableCell>
                      <p> {record?.attendance_type} </p>
                      <Badge variant="secondary">
                        {record?.shift_start_time &&
                          formatTimeTo12Hour(record?.shift_start_time)}
                        {" - "}
                        {record?.shift_end_time &&
                          formatTimeTo12Hour(record?.shift_end_time)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatTimeTo12Hour(record.checkin_time) || "—"}
                    </TableCell>
                    <TableCell>
                      {formatTimeTo12Hour(record.checkout_time) || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        permission={[PERMISSIONS.ATTENDANCE_EMPLOYEE_EDIT]}
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(record)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        permission={[PERMISSIONS.ATTENDANCE_EMPLOYEE_DELETE]}
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteDialog(record.id)}
                        disabled={actionLoading === record.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {!loadings.getAllAttendence && attendence.meta && (
          <Pagination
            recordsPerPage={recordsPerPage}
            setRecordsPerPage={setRecordsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalRecords={attendence.meta.total || 0}
            recordsPerPageOptions={[10, 20, 50]}
          />
        )}
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog
        open={isAddEditOpen}
        onOpenChange={() => {
          setIsAddEditOpen(!isAddEditOpen);
          setFormData({
            user_id: "",
            date: new Date().toISOString().split("T")[0],
            check_in: "",
            check_out: "",
            shift_id: "",
          });

          setSelectedShift("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit" : "Add"} Attendance</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Employee Select */}
            <div>
              <div className="mb-2">
                <Label className="mb-2">
                  Employee <span className="text-red-500">*</span>
                </Label>
              </div>
              {/* Case 1: User is an "employee" → Only show themselves */}
              {authUser?.user_type === "employee" ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {authUser?.profile_image ? (
                        <AvatarImage
                          src={`${backendBasePath}${authUser.profile_image}`}
                        />
                      ) : (
                        <AvatarFallback className="bg-primary/10">
                          {authUser?.name?.[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{authUser?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {authUser?.reference_num}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="animate-pulse">
                    You
                  </Badge>
                </div>
              ) : hasPermission(PERMISSIONS.EMPLOYEE_VIEW) ? (
                /* Case 2. Admins/HR with permission → Full searchable dropdown */
                <Popover
                  open={openEmployeeSelect}
                  onOpenChange={setOpenEmployeeSelect}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openEmployeeSelect}
                      className={cn(
                        "w-full justify-between font-normal",
                        !formData.user_id && "text-muted-foreground",
                        errors.user_id && "border-red-500"
                      )}
                    >
                      {formData.user_id
                        ? (() => {
                          const emp = employeeList.find(
                            (e: any) => String(e.id) === formData.user_id
                          );
                          return emp
                            ? `${emp.name}  (${emp.reference_num || "No ID"})`
                            : "Select employee...";
                        })()
                        : "Search employee..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search by name or ID..."
                        value={employeeSearch}
                        onValueChange={setEmployeeSearch}
                      />
                      <CommandEmpty>No employee found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {employeeList.map((emp: any) => (
                          <CommandItem
                            key={emp.id}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                user_id: String(emp.id),
                              });
                              setErrors((prev) => ({
                                ...prev,
                                user_id: undefined,
                              }));
                              setOpenEmployeeSelect(false);
                              setEmployeeSearch("");
                            }}
                          >
                            {/* <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.user_id === String(emp.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            /> */}
                            <div className="flex items-center">
                              <img
                                src={`${backendBasePath}${emp.profile_image}`}
                                alt={emp.name}
                                className="mr-2 h-10 w-10 rounded-full"
                              />
                              <div>
                                <p className="font-medium">{emp.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {emp.reference_num}
                                </p>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                /* 3. Not employee AND no permission → Show warning */
                <div className="p-4 border  rounded-lg text-muted-foreground text-sm text-center">
                  <p>You are not authorized to view or select employees</p>
                </div>
              )}

              <ErrorMessage field="user_id" />
            </div>
            {!isEditMode && (
              <div className="space-y-2">
                <Label>
                  Attendance Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedAttendanceType}
                  onValueChange={(value: "Morning" | "Evening" | "") => setSelectedAttendanceType(value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning">Morning Attendance</SelectItem>
                    <SelectItem value="Evening">Evening Attendance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* <div>
              <Label>
                Select Shift <span className="text-red-500">*</span>
              </Label>
         
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between mt-2 px-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary",
                      !selectedShift && "text-muted-foreground" // Optional styling for unselected state
                    )}
                  >
                    {selectedShift
                      ? shifts.find(
                          (shift: any) =>
                            shift.id.toString() === selectedShift.toString()
                        )?.name
                      : "Choose Shift"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 max-w-xs" align="start">
                  <Command>
                    <CommandInput placeholder="Search shifts..." />
                    <CommandEmpty>No shifts found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {shifts.length > 0 ? (
                        shifts.map((shift: any) => (
                          <CommandItem
                            key={shift.id}
                            value={shift.name} // Use name for search functionality
                            onSelect={() => {
                              const idStr = shift.id.toString();
                              // Single-select logic: set the new ID, or clear if already selected
                              setSelectedShift(
                                idStr === selectedShift.toString() ? "" : idStr
                              );
                              // Optional: Close popover on selection if you need to (you'll need to manage the open state)
                              // setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedShift.toString() === shift.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <Badge variant="secondary" className=" text-xs">
                              {shift.reference_num}
                            </Badge>{" "}
                            {shift.name} ({formatTimeTo12Hour(shift.start_time)}{" "}
                            - {formatTimeTo12Hour(shift.end_time)})
                          </CommandItem>
                        ))
                      ) : (
                        <p className="text-center py-4 text-sm text-muted-foreground">
                          No Shifts Available
                        </p>
                      )}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <ErrorMessage field="shift_id" />
            </div> */}
            {/* Date */}
            <div className="space-y-2">
              <Label>
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value });
                  setErrors((prev) => ({ ...prev, date: undefined }));
                }}
              // className={errors.date ? "border-red-500" : ""}
              />
              <ErrorMessage field="date" />
            </div>

            {/* Time Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Check In <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="time"
                  value={formData.check_in}
                  onChange={(e) => {
                    setFormData({ ...formData, check_in: e.target.value });
                    setErrors((prev) => ({ ...prev, check_in: undefined }));
                  }}
                // className={errors.check_in ? "border-red-500" : ""}
                />
                <ErrorMessage field="check_in" />
              </div>

              <div className="space-y-2">
                <Label>Check Out </Label>
                <Input
                  type="time"
                  value={formData.check_out}
                  onChange={(e) =>
                    setFormData({ ...formData, check_out: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {isEditMode ? "Update" : "Mark"} Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {/* <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Attendance Record?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the attendance record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={actionLoading !== null}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Attendance Record"
        message="Are you sure you want to delete this attendance record? This action cannot be undone."
      />
    </div>
    // </HrmActionsProvider>
  );
}
