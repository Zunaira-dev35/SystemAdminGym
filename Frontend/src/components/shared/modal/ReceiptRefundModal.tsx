// components/fee/ReceiptViewModal.tsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, Download, X } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS } from "@/permissions/permissions";
import { usePermissions } from "@/permissions/usePermissions";
import { formatDateToShortString, formatTimeTo12Hour } from "@/utils/helper";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface ReceiptRefundModalProps {
  receipt: any;
  open: boolean;
  onClose: () => void;
  type?: "fee" | "transfer" | "advance";
  title?: string;
}

export default function ReceiptRefundModal({
  receipt,
  open,
  onClose,
  type,
  title,
}: ReceiptRefundModalProps) {
  if (!receipt) return null;
  console.log("receipt", receipt);

    const { user } = useSelector((state: RootState) => state.auth);

  const handlePrint = () => {
    const printContent = document.getElementById("receipt-content")?.innerHTML;
    const win = window.open("", "", "width=800,height=600");
    win?.document.write(`
      <html>
        <head>
          <title>Receipt ${receipt.reference_num}</title>
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
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 0.5rem; 
              font-size: 0.875rem; 
            }
            .label { color: #6b7280; }
            .value { font-weight: 500; }
            .amount { 
              font-size: 1.5rem; 
              font-weight: 700; 
              color: #16a34a; 
              text-align: right; 
            }
            .footer { 
              text-align: center; 
              margin-top: 2rem; 
              font-size: 0.75rem; 
              color: #6b7280; 
              border-top: 1px solid #e5e7eb; 
              padding-top: 1rem; 
            }
              .italic { font-style: italic; }
            .badge { 
              padding: 0.25rem 0.5rem; 
              border-radius: 9999px; 
              background: #f3f4f6; 
              font-size: 0.75rem; 
              font-weight: 500; 
              color: #374151; 
            }
            @media print {
              body { padding: 1rem; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    win?.document.close();
    win?.print();
  };

  const handleDownload = () => {
    // Similar to print, but trigger download
    handlePrint(); // Reuse print logic for PDF preview
    // For real PDF, you'd need html2pdf or similar - but this opens printable view
  };
  const { hasPermission } = usePermissions();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl max-h-[95vh] ">
        <div className="flex items-center justify-between p-6 border-b ">
          <DialogTitle className="text-xl font-bold">
            {title || "Fee Refund Receipt"}
          </DialogTitle>
          {/* <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button> */}
        </div>

        <div
          id="receipt-content"
          className="p-8 space-y-8 overflow-y-auto px-6 pb-6 h-[calc(100vh-120px)] sm:h-auto sm:max-h-[70vh] scrollbar-thin"
        >
          {/* Header */}
          <div className="header text-center space-y-2">
            <h2 className="text-3xl font-bold">{user?.system_company_name}</h2>
            <p className="text-sm text-gray-600">
              {title || "Fee Refund Receipt"}
            </p>
            <Badge className="bg-secondary text-secondary-foreground font-medium px-3 py-1">
              #{receipt?.reference_num}
            </Badge>
          </div>

          {/* Member & Date */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="section-title font-semibold text-lg">
                Member Details
              </p>
              <div className="detail-row flex justify-between items-center">
                <span className="label">Name</span>
                <span className="value">{receipt?.user?.name}</span>
              </div>
              <div className="detail-row flex justify-between items-center">
                <span className="label">ID</span>
                {receipt?.user?.reference_num ? (
                  <span className="value">{receipt?.user?.reference_num}</span>
                ) : (
                  <span className="text-muted-foreground italic text-sm">
                    Deleted Member
                  </span>
                )}
              </div>
            </div>
            {/* <Separator className="my-4 " /> */}

            <div className="space-y-1 ">
              <p className="section-title font-semibold text-lg">
                Receipt Details
              </p>
              <div className="detail-row flex justify-between items-center">
                <span className="label">Date</span>
                <span className="value">
                  {format(
                    new Date(receipt?.transaction?.date || receipt?.date),
                    "dd MMM yyyy",
                  )}
                </span>
              </div>
              <div className="detail-row flex justify-between items-center">
                <span className="label">Time</span>
                <span className="value">
                  {formatTimeTo12Hour(
                    receipt?.transaction?.time || receipt?.generate_time,
                  )}
                </span>
              </div>
              <div className="detail-row flex justify-between items-center">
                <span className="label">Branch</span>
                <div>
                  <span className="badge text-[10px] bg-muted-foreground/10 px-1.5 py-0.5 rounded border">
                    {receipt?.branch?.reference_num || "-"}
                  </span>{" "}
                  <span className="value">{receipt?.branch?.name || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* <Separator className="my-4 " /> */}

          {/* Payment Info */}
          <div className="space-y-4">
            <p className="section-title font-semibold text-lg">
              Plan Information
            </p>
            <div className="detail-row flex justify-between items-center">
              <span className="label">Plan</span>
              <span className="value font-semibold flex items-center gap-2 max-w-md">
                <>
                  <span className="badge text-[10px] bg-muted-foreground/10 px-1.5 py-0.5 rounded border">
                    {receipt?.plan?.reference_num}
                  </span>
                  <span>{receipt?.plan?.name}</span>
                </>
              </span>
            </div>
            <div className="detail-row flex justify-between items-center">
              <span className="label">Plan fee</span>
              <span className="value font-semibold">
                {receipt?.system_currency || "Rs."}{" "}
                {receipt?.plan?.fee.toLocaleString()}
              </span>
            </div>
            <div className="detail-row flex justify-between">
              <span className="label">Method</span>
              <Badge className="bg-gray-100 text-gray-800 capitalize">
                {receipt?.transaction?.payment_method}
              </Badge>
            </div>
            {receipt.deposit_method === "bank" &&
              (receipt?.transaction?.bank || receipt?.bank) && (
                <div className="detail-row flex justify-between">
                  <span className="label">Bank Name</span>
                  <div className="value ">
                    {
                      (type === "advance"
                        ? (
                            <div className="space-x-1">
                              <span className="badge text-[10px] bg-muted-foreground/10 px-1.5 py-0.5 rounded border">
                                {receipt?.bank?.reference_num}
                              </span>
                              <span>{receipt?.bank?.name}</span>
                            </div>
                          )
                        : (receipt?.transaction?.bank || receipt?.bank) && (
                            <div className="space-x-1">
                              <span className="badge text-[10px] bg-muted-foreground/10 px-1.5 py-0.5 rounded border">
                                {receipt?.transaction?.bank?.reference_num ||
                                  receipt?.bank?.reference_num}
                              </span>
                              <span>
                                {receipt?.transaction?.bank?.name ||
                                  receipt?.bank?.name}
                              </span>
                            </div>
                          ))}
                  </div>
                </div>
              )}
            <div className="detail-row flex justify-between">
              <span className="label">Transaction Type</span>
              <span className="value font-semibold capitalize">
                {receipt?.transaction?.transaction_type}
              </span>
            </div>
            <div className="detail-row pt-4 border-t flex justify-between">
              <span className="text-lg font-semibold">Total Refund</span>
              <span className="amount">
                <>
                  {receipt?.system_currency || "Rs."}{" "}
                  {receipt?.transaction?.debit_amount.toLocaleString()}
                </>
              </span>
            </div>
          </div>
          {/* Collected By */}
          {/* <Separator className="my-4 " /> */}
          <div className="text-center space-y-2 footer">
            <p className="text-sm text-gray-600">
              Collected by: {receipt?.created_by.name}
            </p>
            {/* <p className="text-xs text-gray-500 italic">
              Thank you for your payment! Your membership is now active.
            </p> */}
            <p className="text-xs text-gray-500 italic ">
              Powered by snowberrysys.com
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t justify-end">
          <Button
            permission={PERMISSIONS.FEE_COLLECTION_EXPORT}
            variant="outline"
            onClick={handlePrint}
            className="flex items-center"
            disabled={!hasPermission(PERMISSIONS.FEE_COLLECTION_EXPORT)}
          >
            <span className=" flex items-center">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </span>
          </Button>
          {/* <Button
            permission={PERMISSIONS.FEE_COLLECTION_EXPORT}
            onClick={handleDownload}
          >
            <span className=" flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </span>
          </Button> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
