// Updated MyProfile.tsx – Activity Log tab now shows Status History
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState, AppDispatch } from "@/redux/store";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatDateToShortString } from "@/utils/helper";
import { ArrowLeft } from "lucide-react";
import { getMembersAttendanceAsyncThunk } from "@/redux/pagesSlices/generalSlice";
import {
  getAllMembersAsyncThunk,
  memberDetailAsyncThunk,
} from "@/redux/pagesSlices/peopleSlice";
import { Label } from "@/components/ui/label";

export default function MyProfile() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const userId = user?.id;

  // Member data (includes status_history if your backend returns it)
  const { memberDetail, loadings: memberLoading } = useSelector(
    (state: RootState) => state.people
  );
  const member = memberDetail[0] || memberDetail?.data?.data?.[0] || null;
  console.log("memberDetail", memberDetail[0]);
  // Extract status history from member (adjust path based on your API response)
  // Common possibilities: member.status_history, member.member_profile?.status_history, or member.history
  const statusHistory =
    member?.status_history || member?.member_profile?.status_history || [];

  useEffect(() => {
    if (userId) {
      dispatch(
        memberDetailAsyncThunk({
          filter_user_id: userId,
          disable_page_param: 1,
        })
      );
      // No need to fetch attendance anymore since we're focusing on status history
    }
  }, [dispatch, userId]);

  const getBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-chart-3/10 text-chart-3 border-chart-3/20";
      case "freeze":
        return "bg-chart-5/10 text-chart-5 border-chart-5/20";
      case "expired":
        return "bg-chart-5/10 text-chart-5 border-chart-5/20";
      default:
        return "bg-chart-5/10 text-chart-5 border-chart-5/20";
    }
  };

  const getStatusChangeDescription = (record: any) => {
    const from = record.previous_status
      ? record.previous_status.toUpperCase()
      : "NEW";
    const to = record.current_status?.toUpperCase() || "UNKNOWN";
    const by = record.changed_by ? `by ${record.changed_by}` : "by System";

    if (record.reason) {
      return `${from} → ${to} (${record.reason}) ${by}`;
    }
    return `${from} → ${to} ${by}`;
  };

  if (memberLoading.memberDetail || !member) {
    return <Loading />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* <div className="flex items-center gap-3 text-sm mb-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 hover:text-primary transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </button>
        <span>/</span>
        <span className="font-medium">My Profile</span>
      </div> */}

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-xl">
          <CardTitle className="text-2xl">My Profile</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 rounded-lg p-1">
              <TabsTrigger value="general" className="rounded-md">
                General Details
              </TabsTrigger>
              <TabsTrigger value="activity-log" className="rounded-md">
                Status History
              </TabsTrigger>
            </TabsList>

            {/* General Details Tab (unchanged) */}
            <TabsContent value="general" className="space-y-8">
              <div className="flex flex-col md:flex-row items-center gap-8 bg-muted/20 p-6 rounded-xl">
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
                    )} text-lg px-4 py-1`}
                  >
                    {member.status.toUpperCase()}
                  </Badge>
                  <p className="text-muted-foreground text-sm">
                    Member ID: {member.reference_num}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-6 space-y-4">
                  <CardTitle className="text-lg">
                    Personal Information
                  </CardTitle>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">Branch</Label>
                      <p className="font-medium">
                        {member?.branch?.name || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-medium">{member?.phone || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Address</Label>
                      <p className="font-medium">
                        {member.member_profile?.address || "—"}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6 space-y-4">
                  <CardTitle className="text-lg">Contact & ID</CardTitle>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">
                        Whatsapp Number
                      </Label>
                      <p className="font-medium">
                        {member.member_profile?.whatsapp_num ?? "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">CNIC</Label>
                      <p className="font-medium capitalize">
                        {member.member_profile?.cnic || "—"}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
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
                      <Label className="text-muted-foreground">
                        Used Visit Days
                      </Label>
                      <p className="font-medium">
                        {member.member_profile?.used_visit_days ?? "0"}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6 space-y-4">
                  <CardTitle className="text-lg">Visit Allowance</CardTitle>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">
                        Allowed Visit Days (in higher branch)
                      </Label>
                      <p className="font-medium">
                        {member?.member_profile?.allowed_visit_days || "0"}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-6 space-y-4 bg-primary/5 rounded-xl">
                <CardTitle className="text-lg">Current Plan</CardTitle>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Plan Name</span>
                    <Badge variant="secondary" className="text-sm">
                      {member.member_profile?.plan?.name || "No Plan"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan ID</span>
                    <span className="font-bold text-primary">
                      {member.member_profile?.plan?.reference_num ?? "0"} days
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
                  <div className="flex justify-between border-t pt-2 mt-2">
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

            {/* Updated Activity Log → Status History */}
            <TabsContent value="activity-log" className="space-y-6">
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
                                      ? "bg-chart-5/10 text-chart-5 border-chart-5/20"
                                      : "bg-chart-1/10 text-chart-1 border-chart-1/20"
                                  }
                                >
                                  {entry.status.toUpperCase()}
                                </Badge>
                                <p className="text-sm text-muted-foreground">
                                  {format(
                                    new Date(entry.created_at),
                                    "dd MMM yyyy • hh:mm a"
                                  )}
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
