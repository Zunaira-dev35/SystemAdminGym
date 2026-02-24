import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  getInvoiceAsyncThunk,
  updateInvoiceAsyncThunk,
  getInvoiceViewAsyncThunk,
} from "@/redux/pagesSlices/generalSlice";

import {
  Card,
  CardContent,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Building2, Eye, Edit, FileText, Printer } from "lucide-react";
import Pagination from "@/components/shared/Pagination";
import Loading from "@/components/shared/loaders/Loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { formatDateToShortString, formatTimeTo12Hour } from "@/utils/helper";

export default function Invoices() {
  const dispatch = useDispatch<AppDispatch>();
  const { gym, packages, loadings } = useSelector((state: RootState) => state.general);
  const invoicesData = useSelector((state: RootState) => state.general.invoice);
  const { user } = useSelector((state: RootState) => state.auth);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [gymIdFilter, setGymIdFilter] = useState("");
  const [depositMethod, setDepositMethod] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [originalPaymentStatus, setOriginalPaymentStatus] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({
    invoice_id: "",
    discount_percent: "",
    description: "",
    deposit_method: "cash",
    payment_status: "pending",
  });
  const [editLoading, setEditLoading] = useState(false);

  const isLoading = loadings?.getInvoice || loadings?.getGym;

  useEffect(() => {
    const params: any = {
      page: currentPage,
      limit: recordsPerPage,
      // disable_page_param: 1,
    };

    if (search) params.search = search;
    if (paymentStatus) params.filter_payment_status = paymentStatus;
    if (depositMethod) params.filter_deposit_method = depositMethod;

    dispatch(getInvoiceAsyncThunk(params));
  }, [
    dispatch,
    currentPage,
    recordsPerPage,
    search,
    paymentStatus,
    depositMethod,
  ]);


  const allInvoices = invoicesData?.data || [];
  const totalRecords = invoicesData?.total || allInvoices.length;
  const currency = gym?.data?.[0]?.system_currency || "Rs";


  const getStatusBadge = (status: string = "") => {
    const s = status.toLowerCase();
    if (s === "paid" || s === "completed") {
      return <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20">Paid</Badge>;
    }
    if (s === "pending") {
      return <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">Pending</Badge>;
    }
    if (s === "failed" || s === "cancelled") {
      return <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20" variant="destructive">
        Failed
      </Badge>;
    }
    return <Badge variant="secondary">{status.toUpperCase() || "—"}</Badge>;
  };


  const openEditModal = (invoice: any) => {
    setEditForm({
      invoice_id: invoice.id,
      discount_percent: invoice.discount_percent || 0,
      description: invoice.desctiption || "",
      deposit_method: invoice.deposit_method || "cash",
      payment_status: invoice.payment_status || "pending",
    });
    setOriginalPaymentStatus(invoice.payment_status);
    setEditModalOpen(true);
  };

  const handleEditChange = (field: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleUpdateInvoice = async () => {
    if (!editForm.invoice_id) return;

    setEditLoading(true);

    try {
      const payload = {
        invoice_id: editForm.invoice_id,
        discount_percent: Number(editForm.discount_percent) || 0,
        description: editForm.description.trim(),
        deposit_method: editForm.deposit_method,
        payment_status: editForm.payment_status,
      };

      await dispatch(updateInvoiceAsyncThunk({ data: payload })).unwrap();

      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });

      dispatch(
        getInvoiceAsyncThunk({
          page: currentPage,
          limit: recordsPerPage,
          search,
          filter_payment_status: paymentStatus,
          filter_gym_id: gymIdFilter,
          filter_deposit_method: depositMethod,
        })
      );

      setEditModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.errors || "Failed to update invoice",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="p-4">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <p className="text-muted-foreground">Manage your gym's invoices</p>
      </div>

      <Card className="border">
        <div className="flex items-center justify-between py-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              All Invoices
            </CardTitle>
          </CardHeader>
          <div className="pr-8">
            <div className="flex flex-wrap justify-end gap-4 mb-4">
              <div>
                <Input
                  placeholder="Search by reference..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div>
                <Select
                  value={paymentStatus || "all"}
                  onValueChange={(val) => {
                    setPaymentStatus(val === "all" ? "" : val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Payment Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={depositMethod || "all"}
                  onValueChange={(val) => {
                    setDepositMethod(val === "all" ? "" : val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Deposit Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(search || paymentStatus || gymIdFilter || depositMethod) && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setPaymentStatus("");
                      setGymIdFilter("");
                      setDepositMethod("");
                      setCurrentPage(1);
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <CardContent>
          {isLoading ? (
            <div className="py-6 flex justify-center">
              <Loading />
            </div>
          ) : allInvoices.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No invoice found
            </div>
          ) : (
            <>
              <div className="rounded-lg overflow-x-auto mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {allInvoices.map((invoice: any) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.reference_num || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {formatDateToShortString(invoice.date || "—")}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {currency}{" "}
                          {Number(invoice.grand_total || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.payment_status)}</TableCell>
                        <TableCell className="capitalize">
                          {invoice.deposit_method || "—"}
                        </TableCell>
                        <TableCell className="truncate">
                          {invoice.desctiption || "—"}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setReceiptModalOpen(true);
                            }}
                            disabled={receiptLoading}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(invoice)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
            </>
          )}

          <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
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
                          #{selectedInvoice.reference_num || "—"}
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
                                {formatDateToShortString(selectedInvoice.date) || "—"}
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
                                  {selectedInvoice.gym?.reference_num || "—"}
                                </span>{" "}
                                <span>{selectedInvoice?.gym?.company_name}</span>
                                {/* {(() => {
                                  const matchedGym = getGymById(selectedInvoice.gym_id);
                                  return (
                                    <>
                                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-muted rounded-md border">
                                        {matchedGym?.reference_num || selectedInvoice.gym?.reference_num || "—"}
                                      </span>{" "}
                                      <span className="font-medium">
                                        {matchedGym?.company_name || "Unknown Gym"}
                                      </span>
                                    </>
                                  );
                                })()} */}
                              </div>
                            </div>

                            <p className="font-semibold text-lg mb-4 section-title mt-6">
                              Subscription Details
                            </p>

                            <div className="detail-row flex justify-between items-center">
                              <span className="label font-medium text-muted-foreground">Package</span>
                              <span className="value font-medium">
                                  {selectedInvoice?.package?.name || "—"}
                                {/* {getPackageById(selectedInvoice.package_id)?.name ||
                                  selectedInvoice.package_name ||
                                  "—"} */}
                              </span>
                            </div>

                            <div className="detail-row flex justify-between items-center">
                              <span className="label font-medium text-muted-foreground">Start Date</span>
                              <span className="value">
                                {formatDateToShortString(selectedInvoice.package_start_date) || "—"}
                              </span>
                            </div>

                            <div className="detail-row flex justify-between items-center">
                              <span className="label font-medium text-muted-foreground">Renewal Date</span>
                              <span className="value">
                                {formatDateToShortString(selectedInvoice.package_renewal_date) || "—"}
                              </span>
                            </div>

                            <div className="detail-row flex justify-between items-center">
                              <span className="label font-medium text-muted-foreground">
                                Payment Method
                              </span>
                              <span className="value capitalize">
                                <Badge variant="outline" className="px-4 py-1">
                                  {selectedInvoice.deposit_method || "—"}
                                </Badge>
                              </span>
                            </div>

                            <div className="detail-row flex justify-between items-center">
                              <span className="label font-medium text-muted-foreground">Status</span>
                              <span className="value">{getStatusBadge(selectedInvoice.payment_status)}</span>
                            </div>

                            <div className="detail-row flex justify-between items-end mt-6 pt-4 border-t">
                              <span className="detail-row flex justify-between items-center">Grand Total</span>
                              <span className="value">
                                {currency}{" "}
                                {Number(selectedInvoice.grand_total || 0).toLocaleString()}
                              </span>
                            </div>

                            <div className="detail-row flex justify-between items-center">
                              <span className="label font-medium text-muted-foreground">Sub Total</span>
                              <span className="value">
                                {currency}{" "}
                                {Number(selectedInvoice.sub_total || 0).toLocaleString()}
                              </span>
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
                            <p className="font-semibold mb-2 section-title">Description / Notes</p>
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

                  <div className="p-6 border-t bg-background flex justify-end flex-shrink-0 gap-3">
                    <Button variant="outline" onClick={() => setReceiptModalOpen(false)}>
                      Close
                    </Button>
                    <Button
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
                      body { font-family: 'Inter', sans-serif; padding: 2rem; color: #1f2937; background: white; max-width: 800px; margin: 0 auto; }
                      .header { text-align: center; margin-bottom: 2rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; }
                      .section-title { font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: #374151; }
                      .badge { padding: 0.25rem 0.5rem; border-radius: 9999px; background: #f3f4f6; font-size: 0.75rem; font-weight: 500; color: #374151; }
                      .detail-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.875rem; }
                      .label { color: #6b7280; }
                      .value { font-weight: 500; text-align: right; }
                      .footer { text-align: center; margin-top: 2rem; font-size: 0.75rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 1rem; }
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
                        setTimeout(() => win.print(), 300);
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

          <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-primary" />
                  Update Invoice – {allInvoices.find((inv: any) => inv.id === editForm.invoice_id)?.reference_num || "—"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <input type="hidden" value={editForm.invoice_id} />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Discount Percent</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.discount_percent}
                    onChange={(e) => handleEditChange("discount_percent", e.target.value)}
                    placeholder="0-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => handleEditChange("description", e.target.value)}
                    placeholder="Enter description..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Deposit Method</label>
                  <Select
                    value={editForm.deposit_method}
                    onValueChange={(val) => handleEditChange("deposit_method", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Status</label>
                  <Select
                    value={editForm.payment_status}
                    onValueChange={(val) => handleEditChange("payment_status", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={editLoading}>
                  Cancel
                </Button>
                {/* <Button onClick={handleUpdateInvoice} disabled={editLoading }> */}
                <Button onClick={handleUpdateInvoice} disabled={editLoading || (originalPaymentStatus === "paid" && editForm.payment_status === "paid")}>
                  {editLoading ? "Updating..." : "Update Invoice"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}