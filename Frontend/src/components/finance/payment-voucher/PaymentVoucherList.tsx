// src/pages/finance/PaymentVoucherList.tsx
import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Eye,
  Filter,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Printer,
} from "lucide-react";
import Loading from "@/components/shared/loaders/Loading";
import Pagination from "@/components/shared/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { getPaymentVouchersAsyncThunk } from "@/redux/pagesSlices/financeSlice";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";
import CustomCheckbox from "@shared/CustomCheckbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
} from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/permissions/usePermissions";
import { PERMISSIONS } from "@/permissions/permissions";
import { formatTimeTo12Hour } from "@/utils/helper";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { RootState } from "@/redux/store";

// Props interface
// interface PaymentVoucherListProps {
//   onSelectionChange?: (count: number, data: any[]) => void;
//   triggerPDFExport?: boolean;
// }
interface PaymentVoucherListProps {
  onSelectionChange?: (
    count: number,
    data: any[],
    fetchAllFn?: () => Promise<any[]>,
    dateRange?: { from?: Date; to?: Date },
    filterBranchId
  ) => void;
}

export default function PaymentVoucherList({
  onSelectionChange,
}: // triggerPDFExport,
PaymentVoucherListProps) {
  const dispatch = useDispatch<any>();
  const { paymentVouchers, loadings } = useSelector(
    (state: any) => state.finance
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const voucherList = paymentVouchers?.data || [];
  const meta = paymentVouchers?.meta || {};
  const summary = paymentVouchers?.summary || {
    system_currency: "₨",
    total_income: 0,
    total_expense: 0,
    final_balance: 0,
  };

  const isLoading = loadings.getPaymentVouchers;

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionType, setTransactionType] = useState<
    "all" | "income" | "expense"
  >("all");
  const [source, setSource] = useState<
    "all" | "membership" | "income" | "expense"
  >("all");
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [openReceipt, setOpenReceipt] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Selection state
  // const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  // const [selectAll, setSelectAll] = useState(false);
  const { hasPermission } = usePermissions();

  const getCurrentMonthRange = () => {
    const today = new Date();
    return { from: startOfMonth(today), to: endOfMonth(today) };
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isFullDataMode, setIsFullDataMode] = useState(false);
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined
  );

  const fetchVouchers = useCallback(() => {
  const params: any = {
    page: currentPage,
    limit: recordsPerPage,  
  };

  if (dateRange?.from) {
    const start = format(dateRange.from, "yyyy-MM-dd");
    const end = dateRange.to 
      ? format(dateRange.to, "yyyy-MM-dd") 
      : start; 

    params.start_date = start;
    params.end_date = end;

    if (dateRange.to) {
      setIsFullDataMode(true);
    } else {
      setIsFullDataMode(false);
    }
  } else {
    setIsFullDataMode(false);
  }

  if (searchTerm) params.search = searchTerm;
  if (transactionType !== "all") params.transaction_type = transactionType;
  if (source !== "all") params.source = source;
  if (filterBranchId) params.filter_branch_id = filterBranchId;

  dispatch(getPaymentVouchersAsyncThunk(params));
}, [
  dispatch,
  currentPage,
  recordsPerPage,
  searchTerm,
  transactionType,
  source,
  dateRange,
  filterBranchId,
]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, transactionType, source]);

  // Reset selection when data changes
  // useEffect(() => {
  //   setSelectedIds(new Set());
  //   setSelectAll(false);
  // }, [voucherList]);

  // useEffect(() => {
  //   const selectedData = voucherList
  //     .filter((v: any) => selectedIds.has(v.id))
  //     .map((v: any) => ({
  //       "Voucher #": v.reference_num,
  //       Date: format(new Date(v.date), "dd MMM yyyy"),
  //       Type: v.transaction_type === "income" ? "Income" : "Expense",
  //       Source:
  //         v.source === "membership"
  //           ? "Membership Fee"
  //           : v.source === "income"
  //             ? "Other Income"
  //             : "Expense",
  //       Amount: `${summary.system_currency}${Number(v.amount || 0).toLocaleString()}`,
  //       Method: v.payment_method,
  //       Description: v.description || "—",
  //     }));

  //   onSelectionChange?.(selectedData.length, selectedData);
  // }, [selectedIds, voucherList, onSelectionChange, summary.system_currency]);

  // Remove useCallback — just like IncomeList does
  const fetchAllFilteredVouchers = async () => {
    const params: any = {
      disable_page_param: 1,
    };

    if (dateRange?.from)
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    if (dateRange?.to) params.end_date = format(dateRange.to, "yyyy-MM-dd");
    if (searchTerm) params.search = searchTerm;
    if (transactionType !== "all") params.transaction_type = transactionType;
    if (source !== "all") params.source = source;
    if (filterBranchId) params.filter_branch_id = filterBranchId;

    const result = await dispatch(
      getPaymentVouchersAsyncThunk(params)
    ).unwrap();

    return result.vouchers?.data || [];
  };

  useEffect(() => {
    onSelectionChange?.(0, [], fetchAllFilteredVouchers, dateRange, filterBranchId);
  }, [
    dateRange,
    searchTerm,
    transactionType,
    source,
    filterBranchId,
    onSelectionChange,
  ]);

  const getTypeBadge = (type: string) => {
    return type === "income" ? (
      <Badge className="bg-green-100 text-green-500">Income</Badge>
    ) : (
      <Badge className="bg-blue-100 text-primary">Expense</Badge>
    );
  };

  const getSourceBadge = (src: string) => {
    const map: Record<string, string> = {
      membership: "Membership Fee",
      income: "Other Income",
      expense: "Expense",
    };
    return <Badge variant="secondary">{map[src] || src}</Badge>;
  };

  const openDetails = (voucher: any) => {
    setSelectedVoucher(voucher);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <span className="mr-2">{summary.system_currency}</span>
              <span>{Number(summary.total_income || 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              <span className="mr-2">{summary.system_currency}</span>
              <span>{Number(summary.total_expense || 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Final Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold  text-primary">
              <span className="mr-2">{summary.system_currency}</span>
              <span>{Number(summary.final_balance || 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Vouchers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meta.total || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>Payment Vouchers</CardTitle>

            {/* Filters */}
            <div className="flex flex-wrap  justify-end items-end gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 mt-1 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by PV number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <HeaderBranchFilter onBranchChange={setFilterBranchId} />

              <Select
                value={transactionType}
                onValueChange={setTransactionType}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>

              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="membership">Membership Fee</SelectItem>
                  <SelectItem value="income">Other Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>

              {/* Only show Clear button when ANY filter is applied */}
              {(searchTerm.trim() !== "" ||
                transactionType !== "all" ||
                source !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setTransactionType("all");
                    setSource("all");
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
              <div className=" gap-2">
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[280px] justify-start text-left font-normal bg-background border-input mt-2",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd MMM yyyy")} →{" "}
                            {format(dateRange.to, "dd MMM yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "dd MMM yyyy")
                        )
                      ) : (
                        <span>Pick date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3 border-b ">
                      <div className="flex justify-between mb-3 text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (dateRange?.from) {
                              const newFrom = subMonths(dateRange.from, 1);
                              setDateRange({
                                from: startOfMonth(newFrom),
                                to: endOfMonth(newFrom),
                              });
                            }
                          }}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDateRange(getCurrentMonthRange())}
                        >
                          Current Month
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (dateRange?.from) {
                              const newFrom = addMonths(dateRange.from, 1);
                              setDateRange({
                                from: startOfMonth(newFrom),
                                to: endOfMonth(newFrom),
                              });
                            }
                          }}
                        >
                          Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>

                      <Calendar
                        initialFocus
                        mode="range"
                        selected={dateRange}
                        onSelect={(range: DateRange | undefined) => {
                          if (range?.from && range?.to) {
                            setDateRange({ from: range.from, to: range.to });
                          } else if (range?.from) {
                            setDateRange({ from: range.from, to: undefined });
                          } else {
                            setDateRange(undefined);
                          }
                          setCurrentPage(1);
                        }}
                        numberOfMonths={1}
                      />
                    </div>
                    
                  
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
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-16 text-center">
              <Loading />
            </div>
          ) : voucherList.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No payment vouchers found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* <TableHead className="w-12">
                      <CustomCheckbox
                        checked={selectAll}
                        onChange={(checked) => {
                          setSelectAll(checked);
                          if (checked) {
                            setSelectedIds(new Set(voucherList.map((v: any) => v.id)));
                          } else {
                            setSelectedIds(new Set());
                          }
                        }}
                      />
                    </TableHead> */}
                    <TableHead>Voucher ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voucherList.map((voucher: any) => (
                    <TableRow key={voucher.id}>
                      {/* <TableCell>
                        <CustomCheckbox
                          checked={selectedIds.has(voucher.id)}
                          onChange={(checked) => {
                            const newIds = new Set(selectedIds);
                            if (checked) {
                              newIds.add(voucher.id);
                            } else {
                              newIds.delete(voucher.id);
                            }
                            setSelectedIds(newIds);
                            setSelectAll(
                              newIds.size === voucherList.length && voucherList.length > 0
                            );
                          }}
                        />
                      </TableCell> */}
                      <TableCell className="font-mono font-semibold text-primary">
                        {voucher.reference_num}
                      </TableCell>
                      <TableCell>
                        {format(new Date(voucher.date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {voucher.transaction_type}{" "}
                        </Badge>
                      </TableCell>
                      <TableCell>{getSourceBadge(voucher.source)}</TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          voucher.transaction_type === "income"
                            ? "text-green-600"
                            : "text-primary"
                        }`}
                      >
                        {summary.system_currency}{" "}
                        {Number(voucher.amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="capitalize">
                        {voucher.payment_method}
                      </TableCell>
                      <TableCell className="text-center">
                        {hasPermission(PERMISSIONS.LEDGER_VIEW) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReceipt(voucher);
                              setOpenReceipt(true);
                            }}
                          >
                            View Receipt
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {meta.total > 0 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalRecords={meta.total}
                    recordsPerPage={recordsPerPage}
                    recordsPerPageOptions={[10, 20, 50]}
                    setRecordsPerPage={setRecordsPerPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={openReceipt} onOpenChange={setOpenReceipt}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl max-h-[95vh] flex flex-col">
          {selectedReceipt && (
            <>
              <div className="p-6 border-b bg-background">
                <DialogTitle className="text-xl font-bold">
                  Payment Voucher Receipt
                </DialogTitle>
              </div>

              <div
                id="payment-voucher-receipt-content"
                className="flex-1 overflow-y-auto px-8 pt-6 pb-8 bg-background scrollbar-thin"
              >
                <div className="max-w-2xl mx-auto">
                  <div className="text-center space-y-3 pb-8 border-b header">
                    <h2 className="text-2xl font-bold">{user?.system_company_name}</h2>
                    <p className="text-lg font-medium ">Payment Receipt</p>
                    <Badge
                      className={`bg-secondary text-secondary-foreground font-medium px-3 py-1 ${
                        selectedReceipt.transaction_type === "income"
                          ? "bg-green-100 text-green-500"
                          : "bg-blue-100 text-primary"
                      }`}
                    >
                      # {selectedReceipt.reference_num}
                    </Badge>
                  </div>

                  <div className="mt-8 space-y-8">
                    <div>
                      <p className="font-semibold text-lg mb-4 section-title">
                        Receipt Details
                      </p>
                      <div className="space-y-4">
                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground label">
                            Date
                          </span>
                          <span className="value">
                            {format(
                              new Date(selectedReceipt.date),
                              "dd MMM yyyy"
                            )}
                          </span>
                        </div>
                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground label">
                            Time
                          </span>
                          <span className="value">
                            {formatTimeTo12Hour(
                              selectedReceipt.time || "00:00:00"
                            )}
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="text-muted-foreground">Branch</span>
                          <div>
                            <span className="inline-block badge px-2 py-0.5 text-xs font-medium bg-muted rounded-md border">
                              {selectedReceipt.branch?.reference_num || "—"}
                            </span>{" "}
                            <span className="font-medium">
                              {selectedReceipt.branch?.name || "—"}
                            </span>
                          </div>
                        </div>
                        <p className="font-semibold text-lg mb-4 section-title">
                          Transaction Details
                        </p>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">
                            Source
                          </span>
                          <span className="value">
                            <Badge variant="secondary" className="capitalize">
                              {selectedReceipt.source}
                            </Badge>
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-end">
                          <span className="label text-muted-foreground font-semibold">
                            {selectedReceipt.transaction_type === "income"
                              ? "Credit Amount"
                              : "Debit Amount"}
                          </span>
                          <span
                            className={`value text-lg font-bold ${
                              selectedReceipt.transaction_type === "income"
                                ? "text-green-600"
                                : "text-primary"
                            }`}
                          >
                            <span className="mr-1">
                              {summary.system_currency}
                            </span>
                            {Number(
                              selectedReceipt.amount || 0
                            ).toLocaleString()}
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground label">
                            Payment Method
                          </span>
                          <span className="value">
                            <Badge className="bg-blue-100 text-blue-800 capitalize px-4 py-1">
                              {selectedReceipt.payment_method === "bank"
                                ? "Bank Transfer"
                                : "Cash"}
                            </Badge>
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">
                            {selectedReceipt.transaction_type === "income"
                              ? "Received By"
                              : "Paid By"}
                          </span>
                          <span className="value font-medium">
                            {selectedReceipt.created_by?.name || "Admin"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-6 border">
                      <p className="font-semibold mb-2 section-title">
                        Purpose / Description
                      </p>
                      <p className="description text-sm leading-relaxed text-foreground/90">
                        {selectedReceipt.description}
                      </p>
                    </div>

                    {selectedReceipt.fee_collection && (
                      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                        <p className="font-semibold text-blue-900 dark:text-blue-300 mb-4">
                          Membership Payment
                        </p>
                        <div className="space-y-3 text-sm">
                          <div className="detail-row flex justify-between">
                            <span className="text-muted-foreground">
                              Member
                            </span>
                            <span className="font-medium">
                              {selectedReceipt.fee_collection.member?.name ||
                                "Unknown Member"}
                            </span>
                          </div>
                          <div className="detail-row flex justify-between">
                            <span className="text-muted-foreground">
                              Member ID
                            </span>
                            <span className="font-medium">
                              {selectedReceipt.fee_collection.member
                                ?.reference_num || "—"}
                            </span>
                          </div>
                          <div className="detail-row flex justify-between">
                            <span className="text-muted-foreground">Plan</span>
                            <span className="font-medium">
                              {selectedReceipt.fee_collection.plan?.name ||
                                "Standard Plan"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* {console.log("Full selectedReceipt:", selectedReceipt)} */}

                    <div className="text-center space-y-2 pt-8 border-t mt-12 footer">
                      <p className="text-sm font-medium">
                        {/* Collected by: {selectedReceipt?.created_by_user.name} */}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Generated by{" "}
                        {selectedReceipt.generated_by_user?.name || "System"}
                      </p>
                      <p className="text-xs text-gray-500 italic ">
                        Powered by snowberrysys.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-background flex justify-end flex-shrink-0">
                <Button
                  variant="default"
                  size="sm"
                  // className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    const content = document.getElementById(
                      "payment-voucher-receipt-content"
                    )?.innerHTML;
                    if (!content) return;

                    const win = window.open("", "", "width=1000,height=800");
                    if (!win) return;

                    win.document.write(`
                      <html>
                        <head>
                          <style>
                            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              padding: 2rem; 
              color: #1f2937; 
              background: white;
              max-width: 800px;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 2rem; 
              border-bottom: 1px solid #e5e7eb; 
              padding-bottom: 1rem; 
            }
                          .section-title { 
              font-size: 1.125rem; 
              font-weight: 600; 
              margin-bottom: 1rem; 
              color: #374151;
            }
                           .badge { 
              padding: 0.25rem 0.5rem; 
              border-radius: 9999px; 
              background: #f3f4f6; 
              font-size: 0.75rem; 
              font-weight: 500; 
              color: #374151; 
            }
                            .detail-row { 
                              display: flex; 
                              justify-content: space-between; 
                              margin-bottom:  0.5rem; 
                              font-size: 0.875rem; 
                            }
                            .label {  color: #6b7280;}
                            .value { font-weight: 500; text-align: right;}
                            .italic { font-style: italic; }
                            .amount { 
                              font-size: 1.5rem; 
                              font-weight: 700; 
                              color: ${
                                selectedReceipt.transaction_type === "income"
                                  ? "#16a34a"
                                  : "#dc2626"
                              }; 
                              text-align: right; 
                            }
                            .description { 
                              background: #f8f9fa; 
                              padding: 1.5rem; 
                              border-radius: 12px; 
                              border: 1px solid #e2e8f0; 
                              margin: 1rem 0; 
                            }
                            .footer { 
                               text-align: center; 
                               margin-top: 2rem; 
                               font-size: 0.75rem; 
                               color: #6b7280; 
                               border-top: 1px solid #e5e7eb; 
                                padding-top: 1rem; 
                              }
                            @media print { body { padding: 2rem; } }
                          </style>
                        </head>
                        <body>
                          <div style="max-width: 800px; margin: 0 auto;">
                            ${content}
                          </div>
                        </body>
                      </html>
                    `);

                    win.document.close();
                    win.focus();
                    win.print();
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
