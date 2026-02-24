import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { RootState, AppDispatch } from "@/redux/store";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

import {
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Building2,
  Download,
} from "lucide-react";
import CustomCheckbox from "@shared/CustomCheckbox";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useCallback } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import Pagination from "@/components/shared/Pagination";
import { PERMISSIONS } from "@/permissions/permissions";
import DeleteConfirmationModal from "@/components/shared/modal/DeleteConfirmationModal";
import { get, set } from "lodash";
import Loading from "@/components/shared/loaders/Loading";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/permissions/usePermissions";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { createBankAsyncThunk, getBanksAsyncThunk } from "@/redux/pagesSlices/financeSlice";
import { exportToPDF } from "@/utils/exportToPdf";

// import { getAllPlansAsyncThunk } from "@/redux/pagesSlices/peopleSlice";

interface BankFormData {
  id?: number;
  name: string;
  account_num: string;
}

function convertCurrencySymbol(symbol: string): string {
  if (!symbol) return "";
  if (symbol === "\u20a8") {
    return "Rs";
  }
  return symbol;
}

export default function Bank() {
  const dispatch = useDispatch<AppDispatch>();
  const { getBanks, loadings } = useSelector((state: RootState) => state.finance);
  const { selectedBranchId } = useSelector((state: any) => state.general);
  const { branchesList } = useSelector((state: any) => state.plan);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<any>(null);
  const [confirmToggle, setConfirmToggle] = useState<{
    id: number;
    current: string;
  } | null>(null);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(
    undefined
  );

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const { hasPermission } = usePermissions();
  const { user } = useSelector((state: any) => state.auth);

  const [formData, setFormData] = useState<BankFormData>({
    name: "",
    account_num: "",
    // fee: "",
    // duration_days: "",
    // branch_id: "1", // default main branch
  });

  // Fetch banks
  const fetchBanks = async () => {
    try {
      await dispatch(
        getBanksAsyncThunk({
          params: {
            search: searchTerm,
            limit: recordsPerPage,
            page: currentPage,
            filter_branch_id: filterBranchId,
          },
        })
      ).unwrap();
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, [dispatch, searchTerm, recordsPerPage, currentPage, filterBranchId]);
  const totalRecords = getBanks?.meta?.total || 0;

  // Filter banks
  const filteredBanks = getBanks?.data;
  console.log("getBanks", getBanks)
  // .filter(
  //   (plan: any) =>
  //     plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
  // );
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Bank name is required";
    if (!formData.account_num.trim()) newErrors.account_num = "Account number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // Open Add/Edit Form
  const openForm = (bank?: any) => {
    if (bank) {
      setEditingBank(bank);
      setFormData({
        id: bank.id,
        name: bank.name,
        account_num: bank.account_num || "",
      });
    } else {
      setEditingBank(null);
      setFormData({
        name: "",
        account_num: "",
      });
    }
    setIsFormOpen(true);
  };

  // Submit Form (Create/Update)
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({ title: "Please fix the errors", variant: "destructive" });
      return;
    }

    setErrors({}); // Clear previous errors

    const data = new FormData();
    data.append("name", formData.name.trim());
    data.append("account_number", formData.account_num.trim());
    // data.append("fee", formData.fee);
    // data.append("duration_days", formData.duration_days);
    if (editingBank?.id) data.append("id", editingBank.id.toString());

    try {
      await dispatch(createBankAsyncThunk({ data })).unwrap();
      toast({
        title: editingBank ? "Bank updated!" : "Bank created!",
        description: "Success!",
      });
      setIsFormOpen(false);
      setErrors({});
      fetchBanks();
    } catch (err: any) {
      // Handle Laravel-style backend errors
      if (err?.errors) {
        const backendErrors: Record<string, string> = {};

        // Handle object format: { name: ["The name field is required"] }
        if (typeof err.errors === "object") {
          Object.keys(err.errors).forEach((key) => {
            backendErrors[key] = Array.isArray(err.errors[key])
              ? err.errors[key][0]
              : err.errors[key];
          });
        }
        // Handle string format: "The name field is required"
        else if (typeof err.errors === "string") {
          const field = err.errors.toLowerCase().includes("name")
            ? "name"
            : err.errors.toLowerCase().includes("account_number")

            ;
          backendErrors[field] = err.errors;
        }

        setErrors(backendErrors);
        toast({
          title: "Validation failed",
          description: "Check the form",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: err.response.data.errors || "Failed to save Bank",
          variant: "destructive",
        });
      }
    }
  };
  const ErrorMessage = ({ field }: { field: string }) => {
    if (!errors[field]) return null;
    return <p className="text-red-500 text-xs mt-1">{errors[field]}</p>;
  };
  // Delete Plan
  const handleDelete = async (id: number) => {
    // if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      await dispatch(
        deletePlanAsyncThunk({ params: { plan_id: selectedId } })
      ).unwrap();
      toast({ title: "Plan deleted" });
      fetchBanks();
      setIsDeleteModalOpen(false);
      setSelectedId(null);
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  // Toggle Status
  const handleToggleStatus = (id: number, current: string) => {
    setConfirmToggle({ id, current });
  };

  // const confirmToggleFun = async () => {
  //   if (!confirmToggle) return;
  //   const newStatus =
  //     confirmToggle.current === "active" ? "inactive" : "active";

  //   try {
  //     await dispatch(
  //       toggleBankStatusAsyncThunk({
  //         plan_id: confirmToggle.id,
  //         // status: newStatus,
  //       })
  //     ).unwrap();
  //     toast({ title: "Status updated" });
  //     fetchBanks();
  //   } catch (error) {
  //     // alert( error)
  //     toast({
  //       title: "Failed",
  //       description: error?.response?.data?.errors,
  //       variant: "destructive",
  //     });
  //   }
  //   setConfirmToggle(null);
  //   fetchBanks();
  // };

 const exportPDF = useCallback(() => {
  const selectedBanks = getBanks.data?.filter((bank: any) =>
    selectedIds.has(bank.id)
  ) ?? [];

  if (selectedBanks.length === 0) {
    toast({ title: "No banks selected", variant: "destructive" });
    return;
  }

  // Get selected branch info
  const selectedBranch = filterBranchId
    ? branchesList?.find((b: any) => b.id === Number(filterBranchId))
    : null;

  const rawCurrency = selectedBanks[0]?.system_currency ?? "PKR";
  const currency = convertCurrencySymbol(rawCurrency);

  exportToPDF({
    title: "Banks Report",
    // subtitle: `${selectedBanks.length} bank${selectedBanks.length !== 1 ? "s" : ""} selected`,
    filenamePrefix: "Banks",

    branchInfo: selectedBranch
      ? {
          name: selectedBranch.name || "All Branches",
          address: selectedBranch.address || "",
          reference_num: selectedBranch.reference_num,
        }
      : null,

    columns: [
      { title: "Reference",       dataKey: "reference",      align: "left", width: 90 },
      { title: "Bank Name",       dataKey: "name",           align: "left",   width: 90 },
      { title: "Account Number",  dataKey: "accountNumber",  align: "left", width: 90 },
    ],

    data: selectedBanks,

    getRowData: (bank: any) => ({
      reference: bank.reference_num || "—",
      name: bank.name || "—",
      accountNumber: bank.account_number || "—",
    }),

  });
}, [
  getBanks?.data,
  selectedIds,
  filterBranchId,      
  branchesList,        
  convertCurrencySymbol,
]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bank</h1>
          <p className="text-muted-foreground">
            Manage your gym all banks
          </p>
        </div>
        <div className="flex gap-4">
          {hasPermission(PERMISSIONS.PLAN_EXPORT) && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportPDF}
              className={`mr-2 ${selectedIds.size === 0 ? "cursor-not-allowed" : ""
                }`}
              disabled={selectedIds.size === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}

          <Button
            permission={[PERMISSIONS.BANK_CREATE]}
            onClick={() => openForm()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Bank
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Bank</CardTitle>

            <div className="relative  flex gap-3">
              <HeaderBranchFilter onBranchChange={setFilterBranchId} />
              <div className="relative">
                <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bank..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table className="overflow-x-scroll">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <CustomCheckbox
                    checked={selectAll}
                    onChange={(checked) => {
                      setSelectAll(checked);
                      if (checked) {
                        const allIds = new Set(getBanks.data?.map((b: any) => b.id) || []);
                        setSelectedIds(allIds);
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Bank ID</TableHead>
                <TableHead>Bank Name</TableHead>
                <TableHead>Account number</TableHead>
                {/* <TableHead>Branch</TableHead> */}
                {/*<TableHead>Duration</TableHead>
                <TableHead>Status</TableHead> */}
                {/* <TableHead className="text-right">Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadings.getBanks ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <Loading />
                  </TableCell>
                </TableRow>
              ) : filteredBanks?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No banks found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBanks?.map((plan: any) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <CustomCheckbox
                        checked={selectedIds.has(plan.id)}
                        onChange={(checked) => {
                          const newIds = new Set(selectedIds);
                          if (checked) {
                            newIds.add(plan.id);
                          } else {
                            newIds.delete(plan.id);
                          }
                          setSelectedIds(newIds);
                          setSelectAll(
                            newIds.size === getBanks.data?.length &&
                            getBanks.data?.length > 0
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {plan?.reference_num}
                    </TableCell>
                    <TableCell className="font-medium">{plan?.name}</TableCell>


                    <TableCell>{plan?.account_number}</TableCell>



                    {/* Actions */}
                    {/* <TableCell className="text-right space-x-1">
                      <Button
                        permission={[PERMISSIONS.PLAN_EDIT]}
                        variant="ghost"
                        size="icon"
                        onClick={() => openForm(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                     
                    </TableCell> */}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {!loadings.getBanks && (
          <Pagination
            recordsPerPage={recordsPerPage}
            setRecordsPerPage={setRecordsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalRecords={totalRecords}
            className="bg-theme-white"
            recordsPerPageOptions={[5, 10, 20, 50]}
          />
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={() => { setIsFormOpen(!isFormOpen); setErrors({}); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBank ? "Edit" : "Add"} Bank</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input
                placeholder="Enter bank name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className={errors.name ? "border-red-500" : ""}
              />
              <ErrorMessage field="name" />
            </div>

            <div className="">
              <div className="space-y-2">
                <Label>Account number</Label>
                <Input
                  // type="number"
                  placeholder="Enter Account number"
                  value={formData.account_num}
                  onChange={(e) => {
                    setFormData({ ...formData, account_num: e.target.value });
                    setErrors((prev) => ({ ...prev, account_num: undefined }));
                  }}
                  // minLength={25}
                  className={errors.account_num ? "border-red-500" : ""}
                />
                <ErrorMessage field="account_num" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingBank ? "Update" : "Create"} Bank
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Toggle Confirmation */}
      {/* <AlertDialog
        open={!!confirmToggle}
        onOpenChange={() => setConfirmToggle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {confirmToggle?.current === "active" ? "deactivate" : "activate"}{" "}
              this plan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleFun}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Plan"
        message="Are you sure you want to delete this plan? This action cannot be undone."
      /> */}
    </div>
  );
}
