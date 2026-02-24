// src/pages/plan-transfer/PlanTransfer.tsx
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllMembersAsyncThunk, getAllSearchedMembersAsyncThunk } from "@/redux/pagesSlices/peopleSlice";
import {
  createPlanTransfersAsyncThunk,
  getAllPlansAsyncThunk,
  getAvailablePlansAsyncThunk,
  getPlanTransfersAsyncThunk,
} from "@/redux/pagesSlices/planSlice";
// import {
//   fetchPlanTransfersAsyncThunk,
//   transferPlanAsyncThunk,
// } from "@/redux/pagesSlices/planTransferSlice"; // ← create this slice
import { RootState, AppDispatch } from "@/redux/store";
import { format, formatters } from "date-fns";
import { Building2, ChevronsUpDown, Printer, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  User,
  CalendarIcon,
  DollarSign,
  ArrowRight,
  Eye,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Pagination from "@/components/shared/Pagination";
import Loading from "@/components/shared/loaders/Loading";
import { backendBasePath } from "@/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import ReceiptViewModal from "@/components/shared/modal/ReceiptViewModal";
import { PERMISSIONS } from "@/permissions/permissions";
import { usePermissions } from "@/permissions/usePermissions";
import { formatDateToShortString, formatTimeTo12Hour } from "@/utils/helper";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { getBanksAsyncThunk } from "@/redux/pagesSlices/financeSlice";

import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import CustomCheckbox from "@shared/CustomCheckbox";
interface Member {
  id: number;
  name: string;
  // last_name: string;
  reference_num: string;
  profile_image?: string;
  member_profile?: {
    current_plan_id?: number;
    current_plan_expire_date?: string;
  };
}

interface Plan {
  id: number;
  name: string;
  fee: number;
}

interface TransferSummary {
  current_plan_name: string;
  new_plan_name: string;
  user_id: string;
  current_plan_id: number;
  new_plan_id: number;
  new_plan_start_date: string;
  new_plan_total_days: number;
  new_plan_total_fee: number;
  new_plan_remaining_fee: number;
  deposit_method: string;
  total_fee_received: number;
  current_plan_used_days: number;
  current_plan_received_fee: number;
}

export default function PlanTransfer() {
  const dispatch = useDispatch<AppDispatch>();
  const { members } = useSelector((state: RootState) => state.people);
  const { availablePlans: plans } = useSelector(
    (state: RootState) => state.plan
  );
  const { planTransfer: transfers, loadings } = useSelector(
    (state: RootState) => state.plan
  );
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedNewPlanId, setSelectedNewPlanId] = useState("");
  const [depositMethod, setDepositMethod] = useState("cash");
  const [searchMember, setSearchMember] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [summary, setSummary] = useState<TransferSummary | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [openMemberPopover, setOpenMemberPopover] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  // console.log("transfers", transfers);
  const membersList = members?.data?.data || members?.data || [];
  const plansList = plans?.data || [];
  // console.log("plansList", plansList, plans);
  const totalRecords = transfers?.meta.total || 0;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [popoverWidth, setPopoverWidth] = useState<number | undefined>(
    undefined
  );
  const [openReceiptModal, setOpenReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const { selectedBranchId } = useSelector((state: any) => state.general);
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [voucherDate, setVoucherDate] = useState(
    new Date().toISOString().split("T")[0] || ""
  );

  const [useManualRefNum, setUseManualRefNum] = useState(false);
  const [manualReferenceNum, setManualReferenceNum] = useState("");
  const [manualMember, setManualMember] = useState<Member | null>(null);
  // const [selectedNormalMember, setSelectedNormalMember] = useState<Member | null>(null);
  // const [selectedManualMember, setSelectedManualMember] = useState<Member | null>(null);

  // const effectiveSelectedMember = selectedManualMember || selectedNormalMember;

  const { user } = useSelector((state: any) => state.auth);

  useEffect(() => {
    // if (hasPermission(PERMISSIONS.BANK_VIEW)) { // optional: add permission check
    dispatch(
      getBanksAsyncThunk({
        disable_page_param: 1,
        filter_branch_id: user?.logged_branch?.id,
      })
    )
      .unwrap()
      .then((response: any) => {
        setBanks(response?.data || []); // adjust according to your API response structure
      })
      .catch((err) => {
        console.error("Failed to load banks:", err);
        toast({
          title: "Error",
          description: err.response.data.errors || "Failed to load bank list",
          variant: "destructive",
        });
      });
    // }
  }, [dispatch, user?.logged_branch?.id]);
  useEffect(() => {
    if (triggerRef.current) {
      setPopoverWidth(triggerRef.current.offsetWidth);
    }
  }, [triggerRef, selectedMember]); // Recalculate when member changes
  // Fetch members & plans
  useEffect(() => {
    dispatch(
      getAllMembersAsyncThunk({
        disable_page_param: 1,
        search: searchMember,
        filter_status: "active",
      })
    );
    // dispatch(getAllPlansAsyncThunk({ disable_page_param: 1 }));
  }, [dispatch, searchMember]);
  useEffect(() => {
    const availablePlans = async () => {
      setShowSummary(false);
      setSummary(null);
      await dispatch(
        getAvailablePlansAsyncThunk({
          params: {
            current_plan_id: selectedMember?.member_profile?.current_plan_id || manualMember?.member_profile?.current_plan_id,
          },
        })
      );
    };
    // console.log("selectedMember", selectedMember);
    if (selectedMember || manualMember) availablePlans();
  }, [selectedMember, manualMember]);
  // const { user } = useSelector((state: any) => state.auth);

  // Fetch transfers list
  useEffect(() => {
    let start_date = dateRange?.from
      ? format(dateRange.from, "yyyy-MM-dd")
      : undefined;

    let end_date = dateRange?.to
      ? format(dateRange.to, "yyyy-MM-dd")
      : start_date;
    dispatch(
      getPlanTransfersAsyncThunk({
        params: {
          page: currentPage,
          limit: recordsPerPage,
          search: searchTerm,
          filter_branch_id: filterBranchId,
          ...(start_date && { start_date: start_date }),
          ...(end_date && { end_date: end_date }),
        },
      })
    );
  }, [
    dispatch,
    currentPage,
    recordsPerPage,
    searchTerm,
    filterBranchId,
    dateRange,
  ]);

  // Auto select member on search
  useEffect(() => {
    if (membersList.length === 1 && searchMember) {
      setSelectedMember(membersList[0]);
    }
  }, [membersList, searchMember]);

  const selectedNewPlan = plansList.find(
    (p) => p.id === Number(selectedNewPlanId)
  );

  const handleViewDetails = async () => {
    const member = manualMember || selectedMember;

    if (!member || !selectedNewPlanId) {
      toast({
        title: "Error",
        description: "Select member and new plan",
        variant: "destructive",
      });
      return;
    }

    const data = new FormData();
    data.append("user_id", member.id.toString());
    data.append("new_plan_id", selectedNewPlanId);
    data.append("deposit_method", depositMethod);

    const voucherDateForm = voucherDate || new Date().toISOString().split("T")[0];
    data.append("generate_date", voucherDateForm);
    data.append("transfer_status", "view");

    if (depositMethod === "bank") {
      if (!selectedBankId) {
        toast({
          title: "Required",
          description: "Please select a bank account for bank transfer",
          variant: "destructive",
        });
        return;
      }
      data.append("bank_id", selectedBankId);
    }

    try {
      const res = await dispatch(createPlanTransfersAsyncThunk({ data })).unwrap();
      setSummary(res);
      setShowSummary(true);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.errors || "Failed to fetch details",
        variant: "destructive",
      });
    }
  };

  const handleSearchMemberByRef = async () => {
    if (!manualReferenceNum.trim()) {
      toast({
        title: "Required",
        description: "Enter reference number",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("reference_num", manualReferenceNum.trim());

    try {
      const res = await dispatch(
        getAllSearchedMembersAsyncThunk({ data: formData })
      ).unwrap();

      // The member is inside res.data (not res directly)
      const foundMember: Member | null = res?.data || null;
      console.log("foundMember", foundMember);

      if (foundMember) {
        setManualMember(foundMember);
        toast({
          title: "Member found",
          description: `${foundMember.name} (${foundMember.reference_num})`,
        });
      } else {
        toast({
          title: "Not found",
          description: "No member with this reference number",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.errors || err?.message || "Failed to search member. Please check the reference number.",
      });
      console.error("Member search error:", err?.errors);
    }
  };

  const handleProceedPayment = async () => {
    const member = manualMember || selectedMember;

    if (!member || !selectedNewPlanId) {
      toast({
        title: "Error",
        description: "Select member and new plan",
        variant: "destructive",
      });
      return;
    }

    const data = new FormData();
    data.append("user_id", member.id.toString());
    data.append("new_plan_id", selectedNewPlanId);
    data.append("deposit_method", depositMethod);
    data.append("transfer_status", "process");

    const voucherDateForm = voucherDate || new Date().toISOString().split("T")[0];
    data.append("generate_date", voucherDateForm);

    if (depositMethod === "bank") {
      if (!selectedBankId) {
        toast({
          title: "Required",
          description: "Please select a bank account for bank transfer",
          variant: "destructive",
        });
        return;
      }
      data.append("bank_id", selectedBankId);
    }

    try {
      await dispatch(createPlanTransfersAsyncThunk({ data })).unwrap();
      toast({ title: "Success", description: "Plan transferred successfully!" });

      setShowSummary(false);
      setSelectedMember(null);
      setManualMember(null);
      setSelectedNewPlanId("");
      setSearchMember("");
      setManualReferenceNum("");

      dispatch(getPlanTransfersAsyncThunk({ page: currentPage }));
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.errors || "Transfer failed",
        variant: "destructive",
      });
    }
  };

  const { hasPermission } = usePermissions();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Plan Transfer</h1>

      {/* Top: Transfer Form */}
      {hasPermission(PERMISSIONS.PLAN_TRANSFER_CREATE) && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Member Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mb-6">
              {!useManualRefNum && (
                <div className="space-y-2">
                  <Label>Search Member</Label>
                  <Popover
                    open={openMemberPopover}
                    onOpenChange={setOpenMemberPopover}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        ref={triggerRef}
                        variant="outline"
                        role="combobox"
                        aria-expanded={openMemberPopover}
                        className="w-full justify-between text-left font-normal h-12"
                      >
                        {selectedMember ? (
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage
                                src={`${backendBasePath}${selectedMember.profile_image}`}
                              />
                              <AvatarFallback>{selectedMember.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{selectedMember.name}</p>
                              <p className="text-xs text-muted-foreground">
                                ID: {selectedMember.reference_num}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Search by name or reference...
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-2">
                          {selectedMember && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-destructive/10 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMember(null);
                                setSearchMember("");
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </div>
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent
                      className="p-0 border-2 shadow-2xl"
                      style={{ width: popoverWidth }}
                      align="start"
                    >
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search member by name or ID..."
                          value={searchMember}
                          onValueChange={setSearchMember}
                          autoFocus
                        />
                        <CommandEmpty>
                          {searchMember ? "No member found." : "Start typing..."}
                        </CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {membersList.map((m: Member) =>
                            hasPermission(PERMISSIONS.MEMBER_VIEW) ? (
                              <CommandItem
                                key={m.id}
                                onSelect={() => {
                                  setSelectedMember(m);
                                  setSearchMember("");
                                  setOpenMemberPopover(false);
                                }}
                                className="cursor-pointer hover:bg-accent"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={`${backendBasePath}${m.profile_image}`} />
                                    <AvatarFallback>{m.name?.[0]}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{m.name}</p>
                                    <p className="text-xs text-muted-foreground">{m.reference_num}</p>
                                  </div>
                                </div>
                              </CommandItem>
                            ) : (
                              <p className="text-center py-8 text-muted-foreground">
                                Not authorized to view members
                              </p>
                            )
                          )}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Checkbox */}
              <div className="flex items-center space-x-2">
                <CustomCheckbox
                  id="from-other-branch"
                  checked={useManualRefNum}
                  onChange={(checked) => {
                    setUseManualRefNum(!!checked);
                    if (!checked) {
                      setManualReferenceNum("");
                      setManualMember(null);
                    } else {
                      setOpenMemberPopover(false);
                    }
                  }}
                  label="Member belongs to another branch (search by reference number)"
                />
              </div>

              {useManualRefNum && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="manual-ref">Member Reference Number</Label>
                    <div className="flex gap-3">
                      <Input
                        id="manual-ref"
                        placeholder="e.g. MEM-12345 or 10025"
                        value={manualReferenceNum}
                        onChange={(e) => setManualReferenceNum(e.target.value.trim())}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        variant="default"
                        size="default"
                        onClick={handleSearchMemberByRef}
                        disabled={!manualReferenceNum.trim() || loadings.searchMembers}
                      >
                        {loadings.searchMembers ? (
                          <Loading size="sm" className="mr-2" />
                        ) : (
                          "Find Member"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className={showSummary ? "w-full max-w-ful mx-auto" : "grid grid-cols-1 lg:grid-cols-2 gap-8"}>
              <div className="space-y-6">
                {(manualMember || selectedMember) && !showSummary && (
                  <div className="space-y-6">
                    {/* <div>
                      <Label>Voucher date</Label>
                      <Input
                        type="date"
                        value={voucherDate}
                        onChange={(e) => setVoucherDate(e.target.value)}
                      />
                    </div> */}

                    <div>
                      <Label>New Plan</Label>
                      <Select value={selectedNewPlanId} onValueChange={setSelectedNewPlanId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select new plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {hasPermission(PERMISSIONS.PLAN_VIEW) ? (
                            plansList?.length > 0 ? (
                              plansList.map((p: Plan) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  <p className="py-2">
                                    <span className="text-xs bg-muted-foreground/10 py-1 px-2 rounded-lg">
                                      {p.reference_num}
                                    </span>{" "}
                                    {p.name} - {p.system_currency} {p.fee.toLocaleString()}{" "}
                                    <span className="text-xs">({p.duration_days} days)</span>
                                  </p>
                                </SelectItem>
                              ))
                            ) : (
                              <p className="text-sm text-center py-4 text-muted-foreground">
                                No Plans available
                              </p>
                            )
                          ) : (
                            <p className="text-center py-8 text-muted-foreground">
                              Not authorized
                            </p>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Deposit Method</Label>
                      <Select value={depositMethod} onValueChange={setDepositMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>

                      {depositMethod === "bank" && (
                        <div className="mt-4 space-y-2 animate-fade-in">
                          <Label className="flex items-center gap-2">
                            Select Bank <span className="text-red-500">*</span>
                          </Label>
                          {banks.length > 0 ? (
                            <Select value={selectedBankId} onValueChange={setSelectedBankId} required>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Choose bank account" />
                              </SelectTrigger>
                              <SelectContent>
                                {banks.map((bank: any) => (
                                  <SelectItem key={bank.id} value={bank.id.toString()}>
                                    {bank.reference_num}
                                    {bank.name && ` - ${bank.name}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                              No bank accounts found for this branch
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleViewDetails}
                      disabled={!selectedNewPlanId}
                      className="w-full"
                      permission={PERMISSIONS.PLAN_TRANSFER_CREATE}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Transfer Details
                    </Button>
                  </div>
                )}
                {showSummary && summary && (
                  <Card className="border-2 border-chart-3/30 shadow-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-chart-1/10 to-chart-3/10 border-b">
                      <CardTitle className="text-2xl font-bold text-chart-1 flex items-center gap-3">
                        Plan Transfer Summary
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="pt-8 space-y-8">
                      {/* Member & Transfer Info */}
                      {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-muted/50 rounded-xl">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Member ID
                </p>
                <p className="text-lg font-bold text-chart-1">
                  {selectedMember?.reference_num}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Branch
                </p>
                <p className="font-semibold"># {summary.branch_id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Processed By
                </p>
                <p className="font-semibold">Admin {summary.created_by_id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Date & Time
                </p>
                <p className="font-medium">
                  {formatDateToShortString(summary.generate_date)}
                  <br />
                  <span className="text-sm text-muted-foreground">
                    {formatTimeTo12Hour(summary.generate_time)}
                  </span>
                </p>
              </div>
            </div> */}

                      {/* Current vs New Plan */}
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-6 bg-chart-5/5 border border-chart-5/20 rounded-xl">
                          <h3 className="font-bold text-lg mb-5 text-chart-5">
                            Current Plan
                          </h3>
                          <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Name</span>
                              <span className="font-bold">
                                {summary.current_plan_name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Start Date</span>
                              <span>
                                {formatDateToShortString(summary.current_plan_start_date)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Days</span>
                              <span>{summary.current_plan_total_days} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Used Days</span>
                              <span className="font-bold text-chart-5">
                                {summary.current_plan_used_days} days
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Grace Period</span>
                              {summary.current_plan_freeze_allowed_days == null ||
                                summary.current_plan_freeze_allowed_days === 0
                                ? "Unlimited"
                                : `${summary.current_plan_freeze_allowed_days} days`}
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Freeze Requset Credits
                              </span>
                              <span>
                                {" "}
                                {summary.current_plan_freeze_allowed_count == null ||
                                  summary.current_plan_freeze_allowed_count === 0
                                  ? "Unlimited"
                                  : `${summary.current_plan_freeze_allowed_count} days`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Paid Amount</span>
                              <span className="font-medium">
                                {summary?.system_currency}{" "}
                                {summary.current_plan_received_fee.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-chart-3/10 border-2 border-chart-3/40 rounded-xl shadow-sm">
                          <h3 className="font-bold text-lg mb-5 text-chart-3">
                            New Plan
                          </h3>
                          <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Name</span>
                              <span className="font-bold text-chart-3">
                                {summary.new_plan_name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Start Date</span>
                              <span>
                                {formatDateToShortString(summary.new_plan_start_date)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Duration</span>
                              <span>{summary.new_plan_total_days} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Remaining Days
                              </span>
                              <span className="font-bold">
                                {summary.new_plan_remaining_days} days
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Grace Period</span>
                              {summary.new_plan_freeze_allowed_days == null ||
                                summary.new_plan_freeze_allowed_days === 0
                                ? "Unlimited"
                                : `${summary.new_plan_freeze_allowed_days} days`}
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Freeze Requset Credits
                              </span>
                              <span>
                                {" "}
                                {summary.new_plan_freeze_allowed_count == null ||
                                  summary.new_plan_freeze_allowed_count === 0
                                  ? "Unlimited"
                                  : `${summary.new_plan_freeze_allowed_count}`}
                              </span>
                            </div>
                            <div className="flex justify-between text-lg">
                              <span className="text-muted-foreground font-medium">
                                Total Fee
                              </span>
                              <span className="font-bold text-chart-3">
                                {summary?.system_currency}{" "}
                                {summary.new_plan_total_fee.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* BEST GRADIENT PAYMENT BOX – with your theme colors + maximum info */}
                      <div className="bg-gradient-to-r from-chart-1/10 to-chart-3/12 text-muted-foreground p-10 rounded-2xl shadow-2xl text-center">
                        <p className="text-lg opacity-90 mb-3">Payment Summary</p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-6">
                          <div>
                            <p className="text-sm opacity-80">Total Received So Far</p>
                            <p className="text-2xl font-bold">
                              {summary?.system_currency}{" "}
                              {summary.total_fee_received.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm opacity-80">New Plan Total Fee</p>
                            <p className="text-2xl font-semibold">
                              {summary?.system_currency}{" "}
                              {summary.new_plan_total_fee.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm opacity-80">Amount to Collect Now</p>
                            <p className="text-2xl font-semibold tracking-tight text-muted-foreground drop-shadow-lg">
                              {summary?.system_currency}{" "}
                              {summary.new_plan_remaining_fee.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm opacity-80">Payment Method</p>
                            <p className="text-2xl font-semibold uppercase tracking-wider">
                              {summary.deposit_method} </p>
                            {summary.deposit_method === "bank" && (
                              <div className="text-base flex flex-col items-center gap-0.5">
                                <Badge variant={"secondary"}>
                                  {summary?.bank_reference_num}
                                </Badge>
                                <span>{summary?.bank_name}</span>
                              </div>
                            )}

                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4 justify-end pt-6 border-t border-border flex-wrap">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setShowSummary(false)}
                          className="px-8"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="lg"
                          onClick={handleProceedPayment}
                          className="bg-gradient-to-r from-chart-1/10 to-chart-3/12 text-white lg:w-full w-fit lg:font-bold lg:px-12 shadow-xl hover:shadow-2xl transition-all"
                          permission={PERMISSIONS.PLAN_TRANSFER_CREATE}
                        >
                          <DollarSign className="lg:h-6 lg:w-6 lg:mr-2" />
                          Collect {summary?.system_currency}{" "}
                          {summary.new_plan_remaining_fee.toLocaleString()} & Complete
                          Transfer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* RIGHT: Member Details Preview + Skeleton */}
              {!showSummary && (
                <div className="lg:sticky lg:top-6 h-fit space-y-6">
                  {loadings.searchMembers ? (
                    // Skeleton during manual search
                    <div className="rounded-lg border bg-card p-6 shadow-sm animate-pulse">
                      <div className="flex flex-col items-center justify-center mb-6">
                        <div className="h-36 w-36 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="mt-4 h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="mt-2 h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                      <div className="space-y-4">
                        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[...Array(7)].map((_, i) => (
                            <div key={i} className="flex justify-between">
                              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (manualMember || selectedMember) ? (
                    // Member card
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                      <div className="flex flex-col items-center justify-center mb-6">
                        <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-background shadow-xl">
                          <AvatarImage
                            src={
                              (manualMember || selectedMember)?.profile_image
                                ? `${backendBasePath}${(manualMember || selectedMember)?.profile_image}`
                                : undefined
                            }
                          />
                          <AvatarFallback className="text-4xl">
                            {(manualMember || selectedMember)?.name?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="mt-4 text-center">
                          <h2 className="text-2xl md:text-3xl font-bold">
                            {(manualMember || selectedMember)?.name}
                          </h2>
                          <p className="text-lg text-muted-foreground mt-2">
                            ID: {(manualMember || selectedMember)?.reference_num || "—"}
                          </p>
                        </div>
                      </div>

                      <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xl">Membership Detail</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground min-w-[100px]">Status:</span>
                              <Badge
                                className={
                                  (manualMember || selectedMember)?.status === "active"
                                    ? "bg-chart-3/10 text-chart-3 border-chart-3/20 ml-2"
                                    : (manualMember || selectedMember)?.status === "frozen"
                                      ? "bg-chart-2/10 text-chart-2 border-chart-2/20 ml-2"
                                      : (manualMember || selectedMember)?.status === "expired"
                                        ? "bg-chart-1/10 text-chart-4 border-chart-1/20 ml-2"
                                        : "bg-chart-4/10 text-chart-4 border-chart-1/20 ml-2"
                                }
                              >
                                {(manualMember || selectedMember)?.status?.toUpperCase() || "UNKNOWN"}
                              </Badge>

                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Branch:</span>
                              <div className="flex gap-2 items-center ml-2">
                                <p className="text-xs bg-muted-foreground/10 py-1 px-2 rounded-md">
                                  {(manualMember || selectedMember)?.branch?.reference_num || "—"}
                                </p>
                                <p className="font-medium">
                                  {(manualMember || selectedMember)?.branch?.name || "—"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground min-w-[100px]">Plan:</span>
                              <div className="flex gap-2 ml-2">
                                <p className="text-xs bg-muted-foreground/10 py-1 px-2 rounded-md">
                                  {(manualMember || selectedMember)?.member_profile?.plan?.reference_num || "—"}
                                </p>
                                <p className="font-medium">
                                  {(manualMember || selectedMember)?.member_profile?.plan?.name || "—"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Start:</span>
                              <span className="font-medium ml-2">
                                {(manualMember || selectedMember)?.member_profile?.current_plan_start_date
                                  ? formatDateToShortString(
                                    (manualMember || selectedMember)?.member_profile.current_plan_start_date
                                  )
                                  : "—"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground min-w-[100px]">Expiry:</span>
                              <span className="font-medium ml-2">
                                {(manualMember || selectedMember)?.member_profile?.current_plan_expire_date
                                  ? formatDateToShortString(
                                    (manualMember || selectedMember)?.member_profile.current_plan_expire_date
                                  )
                                  : "—"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground min-w-[100px]">Remaining:</span>
                              <span className="font-medium ml-2">
                                {(manualMember || selectedMember)?.member_profile?.remaining_days_balance ?? "—"} days
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground min-w-[100px]">Duration:</span>
                              <span className="font-medium ml-2">
                                {(manualMember || selectedMember)?.member_profile?.plan?.duration_days ?? "—"} days
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="rounded-lg border bg-muted/40 p-10 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[400px]">
                      <User className="h-12 w-12 opacity-50 mb-4" />
                      <p className="font-medium text-lg">No member selected</p>
                      <p className="text-sm mt-2">
                        Use the search on the left or reference number
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </CardContent>
        </Card>
      )}

      {/* FINAL TRANSFER SUMMARY – MAX DATA + BEST GRADIENT BOX + YOUR THEME COLORS */}


      {/* Transfer History Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap">
            <CardTitle>Plan Transfer History</CardTitle>
            <div className="relative  flex gap-3 flex-wrap">
              <HeaderBranchFilter onBranchChange={setFilterBranchId} />
              <div className="relative">
                <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transfers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 "
                />
              </div>
              {/* Date Range */}
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
        </CardHeader>
        <CardContent>
          {loadings.fetch ? (
            <div className="py-16 text-center">
              <Loading />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Plan Tranfer ID</TableHead>
                    <TableHead>From Plan</TableHead>
                    <TableHead>To Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers?.data?.length > 0 ? (
                    transfers?.data?.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={
                                  t.member?.profile_image
                                    ? `${backendBasePath}${t.member?.profile_image}`
                                    : undefined
                                }
                              />
                              <AvatarFallback>
                                {t?.member?.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            {t?.member ? (
                              <div>
                                <p className="font-medium">{t?.member?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {t?.member?.reference_num}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-sm">
                                Deleted Member
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="font-semibold">
                          {t.reference_num}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0">
                            <span>{t?.previous_plan?.name}</span>
                            <Badge variant="secondary" className="w-fit">
                              {t?.previous_plan?.reference_num || "-"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0">
                            <span className="font-medium">
                              {t?.transfered_plan?.name}
                            </span>
                            <Badge variant="secondary" className="w-fit">
                              {t?.transfered_plan?.reference_num || "-"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {t?.system_currency}{" "}
                          {t.new_plan_remaining_fee.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{t.deposit_method}</Badge>
                        </TableCell>
                        <TableCell>
                          {formatDateToShortString(t.generate_date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              permission={PERMISSIONS.PLAN_TRANSFER_VIEW}
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigate(`/plan-transfer/${t.id}`);
                                //   setSelectedTransfer(t);
                                //   setOpenModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              size="sm"
                              // className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setSelectedReceipt(t);
                                setOpenReceiptModal(true);
                              }}
                              permission={PERMISSIONS.PLAN_TRANSFER_EXPORT}
                            >
                              View Receipt
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-10 text-muted-foreground"
                      >
                        No plans transfer found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <Pagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalRecords={totalRecords}
                recordsPerPage={recordsPerPage}
                recordsPerPageOptions={[10, 20, 50]}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ULTIMATE TRANSFER DETAILS MODAL – MAXIMUM DATA DISPLAY */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold text-chart-1 flex items-center gap-3">
              Plan Transfer Details
              <Badge className="bg-chart-3 text-white">
                Ref: {selectedTransfer?.reference_num}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedTransfer && (
            <div className="pt-6 space-y-8">
              {/* Member Card */}
              <div className="bg-gradient-to-r from-chart-1/10 to-chart-3/10 p-6 rounded-xl border border-chart-3/20">
                <h3 className="text-lg font-bold text-chart-1 mb-4">
                  Member Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-chart-3">
                      <AvatarImage
                        src={`${backendBasePath}${selectedTransfer.member.profile_image}`}
                      />
                      <AvatarFallback className="bg-chart-1 text-white text-xl">
                        {selectedTransfer.member.first_name[0]}
                        {selectedTransfer.member.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-lg">
                        {selectedTransfer.member.first_name}{" "}
                        {selectedTransfer.member.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ID: {selectedTransfer.member.reference_num}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Email
                    </p>
                    <p className="font-medium">
                      {selectedTransfer.member.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Phone
                    </p>
                    <p className="font-medium">
                      {selectedTransfer.member.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transfer Overview */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* From → To Plan */}
                <div className="space-y-6">
                  <div className="p-5 bg-chart-5/5 border border-chart-5/30 rounded-xl">
                    <h4 className="font-bold text-chart-5 mb-3">
                      Previous Plan
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-semibold">
                          {selectedTransfer.current_plan_name || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Start Date
                        </span>
                        <span>
                          {format(
                            new Date(selectedTransfer.current_plan_start_date),
                            "dd MMM yyyy"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Total Days
                        </span>
                        <span>
                          {selectedTransfer.current_plan_total_days} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Used Days</span>
                        <span className="font-bold text-chart-5">
                          {selectedTransfer.current_plan_used_days} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Amount Paid
                        </span>
                        <span>
                          PKR{" "}
                          {selectedTransfer.current_plan_received_fee.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-chart-3/10 border-2 border-chart-3/40 rounded-xl">
                    <h4 className="font-bold text-chart-3 mb-3">New Plan</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-bold text-chart-3">
                          {selectedTransfer.transfered_plan?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fee</span>
                        <span className="font-bold">
                          PKR{" "}
                          {selectedTransfer.transfered_plan?.fee.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span>{selectedTransfer.new_plan_total_days} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Start Date
                        </span>
                        <span>
                          {format(
                            new Date(selectedTransfer.new_plan_start_date),
                            "dd MMM yyyy"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-muted-foreground font-medium">
                          Total Fee
                        </span>
                        <span className="font-bold text-chart-3">
                          PKR{" "}
                          {selectedTransfer.new_plan_total_fee.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment & Transfer Details */}
                <div className="bg-gradient-to-br from-chart-1/10 to-chart-3/12 text-muted-foreground p-8 rounded-2xl shadow-xl">
                  <h4 className="text-xl font-bold mb-6 text-center">
                    Transfer & Payment Summary
                  </h4>
                  <div className="space-y-5 text-lg">
                    <div className="flex justify-between">
                      <span className="opacity-90">
                        Total Received (All Time)
                      </span>
                      <span className="font-bold">
                        PKR{" "}
                        {selectedTransfer.total_fee_received.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-90">Remaining Amount Paid</span>
                      <span className="text-xl font-semibold">
                        PKR{" "}
                        {selectedTransfer.new_plan_remaining_fee.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-90">Payment Method</span>
                      <span className="font-bold uppercase">
                        {selectedTransfer.deposit_method}
                      </span>
                    </div>
                    <div className="flex justify-between pt-4 border-t border-white/20">
                      <span className="opacity-90">Transferred On</span>
                      <span className="font-medium">
                        {format(
                          new Date(selectedTransfer.generate_date),
                          "dd MMM yyyy"
                        )}
                        <br />
                        <span className="text-sm opacity-80">
                          {selectedTransfer.generate_time}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin & System Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-5 bg-muted/50 rounded-xl border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Transferred By
                  </p>
                  <p className="font-bold">
                    {selectedTransfer.created_by_user.first_name}{" "}
                    {selectedTransfer.created_by_user.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ID: {selectedTransfer.created_by_user.reference_num}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Branch
                  </p>
                  <p className="font-semibold">
                    # {selectedTransfer.branch_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Transfer ID
                  </p>
                  <p className="font-mono font-bold text-chart-3">
                    {selectedTransfer.id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Fee Collection ID
                  </p>
                  <p className="font-mono text-sm">
                    {selectedTransfer?.fee_collection?.reference_num || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Plan Transfer Receipt Modal */}
      <ReceiptViewModal
        receipt={selectedReceipt}
        open={openReceiptModal}
        onClose={() => {
          setOpenReceiptModal(false);
          setSelectedReceipt(null);
        }}
        type="transfer"
      />
    </div>
  );
}
