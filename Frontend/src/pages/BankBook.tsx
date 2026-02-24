import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Calendar as CalendarIcon,
  Search,
  Building,
  ChevronLeft,
  ChevronRight,
  Notebook,
  NotebookIcon,
  Download,
  Printer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import Loading from "@/components/shared/loaders/Loading";
import Pagination from "@/components/shared/Pagination";
import { Calendar } from "@/components/ui/calendar";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
} from "date-fns";
import { DateRange } from "react-day-picker";
import { getBankBookCollectionAsyncThunk } from "@/redux/pagesSlices/generalSlice";
import CustomCheckbox from "@shared/CustomCheckbox";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { usePermissions } from "@/permissions/usePermissions";
import { PERMISSIONS } from "@/permissions/permissions";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatTimeTo12Hour } from "@/utils/helper";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { exportToPDF } from "@/utils/exportToPdf";
import { toast } from "@/hooks/use-toast";
import { RootState } from "@/redux/store";

interface BankBookEntry {
  id: number;
  payment_method: string;
  debit_amount: number;
  credit_amount: number;
  date: string;
  time: string;
  description: string;
  transaction_type: "income" | "expense";
  source: string;
  reference_num: string;
  expense_id: number | null;
  income_id: number | null;
  fee_collection_id: number | null;
  created_by: number;
  branch_id: number;
  created_at: string;
  updated_at: string;
  running_balance: number;
}

interface BankBookMeta {
  opening_balance?: number;
  closing_balance?: number;
  total?: number;
  current_page?: number;
  per_page?: number;
  last_page?: number;
}

