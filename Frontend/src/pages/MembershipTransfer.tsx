import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllMembershipTransfersAsyncThunk,
  createMembershipTransferAsyncThunk,
} from "@/redux/pagesSlices/feeCollectionSlice"; // Create this slice if not exists
import { getAllMembersAsyncThunk } from "@/redux/pagesSlices/peopleSlice";
import { RootState, AppDispatch } from "@/redux/store";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Search, Download, Building2, User, X } from "lucide-react";
import CustomCheckbox from "@shared/CustomCheckbox";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useCallback } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { toast } from "@/hooks/use-toast";
import Pagination from "@/components/shared/Pagination";
import { PERMISSIONS } from "@/permissions/permissions";
import Loading from "@/components/shared/loaders/Loading";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { formatDateToShortString } from "@/utils/helper";
import { usePermissions } from "@/permissions/usePermissions";
import MemberSearchCombobox from "@/components/MemberSearchCombobox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { backendBasePath } from "@/constants";
import { ErrorMessage } from "formik";
import { cn } from "@/lib/utils"; // if you have cn utility
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { exportToPDF } from "@/utils/exportToPdf";
interface TransferFormData {
  from_member_id: string;
  to_member_id: string;
  notes: string;
}

interface Member {
  id: number;
  name: string;
  reference_num: string;
}

