// src/pages/AttendanceDetail.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatTimeTo12Hour, formatDateToShortString } from "@/utils/helper";
import { getMethodIcon, getMethodColor } from "./Attendance"; // ← Reuse from main page if available
import { getMembersAttendanceAsyncThunk } from "@/redux/pagesSlices/generalSlice";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
export default function AttendanceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { memberAttendances: allAttendances, employeeAttendances } =
    useSelector((state: RootState) => state.general);
  const dispatch = useDispatch<AppDispatch>();
  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("");
  const hasActiveFilters = typeFilter !== "all" || timeFilter !== "";

  // Reset filters
  const clearFilters = () => {
    setTypeFilter("all");
    setTimeFilter("");
  };
  const fetchAttendance = useCallback(() => {
    const params: any = {
      // date: selectedDate,
      //   limit: recordsPerPage,
      //   page: currentPage,
      //   filter_branch_id: filterBranchId,
    };

    // if (searchQuery.trim()) {
    //   params.search = searchQuery.trim();
    // }
    // console.log("selectedBranchId", selectedBranchId);
    // Only pass user_type based on tab

    params.user_type = "member";
    dispatch(getMembersAttendanceAsyncThunk(params));
  }, [
    dispatch,
    // activeTab,
    // selectedDate,
    // searchQuery,
    // recordsPerPage,
    // currentPage,
    // filterBranchId,
  ]);
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Find the record
  const attendance = useMemo(() => {
    return allAttendances?.data?.find((a: any) => a.id === Number(id));
  }, [allAttendances, id]);

  if (!attendance) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Attendance Record Not Found</h2>
        <Button className="mt-4" onClick={() => navigate("/attendance")}>
          Back to List
        </Button>
      </div>
    );
  }

  // All check-ins: main + details
  const allCheckIns = useMemo(() => {
    return [
      { ...attendance, isPrimary: true },
      ...(attendance.attendance_details || []).map((d: any) => ({
        ...d,
        isPrimary: false,
      })),
    ];
  }, [attendance]);

  // Apply filters
  const filteredCheckIns = useMemo(() => {
    return allCheckIns.filter((checkin: any) => {
      const matchesType =
        typeFilter === "all" ||
        checkin.checkin_type?.toLowerCase() === typeFilter;

      const matchesTime =
        !timeFilter ||
        (checkin.checkin_time && checkin.checkin_time.includes(timeFilter));

      return matchesType && matchesTime;
    });
  }, [allCheckIns, typeFilter, timeFilter]);
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm mb-4">
          <button
            onClick={() => navigate("/attendance")}
            className="flex items-center gap-2 hover:text-primary transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Attendance
          </button>
          <span>/</span>
          <span className="font-medium">
            Attendance Details - {attendance.user?.name}{" "}
            {attendance.user?.reference_num && (
              <Badge variant={"secondary"}>
                {attendance.user?.reference_num}
              </Badge>
            )}
          </span>
        </div>

        <Badge variant="outline" className="text-base">
          {formatDateToShortString(attendance.date)}
        </Badge>
      </div>

      {/* Simple Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="grid lg:grid-cols-2  gap-6 items-end">
            <CardTitle className="text-xl">
              All Check-ins on {formatDateToShortString(attendance.date)}
            </CardTitle>
            <div className="flex space-x-2 items-center justify-end">
              {/* <Label className="text-sm font-medium">Filter by Method</Label> */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="face">Face</SelectItem>
                  <SelectItem value="fingerprint">Fingerprint</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="rfid">RFID</SelectItem>
                </SelectContent>
              </Select>
                 {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="gap-2 w-fit"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                {/* <TableHead>Status</TableHead> */}
                {/* <TableHead>Notes</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCheckIns.map((checkin: any, index: number) => (
                <TableRow
                  key={checkin.id}
                  className={
                    checkin.isPrimary ? "bg-primary/5 font-medium" : ""
                  }
                >
                  <TableCell>
                    {index + 1}
                    {/* {checkin.isPrimary && " (Primary)"} */}
                  </TableCell>
                  <TableCell>
                    {formatTimeTo12Hour(checkin.checkin_time)}
                    {checkin.checkout_time && (
                      <> → {formatTimeTo12Hour(checkin.checkout_time)}</>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getMethodColor(checkin.checkin_type)}
                    >
                      {getMethodIcon(checkin.checkin_type)}{" "}
                      <span className="ml-1 capitalize">
                        {checkin.checkin_type}
                      </span>
                    </Badge>
                  </TableCell>
                  {/* <TableCell>
                    <Badge
                      variant={checkin.checkout_time ? "default" : "secondary"}
                    >
                      {checkin.checkout_time ? "Completed" : "Ongoing"}
                    </Badge>
                  </TableCell> */}
                  {/* <TableCell className="text-sm text-muted-foreground">
                    {checkin.notes || "—"}
                  </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCheckIns.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No check-in records found for this day
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
