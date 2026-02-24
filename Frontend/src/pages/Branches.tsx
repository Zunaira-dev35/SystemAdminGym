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
  CommandItem,
} from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Building2,
  Search,
  ChevronsUpDown,
  Check,
  Loader2,
  Trash2,
  RefreshCcw,
  Edit,
  Ban,
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
import { string, z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import {
  createOrUpdateBranchAsyncThunk,
  toggleBranchStatusAsyncThunk,
  deleteBranchAsyncThunk,
  getAllBranchesAsyncThunk,
  getBranchesListsAsyncThunk,
} from "@/redux/pagesSlices/planSlice";
import Loading from "@/components/shared/loaders/Loading";
import Pagination from "@/components/shared/Pagination";

const branchFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Branch name is required"),
  address: z.string().min(1, "Location is required"),
  phone: z.string().min(1, "Phone is required"),
  branch_ip: z.string().optional(),
});

type BranchFormData = z.infer<typeof branchFormSchema>;

interface Branch {
  id: string;
  name: string;
  address: string;
  phone?: string;
  status?: "active" | "inactive";
  branch_ip?: string;
}

export default function Branches() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { branches, loadings } = useSelector((state: any) => state.plan);
  const isLoading = loadings?.getAllBranches;
  const isSaving = loadings?.createOrUpdateBranch;
  const isToggling = loadings?.toggleBranchStatus;
  const isDeleting = loadings?.deleteBranch;

  // UI States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deactivatingBranch, setDeactivatingBranch] = useState<Branch | null>(
    null
  );

  // Deactivation reason
  const [showDeactivationDialog, setShowDeactivationDialog] = useState(false);
  const [pendingBranch, setPendingBranch] = useState<Branch | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  // const form = useForm<BranchFormData>({
  //   resolver: zodResolver(branchFormSchema),
  //   defaultValues: {
  //     name: '',
  //     phone: '',
  //     address: '',
  //   },
  // });
  const validatePhone = (value: string): string | true => {
    if (!value?.trim()) {
      return "Phone number is required";
    }

    const cleaned = value.replace(/[\s\-\(\)]/g, "");

    if (!/^(\+\d{1,4})?\d{7,15}$/.test(cleaned)) {
      return "Please enter a valid phone number (7–15 digits, optional country code like +1 or +44)";
    }

    return true;
  };
  // Inside your component
  const form = useForm({
    defaultValues: {
      name: editingBranch?.name || "",
      address: editingBranch?.address || "",
      phone: editingBranch?.phone || "",
      branch_ip: editingBranch?.branch_ip || "",
    },
  });
  // Fetch branches
  useEffect(() => {
    const params: any = {
      page: currentPage,
      per_page: recordsPerPage,
    };
    if (searchTerm) params.search = searchTerm;
    if (statusFilter !== "all") params.filter_status = statusFilter;

    dispatch(getBranchesListsAsyncThunk(params));
  }, [dispatch, currentPage, recordsPerPage, searchTerm, statusFilter]);

  // Reset form when dialog opens
  useEffect(() => {
    if (!isDialogOpen) return;

    if (editingBranch) {
      form.reset({
        id: String(editingBranch.id),
        name: editingBranch.name,
        address: editingBranch.address,
        phone: editingBranch.phone || "",
        branch_ip: editingBranch.branch_ip || "",
      });
    } else {
      form.reset({
        name: "",
        address: "",
        phone: "",
        branch_ip: "",
      });
    }
  }, [editingBranch, isDialogOpen]);

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingBranch(null);
  };

  const handleAdd = () => {
    setEditingBranch(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    if (branch.status !== "active") {
      toast({ variant: "destructive", title: "Cannot edit inactive branch" });
      return;
    }
    setEditingBranch(branch);
    setIsDialogOpen(true);
  };

  // Fixed: Pass data directly, not wrapped in { data }
  const onSubmit = async (data: BranchFormData) => {
    console.log("data in onSubmit", data);
    const phoneError = validatePhone(data.phone);
    if (phoneError !== true) {
      form.setError("phone", { message: phoneError as string });
      return;
    }
    try {
      await dispatch(createOrUpdateBranchAsyncThunk({ data })).unwrap();
      toast({
        title: "Success",
        description: editingBranch
          ? "Branch updated successfully"
          : "Branch created successfully",
      });
      await dispatch(getBranchesListsAsyncThunk({})).unwrap();
      console.log("getBranchesListsAsyncThunk dispatched");
      closeDialog();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response.data.errors || "Failed to save branch",
      });
    }
  };

  const toggleStatus = async () => {
    try {
      const data = {
        branch_id: deactivatingBranch?.id,
      };
      await dispatch(toggleBranchStatusAsyncThunk(data)).unwrap();

      toast({
        title: "Success",
        description:
          deactivatingBranch?.status != "active"
            ? "Branch activated"
            : "Branch deactivated",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.response?.data?.errors || "Failed to update status",
      });
    }
  };

  const handleDeactivationConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!pendingBranch || !deactivationReason.trim()) return;

    toggleStatus(pendingBranch.id, "inactive", deactivationReason);
    setShowDeactivationDialog(false);
    setDeactivationReason("");
    setPendingBranch(null);
  };

  const handleDelete = async () => {
    if (!deletingBranch) return;
    try {
      await dispatch(
        deleteBranchAsyncThunk({ branch_id: deactivatingBranch.id })
      ).unwrap();
      toast({ title: "Success", description: "Branch deleted" });
      setDeactivatingBranch(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to delete branch",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Branch Management</h1>
          <p className="text-muted-foreground mt-1">
            Add and manage gym branches
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Branch
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              All Branches
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-[55%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search branches..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 w-64"
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-40 justify-between mt-2"
                  >
                    {statusFilter === "all"
                      ? "All Status"
                      : statusFilter.charAt(0).toUpperCase() +
                        statusFilter.slice(1)}
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
                <TableHead>Branch ID</TableHead>
                <TableHead>Branch Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64">
                    <div className="flex items-center justify-center h-full">
                      <Loading />
                    </div>
                  </TableCell>
                </TableRow>
              ) : branches.data?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No branches found
                  </TableCell>
                </TableRow>
              ) : (
                branches.data?.map((branch: Branch) => (
                  <TableRow
                    key={branch.id}
                    // className={cn(branch.status !== 'active' && 'opacity-60 bg-muted/30')}
                  >
                    <TableCell className="font-medium">
                      {branch.reference_num}
                    </TableCell>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{branch.address || "-"}</TableCell>
                    <TableCell>{branch.phone || "-"}</TableCell>
                    <TableCell>
                      {branch.branch_ip || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Badge
                          // variant={
                          //   branch.status === "active" ? "default" : "secondary"
                          // }
                          className={
                            branch.status === "active"
                              ? "bg-chart-3/10 text-chart-3 border-chart-3/20"
                              : "bg-chart-5/10 text-chart-5 border-chart-5/20"
                          }
                        >
                          {branch.status || "active"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(branch)}
                          disabled={branch.status != "active"}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeactivatingBranch(branch)}
                          disabled={isDeleting || branch.type === "main"}
                        >
                          <Ban className="h-4 w-4 " />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalRecords={branches?.meta?.total || 0}
            recordsPerPage={recordsPerPage}
            setRecordsPerPage={setRecordsPerPage}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingBranch ? "Edit Branch" : "Add New Branch"}
            </DialogTitle>
            <DialogDescription>
              {editingBranch
                ? "Update branch information"
                : "Create a new gym branch"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <label>
                      Branch Name <span className="text-red-500">*</span>
                    </label>
                    <FormControl>
                      <Input placeholder="e.g., Downtown Branch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                rules={{
                  required: "Branch name is required",
                  minLength: {
                    value: 3,
                    message: "Branch name must be at least 3 characters",
                  },
                  maxLength: {
                    value: 100,
                    message: "Branch name cannot exceed 100 characters",
                  },
                  pattern: {
                    value: /^[A-Za-z0-9\s\-&,'()]+$/,
                    message:
                      "Only letters, numbers, spaces and basic symbols (-&,'()) allowed",
                  },
                  validate: {
                    noLeadingSpace: (v) =>
                      v.trim().length > 0 || "Cannot start with space",
                    noMultipleSpaces: (v) =>
                      !/\s{2,}/.test(v) || "Remove extra spaces",
                  },
                }}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <label>
                      Location / Address <span className="text-red-500">*</span>
                    </label>
                    <FormControl>
                      <Input placeholder="e.g., 123 Main St, City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                rules={{
                  required: "Address is required",
                  // minLength: {
                  //   value: 10,
                  //   message: "Address too short – include street & city",
                  // },
                  maxLength: {
                    value: 200,
                    message: "Address too long (max 200 characters)",
                  },
                  // pattern: {
                  //   value: /^[A-Za-z0-9\s,.\-#&'()]+$/,
                  //   message: "Invalid characters in address",
                  // },
                  // validate: {
                  //   hasCommaOrNumber: (v) =>
                  //     /[0-9]/.test(v) ||
                  //     /,/.test(v) ||
                  //     "Include house number or area/city name",
                  //   noLeadingSpace: (v) =>
                  //     v.trim().length > 0 || "Cannot start with space",
                  // },
                }}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <label>
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <FormControl>
                      <Input
                        maxLength={15}
                        placeholder="0300 123 4567 or +92 300 123 4567"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(
                            /[^\d+\-\s]/g,
                            ""
                          );
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                rules={{
                  required: "Phone number is required",
                  validate: validatePhone, // ← This does the magic
                  maxLength: {
                    value: 15,
                    message: "Phone number too long (max 15 characters)",
                  },
                }}
              />
              <FormField
                control={form.control}
                name="branch_ip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch IP Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 192.168.1.100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{editingBranch ? "Update" : "Create"} Branch</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Deactivation Reason Dialog */}
      <AlertDialog
        open={showDeactivationDialog}
        onOpenChange={setShowDeactivationDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for deactivating "
              <strong>{pendingBranch?.name}</strong>".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>Reason for deactivation</Label>
            <Input
              value={deactivationReason}
              onChange={(e) => setDeactivationReason(e.target.value)}
              placeholder="Enter reason..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeactivationDialog(false);
                setPendingBranch(null);
                setDeactivationReason("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivationConfirm}
              disabled={!deactivationReason.trim() || isToggling}
              className="bg-destructive text-destructive-foreground"
            >
              {isToggling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Deactivate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deactivatingBranch}
        onOpenChange={() => setDeactivatingBranch(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deactivatingBranch?.status === "active"
                ? "Deactivate"
                : "Activate"}{" "}
              Branch?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {deactivatingBranch?.status === "active"
                ? "deactivate"
                : "activate"}{" "}
              <strong>{deactivatingBranch?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={toggleStatus}
              className="bg-destructive text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : deactivatingBranch?.status === "active" ? (
                "Deactivate"
              ) : (
                "Activate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
