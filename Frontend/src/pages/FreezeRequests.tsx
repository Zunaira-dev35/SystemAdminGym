import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createFreezeRequest,
  updateFreezeRequestStatus,
  fetchFreezeRequestsAsyncThunk,
} from "@/redux/pagesSlices/freezeRequestSlice";
import { getUserListAsyncThunk } from "@/redux/pagesSlices/userSlice"; // Add this import
import { RootState, AppDispatch } from "@/redux/store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Snowflake,
  Plus,
  Check,
  X,
  Clock,
  Search,
  User,
  Calendar,
  Building2,
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

import { toast } from "@/hooks/use-toast";
import { PERMISSIONS } from "@/permissions/permissions";
import Pagination from "@/components/shared/Pagination";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getAllMembersAsyncThunk } from "@/redux/pagesSlices/peopleSlice";
import { param } from "drizzle-orm";
// import {  } from "@radix-ui/react-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { backendBasePath } from "@/constants";
import Loading from "@/components/shared/loaders/Loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/permissions/usePermissions";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { formatDateToShortString, formatTimeTo12Hour } from "@/utils/helper";

interface FreezeFormData {
  user_id: string;
  start_date: string;
  reason: string;
}

export default function FreezeRequests() {
  const dispatch = useDispatch<AppDispatch>();

  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { selectedBranchId } = useSelector((state: any) => state.general);

  const userRole = currentUser?.user_type;

  const {
    list: freezeRequests,
    pagination,
    stats,
    loadings,
  } = useSelector((state: RootState) => state.freezeRequest);

  const { members, loadings: usersLoading } = useSelector(
    (state: RootState) => state.people
  );
  // const membersList = members?.data || [];
  const membersList = Array.isArray(members?.data?.data)
    ? members.data.data
    : members.data;
  // console.log("membersList", membersList);

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    id: number;
    action: "approve" | "reject";
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [searchMember, setSearchMember] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const authUser = useSelector((state: any) => state.auth?.user);
  const { hasPermission } = usePermissions();
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined
  );
  // Form State
  const [formData, setFormData] = useState<FreezeFormData>({
    user_id: "",
    start_date: "",
    reason: "",
  });

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [openUserDropdown, setOpenUserDropdown] = useState(false);
  const { loggedBranch } = useSelector((state: any) => state.general);
  const { user } = useSelector((state: any) => state.auth);

  // Fetch freeze requests
  const fetchData = async () => {
    await dispatch(
      fetchFreezeRequestsAsyncThunk({
        search: searchTerm,
        limit: recordsPerPage,
        page: currentPage,
        filter_branch_id: filterBranchId,
      })
    );
  };

  // Fetch users for dropdown
  const fetchMemebers = async () => {
    await dispatch(
      getAllMembersAsyncThunk({
        disable_page_param: 1,
        search: searchMember,
        // filter_branch_id: loggedBranch,
      })
    );
  };

  useEffect(() => {
    fetchMemebers();
  }, [dispatch, searchMember]);

  useEffect(() => {
    fetchData();
  }, [
    dispatch,
    currentPage,
    recordsPerPage,
    searchTerm,
    selectedBranchId,
    filterBranchId,
  ]);

  // const filteredRequests = freezeRequests.filter(
  //   (req) =>
  //     req.member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     req.member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     req.member.reference_num
  //       .toLowerCase()
  //       .includes(searchTerm.toLowerCase()) ||
  //     req.reason.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  const openAddForm = () => {
    setFormData({ user_id: "", start_date: "", reason: "" });
    setSelectedUser(null);
    // Auto-fill user_id for employees immediately
    if (authUser?.user_type === "member" && authUser?.id) {
      setFormData((prev) => ({
        ...prev,
        user_id: String(authUser.id),
      }));
    }
    setIsFormOpen(true);
  };
  const validateForm = () => {
    const newErrors = { user_id: "", start_date: "" };

    if (!formData.user_id) {
      newErrors.user_id = "Please select a member";
    }

    if (!formData.start_date) {
      newErrors.start_date = "Freeze start date is required";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(formData.start_date);
      if (selected < today) {
        newErrors.start_date = "Start date cannot be in the past";
      }
    }

    setErrors(newErrors);
    return !newErrors.user_id && !newErrors.start_date;
  };
  const handleCreate = async () => {
    if (authUser.user_type === "member")
      setFormData({ ...formData, user_id: authUser.id.toString() });
    // console.log("id", authUser.id);
    if (!validateForm()) return;

    if (!formData.user_id) {
      setErrors({ general: "Please select a member" });
      return;
    }
    if (!formData.start_date) {
      setErrors({ general: "Please select a start date" });
      return;
    }
    // if (!formData.reason.trim()) {
    //   setErrors({ general: "Reason is required" });
    //   return;
    // }

    setErrors({}); // Clear previous errors

    try {
      await dispatch(
        createFreezeRequest({
          user_id: Number(formData.user_id),
          start_date: formData.start_date,
          reason: formData.reason.trim(),
        })
      ).unwrap();

      toast({ title: "Freeze request created successfully!" });
      setIsFormOpen(false);
      setFormData({ user_id: "", start_date: "", reason: "" });
      setSelectedUser(null);
      fetchData();
    } catch (err: any) {
      console.log("Freeze error:", err);

      let errorMsg = "Failed to create freeze request";

      // Handle string error from your API
      if (err?.response && typeof err.response === "object") {
        errorMsg = err.response.data.errors;
      }
      // Handle object errors
      else if (err?.message && typeof err.message === "object") {
        errorMsg = Object.values(err.message)[0] as string;
      }
      // Fallback
      else if (err?.message) {
        errorMsg = err.message;
      }

      setErrors({ general: errorMsg });

      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    // console.log("freezing status");
    const data = new FormData();
    data.append("freeze_request_id", confirmAction.id);
    data.append(
      "status",
      confirmAction.action === "approve" ? "approved" : "rejected"
    );
    if (confirmAction.action === "reject" && rejectReason) {
      data.append("reason", rejectReason);
    }

    try {
      await dispatch(updateFreezeRequestStatus(data)).unwrap();
      toast({
        title: "Success",
        description: `Request ${confirmAction.action}ed`,
      });
      fetchData();
      setRejectReason("");
    } catch {
      toast({
        title: "Failed",
        description: `Could not ${confirmAction.action} request`,
        variant: "destructive",
      });
    } finally {
      setConfirmAction(null);
    }
  };
  const ErrorMessage = () => {
    if (Object.keys(errors).length === 0) return null;

    return (
      <div className="mt-0 p-4 bg-chart-5/10 text-chart-5 border-chart-5/20 rounded-lg">
        <p className="text-sm font-medium ">
          {errors.general ||
            errors.errors ||
            "Please fix the following errors:"}
        </p>
      </div>
    );
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20">
            <Check className="h-3 w-3 mr-1" /> Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">
            <X className="h-3 w-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Freeze Requests</h1>
          <p className="text-muted-foreground">
            Manage membership freeze requests
          </p>
        </div>

        <Button
          disabled={
            authUser.user_type === "member" && authUser.status !== "active"
          }
          permission={[PERMISSIONS.FREEZE_REQUEST_CREATE]}
          onClick={openAddForm}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
            <Snowflake className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-5 w-5 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
            <Check className="h-5 w-5 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
            <X className="h-5 w-5 text-chart-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap">
            <CardTitle>All Freeze Requests</CardTitle>
            <div className="relative flex gap-3 flex-wrap">
              <HeaderBranchFilter onBranchChange={setFilterBranchId} />

              <div className="relative">
                <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search member or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Request ID</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Generated Date & Time</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                {userRole !== "member" && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadings.fetch ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Loading />
                  </TableCell>
                </TableRow>
              ) : freezeRequests?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No freeze requests found
                  </TableCell>
                </TableRow>
              ) : (
                freezeRequests?.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {/* <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div> */}
                        <Avatar>
                          {req?.member?.profile_image ? (
                            <AvatarImage
                              src={`${backendBasePath}${req.member.profile_image}`}
                              alt={req?.member?.name}
                            />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {req?.member?.name[0]}
                            {/* {req?.member?.last_name[0]} */}
                          </AvatarFallback>
                        </Avatar>
                        {!req?.member?.name && !req?.member?.reference_num ? (
                          <span className="text-muted-foreground italic text-sm">
                            Deleted Member
                          </span>
                        ) : (
                          <div>
                            <p className="font-medium">{req?.member?.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {req?.member?.reference_num}
                            </p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {req?.reference_num ?? "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDateToShortString(req?.start_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p>
                        {" "}
                        {req?.generate_date &&
                          formatDateToShortString(req?.generate_date)}{" "}
                      </p>
                      <Badge variant="secondary">
                        {req?.generate_time &&
                          formatTimeTo12Hour(req?.generate_time)}
                        {/* {" - "}
                        {req?.end_time && formatTimeTo12Hour(req?.end_time)} */}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-3xs">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="truncate text-sm cursor-help">
                              {req.reason || "—"}
                            </div>
                          </TooltipTrigger>
                          {req.reason && (
                            <TooltipContent
                              side="top"
                              className="max-w-sm break-words"
                            >
                              <p>{req.reason}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>

                    {userRole !== "member" && req.status === "pending" && (
                      <TableCell className="flex items-center justify-end gap-4">
                        <Button
                          permission={[PERMISSIONS.FREEZE_REQUEST_EDIT]}
                          size="sm"
                          className="border-chart-3 p-2 bg-chart-3/10 rounded-xl"
                          onClick={() =>
                            setConfirmAction({ id: req.id, action: "approve" })
                          }
                        >
                          <Check className="h-6 w-6 text-chart-3" />
                          {/* Approve */}
                        </Button>
                        <Button
                          permission={[PERMISSIONS.FREEZE_REQUEST_EDIT]}
                          size="sm"
                          variant="outline"
                          className="border-chart-5 p-2 bg-chart-5/10 rounded-xl"
                          onClick={() =>
                            setConfirmAction({ id: req.id, action: "reject" })
                          }
                        >
                          <X className="h-6 w-6 text-chart-5" />
                          {/* Reject */}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!loadings.getUser && pagination && (
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              recordsPerPage={recordsPerPage}
              setRecordsPerPage={setRecordsPerPage}
              totalRecords={pagination.total}
              recordsPerPageOptions={[5, 10, 20, 50]}
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setErrors({ user_id: "", start_date: "" });
            setFormData({ user_id: "", start_date: "", reason: "" });
            setSelectedUser(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Freeze Request</DialogTitle>
            <DialogDescription>
              Freeze a member's account from a specific date
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            {/* Member Selection */}
            <div className="space-y-2">
              <Label>
                Member <span className="text-red-500">*</span>
              </Label>
              {authUser?.user_type === "member" ? (
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
              ) : hasPermission(PERMISSIONS.FREEZE_REQUEST_VIEW) ? (
                <Popover
                  open={openUserDropdown}
                  onOpenChange={setOpenUserDropdown}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        errors.user_id && "border-red-500"
                      )}
                      disabled={usersLoading?.getMembers}
                    >
                      {selectedUser
                        ? `${selectedUser.name} (${selectedUser.reference_num})`
                        : "Search member..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        onValueChange={(value) => setSearchMember(value)}
                        placeholder="Search member..."
                      />
                      {loadings?.getMembers ? (
                        <div className="py-6 text-center">
                          <Loading size="sm" />
                        </div>
                      ) : membersList?.length === 0 ? (
                        <CommandEmpty>No member found</CommandEmpty>
                      ) : (
                        <div className="max-h-64 overflow-auto">
                          {membersList?.map((u: any) => (
                            <CommandItem
                              key={u.id}
                              onSelect={() => {
                                setSelectedUser(u);
                                setFormData({
                                  ...formData,
                                  user_id: u.id.toString(),
                                });
                                setOpenUserDropdown(false);
                                setErrors((prev) => ({ ...prev, user_id: "" }));
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedUser?.id === u.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div>
                                <p className="font-medium">{u.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {u.reference_num}
                                </p>
                              </div>
                            </CommandItem>
                          ))}
                        </div>
                      )}
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="p-4 border  rounded-lg text-muted-foreground text-sm text-center">
                  <p>You are not authorized to view Freeze Requests</p>
                </div>
              )}

              {errors.user_id && (
                <p className="text-red-500 text-sm mt-1">{errors.user_id}</p>
              )}
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>
                Freeze Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.start_date}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => {
                  setFormData({ ...formData, start_date: e.target.value });
                  setErrors((prev) => ({ ...prev, start_date: "" }));
                }}
                className={cn(errors.start_date && "border-red-500")}
              />
              {errors.start_date && (
                <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>
              )}
            </div>

            {/* Reason – Optional */}
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea
                placeholder="Enter reason for freezing membership..."
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                rows={4}
                className="reason"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loadings.create}>
              {loadings.create && <Loading inButton={true} size="xs" />} Create
              Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "approve" ? "Approve" : "Reject"}{" "}
              Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmAction?.action === "reject" && (
            <div className="space-y-2 mt-4">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              {confirmAction?.action === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
