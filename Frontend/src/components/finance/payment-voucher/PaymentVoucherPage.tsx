// src/pages/finance/payment-voucher/PaymentVoucherPage.tsx

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import PaymentVoucherList from "./PaymentVoucherList";
import { usePermissions } from "@/permissions/usePermissions";
import { PERMISSIONS } from "@/permissions/permissions";
import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { exportToPDF } from "@/utils/exportToPdf"; // Note: you had exportToPdf (lowercase f) — correct it if needed
import { useSelector } from "react-redux";

function convertCurrencySymbol(symbol: string): string {
  if (!symbol) return "";
  if (symbol === "\u20a8") {
    return "Rs";
  }
  return symbol;
}

export default function PaymentVoucherPage() {
  const [fetchAllVouchersFn, setFetchAllVouchersFn] = useState<
    (() => Promise<any[]>) | null
  >(null);
  const { hasPermission } = usePermissions();

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined
  );

  const { branchesList } = useSelector((state: any) => state.plan);

  const handleSelectionChange = useCallback(
    (
      count: number,
      data: any[],
      fetchAllFn?: () => Promise<any[]>,
      selectedDateRange?: { from?: Date; to?: Date },
      selectedBranchId?: string
    ) => {
      if (fetchAllFn) setFetchAllVouchersFn(() => fetchAllFn);
      if (selectedDateRange) setDateRange(selectedDateRange);
      if (selectedBranchId !== undefined) setFilterBranchId(selectedBranchId);
    },
    []
  );

  const exportPDF = useCallback(async () => {
    if (!fetchAllVouchersFn) return;

    const allVouchers = await fetchAllVouchersFn();

    if (allVouchers.length === 0) {
      toast({ title: "No payment vouchers to export", variant: "destructive" });
      return;
    }

    const selectedBranch = filterBranchId
      ? branchesList?.find((b: any) => b.id === Number(filterBranchId))
      : null;

    const rawCurrency = allVouchers[0]?.system_currency || "Rs";
    const currency = convertCurrencySymbol(rawCurrency);

    const totalAmount = allVouchers.reduce((sum: number, v: any) => {
      return (
        sum +
        Number(v.credit_amount || v.debit_amount || v.fee_collection?.amount || 0)
      );
    }, 0);

    exportToPDF({
      title: "Payment Vouchers Report",
      // subtitle: `${allVouchers.length} record${allVouchers.length !== 1 ? "s" : ""}`,
      filenamePrefix: "Payment_Vouchers",

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
        { title: "Voucher ID", dataKey: "voucherId", align: "center", width: 45 },
        { title: "Date", dataKey: "date", align: "center", width: 45 },
        { title: "Type", dataKey: "type", align: "center", width: 45 },
        { title: "Source", dataKey: "source", align: "left", width: 45 },
        { title: "Amount", dataKey: "amount", align: "center", width: 45 },
        { title: "Method", dataKey: "method", align: "center", width: 45 },
      ],

      data: allVouchers,

      getRowData: (v: any) => ({
        voucherId: v.reference_num || "—",
        date: format(new Date(v.date), "dd MMM yyyy"),
        type: v.transaction_type,
        source: v.source,
        amount: `${currency} ${Number(
          v.credit_amount || v.debit_amount || v.fee_collection?.amount || 0
        ).toLocaleString("en-IN")}`,
        method: (v.payment_method || "—").toUpperCase(),
      }),

      footerCallback: (doc: jsPDF, finalY: number) => {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(34, 197, 94);
        doc.text(
          `Total Amount: ${currency} ${totalAmount.toLocaleString("en-IN")}`,
          14,
          finalY
        );
      },
    });
  }, [
    fetchAllVouchersFn,
    dateRange,
    filterBranchId,
    branchesList,
    convertCurrencySymbol,
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Payment Voucher</h1>

        <div className="flex gap-3">
          {hasPermission(PERMISSIONS.LEDGER_EXPORT) && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportPDF}
              disabled={!fetchAllVouchersFn}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}
        </div>
      </div>

      <PaymentVoucherList
        onSelectionChange={handleSelectionChange}
        currentBranchId={filterBranchId}
      />
    </div>
  );
}