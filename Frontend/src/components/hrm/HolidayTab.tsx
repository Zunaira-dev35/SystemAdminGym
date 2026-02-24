import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getHolidayAsyncThunk,
  deleteHolidayAsyncThunk,
  createHolidayAsyncThunk,
} from "@/redux/pagesSlices/hrmSlice";
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
  Trash,
  Plus,
  Edit,
  FilterX,
  CalendarDays,
  Filter,
  RotateCcw,
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
import { Label } from "@/components/ui/label";
import { PERMISSIONS } from "@/permissions/permissions";
import { toast } from "@/hooks/use-toast";
import DeleteConfirmationModal from "../shared/modal/DeleteConfirmationModal";
import { DateRange } from "react-day-picker";
import { format, startOfMonth, subMonths, addMonths } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { backendBasePath } from "@/constants";
import { DialogTrigger } from "@radix-ui/react-dialog";
const months = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const currentYear = new Date().getFullYear();
const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, "0"); // e.g., "12" for December

const years = Array.from({ length: 5 }, (_, i) =>
  (currentYear - 2 + i).toString()
);
interface FormErrors {
  note?: string[];
  start_date?: string[];
  end_date?: string[];
}

interface HolidayForm {
  id?: number;
  note: string;
  start_date: string;
  end_date: string;
}
interface MonthRange {
  from: Date | undefined;
  to: Date | undefined;
}
const generateMonthYearOptions = () => {
  const options = [];
  const start = subMonths(new Date(), 12); // Go back 1 year
  const end = addMonths(new Date(), 24); // Go forward 2 years

  let current = start;
  while (current <= end) {
    options.push({
      label: format(current, "MMMM yyyy"),
      value: format(current, "yyyy-MM"),
    });
    current = addMonths(current, 1);
  }
  // Reverse to show newest/future months first, or keep chronological
  return options.reverse();
};

