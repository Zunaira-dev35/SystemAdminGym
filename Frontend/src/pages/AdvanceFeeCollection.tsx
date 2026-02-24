// src/components/AdvanceFeeCollection.tsx
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdvanceFeeCollectionsAsyncThunk,
  storeAdvanceFeeCollectionAsyncThunk,
  payAdvanceFeeCollectionAsyncThunk, // ← NEW: For paying advance fee
  cancelAdvanceFeePaymentAsyncThunk, // ← NEW: For canceling advance fee
} from "@/redux/pagesSlices/feeCollectionSlice"; // Adjust slice path if separate
import { getAllMembersAsyncThunk } from "@/redux/pagesSlices/peopleSlice";
import { getAllPlansAsyncThunk } from "@/redux/pagesSlices/planSlice";
import { RootState, AppDispatch } from "@/redux/store";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DollarSign,
  Receipt,
  Clock,
  X,
  Building2,
  FileText,
  Users,
  CalendarDays,
  Trash2,
  Edit,
  Download,
  CheckCircle, // ← NEW: For pay button
  XCircle,
  CalendarIcon,
  FilterIcon, // ← NEW: For cancel button
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Pagination from "@/components/shared/Pagination";
import Loading from "@/components/shared/loaders/Loading";
import { backendBasePath } from "@/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Printer } from "lucide-react";
import ReceiptViewModal from "@/components/shared/modal/ReceiptViewModal";
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
import { usePermissions } from "@/permissions/usePermissions";
import { PERMISSIONS } from "@/permissions/permissions";
import { formatDateToShortString } from "@/utils/helper";
import DeleteConfirmationModal from "@/components/shared/modal/DeleteConfirmationModal";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { DateRange } from "react-day-pick";
import { Calendar } from "@/components/ui/calendar";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomCheckbox from "@shared/CustomCheckbox";
import { getBanksAsyncThunk } from "@/redux/pagesSlices/financeSlice";
import AdvanceFeePayDialog from "@/components/shared/modal/AdvanceFeePayDialog";
import ReceiptRefundModal from "@/components/shared/modal/ReceiptRefundModal";
import AdvanceFeeCancelDialog from "./AdvanceFeeCancelDialog";
import { exportToPDF } from "@/utils/exportToPdf";

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  reference_num: string;
  profile_image?: string | null;
  status: string;
}

interface Plan {
  id: number;
  name: string;
  fee: number;
  duration_days: number;
}

