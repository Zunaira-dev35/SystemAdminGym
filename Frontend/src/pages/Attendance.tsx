// src/pages/Attendance.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  
  UserCheck,
  Users,
  Fingerprint,
  Scan,
  CreditCard,
  MapPin,
  Search,
  Download,
  Eye,
  CalendarIcon,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BiometricScanner from "@/components/BiometricScanner";
import { DetailDrawer } from "@/components/shared/DetailDrawer";
import { AppDispatch, RootState } from "@/redux/store";
import {
  getMembersAttendanceAsyncThunk,
  getEmployeesAttendanceAsyncThunk,
} from "@/redux/pagesSlices/generalSlice";
import Pagination from "@/components/shared/Pagination";
import { set } from "lodash";
import Loading from "@/components/shared/loaders/Loading";
import { formatDateToShortString, formatTimeTo12Hour } from "@/utils/helper";
import { backendBasePath } from "@/constants";
import CustomCheckbox from "@shared/CustomCheckbox";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PERMISSIONS } from "@/permissions/permissions";
import { usePermissions } from "@/permissions/usePermissions";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { useNavigate } from "react-router-dom";

import { exportToPDF } from "@/utils/exportToPdf";

import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";




export const getMethodIcon = (method: string) => {
  switch (method?.toLowerCase()) {
    case "face":
      return <Scan className="h-4 w-4" />;
    case "fingerprint":
      return <Fingerprint className="h-4 w-4" />;
    case "rfid":
      return <CreditCard className="h-4 w-4" />;
    default:
      return <UserCheck className="h-4 w-4" />;
  }
};

export const getMethodColor = (method: string) => {
  switch (method?.toLowerCase()) {
    case "face":
      return "bg-chart-2/10 text-chart-2 border-chart-2/20";
    case "fingerprint":
      return "bg-chart-3/10 text-chart-3 border-chart-3/20";
    case "rfid":
      return "bg-purple-100 text-purple-700 border-purple-200";
    default:
      return "bg-chart-4/10 text-muted-foreground border-muted/20";
  }
};

