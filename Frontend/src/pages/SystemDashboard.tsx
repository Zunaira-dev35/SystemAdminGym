import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getSystemDashboardAsyncThunk } from "@/redux/pagesSlices/generalSlice";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    DollarSign,
    Users,
    Package,
    Clock,
} from "lucide-react";
import Loading from "@/components/shared/loaders/Loading";

function StatCard({
    title,
    value,
    sub,
    icon: Icon,
    gradient = "bg-gradient-to-r from-chart-1 to-chart-2",
}: {
    title: string;
    value: string | number;
    sub?: string;
    icon: any;
    gradient?: string;
}) {
    return (
        <Card className=" overflow-hidden">
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
                {sub && (
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function SystemDashboard() {
    const dispatch = useDispatch<AppDispatch>();
    const { systemDashboard, loadings } = useSelector(
        (state: RootState) => state.general
    );
    const isLoading = loadings?.getSystemDashboard;

    useEffect(() => {
        dispatch(getSystemDashboardAsyncThunk({}));
    }, [dispatch]);

    const {
        currency = `${systemDashboard?.system_currency || "Rs"}`,
        total_revenue = 0,
        total_gyms = 0,
        active_gyms = 0,
        pending_dues = 0,
        gyms = { data: [] },
    } = systemDashboard || {};

    const recentGyms =
        gyms?.data
            ?.slice()
            ?.sort(
                (a: any, b: any) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
            )
            ?.slice(0, 2) || [];


    return (
        <div className="p-6 space-y-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Operations Overview</h1>
                    <p className="text-muted-foreground">
                        Global status and performance metrics for Snow Berry Systems
                    </p>
                </div>

                {/* <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
          </span>
          LIVE MONITORING ACTIVE
        </div> */}
            </div>

            {isLoading ? (
                <Loading />
            ) : (
                <>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Total Revenue"
                            value={`${currency} ${Number(total_revenue).toLocaleString()}`}
                            icon={DollarSign}
                            gradient="bg-gradient-to-r from-chart-2 to-chart-1"
                            sub="All-time revenue"
                        />

                        <StatCard
                            title="Total Gyms"
                            value={total_gyms}
                            icon={Users}
                            gradient="bg-gradient-to-r from-chart-1 to-chart-2"
                            sub="Registered clients"
                        />

                        <StatCard
                            title="Active Gyms"
                            value={active_gyms}
                            icon={Package}
                            gradient="bg-gradient-to-r from-chart-3 to-chart-4"
                            sub="Currently subscribed"
                        />

                        <StatCard
                            title="Pending Dues"
                            value={pending_dues}
                            icon={Clock}
                            gradient="bg-gradient-to-r from-chart-4 to-chart-5"
                            sub="Action required"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card className="">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Users className="h-5 w-5 text-primary" />
                                    Recent Gyms
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1 text-primary hover:text-primary/80 hover:bg-primary/10"
                                    onClick={() => { window.location.href = "/gyms" }}
                                >
                                    VIEW ALL GYMS
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </CardHeader>

                            <CardContent>
                                {recentGyms.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        No gyms registered yet
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {recentGyms.map((gym: any) => {
                                            const isActive = gym.status?.toLowerCase() === "active";

                                            return (
                                                <div
                                                    key={gym.id}
                                                    className="p-5 rounded-lg border bg-card  transition-all duration-200 shadow-sm hover:shadow-md"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-semibold text-xl ${isActive
                                                                ? "bg-chart-3/15 text-chart-3"
                                                                : "bg-chart-4/15 text-chart-4"
                                                                }`}
                                                        >
                                                            {gym.company_name?.[0]?.toUpperCase() || "?"}
                                                        </div>

                                                        <div className="flex-1 min-w-0 space-y-1.5">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <p className="font-medium text-lg truncate">
                                                                    {gym.company_name || "Unnamed Gym"}
                                                                </p>

                                                                <Badge
                                                                    variant="outline"
                                                                    className={
                                                                        isActive
                                                                            ? "bg-chart-3/10 text-chart-3 border-chart-3/20 px-2 py-1 text-xs"
                                                                            : "bg-chart-4/10 text-chart-4 border-chart-4/20 px-2 py-1 text-xs"
                                                                    }
                                                                >
                                                                    {gym.status?.toUpperCase() || "UNKNOWN"}
                                                                </Badge>
                                                            </div>

                                                            <p className="text-sm text-muted-foreground">
                                                                {gym.package_name
                                                                    ? `${gym.package_name} • ${gym.duration || "—"}`
                                                                    : "No package assigned"}
                                                            </p>

                                                            <p className="text-xs text-muted-foreground/80">
                                                                Ref: {gym.reference_num || "—"}
                                                                {gym.company_email && ` • ${gym.company_email}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    Financial Activity
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1 text-primary hover:text-primary/80 hover:bg-primary/10"
                                    onClick={() => { window.location.href = "/gyms" }}
                                >
                                    VIEW LEDGER
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </CardHeader>

                            <CardContent>
                                {recentGyms.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        No recent payment activity
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {recentGyms.map((gym: any) => (
                                            <div
                                                key={gym.id}
                                                className="p-5 rounded-lg border bg-card transition-all duration-200 shadow-sm hover:shadow-md"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                    <div className="space-y-1.5">
                                                        <p className="font-medium text-lg">
                                                            {gym.company_name || "Gym"}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {gym.company_address || "No address provided"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground/80">
                                                                Ref: {gym.reference_num || "—"}
                                                                {gym.company_email && ` • ${gym.company_email}`}
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-6 text-right min-w-[220px]">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Paid</p>
                                                            <p className="text-lg font-semibold text-chart-3">
                                                                {currency} {Number(gym.paid_payment || 0).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Pending</p>
                                                            <p className="text-lg font-semibold text-amber-600">
                                                                {currency} {Number(gym.pending_payment || 0).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}