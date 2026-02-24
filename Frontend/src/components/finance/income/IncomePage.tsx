// src/pages/finance/IncomePage.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import IncomeCategoryList from "./IncomeCategoryList";
import IncomeList from "./IncomeList";
import { PERMISSIONS } from "@/permissions/permissions";
import { usePermissions } from "@/permissions/usePermissions";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { useState, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { exportToPDF } from "@/utils/exportToPdf";
import { useSelector } from "react-redux";
import { toast } from "@/hooks/use-toast";

export default function IncomePage() {
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState("list");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(undefined);
  const { branchesList } = useSelector((state: any) => state.plan);



  // Selection state from IncomeList
  // const [selectedCount, setSelectedCount] = useState(0);
  // const [selectedData, setSelectedData] = useState<any[]>([]);
  const [fetchAllIncomesFn, setFetchAllIncomesFn] = useState<(() => Promise<any[]>) | null>(null);

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
    (count, data, fetchAllFn, selectedDateRange) => {
      if (fetchAllFn) setFetchAllIncomesFn(() => fetchAllFn);
      if (selectedDateRange) setDateRange(selectedDateRange);
    },
    []
  );


  let openIncomeAdd = () => { };
  let openCategoryAdd = () => { };

  const registerIncomeAdd = (fn: () => void) => { openIncomeAdd = fn; };
  const registerCategoryAdd = (fn: () => void) => { openCategoryAdd = fn; };

  const handleAddClick = () => {
    if (activeTab === "list") openIncomeAdd();
    else if (activeTab === "category") openCategoryAdd();
  };

  const exportPDF = useCallback(async () => {
  if (!fetchAllIncomesFn) return;

  const allIncomes = await fetchAllIncomesFn();

  if (allIncomes.length === 0) {
    toast({ title: "No income records to export", variant: "destructive" });
    return;
  }

  const selectedBranch = filterBranchId
    ? branchesList?.find((b: any) => b.id === Number(filterBranchId))
    : null;

  console.log('selectedBranch', selectedBranch);

  const rawCurrency = allIncomes[0]?.system_currency || "Rs";
  const currency = convertCurrencySymbol(rawCurrency);

  const totalAmount = allIncomes.reduce((sum: number, item: any) => {
    return sum + parseAmount(item.amount);
  }, 0);

  exportToPDF({
    title: "Income Report",
    // subtitle: `${allIncomes.length} record${allIncomes.length !== 1 ? "s" : ""}`,
    filenamePrefix: "Income_Report",

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
      { title: "Date",      dataKey: "date",      align: "center", width: 35 },
      { title: "Title",     dataKey: "title",     align: "left",   width: 40 },
      { title: "Reference", dataKey: "reference", align: "left",   width: 30 },
      { title: "Category",  dataKey: "category",  align: "center", width: 40 },
      { title: "Amount",    dataKey: "amount",    align: "center", width: 40 },
      { title: "Method",    dataKey: "method",    align: "center", width: 40 },
      { title: "Notes",     dataKey: "notes",     align: "left",   width: 50 },
    ],

    data: allIncomes,

    getRowData: (item: any) => {
      const amount = parseAmount(item.amount);

      return {
        date: format(new Date(item.date), "dd MMM yyyy"),
        title: item.title || "—",
        reference: item.reference_num || "—",
        category: item.category?.title || "—",
        amount: `${currency} ${amount.toLocaleString("en-IN")}`,
        method: item.deposit_method === "bank" ? "Bank Transfer" : "Cash",
        notes: item.notes || "—",
      };
    },

    footerCallback: (doc: jsPDF, finalY: number) => {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94);
      doc.text(
        `Total Income: ${currency} ${totalAmount.toLocaleString("en-IN")}`,
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
  fetchAllIncomesFn,
  dateRange,           
  filterBranchId,      
  branchesList,       
  convertCurrencySymbol,
]);
  // PDF Export — only selected records
  //   const exportPDF = useCallback(() => {
  //   if (selectedData.length === 0) return;

  //   // Get currency from the first selected record (or fallback)
  //   const rawCurrency = selectedData[0]?.Currency || "Rs";
  //     const currency = convertCurrencySymbol(rawCurrency);

  //   const doc = new jsPDF("l", "mm", "a4");

  //   // Header
  //   doc.setFontSize(18);
  //   doc.text("Income Report", 14, 20);
  //   doc.setFontSize(11);
  //   doc.text(`Generated: ${format(new Date(), "dd MMM yyyy")} • ${selectedData.length} record(s)`, 14, 30);

  //   // Date Range
  //   let periodY = 38;
  //   doc.setFontSize(11);
  //   doc.setTextColor(12);
  //   if (selectedData.length > 0 && selectedData[0]?.Date) {
  //     const dates = selectedData
  //       .map((inc: any) => new Date(inc.Date))
  //       .filter((d: any) => !isNaN(d));
  //     if (dates.length > 0) {
  //       const minDate = new Date(Math.min(...dates));
  //       const maxDate = new Date(Math.max(...dates));
  //       doc.text(`Date Range: ${format(minDate, "dd MMM yyyy")} – ${format(maxDate, "dd MMM yyyy")}`, 14, periodY);
  //     } else {
  //       doc.text("Date Range: All Time", 14, periodY);
  //     }
  //   } else {
  //     doc.text("Date Range: All Time", 14, periodY);
  //   }
  //   doc.setTextColor(0, 0, 0);

  //   // Table data — use dynamic currency
  //   const tableData = selectedData.map((inc: any) => [
  //     inc.Date || "—",
  //     inc.Title || "—",
  //     inc.Category || "—",
  //     `${currency} ${Number(inc.Amount).toLocaleString("en-IN")}`,
  //     inc["Payment Method"] || "—",
  //     inc.Notes || "—",
  //   ]);

  //   autoTable(doc, {
  //     head: [["Date", "Title", "Category", "Amount", "Method", "Notes"]],
  //     body: tableData,
  //     startY: 48,
  //     styles: { fontSize: 9.5, cellPadding: 6, overflow: 'linebreak', lineHeight: 1.5, minCellHeight:12 },
  //     headStyles: {
  //       fillColor: [34, 197, 94],
  //       textColor: [255, 255, 255],
  //       fontStyle: 'bold',
  //       fontSize: 10,
  //     },
  //     alternateRowStyles: { fillColor: [240, 253, 244] },
  //     columnStyles: {
  //       0: { cellWidth: 38 },
  //       1: { cellWidth: 38 },
  //       2: { cellWidth: 38 },
  //       3: { cellWidth: 38, halign: 'right' },
  //       4: { cellWidth: 32 },
  //       5: { cellWidth: 55 },
  //     },
  //   });

  //   // Total at bottom — also use dynamic currency
  //   const total = selectedData.reduce((sum: number, inc: any) => sum + Number(inc.Amount), 0);
  //   const finalY = (doc as any).lastAutoTable.finalY + 10;
  //   doc.setFontSize(14);
  //   doc.setTextColor(34, 197, 94);
  //   doc.text(`Total Selected: ${currency} ${total.toLocaleString("en-IN")}`, 14, finalY);

  //   doc.save(`Income_Selected_${selectedCount}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  // }, [selectedData, selectedCount]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Income Management</h1>

        <div className="flex gap-3">
          {activeTab === "list" && hasPermission(PERMISSIONS.INCOME_EXPORT) && (
            // <Button variant="outline" size="sm" onClick={exportPDF}>
            //   <Download className="h-4 w-4 mr-2" />
            //   PDF 
            // </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportPDF}
              disabled={!fetchAllIncomesFn}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}
          {hasPermission(PERMISSIONS.INCOME_CREATE) && (
            <Button onClick={handleAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              Add {activeTab === "list" ? "Income" : "Category"}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="inline-flex h-10 rounded-md bg-muted p-1 mb-6">
          {hasPermission(PERMISSIONS.INCOME_VIEW) && (
            <>
              <TabsTrigger value="list">Income</TabsTrigger>
              <TabsTrigger value="category">Income Category</TabsTrigger>
            </>
          )}
        </TabsList>

        {hasPermission(PERMISSIONS.INCOME_VIEW) && (
          <>
            <TabsContent value="list" className="mt-6">
              <IncomeList
                onRegisterAdd={registerIncomeAdd}
                onSelectionChange={handleSelectionChange}
              />
            </TabsContent>
            <TabsContent value="category" className="mt-6">
              <IncomeCategoryList onRegisterAdd={registerCategoryAdd} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}