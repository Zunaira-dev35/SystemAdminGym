// src/pages/shifts/Shifts.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Clock,
  X,
  ChevronsUpDown,
  Check,
  Search,
  Loader2,
  Edit,
  Building2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import {
  createShiftAsyncThunk,
  getAllShiftsAsyncThunk,
  updateShiftStatusAsyncThunk,
} from "@/redux/pagesSlices/generalSlice";
import Loading from "@/components/shared/loaders/Loading";
import Pagination from "@/components/shared/Pagination";
import { PERMISSIONS } from "@/permissions/permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTimeTo12Hour } from "@/utils/helper";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { getBranchesListsAsyncThunk } from "@/redux/pagesSlices/planSlice";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const shiftFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Shift name is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  rest_days: z.array(z.enum(daysOfWeek)).default([]),
  status: z.string().optional(),
});

type ShiftFormData = z.infer<typeof shiftFormSchema>;

interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  rest_days?: string[];
  status?: string;
}

export default function Shifts() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const {
    shifts = { data: [], total: 0 },
    loadings,
    pagination,
  } = useSelector((state: any) => state.general);
  // const { selectedBranchId } = useSelector((state: any) => state.general);
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined
  );
  // Loading states
  const isLoadingShifts = loadings?.getAllShifts;
  const isCreatingOrUpdating = loadings?.createShifts;
  const isUpdatingStatus = loadings?.updateShiftStatus;

  // UI States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [pendingShift, setPendingShift] = useState<Shift | null>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const form = useForm<ShiftFormData>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      id: undefined,
      name: "",
      start_time: "",
      end_time: "",
      rest_days: [],
      status: "active",
    },
  });
  const { user } = useSelector((state: any) => state.auth);

  // Fetch shifts with filters
  useEffect(() => {
    // let filterBranchId;

    // const userBranch = user?.logged_branch;
    // const isMainBranchUser =
    //   userBranch?.type === "main" || userBranch?.is_main === 1;
    // const isAdminOrOwner = ["default"].includes(user?.type);

    // if (isMainBranchUser && isAdminOrOwner) {
    //   // Admin from main branch → respect dropdown selection
    //   filterBranchId =
    //     selectedBranchId === "all" ? undefined : selectedBranchId;
    // } else {
    //   // Regular branch user or employee → force their branch
    //   filterBranchId = undefined;
    // }
    const params: any = {
      page: currentPage,
      per_page: recordsPerPage,
      filter_branch_id: filterBranchId,
    };

    if (searchTerm) params.search = searchTerm;
    if (statusFilter !== "all") params.filter_status = statusFilter;

    dispatch(getAllShiftsAsyncThunk({ params }));
  }, [
    dispatch,
    currentPage,
    recordsPerPage,
    searchTerm,
    statusFilter,
    filterBranchId,
  ]);
  useEffect(() => {
    dispatch(getBranchesListsAsyncThunk({})).unwrap();
  }, [dispatch]);
  // Reset form whenever dialog opens OR editingShift changes
  useEffect(() => {
    if (isDialogOpen) {
      if (editingShift) {
        // Editing mode
        form.reset({
          id: String(editingShift.id),
          name: editingShift.name,
          start_time: editingShift.start_time.slice(0, 5),
          end_time: editingShift.end_time.slice(0, 5),
          rest_days: editingShift.rest_days || [],
          status: editingShift.status ?? "active",
        });
      } else {
        // Add mode — always fresh
        form.reset({
          id: undefined,
          name: "",
          start_time: "",
          end_time: "",
          rest_days: [],
          status: "active",
        });
      }
    }
  }, [isDialogOpen, editingShift, form]);
  const closeDialog = () => setIsDialogOpen(false);

  const handleAdd = () => {
    setEditingShift(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    form.reset({
      id: String(shift.id),
      name: shift.name,
      start_time: shift.start_time.slice(0, 5),
      end_time: shift.end_time.slice(0, 5),
      rest_days: shift.rest_days || [],
      status: shift.status ?? "active",
    });
    setIsDialogOpen(true);
  };

  const handleStatusChange = (shift: Shift, checked: boolean) => {
    if (!checked) {
      setPendingShift(shift);
      setShowReasonDialog(true);
    } else {
      updateShiftStatus(shift.id, "active", "");
    }
  };

  const updateShiftStatus = async (
    shiftId: string,
    status: "active" | "inactive", // optional: type it properly
    reason: string
  ) => {
    try {
      const payload = {
        shift_id: shiftId,
        inactive_reason: status === "active" ? "" : reason,
        inactive_date: new Date().toISOString().split("T")[0],
      };

      // This will throw if the thunk is rejected
      await dispatch(updateShiftStatusAsyncThunk(payload)).unwrap();

      // Success toast - only reaches here if the request succeeded
      // toast({
      //   title: "Success",
      //   description: status === "active" ? "Shift activated" : "Shift deactivated",
      // });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err.response?.data?.errors || "Failed to update shift status",
      });
    }
  };

  const handleDeactivationConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!pendingShift) return;

    try {
      // await updateShiftStatus(pendingShift.id, "inactive", deactivationReason);
      const payload = {
        shift_id: pendingShift.id,
        inactive_reason: deactivationReason,
        inactive_date: new Date().toISOString().split("T")[0],
      };

      // This will throw if the thunk is rejected
      await dispatch(updateShiftStatusAsyncThunk(payload)).unwrap();
      toast({
        title: "Success",
        description: "Shift deactivated successfully",
      });

      // Only now close the dialog
      setShowReasonDialog(false);
      setDeactivationReason("");
      setPendingShift(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.errors || "Failed to deactivate shift",
      });
      // Keep dialog open on error
    } finally {
      setShowReasonDialog(false);
      setPendingShift(null);
      setDeactivationReason("");
    }
  };

  const onSubmit = async (data: ShiftFormData) => {
    try {
      await dispatch(createShiftAsyncThunk({ data })).unwrap();
      toast({
        title: "Success",
        description: editingShift
          ? "Shift updated successfully"
          : "Shift created successfully",
      });
      closeDialog();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.errors || "Failed to save shift",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Shift Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage working shifts for employees
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button permission={PERMISSIONS.SHIFT_CREATE} onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Shift
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              All Shifts
            </CardTitle>

            <div className="relative  flex gap-3 flex-wrap">
              {/* Search */}
              <HeaderBranchFilter onBranchChange={setFilterBranchId} />
              <div className="relative">
                <Search className="absolute left-3 top-[55%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shifts..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 w-64"
                />
              </div>

              {/* Status Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-40 justify-between mt-2"
                  >
                    {statusFilter === "all"
                      ? "All Status"
                      : statusFilter === "active"
                      ? "Active"
                      : "Inactive"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-0">
                  <Command>
                    <CommandGroup>
                      {["all", "active", "inactive"].map((status) => (
                        <CommandItem
                          key={status}
                          onSelect={() => {
                            setStatusFilter(status as any);
                            setCurrentPage(1);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              statusFilter === status
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift Name</TableHead>
                <TableHead>Shift ID</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Rest Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingShifts ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64">
                    <div className="flex items-center justify-center h-full">
                      <Loading />
                    </div>
                  </TableCell>
                </TableRow>
              ) : shifts.data?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No shifts found
                  </TableCell>
                </TableRow>
              ) : (
                shifts.data?.map((shift: Shift) => (
                  <TableRow
                    key={shift.id}
                    className={cn(
                      shift.status !== "active" && "opacity-60 bg-muted/30"
                    )}
                  >
                    <TableCell className="font-medium">{shift.name}</TableCell>
                    <TableCell className="font-medium">
                      {shift.reference_num}
                    </TableCell>
                    <TableCell>
                      {formatTimeTo12Hour(shift.start_time)}
                      {/* {shift.start_time.substring(0, 5)} */} -{" "}
                      {formatTimeTo12Hour(shift.end_time)}
                      {/* {shift.end_time.substring(0, 5)} */}
                    </TableCell>
                    <TableCell>
                      {shift?.rest_days?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {shift?.rest_days?.map((day) => (
                            <Badge key={day} variant="secondary">
                              {day}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
<TableCell>
  <div className="space-y-1">
    <Badge
      variant={shift.status === "active" ? "default" : "secondary"}
      className={cn(
        shift.status === "inactive" && "bg-red-100 text-red-800 border-red-200"
      )}
    >
      {shift.status || "active"}
    </Badge>

  {shift.status === "inactive" && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-xs text-muted-foreground cursor-help max-w-[200px] truncate">
              Reason: {shift.inactive_reason || "Not provided"}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <p className="font-medium">Deactivation Reason:</p>
            <p>{shift.inactive_reason || "No reason provided"}</p>
            {shift.inactive_date && (
              <p className="text-sm mt-2">
                Date: {new Date(shift.inactive_date).toLocaleDateString()}
              </p>
            )}
            {/* If you have deactivated_by user in future */}
            {/* <p className="text-sm">By: {shift.deactivated_by_name}</p> */}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
    {/* {shift.status === "inactive" && shift.inactive_date && (
      <div className="text-xs text-muted-foreground">
        Deactivated on: {new Date(shift.inactive_date).toLocaleDateString()}
      </div>
    )} */}
  </div>
</TableCell>
                    <TableCell className="text-right">
                      <Button
                        permission={PERMISSIONS.SHIFT_EDIT}
                        variant="ghost"
                        size="icon"
                        disabled={shift.status !== "active"}
                        onClick={() => handleEdit(shift)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        permission={PERMISSIONS.SHIFT_EDIT}
                        variant="ghost"
                        size="icon"
                        disabled={shift.status !== "active"}
                        onClick={() =>
                          handleStatusChange(shift, showReasonDialog)
                        }
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalRecords={shifts?.total || 0}
            recordsPerPage={recordsPerPage}
            setRecordsPerPage={setRecordsPerPage}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>
              {editingShift ? "Edit Shift" : "Add New Shift"}
            </DialogTitle>
            <DialogDescription>
              {editingShift
                ? "Update shift details"
                : "Create a new working shift"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <label>
                      Shift Name<span className="text-red-500">*</span>
                    </label>
                    <FormControl>
                      <Input placeholder="e.g., Morning Shift" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <label>
                        Start Time <span className="text-red-500">*</span>
                      </label>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <label>
                        End Time<span className="text-red-500">*</span>
                      </label>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Rest Days */}
              <FormField
                control={form.control}
                name="rest_days"
                render={() => (
                  <FormItem>
                    <FormLabel>Rest Days (Optional)</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between h-auto min-h-[40px] py-2"
                          >
                            <div className="flex flex-wrap gap-1">
                              {form.watch("rest_days").length > 0 ? (
                                form.watch("rest_days").map((day) => (
                                  <Badge
                                    key={day}
                                    variant="secondary"
                                    className="mr-1 mb-1"
                                  >
                                    {day}
                                    <button
                                      type="button"
                                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        form.setValue(
                                          "rest_days",
                                          form
                                            .getValues("rest_days")
                                            .filter((d) => d !== day)
                                        );
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground">
                                  No rest days selected
                                </span>
                              )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search day..." />
                            <CommandEmpty>No day found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {daysOfWeek.map((day) => (
                                <CommandItem
                                  key={day}
                                  onSelect={() => {
                                    const current = form.getValues("rest_days");
                                    form.setValue(
                                      "rest_days",
                                      current.includes(day)
                                        ? current.filter((d) => d !== day)
                                        : [...current, day]
                                    );
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      form.watch("rest_days").includes(day)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {day}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  permission={[
                    PERMISSIONS.SHIFT_EDIT,
                    PERMISSIONS.SHIFT_CREATE,
                  ]}
                  disabled={isCreatingOrUpdating}
                >
                  {isCreatingOrUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingShift ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{editingShift ? "Update Shift" : "Create Shift"}</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Deactivation Reason Dialog */}
      <AlertDialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
        <AlertDialogContent
          onPointerDownOutside={(e) => {
            setShowReasonDialog(!showReasonDialog);
            // Optional: Add extra logic if needed (rarely required)
            // e.preventDefault() would BLOCK closing — NEVER do that
          }}
          onEscapeKeyDown={(e) => {
            // Optional: Prevent closing if you want (not needed here)
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Shift</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for deactivating "{pendingShift?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="deactivation-reason">Reason for deactivation</Label>
            <Input
              id="deactivation-reason"
              value={deactivationReason}
              onChange={(e) => setDeactivationReason(e.target.value)}
              placeholder="Enter reason..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowReasonDialog(false);
                setPendingShift(null);
                setDeactivationReason("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivationConfirm}
              disabled={!deactivationReason.trim()}
              className="bg-destructive text-destructive-foreground"
            >
              {isUpdatingStatus ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Deactivate Shift
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