export default function AdvanceFeeCollection() {
  const dispatch = useDispatch<AppDispatch>();
  const { hasPermission } = usePermissions();

  // Selectors (adjust if needed)
  const {
    advanceCollections: collections, // ← NEW: Use advanceCollections from state
    loadings,
    // : { fetchAdvance, storeAdvance, payAdvance, cancelAdvance },
    advanceFeeID: feeID,
  } = useSelector((state: RootState) => state.feeCollection);
  console.log("collections", collections?.advance_payments);
  const { members } = useSelector((state: RootState) => state.people);
  const { plans } = useSelector((state: RootState) => state.plan);
  const { user } = useSelector((state: any) => state.auth);

  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined,
  );
  const plansList = plans || [];

  const [openReceipt, setOpenReceipt] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0] || "",
  );
  const [depositMethod, setDepositMethod] = useState("cash");
  const [searchMember, setSearchMember] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState("");
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [feeDateRange, setFeeDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [feeStatDateRange, setFeeStatDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const [isAutoRenew, setIsAutoRenew] = useState<boolean>(true);
  const [notes, setNotes] = useState("");
  // ── NEW ── Pay/Cancel States
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedCollectionForPayment, setSelectedCollectionForPayment] =
    useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedCollectionForCancel, setSelectedCollectionForCancel] =
    useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [filter, setFilter] = useState<string>("");
  const advancePayments = collections?.advance_payments?.data || [];
  // Fetch members & plans
  useEffect(() => {
    dispatch(getAllMembersAsyncThunk({ disable_page_param: 1 }));
    if (hasPermission(PERMISSIONS.PLAN_VIEW)) {
      dispatch(
        getAllPlansAsyncThunk({
          params: {
            disable_page_param: 1,
            filter_branch_id: user?.logged_branch?.id,
          },
        }),
      );
    }
  }, [dispatch, user?.logged_branch?.id]);
  useEffect(() => {
    // if (hasPermission(PERMISSIONS.BANK_VIEW)) { // optional: add permission check
    dispatch(
      getBanksAsyncThunk({
        disable_page_param: 1,
        filter_branch_id: user?.logged_branch?.id,
      }),
    )
      .unwrap()
      .then((response: any) => {
        console.log("response?.data", response?.data);
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
  const fetchAdvanceCollections = async () => {
    try {
      let collection_start_date = feeStatDateRange?.from
        ? format(feeStatDateRange.from, "yyyy-MM-dd")
        : undefined;

      let collection_end_date = feeStatDateRange?.to
        ? format(feeStatDateRange.to, "yyyy-MM-dd")
        : collection_start_date;

      let start_date = feeDateRange?.from
        ? format(feeDateRange.from, "yyyy-MM-dd")
        : undefined;

      let end_date = feeDateRange?.to
        ? format(feeDateRange.to, "yyyy-MM-dd")
        : start_date;

      const response = await dispatch(
        fetchAdvanceFeeCollectionsAsyncThunk({
          params: {
            page: currentPage,
            limit: recordsPerPage,
            search: searchTerm,
            start_date,
            end_date,
            collection_start_date,
            collection_end_date,
            filter_branch_id: filterBranchId,
            filter_status: filter
          },
        }),
      ).unwrap();

      setTotalRecords(response.pagination.total || 0);
    } catch (error) {
      console.error("Error fetching advance collections:", error);
    }
  };

  useEffect(() => {
    fetchAdvanceCollections();
  }, [
    dispatch,
    currentPage,
    recordsPerPage,
    searchTerm,
    feeDateRange,
    filterBranchId,
    filter
  ]);

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setSearchMember("");
  };
  const membersList = members?.data?.data || members?.data || [];

  const filteredMembers = membersList.filter((member: Member) =>
    `${member.name}  ${member.reference_num}`
      .toLowerCase()
      .includes(searchMember.toLowerCase()),
  );

  const handleSubmit = async () => {
    if (!selectedMember) {
      setErrorMsg("Please select a member");
      return;
    }
    if (!selectedPlanId) {
      setErrorMsg("Please select a plan");
      return;
    }
    if (!selectedDate) {
      setErrorMsg("Please select a date");
      return;
    }

    const formData = new FormData();
    formData.append("user_id", selectedMember.id.toString());
    formData.append("plan_id", selectedPlanId.id);
    formData.append("amount", selectedPlanId.fee || "0");
    formData.append("deposit_method", depositMethod);
    // formData.append("bank_id", "1");
    formData.append("payment_date", selectedDate);
    formData.append("is_auto_renew", isAutoRenew ? true : false);
    formData.append("notes", notes.trim() || "");
    if (depositMethod === "bank") {
      if (!selectedBankId) {
        setErrors("Please select a bank account for bank transfer");
        return;
      } else formData.append("bank_id", selectedBankId);
    }
    try {
      await dispatch(
        storeAdvanceFeeCollectionAsyncThunk({ data: formData }),
      ).unwrap();
      toast({ title: "Advance fee collected successfully" });
      setSelectedMember(null);
      setSelectedPlanId("");
      setSelectedDate(new Date().toISOString().split("T")[0]);
      setDepositMethod("cash");
      fetchAdvanceCollections();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.errors ||
          error.errors ||
          error.message ||
          "Failed to collect advance fee",
        variant: "destructive",
      });
    }
  };

  const downloadPDF = () => {
         if (advancePayments.length === 0) return;
 
         exportToPDF({
             title: "Advance Fee Collections",
             filenamePrefix: "Advance_Fee_Collections",
 
             branchInfo: filterBranchId
                 ? {
                       name: `Branch ID: ${filterBranchId}`,
                       // address: "...",
                       // reference_num: "..."
                   }
                 : null,
 
             dateRange: feeDateRange
                 ? { from: feeDateRange.from, to: feeDateRange.to }
                 : undefined,
 
             columns: [
                 { title: "Member", dataKey: "member", align: "left", width: 40 },
                 { title: "Collection ID", dataKey: "collectionId", align: "center", width: 38 },
                 { title: "Plan", dataKey: "plan", align: "left", width: 40 },
                 { title: "Amount", dataKey: "amount", align: "left", width: 40 },
                 { title: "Method", dataKey: "method", align: "center", width: 40 },
                 { title: "Date", dataKey: "date", align: "center", width: 35 },
                 { title: "Status", dataKey: "status", align: "center", width: 40 },
             ],
 
             data: advancePayments,
 
             getRowData: (collection: any) => {
                 const member = collection.user || {};
                 const plan = collection.plan || {};
 
                 const status = collection.status || "—";
                 let statusDisplay = status;
                 if (status === "applied") statusDisplay = "Applied";
                 if (status === "pending") statusDisplay = "Pending";
                 if (status === "cancelled") statusDisplay = "Cancelled";
 
                 return {
                     member: `${member.name || "—"} \nID: ${member.reference_num || "—"}`,
                     collectionId: collection.reference_num || "—",
                     plan: `${plan.name || "—"} \n${collection.reference_num || "—"}`,
                     amount: collection.amount
                         ? Number(collection.amount).toLocaleString()
                         : "—",
                     method: collection.deposit_method?.toUpperCase() || "—",
                     date: collection.payment_date
                         ? formatDateToShortString(collection.payment_date)
                         : "—",
                     status: statusDisplay,
                 };
             },
 
             // Optional: add total at the bottom
             footerCallback: (doc, finalY) => {
                 const totalAmount = advancePayments.reduce((sum: number, item: any) => {
                     return sum + (Number(item.amount) || 0);
                 }, 0);
 
                 if (totalAmount > 0) {
                     doc.setFont("helvetica", "bold");
                     doc.setFontSize(11);
                     doc.setTextColor(0, 0, 0);
 
                     doc.text(
                         `Total Advance Collected: ${totalAmount.toLocaleString()} Rs.`,
                         12,
                         finalY + 8
                     );
                 }
             },
         });
     };
  //   const csvData = (collections.data || []).map((collection: any) => ({
  //     ID: collection.id,
  //     Member: collection.user.name,
  //     Plan: collection.plan.name,
  //     Amount: collection.amount,
  //     Method: collection.deposit_method,
  //     Date: formatDateToShortString(collection.deposit_date),
  //     Status: collection.status,
  //     Type: "Advance",
  //   }));

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set<number>());
    } else {
      const allIds = advancePayments.map((item: any) => item.id);
      setSelectedIds(new Set(allIds));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelect = (id: number) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);

    // Optional: update selectAll state to reflect reality
    setSelectAll(newSelectedIds.size === advancePayments.length);
  };
  const handlePrintSelected = () => {
    const selectedCollections = collections.filter((item: any) =>
      selectedIds.has(item.id),
    );
    toast({ title: `${selectedCollections.length} receipts printed` });
  };

  const handleExportSelectedPDF = () => {
    const doc = new jsPDF();
    const selectedData = collections
      .filter((item: any) => selectedIds.has(item.id))
      .map((collection: any) => [
        collection.id,
        collection.user.name,
        collection.plan.name,
        collection.amount,
        collection.deposit_method,
        formatDateToShortString(collection.deposit_date),
        collection.status,
      ]);

    autoTable(doc, {
      head: [["ID", "Member", "Plan", "Amount", "Method", "Date", "Status"]],
      body: selectedData,
    });
    doc.save("selected_advance_fee_collections.pdf");
  };

  // ── NEW ── Pay/Cancel Handlers
  const handlePayCollection = (collection: any) => {
    console.log("first collection", collection);
    setSelectedCollectionForPayment(collection);
    setPayModalOpen(true);
  };

  const handleCancelCollection = (collection: any) => {
    setSelectedCollectionForCancel(collection);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedCollectionForCancel || !cancelReason) return;

    try {
      await dispatch(
        cancelAdvanceFeePaymentAsyncThunk({
          id: selectedCollectionForCancel.id,
          reason: cancelReason,
        }),
      ).unwrap();

      toast({ title: "Collection canceled successfully" });
      setCancelModalOpen(false);
      setSelectedCollectionForCancel(null);
      setCancelReason("");
      fetchAdvanceCollections();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.errors ||
          error.message ||
          "Failed to cancel collection",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap">
        <div>
          <CardTitle>Advance Fee Collection</CardTitle>
          <CardDescription>
            Manage advance payments from members
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {/* Collection Form */}
        {hasPermission(PERMISSIONS.FEE_COLLECTION_CREATE) && (
          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-3 pb-4 border-b">
              <Receipt className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold">Collect Advance Fee</h3>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 grid-cols-1">
              <div className="lg:col-span-2">
                <Label>Search Member</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between px-3 py-2 h-auto bg-background border-input mt-2" // ← better height for custom content
                    >
                      {selectedMember ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={
                                selectedMember.profile_image
                                  ? `${backendBasePath}${selectedMember.profile_image}` // ← fixed typo (basePath → baseUrl?)
                                  : undefined
                              }
                              alt={`${selectedMember.name}`}
                            />
                            <AvatarFallback>
                              {selectedMember.name?.[0]?.toUpperCase() ?? "?"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex flex-col items-start">
                            <span className="font-medium leading-tight">
                              {selectedMember.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ID: {selectedMember.reference_num}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          Select member...
                        </span>
                      )}

                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search member..."
                        value={searchMember}
                        onValueChange={setSearchMember}
                      />
                      <CommandEmpty>No member found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {filteredMembers.map((member: Member) => (
                          <CommandItem
                            key={member.id}
                            onSelect={() => handleMemberSelect(member)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedMember?.id === member.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={
                                  member.profile_image
                                    ? `${backendBasePath}${member.profile_image}`
                                    : undefined
                                }
                              />
                              <AvatarFallback>{member.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">
                                ID: {member.reference_num}
                              </p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Select Plan</Label>

                {plansList.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    No plan found
                  </p>
                ) : (
                  <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>

                    <SelectContent>
                      {plansList.map((plan: Plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <p className="py-2">
                            <span className="text-xs bg-muted-foreground/10 py-1 px-2 rounded-lg">
                              {plan.reference_num}
                            </span>{" "}
                            {plan.name} – {plan.system_currency}{" "}
                            {plan.fee.toLocaleString()} ({plan.duration_days} days)
                          </p>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>


              <div>
                <Label>Voucher Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  // onChange={(e) => setSelectedDate(e.target.value)}
                  readOnly
                  className="cursor-not-allowed"
                />
              </div>

              <div>
                <Label>Deposit Method</Label>
                <Select value={depositMethod} onValueChange={setDepositMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
                {/* Bank selection - only shown when Bank Transfer is selected */}
                {depositMethod === "bank" && (
                  <div className="space-y-2 mt-6 animate-fade-in">
                    <Label className="flex items-center gap-2">
                      {/* <Building2 className="h-4 w-4" /> */}
                      Select Bank
                      <span className="text-red-500">*</span>
                    </Label>

                    {banks.length > 0 ? (
                      <Select
                        value={selectedBankId}
                        onValueChange={setSelectedBankId}
                        required
                      >
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

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes..."
                />
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <CustomCheckbox
                  id="auto-renew"
                  checked={isAutoRenew}
                  onChange={(checked) => setIsAutoRenew(checked)}
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                  label="Auto Renew Plan (will renew automatically on expiry)"
                />
              </div>
            </div>

            {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}

            <Button
              permission={PERMISSIONS.FEE_COLLECTION_CREATE}
              onClick={handleSubmit}
              className="w-full md:w-auto"
            >
              Collect Advance Fee
            </Button>
          </div>
        )}

        {hasPermission(PERMISSIONS.FEE_COLLECTION_VIEW) && (
          <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-6 mb-6 text-muted-foreground">
            <Card className="bg-background">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  {/* <DollarSign className="h-4 w-4 text-primary" /> */}
                  Total Advance Collected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {collections?.summary?.system_currency}{" "}
                  {Number(collections?.summary?.total_amount || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {collections?.summary?.total_count} collections
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {/* <Clock className="h-4 w-4 text-amber-600" /> */}
                  Available Advance Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {collections?.summary?.system_currency}{" "}
                  {Number(collections?.summary?.total_pending || 0).toLocaleString()}
                </div>
                <p className="text-xs mt-1">
                  Ready to be applied on renewal
                </p>
              </CardContent>
            </Card>

            {/* Already Applied */}
            <Card className="bg-background">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {/* <CheckCircle className="h-4 w-4 text-green-600" /> */}
                  Applied Advance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {collections?.summary?.system_currency}{" "}
                  {Number(collections?.summary?.total_applied || 0).toLocaleString()}
                </div>
                <p className="text-xs mt-1">
                  Already used for renewals
                </p>
              </CardContent>
            </Card>

            {/* Cancelled / Refunded */}
            <Card className="bg-background">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {/* <XCircle className="h-4 w-4 text-red-600" /> */}
                  Cancelled Advance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold ">
                  {collections?.summary?.system_currency}{" "}
                  {Number(collections?.summary?.total_cancelled || 0).toLocaleString()}
                </div>
                <p className="text-xs mt-1">
                  Cancelled or refunded
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Filters */}

        <div className="flex flex-wrap sm:flex-row items-start sm:items-center justify-end gap-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <HeaderBranchFilter onBranchChange={setFilterBranchId} />
          </div>
          <div className="w-32">
            <Select
              value={filter}
              onValueChange={(value) => {
                setFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <FilterIcon className="h-4 w-4" />
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">All</span>
                </SelectItem>
                <SelectItem value={"applied"}>
                  <div className="flex gap-2">Applied</div>
                </SelectItem>
                <SelectItem value={"pending"}>
                  <div className="flex gap-2">Pending</div>
                </SelectItem>
                <SelectItem value={"cancelled"}>
                  <div className="flex gap-2">Cancelled</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className=" relative">
            <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by member name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[240px] justify-start text-left font-normal bg-background border-input mt-2",
                    !feeDateRange && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {feeDateRange?.from ? (
                    feeDateRange.to ? (
                      <>
                        {format(feeDateRange.from, "dd MMM yyyy")} –{" "}
                        {format(feeDateRange.to, "dd MMM yyyy")}
                      </>
                    ) : (
                      format(feeDateRange.from, "dd MMM yyyy")
                    )
                  ) : (
                    <span>Filter by date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={feeDateRange?.from}
                  selected={feeDateRange}
                  onSelect={setFeeDateRange}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
            {feeDateRange && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setFeeDateRange(undefined);
                  setCurrentPage(1);
                }}
              >
                Clear
              </Button>
            )}
            {/* <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 h-12 text-lg">
                  <Clock className="h-5 w-5" />
                  {feeStatDateRange
                    ? `${formatDateToShortString(
                        feeStatDateRange.from
                      )} - ${formatDateToShortString(feeStatDateRange.to)}`
                    : "Filter by stats date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={feeStatDateRange?.from}
                  selected={feeStatDateRange}
                  onSelect={setFeeStatDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover> */}
          </div>
          <div className="mt-2"> 
            <Button
              permission={PERMISSIONS.FEE_COLLECTION_EXPORT}
              variant="outline"
              onClick={downloadPDF}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          {hasPermission(PERMISSIONS.FEE_COLLECTION_VIEW) && (
            <Table id="advanceFeeTable">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <CustomCheckbox
                      checked={selectAll}
                      onChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Collection ID</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadings.fetchAdvance ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Loading />
                    </TableCell>
                  </TableRow>
                ) : advancePayments?.length > 0 ? (
                  advancePayments?.map((collection: any) => (
                    <TableRow key={collection.id}>
                      <TableCell>
                        <CustomCheckbox
                          checked={selectedIds.has(collection.id)}
                          onChange={() => toggleSelect(collection.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={`${backendBasePath}${collection.user?.profile_image}`}
                            />
                            <AvatarFallback>
                              {collection.user?.name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{collection.user?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ID: {collection.user?.reference_num}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{collection.reference_num}</TableCell>
                      <TableCell>
                        <div>
                          {collection.plan?.name}
                          <p className="text-xs w-fit bg-muted-foreground/10 py-0.5 px-1.5 rounded-lg">
                            {collection?.reference_num}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-nowrap">
                        {collection.amount.toLocaleString()}{" "}
                        {collection?.system_setting_currency || "Rs."}
                      </TableCell>
                      <TableCell className="capitalize">
                        {collection.deposit_method}
                      </TableCell>
                      <TableCell>
                        <div className="text-nowrap">
                          {formatDateToShortString(collection.payment_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            collection.status === "applied"
                              ? "default"
                              : collection.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                          className={`capitalize ${collection.status === "cancelled" &&
                            " border-chart-5 text-chart-5  bg-chart-5/10 "
                            }`}
                        >
                          {collection.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Receipt Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            permission={PERMISSIONS.FEE_COLLECTION_VIEW}
                            onClick={() => {
                              setSelectedReceipt(collection);
                              setOpenReceipt(true);
                            }}
                          >
                            View Receipt
                          </Button>

                          {/* Pay Button (only if pending/unpaid) */}
                          {collection.status === "pending" &&
                            !collection.is_auto_renew && (
                              // hasPermission(PERMISSIONS.FEE_COLLECTION_PAY) &&
                              <Button
                                variant="ghost"
                                size="sm"
                                className="border-chart-3 p-2 bg-chart-3/10 rounded-xl"
                                onClick={() => handlePayCollection(collection)}
                              >
                                <Check className="h-6 w-6 text-chart-3" />
                              </Button>
                            )}

                          {/* Cancel Button (only if pending/unpaid) */}
                          {collection.status === "pending" && (
                            // hasPermission(PERMISSIONS.FEE_COLLECTION_CANCEL) &&
                            <Button
                              variant="ghost"
                              size="icon"
                              className="border-chart-5 p-2 bg-chart-5/10 rounded-xl"
                              onClick={() => handleCancelCollection(collection)}
                            >
                              <X className="h-6 w-6 text-chart-5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No advance fee collections found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalRecords={totalRecords}
          recordsPerPage={recordsPerPage}
          setRecordsPerPage={setRecordsPerPage}
          className="bg-theme-white"
          recordsPerPageOptions={[5, 10, 20, 50]}
        />
      </CardContent>
      <AdvanceFeePayDialog
        onClose={() => {
          setPayModalOpen(false);
          setSelectedCollectionForPayment(null);
        }}
        open={payModalOpen}
        collection={selectedCollectionForPayment}
        loading={loadings.payAdvance}
      />
      <ReceiptRefundModal
        title="Advance Fee Collection Receipt"
        type="advance"
        receipt={selectedReceipt}
        open={openReceipt}
        onClose={() => setOpenReceipt(false)}
      />
      <AdvanceFeeCancelDialog
        onClose={() => {
          setCancelModalOpen(false);
          setSelectedCollectionForCancel(null);
        }}
        open={cancelModalOpen}
        collection={selectedCollectionForCancel}
        loading={loadings.cancelAdvance}
      />
    </Card>
  );
}