export default function MembershipTransfer() {
  const dispatch = useDispatch<AppDispatch>();
  const { transfers, loadings } = useSelector(
    (state: RootState) => state.feeCollection || {}
  );
  const { members } = useSelector((state: RootState) => state.people);
  const { user } = useSelector((state: any) => state.auth);
  const { branchesList } = useSelector((state: any) => state.plan);


  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined
  );
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const { hasPermission } = usePermissions();

  const [formData, setFormData] = useState<TransferFormData>({
    from_member_id: "",
    to_member_id: "",
    notes: "",
  });

  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");
  const [fromMemberList, setFromMemberList] = useState<Member[]>([]);
  const [toMemberList, setToMemberList] = useState<Member[]>([]);
  const [errorForm, setErrorForm] = useState(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  // Fetch transfers
  const fetchTransfers = async () => {
    try {
      await dispatch(
        getAllMembershipTransfersAsyncThunk({
          search: searchTerm,
          limit: recordsPerPage,
          page: currentPage,
          filter_branch_id: filterBranchId,
          start_date: dateRange?.from
            ? format(dateRange.from, "yyyy-MM-dd")
            : undefined,
          end_date: dateRange?.to
            ? format(dateRange.to, "yyyy-MM-dd")
            : undefined,
        })
      ).unwrap();
    } catch (error) {
      console.error("Error fetching transfers:", error);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [
    dispatch,
    searchTerm,
    recordsPerPage,
    currentPage,
    filterBranchId,
    dateRange,
  ]);

  // Fetch members for search
  const fetchMembers = async (
    search: string,
    setter: (list: Member[]) => void
  ) => {
    try {
      const res = await dispatch(
        getAllMembersAsyncThunk({ search, disable_page_param: 1 })
      ).unwrap();
      const list = res?.data?.data || res?.data || [];
      setter(list);
    } catch (err) {
      setter([]);
    }
  };

  //   useEffect(() => {
  //     if (fromSearch) fetchMembers(fromSearch, setFromMemberList);
  //   }, [fromSearch]);

  //   useEffect(() => {
  //     if (toSearch) fetchMembers(toSearch, setToMemberList);
  //   }, [toSearch]);

  const totalRecords = transfers?.data?.total || 0;
  const transferList = transfers?.data || [];

  // Open Add Form
  const openForm = () => {
    setFormData({ from_member_id: "", to_member_id: "", notes: "" });
    setFromSearch("");
    setToSearch("");
    setIsFormOpen(true);
  };

  // Submit Transfer
  const handleSubmit = async () => {
    if (!formData.from_member_id || !formData.to_member_id) {
      //   toast({ title: "Please select both members", variant: "destructive" });
      setErrorForm("Please select both members");
      return;
    }
    if (formData.from_member_id === formData.to_member_id) {
      setErrorForm(
        "The from member (Source) field and to member (Recipient) must be different"
      );
      return;
    }

    // const data = new FormData();
    // data.append("from_member_id", formData.from_member_id);
    // data.append("to_member_id", formData.to_member_id);
    // data.append("notes", formData.notes.trim());
    const payload = {
      from_member_id: Number(formData.from_member_id), // convert to number (recommended)
      to_member_id: Number(formData.to_member_id),
      notes: formData.notes.trim() || "", // or null if backend allows
    };

    console.log("Sending payload:", payload);
    try {
      await dispatch(createMembershipTransferAsyncThunk(payload)).unwrap();
      toast({ title: "Membership transferred successfully!" });
      setIsFormOpen(false);
      fetchTransfers();
    } catch (err: any) {
      console.log("err", err);
      // setErrorForm(err?.response?.data?.errors || err)
      toast({
        title: "Error",
        description: err?.message || "Failed to transfer membership",
        variant: "destructive",
      });
    } finally {
      setErrorForm("");
    }
  };
  // Filter members based on the new rules
  // const sourceMembers = members?.filter((m: any) =>
  //   m.status?.toLowerCase() === "active" ||
  //   m.status?.toLowerCase() === "frozen"
  // ) || [];

  // const recipientMembers = members?.filter((m: any) =>
  //   m.status?.toLowerCase() === "inactive" ||
  //   m.status?.toLowerCase() === "expired"
  // ) || [];
  // PDF Export
  const exportPDF = useCallback(() => {
    const selectedTransfers = transferList.filter((t: any) => selectedIds.has(t.id));

    if (selectedTransfers.length === 0) {
      toast({ title: "No transfers selected", variant: "destructive" });
      return;
    }

    const selectedBranch = filterBranchId
      ? branchesList?.find((b: any) => b.id === Number(filterBranchId))
      : null;

    exportToPDF({
      title: "Membership Transfer Report",
      // subtitle: `${selectedTransfers.length} transfer${selectedTransfers.length !== 1 ? "s" : ""} selected`,
      filenamePrefix: "Membership_Transfers",

      dateRange: dateRange ? { from: dateRange.from, to: dateRange.to } : undefined,

      branchInfo: selectedBranch
        ? {
          name: selectedBranch.name,
          address: selectedBranch.address,
          reference_num: selectedBranch.reference_num,
        }
        : null,

      columns: [
        { title: "Date", dataKey: "date", align: "center", width: 25 },
        { title: "From Member", dataKey: "fromMember", align: "left", width: 35 },
        { title: "To Member", dataKey: "toMember", align: "left", width: 34 },
        { title: "Plan", dataKey: "plan", align: "center", width: 30 },
        { title: "Days Transferred", dataKey: "days", align: "center", width: 40 },
        { title: "Transferred By", dataKey: "transferredBy", align: "center", width: 40 },
        { title: "Branch", dataKey: "branch", align: "center", width: 35 },
        { title: "Notes", dataKey: "notes", align: "left", width: 40 },
      ],

      data: selectedTransfers,

      getRowData: (transfer: any) => ({
        date: formatDateToShortString(transfer.transfer_date) || "—",
        fromMember: `${transfer.from_member?.name || "—"} (${transfer.from_member?.reference_num || "—"})`,
        toMember: `${transfer.to_member?.name || "—"} (${transfer.to_member?.reference_num || "—"})`,
        plan: transfer.plan?.name || "—",
        days: `${transfer.days_transferred || 0} days`,
        transferredBy: transfer.transferred_by?.name || "System",
        branch: transfer.branch?.name || "—",
        notes: (transfer.notes || "—").substring(0, 60) + (transfer.notes?.length > 60 ? "..." : ""),
      }),
    });
  }, [transferList, selectedIds, dateRange, filterBranchId, branchesList]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Membership Transfer</h1>
          <p className="text-muted-foreground">
            Transfer remaining membership days from one member to another
          </p>
        </div>
        <div className="flex gap-4 flex-wrap">
          {hasPermission(PERMISSIONS.MEMBERSHIP_TRANSFER_EXPORT) && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportPDF}
              disabled={selectedIds.size === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}

          <Button
            permission={PERMISSIONS.MEMBERSHIP_TRANSFER_CREATE}
            onClick={openForm}
          >
            <Plus className="h-4 w-4 mr-2" />
            Transfer Membership
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap">
            <CardTitle>All Transfers</CardTitle>
            <div className="relative flex gap-3 flex-wrap">
              <HeaderBranchFilter onBranchChange={setFilterBranchId} />
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
              <div className="relative">
                <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transfers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table className="overflow-x-scroll">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <CustomCheckbox
                    checked={selectAll}
                    onChange={(checked) => {
                      setSelectAll(checked);
                      if (checked) {
                        setSelectedIds(
                          new Set(transferList.map((t: any) => t.id))
                        );
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                </TableHead>
                {/* <TableHead>Transfer ID</TableHead> */}
                <TableHead>Transfer Date</TableHead>
                <TableHead>From Member</TableHead>
                <TableHead>To Member</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Days Transferred</TableHead>
                <TableHead>Transferred By</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadings?.transfers ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
                    <Loading />
                  </TableCell>
                </TableRow>
              ) : transferList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No transfers found
                  </TableCell>
                </TableRow>
              ) : (
                transferList.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <CustomCheckbox
                        checked={selectedIds.has(t.id)}
                        onChange={(checked) => {
                          const newIds = new Set(selectedIds);
                          if (checked) newIds.add(t.id);
                          else newIds.delete(t.id);
                          setSelectedIds(newIds);
                          setSelectAll(
                            newIds.size === transferList.length &&
                            transferList.length > 0
                          );
                        }}
                      />
                    </TableCell>
                    {/* <TableCell>
                      {t?.reference_num}
                    </TableCell> */}
                    <TableCell>
                      {formatDateToShortString(t?.transfer_date)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{t.from_member?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {t.from_member?.reference_num}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{t.to_member?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {t.to_member?.reference_num}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0">
                        <span>{t.plan?.name}</span>
                        <Badge variant="secondary" className="w-fit">
                          {t.plan?.reference_num || "-"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {t.days_transferred} days
                    </TableCell>
                    <TableCell>{t.transferred_by?.name}</TableCell>
                    <TableCell>{t.branch?.name}</TableCell>
                    <TableCell className="max-w-xs">
                      <p
                        className="text-sm text-muted-foreground truncate"
                        title={t.notes}
                      >
                        {t.notes || "—"}
                      </p>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {!loadings?.transfers && (
          <Pagination
            recordsPerPage={recordsPerPage}
            setRecordsPerPage={setRecordsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalRecords={totalRecords}
            className="bg-theme-white"
            recordsPerPageOptions={[5, 10, 20, 50]}
          />
        )}
      </Card>

      {/* Add Transfer Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transfer Membership</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            {/* From Member */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                From Member (Source)
              </Label>
              <MemberSearchCombobox
                filterStatus="active"
                onSelect={(member) => {
                  setFormData({
                    ...formData,
                    from_member_id: member.id.toString(),
                  });
                  setFromSearch(member);
                }}
              />
              {fromSearch && (
                <div className="mt-2 p-3 bg-muted/40 rounded-lg border">
                  <div className="flex justify-between">
                    <p className="font-medium text-green-700">
                      Selected Source Member:
                    </p>
                    <span
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer p-1 rounded hover:bg-muted"
                      onClick={() => {
                        setFromSearch("");
                        setFormData((prev) => ({ ...prev, from_member_id: "" }));
                        setErrorForm(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setFromSearch("");
                          setFormData((prev) => ({ ...prev, from_member_id: "" }));
                          setErrorForm(null);
                        }
                      }}
                    >
                      <X size={18} />
                    </span>

                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {/* You can also show avatar here if you store selected member */}
                    {fromSearch ? (
                      <div className="flex items-center gap-4 w-full">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={
                              fromSearch?.profile_image
                                ? `${backendBasePath}${fromSearch?.profile_image}`
                                : undefined
                            }
                          />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-lg">
                            {fromSearch?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {fromSearch?.reference_num}
                          </p>
                        </div>
                      </div>
                    ) : (
                      "Member loaded..."
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* To Member (Recipient) */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                To Member (Recipient)
              </Label>
              <MemberSearchCombobox
                filterStatus="inactive"
                // filteredMembers={recipientMembers}
                onSelect={(member) => {
                  setFormData({
                    ...formData,
                    to_member_id: member.id.toString(),
                  });
                  setToSearch(member);
                }}
              />
              {toSearch && (
                <div className="mt-2 p-3 bg-muted/40 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-green-700">
                      Selected Recipient Member:
                    </p>

                    <span
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer p-1 rounded hover:bg-muted"
                      onClick={() => {
                        setToSearch("");
                        setFormData((prev) => ({ ...prev, to_member_id: "" }));
                        setErrorForm(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setToSearch("");
                          setFormData((prev) => ({ ...prev, to_member_id: "" }));
                          setErrorForm(null);
                        }
                      }}
                    >
                      <X size={18} />
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    {/* You can also show avatar here if you store selected member */}
                    {toSearch ? (
                      <div className="flex items-center gap-4 w-full">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={
                              toSearch?.profile_image
                                ? `${backendBasePath}${toSearch?.profile_image}`
                                : undefined
                            }
                          />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-lg">
                            {toSearch?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {toSearch?.reference_num}
                          </p>
                        </div>
                      </div>
                    ) : (
                      "Member loaded..."
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* <div>
              <Label className="text-lg">Select Member</Label>
              <MemberSearchCombobox onSelect={setToSearch} />
            </div> */}
            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                placeholder="Reason for transfer..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
            <div className="text-destructive">{errorForm && errorForm}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Transfer Membership</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
