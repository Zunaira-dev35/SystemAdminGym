import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllMembersAsyncThunk,
  createOrUpdateMemberAsyncThunk,
  unfreezMemberAsyncThunk,
  memberStatsAsyncThunk,
  deleteMemberAsyncThunk,
} from "@/redux/pagesSlices/peopleSlice";
import { RootState } from "@/redux/store";
import { backendBasePath } from "@/constants";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  Snowflake,
  Camera,
  Building2,
  Filter,
  Download,
  UserCheck,
  Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Loading from "@/components/shared/loaders/Loading";
import Pagination from "@/components/shared/Pagination";
import { PERMISSIONS } from "@/permissions/permissions";
import MemberViewModal from "@/components/shared/modal/MemberViewModal";
import { createFreeze } from "@/redux/pagesSlices/freezeRequestSlice";
import FaceCaptureModal from "@/components/faceDetection/FaceCaptureModal";
import { Navigate, NavLink, useNavigate } from "react-router-dom";
import { Link, useLocation } from "wouter";
// import { useNavigate } from 'wouter';
import CustomCheckbox from "@shared/CustomCheckbox";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useCallback } from "react";
import { usePermissions } from "@/permissions/usePermissions";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import DeleteConfirmationModal from "@/components/shared/modal/DeleteConfirmationModal";
import { exportToPDF } from "@/utils/exportToPdf";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface Member {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_image?: string;
  reference_num: string;
  status: "active" | "freeze" | "inactive";
  member_profile?: {
    address?: string;
    birth_date?: string;
    gender?: string;
    current_plan_id?: number;
    current_plan_start_date?: string;
    current_plan_expire_date?: string;
    remaining_days_balance?: number | string;
    plan?: { id: number; name: string };
  };
}

interface FormData {
  id?: number;
  name: string;
  whatsapp_num: string;
  cnic: string;
  email: string;
  phone: string;
  password?: string;
  address: string;
  birth_date: string;
  gender: "male" | "female" | "other";
  // plan_id: string;
  profile_image?: any | null;
}