const COMBINED_OPTIONS = generateMonthYearOptions();
export default function HolidayTab() {
  const dispatch = useDispatch<any>();
  const { holiday, loadings } = useSelector((state: any) => state.hrm);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [holidayForm, setHolidayForm] = useState<HolidayForm>({
    note: "",
    start_date: "",
    end_date: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverErrors, setServerErrors] = useState<string>("");
  const { selectedBranchId } = useSelector((state: any) => state.general);
  // Month Range State
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(
    format(new Date(), "yyyy-MM")
  );
  // const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "MM")); // if exists
  const [filterOpen, setFilterOpen] = useState(false);

  const [tempFilterMonth, setTempFilterMonth] = useState<string>("all");
  const [tempFilterYear, setTempFilterYear] = useState<string>(
    currentYear.toString()
  );

  const [appliedMonth, setAppliedMonth] = useState<string | null>(null);
  const [appliedYear, setAppliedYear] = useState<string | null>(null);
  const getFilterText = () => {
    if (!appliedMonth && !appliedYear) return "Filter";
    if (appliedMonth === null && appliedYear === null) return "Filter";

    if (appliedMonth === null) return "All months";

    const monthObj = months.find((m) => m.value === appliedMonth);
    const monthDisplay = monthObj ? monthObj.label : appliedMonth;

    return appliedYear ? `${monthDisplay} ${appliedYear}` : monthDisplay;
  };
  const handleApplyFilter = () => {
    const month = tempFilterMonth === "all" ? null : tempFilterMonth;
    const year = tempFilterMonth === "all" ? null : tempFilterYear;

    setAppliedMonth(month);
    setAppliedYear(year);
    setCurrentPage(1);
    setFilterOpen(false);
  };

  const handleClearFilter = () => {
    setTempFilterMonth("all");
    setTempFilterYear(currentYear.toString());
    setAppliedMonth(null);
    setAppliedYear(null);
    setCurrentPage(1);
    setFilterOpen(false);
  };

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  useEffect(() => {
    fetchHolidays();
  }, [
    currentPage,
    recordsPerPage,
    searchTerm,
    dispatch,
    selectedBranchId,
    appliedMonth,
    appliedYear,
  ]);
  const fetchHolidays = () => {
    try {
      dispatch(
        getHolidayAsyncThunk({
          params: {
            page: currentPage,
            limit: recordsPerPage,
            month:
              appliedMonth && appliedYear
                ? `${appliedYear}-${appliedMonth}`
                : undefined,
            search: searchTerm || undefined,
            filter_branch_id:
              selectedBranchId == "all" ? undefined : selectedBranchId,
          },
        })
      );
    } catch (error) {
      toast({
        title: "Error",
        description: error.response.data.errors || "Failed to fetch holidays",
        variant: "destructive",
      });
    }
  };
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!holidayForm.note.trim()) {
      newErrors.note = ["Holiday note is required"];
    }
    if (!holidayForm.start_date) {
      newErrors.start_date = ["Start date is required"];
    }
    if (!holidayForm.end_date) {
      newErrors.end_date = ["End date is required"]; // Now required
    } else if (
      holidayForm.start_date &&
      holidayForm.start_date > holidayForm.end_date
    ) {
      newErrors.end_date = ["End date cannot be before start date"];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setHolidayForm({ note: "", start_date: "", end_date: "" });
    setErrors({});
    setServerErrors("");
    setIsEditMode(false);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (record: any) => {
    setIsEditMode(true);
    setHolidayForm({
      id: record.id,
      note: record.note || "",
      start_date: record.start_date,
      end_date: record.end_date || "",
    });
    setErrors({});
    setServerErrors("");
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Failed",
        description: "Please fix the errors below",
        variant: "destructive",
      });
      return;
    }

    const payload: any = { data: holidayForm };
    if (isEditMode && holidayForm.id) {
      payload.id = holidayForm.id;
    }
    try {
      await dispatch(createHolidayAsyncThunk(payload)).unwrap();
      toast({
        title: "Success",
        description: isEditMode ? "Holiday updated!" : "Holiday added!",
      });
      setIsDialogOpen(false);
      resetForm();
      fetchHolidays();
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
  const openDeleteDialog = (id: number) => {
    setRecordToDelete(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async (id: number) => {
    try {
      await dispatch(deleteHolidayAsyncThunk({ id })).unwrap();
      toast({ title: "Deleted", description: "Holiday removed" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const ErrorText = ({ msg }: { msg?: string[] }) => {
    if (!msg || msg.length === 0) return null;
    return (
      <p className="text-red-500 text-xs mt-1">
        {msg[0]} {/* Laravel only sends one message per field usually */}
      </p>
    );
  };
  // Generate Month Options (Current Year +/- 2 years)
  const monthOptions = [];
  for (let y = currentYear - 2; y <= currentYear + 2; y++) {
    for (let m = 0; m < 12; m++) {
      const date = new Date(y, m, 1);
      monthOptions.push({
        label: format(date, "MMMM yyyy"),
        value: format(date, "yyyy-MM"),
      });
    }
  }
  const resetFilters = () => {
    setSelectedMonthYear(format(new Date(), "yyyy-MM"));
    setSearchTerm("");
  };
  return (
    <div className="px-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>Holidays</CardTitle>
            </div>

            <div className="flex gap-2 flex-wrap">
            <div className="flex items-end gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search holiday..."
                  className="pl-9 w-64"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              {/* Date Range Picker */}
              <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-3">
                    <Filter className="h-4 w-4 mr-2" />
                    {getFilterText()}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Filter Holidays</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Month</Label>
                      <Select
                        value={tempFilterMonth}
                        onValueChange={setTempFilterMonth}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All months" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All months</SelectItem>
                          {months.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Year</Label>
                      <Select
                        value={tempFilterYear}
                        onValueChange={setTempFilterYear}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((y) => (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClearFilter}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setFilterOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleApplyFilter}>Apply</Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>
              <Button
                permission={PERMISSIONS.HOLIDAY_CREATE}
                variant="default"
                onClick={openAddDialog}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Holiday
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created By</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="w-32 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loadings.getAllHoliday ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loading />
                  </TableCell>
                </TableRow>
              ) : holiday.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No holidays found
                  </TableCell>
                </TableRow>
              ) : (
                holiday.data.map((record: any) => (
                  <TableRow key={record.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {record?.created_by_user?.profile_image ? (
                            <AvatarImage
                              src={`${backendBasePath}${record?.created_by_user.profile_image}`}
                            />
                          ) : (
                            <AvatarFallback className="bg-primary/10">
                              {record?.created_by_user?.name?.[0]}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {record.created_by_user
                              ? `${record.created_by_user.name}`.trim()
                              : "Super Admin"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-medium">
                      {record.note || "—"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(record.start_date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      {record.end_date
                        ? format(new Date(record.end_date), "dd MMM yyyy")
                        : "—"}
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        permission={
                          PERMISSIONS.HOLIDAY_EDIT || PERMISSIONS.HOLIDAY_CREATE
                        }
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(record)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        permission={PERMISSIONS.HOLIDAY_DELETE}
                        size="sm"
                        variant="ghost"
                        className=" hover:opacity-90"
                        onClick={() => openDeleteDialog(record.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {!loadings.getAllHoliday && holiday.meta && (
          <Pagination
            recordsPerPage={recordsPerPage}
            setRecordsPerPage={setRecordsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalRecords={holiday.meta.total || 0}
            recordsPerPageOptions={[5, 10, 20, 50]}
          />
        )}
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && (setIsDialogOpen(false), resetForm())}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Holiday" : "Add Holiday"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                Note <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Eid-ul-Fitr Holiday"
                value={holidayForm.note}
                onChange={(e) => {
                  setHolidayForm({ ...holidayForm, note: e.target.value });
                  setErrors((prev) => ({ ...prev, note: undefined }));
                }}
                className={errors.note ? "border-red-500" : ""}
              />
              <ErrorText msg={errors.note} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={holidayForm.start_date}
                  onChange={(e) => {
                    setHolidayForm({
                      ...holidayForm,
                      start_date: e.target.value,
                    });
                    setErrors((prev) => ({
                      ...prev,
                      start_date: undefined,
                      end_date: undefined,
                    }));
                  }}
                  className={errors.start_date ? "border-red-500" : ""}
                />
                <ErrorText msg={errors.start_date} />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={holidayForm.end_date}
                  onChange={(e) => {
                    setHolidayForm({
                      ...holidayForm,
                      end_date: e.target.value,
                    });
                    setErrors((prev) => ({ ...prev, end_date: undefined }));
                  }}
                  className={errors.end_date ? "border-red-500" : ""}
                />
                <ErrorText msg={errors.end_date} />
              </div>
            </div>
            {serverErrors && (
              <div className="p-3 bg-chart-5/10 text-chart-5 border-chart-5/20 rounded-md text-sm">
                {serverErrors}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => (setIsDialogOpen(false), resetForm())}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {isEditMode ? "Update Holiday" : "Add Holiday"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete holiday Record"
        message="Are you sure you want to delete this holiday record? This action cannot be undone."
      />
    </div>
  );
}
