import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  DollarSign,
  Snowflake,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  Bell,
  Calendar as CalendarIcon,
  Download,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpCircle,
  Camera,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import type { Payment, User, Employee } from "@shared/schema";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getDashboardDataAsyncThunk } from "@/redux/pagesSlices/generalSlice";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  capitalize,
  formatDateToShortString,
  formatTimeTo12Hour,
} from "@/utils/helper";
import { PERMISSIONS } from "@/permissions/permissions";
import { usePermissions } from "@/permissions/usePermissions";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
type ChartFilterType = "weekly" | "monthly" | "yearly" | "custom_date_range";

interface DateRange {
  from?: Date;
  to?: Date;
}
function StatCard({
  title,
  value,
  trend,
  trendValue,
  icon: Icon,
  gradient,
  changeTitle,
  link,
  permission,
}: any) {
  const { hasPermission } = usePermissions();

  const canAccess = !!link && (!permission || hasPermission(permission));

  const content = (
    <Card className="hover-elevate overflow-hidden">
      <div className={`h-1 ${gradient}`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {trend && (
          <div className="flex items-center mt-2">
            {trend === "up" ? (
              <TrendingUp className="h-4 w-4 text-chart-3 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-chart-5 mr-1" />
            )}
            <span
              className={`text-xs font-medium ${
                trend === "up" ? "text-chart-3" : "text-chart-5"
              }`}
            >
              {trend == "up" ? "+" : ""}
              {trendValue}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              from {changeTitle}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
  // Only wrap in link if permission check passes
  if (canAccess) {
    return (
      <a
        href={link}
        className="block"
        target={link?.startsWith("http") ? "_blank" : undefined}
        rel={link?.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {content}
      </a>
    );
  }

  return content;
}
function AdminDashboard() {
  // const { data: payments = [] } = useQuery<Payment[]>({
  //   queryKey: ['/api/payments'],
  // });

  // const { data: users = [] } = useQuery<User[]>({
  //   queryKey: ['/api/users'],
  // });

  // const { data: employees = [] } = useQuery<Employee[]>({
  //   queryKey: ['/api/employees'],
  // });
  const payments = [
    {
      id: 1,
      amount: 5000,
      paymentDate: "2025-01-15T10:00:00Z",
      collectedBy: 1,
    },
    // add more...
  ];

  const employees = [
    { id: 1, name: "Receptionist 1", designation: "receptionist" },
  ];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const lastWeekStart = new Date(weekAgo);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const { hasPermission } = usePermissions();
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const todayPayments = payments.filter(
    (p) => p.paymentDate && new Date(p.paymentDate) >= today
  );
  const yesterdayPayments = payments.filter(
    (p) =>
      p.paymentDate &&
      new Date(p.paymentDate) >= yesterday &&
      new Date(p.paymentDate) < today
  );
  const thisWeekPayments = payments.filter(
    (p) => p.paymentDate && new Date(p.paymentDate) >= weekAgo
  );
  const lastWeekPayments = payments.filter(
    (p) =>
      p.paymentDate &&
      new Date(p.paymentDate) >= lastWeekStart &&
      new Date(p.paymentDate) < weekAgo
  );
  const thisMonthPayments = payments.filter(
    (p) => p.paymentDate && new Date(p.paymentDate) >= monthAgo
  );
  const last7DaysPayments = payments.filter(
    (p) => p.paymentDate && new Date(p.paymentDate) >= weekAgo
  );

  const todayTotal = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const yesterdayTotal = yesterdayPayments.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );
  const thisWeekTotal = thisWeekPayments.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );
  const lastWeekTotal = lastWeekPayments.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );
  const thisMonthTotal = thisMonthPayments.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );
  const dailyAverage =
    last7DaysPayments.length > 0
      ? Math.round(
          last7DaysPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 7
        )
      : 0;
  const weeklyAverage = Math.round((thisWeekTotal + lastWeekTotal) / 2);

  const dispatch = useDispatch();
  const { dashboardData, selectedBranchId } = useSelector(
    (state: RootState) => state.general
  );
  const [chartFilter, setChartFilter] = useState<ChartFilterType>("weekly");
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const getChartFilterParams = () => {
    const params: any = {
      chart_filter: chartFilter,
      filter_branch_id: filterBranchId,
    };

    if (chartFilter === "custom_date_range" && dateRange.from && dateRange.to) {
      params.chart_start_date = format(dateRange.from, "yyyy-MM-dd");
      params.chart_end_date = format(dateRange.to, "yyyy-MM-dd");
    }

    return params;
  };
  const revenueChart = dashboardData?.revenue_chart_date || {
    labels: [
      "29 Nov 25",
      "30 Nov 25",
      "1 Dec 25",
      "2 Dec 25",
      "3 Dec 25",
      "4 Dec 25",
      "5 Dec 25",
    ],
    datasets: [
      {
        label: "Revenue (Weekly)",
        data: [0, 0, 0, 0, 0, 24000, 0],
        borderColor: "rgba(99, 185, 255, 1)",
        backgroundColor: "rgba(39, 148, 251, 0.5)",
      },
    ],
  };
  const chartData = revenueChart.labels.map((label: string, index: number) => ({
    date: label,
    revenue: revenueChart.datasets[0].data[index],
  }));
  const totalRevenueThisWeek = chartData.reduce(
    (sum: number, item: any) => sum + item.revenue,
    0
  );
  console.log("dashboardData", dashboardData);
  useEffect(() => {
    const params = getChartFilterParams();

    dispatch(getDashboardDataAsyncThunk(params));
  }, [filterBranchId, chartFilter, dateRange.from, dateRange.to]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Good Morning, Admin!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your gym today
          </p>
        </div>
        {user.type === "default" && user.logged_branch?.type === "main" && (
          <HeaderBranchFilter onBranchChange={setFilterBranchId} />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value={dashboardData?.total_members || 0}
          // value={
          //   <div className="space-y-1">
          //     <div className="text-3xl font-bold">
          //       {dashboardData?.total_members || 0}
          //     </div>
          //     <div className="text-lg text-muted-foreground flex items-center gap-2">
          //       <span className="font-medium text-green-600">
          //         {dashboardData?.active_members || 0} active
          //       </span>

          //     </div>
          //   </div>
          // }
          // trend={
          //   dashboardData?.total_member_last_month_percent_change > 0
          //     ? "up"
          //     : "down"
          // }
          // trendValue={
          //   dashboardData?.total_member_last_month_percent_change || 0
          // }
          icon={Users}
          gradient="bg-gradient-to-r from-chart-2 to-chart-1"
          changeTitle="last month"
          link="/members"
          permission={PERMISSIONS.MEMBER_VIEW}
        />
        <StatCard
          title="Active Members"
          value={dashboardData?.active_members || 0}
          icon={UserCheck}
          gradient="bg-gradient-to-r from-chart-2 to-chart-1"
          changeTitle="last month"
          link="/members"
          permission={PERMISSIONS.MEMBER_VIEW}
        />
        <StatCard
          title="New Members"
          value={dashboardData?.new_members || 0}
          icon={UserCheck}
          gradient="bg-gradient-to-r from-chart-2 to-chart-1"
          changeTitle="last month"
          link="/members"
          permission={PERMISSIONS.MEMBER_VIEW}
        />
        <StatCard
          title="Total Employee"
          value={
            <div className="space-y-1">
              <div className="text-3xl font-bold">
                {dashboardData?.total_employees || 0}
                {/* /{" "}{dashboardData?.active_employees || 0} */}
              </div>
            </div>
          } // trend={
          //   dashboardData?.active_member_last_month_percent_change > 0
          //     ? "up"
          //     : "down"
          // }
          // trendValue={
          //   dashboardData?.active_member_last_month_percent_change || 0
          // }
          icon={Users}
          gradient="bg-gradient-to-r from-chart-1 to-chart-2"
          changeTitle="last month"
          link="/employees"
          permission={PERMISSIONS.EMPLOYEE_VIEW}
        />
        <StatCard
          title="Active Employee"
          value={
            <div className="space-y-1">
              <div className="text-3xl font-bold">
                {dashboardData?.total_employees || 0}
                {/* {/{" "}dashboardData?.active_employees || 0} */}
              </div>
            </div>
          } // trend={
          //   dashboardData?.active_member_last_month_percent_change > 0
          //     ? "up"
          //     : "down"
          // }
          // trendValue={
          //   dashboardData?.active_member_last_month_percent_change || 0
          // }
          icon={UserCheck}
          gradient="bg-gradient-to-r from-chart-1 to-chart-2"
          changeTitle="last month"
          link="/employees"
          permission={PERMISSIONS.EMPLOYEE_VIEW}
        />
        {/* <StatCard
          title="Active Members"
          value={dashboardData?.active_members || 0}
          trend={
            dashboardData?.active_member_last_month_percent_change > 0
              ? "up"
              : "down"
          }
          trendValue={
            dashboardData?.active_member_last_month_percent_change || 0
          }
          icon={Users}
          gradient="bg-gradient-to-r from-chart-1 to-chart-2"
          changeTitle="last month"
          link="/members"
          permission={PERMISSIONS.MEMBER_VIEW}
        /> */}
        <StatCard
          title={
            <span className="block sm:inline">
              Member's Attendance{" "}
              <span className="text-xs text-muted-foreground/80 block sm:inline">
                (today)
              </span>
            </span>
          }
          value={dashboardData?.today_attendance || 0}
          // trend={
          //   dashboardData?.attendance_yesterday_percent_change > 0
          //     ? "up"
          //     : "down"
          // }
          // trendValue={dashboardData?.attendance_yesterday_percent_change || 0}
          icon={UserCheck}
          gradient="bg-gradient-to-r from-chart-3 to-chart-4"
          changeTitle="yesterday"
          link="/member-attendance"
          permission={PERMISSIONS.ATTENDANCE_MEMBER_VIEW}
        />

        <StatCard
          title="Today's Freeze Requests"
          value={dashboardData?.today_freeze_requests || 0}
          // trend={
          //   dashboardData?.freeze_request_yesterday_percent_change > 0
          //     ? "up"
          //     : "down"
          // }
          // trendValue={
          //   dashboardData?.freeze_request_yesterday_percent_change || 0
          // }
          icon={Snowflake}
          gradient="bg-gradient-to-r from-chart-4 to-chart-5"
          changeTitle="yesterday"
          link="/freeze-requests"
          permission={PERMISSIONS.FREEZE_REQUEST_VIEW}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Fee Collection Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="daily" data-testid="tab-daily">
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" data-testid="tab-weekly">
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" data-testid="tab-monthly">
                Monthly
              </TabsTrigger>
              <TabsTrigger value="receptionist" data-testid="tab-receptionist">
                By Receptionist
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm text-muted-foreground">
                    Total Collection
                  </div>
                  <div className="text-2xl font-bold text-primary mt-1">
                    {dashboardData?.system_currency}{" "}
                    {dashboardData?.today_collections?.toLocaleString() || 0}
                  </div>
                  {/* <div className="text-xs text-muted-foreground mt-1">{todayPayments.length} payments</div> */}
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm text-muted-foreground">
                    Cash Collection
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {dashboardData?.system_currency}{" "}
                    {dashboardData?.today_cash_collections?.toLocaleString() ||
                      0}
                  </div>
                  {/* <div className="text-xs text-muted-foreground mt-1">{yesterdayPayments.length} payments</div> */}
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm text-muted-foreground">
                    Bank Collection
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {dashboardData?.system_currency}{" "}
                    {dashboardData?.today_bank_collections?.toLocaleString() ||
                      0}
                    {/* {Number(
                      dashboardData?.this_week_average_collection || 0
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} */}
                  </div>
                  {/* <div className="text-xs text-muted-foreground mt-1">Last 7 days</div> */}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm text-muted-foreground">
                    Total Collection
                  </div>
                  <div className="text-2xl font-bold text-primary mt-1">
                    {dashboardData?.system_currency}{" "}
                    {dashboardData?.this_week_collections?.toLocaleString() ||
                      0}
                  </div>
                  {/* <div className="text-xs text-muted-foreground mt-1">{thisWeekPayments.length} payments</div> */}
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm text-muted-foreground">
                    Cash Collection
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {dashboardData?.system_currency}{" "}
                    {dashboardData?.this_week_cash_collections?.toLocaleString() ||
                      0}
                  </div>
                  {/* <div className="text-xs text-muted-foreground mt-1">{lastWeekPayments.length} payments</div> */}
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm text-muted-foreground">
                    Bank Collection
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {dashboardData?.system_currency}{" "}
                    {dashboardData?.this_week_bank_collections?.toLocaleString() ||
                      0}
                    {/* {Number(
                      dashboardData?.two_week_average_colelction || 0
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} */}
                    {/* {dashboardData?.two_week_average_colelction?.toFixed(0) ||
                      0} */}
                  </div>
                  {/* <div className="text-xs text-muted-foreground mt-1">Last 2 weeks</div> */}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm text-muted-foreground">
                    Total Collection
                  </div>
                  <div className="text-2xl font-bold text-primary mt-1">
                    {dashboardData?.system_currency}{" "}
                    {dashboardData.this_month_collection?.toLocaleString() || 0}
                  </div>
                  {/* <div className="text-xs text-muted-foreground mt-1">{thisMonthPayments.length} payments</div> */}
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm text-muted-foreground">
                    Cash Collection
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {dashboardData?.system_currency}{" "}
                    {dashboardData?.this_month_cash_collection?.toLocaleString() ||
                      0}
                  </div>
                  {/* <div className="text-xs text-muted-foreground mt-1">{payments.length} payments total</div> */}
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm text-muted-foreground">
                    Bank Collection
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {dashboardData?.system_currency}{" "}
                    {dashboardData?.this_month_bank_collection?.toLocaleString() ||
                      0}
                    {/* {Number(dashboardData?.average_total || 0).toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )} */}
                    {/* {dashboardData?.average_total?.toFixed(0) || 0} */}
                  </div>
                  {/* <div className="text-xs text-muted-foreground mt-1">All time</div> */}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="receptionist" className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receptionist</TableHead>
                      {/* <TableHead>Gender</TableHead> */}
                      <TableHead className="text-center">Collections</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">
                        Avg Per Payment
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData?.collection_stats_by_user?.data?.length >
                    0 ? (
                      dashboardData?.collection_stats_by_user?.data?.map(
                        (stat, index) => (
                          <TableRow
                            key={index}
                            data-testid={`row-receptionist-${index + 1}`}
                          >
                            <TableCell className="font-medium">
                              <div className="space-y-1">
                                <div>
                                  {stat?.created_by_user?.name}{" "}
                                  <Badge variant={"secondary"}>
                                    {stat?.created_by_user?.reference_num}
                                  </Badge>
                                </div>
                                {stat?.created_by_user?.branch && (
                                  <div className="space-x-1 text-sm">
                                    <Badge variant={"secondary"}>
                                      <span>
                                        {stat?.created_by_user?.branch?.name}
                                      </span>
                                      <Badge variant={"secondary"}>
                                        {
                                          stat?.created_by_user?.branch
                                            ?.reference_num
                                        }
                                      </Badge>
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            {/* <TableCell>
                          <Badge 
                            variant="outline" 
                            className={stat.gender === 'female' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-blue-50 text-blue-700 border-blue-200'}
                          >
                            {stat.gender === 'female' ? 'Female' : 'Male'}
                          </Badge>
                        </TableCell> */}
                            <TableCell className="text-center">
                              {stat.total_records}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {dashboardData?.system_currency}{" "}
                              {stat.total_collection.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {dashboardData?.system_currency}{" "}
                              {stat.avg_collection.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        )
                      )
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-8"
                        >
                          No receptionist collections yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Revenue Overview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {chartFilter === "weekly" && "Last 7 days"}
                  {chartFilter === "monthly" && "This month daily breakdown"}
                  {chartFilter === "yearly" && "This year monthly breakdown"}
                  {chartFilter === "custom_date_range" &&
                  dateRange.from &&
                  dateRange.to
                    ? `${format(dateRange.from, "dd MMM yyyy")} — ${format(
                        dateRange.to,
                        "dd MMM yyyy"
                      )}`
                    : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-muted/40 rounded-lg p-1 gap-1">
                  <Button
                    variant={chartFilter === "weekly" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setChartFilter("weekly")}
                    className="text-xs sm:text-sm"
                  >
                    Weekly
                  </Button>
                  <Button
                    variant={chartFilter === "monthly" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setChartFilter("monthly")}
                    className="text-xs sm:text-sm"
                  >
                    Monthly
                  </Button>
                  <Button
                    variant={chartFilter === "yearly" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setChartFilter("yearly")}
                    className="text-xs sm:text-sm"
                  >
                    Yearly
                  </Button>
                </div>

                <Popover
                  open={showCustomPicker}
                  onOpenChange={setShowCustomPicker}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant={
                        chartFilter === "custom_date_range"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal min-w-[180px]",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {chartFilter === "custom_date_range" &&
                      dateRange.from &&
                      dateRange.to
                        ? `${format(dateRange.from, "dd/MM/yy")} - ${format(
                            dateRange.to,
                            "dd/MM/yy"
                          )}`
                        : "Custom Range"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={(range: any) => {
                        setDateRange(range || {});
                        if (range?.from && range?.to) {
                          setChartFilter("custom_date_range");
                          setShowCustomPicker(false);
                        }
                      }}
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Optional: show total for selected period */}
            <div className="mt-2 text-right">
              <p className="text-xl font-bold text-primary">
                {dashboardData?.system_currency}{" "}
                {(
                  dashboardData?.total_revenue_selected_period ||
                  totalRevenueThisWeek ||
                  0
                ).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Total for {chartFilter === "weekly" && "last 7 days"}
                {chartFilter === "monthly" && "this month"}
                {chartFilter === "yearly" && "this year"}
                {chartFilter === "custom_date_range" &&
                dateRange.from &&
                dateRange.to
                  ? `${format(dateRange.from, "dd MMM yyyy")} — ${format(
                      dateRange.to,
                      "dd MMM yyyy"
                    )}`
                  : ""}
              </p>
              {/* <p className="text-xs text-muted-foreground">Total for selected period</p> */}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeLinecap="1" stroke="#1b294b" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#666" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                    tickFormatter={(v) =>
                      `${dashboardData?.system_currency} ${v / 1000}k`
                    }
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      `${
                        dashboardData?.system_currency
                      } ${value.toLocaleString()}`
                    }
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      color: "#d9d9d9",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                      backgroundColor: "#131d34",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="rgba(39, 148, 251, 0.5)"
                    strokeWidth={3}
                    dot={{ fill: "rgba(99, 185, 255, 1)", r: 8 }}
                    activeDot={{ r: 12 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {dashboardData?.system_logs?.map((notif: any) => (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 p-3 rounded-md hover-elevate"
                  >
                    {/* <div className={`h-2 w-2 rounded-full mt-2 ${notif.type === 'success' ? 'bg-chart-3' : 'bg-chart-4'}`} /> */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.action_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {notif.action_description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateToShortString(notif.date)}{" "}
                        {formatTimeTo12Hour(notif.time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StaffDashboard() {
  const { dashboardData, selectedBranchId } = useSelector(
    (state: RootState) => state.general
  );
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  console.log("dashboardData", dashboardData);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getDashboardDataAsyncThunk({}));
  }, [selectedBranchId]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Good Morning, Staff!</h1>
        <p className="text-muted-foreground">Your daily operations dashboard</p>
      </div>

      {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Today's Employee Check-ins"
          value={dashboardData?.today_attendance || 0}
          icon={UserCheck}
          gradient="bg-gradient-to-r from-chart-2 to-chart-3"
        />
        <StatCard
          title="Active Members"
          value={dashboardData?.active_members || 0}
          icon={Users}
          gradient="bg-gradient-to-r from-chart-1 to-chart-2"
        />
        <StatCard
          title="Today Freeze Requests"
          value={dashboardData?.today_freeze_requests || 0}
          icon={Snowflake}
          gradient="bg-gradient-to-r from-chart-4 to-chart-5"
        />
      </div> */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* <StatCard
          title="Total Members"
          value={dashboardData?.today_collections || 0}
          trend={
            dashboardData?.total_member_last_month_percent_change > 0
              ? "up"
              : "down"
          }
          trendValue={
            dashboardData?.total_member_last_month_percent_change || 0
          }
          icon={DollarSign}
          gradient="bg-gradient-to-r from-chart-2 to-chart-1"
          changeTitle="last month"
        />
        <StatCard
          title="Active Members"
          value={dashboardData?.active_members || 0}
          trend={
            dashboardData?.active_member_last_month_percent_change > 0
              ? "up"
              : "down"
          }
          trendValue={
            dashboardData?.active_member_last_month_percent_change || 0
          }
          icon={Users}
          gradient="bg-gradient-to-r from-chart-1 to-chart-2"
          changeTitle="last month"
        /> */}
        <StatCard
          title={
            <span className="block sm:inline">Today's Total Collection</span>
          }
          value={dashboardData?.today_collections || 0}
          icon={UserCheck}
          gradient="bg-gradient-to-r from-chart-3 to-chart-4"
          link="/fee-collection"
          permission={PERMISSIONS.FEE_COLLECTION_VIEW}
        />
        <StatCard
          title={
            <span className="block sm:inline">Today's Cash Collection</span>
          }
          value={dashboardData?.today_cash_collections || 0}
          icon={DollarSign}
          gradient="bg-gradient-to-r from-chart-3 to-chart-4"
          link="/finance/cash-book"
          permission={PERMISSIONS.LEDGER_VIEW}
        />
        <StatCard
          title={
            <span className="block sm:inline">Today's Bank Collection</span>
          }
          value={dashboardData?.today_bank_collections || 0}
          icon={Landmark}
          gradient="bg-gradient-to-r from-chart-3 to-chart-4"
          link="/finance/bank-book"
          permission={PERMISSIONS.LEDGER_VIEW}
        />
        {/* <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm text-muted-foreground">Total Collection</div>
          <div className="text-2xl font-bold mt-1">
            {dashboardData?.system_currency}{" "}
            {dashboardData?.today_collections?.toLocaleString() || 0}
          </div>
        </div> */}
        {/* <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm text-muted-foreground">Cash Collection</div>
          <div className="text-2xl font-bold mt-1">
            {dashboardData?.system_currency}{" "}
            {dashboardData?.today_cash_collections?.toLocaleString() || 0}
          </div>
        </div> */}
        {/* <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm text-muted-foreground"> Bank Collection</div>
          <div className="text-2xl font-bold mt-1">
            {dashboardData?.system_currency}{" "}
            {dashboardData?.today_bank_collections?.toLocaleString() || 0}
          </div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm text-muted-foreground"> Today's Freeze Requests</div>
          <div className="text-2xl font-bold mt-1">
            {dashboardData?.today_freeze_requests|| 0}
          </div>
        </div> */}
        <StatCard
          title="Today's Freeze Requests"
          value={dashboardData?.today_freeze_requests || 0}
          // trend={
          //   dashboardData?.freeze_request_yesterday_percent_change > 0
          //     ? "up"
          //     : "down"
          // }
          // trendValue={
          //   dashboardData?.freeze_request_yesterday_percent_change || 0
          // }
          icon={Snowflake}
          gradient="bg-gradient-to-r from-chart-4 to-chart-5"
          changeTitle="yesterday"
          link="/freeze-requests"
          permission={PERMISSIONS.FREEZE_REQUEST_VIEW}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>My Attendance</CardTitle>
            <CalendarIcon className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {dashboardData?.attendances?.length > 0 ? (
                  dashboardData?.attendances?.map((day) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                      data-testid={`attendance-${day.date}`}
                    >
                      <div>
                        <p className="font-medium">{day.date}</p>
                        <p className="text-xs text-muted-foreground">
                          Checked In:{" "}
                          {formatTimeTo12Hour(day.checkin_time) ?? "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Checked Out:{" "}
                          {formatTimeTo12Hour(day.checkout_time) ?? "-"}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-chart-3/10 text-chart-3 border-chart-3/20"
                      >
                        {day.checkin_type}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                    <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/20 rounded-xl w-14 h-14 flex items-center justify-center mb-4">
                      <CalendarIcon className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      No Attendance Yet
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Attendance records will appear here once you check in.
                    </p>
                    <Button
                      disabled={
                        !hasPermission(PERMISSIONS.PUBLIC_CHECKIN_CREATE)
                      }
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        navigate("/check-in");
                      }}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Check In Now
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <Badge variant="outline">{mockNotifications.length} New</Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {mockNotifications.map((notif) => (
                  <div key={notif.id} className="p-3 rounded-md border hover-elevate" data-testid={`notification-${notif.id}`}>
                    <div className="flex items-start gap-2">
                      <div className={`h-2 w-2 rounded-full mt-2 ${notif.type === 'success' ? 'bg-chart-3' : notif.type === 'warning' ? 'bg-chart-4' : 'bg-chart-2'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card> */}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Button
            disabled={!hasPermission(PERMISSIONS.PUBLIC_CHECKIN_CREATE)}
            onClick={() => navigate("/check-in")}
            className="justify-start"
            variant="outline"
            data-testid="button-mark-attendance-staff"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>
          <Button
            disabled={!hasPermission(PERMISSIONS.MEMBER_VIEW)}
            onClick={() => navigate("/members")}
            className="justify-start"
            variant="outline"
            data-testid="button-view-members-staff"
          >
            <Users className="h-4 w-4 mr-2" />
            View Members
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function MemberDashboard() {
  const dispatch = useDispatch();
  const { dashboardData, selectedBranchId } = useSelector(
    (state: RootState) => state.general
  );
  useEffect(() => {
    dispatch(getDashboardDataAsyncThunk({}));
  }, [selectedBranchId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
        return "bg-chart-3/10 text-chart-3 border-chart-3/20";
      case "pending":
        return "bg-chart-2/10 text-chart-2 border-chart-2/20";
      case "rejected":
        return "bg-chart-5/10 text-chart-5 border-chart-5/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome Back!</h1>
        <p className="text-muted-foreground">Track your fitness journey</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Membership Status"
          value={
            dashboardData?.member_profile?.user?.status
              ? capitalize(dashboardData?.member_profile?.user?.status)
              : "N/A"
          }
          icon={Activity}
          gradient="bg-gradient-to-r from-chart-1 to-chart-2"
        />
        <StatCard
          title="This Month Attendances"
          value={dashboardData?.member_current_month_attendances}
          icon={UserCheck}
          gradient="bg-gradient-to-r from-chart-3 to-chart-4"
          link="/member-attendance"
          permission={PERMISSIONS.ATTENDANCE_MEMBER_VIEW}
        />

        <StatCard
          title="Days Remaining"
          value={dashboardData?.member_profile?.remaining_days_balance || 0}
          icon={CalendarIcon}
          gradient="bg-gradient-to-r from-chart-2 to-chart-1"
          link="/member-attendance"
          permission={PERMISSIONS.ATTENDANCE_MEMBER_VIEW}
        />
        <StatCard
          title="Total Visits"
          value={dashboardData?.total_visits || 0}
          icon={TrendingUp}
          gradient="bg-gradient-to-r from-chart-4 to-chart-5"
          link="/member-attendance"
          permission={PERMISSIONS.ATTENDANCE_MEMBER_VIEW}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>My Attendance</CardTitle>
            <CalendarIcon className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {dashboardData?.attendances?.length === 0 ? (
                  <div className="flex justify-center items-center p-4">
                    <p className="text-center text-sm text-muted-foreground">
                      No attendance data available
                    </p>
                  </div>
                ) : (
                  dashboardData?.attendances?.map((day: any) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                      data-testid={`attendance-${day.date}`}
                    >
                      <div>
                        <p className="font-medium">
                          {day.date ? formatDateToShortString(day.date) : "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Checked In:{" "}
                          {formatTimeTo12Hour(day.checkin_time) ?? "-"}
                        </p>
                        {/* <p className="text-xs text-muted-foreground">
                          Checked Out:{" "}
                          {formatTimeTo12Hour(day.checkout_time) ?? "-"}
                        </p> */}
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-chart-3/10 text-chart-3 border-chart-3/20"
                      >
                        {day.checkin_type}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <Badge variant="outline">
              {dashboardData?.notifications?.length} New
            </Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {dashboardData?.notifications?.length == 0 ? (
                  <div className="flex justify-center items-center p-4">
                    <p className="text-center text-sm text-muted-foreground">
                      No notifications available
                    </p>
                  </div>
                ) : (
                  dashboardData?.notifications?.map((notif: any) => (
                    <div
                      key={notif.id}
                      className="p-3 rounded-md border hover-elevate"
                      data-testid={`notification-${notif.id}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`h-2 w-2 rounded-full mt-2`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{notif.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {notif.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeTo12Hour(notif.time)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="membership" className="w-full">
        <TabsList
          className="grid w-full grid-cols-2"
          data-testid="tabs-member-dashboard"
        >
          <TabsTrigger value="membership" data-testid="tab-membership">
            Membership
          </TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">
            Payments
          </TabsTrigger>
          {/* <TabsTrigger value="upgrade" data-testid="tab-upgrade">Upgrade Plan</TabsTrigger>
          <TabsTrigger value="freeze" data-testid="tab-freeze">Freeze Requests</TabsTrigger> */}
        </TabsList>

        <TabsContent
          value="membership"
          className="space-y-4"
          data-testid="content-membership"
        >
          <Card>
            <CardHeader>
              <CardTitle>Current Membership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <Badge variant="outline" className="mt-1">
                    {dashboardData?.member_profile?.plan?.name}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member ID</p>
                  <p className="font-medium font-mono">
                    {dashboardData?.member_profile?.user.reference_num}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {dashboardData?.member_profile?.current_plan_start_date
                      ? formatDateToShortString(
                          dashboardData?.member_profile?.current_plan_start_date
                        )
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valid Until</p>
                  <p className="font-medium">
                    {(dashboardData?.member_profile?.current_plan_expire_date &&
                      formatDateToShortString(
                        dashboardData?.member_profile?.current_plan_expire_date
                      )) ??
                      "Account Freeze"}
                  </p>
                </div>
              </div>
              {/* <div className="flex gap-2">
                <Button className="flex-1" data-testid="button-renew-membership">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Renew Membership
                </Button>
                <Button variant="outline" className="flex-1" data-testid="button-request-freeze">
                  <Snowflake className="h-4 w-4 mr-2" />
                  Request Freeze
                </Button>
              </div> */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="payments"
          className="space-y-4"
          data-testid="content-payments"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment History</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    {/* <TableHead>Actions</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.member_fee_collections?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No payments found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dashboardData?.member_fee_collections?.map(
                      (payment: any) => (
                        <TableRow
                          key={payment.id}
                          data-testid={`payment-${payment.id}`}
                        >
                          <TableCell className="font-medium">
                            {payment?.transaction?.date &&
                              formatDateToShortString(
                                payment?.transaction?.date
                              )}
                          </TableCell>
                          <TableCell>{payment?.plan?.name}</TableCell>
                          <TableCell className="font-semibold">
                            {dashboardData?.system_currency}{" "}
                            {payment?.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{payment?.deposit_method}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor("completed")}
                            >
                              <span className="mr-1">
                                {getStatusIcon("completed")}
                              </span>
                              {"Completed"}
                            </Badge>
                          </TableCell>
                          {/* <TableCell>
                              <Button size="sm" variant="ghost" data-testid={`button-download-receipt-${payment.id}`}>
                                <Download className="h-4 w-4" />
                              </Button>
                            </TableCell> */}
                        </TableRow>
                      )
                    )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="upgrade" className="space-y-4" data-testid="content-upgrade">
          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockAvailablePlans.map((plan) => (
                <div key={plan.id} className={`p-4 rounded-md border ${plan.current ? 'border-primary bg-primary/5' : ''} hover-elevate`} data-testid={`plan-${plan.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        {plan.current && <Badge>Current</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{plan.duration}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">₹{plan.price}</p>
                      <p className="text-xs text-muted-foreground">per period</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-chart-3" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  {!plan.current && (
                    <Button className="w-full" data-testid={`button-upgrade-${plan.id}`}>
                      <ArrowUpCircle className="h-4 w-4 mr-2" />
                      Upgrade to this Plan
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* <TabsContent value="freeze" className="space-y-4" data-testid="content-freeze">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Freeze Request History</CardTitle>
                <Button data-testid="button-new-freeze-request">
                  <Snowflake className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockFreezeRequests.map((request) => (
                    <TableRow key={request.id} data-testid={`freeze-request-${request.id}`}>
                      <TableCell className="font-medium">{request.requestDate}</TableCell>
                      <TableCell>{request.startDate}</TableCell>
                      <TableCell>{request.endDate}</TableCell>
                      <TableCell>{request.reason}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(request.status)}>
                          <span className="mr-1">{getStatusIcon(request.status)}</span>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  );
}

export default function Dashboard() {
  // const { userRole } = useAuth();
  const { user } = useSelector((state: RootState) => state.auth);
  console.log("user", user);

  const user_type = user.user_type;
  return (
    <div className="p-6">
      {/* <AdminDashboard /> */}
      {/* <StaffDashboard /> */}
      {user_type === "other" && <AdminDashboard />}
      {user_type === "employee" && <StaffDashboard />}
      {user_type === "member" && <MemberDashboard />}
    </div>
  );
}
