// src/components/AdvanceFeeCollection.tsx
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import {
    fetchAdvanceFeeCollectionsAsyncThunk,
    storeAdvanceFeeCollectionAsyncThunk,
    payAdvanceFeeCollectionAsyncThunk, // ← NEW: For paying advance fee
    cancelAdvanceFeePaymentAsyncThunk, // ← NEW: For canceling advance fee
} from "@/redux/pagesSlices/feeCollectionSlice"; // Adjust slice path if separate
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
import ReceiptViewModal from "@/components/shared/modal/ReceiptViewModal";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { usePermissions } from "@/permissions/usePermissions";
import { PERMISSIONS } from "@/permissions/permissions";
import { formatDateToShortString } from "@/utils/helper";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { DateRange } from "react-day-pick";
import { Calendar } from "@/components/ui/calendar";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomCheckbox from "@shared/CustomCheckbox";
import ReceiptRefundModal from "@/components/shared/modal/ReceiptRefundModal";
import { exportToPDF } from "@/utils/exportToPdf";


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
    const { id: paramId } = useParams<{ id: string }>(); // ID from URL (Admin view)
    const { user } = useSelector((state: RootState) => state.auth);
    const activeUserId = paramId || user?.id;

    const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
        undefined,
    );
    const plansList = plans || [];

    const [openReceipt, setOpenReceipt] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
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
                        filter_status: filter,
                        filter_user_id: activeUserId,
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
        filter,
        activeUserId,
    ]);


    const downloadPDF = () => {
        if (advancePayments.length === 0) return;

        exportToPDF({
            title: "Advance Fee Collections",
            filenamePrefix: "Advance_Fee_Collections",

            // If you want to show current branch filter (optional)
            // branchInfo: filterBranchId
            //     ? {
            //           // You'll need to get branch name & address from your branches list or state
            //           // For now leaving minimal – improve later if you have branches array
            //           name: `Branch ID: ${filterBranchId}`,
            //           // address: "...",
            //           // reference_num: "..."
            //       }
            //     : null,

            // Using the same date range filter the user selected for the table
            dateRange: feeDateRange
                ? { from: feeDateRange.from, to: feeDateRange.to }
                : undefined,

            columns: [
                { title: "Member", dataKey: "member", align: "left", width: 40 },
                { title: "Collection ID", dataKey: "collectionId", align: "center", width: 38 },
                { title: "Plan", dataKey: "plan", align: "left", width: 40 },
                { title: "Amount", dataKey: "amount", align: "left", width: 38 },
                { title: "Method", dataKey: "method", align: "center", width: 36 },
                { title: "Date", dataKey: "date", align: "center", width: 32 },
                { title: "Status", dataKey: "status", align: "center", width: 32 },
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
                <div className="flex flex-wrap sm:flex-row items-start sm:items-center justify-end gap-4 mb-6">
                    {/* <div className="flex items-center gap-4 flex-wrap">
                        <HeaderBranchFilter onBranchChange={setFilterBranchId} />
                    </div> */}
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
                    </div>
                    <div className="mt-2">
                        <Button
                            permission={PERMISSIONS.FEE_COLLECTION_EXPORT}
                            variant="outline"
                            onClick={downloadPDF}
                            className="gap-2"
                            disabled={advancePayments.length === 0}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Pdf
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
                                            {/* receipt */}
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedReceipt(collection);
                                                        setOpenReceipt(true);
                                                    }}
                                                >
                                                    Receipt
                                                </Button>
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
            <ReceiptRefundModal
                title="Advance Fee Collection Receipt"
                type="advance"
                receipt={selectedReceipt}
                open={openReceipt}
                onClose={() => setOpenReceipt(false)}
            />
        </Card>
    );
}
