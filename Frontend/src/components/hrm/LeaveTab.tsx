// src/pages/hrm/LeaveTab.tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getLeaveAsyncThunk,
  createLeaveAsyncThunk,
  processLeaveAsyncThunk,
} from "@/redux/pagesSlices/hrmSlice";
import { getAllEmployeesAsyncThunk } from "@/redux/pagesSlices/peopleSlice";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Search,
  Plus,
  CheckCircle,
  Edit3,
  Edit,
  Eye,
  RefreshCw,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Pagination from "../shared/Pagination";
import Loading from "../shared/loaders/Loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS } from "@/permissions/permissions";
import { toast } from "@/hooks/use-toast";
import { backendBasePath } from "@/constants";
import { usePermissions } from "@/permissions/usePermissions";
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
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { addDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
interface FormErrors {
  user_id?: string;
  leave_title?: string;
  apply_reason?: string;
  start_date?: string;
  end_date?: string;
}
export default function LeaveTab() {
  const dispatch = useDispatch<any>();
  const { leave, loadings } = useSelector((state: any) => state.hrm);
  const { employees } = useSelector((state: any) => state.people);
  const authUser = useSelector((state: any) => state.auth?.user);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverErrors, setServerErrors] = useState<string>({});
  const [openEmployeeSelect, setOpenEmployeeSelect] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [isDialogSubmitting, setIsDialogSubmitting] = useState(false);
  const { hasPermission } = usePermissions();
  const { selectedBranchId } = useSelector((state: any) => state.general);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [leaveForm, setLeaveForm] = useState({
    user_id: "",
    leave_title: "",
    apply_reason: "",
    start_date: "",
    end_date: "",
    doc_url: null as File | null,
    leave_mode: "multiple" as "single" | "multiple",
    existing_doc_url: "" as string,
  });

  const [processForm, setProcessForm] = useState({
    status: "approved" as "approved" | "rejected" | "on-hold",
    hold_reason: "",
    reject_reason: "",
  });

  const refetchLeaves = () => {
    let startDate = dateRange?.from 
    ? format(dateRange.from, "yyyy-MM-dd") 
    : undefined;

  let endDate = dateRange?.to 
    ? format(dateRange.to, "yyyy-MM-dd") 
    : startDate;
    dispatch(
      getLeaveAsyncThunk({
        params: {
          page: currentPage,
          limit: recordsPerPage,
         ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
          search: searchTerm || undefined,
          filter_branch_id:
            selectedBranchId == "all" ? undefined : selectedBranchId,
        },
      })
    );
  };

  useEffect(() => {
    refetchLeaves();
  }, [
    currentPage,
    recordsPerPage,
    searchTerm,
    dispatch,
    selectedBranchId,
    dateRange,
  ]);

  useEffect(() => {
    if (
      (isApplyDialogOpen || isEditDialogOpen) &&
      (!employees.data || employees.data.length === 0) &&
      hasPermission(PERMISSIONS.EMPLOYEE_VIEW)
    ) {
      dispatch(
        getAllEmployeesAsyncThunk({ params: { disable_page_param: 1 } })
      );
    }
  }, [isApplyDialogOpen, isEditDialogOpen, dispatch]);

  const employeeList = employees?.data?.data || employees?.data || [];
  const openApplyDialog = () => {
    setSelectedLeave(null);
    resetLeaveForm();
    // Auto-fill user_id for employees immediately
    if (authUser?.user_type === "employee" && authUser?.id) {
      setLeaveForm((prev) => ({
        ...prev,
        user_id: String(authUser.id),
      }));
    }
    setIsApplyDialogOpen(true);
  };

  const openEditLeaveDialog = (leave: any) => {
    setSelectedLeave(leave);
    setLeaveForm({
      user_id: String(leave.user_id),
      leave_title: leave.leave_title || "",
      apply_reason: leave.apply_reason || "",
      start_date: leave.start_date,
      end_date: leave.end_date || "",
      doc_url: null,
      leave_mode: leave.leave_mode || "multiple",
      existing_doc_url: leave.doc_url || "",
    });
    if (authUser?.user_type === "employee") {
      setLeaveForm((prev) => ({
        ...prev,
        user_id: String(authUser.id), // enforce their own ID
      }));
    }
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (leave: any) => {
    setSelectedLeave(leave);
    setIsViewDialogOpen(true);
  };
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!leaveForm.user_id) {
      newErrors.user_id = "Please select an employee";
    }
    // if (!leaveForm.user_id) newErrors.user_id = "Employee is required";
    if (!leaveForm.leave_title.trim())
      newErrors.leave_title = "Leave title is required";
    if (!leaveForm.apply_reason.trim())
      newErrors.apply_reason = "Reason is required";
    if (!leaveForm.start_date) newErrors.start_date = "Start date is required";
    if (leaveForm.leave_mode === "multiple" && !leaveForm.end_date) {
      newErrors.end_date = "End date is required for multiple days";
    }
    if (leaveForm.end_date && leaveForm.start_date > leaveForm.end_date) {
      newErrors.end_date = "End date cannot be before start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const ErrorMessage = ({ field }: { field: keyof FormErrors }) => {
    if (!errors[field]) return null;
    return <p className="text-red-500 text-xs mt-1">{errors[field]}</p>;
  };

  const resetLeaveForm = () => {
    setLeaveForm({
      user_id: "",
      leave_title: "",
      apply_reason: "",
      start_date: "",
      end_date: "",
      doc_url: null,
      leave_mode: "multiple",
      existing_doc_url: "",
    });
    setErrors({});
    setServerErrors("");
  };
  const handleSubmitLeave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Failed",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsDialogSubmitting(true);

    const formData = new FormData();
    if (selectedLeave) formData.append("id", selectedLeave.id);
    formData.append("user_id", leaveForm.user_id);
    formData.append("leave_title", leaveForm.leave_title);
    formData.append("apply_reason", leaveForm.apply_reason);
    formData.append("start_date", leaveForm.start_date);
    formData.append("end_date", leaveForm.end_date || leaveForm.start_date);
    formData.append("leave_mode", leaveForm.leave_mode);
    if (leaveForm.doc_url) formData.append("doc_url", leaveForm.doc_url);

    try {
      await dispatch(createLeaveAsyncThunk({ data: formData })).unwrap();
      toast({
        title: "Success",
        description: selectedLeave ? "Leave updated!" : "Leave applied!",
      });
      setIsApplyDialogOpen(false);
      setIsEditDialogOpen(false);
      resetLeaveForm();
      refetchLeaves();
    } catch (err) {
      toast({
        title: "Error",
        description: err?.response?.data?.errors,
        variant: "destructive",
      });
    } finally {
      setIsDialogSubmitting(false);
    }
  };

  const openProcessDialog = (leave: any) => {
    setServerErrors("");
    setSelectedLeave(leave);

    // Map backend status → your allowed values
    const currentStatus = leave.status?.toLowerCase();
    let status: "approved" | "rejected" | "on-hold" = "on-hold"; // default fallback

    if (currentStatus === "approved") status = "approved";
    else if (currentStatus === "rejected") status = "rejected";
    // "pending" or anything else → let user choose

    setProcessForm({
      status,
      hold_reason: leave.hold_reason || "",
      reject_reason: leave.reject_reason || "",
    });

    setIsProcessDialogOpen(true);
  };
  const handleProcess = async () => {
    setServerErrors("");

    const payload: any = {
      leave_id: selectedLeave.id,
      status: processForm.status,
    };
    if (processForm.status === "on-hold")
      payload.hold_reason = processForm.hold_reason;
    if (processForm.status === "rejected")
      payload.reject_reason = processForm.reject_reason;

    try {
      await dispatch(processLeaveAsyncThunk(payload)).unwrap();
      toast({ title: "Success", description: `Leave ${processForm.status}!` });
      setIsProcessDialogOpen(false);
      refetchLeaves();
    } catch (err: any) {
      console.log("errors from backend", err);
      if (err?.errors && typeof err.errors === "object") {
        setErrors(err.response.data.errors as FormErrors);
        const firstError = Object.values(err.errors)[0];
        toast({
          title: "Validation Error",
          description: Array.isArray(firstError)
            ? firstError[0]
            : "Please check the form",
          variant: "destructive",
        });
      } else {
        setServerErrors(err.response.data.errors || "Something went wrong");
        toast({
          title: "Error",
          description: err?.response.data.errors || "Failed to save",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return {
          variant: "default" as const,
          label: "Approved",
          color: "bg-chart-3/10 text-chart-3 border-chart-3/20",
        };
      case "rejected":
        return {
          variant: "destructive" as const,
          label: "Rejected",
          color: "bg-chart-5/10 text-chart-5 border-chart-5/20",
        };
      case "on-hold":
        return {
          variant: "secondary" as const,
          label: "On Hold",
          color: "bg-chart-4/10 text-muted-foreground border-muted/20",
        };
      case "pending":
      default:
        return {
          variant: "outline" as const,
          label: "Pending",
          color: "bg-chart-2/10 text-chart-2 border-chart-2/20",
        };
    }
  };

  // const canReapply = (record: any) =>
  //   ["rejected", "on-hold"].includes(record.status) &&
  //   record.user_id === authUser?.id;

  // Build correct PDF URL
  const getPdfUrl = (path: string) => {
    if (!path) return "";
    let cleanPath = path.trim();
    if (cleanPath.startsWith("//storage")) cleanPath = cleanPath.slice(1);
    if (!cleanPath.startsWith("/storage"))
      cleanPath = `/storage${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
    return `${backendBasePath}${cleanPath}`;
  };

  return (
    <div className="px-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>Leaves</CardTitle>
            </div>
            <div className="flex  gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leave..."
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
                permission={[PERMISSIONS.LEAVE_CREATE]}
                variant="default"
                className="flex items-center gap-1"
                onClick={openApplyDialog}
              >
                <Plus className="h-4 w-4" /> Add Leave
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadings.getAllLeave ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loading />
                  </TableCell>
                </TableRow>
              ) : leave.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No leaves found
                  </TableCell>
                </TableRow>
              ) : (
                leave.data.map((record: any) => {
                  const status = getStatusConfig(record.status || "pending");
                  return (
                    <TableRow key={record.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {record.user?.profile_image ? (
                              <AvatarImage
                                src={`${backendBasePath}${record.user.profile_image}`}
                                alt={`${record.user.first_name} ${record.user.last_name}`}
                              />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {(record.user?.first_name?.[0] || "?") +
                                (record.user?.last_name?.[0] || "")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {record.user
                                ? `${record.user.name}                   `.trim()
                                : "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {record.user?.reference_num}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.leave_title || "—"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.start_date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        {record.end_date
                          ? format(new Date(record.start_date), "dd MMM yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={status.variant}
                          className={`${status.color} border-transparent`}
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          // className=" text-green-600 hover:bg-green-50 h-8"
                          onClick={() => openViewDialog(record)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          permission={[PERMISSIONS.LEAVE_EDIT]}
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditLeaveDialog(record)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          permission={[PERMISSIONS.LEAVE_EDIT]}
                          size="sm"
                          variant="ghost"
                          // className=" text-blue-600 hover:bg-blue-50 h-8"
                          onClick={() => openProcessDialog(record)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>

                        {/* {canReapply(record) && (
                          <Button
                            size="sm"
                            // className="bg-orange-500 hover:bg-orange-600 text-white h-8"
                            onClick={() => openEditLeaveDialog(record)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )} */}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        {!loadings.getAllLeave && leave.meta && (
          <Pagination
            recordsPerPage={recordsPerPage}
            setRecordsPerPage={setRecordsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalRecords={leave.meta.total || 0}
            className="bg-theme-white"
            recordsPerPageOptions={[5, 10, 20, 50]}
          />
        )}
      </Card>

      {/* FULL Apply/Edit Dialog — RESTORED 100% */}
      <Dialog
        open={isApplyDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsApplyDialogOpen(false);
            setIsEditDialogOpen(false);
            resetLeaveForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Leave" : "Apply Leave"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* === EMPLOYEE SELECT – FINAL VERSION (Based on user_type) === */}
            <div className="space-y-2">
              <Label>
                Employee <span className="text-red-500">*</span>
              </Label>

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
                        {authUser?.reference_num || authUser?.email}
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
                        !leaveForm.user_id && "text-muted-foreground",
                        errors.user_id && "border-red-500"
                      )}
                    >
                      {leaveForm.user_id
                        ? (() => {
                          const emp = employeeList.find(
                            (e: any) => String(e.id) === leaveForm.user_id
                          );
                          return emp
                            ? `${emp.name} (${emp.reference_num || "No ID"})`
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
                              setLeaveForm({
                                ...leaveForm,
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
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                leaveForm.user_id === String(emp.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div>
                              <p className="font-medium">
                                {emp.first_name} {emp.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: {emp.reference_num || emp.email}
                              </p>
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

            <div className="space-y-2">
              <Label>Leave Mode</Label>
              <Select
                value={leaveForm.leave_mode}
                onValueChange={(v) => {
                  setLeaveForm({
                    ...leaveForm,
                    leave_mode: v as any,
                    end_date: v === "single" ? "" : leaveForm.end_date,
                  });
                  setErrors((prev) => ({ ...prev, end_date: undefined }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Day</SelectItem>
                  <SelectItem value="multiple">Multiple Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={leaveForm.start_date}
                  onChange={(e) => {
                    setLeaveForm({ ...leaveForm, start_date: e.target.value });
                    setErrors((prev) => ({
                      ...prev,
                      start_date: undefined,
                      end_date: undefined,
                    }));
                  }}
                  className={errors.start_date ? "border-red-500" : ""}
                />
                <ErrorMessage field="start_date" />
              </div>

              <div className="space-y-2">
                <Label>
                  End Date{" "}
                  {leaveForm.leave_mode === "multiple" && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <Input
                  type="date"
                  value={leaveForm.end_date}
                  onChange={(e) => {
                    setLeaveForm({ ...leaveForm, end_date: e.target.value });
                    setErrors((prev) => ({ ...prev, end_date: undefined }));
                  }}
                  className={errors.end_date ? "border-red-500" : ""}
                  disabled={leaveForm.leave_mode === "single"}
                />
                <ErrorMessage field="end_date" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Leave Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Annual Leave, Sick Leave"
                value={leaveForm.leave_title}
                onChange={(e) => {
                  setLeaveForm({ ...leaveForm, leave_title: e.target.value });
                  setErrors((prev) => ({ ...prev, leave_title: undefined }));
                }}
                className={errors.leave_title ? "border-red-500" : ""}
              />
              <ErrorMessage field="leave_title" />
            </div>

            <div className="space-y-2">
              <Label>
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Explain your leave reason..."
                value={leaveForm.apply_reason}
                onChange={(e) => {
                  setLeaveForm({ ...leaveForm, apply_reason: e.target.value });
                  setErrors((prev) => ({ ...prev, apply_reason: undefined }));
                }}
                rows={4}
                className={errors.apply_reason ? "border-red-500" : ""}
              />
              <ErrorMessage field="apply_reason" />
            </div>

            {isEditDialogOpen && leaveForm.existing_doc_url && (
              <div className="p-4 bg-muted rounded-lg">
                <Label>Current Document</Label>
                <a
                  href={getPdfUrl(leaveForm.existing_doc_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm flex items-center gap-2"
                >
                  View attached file
                </a>
              </div>
            )}

            <div className="space-y-2">
              <Label>Attach Document (PDF/DOC, Optional)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) =>
                  setLeaveForm({
                    ...leaveForm,
                    doc_url: e.target.files?.[0] || null,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApplyDialogOpen(false);
                setIsEditDialogOpen(false);
                resetLeaveForm();
              }}
              disabled={isDialogSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitLeave} disabled={isDialogSubmitting}>
              {isDialogSubmitting ? (
                <>
                  {isEditDialogOpen ? "Updating..." : "Submitting..."}
                </>
              ) : isEditDialogOpen ? (
                "Update Leave"
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog — Clean & Minimal PDF Preview */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Leave Details</DialogTitle>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Employee</p>
                  <p className="font-medium">
                    {selectedLeave.user?.first_name}{" "}
                    {selectedLeave.user?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reference</p>
                  <p className="font-medium">
                    {selectedLeave.user?.reference_num}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Title</p>
                  <p className="font-medium">{selectedLeave.leave_title}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dates</p>
                  <p className="font-medium">
                    {selectedLeave.start_date} to{" "}
                    {selectedLeave.end_date || selectedLeave.start_date}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Applied On</p>
                  <p className="font-medium">
                    {new Date(selectedLeave.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      getStatusConfig(selectedLeave.status || "pending").variant
                    }
                  >
                    {getStatusConfig(selectedLeave.status || "pending").label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedLeave.apply_reason || "No reason provided"}
                </p>
              </div>

              {/* Clean & Minimal PDF Preview */}
              {selectedLeave.doc_url && (
                <div className="space-y-2">
                  <Label>Document Preview</Label>
                  <div className="border rounded-md overflow-hidden">
                    <iframe
                      src={getPdfUrl(selectedLeave.doc_url)}
                      className="w-full h-74"
                      title="Document Preview"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {(selectedLeave.hold_reason || selectedLeave.reject_reason) && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  {selectedLeave.hold_reason && (
                    <div>
                      <p className="font-medium text-orange-700">
                        Hold Reason:
                      </p>
                      <p className="text-sm">{selectedLeave.hold_reason}</p>
                    </div>
                  )}
                  {selectedLeave.reject_reason && (
                    <div>
                      <p className="font-medium text-red-700">Reject Reason:</p>
                      <p className="text-sm">{selectedLeave.reject_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Dialog — unchanged */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Leave Request</DialogTitle>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-5 py-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold">
                  {selectedLeave.user?.first_name}{" "}
                  {selectedLeave.user?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedLeave.leave_title}
                </p>
                <p className="text-xs">
                  {selectedLeave.start_date} to{" "}
                  {selectedLeave.end_date || selectedLeave.start_date}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Action</Label>
                <Select
                  value={processForm.status}
                  onValueChange={(v) => {
                    setProcessForm({ ...processForm, status: v as any });
                    setServerErrors("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approve</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {processForm.status === "on-hold" && (
                <Textarea
                  placeholder="Reason for holding..."
                  value={processForm.hold_reason}
                  onChange={(e) =>
                    setProcessForm({
                      ...processForm,
                      hold_reason: e.target.value,
                    })
                  }
                />
              )}
              {processForm.status === "rejected" && (
                <Textarea
                  placeholder="Reason for rejection..."
                  value={processForm.reject_reason}
                  onChange={(e) =>
                    setProcessForm({
                      ...processForm,
                      reject_reason: e.target.value,
                    })
                  }
                />
              )}
            </div>
          )}
          {serverErrors && (
            <div className="p-3 bg-chart-5/10 text-chart-5 border-chart-5/20 rounded-md text-sm">
              {serverErrors}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProcessDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleProcess}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
