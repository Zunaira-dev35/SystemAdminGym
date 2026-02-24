import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Package, Clock, Plus } from "lucide-react";
import Pagination from "@/components/shared/Pagination";

interface SubscriptionHistoryProps {
  gymData: any;
  remainingDays: number;
  totalDays: number;
  usedDays: number;
  branchUsed: number;
  branchTotal: number;
}

export default function SubscriptionHistory({
  gymData,
  remainingDays,
  totalDays,
  usedDays,
  branchUsed,
  branchTotal,
}: SubscriptionHistoryProps) {
  const histories = gymData?.subscription_histories || [];
  const currentInvoice = gymData?.current_invoice;
  const allInvoices = gymData?.invoices || [];

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const totalRecords = histories.length;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Current Subscription
          </CardTitle>
          <CardDescription>Active package and renewal information</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Invoice Ref</p>
            <p className="font-medium">{currentInvoice.reference_num || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Package</p>
            <p className="text-lg font-medium">{gymData?.package_name || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-lg font-medium">
              {gymData?.system_currency || "Rs"}{" "}
              {Number(gymData?.price || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="text-lg font-medium">{gymData?.duration || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge
              variant="outline"
              className={
                gymData?.status === "active"
                  ? "bg-chart-3/10 text-chart-3 border-chart-3"
                  : "bg-chart-4/10 text-chart-4 border-chart-4"
              }
            >
              {gymData?.status?.toUpperCase() || "UNKNOWN"}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Started</p>
            <p className="font-medium">{gymData?.package_start_date || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Renews On</p>
            <p className="font-medium">{gymData?.package_renewal_date || "—"}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Billing Overview
          </CardTitle>
          <CardDescription>
            Overview of total payments across all subscriptions
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="p-6 rounded-xl border bg-background">
              <p className="text-sm text-muted-foreground mb-1">
                Total Paid Amount
              </p>
              <p className="text-2xl font-semibold text-chart-3">
                {gymData?.system_currency || "Rs"}{" "}
                {Number(gymData?.paid_payment || 0).toLocaleString()}
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-background">
              <p className="text-sm text-muted-foreground mb-1">
                Total Pending Amount
              </p>
              <p className="text-2xl font-semibold text-amber-600">
                {gymData?.system_currency || "Rs"}{" "}
                {Number(gymData?.pending_payment || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Subscription History
          </CardTitle>
          <CardDescription>All past and current subscription records</CardDescription>
        </CardHeader>
        <CardContent>
          {histories.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No subscription history available yet
            </div>
          ) : (
            <>
              <div className="rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference ID</TableHead>
                      <TableHead>Gym</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Renewal Date</TableHead>
                      <TableHead>Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {histories.map((history: any) => (
                      <TableRow key={history.id}>
                        <TableCell>
                          {history.gym_reference_num}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{history?.gym_name || "-"}</div>
                        </TableCell>
                        <TableCell>
                          {history.package_name}
                        </TableCell>
                        <TableCell>
                          {history.package_start_date}
                        </TableCell>
                        <TableCell>
                          {history.package_renewal_date}
                        </TableCell>
                        <TableCell>
                          {history.invoice_id ? (
                            // <Badge variant="outline">
                            //   {allInvoices.find((inv: any) => inv.id === history.invoice_id)?.reference_num ||
                            //     `${history.invoice_id}`}
                            // </Badge>
                            <span>{history.invoice_reference_num || "-"}</span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}