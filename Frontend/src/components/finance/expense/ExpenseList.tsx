// src/pages/finance/ExpenseList.tsx

import { useEffect, useState } from "react";
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
import {
  Search,
  Edit,
  Trash2,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loading from "@/components/shared/loaders/Loading";
import Pagination from "@/components/shared/Pagination";
import CustomCheckbox from "@shared/CustomCheckbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import DeleteConfirmationModal from "@/components/shared/modal/DeleteConfirmationModal";
import {
  getExpensesAsyncThunk,
  getExpenseCategoriesAsyncThunk,
  createOrUpdateExpenseAsyncThunk,
  deleteExpenseAsyncThunk,
  getBanksAsyncThunk,
} from "@/redux/pagesSlices/financeSlice";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
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
import { Separator } from "@/components/ui/separator";
import { formatDateToShortString, formatTimeTo12Hour } from "@/utils/helper";
import { usePermissions } from "@/permissions/usePermissions";
import { PERMISSIONS } from "@/permissions/permissions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { RootState } from "@/redux/store";

const expenseFormSchema = z.object({
  category_id: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required").max(100),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a positive number",
    }),
  deposit_method: z.enum(["cash", "bank"]),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  bank_id: z.string().optional(),
  // .refine(
  //   (val, ctx) => {
  //     const method = ctx.parent.deposit_method; // ← Access sibling field
  //     return method !== "bank" || !!val; // required only if bank
  //   },
  //   { message: "Bank is required when deposit method is Bank" }
  // ),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

type ExpenseListProps = {
  onRegisterAdd?: (openFn: () => void) => void;
  onSelectionChange?: (
    count: number,
    data: any[],
    fetchAllFn?: () => Promise<any[]>,
    dateRange?: { from?: Date; to?: Date }
  ) => void;
};

export default function ExpenseList({
  onRegisterAdd,
  onSelectionChange,
}: ExpenseListProps) {
  const dispatch = useDispatch<any>();
  const { expenses, expenseCategories, loadings } = useSelector(
    (state: any) => state.finance
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const expenseList = expenses?.data || [];
  // console.log("currency", expenseList);

  const currency = expenseList[0]?.system_currency || "Rs";

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);

  // Selection state
  // const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  // const [selectAll, setSelectAll] = useState(false);
  const [openReceipt, setOpenReceipt] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const { hasPermission } = usePermissions();
  // const { user } = useSelector((state: any) => state.auth);
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>("");

  const getCurrentMonthRange = () => {
    const today = new Date();
    return { from: startOfMonth(today), to: endOfMonth(today) };
  };
  // const { banks, loadings: financeLoadings } = useSelector(
  //   (state: any) => state.finance
  // );
  // console.log("banks", banks);
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
      .catch((err: any) => {
        console.error("Failed to load banks:", err);
        toast({
          title: "Error",
          description: err.response.data.errors || "Failed to load bank list",
          variant: "destructive",
        });
      });
    // }
  }, [dispatch, user?.logged_branch?.id]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isFullDataMode, setIsFullDataMode] = useState(false);
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined
  );
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category_id: "",
      title: "",
      amount: "",
      deposit_method: "cash",
      date: "",
      notes: "",
    },
  });

  // Fetch expenses
  useEffect(() => {
    const params: any = {
      page: currentPage,
      limit: recordsPerPage,
    };

    if (dateRange?.from) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
      params.end_date = dateRange.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : format(dateRange.from, "yyyy-MM-dd");

      if (dateRange.to) {
        setIsFullDataMode(true);
      } else {
        setIsFullDataMode(false);
      }
    }

    if (searchTerm) params.search = searchTerm;
    if (filterBranchId) params.filter_branch_id = filterBranchId;

    dispatch(getExpensesAsyncThunk(params));
  }, [
    dispatch,
    currentPage,
    recordsPerPage,
    searchTerm,
    dateRange,
    filterBranchId,
  ]);
  useEffect(() => {
    onSelectionChange?.(
      0,
      [],
      fetchAllFilteredExpenses,
      dateRange ? { from: dateRange.from, to: dateRange.to } : null
    );
  }, [dateRange, searchTerm, filterBranchId]);
  useEffect(() => {
    if (onRegisterAdd) onRegisterAdd(openAddDialog);
  }, [onRegisterAdd]);

  useEffect(() => {
    if (isDialogOpen && expenseCategories.data?.length === 0) {
      dispatch(getExpenseCategoriesAsyncThunk({ disable_page_param: 1 }));
    }
  }, [isDialogOpen, dispatch, expenseCategories.data?.length]);

  const fetchAllFilteredExpenses = async () => {
    const params: any = {
      // disable_page_param: 1,
      page: currentPage,
      limit: recordsPerPage,
      
    };

    if (dateRange?.from)
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
    if (dateRange?.to) params.end_date = format(dateRange.to, "yyyy-MM-dd");
    if (searchTerm) params.search = searchTerm;
    if (filterBranchId) params.filter_branch_id = filterBranchId;
    // params.with = "category";

    const result = await dispatch(getExpensesAsyncThunk(params)).unwrap();
    return result.data || [];
  };

  // Reset selection when data changes
  // useEffect(() => {
  //   setSelectedIds(new Set());
  //   setSelectAll(false);
  // }, [expenseList]);

  // // Notify parent about selected items
  // useEffect(() => {
  //   const selectedFormatted = expenseList
  //     .filter((exp: any) => selectedIds.has(exp.id))
  //     .map((exp: any) => ({
  //       Date: format(new Date(exp.date), "dd MMM yyyy"),
  //       Title: exp.title,
  //       Category: exp.category?.title || "—",
  //       Amount: `${currency}${Number(exp.amount).toLocaleString()}`,
  //       "Payment Method": exp.deposit_method === "bank" ? "Bank Transfer" : "Cash",
  //       Notes: exp.notes || "—",
  //     }));

  //   onSelectionChange?.(selectedFormatted.length, selectedFormatted);
  // }, [selectedIds, expenseList, onSelectionChange, currency]);

  const openAddDialog = () => {
    setIsEditMode(false);
    setSelectedRecord(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const openEditDialog = (record: any) => {
    setIsEditMode(true);
    setSelectedRecord(record);
    form.reset({
      category_id: String(record.category_id),
      title: record.title || "",
      amount: String(record.amount),
      deposit_method: record.deposit_method || "cash",
      date: record.date || "",
      notes: record.notes || "",
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (id: number) => {
    setRecordToDelete(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteExpenseAsyncThunk({ id: recordToDelete! })).unwrap();
      toast({ title: "Deleted", description: "Expense removed successfully" });
    } catch {
      toast({
        variant: "destructive",
        description: "Failed to delete expense",
      });
    } finally {
      setIsDeleteOpen(false);
      setRecordToDelete(null);
    }
  };

  const onSubmit = async (values: ExpenseFormValues) => {
    const payload = {
      category_id: Number(values.category_id),
      title: values.title.trim(),
      amount: Number(values.amount),
      deposit_method: values.deposit_method,
      notes: values.notes?.trim() || null,
      date: values.date,
      ...(isEditMode && selectedRecord?.id && { id: selectedRecord.id }),
      ...(values.deposit_method === "bank" && values.bank_id
        ? { bank_id: values.bank_id }
        : {}),
    };

    try {
      await dispatch(createOrUpdateExpenseAsyncThunk(payload)).unwrap();
      toast({
        title: "Success",
        description: isEditMode ? "Expense updated" : "Expense added",
      });
      setIsDialogOpen(false);
      fetchAllFilteredExpenses();
    } catch (err: any) {
      toast({
        variant: "destructive",
        description: err.response?.data?.errors || "Failed to save",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Expense Records</CardTitle>

            <div className="flex items-center gap-3 flex-wrap">
              <HeaderBranchFilter onBranchChange={setFilterBranchId} />
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 w-64"
                />
              </div>

              {/* Date Range Picker */}
              <div className="flex items-center gap-2 mt-1">
                {/* <Button
                  variant="outline"
                  size="icon"
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
                  <ChevronLeft className="h-4 w-4" />
                </Button> */}

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
                    <div className="p-3 border-b">
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
                    <div className="p-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setDateRange(undefined);
                          setCurrentPage(1);
                        }}
                      >
                        Clear filter
                      </Button>
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
                {/* <Button
                  variant="outline"
                  size="icon"
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
                  <ChevronRight className="h-4 w-4" />
                </Button> */}
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
                      setSelectedIds(checked ? new Set(expenseList.map((e: any) => e.id)) : new Set());
                    }}
                  />
                </TableHead> */}
                <TableHead>Date & Time</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="max-w-md text-center">Notes</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loadings.getExpenses ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex items-center justify-center h-full">
                      <Loading />
                    </div>
                  </TableCell>
                </TableRow>
              ) : expenseList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-64 text-center text-muted-foreground"
                  >
                    No expenses found
                  </TableCell>
                </TableRow>
              ) : (
                expenseList.map((exp: any) => (
                  <TableRow key={exp.id}>
                    {/* <TableCell>
                      <CustomCheckbox
                        checked={selectedIds.has(exp.id)}
                        onChange={(checked) => {
                          const newIds = new Set(selectedIds);
                          if (checked) newIds.add(exp.id);
                          else newIds.delete(exp.id);
                          setSelectedIds(newIds);
                          setSelectAll(newIds.size === expenseList.length && expenseList.length > 0);
                        }}
                      />
                    </TableCell> */}

                    <TableCell className="flex whitespace-nowrap text-sm">
                      {formatDateToShortString(exp.date)}
                      <p className="ml-2">{formatTimeTo12Hour(exp.time)}</p>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Badge variant="outline" className="font-mono">
                        {exp.reference_num}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{exp.title}</TableCell>

                    <TableCell>
                      <Badge variant="secondary">
                        {exp.category?.title || "—"}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-semibold text-primary whitespace-nowrap">
                      <span className="mr-1">{currency}</span>
                      {Number(exp.amount).toLocaleString("en-IN")}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {exp.deposit_method || "—"}
                      </Badge>
                    </TableCell>

                    <TableCell className="max-w-md">
                      {exp.notes && exp.notes.length > 20 ? (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help text-sm text-muted-foreground">
                                {exp.notes.slice(0, 10)}...
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="max-w-sm wrap-break-words whitespace-normal p-3 text-sm max-h-[120px] overflow-y-auto scrollbar-thin"
                            >
                              {exp.notes}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {exp.notes || "—"}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {hasPermission(PERMISSIONS.EXPENSE_EDIT) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(exp)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission(PERMISSIONS.EXPENSE_DELETE) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteDialog(exp.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission(PERMISSIONS.EXPENSE_VIEW) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReceipt(exp);
                              // console.log("FULL EXPENSE OBJECT", exp);
                              setOpenReceipt(true);
                            }}
                          >
                            View Receipt
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination – only show when there is data */}
          {expenseList.length > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalRecords={expenses.meta?.total || 0}
                recordsPerPage={recordsPerPage}
                setRecordsPerPage={setRecordsPerPage}
                recordsPerPageOptions={[10, 20, 50]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit" : "Add"} Expense</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4"
            >
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {expenseCategories?.data?.map((cat: any) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Title <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Electricity Bill" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Amount <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Date <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deposit_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("deposit_method") === "bank" && (
                <FormField
                  control={form.control}
                  name="bank_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Select Bank <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose bank account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadings.getBanks ? (
                            <div className="p-4 text-center text-muted-foreground">
                              Loading banks...
                            </div>
                          ) : banks?.length > 0 ? (
                            banks.map((bank: any) => (
                              // <SelectContent>
                              // {banks.map((bank: any) => (
                              <SelectItem
                                key={bank.id}
                                value={bank.id.toString()}
                              >
                                {bank.reference_num} {"- "}
                                {bank.name}
                              </SelectItem>
                              // ))}
                              // </SelectContent>
                            ))
                          ) : (
                            <div className="p-4 text-center text-muted-foreground">
                              No banks available
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Monthly rent" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loadings.createOrUpdateExpense}>
                  {loadings.createOrUpdateExpense
                    ? "Saving..."
                    : isEditMode
                    ? "Update"
                    : "Add"}{" "}
                  Expense
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action cannot be undone."
      />
      {/* FINAL EXPENSE RECEIPT – PERFECT PRINT + PRINT BUTTON ALWAYS VISIBLE */}
      <Dialog open={openReceipt} onOpenChange={setOpenReceipt}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl max-h-[95vh] flex flex-col">
          {selectedReceipt && (
            <>
              {/* Fixed Header */}
              <div className="flex items-center justify-between p-6 border-b bg-background">
                <DialogTitle className="text-xl font-bold">
                  Expense Receipt
                </DialogTitle>
              </div>

              <div
                id="expense-receipt-content"
                className="flex-1 overflow-y-auto px-8 pt-6 pb-8 bg-background scrollbar-thin"
              >
                <div className="max-w-2xl mx-auto px-6">
                  <div className="header text-center space-y-2 pb-8 border-b">
                    <h2 className="text-3xl font-bold">{user?.system_company_name}</h2>
                    <p className="text-sm text-muted-foreground">
                      Expense Transaction Receipt
                    </p>
                    <Badge className="bg-secondary text-secondary-foreground font-medium px-3 py-1">
                      # {selectedReceipt.transaction?.reference_num}
                    </Badge>
                  </div>

                  <div className="mt-8 space-y-8">
                    <div>
                      <p className="section-title font-semibold text-lg mb-4">
                        Receipt Details
                      </p>
                      <div className="space-y-3">
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

                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">
                            Date
                          </span>
                          <span className="value">
                            {selectedReceipt.transaction?.date
                              ? format(
                                  new Date(selectedReceipt.transaction.date),
                                  "dd MMM yyyy"
                                )
                              : "—"}{" "}
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">
                            Time
                          </span>
                          <span className="value">
                            {selectedReceipt.transaction?.time
                              ? formatTimeTo12Hour(
                                  selectedReceipt.transaction.time
                                )
                              : "—"}
                          </span>
                        </div>
                        <p className="section-title font-semibold text-lg mb-4">
                          Transaction Details
                        </p>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label text-muted-foreground">
                            Transaction Type
                          </span>
                          <span className="value font-medium capitalize">
                            {selectedReceipt.transaction?.transaction_type ||
                              "—"}
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="text-muted-foreground">Source</span>
                          <span className="value font-medium capitalize">
                            {selectedReceipt.transaction?.source || "—"}
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="text-muted-foreground">
                            Payment Method
                          </span>
                          <Badge className="bg-muted text-muted-foreground capitalize">
                            {selectedReceipt.transaction?.payment_method ===
                            "bank"
                              ? "Bank Transfer"
                              : "Cash"}
                          </Badge>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label text-muted-foreground">
                            Debit Amount
                          </span>
                          <span className="value font-semibold text-primary">
                            {currency}{" "}
                            {Number(
                              selectedReceipt.transaction?.debit_amount || 0
                            ).toLocaleString()}
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label text-muted-foreground">
                            Credit Amount
                          </span>
                          <span className="value font-semibold text-green-600">
                            {currency}{" "}
                            {Number(
                              selectedReceipt.transaction?.credit_amount || 0
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* <div>
                      <p className="font-semibold text-lg mb-4">Branch Information</p>
                      <div className="space-y-3">
                        <div className="detail-row flex justify-between items-center">
                          <span className="text-muted-foreground">Branch Name</span>
                          <span className="value font-medium">
                            {selectedReceipt.transaction?.branch?.name || "—"}
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="text-muted-foreground">Reference</span>
                          <Badge variant="outline" className="font-mono">
                            {selectedReceipt.transaction?.branch?.reference_num || "—"}
                          </Badge>
                        </div>
                      </div>
                    </div> */}

                    {selectedReceipt.transaction?.description && (
                      <div className="bg-muted/50 rounded-lg p-6 border">
                        <p className="font-semibold mb-2">Description</p>
                        <p className="description text-sm leading-relaxed text-foreground/90">
                          {selectedReceipt.transaction.description}
                        </p>
                      </div>
                    )}

                    <div className="text-center space-y-2 pt-8 border-t footer">
                      <p className="text-sm text-muted-foreground">
                        Recorded by:{" "}
                        <span className="font-medium">
                          {selectedReceipt.transaction?.created_by?.name ||
                            selectedReceipt.created_by_user?.name ||
                            "System"}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground italic">
                        This is an official transaction record from the
                        financial system.
                      </p>
                      <p className="text-xs text-gray-500 italic ">
                        Powered by snowberrysys.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-background flex justify-end gap-3 shrink-0">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const content = document.getElementById(
                      "expense-receipt-content"
                    )?.innerHTML;
                    if (!content) return;

                    const win = window.open("", "", "width=900,height=700");
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
                              background: ${
                                selectedReceipt.transaction_type === "income"
                                  ? "#dcfce7"
                                  : "#fee2e2"
                              };
                              color: ${
                                selectedReceipt.transaction_type === "income"
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
    </>
  );
}
