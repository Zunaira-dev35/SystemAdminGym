import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteFeeCollectionAsyncThunk,
  fetchFeeCollectionsAsyncThunk,
  fetchRefundCollectionsAsyncThunk,
  getFeeIdAsyncThunk,
  storeFeeCollectionAsyncThunk,
  storeRefundCollectionAsyncThunk,
  updateFeeCollectionAsyncThunk,
} from "@/redux/pagesSlices/feeCollectionSlice";
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
  // Calendar,
  DollarSign,
  Receipt,
  Clock,
  X,
  Building2,
  FileText,
  Users,
  CalendarDays,
  Delete,
  Trash2,
  FilterIcon,
  Edit2,
  Edit,
  Upload,
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
} from "@/components/ui/dialog";
import { Printer, Download } from "lucide-react";
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
import { PERMISSIONS } from "@/permissions/permissions";
import { usePermissions } from "@/permissions/usePermissions";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";
import { CSVLink } from "react-csv";
import CustomCheckbox from "@shared/CustomCheckbox";
import { has } from "lodash";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { formatDateToShortString } from "@/utils/helper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import ReceiptRefundModal from "@/components/shared/modal/ReceiptRefundModal";
import { cn } from "@/lib/utils"; // if you have cn utility
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { getBanksAsyncThunk } from "@/redux/pagesSlices/financeSlice";
import DeleteConfirmationModal from "@/components/shared/modal/DeleteConfirmationModal";
import { exportToPDF } from "@/utils/exportToPdf";
import AdvanceFeeCollection from "./AdvanceFeeCollection";

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

