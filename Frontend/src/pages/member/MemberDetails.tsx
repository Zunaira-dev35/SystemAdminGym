// New file: MemberDetails.tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { RootState, AppDispatch } from "@/redux/store";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { backendBasePath } from "@/constants";
import Loading from "@/components/shared/loaders/Loading";
import ReceiptViewModal from "@/components/shared/modal/ReceiptViewModal";
import { fetchFeeCollectionsAsyncThunk } from "@/redux/pagesSlices/feeCollectionSlice";
import { fetchFreezeRequestsAsyncThunk } from "@/redux/pagesSlices/freezeRequestSlice";
import { getPlanTransfersAsyncThunk } from "@/redux/pagesSlices/planSlice";
import {
  memberDetailAsyncThunk,
  memberFeeAsyncThunk,
  memberFreezeAsyncThunk,
  memberAttendanceAsyncThunk,
  memberPlanTransferAsyncThunk,
} from "@/redux/pagesSlices/peopleSlice";
import { PERMISSIONS } from "@/permissions/permissions";
import { usePermissions } from "@/permissions/usePermissions";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatDateToShortString, formatTimeTo12Hour } from "@/utils/helper";
import { ArrowLeft, Search } from "lucide-react";
import { getAttendenceAsyncThunk } from "@/redux/pagesSlices/hrmSlice";
import { getMembersAttendanceAsyncThunk } from "@/redux/pagesSlices/generalSlice";
import { Input } from "@/components/ui/input";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import Pagination from "@/components/shared/Pagination";
import AdvanceFeeCollectionTable from "./AdvanceFeeCollectionTable";

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
    plan?: { id: number; name: string };
  };
}