export default function BankBook() {
  const dispatch = useDispatch();
  const { bankBooks, loadings, selectedBranchId } = useSelector(
    (state: any) => state.general
  );
    const { user } = useSelector((state: RootState) => state.auth);
  
  const { branchesList } = useSelector((state: any) => state.plan);
  const isLoading = loadings?.getBankBookCollection;
  const meta = bankBooks?.meta as BankBookMeta;
  // const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  // const [selectAll, setSelectAll] = useState(false);

  const { hasPermission } = usePermissions();
  const [isFullDataMode, setIsFullDataMode] = useState(false);
  const [openReceipt, setOpenReceipt] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState("");

  // const selectedCount = selectedIds.size;

  // Set current month as default date range
  const getCurrentMonthRange = () => {
    const today = new Date();
    return {
      from: startOfMonth(today),
      to: endOfMonth(today),
    };
  };

  // Filters & Pagination
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    getCurrentMonthRange()
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  function convertCurrencySymbol(symbol: string): string {
    if (!symbol) return '';
    if (symbol === '\u20a8') {
      return 'Rs';
    }
    return symbol;
  }

  // Fetch bank book entries
  useEffect(() => {
    const params: any = {
      page: currentPage,
      limit: recordsPerPage,
      filter_branch_id: filterBranchId,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");

      if (dateRange.to) {
        params.end_date = format(dateRange.to, "yyyy-MM-dd");
      } else {
        params.end_date = format(dateRange.from, "yyyy-MM-dd");
      }
    }

    if (searchTerm) params.search = searchTerm;
    if (filterBranchId !== "all") params.filter_branch_id = filterBranchId;

    dispatch(getBankBookCollectionAsyncThunk(params));
  }, [dispatch, currentPage, recordsPerPage, dateRange, filterBranchId]);

  // const Number = (amount: number) => {
  //   return new Intl.NumberFormat('en-IN', {
  //     style: 'currency',
  //     currency: 'PKR',
  //     minimumFractionDigits: 0,
  //     maximumFractionDigits: 0,
  //   }).format(amount);
  // };

  const formatDateTime = (date: string, time: string) => {
    const dateTimeString = `${date}T${time}`; // Ensures correct time parsing
    const dateObj = new Date(dateTimeString);
    return format(dateObj, "dd MMM yyyy, h:mm a");
  };

  const handlePreviousMonth = () => {
    if (dateRange?.from) {
      const newFrom = subMonths(dateRange.from, 1);
      const newTo = endOfMonth(newFrom);
      setDateRange({ from: startOfMonth(newFrom), to: newTo });
      setCurrentPage(1);
    }
  };

  const handleNextMonth = () => {
    if (dateRange?.from) {
      const newFrom = addMonths(dateRange.from, 1);
      const newTo = endOfMonth(newFrom);
      setDateRange({ from: startOfMonth(newFrom), to: newTo });
      setCurrentPage(1);
    }
  };

  const handleCurrentMonth = () => {
    setDateRange(getCurrentMonthRange());
    setCurrentPage(1);
  };

  const cleanDescription = (text: string | undefined): string => {
    if (!text) return "—";

    return text
      .replace(/[\u200B-\u200D\uFEFF]/g, "")           // remove zero-width characters
      .replace(/[-\u001F\u007F-\u009F]/g, "")    // remove control characters
      .replace(/\s+/g, " ")                             // collapse multiple spaces
      .trim();
  };

  const exportPDF = useCallback(() => {
    const recordsToExport = bankBooks?.data || [];

    if (recordsToExport.length === 0) {
      toast({ title: "No bank book records to export", variant: "destructive" });
      return;
    }

    // Get selected branch info (assuming you have branch filter)
    const selectedBranch = filterBranchId
      ? branchesList?.find((b: any) => b.id === Number(filterBranchId))
      : null;

    const currency = bankBooks?.system_currency || "Rs";

    // Opening & Closing balances (used in footer)
    const openingBalance = Number(bankBooks?.opening_balance || 0);
    const closingBalance = Number(bankBooks?.closing_balance || 0);

    exportToPDF({
      title: "Bank Book Report",
      // subtitle: `${recordsToExport.length} record${recordsToExport.length !== 1 ? "s" : ""}`,
      filenamePrefix: `${user?.system_company_name}_Bank_Book`,

      dateRange: dateRange?.from && dateRange?.to
        ? { from: dateRange.from, to: dateRange.to }
        : undefined,

      branchInfo: selectedBranch
        ? {
          name: selectedBranch.name || "All Branches",
          address: selectedBranch.address || "",
          reference_num: selectedBranch.reference_num,
        }
        : null,

      columns: [
        { title: "Date", dataKey: "date", align: "center", width: 35 },
        { title: "Reference", dataKey: "reference", align: "center", width: 35 },
        { title: "Description", dataKey: "description", align: "left", width: 60 },
        { title: "Type", dataKey: "type", align: "center", width: 35 },
        { title: "Debit", dataKey: "debit", align: "left", width: 35 },
        { title: "Credit", dataKey: "credit", align: "left", width: 35 },
        { title: "Balance", dataKey: "balance", align: "left", width: 40 },
      ],

      data: recordsToExport,

      getRowData: (entry: any) => ({
        date: format(new Date(entry.date), "dd MMM yyyy"),
        reference: entry.reference_num || "—",
        description: entry.description || "—",
        type: entry.transaction_type.toUpperCase(),
        debit:
          entry.debit_amount > 0
            ? `${currency} ${entry.debit_amount.toLocaleString()}`
            : "0",
        credit:
          entry.credit_amount > 0
            ? `${currency} ${entry.credit_amount.toLocaleString()}`
            : "0",
        balance: `${currency} ${entry.running_balance.toLocaleString()}`,
      }),

      footerCallback: (doc: jsPDF, finalY: number) => {
        const leftMargin = 14;

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");

        doc.text(
          `Opening Balance: ${currency} ${openingBalance.toLocaleString()}`,
          leftMargin,
          finalY + 12
        );

        doc.text(
          `Closing Balance: ${currency} ${closingBalance.toLocaleString()}`,
          leftMargin,
          finalY + 24
        );
      },
    });

    const fileName = dateRange?.from
      ? `Bank_Book_${format(dateRange.from, "yyyy-MM-dd")}_to_${format(
        dateRange.to!,
        "yyyy-MM-dd"
      )}.pdf`
      : `Bank_Book_${format(new Date(), "yyyy-MM-dd")}.pdf`;

  }, [
    bankBooks,
    dateRange,
    filterBranchId,
    branchesList,
    convertCurrencySymbol,
  ]);

  // const exportPDF = useCallback(() => {
  //   const selectedData = bankBooks?.data?.filter((e: any) => selectedIds.has(e.id)) || [];
  //   if (selectedData.length === 0) return;

  //   const doc = new jsPDF("l", "mm", "a4");
  //   const currency = bankBooks?.system_currency || "Rs";

  //   // Header
  //   doc.setFontSize(18);
  //   doc.text("Bank Book Report", 14, 20);
  //   doc.setFontSize(11);
  //   doc.text(`Generated: ${format(new Date(), "dd MMM yyyy")} • ${selectedData.length} records`, 14, 30);

  //   doc.setFontSize(12);
  //   doc.text(`Opening Balance: ${currency} ${Number(bankBooks?.opening_balance || 0).toLocaleString()}`, 14, 40);
  //   doc.text(`Closing Balance: ${currency} ${Number(bankBooks?.closing_balance || 0).toLocaleString()}`, 14, 48);

  //   let periodY = 55;
  //   doc.setFontSize(11);
  //   doc.setTextColor(12);
  //   if (dateRange?.from && dateRange?.to) {
  //     const startStr = format(dateRange.from, "dd MMM yyyy");
  //     const endStr = format(dateRange.to, "dd MMM yyyy");
  //     doc.text(`Date Range: ${startStr} – ${endStr}`, 14, periodY);
  //   } else {
  //     doc.text("Date Range: All Time", 14, periodY);
  //   }
  //   doc.setTextColor(0, 0, 0);

  //   // Table data
  //   const tableData = selectedData.map((e: any) => [
  //     format(new Date(e.date), "dd MMM yyyy"),
  //     e.reference_num || "0",
  //     e.description || "No description",
  //     e.transaction_type.toUpperCase(),
  //     e.debit_amount > 0 ? `${currency} ${e.debit_amount.toLocaleString()}` : "0",
  //     e.credit_amount > 0 ? `${currency} ${e.credit_amount.toLocaleString()}` : "0",
  //     `${currency} ${e.running_balance.toLocaleString()}`,
  //   ]);

  //   autoTable(doc, {
  //     head: [["Date", "Reference", "Description", "Type", "Debit", "Credit", "Balance"]],
  //     body: tableData,
  //     startY: 65,
  //     styles: { fontSize: 10, cellPadding: 5, overflow: 'linebreak' },
  //     columnStyles: {
  //       2: { cellWidth: 80 },
  //       4: { halign: 'right' },
  //       5: { halign: 'right' },
  //       6: { halign: 'right' },
  //     },
  //     headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255] },
  //     alternateRowStyles: { fillColor: [248, 251, 253] },
  //   });

  //   // Optional: Closing balance at bottom (uncomment if you want it repeated)
  //   // const finalY = (doc as any).lastAutoTable.finalY + 10;
  //   // doc.setFontSize(14);
  //   // doc.setTextColor(34, 197, 94);
  //   // doc.text(`Closing Balance: ${currency} ${Number(bankBooks?.closing_balance || 0).toLocaleString()}`, 14, finalY);

  //   doc.save(`Bank_Book_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  // }, [bankBooks, selectedIds, dateRange]); // ← Don't forget to add dateRange to dependencies!

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bank Book</h1>
          <p className="text-muted-foreground mt-1">
            View all bank transactions
          </p>
        </div>
        {hasPermission(PERMISSIONS.LEDGER_EXPORT) && (
          <Button
            variant="default"
            size="sm"
            onClick={exportPDF}
            disabled={!bankBooks?.data || bankBooks.data.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          // <Button
          //   variant="outline"
          //   size="sm"
          //   onClick={exportPDF}
          //   className={`mr-2 ${selectedCount === 0 ? 'cursor-not-allowed' : ''}`}
          //   disabled={selectedCount === 0}
          // >
          //   <Download className="h-4 w-4 mr-2" />
          //   PDF
          // </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Opening Balance Card */}
        {bankBooks?.opening_balance !== undefined && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-medium">Opening Balance</h1>
                  <p className="text-2xl font-bold text-primary mt-1">
                    <span className="mr-2">
                      {bankBooks?.system_currency || "₨"}
                    </span>
                    {(bankBooks?.opening_balance).toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs mt-1">
                    Balance at start of selected period
                  </p>
                </div>
                <Building className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        )}
        {/* Closing Balance Card */}
        {bankBooks?.closing_balance !== undefined && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Closing Balance</p>

                  <div className="flex items-baseline gap-3">
                    <p className="text-2xl font-bold tracking-tight text-primary">
                      <span className="mr-2">
                        {bankBooks?.system_currency || "Rs"}
                      </span>
                      {bankBooks.closing_balance.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <p className="text-xs">Balance at end of selected period</p>
                </div>

                <NotebookIcon
                  className={cn(
                    "h-10 w-10",
                    bankBooks.closing_balance >= 0
                      ? "text-primary"
                      : "text-primary"
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Bank Transactions
            </CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <HeaderBranchFilter onBranchChange={setFilterBranchId} />
              {/* Date Range Selector */}
              <div className="flex items-center gap-2">
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
                            {format(dateRange.from, "dd MMM yyyy")} -{" "}
                            {format(dateRange.to, "dd MMM yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "dd MMM yyyy")
                        )
                      ) : (
                        <span>Select date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3 border-b">
                      <div className="flex items-center justify-between mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePreviousMonth}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Prev
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCurrentMonth}
                        >
                          Current Month
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleNextMonth}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={(range: DateRange | undefined) => {
                          if (range) {
                            if (range.from && range.to) {
                              setDateRange({ from: range.from, to: range.to });
                            } else if (range.from) {
                              setDateRange({ from: range.from, to: undefined });
                            } else {
                              setDateRange(undefined);
                            }
                          } else {
                            setDateRange(undefined);
                          }
                          setCurrentPage(1);
                        }}
                        numberOfMonths={1}
                        showOutsideDays={false}
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
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead className="w-12">
                  <CustomCheckbox
                    checked={selectAll}
                    onChange={(checked) => {
                      setSelectAll(checked);
                      if (checked) {
                        setSelectedIds(new Set(bankBooks?.data?.map((e: any) => e.id) || []));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                </TableHead> */}
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64">
                    <div className="flex items-center justify-center h-full">
                      <Loading />
                    </div>
                  </TableCell>
                </TableRow>
              ) : bankBooks?.data?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-16 text-muted-foreground"
                  >
                    No bank transactions found for the selected period
                  </TableCell>
                </TableRow>
              ) : (
                bankBooks?.data?.map((entry: BankBookEntry) => (
                  <TableRow key={entry.id}>
                    {/* <TableCell className="align-center">
                      <CustomCheckbox
                        checked={selectedIds.has(entry.id)}
                        onChange={(checked) => {
                          const newIds = new Set(selectedIds);
                          if (checked) newIds.add(entry.id);
                          else newIds.delete(entry.id);
                          setSelectedIds(newIds);
                          setSelectAll(newIds.size === bankBooks?.data?.length && bankBooks.data.length > 0);
                        }}
                      />
                    </TableCell> */}
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatDateTime(entry.date, entry.time)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {entry.reference_num}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {entry.description && entry.description.length > 20 ? (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help text-sm text-muted-foreground">
                                {entry.description.slice(0, 10)}...
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="max-w-sm wrap-break-words whitespace-normal p-3 text-sm max-h-[120px] overflow-y-auto scrollbar-thin"
                            >
                              {entry.description}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {entry.description || "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {entry.transaction_type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      {
                        <span className="text-primary gap-2">
                          <span className="mr-1">
                            {bankBooks?.system_currency || "Rs"}
                          </span>
                          {Number(entry.debit_amount).toLocaleString()}
                        </span>
                      }
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      {
                        <span className="text-green-600 gap-2">
                          <span className="mr-1">
                            {bankBooks?.system_currency || "Rs"}
                          </span>
                          {Number(entry.credit_amount).toLocaleString()}
                        </span>
                      }
                    </TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap">
                      <span className="mr-1">
                        {bankBooks?.system_currency || "Rs"}
                      </span>
                      {Number(entry.running_balance).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {hasPermission(PERMISSIONS.LEDGER_VIEW) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReceipt(entry);
                            setOpenReceipt(true);
                          }}
                        >
                          View Receipt
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalRecords={meta?.total || 0}
            recordsPerPage={recordsPerPage}
            setRecordsPerPage={setRecordsPerPage}
          />
        </CardContent>
      </Card>

      <Dialog open={openReceipt} onOpenChange={setOpenReceipt}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl max-h-[95vh] flex flex-col">
          {selectedReceipt && (
            <>
              <div className="p-6 border-b bg-background">
                <DialogTitle className="text-xl font-bold">
                  Bank Transaction Receipt
                </DialogTitle>
              </div>

              <div
                id="bank-receipt-content"
                className="flex-1 overflow-y-auto px-8 pt-6 pb-8 bg-background scrollbar-thin"
              >
                <div className="max-w-2xl mx-auto">
                  <div className="text-center space-y-4 pb-10 border-b header">
                    <h2 className="text-3xl font-bold tracking-tight">
                      {user?.system_company_name}
                    </h2>
                    <p className="text-lg font-semibold ">
                      Bank Transaction Receipt
                    </p>
                    <Badge className="bg-secondary text-secondary-foreground font-medium px-3 py-1">
                      # {selectedReceipt.reference_num}
                    </Badge>
                  </div>

                  <div className="mt-10 space-y-8">
                    <div>
                      <p className="section-title font-semibold text-lg mb-5 text-center md:text-left">
                        Receipt Details
                      </p>
                      <div className="space-y-4">
                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">
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
                          <span className="label font-medium text-muted-foreground">
                            Time
                          </span>
                          <span className="value">
                            {formatTimeTo12Hour(
                              selectedReceipt.time || "00:00:00"
                            )}
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">
                            Source
                          </span>
                          <span className="value">
                            <Badge variant="secondary" className="capitalize">
                              {selectedReceipt.source === "membership"
                                ? "Membership Fee"
                                : selectedReceipt.source === "income"
                                  ? "Other Income"
                                  : "Expense"}
                            </Badge>
                          </span>
                        </div>
                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">
                            Type
                          </span>
                          <span className="value">
                            <Badge variant="secondary" className="capitalize">
                              {selectedReceipt.transaction_type}
                            </Badge>
                          </span>
                        </div>
                        <div className="detail-row flex justify-between items-center">
                          <span className="text-muted-foreground">Branch</span>
                          <div>
                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-muted rounded-md border">
                              {selectedReceipt.branch?.reference_num || "—"}
                            </span>{" "}
                            <span className="font-medium">
                              {selectedReceipt.branch?.name || "—"}
                            </span>
                          </div>
                        </div>

                        {/* NEW: Show BOTH Debit and Credit Amounts */}
                        <div className="pt-6 border-t space-y-4">
                          <p className="section-title font-semibold text-lg mb-5 text-center md:text-left">
                            Transaction Details
                          </p>
                          <div className="detail-row flex justify-between items-center">
                            <span className="text-muted-foreground text-md font-semibold">
                              Debit Amount
                            </span>
                            <span className="text-xl font-bold text-primary">
                              <span className="mr-1">
                                {bankBooks?.system_currency || "Rs"}
                              </span>
                              {Number(
                                selectedReceipt.debit_amount || 0
                              ).toLocaleString()}
                            </span>
                          </div>

                          <div className="detail-row flex justify-between items-center">
                            <span className="text-muted-foreground text-md font-semibold">
                              Credit Amount
                            </span>
                            <span className="text-lg font-bold text-green-500">
                              <span className="mr-1">
                                {bankBooks?.system_currency || "Rs"}
                              </span>
                              {Number(
                                selectedReceipt.credit_amount || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">
                            Payment Method
                          </span>
                          <span className="value">
                            <Badge className="bg-blue-100 text-blue-800 capitalize px-4 py-1">
                              {selectedReceipt.payment_method}
                            </Badge>
                          </span>
                        </div>

                        {/* <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">Recorded By</span>
                          <span className="value font-medium">
                            {selectedReceipt.created_by?.name || "System"}
                          </span>
                        </div> */}

                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">
                            Running Balance
                          </span>
                          <span className="value font-bold text-lg">
                            <span className="mr-1">
                              {bankBooks?.system_currency || "Rs"}
                            </span>
                            {Number(
                              selectedReceipt.running_balance
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-xl p-6 border">
                      <p className="font-semibold text-lg mb-3">Description</p>
                      <p className="description text-base leading-relaxed text-foreground/90">
                        {selectedReceipt.description}
                      </p>
                    </div>

                    <div className="text-center space-y-2 border-t pt-6 footer">
                      <p className="text-sm text-gray-600">
                        Collected by: {selectedReceipt?.created_by?.name}
                      </p>
                      <p className="text-xs text-gray-500 italic ">
                        Powered by snowberrysys.com
                      </p>
                      {/* <p className="text-xs text-gray-500 italic">
              Thank you for your payment! Your membership is now active.
            </p> */}
                    </div>

                    {/* <div className="text-center space-y-3 pt-10 border-t mt-12">
                      <p className="text-lg font-semibold">Transaction recorded in Bank Book</p>
                      <p className="text-sm text-muted-foreground">
                        Generated on {format(selectedReceipt.date, "dd MMM yyyy")} at {formatTimeTo12Hour(selectedReceipt.time || "00:00:00")}
                      </p>
                    </div> */}
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
                      "bank-receipt-content"
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
                              display: inline-block; 
                              padding: 0.7rem 1.5rem; 
                              border-radius: 9999px; 
                              font-size: 1.3rem; 
                              font-weight: 700; 
                              background: ${selectedReceipt.transaction_type === "income"
                        ? "#dcfce7"
                        : "#fee2e2"
                      };
                              color: ${selectedReceipt.transaction_type === "income"
                        ? "#166534"
                        : "#991b1b"
                      };
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
                              color: ${selectedReceipt.transaction_type === "income"
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
                    setTimeout(() => win.print(), 800);
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
