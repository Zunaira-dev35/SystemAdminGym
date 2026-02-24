// src/pages/SystemLogs.tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSystemLogsAsyncThunk } from "@/redux/pagesSlices/feeCollectionSlice"; // Create this thunk
import { RootState } from "@/redux/store";
import { formatDateToShortString, formatTimeTo12Hour } from "@/utils/helper";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Activity } from "lucide-react";
import Pagination from "@/components/shared/Pagination";
import Loading from "@/components/shared/loaders/Loading";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
} from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";

export default function SystemLogs() {
  const dispatch = useDispatch();
  const { systemLogs, loadings } = useSelector(
    (state: RootState) => state.feeCollection
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const logs = systemLogs?.data || [];
  const totalRecords = systemLogs?.total || 0;

  useEffect(() => {
    dispatch(
      getSystemLogsAsyncThunk({
        page: currentPage,
        limit: recordsPerPage,
        search: searchTerm || undefined,
        filter_branch_id: filterBranchId,
        start_date: dateRange?.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : undefined,
        end_date: dateRange?.to
          ? format(dateRange.to, "yyyy-MM-dd")
          : undefined,
      })
    );
  }, [
    dispatch,
    currentPage,
    recordsPerPage,
    searchTerm,
    dateRange,
    filterBranchId,
  ]);
  const getCurrentMonthRange = (): DateRange => {
    const now = new Date();
    return {
      from: startOfMonth(now),
      to: endOfMonth(now),
    };
  };
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          {/* <Activity className="h-8 w-8 text-primary" /> */}
          System Activity Logs
        </h1>
        <p className="text-muted-foreground mt-1">
          Track all user actions, logins, and system events across branches
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end items-center  flex-wrap">
        <HeaderBranchFilter onBranchChange={setFilterBranchId} />
        {/* Modern Date Range Picker */}
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "min-w-[260px] justify-start text-left font-normal bg-background border-input mt-2",
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
                  <span>Filter by date range</span>
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
                numberOfMonths={1} // ← shows 2 months side by side (very nice UX)
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
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by action, description, user Id..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">All System Events</CardTitle>
        </CardHeader>
        <CardContent>
          {loadings?.systemLogs ? (
            <div className="py-20">
              <Loading />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="italic">
                No system logs found for the selected filters.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Action</TableHead>
                    <TableHead className="font-bold">User</TableHead>
                    <TableHead className="font-bold">Description</TableHead>
                    <TableHead className="font-bold">Date & Time</TableHead>
                    <TableHead className="font-bold">Branch</TableHead>
                    <TableHead className="font-bold">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow
                      key={log.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize font-medium",
                            log.action_type === "Login" &&
                              "bg-green-500/10 text-green-700 border-green-500/20",
                            log.action_type.includes("Error") &&
                              "bg-red-500/10 text-red-700 border-red-500/20",
                            log.action_type.includes("Create") &&
                              "bg-blue-500/10 text-blue-700 border-blue-500/20",
                            log.action_type.includes("Update") &&
                              "bg-amber-500/10 text-amber-700 border-amber-500/20"
                          )}
                        >
                          {log.action_type}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-medium">
                        {log.reference_entity?.name || "System"}
                        {log.reference_entity?.reference_num && (
                          <p className="text-xs text-muted-foreground">
                            {log.reference_entity.reference_num}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="max-w-md text-sm">
                        {log.action_description}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="font-medium">
                            {formatDateToShortString(log.date)}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {log.time && formatTimeTo12Hour(log.time)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <p className="font-medium">
                            {log.branch?.name || "Unknown Branch"}
                          </p>
                          <Badge variant="secondary" className="w-fit text-xs">
                            {log.branch?.reference_num || "-"}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {log.device_ip || "N/A"}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalRecords={totalRecords}
                recordsPerPage={recordsPerPage}
                setRecordsPerPage={setRecordsPerPage}
                className="mt-6"
                recordsPerPageOptions={[10, 20, 50, 100]}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
