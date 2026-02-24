import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Calendar, FileText, Download, Eye, Printer } from "lucide-react";
import Pagination from "@/components/shared/Pagination";
import CustomCheckbox from "@shared/CustomCheckbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { formatDateToShortString, formatTimeTo12Hour } from "@/utils/helper";

interface InvoicesProps {
  gymData: any;
  listGymData?: any;
}

export default function Invoices({ gymData, listGymData }: InvoicesProps) {
  const source = listGymData || gymData;
  const { gym, packages } = useSelector((state: RootState) => state.general);
  const { user } = useSelector((state: RootState) => state.auth);
  const invoices = source?.invoices || [];
  const currentInvoice = source?.current_invoice || null;

  const currency = source?.system_currency || "Rs";

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const isTrialPackage = source?.package_type === "trial";


  const getGymById = (gymId: number | string) => {
    return gym?.data?.find((g: any) => g.id === Number(gymId));
  };

  const getPackageById = (packageId: number | string) => {
    return packages?.data?.find((p: any) => p.id === Number(packageId));
  };

  const totalRecords = invoices.length;

  const getStatusBadge = (status: string = "") => {
    const s = status.toLowerCase();
    if (s === "paid" || s === "completed") {
      return <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20">Paid</Badge>;
    }
    if (s === "pending") {
      return <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">Pending</Badge>;
    }
    if (s === "failed" || s === "cancelled") {
      return <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20" variant="destructive">Failed</Badge>;
    }
    return <Badge variant="secondary">{status.toUpperCase() || "—"}</Badge>;
  };

  const openInvoiceModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setModalOpen(true);
  };

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Current Invoice
          </CardTitle>
          <CardDescription>All invoices associated with this gym</CardDescription>
        </div>

        {/* <Button variant="outline" className="gap-2" disabled={invoices.length === 0}>
          <Download className="h-4 w-4" />
          Export
        </Button> */}
      </CardHeader>

      <CardContent className="space-y-8">
        {isTrialPackage ? (
          <Card>
            <CardContent className="py-12 text-center space-y-2">
              <p className="font-medium">
                Trial package
              </p>
              <p className="text-sm text-muted-foreground">
                Trial subscriptions do not generate current invoice.
              </p>
            </CardContent>
          </Card>
        ) : currentInvoice ? (
          <Card>
            <CardHeader className="pb-3" />
            <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Reference</p>
                <p className="font-semibold">{currentInvoice.reference_num || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sub Total</p>
                <p className="font-semibold">
                  {currency} {Number(currentInvoice.sub_total || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grand Total</p>
                <p className="font-semibold">
                  {currency} {Number(currentInvoice.grand_total || 0).toLocaleString()}
                </p>
              </div>
                <div>
                  <p className="text-sm text-muted-foreground">Discount</p>
                  <p className="font-medium">{currentInvoice.discount_percent}%</p>
                </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {getStatusBadge(currentInvoice.payment_status)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Method</p>
                <p className="font-medium capitalize">{currentInvoice.deposit_method || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {formatDateToShortString(currentInvoice.package_start_date || "—")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Renewal Date</p>
                <p className="font-medium">
                  {formatDateToShortString(currentInvoice.package_renewal_date || "—")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium">
                  {formatDateToShortString(currentInvoice.date || "—")}{" "}
                  {currentInvoice.time ? `at ${formatTimeTo12Hour(currentInvoice.time)}` : ""}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{currentInvoice.desctiption || "—"}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No current invoice found
            </CardContent>
          </Card>
        )}


        <div className="rounded-lg overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              All Invoices
            </CardTitle>
            <CardDescription>All past and current Invoices records</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No invoices available yet
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.reference_num || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {invoice.date || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {currency} {Number(invoice.grand_total || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.payment_status)}</TableCell>
                    <TableCell className="capitalize">{invoice.deposit_method || "—"}</TableCell>
                    <TableCell>
                      {invoice.package_start_date || "—"} - {invoice.package_renewal_date || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openInvoiceModal(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalRecords={totalRecords}
            recordsPerPage={recordsPerPage}
            setRecordsPerPage={setRecordsPerPage}
            className="bg-theme-white"
            recordsPerPageOptions={[5, 10, 20, 50]}
          />
        </div>
      </CardContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl max-h-[95vh] flex flex-col">
          {selectedInvoice && (
            <>
              <div className="p-6 border-b bg-background">
                <DialogTitle className="text-xl font-bold">
                  Invoice Receipt
                </DialogTitle>
              </div>

              <div
                id="invoice-receipt-content"
                className="flex-1 overflow-y-auto px-8 pt-6 pb-8 bg-background scrollbar-thin"
              >
                <div className="max-w-2xl mx-auto">
                  <div className="text-center space-y-3 pb-8 border-b header">
                    <h2 className="text-2xl font-bold">{user?.system_company_name}</h2>
                    <p className="text-lg font-medium">Invoice Receipt</p>
                    <Badge
                      className={`font-medium px-3 py-1 ${selectedInvoice.payment_status?.toLowerCase() === "paid" ||
                        selectedInvoice.payment_status?.toLowerCase() === "completed"
                        ? "bg-green-100 text-green-600"
                        : "bg-amber-100 text-amber-700"
                        }`}
                    >
                      # {selectedInvoice.reference_num || "—"}
                    </Badge>
                  </div>

                  <div className="mt-8 space-y-8">
                    <div>
                      <p className="font-semibold text-lg mb-4 section-title">
                        Receipt Details
                      </p>
                      <div className="space-y-4">
                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">Date</span>
                          <span className="value">
                            {formatDateToShortString(selectedInvoice.date || "—")}
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">Time</span>
                          <span className="value">
                            {formatTimeTo12Hour(selectedInvoice.time || "00:00:00")}
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">Gym</span>
                          <div>
                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-muted rounded-md border">
                              {getGymById(selectedInvoice.gym_id)?.reference_num || "—"}
                            </span>{" "}
                            <span className="font-medium">
                              {getGymById(selectedInvoice.gym_id)?.company_name || "—"}
                            </span>
                          </div>
                        </div>

                        <p className="font-semibold text-lg mb-4 section-title mt-6">
                          Subscription Details
                        </p>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">Package</span>
                          <span className="value font-medium">
                            {getPackageById(selectedInvoice.package_id)?.name || "—"}
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">Start Date</span>
                          <span className="value">
                            {formatDateToShortString(selectedInvoice.package_start_date || "—")}
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">Renewal Date</span>
                          <span className="value">
                            {formatDateToShortString(selectedInvoice.package_renewal_date || "—")}
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">
                            Payment Method
                          </span>
                          <span className="value capitalize">
                            <Badge className="bg-blue-100 text-blue-800 px-4 py-1">
                              {selectedInvoice.deposit_method || "—"}
                            </Badge>
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">Status</span>
                          <span className="value">
                            {getStatusBadge(selectedInvoice.payment_status)}
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-end mt-6 pt-4 border-t">
                          <span className="label font-medium text-muted-foreground">Grand Total</span>
                          <span className="value">
                            {currency} {Number(selectedInvoice.grand_total || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="detail-row flex justify-between items-center">
                          <span className="label font-medium text-muted-foreground">Sub Total</span>
                          <span className="value">
                            {currency} {Number(selectedInvoice.sub_total || 0).toLocaleString()}
                          </span>
                        </div>

                          <div className="detail-row flex justify-between items-center">
                            <span className="label font-medium text-muted-foreground">Discount</span>
                            <span className="value">{selectedInvoice.discount_percent}%</span>
                          </div>

                        {Number(selectedInvoice.discount_percent || 0) > 0 && (
                          <div className="detail-row flex justify-between items-center">
                            <span className="label font-medium text-muted-foreground">Discount</span>
                            <span className="value">{selectedInvoice.discount_percent}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedInvoice.desctiption && (
                      <div className="bg-muted/50 rounded-lg p-6 border">
                        <p className="font-semibold mb-2 section-title">
                          Description / Notes
                        </p>
                        <p className="text-sm leading-relaxed text-foreground/90">
                          {selectedInvoice.desctiption}
                        </p>
                      </div>
                    )}

                    <div className="text-center space-y-2 pt-8 border-t mt-12 footer">
                      <p className="text-sm font-medium">
                        Generated by {selectedInvoice.created_by?.name || "System"}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
                  onClick={() => {
                    const content = document.getElementById("invoice-receipt-content")?.innerHTML;
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
                        margin-bottom: 0.5rem; 
                        font-size: 0.875rem; 
                      }
                      .label { color: #6b7280; }
                      .value { font-weight: 500; text-align: right; }
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
    </Card>
  );
}