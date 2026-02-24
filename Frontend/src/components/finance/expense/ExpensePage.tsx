// src/pages/finance/ExpensePage.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ExpenseCategoryList from "./ExpenseCategoryList";
import ExpenseList from "./ExpenseList";
import { PERMISSIONS } from "@/permissions/permissions";
import { usePermissions } from "@/permissions/usePermissions";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Download } from "lucide-react";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { exportToPDF } from "@/utils/exportToPdf";
import { toast } from "@/hooks/use-toast";

export default function ExpensePage() {
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState("list");
  // const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
      undefined
    );
      const { branchesList } = useSelector((state: any) => state.plan);
    




  // Selection state from ExpenseList
  // const [selectedCount, setSelectedCount] = useState(0);
  // const [selectedData, setSelectedData] = useState<any[]>([]);
  const { expenses } = useSelector((state: any) => state.finance);
  const [fetchAllExpensesFn, setFetchAllExpensesFn] = useState<(() => Promise<any[]>) | null>(null)

  // Convert Unicode currency symbol \u20a8 (₨) to "Rs"
  function convertCurrencySymbol(symbol: string): string {
    if (!symbol) return '';
    if (symbol === '\u20a8') {
      return 'Rs';
    }
    return symbol;
  }

  // const handleSelectionChange = useCallback((count: number, data: any[]) => {
  //   setSelectedCount(count);
  //   setSelectedData(data);
  // }, []);
  const handleSelectionChange = useCallback(
    (
      count: number,
      data: any[],
      fetchAllFn?: () => Promise<any[]>,
      selectedDateRange?: { from?: Date; to?: Date }
    ) => {
      if (fetchAllFn) setFetchAllExpensesFn(() => fetchAllFn);
      if (selectedDateRange) setDateRange(selectedDateRange);
    },
    []
  );

  let openExpenseAdd = () => { };
  let openCategoryAdd = () => { };

  const registerExpenseAdd = (fn: () => void) => { openExpenseAdd = fn; };
  const registerCategoryAdd = (fn: () => void) => { openCategoryAdd = fn; };

  const handleAddClick = () => {
    if (activeTab === "list") openExpenseAdd();
    else if (activeTab === "category") openCategoryAdd();
  };

 const exportPDF = useCallback(async () => {
  if (!fetchAllExpensesFn) return;

  const allExpenses = await fetchAllExpensesFn();

  if (allExpenses.length === 0) {
    toast({ title: "No expenses to export", variant: "destructive" });
    return;
  }

  const selectedBranch = filterBranchId
    ? branchesList?.find((b: any) => b.id === Number(filterBranchId))
    : null;

  const rawCurrency = allExpenses[0]?.system_currency || "PKR";
  const currency = convertCurrencySymbol(rawCurrency);

  const totalAmount = allExpenses.reduce((sum: number, item: any) => {
    const amount = parseAmount(item.amount);
    return sum + amount;
  }, 0);

  exportToPDF({
    title: "Expense Report",
    // subtitle: `${allExpenses.length} record${allExpenses.length !== 1 ? "s" : ""}`,
    filenamePrefix: "Expense_Report",

    dateRange: dateRange ? {
      from: dateRange.from,
      to: dateRange.to
    } : undefined,

    branchInfo: selectedBranch
      ? {
          name: selectedBranch.name || "All Branches",
          address: selectedBranch.address || "",
          reference_num: selectedBranch.reference_num,
        }
      : null,

    columns: [
      { title: "Date",      dataKey: "date",      align: "center", width: 38 },
      { title: "Title",     dataKey: "title",     align: "left",   width: 40 },
      { title: "Category",  dataKey: "category",  align: "center", width: 50 },
      { title: "Amount",    dataKey: "amount",    align: "right",  width: 40 },
      { title: "Method",    dataKey: "method",    align: "center", width: 45 },
      { title: "Notes",     dataKey: "notes",     align: "left",   width: 65 },
    ],

    data: allExpenses,

    getRowData: (item: any) => {
      const amount = parseAmount(item.amount);

      return {
        date: format(new Date(item.date), "dd MMM yyyy"),
        title: item.title || "—",
        category: item.category?.title || "—",
        amount: `${currency} ${amount.toLocaleString("en-IN")}`,
        method: item.deposit_method === "bank" ? "Bank Transfer" : "Cash",
        notes: item.notes || "—",
      };
    },

    footerCallback: (doc: jsPDF, finalY: number) => {
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Total Expenses: ${currency} ${totalAmount.toLocaleString("en-IN")}`,
        14,
        finalY
      );
    },
  });

  function parseAmount(value: any): number {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const cleaned = value.replace(/[^0-9.-]/g, "");
      return parseFloat(cleaned) || 0;
    }
    return 0;
  }
}, [
  fetchAllExpensesFn,
  dateRange,
  filterBranchId,
  branchesList,
  convertCurrencySymbol,
]);

  const exportButtons = hasPermission(PERMISSIONS.EXPENSE_EXPORT) && (
    <div className="flex items-center gap-3">
      {hasPermission(PERMISSIONS.EXPENSE_EXPORT) && (
        <Button
          variant="outline"
          size="sm"
          onClick={exportPDF}
          disabled={!fetchAllExpensesFn}
        >
          <Download className="h-4 w-4 mr-2" />
          PDF
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Expense Management</h1>
        <div className="flex gap-3">
          {activeTab === "list" && exportButtons}
          {hasPermission(PERMISSIONS.EXPENSE_CREATE) && (
            <Button onClick={handleAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              Add {activeTab === "list" ? "Expense" : "Category"}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {hasPermission(PERMISSIONS.EXPENSE_VIEW) && (
          <>
            <TabsList className="inline-flex h-10 rounded-md bg-muted p-1">
              <TabsTrigger value="list">Expense</TabsTrigger>
              <TabsTrigger value="category">Expense Category</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-6">
              <ExpenseList onRegisterAdd={registerExpenseAdd} onSelectionChange={handleSelectionChange} />
            </TabsContent>

            <TabsContent value="category" className="mt-6">
              <ExpenseCategoryList onRegisterAdd={registerCategoryAdd} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
