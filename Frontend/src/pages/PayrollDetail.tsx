// src/pages/PayrollDetail.tsx
import { useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, DollarSign, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDateToShortString, formatTimeTo12Hour } from "@/utils/helper";
import { backendBasePath } from "@/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Loading from "@/components/shared/loaders/Loading";
import { getPayrollAsyncThunk } from "@/redux/pagesSlices/generalSlice";

export default function PayrollDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const fetchPayrolls = useCallback(() => {
    const params: any = {
      diable_page_param: 1,
    };

    dispatch(getPayrollAsyncThunk(params));
  }, [dispatch]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const { payrolls, loadings } = useSelector(
    (state: RootState) => state.general,
  ); // Adjust slice name if needed
  console.log("payroll", payrolls);
  // Combine payrolls from all pages or fetch if empty
  const allPayrolls = useMemo(() => {
    return payrolls?.data || []; // Adjust based on your Redux structure
  }, [payrolls]);

  // Find the specific payroll by ID
  const payroll = useMemo(() => {
    return allPayrolls.find((p: any) => p.id === Number(id));
  }, [allPayrolls, id]);

  if (loadings.getPayroll) {
    return (
      <div className="flex justify-center py-20">
        <Loading size="lg" />
      </div>
    );
  }

  if (!payroll) {
    return (
      <div className="p-8 text-center space-y-6">
        <h2 className="text-3xl font-bold text-muted-foreground">
          Payroll Record Not Found
        </h2>
        <p className="text-lg text-muted-foreground">
          The payroll you're looking for might not exist or you don't have
          access.
        </p>
        <Button onClick={() => navigate("/hrm/payroll")}>
          Back to Payroll List
        </Button>
      </div>
    );
  }

  const user = payroll.user;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 text-sm mb-4">
        <button
          onClick={() => navigate("/hrm/payroll")}
          className="flex items-center gap-2 hover:text-primary transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Employees
        </button>
        <span>/</span>
        <span className="font-medium">Payroll Details</span>
      </div>

      {/* Employee Info */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-3">
            <User className="h-6 w-6" />
            Employee: {user?.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <Avatar className="h-32 w-32 ring-4 ring-primary/20">
              <AvatarImage src={`${backendBasePath}${user?.profile_image}`} />
              <AvatarFallback className="text-5xl">
                {user?.name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="text-lg font-medium">
                  {user?.reference_num || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Basic Salary</p>
                <p className="text-xl font-bold">
                  {payroll.system_currency}{" "}
                  {payroll.basic_salary.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Payable</p>
                <p className="text-xl font-bold text-green-600">
                  {payroll.system_currency}{" "}
                  {payroll.net_payable.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={payroll.status === "paid" ? "default" : "secondary"}
                >
                  {payroll.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Period Days</p>
                <p className="text-lg font-medium">{payroll.period_days}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shift Config */}
      <Card>
        <CardHeader>
          <CardTitle>Shift Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(payroll.shift_config || {}).map(
              ([day, config]: [string, any]) => (
                <div key={day} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium ">{day || "Default"}</h3>
                  {config.day_type === "rest_day" && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-0 right-0 font-medium px-3 py-1 rounded-full"
                  >
                    Rest Day
                  </Badge>
                )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      Daily Rate: {payroll.system_currency}{" "}
                      {config.daily_rate?.toFixed(2)}
                    </p>
                    <p>
                      Rate Per Minute : {payroll.system_currency}{" "}
                      {config.per_minute_rate?.toFixed(2)}
                    </p>
                    <p>
                      <strong>Total Minutes:</strong> {config.total_minutes}
                    </p>
                    {config.morning?.active && (
                      <p>
                        Morning: {formatTimeTo12Hour(config.morning.start_time)}{" "}
                        - {formatTimeTo12Hour(config.morning.end_time)}(
                        {config.morning.duration_minutes} min)
                      </p>
                    )}
                    {config.evening?.active && (
                      <p>
                        Evening: {formatTimeTo12Hour(config.evening.start_time)}{" "}
                        - {formatTimeTo12Hour(config.evening.end_time)}(
                        {config.evening.duration_minutes} min)
                      </p>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Absent Details Table */}
      {/* {payroll.absent_details?.length > 0 && ( */}
      <Card>
        <CardHeader>
          <CardTitle>
            Shift Absent Details ({payroll.absent_days} days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-y-auto max-h-[300px] relative ">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Minutes</TableHead>
                  <TableHead>Deduction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payroll.absent_details &&
                  payroll.absent_details.map((detail: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        {formatDateToShortString(detail.date)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {detail.shift_type}
                      </TableCell>
                      <TableCell>{detail.day_name}</TableCell>
                      <TableCell>{detail.duration_minutes}</TableCell>
                      <TableCell className="text-red-600">
                        {payroll.system_currency} {detail.deduction?.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                {(!payroll.absent_details ||
                  payroll.absent_details.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-6"
                    >
                      No absent details recorded
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* )} */}
      {/* Cheat Details - New Section */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            Cheat Details ({payroll.cheat_minutes} minutes total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>                  
                  <TableHead>Shift</TableHead>
                  <TableHead>Late Check In (minutes)</TableHead>
                  <TableHead>Early Check Out (minutes)</TableHead>
                  <TableHead>Total Minutes</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Deduction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payroll.cheat_details &&
                  payroll.cheat_details.map((detail: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        {formatDateToShortString(detail.date)}
                      </TableCell>
                       <TableCell className="capitalize">
                        {detail.attendance_type}
                      </TableCell>
                      <TableCell>{detail.checkIn}</TableCell>
                      <TableCell>{detail.checkOut}</TableCell>
                      <TableCell>{detail.total_minutes}</TableCell>
                      <TableCell>{detail.day_name}</TableCell>
                      <TableCell className="text-red-600">
                        {payroll.system_currency} {detail.deduction.toFixed(2)}
                      </TableCell>
                     
                    </TableRow>
                  ))}
                {(!payroll.cheat_details ||
                  payroll.cheat_details.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-6"
                    >
                      No cheat details recorded
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Net Payable</p>
            <p className="text-2xl font-bold ">
              {payroll.system_currency} {payroll.net_payable.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Absent Deduction</p>
            <p className="text-2xl font-bold ">
              {payroll.system_currency}{" "}
              {payroll.absent_deduction.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Cheat Deduction</p>
            <p className="text-2xl font-bold">
              {payroll.system_currency}{" "}
              {payroll.cheat_deduction.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Selected Period Payable</p>
            <p className="text-2xl font-bold">{payroll.period_salary}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Payroll Period (Days)</p>
            <p className="text-2xl font-bold">{payroll.period_days}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
