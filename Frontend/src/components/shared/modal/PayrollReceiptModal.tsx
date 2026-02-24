import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS } from "@/permissions/permissions";
import { usePermissions } from "@/permissions/usePermissions";
import { formatDateToShortString } from "@/utils/helper";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface PayrollReceiptModalProps {
  receipt: any;
  open: boolean;
  onClose: () => void;
}

export default function PayrollReceiptModal({
  receipt,
  open,
  onClose,
}: PayrollReceiptModalProps) {
  if (!receipt) return null;
  const { user } = useSelector((state: RootState) => state.auth);

  const { hasPermission } = usePermissions();

  const handlePrint = () => {
    const printContent = document.getElementById(
      "payroll-receipt-content"
    )?.innerHTML;
    const win = window.open("", "", "width=800,height=600");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Payroll Slip #${receipt.id}</title>
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
            .badge { 
              padding: 0.25rem 0.5rem; 
              border-radius: 9999px; 
              background: #f3f4f6; 
              font-size: 0.75rem; 
              font-weight: 500; 
              color: #374151; 
            }
              .italic { font-style: italic; }
            .row {
              display:flex;
              align-items:center;
              gap:0.25rem;
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
    win.document.close();
    win.print();
  };

  const handleDownload = () => {
    handlePrint();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <DialogTitle className="text-xl font-bold">Payroll Slip</DialogTitle>
        </div>

        <div id="payroll-receipt-content" className="p-8 space-y-8">
          <div className="header text-center space-y-2">
            <h2 className="text-3xl font-bold">{user?.system_company_name}</h2>
            <p className="text-sm text-gray-600">Employee Payroll Slip</p>
            <Badge className="bg-secondary text-secondary-foreground font-medium px-3 py-1">
              # {receipt.reference_num}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <p className="section-title font-semibold text-lg">
                Employee Details
              </p>
              <div className="detail-row flex justify-between items-center">
                <span className="label">Name</span>
                <span className="value">{receipt.user?.name}</span>
              </div>
              <div className="detail-row flex justify-between items-center">
                <span className="label">ID</span>
                <span className="value">{receipt.user?.reference_num}</span>
              </div>
              <div className="detail-row flex justify-between items-center">
                <span className="label">Role</span>
                <span className="value capitalize">
                  {receipt.user?.user_type || "staff"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="section-title font-semibold text-lg">
                Payroll Details
              </p>
              <div className="detail-row flex justify-between items-center">
                <span className="label">Time Period</span>
                <span className="value">
                  {formatDateToShortString(receipt.period_start)} -{" "}
                  {formatDateToShortString(receipt.period_end)}
                  {/* {new Date(receipt.payroll_month + "-01").toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      year: "numeric",
                    }
                  )} */}
                </span>
              </div>
              <div className="detail-row flex justify-between items-center">
                <span className="label">Generated On</span>
                <span className="value">
                  {format(new Date(receipt.created_at), "dd MMM yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="space-y-4">
            <p className="section-title font-semibold text-lg">
              Salary Information
            </p>

            <div className="detail-row flex justify-between items-center">
              <span className="label">Basic Salary</span>
              <span className="value font-semibold">
                {receipt?.system_currency}{" "}
                {Number(receipt.basic_salary).toLocaleString()}
              </span>
            </div>

            {receipt.cheat_deduction > 0 && (
              <div className="detail-row flex justify-between items-center text-primary">
                <span className="label">Late/Early Deduction</span>
                <span className="value font-medium">
                  {receipt?.system_currency}{" "}
                  {Number(receipt.cheat_deduction).toFixed(2)}
                </span>
              </div>
            )}

            {receipt.absent_deduction > 0 && (
              <>
                <div className="detail-row flex justify-between items-center">
                  <span className="label">Absent Shifts</span>
                  <span className="value font-medium">
                    {receipt.shift_absent.map((s: any) => (
                      <span className="row value flex items-center gap-1 ">
                        <span className="badge text-[10px] bg-muted-foreground/10 px-1.5 py-0.5 rounded border">
                          {s.count}
                        </span>{" "}
                        {s.shift_type}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="detail-row flex justify-between items-center text-primary">
                  <span className="label">Absent Deduction</span>
                  <span className="value font-medium">
                    {receipt?.system_currency}{" "}
                    {Number(receipt.absent_deduction).toFixed(2)}
                  </span>
                </div>
              </>
            )}

            <div className="detail-row pt-4 border-t flex justify-between">
              <span className="text-lg font-semibold">Net Payable</span>
              <span className="amount">
                {receipt?.system_currency}{" "}
                {Number(receipt.net_payable).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-2 footer">
            <p className="text-sm text-gray-600">
              Generated by: {receipt.generated_by_user?.name || "System"}
            </p>
            <p className="text-xs text-gray-500 italic">
              Thank you for your dedication and hard work!
            </p>
            <p className="text-xs text-gray-500 italic ">
              Powered by snowberrysys.com
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t justify-end">
          <Button
            permission={PERMISSIONS.PAYROLL_EXPORT}
            variant="outline"
            onClick={handlePrint}
            className="flex items-center"
            disabled={!hasPermission(PERMISSIONS.PAYROLL_EXPORT)}
          >
            <span className="flex items-center">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </span>
          </Button>
          {/* <Button
            permission={PERMISSIONS.PAYROLL_EXPORT}
            onClick={handleDownload}
            className="flex items-center"
          >
            <span className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </span>
          </Button> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