export default function FeeCollection() {
  const dispatch = useDispatch<AppDispatch>();
  const { hasPermission } = usePermissions();

  const {
    list: collections,
    loadings: feeLoading,
    pagination,
    feeID,
  } = useSelector((state: RootState) => state.feeCollection);

  const { members, loadings: memberLoading } = useSelector(
    (state: RootState) => state.people,
  );
  const { branchesList } = useSelector((state: any) => state.plan);
  const { selectedBranchId } = useSelector((state: any) => state.general);
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined,
  );
  const { user } = useSelector((state: any) => state.auth);

  const { plans } = useSelector((state: RootState) => state.plan);
  const [openReceipt, setOpenReceipt] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [openDelete, setOpenDelete] = useState<any>(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0] || "",
  );
  const [voucherDate, setVoucherDate] = useState(
    new Date().toISOString().split("T")[0] || "",
  );
  const [depositMethod, setDepositMethod] = useState("cash");
  const [searchMember, setSearchMember] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState("");
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const membersList = members?.data?.data || members?.data || [];
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectAll, setSelectAll] = useState(false);
  const [feeDateRange, setFeeDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [feeStatDateRange, setFeeStatDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const [filter, setFilter] = useState<string>("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedFeeToEdit, setSelectedFeeToEdit] = useState<any>(null);
  const [editVoucherDate, setEditVoucherDate] = useState("");
  const [editPlanStartDate, setEditPlanStartDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  //_____Refund states_____________
  const [activeTab, setActiveTab] = useState<"fee" | "refund" | "advance">(
    () => {
      const canViewHistory =
        hasPermission(PERMISSIONS.FEE_COLLECTION_VIEW) ||
        hasPermission(PERMISSIONS.FEE_COLLECTION_CREATE);
      const canViewRefund = hasPermission(PERMISSIONS.FEE_REFUND_VIEW);

      if (canViewHistory) return "fee";
      if (canViewRefund) return "refund";
      return "fee"; // fallback
    },
  );
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState<number | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundMethod, setRefundMethod] = useState<"cash" | "bank">("cash");
  const [refundNotes, setRefundNotes] = useState("");
  const [refundSearchTerm, setRefundSearchTerm] = useState("");
  const [refundStartDate, setRefundStartDate] = useState("");
  const [refundEndDate, setRefundEndDate] = useState("");
  const [refundCurrentPage, setRefundCurrentPage] = useState(1);
  const [refundRecordsPerPage, setRefundRecordsPerPage] = useState(10);
  const [openRefundReceipt, setOpenRefundReceipt] = useState(false);
  const [selectedRefundReceipt, setSelectedRefundReceipt] = useState<any>(null);
  const [isRefundSubmitting, setIsRefundSubmitting] = useState(false);
  const [refundDateRange, setRefundDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [selectedRefundBankId, setSelectedRefundBankId] = useState<string>("");
  function convertCurrencySymbol(symbol: string): string {
    if (!symbol) return "";
    if (symbol === "\u20a8") {
      return "Rs";
    }
    return symbol;
  }
  const { refund, refundSummary, loadings } = useSelector(
    (state: RootState) => state.feeCollection, // update your slice accordingly
  );
  // console.log("refund", refund);
  // const membersList = members?.data || [];
  const plansList = plans || [];
  // const plansList = plans?.data?.data || [];
  // const collections = feeCollections| [];
  const totalRecords = collections?.fee_collections?.total || 0;
  // console.log("membersList",plans, pagination, membersList, memberLoading.getMembers);
  // console.log("plansList",plansList);
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
  useEffect(() => {
    // dispatch(getAllMembersAsyncThunk({ disable_page_param: 1 }));
    if (hasPermission(PERMISSIONS.PLAN_VIEW))
      dispatch(
        getAllPlansAsyncThunk({
          params: {
            disable_page_param: 1,
            filter_branch_id: user?.logged_branch?.id,
          },
        }),
      );
    // dispatch(fetchFeeCollectionsAsyncThunk({ params: { page: currentPage } }));
  }, [dispatch, currentPage]);
  // const { user } = useSelector((state: any) => state.auth);

  const fetchFeeCollections = async () => {
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
      await dispatch(
        fetchFeeCollectionsAsyncThunk({
          search: searchTerm,
          limit: recordsPerPage,
          page: currentPage,
          filter_branch_id: filterBranchId,
          // start_date: feeDateRange?.from
          //   ? format(feeDateRange.from, "yyyy-MM-dd")
          //   : undefined,
          // end_date: feeDateRange?.to
          //   ? format(feeDateRange.to, "yyyy-MM-dd")
          //   : undefined,
          // collection_start_date: feeStatDateRange?.from
          //   ? format(feeStatDateRange.from, "yyyy-MM-dd")
          //   : undefined,
          // collection_end_date: feeStatDateRange?.to
          //   ? format(feeStatDateRange.to, "yyyy-MM-dd")
          //   : undefined,

          ...(start_date && { start_date: start_date }),
          ...(end_date && { end_date: end_date }),
          ...(collection_start_date && {
            collection_start_date: collection_start_date,
          }),
          ...(collection_end_date && {
            collection_end_date: collection_end_date,
          }),
          filter_is_refund: filter === "all" ? "" : filter,
        }),
      ).unwrap();
    } catch (error: any) {
      toast({
        variant: "destructive",
        description: error?.response?.data?.errors || "Failed to fetch",
      });
    }
  };
  useEffect(() => {
    hasPermission(PERMISSIONS.FEE_COLLECTION_VIEW) && fetchFeeCollections();
  }, [
    dispatch,
    searchTerm,
    recordsPerPage,
    currentPage,
    filterBranchId,
    feeDateRange,
    feeStatDateRange,
    filter,
  ]);
  useEffect(() => {
    dispatch(getFeeIdAsyncThunk({})).unwrap();
  }, [selectedPlanId]);
  const fetchMembers = async () => {
    try {
      await dispatch(
        getAllMembersAsyncThunk({
          search: searchMember,
          disable_page_param: 1,
        }),
      ).unwrap();
    } catch (error) {
      setErrorMsg(error?.response?.data?.errors);
      // console.error("Error fetching attendance:", error);
    }
  };
  useEffect(() => {
    if (hasPermission(PERMISSIONS.MEMBER_VIEW)) fetchMembers();
  }, [dispatch, searchMember]);

  // const filteredMembers = membersList.filter(
  //   (m: Member) =>
  //     `${m.first_name} ${m.last_name}`
  //       .toLowerCase()
  //       .includes(searchMember.toLowerCase()) ||
  //     m.reference_num.toLowerCase().includes(searchMember.toLowerCase())
  // );

  // const selectedPlan = plansList?.find(
  //   (p: Plan) => p.id === Number(selectedPlanId)
  // );
  useEffect(() => {
    if (plansList.length > 0) {
      setSelectedPlan(
        plansList?.find((p: Plan) => p.id === Number(selectedPlanId)),
      );
    }
  }, [selectedPlanId, plansList]);
  const handleProceed = async () => {
    if (!selectedMember || !selectedPlanId) {
      setErrors("Please select member and plan");
      return;
    }

    setErrors("");

    const data = new FormData();
    data.append("user_id", selectedMember.id.toString());
    data.append("plan_id", selectedPlanId);
    // const planStartDate =
    //   user?.type === "default"
    //     ? selectedDate
    //     : new Date().toISOString().split("T")[0];
    const planStartDate = selectedDate
      ? selectedDate
      : new Date().toISOString().split("T")[0];
    const voucherDateForm = voucherDate
      ? voucherDate
      : new Date().toISOString().split("T")[0];

    data.append("plan_start_date", planStartDate);
    data.append("generate_date", voucherDateForm);
    // data.append("plan_start_date", selectedDate);
    data.append("deposit_method", depositMethod);
    if (depositMethod === "bank") {
      if (!selectedBankId) {
        setErrors("Please select a bank account for bank transfer");
        // toast({
        //   title: "Required",
        //   description: "Please select a bank account for bank transfer",
        //   variant: "destructive",
        // });
        return;
      }
      data.append("bank_id", selectedBankId);

      // payload.bank_id = selectedBankId;
    }
    try {
      await dispatch(storeFeeCollectionAsyncThunk(data)).unwrap();
      toast({
        title: "Fee collected successfully!",
        description: `${selectedMember.name} is now ACTIVE`,
      });
      setSelectedMember(null);
      setSelectedPlanId("");
      setSearchMember("");
      setSelectedDate("");
      dispatch(fetchFeeCollectionsAsyncThunk({ page: currentPage }));
      fetchMembers();
    } catch (err: any) {
      const msg =
        err?.response?.data?.errors ||
        err?.errors ||
        err?.message ||
        "Failed to collect fee";
      setErrors(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (selectedFeeToEdit && editModalOpen) {
      // setEditVoucherDate(
      //   selectedFeeToEdit.generate_date
      //     ? new Date(selectedFeeToEdit.generate_date)
      //       .toISOString()
      //       .split("T")[0]
      //     : "",
      // );
      setEditPlanStartDate(
        selectedFeeToEdit.plan_start_date
          ? new Date(selectedFeeToEdit.plan_start_date)
            .toISOString()
            .split("T")[0]
          : "",
      );
      // setEditNotes(selectedFeeToEdit.notes || "");
    }
  }, [selectedFeeToEdit, editModalOpen]);
  const handleUpdateFee = async () => {
    if (!selectedFeeToEdit) return;

    setIsUpdating(true);

    try {
      const payload = {
        fee_collection_id: selectedFeeToEdit.id,
        // generate_date: editVoucherDate,
        plan_start_date: editPlanStartDate,
        // notes: editNotes?.trim() || undefined, // if you want to add notes
      };

      // You'll need to create this thunk
      await dispatch(updateFeeCollectionAsyncThunk(payload)).unwrap();

      toast({
        title: "Success",
        description: "Fee collection updated successfully",
      });

      // Close & refresh
      setEditModalOpen(false);
      setSelectedFeeToEdit(null);
      fetchFeeCollections(); // or just current page
    } catch (err: any) {
      toast({
        variant: "destructive",
        description:
          err?.response?.data?.errors?.join(", ") ||
          "Failed to update fee collection",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const exportPDF = useCallback(() => {
    const selectedData =
      collections?.fee_collections?.data?.filter((c) =>
        selectedIds.has(c.id),
      ) || [];

    if (selectedData.length === 0) {
      toast({ title: "No fee collections selected", variant: "destructive" });
      return;
    }

    // Get selected branch info
    const selectedBranch = filterBranchId
      ? branchesList?.find((b: any) => b.id === Number(filterBranchId))
      : null;

    // Get currency (from first selected record or fallback)
    const rawCurrency = selectedData[0]?.member?.system_currency || "PKR";
    const currency = convertCurrencySymbol(rawCurrency);

    // Calculate total amount once (for footer)
    const totalAmount = selectedData.reduce((sum: number, c: any) => {
      return sum + Number(c.amount || 0);
    }, 0);

    exportToPDF({
      title: "Fee Collection Report",
      // subtitle: `${selectedData.length} record${selectedData.length !== 1 ? "s" : ""} selected`,
      filenamePrefix: "Fee_Collection",

      dateRange:
        feeDateRange?.from && feeDateRange?.to
          ? { from: feeDateRange.from, to: feeDateRange.to }
          : undefined,

      // Branch in header
      branchInfo: selectedBranch
        ? {
          name: selectedBranch.name || "All Branches",
          address: selectedBranch.address || "",
          reference_num: selectedBranch.reference_num,
        }
        : null,

      columns: [
        { title: "Member", dataKey: "member", align: "left", width: 35 },
        {
          title: "Collection ID",
          dataKey: "collection",
          align: "left",
          width: 35,
        },
        { title: "Plan", dataKey: "plan", align: "center", width: 45 },
        { title: "Amount", dataKey: "amount", align: "center", width: 35 },
        { title: "Method", dataKey: "method", align: "center", width: 35 },
        { title: "Date", dataKey: "date", align: "center", width: 40 },
        {
          title: "Collected By",
          dataKey: "collectedBy",
          align: "center",
          width: 50,
        },
      ],

      data: selectedData,

      getRowData: (c: any) => ({
        member: c.member?.name || "—",
        collection: c.reference_num || "_",
        plan: c.plan?.name
          ? `${c.plan.name} ${c.plan.reference_num ? `(${c.plan.reference_num})` : ""
          }`
          : "—",
        amount: `${currency} ${c.amount.toLocaleString()}`,
        method: c.deposit_method || "—",
        date: format(new Date(c.generate_date), "dd MMM yyyy"),
        collectedBy: c.created_by_user?.name || "—",
      }),

      footerCallback: (doc: jsPDF, finalY: number) => {
        const leftMargin = 14;

        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(34, 197, 94);

        doc.text(
          `Total Selected: ${currency} ${totalAmount.toLocaleString()}`,
          leftMargin,
          finalY + 10,
        );
      },
    });
  }, [
    collections?.fee_collections?.data,
    selectedIds,
    feeDateRange,
    filterBranchId,
    branchesList,
    convertCurrencySymbol,
  ]);

  const fetchRefundCollections = async () => {
    try {
      let startDate = refundDateRange?.from
        ? format(refundDateRange.from, "yyyy-MM-dd")
        : undefined;

      let endDate = refundDateRange?.to
        ? format(refundDateRange.to, "yyyy-MM-dd")
        : startDate;
      await dispatch(
        fetchRefundCollectionsAsyncThunk({
          search: refundSearchTerm,
          // start_date: refundStartDate || undefined,
          // end_date: refundEndDate || undefined,
          page: refundCurrentPage,
          per_page: refundRecordsPerPage,
          branch_id: filterBranchId,
          ...(startDate && { start_date: startDate }),
          ...(endDate && { end_date: endDate }),
          // start_date: refundDateRange?.from
          //   ? format(refundDateRange.from, "yyyy-MM-dd")
          //   : undefined,
          // end_date: refundDateRange?.to
          //   ? format(refundDateRange.to, "yyyy-MM-dd")
          //   : undefined,
        }),
      ).unwrap();
    } catch (error) {
      console.error("Error fetching Refund:", error);
      toast({
        variant: "destructive",
        description: error?.response?.data?.errors || "Failed to fetch refunds",
      });
    }
  };
  useEffect(() => {
    hasPermission(PERMISSIONS.FEE_REFUND_VIEW) && fetchRefundCollections();
  }, [
    activeTab,
    refundSearchTerm,
    refundStartDate,
    refundEndDate,
    refundCurrentPage,
    refundRecordsPerPage,
    filterBranchId,
    refundDateRange,
    dispatch,
  ]);
  const handleOpenRefundModal = (feeId: number, amount: number) => {
    setSelectedFeeId(feeId);
    setRefundAmount(amount); // prefill with full amount (can be edited)
    setRefundNotes("");
    setRefundModalOpen(true);
  };

  const handleSubmitRefund = async () => {
    if (!selectedFeeId || refundAmount <= 0) {
      toast({ variant: "destructive", description: "Invalid amount or fee" });
      return;
    }

    setIsRefundSubmitting(true);

    try {
      if (refundMethod === "bank") {
        if (!selectedRefundBankId) {
          toast({
            title: "Required",
            description: "Please select a bank account for bank transfer",
            variant: "destructive",
          });
          return;
        }
        // data.append("bank_id", selectedRefundBankId);
      }
      await dispatch(
        storeRefundCollectionAsyncThunk({
          fee_collection_id: selectedFeeId,
          refund_amount: refundAmount,
          refund_method: refundMethod,
          notes: refundNotes.trim(),
          bank_id: refundMethod === "bank" ? selectedRefundBankId : "",
        }),
      ).unwrap();

      toast({ description: "Transfer/Refund request submitted successfully" });
      setRefundModalOpen(false);
      setSelectedRefundBankId("");
      setRefundMethod("");
      // Optional: refresh list
      hasPermission(PERMISSIONS.FEE_REFUND_VIEW) && fetchRefundCollections();
    } catch (err: any) {
      // console.log("err",err)
      toast({
        variant: "destructive",
        description:
          err?.response?.data?.errors ||
          err?.errors ||
          err?.message ||
          "Failed to submit transfer",
      });
    } finally {
      setIsRefundSubmitting(false);
    }
  };
  const confirmDelete = async () => {
    if (!selectedReceipt) return;

    try {
      // setActionLoading(recordToDelete);
      await dispatch(
        deleteFeeCollectionAsyncThunk({
          fee_collection_id: selectedReceipt.id,
        }),
      ).unwrap();
      toast({
        title: "Success",
        description: "Fee Collection deleted successfully",
      });
      fetchFeeCollections();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err?.response?.data?.errors || "Failed to delete Fee Collection",
        variant: "destructive",
      });
    } finally {
      setOpenDelete(false);
      setSelectedReceipt(null);
    }
  };
  return (
    <div className="p-6 space-y-6">
      <CardHeader className="p-0">
        <div className="flex justify-between items-center flex-wrap gap-4">
          {hasPermission(PERMISSIONS.FEE_COLLECTION_VIEW) && (
            <div className="flex items-center gap-4">
              <CardTitle className="text-2xl font-bold">
                Fee Collection History
              </CardTitle>
            </div>
          )}


        </div>
      </CardHeader>
      {/* Top Stats Cards - Same as your design */}
      {hasPermission(PERMISSIONS.FEE_COLLECTION_VIEW) &&
        user.user_type !== "employee" &&
        user.user_type !== "member" && (
          <Card className="space-y-4 p-4 ">
            {/* Modern Date Range Picker */}
            <div className="flex items-center justify-end gap-2">
              {/* <Button
                        variant="outline"

                        size="icon"
                        onClick={() => {
                          if (feeStatDateRange?.from) {
                            const prev = subMonths(feeStatDateRange.from, 1);
                            setFeeStatDateRange({
                              from: startOfMonth(prev),
                              to: endOfMonth(prev),
                            });
                            setCurrentPage(1);
                          }
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button> */}

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "min-w-[240px] justify-start text-left font-normal bg-background border-input mt-2",
                      !feeStatDateRange && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {feeStatDateRange?.from ? (
                      feeStatDateRange.to ? (
                        <>
                          {format(feeStatDateRange.from, "dd MMM yyyy")} –{" "}
                          {format(feeStatDateRange.to, "dd MMM yyyy")}
                        </>
                      ) : (
                        format(feeStatDateRange.from, "dd MMM yyyy")
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
                    defaultMonth={feeStatDateRange?.from}
                    selected={feeStatDateRange}
                    onSelect={(range: DateRange | undefined) => {
                      setFeeStatDateRange(range);
                      setCurrentPage(1);
                    }}
                    numberOfMonths={1} // ← you can change to 1 or 3
                  />
                </PopoverContent>
              </Popover>

              {/* <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (feeStatDateRange?.from) {
                            const next = addMonths(feeStatDateRange.from, 1);
                            setFeeStatDateRange({
                              from: startOfMonth(next),
                              to: endOfMonth(next),
                            });
                            setCurrentPage(1);
                          }
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button> */}

              {/* Quick clear button */}
              {feeStatDateRange && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setFeeStatDateRange(undefined);
                    setCurrentPage(1);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-background">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Collections
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {collections?.system_currency}{" "}
                    {collections?.total_collections?.toLocaleString() || "0"}
                  </div>
                  {/* <p className="text-xs text-muted-foreground">
              +20% from last month
            </p> */}
                </CardContent>
              </Card>
              <Card className="bg-background">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Cash Collections
                  </CardTitle>
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {collections?.system_currency}{" "}
                    {collections?.total_cash_collections?.toLocaleString() ||
                      "0"}
                  </div>
                  {/* <p className="text-xs text-muted-foreground">2 members</p> */}
                </CardContent>
              </Card>
              <Card className="bg-background">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Bank Collections
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {collections?.system_currency}{" "}
                    {collections?.total_bank_collections?.toLocaleString() ||
                      "0"}
                  </div>
                  {/* <p className="text-xs text-muted-foreground">Due this week</p> */}
                </CardContent>
              </Card>
            </div>
          </Card>
        )}
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v: string) =>
          setActiveTab(v as "fee" | "advance" | "refund")
        }
        className="space-y-6"
      >
        <TabsList className="grid w-fit grid-cols-3 gap-4">
          {hasPermission(PERMISSIONS.FEE_COLLECTION_VIEW) && (
            <TabsTrigger
              aria-disabled="no permission"
              disabled={!hasPermission(PERMISSIONS.FEE_COLLECTION_VIEW)}
              value="fee"
            >
              Fee Collections
            </TabsTrigger>
          )}
          {hasPermission(PERMISSIONS.FEE_COLLECTION_VIEW) && ( // ← Assume new permission
            <TabsTrigger value="advance">Advance Fee Collections</TabsTrigger>
          )}
          {hasPermission(PERMISSIONS.FEE_REFUND_VIEW) && (
            <TabsTrigger
              disabled={!hasPermission(PERMISSIONS.FEE_REFUND_VIEW)}
              value="refund"
            >
              Refunds
            </TabsTrigger>
          )}
        </TabsList>
        {/* Main Section: Member Selection + Payment */}
        {hasPermission(PERMISSIONS.FEE_COLLECTION_CREATE) && (
          <TabsContent value="fee">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Member Search & Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Collect Fee</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Search Member */}
                  <div className="">
                    <Label>Search Member</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or ID..."
                        value={searchMember}
                        onChange={(e) => setSearchMember(e.target.value)}
                        className="pl-10"
                        autoFocus={!!selectedMember} // nice UX when changing member
                        disabled={
                          !hasPermission(PERMISSIONS.FEE_COLLECTION_CREATE)
                        }
                      />
                    </div>

                    {/* Full List when NO member selected */}
                    {!selectedMember && (
                      <div className="border rounded-lg max-h-96 overflow-y-auto bg-background">
                        {memberLoading.getMembers ? (
                          <div className="text-center">
                            <Loading />
                          </div>
                        ) : (() => {
                          const inactiveMembersList = membersList?.filter((m: Member) => m.status !== 'active' && m.member_profile?.current_plan_start_date == null) || [];

                          return inactiveMembersList.length === 0 ? (
                            <p className="text-center py-8 text-muted-foreground">
                              {errorMsg || "No members found"}
                            </p>
                          ) : (
                            inactiveMembersList.map((m: Member) =>
                              hasPermission(PERMISSIONS.MEMBER_VIEW) ? (
                                <button
                                  key={m.id}
                                  onClick={() => {
                                    hasPermission(PERMISSIONS.FEE_COLLECTION_CREATE) && setSelectedMember(m);
                                    setSearchMember("");
                                    setErrors("");
                                  }}
                                  disabled={!hasPermission(PERMISSIONS.FEE_COLLECTION_CREATE)}
                                  className="w-full text-left p-4 hover:bg-muted transition flex items-center gap-3 border-b last:border-0 disabled:cursor-not-allowed"
                                >
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage
                                      src={m.profile_image ? `${backendBasePath}${m.profile_image}` : undefined}
                                    />
                                    <AvatarFallback>{m.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{m.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      ID: {m.reference_num}
                                    </p>
                                  </div>
                                </button>
                              ) : (
                                <p key="no-permission" className="text-center py-8 text-muted-foreground">
                                  Not authorized to view members
                                </p>
                              )
                            )
                          );
                        })()
                        }
                      </div>
                    )}

                    {/* Selected Member + Overlay Dropdown when typing */}
                    {selectedMember && (
                      <div className="space-y-4">
                        {/* Overlay Dropdown when user types to change member */}
                        <div className="border rounded-lg max-h-96 overflow-y-auto bg-background">
                          {searchMember &&
                            membersList.map((m: Member) => (
                              <button
                                key={m.id}
                                onClick={() => {
                                  setSelectedMember(m);
                                  setSearchMember("");
                                  setErrors("");
                                }}
                                disabled={
                                  !hasPermission(
                                    PERMISSIONS.FEE_COLLECTION_CREATE,
                                  )
                                }
                                className="w-full text-left p-4 hover:bg-muted transition flex items-center gap-3 border-b last:border-0 disabled:cursor-not-allowed"
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                    src={
                                      m.profile_image
                                        ? `${backendBasePath}${m.profile_image}`
                                        : undefined
                                    }
                                  />
                                  <AvatarFallback>{m.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{m.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    ID: {m.reference_num} • {m.email}
                                  </p>
                                </div>
                              </button>
                            ))}
                        </div>
                        {/* Selected Member Card */}
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={
                                selectedMember.profile_image
                                  ? `${backendBasePath}${selectedMember.profile_image}`
                                  : undefined
                              }
                            />
                            <AvatarFallback>
                              {selectedMember.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">
                              {selectedMember.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ID: {selectedMember.reference_num}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Status: {selectedMember.status}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedMember(null);
                              setSelectedPlanId("");
                              setSearchMember("");
                              setErrors("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedMember && (
                    <div className="">
                      <Label>Voucher date</Label>
                      <Input
                        type="date"
                        placeholder="Enter voucher date "
                        value={voucherDate}
                        readOnly
                        className="cursor-not-allowed"
                      // onChange={(e) => {
                      //   setVoucherDate(e.target.value);
                      //   // setErrors((prev) => ({ ...prev, name: undefined }));
                      // }}
                      />
                    </div>
                  )}
                  {/* Plan & Payment (only when member selected) */}
                  {selectedMember && !searchMember && (
                    <>
                      <div className="">
                        <Label>Select Plan</Label>
                        <Select
                          value={selectedPlanId}
                          onValueChange={setSelectedPlanId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose membership plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {plansList.length > 0 ? (
                              plansList.map((p: Plan) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  <p className="py-2">
                                    {" "}
                                    <span className="text-xs bg-muted-foreground/10 py-1 px-2 rounded-lg">
                                      {p.reference_num}
                                    </span>{" "}
                                    {p.name} - {p?.system_currency}{" "}
                                    {p.fee.toLocaleString()} ({p.duration_days}{" "}
                                    days)
                                  </p>
                                </SelectItem>
                              ))
                            ) : (
                              <p className="text-center text-muted-foreground py-4">
                                No plans found
                              </p>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* {user.type === "default" && ( */}
                      <div className="">
                        <Label>Plan start date</Label>
                        <Input
                          type="date"
                          placeholder="Enter plan date"
                          value={selectedDate}
                          onChange={(e) => {
                            setSelectedDate(e.target.value);
                            // setErrors((prev) => ({ ...prev, name: undefined }));
                          }}
                        />
                      </div>
                      {/* )} */}

                      <div className="">
                        <Label>Deposit Method</Label>
                        <Select
                          value={depositMethod}
                          onValueChange={setDepositMethod}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank">Bank transfer</SelectItem>
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
                                    <SelectItem
                                      key={bank.id}
                                      value={bank.id.toString()}
                                    >
                                      {bank.reference_num}
                                      {/* {bank.name &&
                                    ` (${bank.name})`} */}
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

                      {errors && (
                        <div className="p-4 bg-chart-5/10 text-chart-5 border-chart-5/20 rounded-lg">
                          <p className="text-sm ">{errors}</p>
                        </div>
                      )}

                      <Button
                        permission={PERMISSIONS.FEE_COLLECTION_CREATE}
                        onClick={handleProceed}
                        className="w-full"
                        size="lg"
                        disabled={feeLoading.store}
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        Proceed to Collect Fee
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Right: Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedMember && selectedPlanId
                      ? "Payment Summary"
                      : selectedMember
                        ? "Member Details"
                        : "Select Member & Plan"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="min-h-[420px] flex flex-col">
                  {selectedMember && !selectedPlan && (
                    <div className="space-y-8 py-4">
                      <div className="flex flex-col items-center justify-center">
                        <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-background shadow-xl">
                          <AvatarImage
                            src={
                              selectedMember.profile_image
                                ? `${backendBasePath}${selectedMember.profile_image}`
                                : undefined
                            }
                          />
                          <AvatarFallback className="text-4xl md:text-5xl">
                            {(selectedMember.first_name?.[0] || selectedMember.name?.[0] || "?").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="mt-4 text-center">
                          <h2 className="text-2xl md:text-3xl font-bold">
                            {selectedMember.first_name} {selectedMember.last_name}
                            {selectedMember.name && !selectedMember.first_name && selectedMember.name}
                          </h2>
                          <p className="text-lg text-muted-foreground mt-2">
                            ID: {selectedMember.reference_num || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-6 relative">
                        <Card className="flex-1 p-4 shadow-sm hover:shadow-md transition-shadow">
                          <h2 className="text-xl font-semibold text-left mb-3">
                            Membership Detail
                          </h2>

                          <div className="mt-3 grid grid-cols-1 w-full gap-2 text-sm">
                            <div className="">
                              <div className="flex justify-between space-y-1">
                                <span className="text-muted-foreground">Status:</span>{" "}
                                <Badge
                                  className={cn(
                                    selectedMember.status === "active"
                                      ? "bg-chart-3/10 text-chart-3 border-chart-3/20"
                                      : selectedMember.status === "frozen"
                                        ? "bg-chart-2/10 text-chart-2 border-chart-2/20"
                                        : selectedMember.status === "expired"
                                          ? "bg-chart-1/10 text-chart-5 border-chart-1/20"
                                          : "bg-chart-4/10 text-chart-4 border-chart-1/20",
                                    "mt-1"
                                  )}
                                >
                                  {selectedMember.status?.toUpperCase() || "UNKNOWN"}
                                </Badge>

                              </div>
                            </div>

                            <div className="flex gap-1 items-center justify-between">
                              <span className="text-muted-foreground">Branch:</span>{" "}
                              <div className="flex gap-1 w-fit items-center">
                                <p className="text-xs w-fit bg-muted-foreground/10 py-1 px-2 rounded-md">
                                  {selectedMember.branch?.reference_num || "—"}
                                </p>{" "}
                                <p className="font-medium">
                                  {selectedMember.branch?.name || "—"}
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-between gap-1">
                              <span className="text-muted-foreground">Plan:</span>{" "}
                              <div className="flex gap-1 w-fit">
                                <p className="text-xs w-fit bg-muted-foreground/10 py-1 px-2 rounded-md">
                                  {selectedMember.member_profile?.plan?.reference_num || "—"}
                                </p>{" "}
                                <p className="font-medium">
                                  {selectedMember.member_profile?.plan?.name || "—"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Start date:</span>{" "}
                              <span className="font-medium ml-2">
                                {selectedMember.member_profile?.current_plan_start_date
                                  ? formatDateToShortString(
                                    selectedMember.member_profile.current_plan_start_date
                                  )
                                  : "—"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Expiry date:</span>{" "}
                              <span className="font-medium ml-2">
                                {selectedMember.member_profile?.current_plan_expire_date
                                  ? formatDateToShortString(
                                    selectedMember.member_profile.current_plan_expire_date
                                  )
                                  : "—"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Remaining days:</span>{" "}
                              <span className="font-medium">
                                {selectedMember.member_profile?.remaining_days_balance ?? "—"} days
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Duration:</span>{" "}
                              <span className="font-medium ml-2">
                                {selectedMember.member_profile?.plan?.duration_days ?? "—"} days
                              </span>
                            </div>
                          </div>
                        </Card>
                      </div>

                      <p className="text-center text-sm text-muted-foreground pt-4 italic">
                        Select a plan to view payment summary and collect fee
                      </p>
                    </div>
                  )}
                  {selectedMember && selectedPlan && (
                    <div className="space-y-6">

                      <div className="text-center py-8">
                        <div className="bg-green-100/40 text-green-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <DollarSign className="h-10 w-10" />
                        </div>
                        <h3 className="text-3xl font-bold">
                          {selectedPlan?.system_currency || "Rs."}{" "}
                          {Number(selectedPlan.fee).toLocaleString()}
                        </h3>
                        <p className="text-muted-foreground mt-1 text-lg">
                          Fee to be collected
                        </p>
                      </div>

                      <div className="space-y-4 text-sm divide-y">

                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Reference number</span>
                          <span className="font-medium">{feeID || "—"}</span>
                        </div>

                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Plan</span>
                          <div className="text-right">
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              {selectedPlan.reference_num}
                            </span>{" "}
                            <span className="font-medium">{selectedPlan.name}</span>
                          </div>
                        </div>

                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-medium">
                            {selectedPlan.duration_days} days
                          </span>
                        </div>

                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Start Date</span>
                          <span className="font-medium">
                            {selectedDate
                              ? format(new Date(selectedDate), "dd MMM yyyy")
                              : format(new Date(), "dd MMM yyyy")}
                          </span>
                        </div>

                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Status After Payment</span>
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            ACTIVE
                          </Badge>
                        </div>

                      </div>

                      <div className="pt-5 text-center text-sm text-muted-foreground border-t">
                        Member will be activated after successful payment
                      </div>

                    </div>
                  )}
                  {!selectedMember && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
                      <User className="h-16 w-16 mb-4 opacity-40" />
                      <p className="text-lg font-medium">Select a member to begin</p>
                      <p className="text-sm mt-2 max-w-xs text-center">
                        Search for a member on the left to view their details or proceed to fee collection
                      </p>
                    </div>
                  )}

                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
        {/* Tabs */}
        {/* <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger
            aria-disabled="no permission"
            disabled={!hasPermission(PERMISSIONS.FEE_COLLECTION_VIEW)}
            value="history"
          >
            Fee Collection History
          </TabsTrigger>
          <TabsTrigger
            disabled={!hasPermission(PERMISSIONS.FEE_REFUND_VIEW)}
            value="refund"
          >
            Fee Refund
          </TabsTrigger>
        </TabsList> */}

        {/* Fee Collection History Tab (your existing table) */}
        <TabsContent value="fee">
          {/* Bottom: Fee Collection History */}
          {hasPermission(PERMISSIONS.FEE_COLLECTION_VIEW) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-end gap-3">
                  {/* CSV Button */}
                  {hasPermission(PERMISSIONS.FEE_COLLECTION_EXPORT) && (
                    <div className="flex items-center gap-2">
                      {/* PDF - Only selected */}
                      {(hasPermission(PERMISSIONS.FEE_COLLECTION_EXPORT) ||
                        hasPermission(PERMISSIONS.FEE_REFUND_EXPORT)) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={exportPDF}
                            className={`mr-2 ${selectedIds.size === 0 ? "cursor-not-allowed" : ""
                              }`}
                            disabled={selectedIds.size === 0}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                        )}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center flex-wrap">
                  <CardTitle>Fee Collection History</CardTitle>
                  <div className="relative  flex gap-3 flex-wrap">
                    <HeaderBranchFilter onBranchChange={setFilterBranchId} />
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
                          <SelectItem value={"0"}>
                            <div className="flex gap-2">Non-Refunded</div>
                          </SelectItem>
                          <SelectItem value={"1"}>
                            <div className="flex gap-2">Refunded</div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search Fee History..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>{" "}
                    {/* Modern Date Range Picker */}
                    <div className="flex items-center gap-2">
                      {/* <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (feeDateRange?.from) {
                            const prev = subMonths(feeDateRange.from, 1);
                            setFeeDateRange({
                              from: startOfMonth(prev),
                              to: endOfMonth(prev),
                            });
                            setCurrentPage(1);
                          }
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button> */}

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
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={feeDateRange?.from}
                            selected={feeDateRange}
                            onSelect={(range: DateRange | undefined) => {
                              setFeeDateRange(range);
                              setCurrentPage(1);
                            }}
                            numberOfMonths={1} // ← you can change to 1 or 3
                          />
                        </PopoverContent>
                      </Popover>

                      {/* <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (feeDateRange?.from) {
                            const next = addMonths(feeDateRange.from, 1);
                            setFeeDateRange({
                              from: startOfMonth(next),
                              to: endOfMonth(next),
                            });
                            setCurrentPage(1);
                          }
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button> */}

                      {/* Quick clear button */}
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
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {feeLoading.fetch ? (
                  <div className="py-10 text-center">
                    <Loading />
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <CustomCheckbox
                              checked={selectAll}
                              onChange={(checked) => {
                                setSelectAll(checked);
                                if (checked) {
                                  setSelectedIds(
                                    new Set(
                                      collections?.fee_collections?.data.map(
                                        (c) => c.id,
                                      ),
                                    ),
                                  );
                                } else {
                                  setSelectedIds(new Set());
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Member</TableHead>
                          <TableHead>Collection ID</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>
                            Amount ({collections.system_currency})
                          </TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Collected By</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {collections?.fee_collections?.data?.length > 0 ? (
                          collections?.fee_collections?.data?.map((c: any) => (
                            <TableRow key={c.id}>
                              <TableCell>
                                <CustomCheckbox
                                  checked={selectedIds.has(c.id)}
                                  onChange={(checked) => {
                                    const newIds = new Set(selectedIds);
                                    if (checked) {
                                      newIds.add(c.id);
                                    } else {
                                      newIds.delete(c.id);
                                    }
                                    setSelectedIds(newIds);
                                    setSelectAll(
                                      newIds.size ===
                                      collections?.fee_collections?.data
                                        .length &&
                                      collections?.fee_collections?.data
                                        .length > 0,
                                    );
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage
                                      src={
                                        c?.member?.profile_image
                                          ? `${backendBasePath}${c?.member.profile_image}`
                                          : undefined
                                      }
                                    />
                                    <AvatarFallback>
                                      {c?.member?.name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  {!c?.member?.reference_num &&
                                    !c?.member?.name ? (
                                    <span className="text-muted-foreground italic text-sm">
                                      {" "}
                                      Deleted Member
                                    </span>
                                  ) : (
                                    <div>
                                      <p className="font-medium">
                                        {c?.member?.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        ID: {c?.member?.reference_num}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{c.reference_num}</TableCell>
                              <TableCell>
                                <div>
                                  {c.plan.name}
                                  <p className="text-xs w-fit bg-muted-foreground/10 py-0.5 px-1.5 rounded-lg">
                                    {c?.plan?.reference_num}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold">
                                {c.amount.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {c.deposit_method}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {formatDateToShortString(c.generate_date)}
                              </TableCell>
                              <TableCell>
                                {" "}
                                <p className="font-medium">
                                  {c.created_by_user.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {c?.created_by_user.reference_num}
                                </p>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    permission={PERMISSIONS.FEE_COLLECTION_VIEW}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedReceipt(c);
                                      setOpenReceipt(true);
                                    }}
                                  >
                                    View Receipt
                                  </Button>
                                  {!c?.is_refund &&
                                    hasPermission(
                                      PERMISSIONS.FEE_COLLECTION_EDIT,
                                    ) && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        // className="text-amber-600 hover:text-amber-700"
                                        onClick={() => {
                                          setSelectedFeeToEdit(c);
                                          setEditModalOpen(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    )}
                                  {!c?.is_refund &&
                                    hasPermission(
                                      PERMISSIONS.FEE_COLLECTION_DELETE,
                                    ) && (
                                      <Button
                                        permission={
                                          PERMISSIONS.FEE_COLLECTION_DELETE
                                        }
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedReceipt(c);
                                          setOpenDelete(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}

                                  {!c?.is_refund &&
                                    (!c?.is_advance ||
                                      c?.advance_payment?.status ===
                                      "applied") && (
                                      <Button
                                        permission={
                                          PERMISSIONS.FEE_REFUND_CREATE
                                        }
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleOpenRefundModal(c.id, c.amount)
                                        }
                                      >
                                        Refund
                                      </Button>
                                    )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableCell
                            colSpan={8}
                            className="text-center py-10 text-muted-foreground"
                          >
                            No data found
                          </TableCell>
                        )}
                      </TableBody>
                    </Table>
                    <Pagination
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                      totalRecords={totalRecords}
                      recordsPerPage={recordsPerPage}
                      setRecordsPerPage={setRecordsPerPage}
                      className="bg-theme-white"
                      recordsPerPageOptions={[5, 10, 20, 50]}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        {/* Advance Fee Collection Tab */}
        <TabsContent value="advance">
          <AdvanceFeeCollection />
        </TabsContent>
        {/* Transfer Membership Tab */}
        <TabsContent value="refund">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Fee Refund History</CardTitle>
              <CardDescription>
                View all processed refunds and transfers
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card className="bg-background">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Refunds
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {refundSummary?.total_refunds || "0.00"}{" "}
                      {refundSummary?.system_currency || ""}
                    </div>
                    {/* <p className="text-xs text-muted-foreground mt-1">
                      All time
                    </p> */}
                  </CardContent>
                </Card>

                <Card className="bg-background">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Today Refunds
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {refundSummary?.today_refunds || "0.00"}{" "}
                      {refundSummary?.system_currency || ""}
                    </div>
                    {/* <p className="text-xs text-muted-foreground mt-1">Today</p> */}
                  </CardContent>
                </Card>

                <Card className="bg-background">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Refunds
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {refundSummary?.total_refund_count || 0}
                    </div>
                    {/* <p className="text-xs text-muted-foreground mt-1">
                      Refund records
                    </p> */}
                  </CardContent>
                </Card>

                <Card className="bg-background">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Today Refunds
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {refundSummary?.today_refund_count || 0}
                    </div>
                    {/* <p className="text-xs text-muted-foreground mt-1">Today</p> */}
                  </CardContent>
                </Card>
              </div>

              {/* Filters: Search + Date Range */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-end">
                <HeaderBranchFilter onBranchChange={setFilterBranchId} />
                <div className="">
                  <div className="relative">
                    <Search className="absolute left-3 top-[60%] transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by ref, member name, notes..."
                      value={refundSearchTerm}
                      onChange={(e) => {
                        setRefundSearchTerm(e.target.value);
                        setRefundCurrentPage(1);
                      }}
                      className="pl-9"
                    />
                  </div>
                </div>
                {/* Modern Date Range Picker */}
                <div className="flex items-center gap-2">
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
                        {refundDateRange?.from ? (
                          refundDateRange.to ? (
                            <>
                              {format(refundDateRange.from, "dd MMM yyyy")} –{" "}
                              {format(refundDateRange.to, "dd MMM yyyy")}
                            </>
                          ) : (
                            format(refundDateRange.from, "dd MMM yyyy")
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
                        defaultMonth={refundDateRange?.from}
                        selected={refundDateRange}
                        onSelect={(range: DateRange | undefined) => {
                          setRefundDateRange(range);
                          setCurrentPage(1);
                        }}
                        numberOfMonths={1} // ← you can change to 1 or 3
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Quick clear button */}
                  {refundDateRange && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setRefundDateRange(undefined);
                        setCurrentPage(1);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Refund Table */}
              {loadings?.fetchRefund ? (
                <div className="py-10 text-center">
                  <Loading />
                </div>
              ) : refund?.data?.length > 0 ? (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Refund ID</TableHead>
                          <TableHead>Original Amount</TableHead>
                          <TableHead>Refund Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Created By</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {refund?.data?.map((refund: any) => (
                          <TableRow key={refund.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={
                                      refund.user?.profile_image
                                        ? `${backendBasePath}${refund.user.profile_image}`
                                        : undefined
                                    }
                                  />
                                  <AvatarFallback>
                                    {refund.user?.name?.[0] || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="">
                                    {refund.user?.name || "N/A"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {refund.user?.reference_num || "Deleted"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="">
                              {refund.reference_num}
                            </TableCell>
                            <TableCell>
                              {" "}
                              {refund?.system_currency || "Rs."}{" "}
                              {refund.original_amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="">
                              {refund?.system_currency || "Rs."}{" "}
                              {refund.refund_amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {refund.refund_method}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDateToShortString(refund.refund_date)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              <div
                                className="max-w-[12rem] turncate"
                                title={refund.notes}
                              >
                                {refund.notes || "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              {refund.created_by?.name || "System"}
                            </TableCell>
                            <TableCell>
                              <Button
                                permission={PERMISSIONS.FEE_REFUND_EXPORT}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRefundReceipt(refund);
                                  setOpenRefundReceipt(true);
                                }}
                              >
                                View Receipt
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Pagination
                    currentPage={refundCurrentPage}
                    setCurrentPage={setRefundCurrentPage}
                    totalRecords={refund.total || 0}
                    recordsPerPage={refundRecordsPerPage}
                    setRecordsPerPage={setRefundRecordsPerPage}
                    className="bg-theme-white mt-4"
                    recordsPerPageOptions={[5, 10, 20, 50]}
                  />
                </>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  No refund records found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* </Tabs> */}
      </Tabs>
      {/* Transfer/Refund Modal */}
      <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Refund Membership / Request Refund</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <Label htmlFor="refundAmount">
                Refund Amount ({collections?.system_currency || "Rs."})
              </Label>
              <Input
                id="refundAmount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                min={0}
              />
            </div>

            <div>
              <Label htmlFor="refundMethod">Refund Method</Label>
              <Select
                value={refundMethod}
                onValueChange={(v: any) => setRefundMethod(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  {/* <SelectItem value="wallet">Wallet</SelectItem> */}
                  <SelectItem value="bank">Bank Refund</SelectItem>
                </SelectContent>
              </Select>
              {refundMethod === "bank" && (
                <div className="space-y-2 mt-4 animate-fade-in">
                  <Label className="flex items-center gap-2">
                    {/* <Building2 className="h-4 w-4" /> */}
                    Select Bank
                    <span className="text-red-500">*</span>
                  </Label>

                  {banks.length > 0 ? (
                    <Select
                      value={selectedRefundBankId}
                      onValueChange={setSelectedRefundBankId}
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

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
                placeholder="Reason for refund/refund..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundModalOpen(false)}
              disabled={isRefundSubmitting}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSubmitRefund}
              disabled={isRefundSubmitting || refundAmount <= 0}
            >
              {isRefundSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  Submitting...
                </div>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Fee Collection</DialogTitle>
            <DialogDescription>
              You can modify voucher date and plan start date
            </DialogDescription>
          </DialogHeader>

          {selectedFeeToEdit && (
            <div className="space-y-6 py-4">
              {/* Member Info - Read only */}
              <div className="space-y-2">
                <Label>Member</Label>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                  <Avatar>
                    <AvatarImage
                      src={
                        selectedFeeToEdit?.member?.profile_image
                          ? `${backendBasePath}${selectedFeeToEdit.member.profile_image}`
                          : undefined
                      }
                    />
                    <AvatarFallback>
                      {selectedFeeToEdit?.member?.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedFeeToEdit?.member?.name || "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ID: {selectedFeeToEdit?.member?.reference_num || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Editable Dates */}
              {/* <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="edit-voucher">Voucher Date</Label>
                  <Input
                    id="edit-voucher"
                    type="date"
                    value={editVoucherDate}
                    readOnly
                    className="cursor-not-allowed"
                    // onChange={(e) => setEditVoucherDate(e.target.value)}
                  />
                </div>
              </div> */}
              <div>
                <Label htmlFor="edit-plan-start">Plan Start Date</Label>
                <Input
                  id="edit-plan-start"
                  type="date"
                  value={editPlanStartDate}
                  onChange={(e) => setEditPlanStartDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditModalOpen(false);
                setSelectedFeeToEdit(null);
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={handleUpdateFee}
              disabled={isUpdating || !editPlanStartDate}
            >
              {isUpdating ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ReceiptViewModal
        receipt={selectedReceipt}
        open={openReceipt}
        onClose={() => setOpenReceipt(false)}
      />
      <ReceiptRefundModal
        receipt={selectedRefundReceipt}
        open={openRefundReceipt}
        onClose={() => setOpenRefundReceipt(false)}
      />
      <DeleteConfirmationModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={confirmDelete}
        title="Delete Fee Collection Record"
        message="Are you sure you want to delete this fee collection record? This action cannot be undone."
      />
    </div>
  );
}