export default function MemberDetails() {
  // const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  const {
    memberDetail,
    memberFee,
    memberFreeze,
    memberAttendance,
    memberPlanTransfer,
    loadings,
  } = useSelector((state: RootState) => state.people);
  console.log("memberDetail", memberDetail);
  const member = memberDetail[0] || null; // Since response.data.data is array
  const feeCollections = memberFee;
  const freezeRequests = memberFreeze;
  const attendanceList = memberAttendance;
  const planTransfers = memberPlanTransfer;
  console.log("freezeRequests", freezeRequests);
  console.log('member', member);

  // Receipt modal
  const [openReceipt, setOpenReceipt] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  // Local filters (independent of other pages)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined
  );
  const [currentPage, setCurrentPage] = useState({
    fee: 1,
    freeze: 1,
    attendance: 1,
    transfer: 1,
  });
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const { id: paramId } = useParams<{ id: string }>(); // ID from URL (Admin view)
  // 1. Get logged in user ID from Auth State
  const { user } = useSelector((state: RootState) => state.auth);


  // 2. Determine which ID to use
  // If no paramId exists in URL, we are on the "/my-profile" route
  const activeUserId = paramId || user?.id;
  const isMyProfile = !paramId;
  // Independent state for each tab
  const [feeTab, setFeeTab] = useState({
    search: "",
    branchId: undefined as string | undefined,
    page: 1,
    limit: 10,
  });

  const [freezeTab, setFreezeTab] = useState({
    search: "",
    branchId: undefined as string | undefined,
    page: 1,
    limit: 10,
  });

  const [attendanceTab, setAttendanceTab] = useState({
    search: "",
    branchId: undefined as string | undefined,
    page: 1,
    limit: 10,
  });

  const [transferTab, setTransferTab] = useState({
    search: "",
    branchId: undefined as string | undefined,
    page: 1,
    limit: 10,
  });

  const planStartDate = member?.member_profile?.current_plan_start_date;
  const isUpcomingPlan = planStartDate ? new Date(planStartDate) > new Date() : false;

  // Fetch member detail once
  useEffect(() => {
    if (activeUserId) {
      dispatch(
        memberDetailAsyncThunk({
          filter_user_id: activeUserId,
          disable_page_param: 1,
        })
      );
    }
  }, [dispatch, activeUserId]);

  // Fee Collection
  useEffect(() => {
    if (activeUserId) {
      dispatch(
        memberFeeAsyncThunk({
          filter_user_id: activeUserId,
          search: feeTab.search,
          filter_branch_id: feeTab.branchId,
          page: feeTab.page,
          limit: feeTab.limit,
        })
      );
    }
  }, [dispatch, activeUserId, feeTab]);

  // Freeze Requests
  useEffect(() => {
    if (activeUserId) {
      dispatch(
        memberFreezeAsyncThunk({
          filter_user_id: activeUserId,
          search: freezeTab.search,
          filter_branch_id: freezeTab.branchId,
          page: freezeTab.page,
          limit: freezeTab.limit,
        })
      );
    }
  }, [dispatch, activeUserId, freezeTab]);

  // Attendance
  useEffect(() => {
    if (activeUserId) {
      dispatch(
        memberAttendanceAsyncThunk({
          filter_user_id: activeUserId,
          search: attendanceTab.search,
          filter_branch_id: attendanceTab.branchId,
          page: attendanceTab.page,
          limit: attendanceTab.limit,
        })
      );
    }
  }, [dispatch, activeUserId, attendanceTab]);

  // Plan Transfer
  useEffect(() => {
    if (activeUserId) {
      dispatch(
        memberPlanTransferAsyncThunk({
          filter_user_id: activeUserId,
          search: transferTab.search,
          filter_branch_id: transferTab.branchId,
          page: transferTab.page,
          limit: transferTab.limit,
        })
      );
    }
  }, [dispatch, activeUserId, transferTab]);

  const getBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-chart-3/10 text-chart-3 border-chart-3/20";
      case "freeze":
        return "bg-chart-5/10 text-chart-5 border-chart-5/20";
      case "expired":
        return "bg-chart-5/10 text-chart-5 border-chart-5/20";
      default:
        return "bg-chart-4/10 text-chart-4 border-chart-5/20";
    }
  };

  if (loadings.memberDetail) {
    return <Loading />;
  }

  if (!member) {
    return <p>Member not found</p>;
  }
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 text-sm mb-8">
        {!isMyProfile ? (
          <>
            <button
              onClick={() => navigate("/members")}
              className="flex items-center gap-2 hover:text-primary transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Member
            </button>
            <span>/</span>
            <span className="font-medium">{`Member Details - ${member?.name}`}</span>
          </>
        ) : (
          <span className="font-medium text-lg">My Profile</span>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{isMyProfile ? "My Profile" : "Member Details"}</CardTitle>{" "}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList className="flex flex-wrap justify-start h-auto w-full bg-muted/50 p-1 gap-1">
              <TabsTrigger value="general" className="flex-1 min-w-[80px]">
                General
              </TabsTrigger>
              <TabsTrigger
                value="status-history"
                className="flex-1 min-w-[140px]"
              >
                Membership History
              </TabsTrigger>
              <TabsTrigger
                value="activity-log"
                className="flex-1 min-w-[100px]"
              >
                Activity Logs
              </TabsTrigger>
              <TabsTrigger
                value="fee-collection"
                className="flex-1 min-w-[100px]"
              >
                Fee Collection
              </TabsTrigger>
              <TabsTrigger
                value="freeze-request"
                className="flex-1 min-w-[100px]"
              >
                Freeze Request
              </TabsTrigger>
              <TabsTrigger value="attendance" className="flex-1 min-w-[100px]">
                Attendance
              </TabsTrigger>
              <TabsTrigger
                value="plan-transfer"
                className="flex-1 min-w-[120px]"
              >
                Plan Transfer
              </TabsTrigger>
              <TabsTrigger
                value="advance"
                className="flex-1 min-w-[180px]"
              >
                Advance Fee collections
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-8">
              {/* Profile Header Section */}
              <div className="flex flex-col md:flex-row items-center gap-8 bg-muted/20 p-6 rounded-xl mt-4">
                <Avatar className="h-32 w-32 ring-4 ring-primary/20">
                  <AvatarImage
                    src={`${backendBasePath}${member.profile_image}`}
                  />
                  <AvatarFallback className="text-4xl bg-primary/10">
                    {member.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-3 text-center md:text-left">
                  <h2 className="text-3xl font-bold">{member.name}</h2>
                  <Badge
                    className={`${getBadgeVariant(
                      member.status
                    )} text-base px-4 py-1`}
                  >
                    {member.status.toUpperCase()}
                  </Badge>
                  <p className="text-muted-foreground text-sm">
                    Member ID: {member.reference_num}
                  </p>
                </div>
              </div>

              {/* Personal & Contact Grid */}
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-6 space-y-4">
                  <CardTitle className="text-lg">
                    Personal Information
                  </CardTitle>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2">

                      <div>
                        <Label className="text-muted-foreground">Branch</Label>
                        <div className="flex flex-col gap-0">
                          {member?.branch?.name || "—"}

                          <Badge variant="secondary" className="w-fit">
                            {member?.branch?.reference_num || "—"}
                          </Badge>
                        </div>
                      </div>
                      {user?.user_type !== "employee" && (
                        <div>
                          <Label className="text-muted-foreground">
                            Phone / Whatsapp Number
                          </Label>
                          <p className="font-medium">{member?.phone || "—"}</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2">
                      <div>
                        <Label className="text-muted-foreground">Address</Label>
                        <p className="font-medium">
                          {member.member_profile?.address || "—"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">CNIC</Label>
                        <p className="font-medium capitalize">
                          {member.member_profile?.cnic || "—"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Register Date
                      </Label>
                      <p className="font-medium">
                        {member?.member_profile?.register_date ?? "—"}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6 space-y-4">
                  <CardTitle className="text-lg">
                    Visit Allowance
                    <p className="text-sm text-muted-foreground">
                      (in higher branch)
                    </p>
                  </CardTitle>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">
                        Allowed Visit Days
                      </Label>
                      <p className="font-medium">
                        {member?.member_profile?.allowed_visit_days || "0"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Used Visit Days
                      </Label>
                      <p className="font-medium">
                        {member.member_profile?.used_visit_days ?? "0"}
                      </p>
                    </div>
                  </div>
                </Card>
                {/* <Card className="p-6 space-y-4">
                  <CardTitle className="text-lg">Contact & ID</CardTitle>
                  <div className="space-y-3">
                    {user?.user_type !== "employee" && (
                      <div>
                        <Label className="text-muted-foreground">
                          Whatsapp Number
                        </Label>
                        <p className="font-medium">
                          {member.member_profile?.whatsapp_num ?? "—"}
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">CNIC</Label>
                      <p className="font-medium capitalize">
                        {member.member_profile?.cnic || "—"}
                      </p>
                    </div>
                  </div>
                </Card> */}
              </div>

              {/* Membership & Visits Grid */}
              {/* <div className="grid md:grid-cols-2 gap-8">
               <Card className="p-6 space-y-4">
                  <CardTitle className="text-lg">Membership Details</CardTitle>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">
                        Register Date
                      </Label>
                      <p className="font-medium">
                        {member?.member_profile?.register_date ?? "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Shift</Label>
                      <p className="font-medium">
                        {member?.member_profile?.shift && (
                          <Badge variant={"ghost"}>
                            {member?.member_profile?.shift?.reference_num ||
                              "-"}
                          </Badge>
                        )}{" "}
                        {member?.member_profile?.shift?.name ?? "—"}
                      </p>
                    </div>
                  </div>
                </Card> 

                <Card className="p-6 space-y-4">
                  <CardTitle className="text-lg">
                    Visit Allowance
                    <p className="text-sm text-muted-foreground">
                      (in higher branch)
                    </p>
                  </CardTitle>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">
                        Allowed Visit Days
                      </Label>
                      <p className="font-medium">
                        {member?.member_profile?.allowed_visit_days || "0"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Used Visit Days
                      </Label>
                      <p className="font-medium">
                        {member.member_profile?.used_visit_days ?? "0"}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>*/}

              {/* Current Plan Highlight Card */}
              <Card className="p-6 space-y-4 bg-primary/5 rounded-xl border-primary/10">
                <CardTitle className="text-lg">
                  {isUpcomingPlan ? "Upcoming Plan" : "Current Plan"}
                </CardTitle>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan ID</span>
                    <Badge variant="secondary" className="text-sm">
                      {member.member_profile?.plan?.reference_num ?? "-"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Plan Name</span>
                    <span className="font-medium">
                      {member.member_profile?.plan?.name || "No Plan"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date</span>
                    <span className="font-medium">
                      {member.member_profile?.current_plan_start_date
                        ? formatDateToShortString(
                          member.member_profile.current_plan_start_date
                        )
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expiry Date</span>
                    <span className="font-medium">
                      {member.member_profile?.current_plan_expire_date
                        ? formatDateToShortString(
                          member.member_profile.current_plan_expire_date
                        )
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration Days</span>
                    <span className="font-medium">
                      {member.member_profile?.plan?.duration_days ?? "0"} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Grace Period</span>
                    <span className="font-medium">
                      {member.member_profile?.plan?.freeze_allowed_days == null ||
                        member.member_profile?.plan?.freeze_allowed_days === 0
                        ? "Unlimited"
                        : `${member.member_profile?.plan?.freeze_allowed_days} days`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Freeze Request Credits</span>
                    <span className="font-medium">
                      {member.member_profile?.plan?.freeze_allowed_count == null ||
                        member.member_profile?.plan?.freeze_allowed_count === 0
                        ? "Unlimited"
                        : `${member.member_profile?.plan?.freeze_allowed_count} days`}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2 text-xl font-bold">
                    <span className="text-muted-foreground">
                      Remaining Days
                    </span>
                    <span className="font-bold text-primary">
                      {member.member_profile?.remaining_days_balance ?? "0"}{" "}
                      days
                    </span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Activity Log Tab */}
            <TabsContent value="status-history" className="space-y-6">
              {member?.status_history?.length > 0 ? (
                <div className="relative">
                  {/* Timeline Vertical Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted"></div>

                  <div className="space-y-8">
                    {member.status_history
                      //   .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Latest first
                      .map((entry: any) => (
                        <div key={entry.id} className="flex gap-6 relative">
                          {/* Timeline Dot */}
                          <div className="w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                          </div>

                          {/* Content Card */}
                          <Card className="flex-1 p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <Badge
                                  className={
                                    entry.status === "active"
                                      ? "bg-chart-3/10 text-chart-3 border-chart-3/20"
                                      : entry.status === "frozen"
                                        ? "bg-chart-2/10 text-chart-2 border-chart-2/20"
                                        : entry.status === "expired"
                                          ? "bg-chart-1/10 text-chart-5 border-chart-1/20"
                                          : "bg-chart-3/10 text-chart-4 border-chart-1/20"
                                  }
                                >
                                  {entry.status.toUpperCase()}
                                </Badge>

                                <p className="text-sm text-muted-foreground">
                                  {entry?.date
                                    ? formatDateToShortString(entry.date)
                                    : "—"}{" "}
                                  {entry?.time
                                    ? formatTimeTo12Hour(entry.time)
                                    : ""}
                                </p>

                              </div>
                              <Badge variant="outline" className="text-xs">
                                Updated by: {entry.created_by?.name || "System"}
                              </Badge>
                            </div>

                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  Plan:
                                </span>{" "}
                                <span className="text-xs bg-muted-foreground/10 py-1 px-2 rounded-md">
                                  {entry?.plan_reference_num}
                                </span>{" "}
                                <span className="font-medium">
                                  {entry?.plan_name || "—"}
                                  {/* ({entry.plan_total_days} days) */}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Start:
                                </span>{" "}
                                <span className="font-medium">
                                  {formatDateToShortString(
                                    entry.plan_start_date
                                  )}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Expiry:
                                </span>{" "}
                                <span className="font-medium">
                                  {entry.plan_expire_date
                                    ? formatDateToShortString(
                                      entry.plan_expire_date
                                    )
                                    : "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Remaining:
                                </span>{" "}
                                <span className="font-medium">
                                  {entry.remaining_days} days
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Duration:
                                </span>{" "}
                                <span className="font-medium">
                                  {entry.plan_total_days} days
                                </span>
                              </div>
                            </div>
                          </Card>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="text-center py-12">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      No activity found
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This member's status history is empty.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="activity-log" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    System Activity Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {member?.activity_logs?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-bold">Action</TableHead>
                          <TableHead className="font-bold">
                            Description
                          </TableHead>
                          <TableHead className="font-bold">Timestamp</TableHead>
                          <TableHead className="font-bold">Branch</TableHead>
                          <TableHead className="font-bold">
                            IP Address
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {member.activity_logs.map((log: any) => (
                          <TableRow
                            key={log.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="capitalize bg-primary/5 text-primary border-primary/20"
                              >
                                {log.action_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-md text-sm">
                              {log.action_description}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">
                                  {formatDateToShortString(log.date)}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {log.time && formatTimeTo12Hour(log.time)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-md text-sm">
                              <div className="flex flex-col gap-0 whitespace-nowrap">
                                <p>{log?.branch?.name || "Main Branch"}</p>
                                <Badge variant="secondary" className="w-fit">
                                  {log?.branch?.reference_num || "-"}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {log.device_ip || "N/A"}
                              </code>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground italic">
                        No system activity recorded yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="fee-collection">
              <div className="flex items-center justify-end gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search fee collections..."
                    value={feeTab.search}
                    onChange={(e) =>
                      setFeeTab((prev) => ({
                        ...prev,
                        search: e.target.value,
                        page: 1,
                      }))
                    }
                    className="pl-9"
                  />
                </div>
                <HeaderBranchFilter
                  onBranchChange={(branchId) =>
                    setFeeTab((prev) => ({ ...prev, branchId, page: 1 }))
                  }
                />
              </div>
              {loadings.memberFee ? (
                <Loading />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Collection ID</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Collected By</TableHead>
                        <TableHead>Receipt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeCollections?.fee_collections?.data?.length > 0 ? (
                        feeCollections.fee_collections.data.map((c: any) => (
                          <TableRow key={c.id}>
                            <TableCell>{c.reference_num}</TableCell>
                            <TableCell>
                              {" "}
                              <div className="flex flex-col gap-0">
                                {c.plan?.name}
                                <Badge variant="secondary" className="w-fit">
                                  {c.plan?.reference_num}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {feeCollections.system_currency || "Rs."}{" "}
                              {c.amount?.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {c.deposit_method}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDateToShortString(c.generate_date)}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex flex-col gap-0">
                                <p>{c.branch?.name || "Main Branch"}</p>

                                <Badge variant="secondary" className="w-fit">
                                  {c.branch?.reference_num}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">
                                {c.created_by_user.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: {c.created_by_user.reference_num}
                              </p>
                            </TableCell>
                            <TableCell>
                              {hasPermission(
                                PERMISSIONS.FEE_COLLECTION_VIEW
                              ) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedReceipt(c);
                                      setOpenReceipt(true);
                                    }}
                                  >
                                    View
                                  </Button>
                                )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-10 text-muted-foreground"
                          >
                            No fee collections found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <Pagination
                    currentPage={feeTab.page}
                    setCurrentPage={(page) =>
                      setFeeTab((prev) => ({ ...prev, page }))
                    }
                    totalRecords={memberFee?.fee_collections?.total || 0}
                    recordsPerPage={feeTab.limit}
                    setRecordsPerPage={(limit) =>
                      setFeeTab((prev) => ({ ...prev, limit, page: 1 }))
                    }
                    recordsPerPageOptions={[5, 10, 20, 50]}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="freeze-request">
              <div className="flex items-center justify-end gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search freeze collections..."
                    value={freezeTab.search}
                    onChange={(e) =>
                      setFreezeTab((prev) => ({
                        ...prev,
                        search: e.target.value,
                        page: 1,
                      }))
                    }
                    className="pl-9"
                  />
                </div>
                <HeaderBranchFilter
                  onBranchChange={(branchId) =>
                    setFreezeTab((prev) => ({ ...prev, branchId, page: 1 }))
                  }
                />
              </div>
              {loadings.memberFreeze ? (
                <Loading />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request ID</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {freezeRequests?.freeze_requests?.data?.length > 0 ? (
                        freezeRequests?.freeze_requests?.data?.map(
                          (req: any) => (
                            <TableRow key={req.id}>
                              <TableCell>{req.reference_num}</TableCell>
                              <TableCell>
                                {formatDateToShortString(req.start_date)}
                              </TableCell>
                              <TableCell>
                                {(req.end_date &&
                                  formatDateToShortString(req.end_date)) ??
                                  "-"}
                              </TableCell>
                              <TableCell className="max-w-xs">
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
                              <TableCell>
                                <Badge
                                  className={
                                    req.status === "approved"
                                      ? "bg-chart-3/10 text-chart-3 border-chart-3/20"
                                      : req.status === "rejected"
                                        ? "bg-chart-5/10 text-chart-5 border-chart-5/20"
                                        : "bg-chart-1/10 text-chart-1 border-chart-1/20"
                                  }
                                >
                                  {req.status.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-0">
                                  <p>{req.branch?.name || "Main Branch"}</p>
                                  <Badge variant="secondary" className="w-fit">
                                    {req.branch?.reference_num}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                {/* {formatDateToShortString(req.created_at)} */}
                                <p>
                                  {" "}
                                  {req?.generate_date &&
                                    formatDateToShortString(
                                      req?.generate_date
                                    )}{" "}
                                </p>
                                <Badge variant="secondary">
                                  {req?.generate_time &&
                                    formatTimeTo12Hour(req?.generate_time)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        )
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-10 text-muted-foreground"
                          >
                            No freeze requests found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <Pagination
                    currentPage={freezeTab.page}
                    setCurrentPage={(page) =>
                      setFreezeTab((prev) => ({ ...prev, page }))
                    }
                    totalRecords={memberFee?.fee_collections?.total || 0}
                    recordsPerPage={freezeTab.limit}
                    setRecordsPerPage={(limit) =>
                      setFreezeTab((prev) => ({ ...prev, limit, page: 1 }))
                    }
                    recordsPerPageOptions={[5, 10, 20, 50]}
                  />
                </>
              )}
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="space-y-6">
              <div className="flex items-center justify-end gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search attendances..."
                    value={attendanceTab.search}
                    onChange={(e) =>
                      setAttendanceTab((prev) => ({
                        ...prev,
                        search: e.target.value,
                        page: 1,
                      }))
                    }
                    className="pl-9"
                  />
                </div>
                <HeaderBranchFilter
                  onBranchChange={(branchId) =>
                    setAttendanceTab((prev) => ({ ...prev, branchId, page: 1 }))
                  }
                />
              </div>
              {loadings.memberAttendance ? (
                <div className="py-16 text-center">
                  <Loading />
                </div>
              ) : attendanceList?.data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        {/* <TableHead>Day</TableHead> */}
                        <TableHead>Check In</TableHead>
                        {/* <TableHead>Check Out</TableHead> */}
                        {/* <TableHead>Duration</TableHead> */}
                        <TableHead>Type</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Marked By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceList?.data?.map((record: any) => {
                        const checkIn = record.checkin_time
                          ? new Date(`1970-01-01T${record.checkin_time}Z`)
                          : null;
                        const checkOut = record.checkout_time
                          ? new Date(`1970-01-01T${record.checkout_time}Z`)
                          : null;

                        let duration = "—";
                        if (checkIn && checkOut) {
                          const diffMs = checkOut.getTime() - checkIn.getTime();
                          const hours = Math.floor(diffMs / (1000 * 60 * 60));
                          const minutes = Math.floor(
                            (diffMs % (1000 * 60 * 60)) / (1000 * 60)
                          );
                          duration = `${hours}h ${minutes}m`;
                        } else if (checkIn && !checkOut) {
                          duration = "In Progress";
                        }

                        return (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {formatDateToShortString(record.date)}
                            </TableCell>
                            <TableCell>
                              {checkIn
                                ? formatTimeTo12Hour(record?.checkin_time)
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  record.checkin_type === "manual"
                                    ? "bg-chart-4/10 text-chart-4 border-chart-4"
                                    : "bg-chart-3/10 text-chart-3 border-chart-3"
                                }
                              >
                                {record.checkin_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex flex-col gap-0">
                                {record.branch?.name || "Main Branch"}
                                <Badge variant="secondary" className="w-fit">
                                  {record.branch?.reference_num}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {record.created_by_user?.name || "System"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <Pagination
                    currentPage={attendanceTab.page}
                    setCurrentPage={(page) =>
                      setAttendanceTab((prev) => ({ ...prev, page }))
                    }
                    totalRecords={attendanceList?.total || 0}
                    recordsPerPage={attendanceTab.limit}
                    setRecordsPerPage={(limit) =>
                      setAttendanceTab((prev) => ({ ...prev, limit, page: 1 }))
                    }
                    recordsPerPageOptions={[5, 10, 20, 50]}
                  />
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="text-center py-12">
                    {/* <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" /> */}
                    <p className="text-lg font-medium text-muted-foreground">
                      No attendance records found
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This member has not checked in yet.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Optional: Summary Stats */}
              {/* {attendanceList?.data?.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Visits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {attendanceList.data.length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        This Month
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {
                          attendanceList.data.filter(
                            (a: any) =>
                              new Date(a.date).getMonth() ===
                              new Date().getMonth()
                          ).length
                        }
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active Streak
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">—</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Last Visit
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-medium">
                        {attendanceList[0]
                          ? format(
                              new Date(attendanceList[0].date),
                              "dd MMM yyyy"
                            )
                          : "—"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )} */}
            </TabsContent>

            <TabsContent value="plan-transfer">
              <div className="flex items-center justify-end gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search plan transfer..."
                    value={transferTab.search}
                    onChange={(e) =>
                      setTransferTab((prev) => ({
                        ...prev,
                        search: e.target.value,
                        page: 1,
                      }))
                    }
                    className="pl-9"
                  />
                </div>
                <HeaderBranchFilter
                  onBranchChange={(branchId) =>
                    setTransferTab((prev) => ({ ...prev, branchId, page: 1 }))
                  }
                />
              </div>
              {loadings.memberPlanTransfer ? (
                <Loading />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transfer ID</TableHead>
                        <TableHead>From Plan</TableHead>
                        <TableHead>To Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {planTransfers?.data?.length > 0 ? (
                        planTransfers.data.map((t: any) => (
                          <TableRow key={t.id}>
                            <TableCell>{t.reference_num}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0">
                                {t?.previous_plan?.name}
                                <Badge variant="secondary" className="w-fit">
                                  {t?.previous_plan?.reference_num || "-"}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0">
                                {t?.transfered_plan?.name}
                                <Badge variant="secondary" className="w-fit">
                                  {t?.transfered_plan?.reference_num || "-"}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {t.system_currency || "Rs."}{" "}
                              {t.new_plan_remaining_fee.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {t.deposit_method}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex flex-col gap-0">
                                {t.branch?.name || "Main Branch"}
                                <Badge variant="secondary" className="w-fit">
                                  {t.branch?.reference_num}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDateToShortString(t.generate_date)}
                            </TableCell>
                            <TableCell>
                              {hasPermission(
                                PERMISSIONS.PLAN_TRANSFER_VIEW
                              ) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      navigate(`/plan-transfer/${t.id}`);
                                      //   setSelectedReceipt(t);
                                      //   setOpenReceipt(true);
                                    }}
                                    permission={PERMISSIONS.PLAN_TRANSFER_VIEW}
                                  >
                                    View
                                  </Button>
                                )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-10 text-muted-foreground"
                          >
                            No plan transfers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <Pagination
                    currentPage={transferTab.page}
                    setCurrentPage={(page) =>
                      setTransferTab((prev) => ({ ...prev, page }))
                    }
                    totalRecords={memberPlanTransfer?.total || 0}
                    recordsPerPage={transferTab.limit}
                    setRecordsPerPage={(limit) =>
                      setTransferTab((prev) => ({ ...prev, limit, page: 1 }))
                    }
                  // recordsPerPageOptions={[5, 10, 20, 50]}
                  />
                </>
              )}
            </TabsContent>
            <TabsContent value="advance">
              <AdvanceFeeCollectionTable />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ReceiptViewModal
        receipt={selectedReceipt}
        open={openReceipt}
        onClose={() => setOpenReceipt(false)}
      />
    </div>
  );
}
