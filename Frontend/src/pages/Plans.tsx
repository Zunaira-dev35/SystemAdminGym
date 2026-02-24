import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllPlansAsyncThunk,
  createPlanAsyncThunk,
  deletePlanAsyncThunk,
  togglePlanStatusAsyncThunk,
} from "@/redux/pagesSlices/planSlice"; // ← your new slice
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
  FilterIcon,
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
import { set } from "lodash";
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
import { exportToPDF } from "@/utils/exportToPdf";

// import { getAllPlansAsyncThunk } from "@/redux/pagesSlices/peopleSlice";

interface PlanFormData {
  id?: number;
  name: string;
  description: string;
  fee: string;
  duration_days: string;
  // branch_id: string;
  freeze_allowed_days: string; // ← NEW
  freeze_allowed_count: string;
}

function convertCurrencySymbol(symbol: string): string {
  if (!symbol) return "";
  if (symbol === "\u20a8") {
    return "Rs";
  }
  return symbol;
}

export default function Plans() {
  const dispatch = useDispatch<AppDispatch>();
  const { plans, loadings } = useSelector((state: RootState) => state.plan);
  const { selectedBranchId } = useSelector((state: any) => state.general);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
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
  const [enableFreezeOptions, setEnableFreezeOptions] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const { hasPermission } = usePermissions();
  const { user } = useSelector((state: any) => state.auth);
  const { branchesList } = useSelector((state: any) => state.plan);

  const [filter, setFilter] = useState<string>("");

  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    description: "",
    fee: "",
    duration_days: "",
    // branch_id: "1", // default main branch
  });

  // Fetch plans
  const fetchPlans = async () => {
    try {
      await dispatch(
        getAllPlansAsyncThunk({
          params: {
            search: searchTerm,
            limit: recordsPerPage,
            page: currentPage,
            filter_branch_id: filterBranchId,
            filter_status: filter === "all" ? "" : filter,
          },
        })
      ).unwrap();
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [
    dispatch,
    searchTerm,
    recordsPerPage,
    currentPage,
    filter,
    filterBranchId,
  ]);
  const totalRecords = plans.meta?.total || 0;

  // Filter plans
  const filteredPlans = plans?.data;
  // console.log("filteredPlans",filteredPlans)
  // .filter(
  //   (plan: any) =>
  //     plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
  // );
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Plan name is required";
    if (!formData.fee.trim()) newErrors.fee = "Fee is required";
    else if (Number(formData.fee) <= 0)
      newErrors.fee = "Fee must be greater than 0";
    if (!formData.duration_days.trim())
      newErrors.duration_days = "Duration is required";
    else if (Number(formData.duration_days) <= 0)
      newErrors.duration_days = "Duration must be at least 1 day";
    // if (
    //   formData.freeze_allowed_days &&
    //   Number(formData.freeze_allowed_days) < 0
    // ) {
    //   newErrors.freeze_allowed_days = "Grace period days must be non-negative";
    // }
    // if (
    //   formData.freeze_allowed_count &&
    //   Number(formData.freeze_allowed_count) < 0
    // ) {
    //   newErrors.freeze_allowed_count =
    //     "Freeze Requset Credits must be non-negative";
    // }
    if (enableFreezeOptions) {
      if (formData.freeze_allowed_days && Number(formData.freeze_allowed_days) < 0) {
        newErrors.freeze_allowed_days = "Grace period days must be non-negative";
      }
      if (formData.freeze_allowed_count && Number(formData.freeze_allowed_count) < 0) {
        newErrors.freeze_allowed_count = "Freeze Request Credits must be non-negative";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // Open Add/Edit Form
  const openForm = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      const hasFreeze =
        (plan.freeze_allowed_days !== null && plan.freeze_allowed_days !== undefined) ||
        (plan.freeze_allowed_count !== null && plan.freeze_allowed_count !== undefined);

      setEnableFreezeOptions(hasFreeze);

      setFormData({
        id: plan.id,
        name: plan.name,
        description: plan.description || "",
        fee: plan.fee.toString(),
        duration_days: plan.duration_days.toString(),
        // branch_id: plan.branch_id.toString(),
        freeze_allowed_days: plan.freeze_allowed_days?.toString() || "",
        freeze_allowed_count: plan.freeze_allowed_count?.toString() || "",
      });
    } else {
      setEditingPlan(null);
      setEnableFreezeOptions(false);
      setFormData({
        name: "",
        description: "",
        fee: "",
        duration_days: "",
        // branch_id: "1",
        freeze_allowed_days: "",
        freeze_allowed_count: "",
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
    data.append("description", formData.description.trim());
    data.append("fee", formData.fee);
    data.append("duration_days", formData.duration_days);
    // data.append("freeze_allowed_days", formData.freeze_allowed_days);
    // data.append("freeze_allowed_count", formData.freeze_allowed_count);
    if (enableFreezeOptions) {
      data.append("freeze_allowed_days", formData.freeze_allowed_days);
      data.append("freeze_allowed_count", formData.freeze_allowed_count);
    }
    if (editingPlan?.id) data.append("id", editingPlan.id.toString());

    try {
      await dispatch(createPlanAsyncThunk({ data })).unwrap();
      toast({
        title: editingPlan ? "Plan updated!" : "Plan created!",
        description: "Success!",
      });
      setIsFormOpen(false);
      setErrors({});
      fetchPlans();
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
            : err.errors.toLowerCase().includes("fee")
              ? "fee"
              : err.errors.toLowerCase().includes("duration")
                ? "duration_days"
                : "name";
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
          description: err.response.data.errors || "Failed to save plan",
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
      fetchPlans();
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

  const confirmToggleFun = async () => {
    if (!confirmToggle) return;
    const newStatus =
      confirmToggle.current === "active" ? "inactive" : "active";

    try {
      await dispatch(
        togglePlanStatusAsyncThunk({
          plan_id: confirmToggle.id,
          // status: newStatus,
        })
      ).unwrap();
      toast({ title: "Status updated" });
      fetchPlans();
    } catch (error) {
      // alert( error)
      toast({
        title: "Failed",
        description: error?.response?.data?.errors,
        variant: "destructive",
      });
    }
    setConfirmToggle(null);
    fetchPlans();
  };

  const exportPlansPDF = useCallback(() => {
    const selectedPlans = plans.data?.filter((plan: any) =>
      selectedIds.has(plan.id)
    ) || [];

    if (selectedPlans.length === 0) return;

    const currencySymbol = convertCurrencySymbol(
      selectedPlans[0]?.system_currency || 'PKR'
    );

    const totalFee = selectedPlans.reduce(
      (sum: number, plan: any) => sum + Number(plan.fee || 0),
      0
    );

    exportToPDF({
      title: "Membership Plans Report",
      // subtitle: `${selectedPlans.length} plan${selectedPlans.length !== 1 ? 's' : ''} selected`,
      filenamePrefix: "Plans",

      columns: [
        { title: "Plan ID", dataKey: "planId", align: "center", width: 38 },
        { title: "Plan Name", dataKey: "name", align: "left", width: 35 },
        { title: "Description", dataKey: "description", align: "left", width: 95 },
        { title: "Fee", dataKey: "fee", align: "right", width: 35 },
        { title: "Duration", dataKey: "duration", align: "center", width: 40 },
        { title: "Status", dataKey: "status", align: "center", width: 35 },
      ],

      data: selectedPlans,

      branchInfo: filterBranchId ? branchesList.find(b => b.id === Number(filterBranchId)) : null,

      getRowData: (plan: any) => ({
        planId: plan.reference_num || "—",
        name: plan.name || "—",
        description: plan.description || "—",
        fee: `${currencySymbol} ${Number(plan.fee || 0).toLocaleString()}`,
        duration: `${plan.duration_days || 0} days`,
        status: plan.status
          ? plan.status.charAt(0).toUpperCase() + plan.status.slice(1)
          : "—",
      }),

      footerCallback: (doc: jsPDF, finalY: number) => {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(
          `Total Fee of Selected Plans: ${currencySymbol} ${totalFee.toLocaleString()}`,
          14,
          finalY
        );
      },
    });
  }, [plans.data, selectedIds, convertCurrencySymbol, branchesList, filterBranchId]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Plans</h1>
          <p className="text-muted-foreground">
            Manage your gym membership plans
          </p>
        </div>
        <div className="flex gap-4 flex-wrap">
          {hasPermission(PERMISSIONS.PLAN_EXPORT) && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportPlansPDF}
              className={`mr-2 ${selectedIds.size === 0 ? "cursor-not-allowed" : ""
                }`}
              disabled={selectedIds.size === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}

          <Button
            permission={[PERMISSIONS.PLAN_CREATE]}
            onClick={() => openForm()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap">
            <CardTitle>All Plans</CardTitle>

            <div className="relative  flex gap-3 flex-wrap">
              <HeaderBranchFilter onBranchChange={setFilterBranchId} />
              <div className="w-32">
                <Select
                  value={filter}
                  onValueChange={(value) => {
                    setFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <FilterIcon className="h-4 w-4" />
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">All</span>
                    </SelectItem>
                    <SelectItem value={"active"}>
                      <div className="flex gap-2">Active</div>
                    </SelectItem>
                    <SelectItem value={"inactive"}>
                      <div className="flex gap-2">Inactive</div>
                    </SelectItem>
                    <SelectItem value={"frozen"}>
                      <div className="flex gap-2">Frozen</div>
                    </SelectItem>
                    <SelectItem value={"expired"}>
                      <div className="flex gap-2">Expired</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search plans..."
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
                        const allIds = new Set(
                          plans.data?.map((p: any) => p.id) || []
                        );
                        setSelectedIds(allIds);
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Plan ID</TableHead>
                <TableHead>Plan Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Grace Period</TableHead>
                <TableHead>Freeze Requset Credits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadings.getAllPlans ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <Loading />
                  </TableCell>
                </TableRow>
              ) : filteredPlans?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No plans found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans?.map((plan: any) => (
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
                            newIds.size === plans.data?.length &&
                            plans.data?.length > 0
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {plan?.reference_num}
                    </TableCell>
                    <TableCell className="font-medium">{plan.name}</TableCell>

                    <TableCell className="max-w-2xs">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="truncate text-sm text-muted-foreground"
                              title="" // removes native browser tooltip
                            >
                              {plan.description || "—"}
                            </div>
                          </TooltipTrigger>

                          {/* Only show tooltip if text is actually truncated */}
                          {plan.description && plan.description.length > 40 && (
                            <TooltipContent
                              side="bottom"
                              className="max-w-sm break-words"
                            >
                              <p className="text-sm">{plan.description}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="font-medium">
                      {plan?.system_currency} {plan?.fee.toLocaleString()}
                    </TableCell>
                    <TableCell>{plan.duration_days} days</TableCell>
                    <TableCell>
                      {plan.freeze_allowed_days === null
                        ? "Unlimited"
                        : `${plan.freeze_allowed_days} days`}
                    </TableCell>

                    <TableCell>
                      {plan.freeze_allowed_count === null
                        ? "Unlimited"
                        : `${plan.freeze_allowed_count} days`}
                    </TableCell>

                    {/* Status Chip */}
                    <TableCell>
                      <Badge
                        variant={
                          plan.status === "active" ? "default" : "secondary"
                        }
                        className={
                          plan.status === "active"
                            ? "bg-chart-3/10 text-chart-3 border-chart-3/20"
                            : "bg-chart-5/10 text-chart-5 border-chart-5/20"
                        }
                      >
                        {plan.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right space-x-1">
                      <Button
                        permission={[PERMISSIONS.PLAN_EDIT]}
                        variant="ghost"
                        size="icon"
                        onClick={() => openForm(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        permission={[PERMISSIONS.PLAN_EDIT]}
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(plan.id, plan.status)}
                        title="Toggle status"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      {/* <Button
                        permission={[PERMISSIONS.PLAN_DELETE]}
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setIsDeleteModalOpen(true);
                          setSelectedId(plan.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button> */}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {!loadings.getPlans && (
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
      <Dialog
        open={isFormOpen}
        onOpenChange={() => {
          setIsFormOpen(!isFormOpen);
          setErrors({});
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit" : "Add"} Plan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label>
                Plan Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Premium Monthly, Basic Yearly"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className={errors.name ? "border-red-500" : ""}
              />
              <ErrorMessage field="name" />
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Describe what this plan includes..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>
                  Fee ({user.system_currency || "PKR"}){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={formData.fee}
                  onChange={(e) => {
                    setFormData({ ...formData, fee: e.target.value });
                    setErrors((prev) => ({ ...prev, fee: undefined }));
                  }}
                  className={errors.fee ? "border-red-500" : ""}
                />
                <ErrorMessage field="fee" />
              </div>
              <div className="space-y-2">
                <Label>
                  Duration (Days) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 30, 90, 365"
                  value={formData.duration_days}
                  onChange={(e) => {
                    setFormData({ ...formData, duration_days: e.target.value });
                    setErrors((prev) => ({
                      ...prev,
                      duration_days: undefined,
                    }));
                  }}
                  className={errors.duration_days ? "border-red-500" : ""}
                />
                <ErrorMessage field="duration_days" />
              </div>
              
              {/* <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grace Period (Days) </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 90"
                  value={formData.freeze_allowed_days}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      freeze_allowed_days: e.target.value,
                    });
                    setErrors((prev) => ({
                      ...prev,
                      freeze_allowed_days: undefined,
                    }));
                  }}
                  className={errors.freeze_allowed_days ? "border-red-500" : ""}
                />
                <ErrorMessage field="freeze_allowed_days" />
              </div>

              <div className="space-y-2">
                <Label>Freeze Requset Credits </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 2"
                  value={formData.freeze_allowed_count}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      freeze_allowed_count: e.target.value,
                    });
                    setErrors((prev) => ({
                      ...prev,
                      freeze_allowed_count: undefined,
                    }));
                  }}
                  className={
                    errors.freeze_allowed_count ? "border-red-500" : ""
                  }
                />
                <ErrorMessage field="freeze_allowed_count" />
              </div>
              </div> */}
            </div>
            <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <CustomCheckbox
                    checked={enableFreezeOptions}
                    onChange={setEnableFreezeOptions}
                    id="enable-freeze"
                  />
                  <Label htmlFor="enable-freeze" className="cursor-pointer">
                    Allow freeze request credits / grace period for this plan
                  </Label>
                </div>

                {enableFreezeOptions && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Grace Period (Days)</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g. 90 (days member can be late)"
                        value={formData.freeze_allowed_days}
                        onChange={(e) => {
                          setFormData({ ...formData, freeze_allowed_days: e.target.value });
                          setErrors((prev) => ({ ...prev, freeze_allowed_days: undefined }));
                        }}
                        className={errors.freeze_allowed_days ? "border-red-500" : ""}
                      />
                      <ErrorMessage field="freeze_allowed_days" />
                    </div>

                    <div className="space-y-2">
                      <Label>Freeze Request Credits</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g. 2 (how many times can freeze)"
                        value={formData.freeze_allowed_count}
                        onChange={(e) => {
                          setFormData({ ...formData, freeze_allowed_count: e.target.value });
                          setErrors((prev) => ({ ...prev, freeze_allowed_count: undefined }));
                        }}
                        className={errors.freeze_allowed_count ? "border-red-500" : ""}
                      />
                      <ErrorMessage field="freeze_allowed_count" />
                    </div>
                  </div>
                )}
              </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingPlan ? "Update" : "Create"} Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Toggle Confirmation */}
      <AlertDialog
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
      />
    </div>
  );
}