export default function Attendance() {
  const dispatch = useDispatch<AppDispatch>();
  const { memberAttendances, employeeAttendances, loadings } = useSelector(
    (state: RootState) => state.general
  );
  const { branchesList } = useSelector((state: any) => state.plan);

  const { hasPermission } = usePermissions();

  const { selectedBranchId } = useSelector((state: any) => state.general);

  const today = new Date().toISOString().split("T")[0];

  const [activeTab, setActiveTab] = useState<"members" | "staff">("members");
  const [selectedDate, setSelectedDate] = useState(today);
  const [searchQuery, setSearchQuery] = useState("");

  const [scannerType, setScannerType] = useState<
    "facial" | "fingerprint" | "rfid"
  >("facial");
  const [showScanner, setShowScanner] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const getEmployeeLoading = loadings.employeeAttendance;
  const getMemberLoading = loadings.memberAttendance;
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const navigate = useNavigate();
  // Debounced search
  const debouncedSearch = useMemo(() => {
    let timeout: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setSearchQuery(value), 500);
    };
  }, []);
  const { user } = useSelector((state: any) => state.auth);

  // Fetch attendance based on active tab
  const fetchAttendance = useCallback(() => {
    let start_date = dateRange?.from
      ? format(dateRange.from, "yyyy-MM-dd")
      : undefined;

    let end_date = dateRange?.to
      ? format(dateRange.to, "yyyy-MM-dd")
      : start_date;
    const params: any = {
      // date: selectedDate,
      limit: recordsPerPage,
      page: currentPage,
      filter_branch_id: filterBranchId,
      ...(start_date && { start_date: start_date }),
      ...(end_date && { end_date: end_date }),
    };

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    // console.log("selectedBranchId", selectedBranchId);
    // Only pass user_type based on tab
    if (activeTab === "members") {
      params.user_type = "member";
      dispatch(getMembersAttendanceAsyncThunk(params));
    } else {
      params.user_type = "employee";
      dispatch(getEmployeesAttendanceAsyncThunk(params));
    }
  }, [
    dispatch,
    activeTab,
    selectedDate,
    searchQuery,
    recordsPerPage,
    currentPage,
    filterBranchId,
    dateRange,
  ]);

  // Re-fetch when tab, date, or search changes
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Optional: Refresh on scanner success
  const handleScannerSuccess = () => {
    setShowScanner(false);
    fetchAttendance(); // refresh current tab
  };

  const exportAttendancePDF = () => {
  const selected = memberAttendances.data.filter(r => selectedIds.has(r.id));
  if (!selected.length) return;

  exportToPDF({
    title: "Member Attendance Report",
    filenamePrefix: "Members_Attendance",
    columns: [
      { title: "ID",        dataKey: "id",           align: "center", width: 35 },
      { title: "Name",      dataKey: "name",         align: "left",   width: 55 },
      { title: "Date",      dataKey: "date",         align: "center", width: 35 },
      { title: "Check-in",  dataKey: "checkin",      align: "center", width: 35 },
      { title: "Branch",    dataKey: "branch",       align: "center", width: 45 },
      { title: "Method",    dataKey: "method",       align: "center", width: 35 },
      { title: "Status",    dataKey: "status",       align: "center", width: 35 },
    ],
    data: selected,
    branchInfo: filterBranchId ? branchesList.find(b => b.id === Number(filterBranchId)) : null,
    getRowData: (record) => {
      const user = record.user || {};
      return {
        id: user.reference_num || '—',
        name: (user.name || `${user.first_name || ''} ${user.last_name || ''}`).toUpperCase(),
        date: formatDateToShortString(record.date),
        checkin: record.checkin_time ? formatTimeTo12Hour(record.checkin_time) : '—',
        branch: record.branch?.name || '—',
        method: record.checkin_type ? record.checkin_type.charAt(0).toUpperCase() + record.checkin_type.slice(1) : '—',
        status: record.checkout_time ? 'Checked Out' : 'Present',
      };
    }
  });
};
  // const exportPDF = useCallback(() => {
  //   const currentData =
  //     activeTab === "members"
  //       ? memberAttendances.data
  //       : employeeAttendances.data;

  //   const selectedRecords = currentData.filter((record: any) =>
  //     selectedIds.has(record.id)
  //   );

  //   if (selectedRecords.length === 0) return;

  //   const doc = new jsPDF("l", "mm", "a4");

  //   doc.setFontSize(18);
  //   doc.text(
  //     `${activeTab === "members" ? "Member" : "Staff"} Attendance Report`,
  //     14,
  //     20
  //   );
  //   doc.setFontSize(12);
  //   doc.text(
  //     `Generated on: ${new Date().toLocaleDateString()} • ${
  //       selectedRecords.length
  //     } record(s)`,
  //     14,
  //     30
  //   );

  //   const tableData = selectedRecords.map((record: any) => {
  //     const user = record.user || {};
  //     const branch = record.branch || {};

  //     const fullName =
  //       user.name ||
  //       `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
  //       "—";

  //     return [
  //       user.reference_num || "—",
  //       fullName,
  //       formatDateToShortString(record.date),
  //       record.checkin_time ? formatTimeTo12Hour(record.checkin_time) : "—",
  //       branch.name || "—",
  //       record.checkin_type
  //         ? record.checkin_type.charAt(0).toUpperCase() +
  //           record.checkin_type.slice(1)
  //         : "—",
  //       record.checkout_time ? "Checked Out" : "Present",
  //     ];
  //   });

  //   autoTable(doc, {
  //     head: [["ID", "Name", "Date", "Check-in", "Branch", "Method", "Status"]],
  //     body: tableData,
  //     startY: 40,
  //     styles: { fontSize: 10, cellPadding: 6 },
  //     headStyles: {
  //       fillColor: [124, 59, 237],
  //       textColor: [255, 255, 255],
  //       fontStyle: "bold",
  //     },
  //     columnStyles: {
  //       0: { cellWidth: 35 },
  //       1: { cellWidth: 40 },
  //       2: { cellWidth: 40 },
  //       3: { cellWidth: 40 },
  //       4: { cellWidth: 50 },
  //       5: { cellWidth: 40 },
  //       6: { cellWidth: 30 },
  //     },
  //     alternateRowStyles: { fillColor: [248, 250, 252] },
  //     margin: { top: 40 },
  //   });

  //   const type = activeTab === "members" ? "Members" : "Staff";
  //   doc.save(
  //     `${type}_Attendance_Selected_${selectedIds.size}_${new Date()
  //       .toISOString()
  //       .slice(0, 10)}.pdf`
  //   );
  // }, [
  //   memberAttendances.data,
  //   employeeAttendances.data,
  //   selectedIds,
  //   activeTab,
  // ]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Member Attendance</h1>
          <p className="text-muted-foreground">
            Real-time member and staff attendance tracking
          </p>
        </div>
        <div>
          {hasPermission(PERMISSIONS.ATTENDANCE_MEMBER_EXPORT) && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportAttendancePDF}
              className={`mr-2 ${
                selectedIds.size === 0 ? "cursor-not-allowed" : ""
              }`}
              disabled={selectedIds.size === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Staff On Duty
            </CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {employeeAttendances.data.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently present
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Check-ins
            </CardTitle>
            <Calendar className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {memberAttendances.data.length + employeeAttendances.data.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Today</p>
          </CardContent>
        </Card>
      </div> */}

      {/* Mark Attendance */}
      {/* <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Quick Check-in</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setScannerType('facial'); setShowScanner(true); }}>
                <Scan className="h-4 w-4 mr-2" /> Facial
              </Button>
              <Button variant="outline" onClick={() => { setScannerType('fingerprint'); setShowScanner(true); }}>
                <Fingerprint className="h-4 w-4 mr-2" /> Fingerprint
              </Button>
              <Button variant="outline" onClick={() => { setScannerType('rfid'); setShowScanner(true); }}>
                <CreditCard className="h-4 w-4 mr-2" /> RFID
              </Button>
            </div>
          </div>
        </CardHeader>
        {showScanner && (
          <CardContent>
            <BiometricScanner
              type={scannerType}
              onClose={() => setShowScanner(false)}
              onSuccess={handleScannerSuccess}
            />
          </CardContent>
        )}
      </Card> */}

      {/* Attendance Table with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between flex-wrap">
            <CardTitle>Attendance Records</CardTitle>

            <div className="flex gap-3 items-center flex-wrap">
              <HeaderBranchFilter onBranchChange={setFilterBranchId} />

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name ..."
                  className="pl-10 w-64"
                  onChange={(e) => debouncedSearch(e.target.value)}
                />
              </div>

              {/* Modern Date Range Picker */}
              <div className="flex items-center gap-2 flex-wrap">
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
                      numberOfMonths={1} // ← you can change to 1 or 3
                    />
                  </PopoverContent>
                </Popover>

                {/* Quick clear button */}
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
          </div>
        </CardHeader>

        <CardContent>
          {/* <Tabs value={activeTab} onValueChange={(v) => {
            setCurrentPage(1);
            setRecordsPerPage(10);
            setSearchQuery('');
            setActiveTab(v as 'members' | 'staff')
           
            }}> */}
          {/* <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">
                Members ({memberAttendances.data.length})
              </TabsTrigger>
              <TabsTrigger value="staff">
                Staff ({employeeAttendances.data.length})
              </TabsTrigger>
            </TabsList> */}

          {/* Members Tab */}
          {/* <TabsContent value="members" className="mt-6"> */}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <CustomCheckbox
                      checked={selectAll}
                      onChange={(checked) => {
                        setSelectAll(checked);
                        const currentData =
                          activeTab === "members"
                            ? memberAttendances.data
                            : employeeAttendances.data;

                        if (checked) {
                          setSelectedIds(
                            new Set(currentData.map((r: any) => r.id))
                          );
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Member ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  {/* <TableHead>Check-out Time</TableHead> */}
                  <TableHead>Method</TableHead>
                  <TableHead>Branch</TableHead>
                  {/* <TableHead>Status</TableHead> */}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getMemberLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <Loading />
                    </TableCell>
                  </TableRow>
                ) : !memberAttendances?.data?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No Member Attendance Found
                    </TableCell>
                  </TableRow>
                ) : (
                  memberAttendances.data.map((record: any) => (
                    <TableRow
                      key={record.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedRecord({
                          ...record.user,
                          checkin_time: record.checkin_time,
                          checkout_time: record.checkout_time,
                          checkin_type: record.checkin_type,
                          type: "member",
                        });
                        // setDetailDrawerOpen(true);
                      }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <CustomCheckbox
                          checked={selectedIds.has(record.id)}
                          onChange={(checked) => {
                            const newIds = new Set(selectedIds);
                            if (checked) newIds.add(record.id);
                            else newIds.delete(record.id);
                            setSelectedIds(newIds);
                            setSelectAll(
                              newIds.size === memberAttendances.data.length &&
                                memberAttendances.data.length > 0
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={
                                record?.user?.profile_image
                                  ? `${backendBasePath}${record?.user?.profile_image}`
                                  : undefined
                              }
                            />
                            <AvatarFallback>
                              {record?.user?.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          {!record?.user?.name ? (
                            <span className="text-muted-foreground italic text-sm">
                              Deleted Member
                            </span>
                          ) : (
                            <div>
                              <p className="font-medium">
                                {record?.user?.name}
                              </p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {record.user?.reference_num || "—"}
                      </TableCell>
                      <TableCell>
                        {formatDateToShortString(record.date)}
                      </TableCell>
                      <TableCell>
                        {formatTimeTo12Hour(record.checkin_time)}
                      </TableCell>
                      {/* <TableCell>
                        {formatTimeTo12Hour(record.checkout_time)}
                      </TableCell> */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getMethodColor(record.checkin_type)}
                        >
                          {getMethodIcon(record.checkin_type)}
                          <span className="ml-1 capitalize">
                            {record.checkin_type}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record?.branch?.name ?? "-"}
                        <p className="text-xs w-fit bg-muted-foreground/10 py-1 px-2 rounded-md">
                          {record?.branch?.reference_num ?? "-"}
                        </p>
                      </TableCell>
                      {/* <TableCell>
                        <Badge
                          variant={
                            record.checkout_time ? "default" : "secondary"
                          }
                        >
                          {record.checkout_time ? "Checked Out" : "Present"}
                        </Badge>
                      </TableCell> */}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(`/attendance/detail/${record.id}`)
                          } // ← New route
                          title="View full attendance details"
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              recordsPerPage={recordsPerPage}
              setRecordsPerPage={setRecordsPerPage}
              totalRecords={memberAttendances.meta.total || 0}
              recordsPerPageOptions={[5, 10, 20, 50]}
            />
          </div>

          {/* </TabsContent> */}

          {/* Staff Tab */}
          {/* <TabsContent value="staff" className="mt-6">    
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Check-in Time</TableHead>
                        <TableHead>Check-out Time</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {
                       getEmployeeLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10">
                          <Loading />
                        </TableCell>
                      </TableRow>
                    ) : !employeeAttendances?.data?.length ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-10 text-muted-foreground"
                        >
                          No Employee Attendance Found
                        </TableCell>
                      </TableRow>
                    ) :
                      employeeAttendances.data.map((record: any) => (
                        <TableRow
                          key={record.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSelectedRecord({
                              ...record.user,
                              checkin_time: record.checkin_time,
                              checkout_time: record.checkout_time,
                              checkin_type: record.checkin_type,
                              type: 'staff'
                            });
                            setDetailDrawerOpen(true);
                          }}
                        >
                          <TableCell className="font-medium">
                            {record.user.first_name} {record.user.last_name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {record.user.reference_num || '—'}
                          </TableCell>
                          <TableCell>{formatTimeTo12Hour(record.checkin_time)}</TableCell>
                          <TableCell>{formatTimeTo12Hour(record.checkout_time)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getMethodColor(record.checkin_type)}>
                              {getMethodIcon(record.checkin_type)}
                              <span className="ml-1 capitalize">{record.checkin_type}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={record.checkout_time ? 'default' : 'secondary'}>
                              {record.checkout_time ? 'Checked Out' : 'On Duty'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    recordsPerPage={recordsPerPage}
                    setRecordsPerPage={setRecordsPerPage}
                    totalRecords={employeeAttendances.meta.total || 0}
                    recordsPerPageOptions={[5, 10, 20, 50]}
                  />
                </div>
              
            </TabsContent> */}
          {/* </Tabs> */}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <DetailDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        title={
          selectedRecord?.type === "member"
            ? "Member Attendance"
            : "Staff Attendance"
        }
        description={
          selectedRecord
            ? `${selectedRecord.first_name} ${selectedRecord.last_name}`
            : ""
        }
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <strong>Name:</strong> {selectedRecord.first_name}{" "}
                {selectedRecord.last_name}
              </div>
              <div>
                <strong>ID:</strong>{" "}
                <code>{selectedRecord.reference_num || "N/A"}</code>
              </div>
              <div>
                <strong>Type:</strong>{" "}
                <Badge>{selectedRecord.type.toUpperCase()}</Badge>
              </div>
              <div>
                <strong>Date:</strong> {selectedDate}
              </div>
              <div>
                <strong>Check-in:</strong> {selectedRecord.checkin_time || "—"}
              </div>
              <div>
                <strong>Check-out:</strong>{" "}
                {selectedRecord.checkout_time || "Still Present"}
              </div>
              <div>
                <strong>Method:</strong>
                <Badge
                  variant="outline"
                  className={getMethodColor(selectedRecord.checkin_type)}
                >
                  {getMethodIcon(selectedRecord.checkin_type)}{" "}
                  {selectedRecord.checkin_type}
                </Badge>
              </div>
              <div>
                <strong>Status:</strong>
                <Badge
                  variant={
                    selectedRecord.checkout_time ? "default" : "secondary"
                  }
                >
                  {selectedRecord.checkout_time
                    ? "Checked Out"
                    : "Currently Present"}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