export default function Members() {
  const dispatch = useDispatch();
  const { members, memberStats, loadings } = useSelector(
    (state: RootState) => state.people
  );
  const { branchesList } = useSelector((state: any) => state.plan);

  const [show, setShow] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  // const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [filter, setFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { hasPermission } = usePermissions();

  const { selectedBranchId } = useSelector((state: any) => state.general);
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined
  );
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [openDelete, setOpenDelete] = useState<any>(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    // last_name: "",
    // email: "",
    phone: "",
    password: "",
    cnic: "",
    whatsapp_num: "",
    address: "",
    birth_date: "",
    gender: "male",
    // plan_id: "",
    profile_image: null,
  });
  const [faceCaptureOpen, setFaceCaptureOpen] = useState(false);
  const [capturedBase64, setCapturedBase64] = useState<any | null>(null);
  const navigate = useNavigate();
  const [location, setLocation] = useLocation();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const { user } = useSelector((state: any) => state.auth);
  useEffect(() => {
    let start_date = dateRange?.from
      ? format(dateRange.from, "yyyy-MM-dd")
      : undefined;

    let end_date = dateRange?.to
      ? format(dateRange.to, "yyyy-MM-dd")
      : start_date;
    dispatch(
      getAllMembersAsyncThunk({
        page: currentPage,
        limit: recordsPerPage,
        search: searchTerm,
        filter_branch_id: filterBranchId,
        filter_status: filter === "all" ? "" : filter,
        ...(start_date && { start_date: start_date }),
        ...(end_date && { end_date: end_date }),
      })
    );
    // dispatch(
    //   memberStatsAsyncThunk({
    //     filter_branch_id: filterBranchId,
    //   })
    // );
  }, [
    dispatch,
    currentPage,
    filter,
    searchTerm,
    recordsPerPage,
    dateRange,
    filterBranchId,
  ]);

  const membersList = members?.data?.data || [];
  const totalRecords = members?.data?.total || 0;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim())
      newErrors.first_name = "First name is required";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    const cleaned = formData.phone.replace(/\D/g, "");
    if (cleaned.length < 9) newErrors.phone = "Phone must be at least 9 digits";
    if (!editingMember && !formData.password)
      newErrors.password = "Password is required";
    // if (!formData.plan_id) newErrors.plan_id = "Plan is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  useEffect(() => {
    if (capturedBase64) {
      console.log(
        "3. State Updated Successfully:",
        capturedBase64.substring(0, 30) + "..."
      );
    }
  }, [capturedBase64]);
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({ title: "Please fix errors", variant: "destructive" });
      return;
    }
    setLoading(true);
    console.log("capturedBase64 in submit", capturedBase64);
    // setFormData({ ...formData, profile_image: capturedBase64});

    const data = new FormData();
    data.append("first_name", formData.first_name.trim());
    data.append("last_name", formData.last_name.trim());
    data.append("email", formData.email.trim());
    data.append("phone", formData.phone.trim());
    data.append("address", formData.address);
    data.append("birth_date", formData.birth_date);
    data.append("gender", formData.gender);
    data.append("profile_image", capturedBase64);
    // data.append("profile_image", formData.profile_image);
    // data.append("plan_id", formData.plan_id);
    // if (formData.profile_image)
    //   data.append("profile_image", formData.profile_image);
    if (!editingMember && formData.password)
      data.append("password", formData.password);
    if (editingMember?.id) data.append("id", editingMember.id.toString());

    try {
      await dispatch(createOrUpdateMemberAsyncThunk({ data })).unwrap();
      toast({ title: editingMember ? "Member updated!" : "Member created!" });

      resetForm();
      dispatch(getAllMembersAsyncThunk({ params: { page: currentPage } }));
      setIsFormOpen(!isFormOpen);
    } catch (err: any) {
      let errorMessage = "Failed to save member";

      if (err?.errors) {
        if (typeof err.errors === "string") {
          errorMessage = err.errors;
        } else if (typeof err.errors === "object") {
          const firstField = Object.keys(err.errors)[0];
          const msgArray = err.errors[firstField];
          errorMessage = Array.isArray(msgArray) ? msgArray[0] : msgArray;
        }
      } else if (err?.message) {
        errorMessage = err.response.data.errors;
      }

      setErrors({ general: errorMessage });

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      id: member.id,
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone,
      address: member.member_profile?.address || "",
      birth_date: member.member_profile?.birth_date || "",
      gender: (member.member_profile?.gender as any) || "male",
      // plan_id: member.member_profile?.current_plan_id?.toString() || "",
      profile_image: null,
    });
    setIsFormOpen(true);
  };

  const handleUnfreeze = async (id: number) => {
    try {
      await dispatch(unfreezMemberAsyncThunk({ user_id: id })).unwrap();
      toast({ title: "Member unfrozen successfully" });
      dispatch(getAllMembersAsyncThunk({ params: { page: currentPage } }));
    } catch(err: any) {
      toast({ title: "Failed to unfreeze", variant: "destructive", description: err?.response?.data?.errors || "An error occurred while unfreezing the member." });
    }
  };
  const handleFreeze = async (id: number) => {
    try {
      await dispatch(createFreeze({ user_id: id })).unwrap();
      toast({ title: "Member frozen successfully" });
      dispatch(getAllMembersAsyncThunk({ params: { page: currentPage } }));
    } catch (err: any) {
      console.log("err", err);
      toast({
        title: err?.response?.data.errors || "Failed to unfreeze",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingMember(null);
    setFormData({
      name: "",
      cnic: "",
      whatsapp_num: "",
      email: "",
      phone: "",
      password: "",
      address: "",
      birth_date: "",
      gender: "male",
      // plan_id: "",
      profile_image: null,
    });
    setErrors({});
  };


  const exportMembersPDF = () => {
    const selectedMembers = membersList.filter(m => selectedIds.has(m.id));
    if (!selectedMembers.length) return;

    exportToPDF({
      title: "Members Report",
      filenamePrefix: "Members",
      columns: [
        { title: "Member ID", dataKey: "reference_num", align: "center", width: 35 },
        { title: "Name", dataKey: "name", align: "left", width: 50 },
        { title: "Phone", dataKey: "phone", align: "center", width: 45 },
        { title: "Plan", dataKey: "plan", align: "center", width: 40 },
        { title: "Remaining Days", dataKey: "remainingDays", align: "center", width: 35 },
        { title: "Expiry", dataKey: "expiry", align: "center", width: 35 },
        { title: "Status", dataKey: "status", align: "center", width: 30 },
      ],
      data: selectedMembers,
      branchInfo: filterBranchId ? branchesList.find(b => b.id === Number(filterBranchId)) : null,
      getRowData: (m: Member) => ({
        reference_num: m.reference_num,
        name: (m.name || '').toUpperCase(),
        phone: m.phone || '—',
        // plan: c.plan?.name
        //     ? `${c.plan.name} ${c.plan.reference_num ? `(${c.plan.reference_num})` : ""}`
        //     : "—",
        plan: m.member_profile?.plan?.name
          ? `${m.member_profile.plan.name} ${m.member_profile.plan.reference_num ? `(${m.member_profile.plan.reference_num})` : ""}`
          : "—",
        // plan: m.member_profile?.plan?.name || 'No Plan',
        remainingDays: m.member_profile?.remaining_days_balance ?? '—',
        expiry: m.member_profile?.current_plan_expire_date
          ? format(new Date(m.member_profile.current_plan_expire_date), "dd MMM yyyy")
          : '—',
        status: m.status?.charAt(0).toUpperCase() + m.status?.slice(1) || '—',
      })
    });
  };

  // const exportPDF = useCallback(() => {
  //   const selectedMembers = membersList.filter((m: Member) =>
  //     selectedIds.has(m.id)
  //   );

  //   // if (selectedMembers.length === 0) {
  //   //   toast({ title: "No members selected", variant: "destructive" });
  //   //   return;
  //   // }

  //   const doc = new jsPDF("l", "mm", "a4");

  //   // Header
  //   doc.setFontSize(18);
  //   doc.text("Members Report", 14, 20);
  //   doc.setFontSize(12);
  //   doc.text(
  //     `Generated on: ${new Date().toLocaleDateString()} • ${
  //       selectedMembers.length
  //     } member(s)`,
  //     14,
  //     30
  //   );

  //   const tableData = selectedMembers.map((m: Member) => [
  //     m.reference_num || "—",
  //     m.name || "—",
  //     m.phone || "—",
  //     m.member_profile?.plan?.name || "No Plan",
  //     m.member_profile?.remaining_days_balance || "—",
  //     m.member_profile?.current_plan_expire_date
  //       ? format(
  //           new Date(m.member_profile.current_plan_expire_date),
  //           "dd MMM yyyy"
  //         )
  //       : "—",
  //     m.status.charAt(0).toUpperCase() + m.status.slice(1),
  //   ]);

  //   autoTable(doc, {
  //     head: [["Member ID", "Name", "Phone", "Plan", "Remaining Days", "Expiry", "Status"]],
  //     body: tableData,
  //     startY: 40,
  //     styles: {
  //       fontSize: 10,
  //       cellPadding: 6,
  //       overflow: "linebreak",
  //     },
  //     headStyles: {
  //       fillColor: [124, 59, 237],
  //       textColor: [255, 255, 255],
  //       fontStyle: "bold",
  //     },
  //     columnStyles: {
  //       0: { cellWidth: 40 },
  //       1: { cellWidth: 30 },
  //       2: { cellWidth: 45 },
  //       3: { cellWidth: 40 },
  //       4: { cellWidth: 40 },
  //       5: { cellWidth: 40, },
  //       6: { cellWidth: 35, },
  //     },
  //   });

  //   doc.save(
  //     `Members_Selected_${selectedIds.size}_${new Date()
  //       .toISOString()
  //       .slice(0, 10)}.pdf`
  //   );
  // }, [membersList, selectedIds]);

  const ErrorMessage = ({ field }: { field: string }) =>
    errors[field] && (
      <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
    );
  const confirmDelete = async () => {
    if (!selectedMember) return;

    try {
      // setActionLoading(recordToDelete);
      await dispatch(
        deleteMemberAsyncThunk({ user_id: selectedMember.id })
      ).unwrap();
      toast({
        title: "Success",
        description: "Member deleted successfully",
      });
      dispatch(
        getAllMembersAsyncThunk({
          page: currentPage,
          limit: recordsPerPage,
          search: searchTerm,
          filter_branch_id: filterBranchId,
          filter_status: filter === "all" ? "" : filter,
        })
      );
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.errors || "Failed to delete Member",
        variant: "destructive",
      });
    } finally {
      setOpenDelete(false);
      setSelectedMember(null);
    }
  };
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Members</h1>
        {/* <Button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Member
        </Button> */}

        <div className="flex gap-4 flex-wrap">
          {hasPermission(PERMISSIONS.MEMBER_EXPORT) && (
            // <Button variant="outline" size="sm" onClick={exportPDF}>
            //   <Download className="h-4 w-4 mr-2" />
            //   PDF
            // </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportMembersPDF}
              className={`mr-2 ${selectedIds.size === 0 ? " cursor-not-allowed" : ""
                }`}
              disabled={selectedIds.size === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}
          <Button
            permission={PERMISSIONS.MEMBER_CREATE}
            onClick={() => navigate("/members/add")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>

        {/* <Link href="/members/add">
    <Plus className="h-4 w-4 mr-2" />
    Add Member
  </Link> */}
      </div>
      {/* <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Members Present
            </CardTitle>
            <UserCheck className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {memberAttendances.data.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Checked in today
            </p>
          </CardContent>
        </Card>
      </div> */}
      <Card>
        <CardHeader>
          <div className="flex justify-between flex-wrap">
            <CardTitle>All Members</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
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
                    <Filter className="h-4 w-4" />
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
                    <SelectItem value={"frozen"}>
                      <div className="flex gap-2">Frozen</div>
                    </SelectItem>
                    <SelectItem value={"expired"}>
                      <div className="flex gap-2">Expired</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
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
          {loadings.getMembers ? (
            <div className="py-10 text-center">
              <Loading />
            </div>
          ) : (
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
                            new Set(membersList.map((m: Member) => m.id))
                          );
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Member ID</TableHead>
                  {user.user_type !== "employee" && (
                    <TableHead>Contact</TableHead>
                  )}
                  {/* {user?.type === "default" && (
                    <TableHead>Password</TableHead>
                  )} */}

                  <TableHead>Plan</TableHead>
                  <TableHead>Remaining Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadings.getMembers ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <Loading />
                    </TableCell>
                  </TableRow>
                ) : membersList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No member found
                    </TableCell>
                  </TableRow>
                ) : (
                  membersList.map((member: Member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <CustomCheckbox
                          checked={selectedIds.has(member.id)}
                          onChange={(checked) => {
                            const newIds = new Set(selectedIds);
                            if (checked) newIds.add(member.id);
                            else newIds.delete(member.id);
                            setSelectedIds(newIds);

                            // Update selectAll state
                            setSelectAll(
                              newIds.size === membersList.length &&
                              membersList.length > 0
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={
                                member.profile_image
                                  ? `${backendBasePath}${member.profile_image}`
                                  : undefined
                              }
                            />
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            {/* <p className="text-xs text-muted-foreground">
                              ID: {member.reference_num}
                            </p> */}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{member.reference_num}</p>
                        </div>
                      </TableCell>
                      {user.user_type !== "employee" && (
                        <TableCell>
                          <div>
                            <p className="text-sm">{member.phone}</p>
                            <p className="text-xs text-muted-foreground">
                              {/* {member.email} */}
                            </p>
                          </div>
                        </TableCell>
                      )}
                      {/* {user?.type === "default" && (
                        <TableCell>
                          <div>
                            <p className="text-sm">{member.password_string}</p>
                            
                          </div>
                        </TableCell>
                      )} */}
                      <TableCell>
                        <div className="flex flex-col w-fit">
                          <p>
                            {member.member_profile?.plan?.name || "No Plan"}
                          </p>

                          <Badge variant="secondary" className="w-fit">
                            {member.member_profile?.plan?.reference_num || "-"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {member?.member_profile?.remaining_days_balance ||
                            "0"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            member.status === "active"
                              ? "bg-chart-3/10 text-chart-3 border-chart-3/20"
                              : member.status === "frozen"
                                ? "bg-chart-2/10 text-chart-2 border-chart-2/20"
                                : member.status === "expired"
                                  ? "bg-chart-5/10 text-chart-5 border-chart-5/20"
                                  : "bg-chart-4/10 text-chart-4 border-chart-1/20"
                          }
                        >
                          {member.status?.toUpperCase()}
                        </Badge>

                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          permission={PERMISSIONS.MEMBER_EDIT}
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`edit/${member.id}`)} // handleEdit(member)
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          permission={PERMISSIONS.MEMBER_VIEW}
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/members/${member.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {hasPermission(PERMISSIONS.MEMBER_DELETE) && (
                          <Button
                            permission={PERMISSIONS.MEMBER_DELETE}
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setOpenDelete(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {member.status !== "inactive" &&
                          (member.status === "frozen" ? (
                            <Button
                              disabled={member.status === "expired"}
                              permission={PERMISSIONS.FREEZE_EDIT}
                              size="sm"
                              onClick={() => handleUnfreeze(member.id)}
                            >
                              <RefreshCw className="h-4 w-4 " /> Unfreeze
                            </Button>
                          ) : (
                            <Button
                              disabled={member.status === "expired"}
                              permission={PERMISSIONS.FREEZE_CREATE}
                              size="sm"
                              onClick={() => handleFreeze(member.id)}
                            >
                              <Snowflake className="h-4 w-4 " /> Freeze
                            </Button>
                          ))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalRecords={totalRecords}
            recordsPerPage={recordsPerPage}
            setRecordsPerPage={setRecordsPerPage}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={() => {
          setIsFormOpen(!isFormOpen);
          setErrors({});
          resetForm();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMember ? "Edit" : "Add"} Member</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={errors.name ? "border-red-500" : ""}
                />
                <ErrorMessage field="name" />
              </div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className={errors.phone ? "border-red-500" : ""}
              />
              <ErrorMessage field="phone" />
            </div>
          </div>

          <div>
            {!editingMember && (
              <div className="relative">
                <Label>Password</Label>
                <Input
                  type={show ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={errors.password ? "border-red-500" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute inset-y-0 right-0 top-8 cursor-pointer flex items-center pr-3 text-muted-foreground hover:text-foreground"
                >
                  {show ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <ErrorMessage field="password" />
              </div>
            )}

            <div>
              <Label>Address</Label>
              <Textarea
                placeholder="Enter Address..."
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Whatsapp Number</Label>
                <Input
                  type="date"
                  value={formData.whatsapp_num}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp_num: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>CNIC</Label>
                <Select
                  value={formData.cnic}
                  onValueChange={(v) =>
                    setFormData({ ...formData, cnic: v as any })
                  }
                >
                  {/* <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>*/}
                </Select>
              </div>
              {/* <div>
                <Label>Plan</Label>
                <Select
                  value={formData.plan_id}
                  onValueChange={(v) =>
                    setFormData({ ...formData, plan_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                  
                    <SelectItem value="1">Basic Plan</SelectItem>
                    <SelectItem value="2">Premium Plan</SelectItem>
                  </SelectContent>
                </Select>
                <ErrorMessage field="plan_id" />
              </div> */}
            </div>

            <div className="space-y-4">
              <Label>Profile Image</Label>

              {/* Preview */}
              {(formData.profile_image || capturedBase64) && (
                <div className="flex justify-center">
                  <img
                    src={
                      formData.profile_image
                        ? URL.createObjectURL(formData.profile_image)
                        : capturedBase64!
                    }
                    alt="Member"
                    className="h-32 w-32 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-center flex-wrap">
                <Button
                  type="button"
                  onClick={() => setFaceCaptureOpen(true)}
                  variant="default"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Face Photo
                </Button>

                <span className="text-sm text-gray-500 self-center">OR</span>

                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({ ...formData, profile_image: file });
                      setCapturedBase64(null); // Clear face capture if manual upload
                    }
                  }}
                />
              </div>
            </div>
          </div>
          {errors.general && (
            <div className="p-4 bg-chart-5/10 text-chart-5 border-chart-5/20 rounded-lg">
              <p className="text-sm">{errors.general}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button disabled={loading} onClick={handleSubmit}>
              {loading && <Loading inButton={true} size="xs" />}
              {editingMember ? "Update" : "Create"} Member
            </Button>
          </DialogFooter>
        </DialogContent>
        <FaceCaptureModal
          open={faceCaptureOpen}
          onClose={() => setFaceCaptureOpen(false)}
          onCapture={(base64: any) => {
            console.log("Captured Base64:", base64); // Debug log

            setCapturedBase64(base64); // This updates the state in Members.tsx
            console.log("Captured Base64:", base64.substring(0, 50) + "..."); // Debug log
          }}
        // onCapture={(base64) => {
        //   console.log("onCpature")
        //   setCapturedBase64(base64);
        //   console.log("base64 inmmemebr",base64)
        //       setFormData({ ...formData, profile_image: base64 });

        // Convert base64 to File for form submission
        // fetch(base64)
        //   .then((res) => res.blob())
        //   .then((blob) => {
        //     const file = new File([blob], "face_capture.jpg", {
        //       type: "image/jpeg",
        //     });
        //     setFormData({ ...formData, profile_image: file });
        //   });
        // }}
        />
      </Dialog>
      <MemberViewModal
        member={viewMember}
        open={!!viewMember}
        onOpenChange={(open) => !open && setViewMember(null)}
      />
      <DeleteConfirmationModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={confirmDelete}
        title="Delete Member"
        message="Are you sure you want to delete this Member? This action cannot be undone."
      />
    </div>
  );
}
