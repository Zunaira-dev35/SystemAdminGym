import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Package, Clock, Building2, Users, Briefcase, UserCheck, Plus, PersonStanding } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Loading from "@/components/shared/loaders/Loading";

import { getSubscriptionDetailsAsyncThunk } from "@/redux/pagesSlices/generalSlice";
import { AppDispatch, RootState } from "@/redux/store";
import Invoices from "./Invoices";
import SubscriptionHistory from "./SubcriptionHistory";
import { formatDateToShortString } from "@/utils/helper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { backendBasePath } from "@/constants";

export default function GymDetail() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { subscriptionDetails, loadings } = useSelector((state: RootState) => state.general);
  const user = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState("overview");
  const defaultUser = user.gym_id;
  // const defaultUser = user.type === "default";


  const isLoading = loadings?.getSubscriptionDetails;
  const gymId = Number(id);

  const location = useLocation();
  const passedGym = location.state?.fullGymFromList;

  useEffect(() => {
    if (gymId || defaultUser) {
      dispatch(getSubscriptionDetailsAsyncThunk({ gym_id: gymId || defaultUser }));
    }
  }, [dispatch, gymId, defaultUser]);

  const data = subscriptionDetails || {};
  const gym = data.gym || {};

  const remainingDays = data.remaining_package_days ?? 0;
  const totalDays = data.total_package_days ?? 0;
  const usedDays = data.used_package_days ?? 0;

  const branchUsed = data.branch_used_limit ?? 0;
  const branchTotal = data.branch_limit ?? 0;

  const memberUsed = data.member_used_limit ?? 0;
  const memberTotal = data.member_limit ?? 0;

  const employeeUsed = data.employee_used_limit ?? 0;
  const employeeTotal = data.employee_limit ?? 0;

  const userUsed = data.user_used_limit ?? 0;
  const userTotal = data.user_limit ?? 0;

  const employeePercentage = Math.round(data.employee_usage_percentage ?? 0);
  const userPercentage = Math.round(data.user_usage_percentage ?? 0);

  const CircularProgress = ({ percentage, color }: { percentage: number; color: string }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (circumference * percentage) / 100;

    return (
      <div className="relative h-28 w-28 sm:h-32 sm:w-32">
        <svg className="h-full w-full" viewBox="0 0 100 100">
          <circle
            className="text-gray-200"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          <circle
            className={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl sm:text-3xl font-bold">{percentage}%</span>
        </div>
      </div>
    );
  };

  const OverviewContent = () => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="bg-background">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                Current Package
              </CardTitle>
              {/* <Badge
                className={
                  gym.status === "active"
                    ? "bg-chart-3/10 text-chart-3 border-chart-3/10"
                    : "bg-chart-4/10 text-chart-4 border-chart-4/10"
                }
              >
                {gym.status?.toUpperCase() || "UNKNOWN"}
              </Badge> */}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3
                  className={
                    gym.package_name
                      ? "text-lg"
                      : "text-base text-muted-foreground"
                  }
                >
                  {gym.package_name || "Package Not Assigned"}
                </h3>

                <p className="text-sm text-muted-foreground mt-1">
                  {gym.system_currency || "Rs"} {gym.price?.toLocaleString() || "—"} / {gym.duration || "—"}
                </p>
              </div>
              <div className="text-sm">
                {/* {formatDateToShortString(exp.date)} */}
                <div className="font-medium">Start Date: {formatDateToShortString(gym.package_start_date || "—")}</div>
                <div className="font-medium">Renewal Date: {formatDateToShortString(gym.package_renewal_date || "—")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="bg-purple-100 p-2 rounded-full">
                  <PersonStanding className="h-5 w-5 text-purple-600" />
                </div>
                Default User Details
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <h3 className="text-base font-medium">{gym?.default_user?.name || "—"}</h3>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Reference ID</p>
                <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm font-medium">
                  {gym?.default_user?.reference_num || "—"}
                </span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm font-medium">
                  {gym?.default_user?.roles?.[0]?.name || "—"}
                </span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Password</p>
                <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm font-medium">
                  {gym?.default_user?.password_string || "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-full">
                <Clock className="h-5 w-5 text-chart-1" />
              </div>
              Remaining Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-2xl sm:text-3xl font-bold">
                {remainingDays} Days Left
              </div>
              <Progress
                value={totalDays > 0 ? (remainingDays / totalDays) * 100 : 0}
                className="h-2"
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Days</p>
                  <p className="font-medium">{totalDays}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Used Days</p>
                  <p className="font-medium">{usedDays}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* <Card className="bg-chart-1 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-full">
                <Package className="h-5 w-5" />
              </div>
              Expansion Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-lg">Upgrade Branches</p>
              <p className="text-sm opacity-90">
                You've currently used {branchUsed || 0} of your {branchTotal || 0} branch slots.
              </p>
              <Button
                variant="secondary"
                className="w-full bg-white/20 hover:bg-white/30 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Branch Slot
              </Button>
            </div>
          </CardContent>
        </Card> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Branch Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex flex-col">
            <p className="text-xl font-semibold mb-2 shrink-0">
              {branchUsed || 0} / {branchTotal || 0} Used
            </p>

            <div className="space-y-3 text-sm overflow-y-auto">
              {data.branches?.length > 0 ? (
                data.branches.map((branch: any) => (
                  <div
                    key={branch.id}
                    className="flex border rounded px-2 h-10 justify-between items-center"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">
                        {branch.reference_num || "—"} - {branch.name || "-"}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-chart-1/10 text-chart-1 shrink-0"
                      >
                        {branch.type}
                      </Badge>
                    </div>

                    <Badge
                      className={
                        branch.status === "active"
                          ? "bg-chart-3/10 text-chart-3 border-chart-3/10"
                          : "bg-chart-4/10 text-chart-4 border-chart-4/10"
                      }
                    >
                      {branch.status?.toUpperCase() || "UNKNOWN"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No branches assigned yet</p>
              )}
            </div>
          </CardContent>

        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-chart-1" />
              Member Capacity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <CircularProgress
              percentage={memberTotal > 0 ? Math.round((memberUsed / memberTotal) * 100) : 0}
              color="text-blue-500"
            />
            <p className="mt-4 text-sm text-center text-muted-foreground">
              {memberUsed} / {memberTotal} Used
            </p>
            <p className="mt-2 text-xs text-center text-muted-foreground">
              Running out of member slots? Upgrade to Enterprise
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-amber-600" />
              Employee Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <CircularProgress percentage={employeePercentage} color="text-amber-500" />
            <p className="mt-4 text-sm text-muted-foreground">
              {employeeUsed} / {employeeTotal} Used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-chart-1" />
              User Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <CircularProgress percentage={userPercentage} color="text-indigo-500" />
            <p className="mt-4 text-sm text-muted-foreground">
              {userUsed} / {userTotal} Used
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );

  return (
    <div className="p-4 space-y-6 max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">
              Gyms / {gym.company_name || "Gym Detail"}
            </h1>
          </div>
        </div>
      </div>

      {!isLoading && gym && (
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 flex-wrap">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full">
                  {/* {gym.company_name?.[0]?.toUpperCase() || "?"} */}
                  <Avatar className="w-full h-full">
                    <AvatarImage
                      src={
                        user
                          ? `${backendBasePath}${gym?.system_company_logo}`
                          : undefined
                      }
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {gym?.system_company_name
                        ? gym.system_company_name.trim().charAt(0).toUpperCase()
                        : gym?.mobile?.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl">{gym.company_name || "Unnamed Gym"}</h2>
                    <Badge
                      className={
                        gym.status === "active"
                          ? "bg-chart-3/10 text-chart-3 border-chart-3/10"
                          : "bg-chart-4/10 text-chart-4 border-chart-4/10"
                      }
                    >
                      {gym.status?.toUpperCase() || "UNKNOWN"}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Email:</span> {gym.company_email || "—"}
                    </p>
                    {/* <p className="flex items-center gap-2">
                      <span className="font-medium">Joined:</span>{" "}
                      {gym.created_at && gym.created_at !== null
                        ? new Date(gym.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                        : "Join date not available"}
                    </p> */}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                    {gym.package_name || "No Package"}
                  </Badge>
                  {gym.package_type !== "trial" && (
                    <>
                      /
                      <span className="text-sm font-medium text-muted-foreground">
                        {gym.duration || "—"}
                      </span>
                    </>
                  )}

                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-32">
          <Loading size="lg" />
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="inline-flex h-auto w-full justify-start rounded-none border-b bg-transparent p-0 text-muted-foreground">
            <TabsTrigger
              value="overview"
              className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-6 py-4 text-base font-medium text-muted-foreground shadow-none transition-none hover:text-foreground data-[state=active]:border-b-blue-600 data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="subscription-history"
              className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-6 py-4 text-base font-medium text-muted-foreground shadow-none transition-none hover:text-foreground data-[state=active]:border-b-blue-600 data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Subscription History
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-6 py-4 text-base font-medium text-muted-foreground shadow-none transition-none hover:text-foreground data-[state=active]:border-b-blue-600 data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Invoices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pt-2">
            <OverviewContent />
          </TabsContent>

          <TabsContent value="subscription-history" className="pt-2">
            <SubscriptionHistory
              gymData={gym}
              remainingDays={remainingDays}
              totalDays={totalDays}
              usedDays={usedDays}
              branchUsed={branchUsed}
              branchTotal={branchTotal}
            />
          </TabsContent>

          <TabsContent value="invoices" className="pt-2">
            <Invoices
              gymData={gym}
              listGymData={passedGym}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}