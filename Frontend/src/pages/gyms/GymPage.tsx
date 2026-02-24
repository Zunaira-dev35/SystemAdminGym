import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Plus, Trash2, Power, Package, Eye, Backpack } from "lucide-react";
import Loading from "@/components/shared/loaders/Loading";
import Pagination from "@/components/shared/Pagination";

import {
  getGymAsyncThunk,
  assignGymPackageAsyncThunk,
  getPackagesAsyncThunk,
  updateGymStatusAsyncThunk,
} from "@/redux/pagesSlices/generalSlice";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function GymPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { gym, packages, loadings } = useSelector((state: RootState) => state.general);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGymId, setFilterGymId] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const [statusModal, setStatusModal] = useState({ isOpen: false, gym: null as any });
  const [assignModal, setAssignModal] = useState({
    isOpen: false, gym: null as any,
    selectedPackageId: null as string | null,
    paymentMethod: "" as "" | "cash" | "card"
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const isLoadingGyms = loadings.getGym;
  const isLoadingPackages = loadings.getPackages;

  useEffect(() => {
    const params: any = {
      page: currentPage,
      limit: recordsPerPage,
    };
    if (search.trim()) { params.search = search.trim()}
    if (filterStatus) {params.filter_status = filterStatus}

    dispatch(getGymAsyncThunk(params));
  }, [
    dispatch,
    currentPage,
    recordsPerPage,
    search,
    filterStatus,
  ]);

  useEffect(() => {
    dispatch(getPackagesAsyncThunk({}));
  }, [dispatch]);

  const gymList = gym?.data || [];
  const packageList = packages?.data || [];
  console.log('package', packageList)
  const totalRecords = gym?.total || 0;

  const selectedPackage = packageList.find(
    (pkg: any) => String(pkg.id) === assignModal.selectedPackageId
  );

  const isStandardPackage = selectedPackage?.type === "standard";

  const handleAssignPackage = async () => {
    if (!assignModal.gym || !assignModal.selectedPackageId) return;

    setIsAssigning(true);

    try {
      const data: any = {
        gym_id: assignModal.gym.id,
        package_id: Number(assignModal.selectedPackageId),
      };

      if (isStandardPackage && assignModal.paymentMethod) {
        data.deposit_method = assignModal.paymentMethod;
      }

      await dispatch(
        assignGymPackageAsyncThunk(data)
      ).unwrap();

      toast({
        title: "Success",
        description: "Package assigned to gym successfully",
      });

      dispatch(getGymAsyncThunk({ page: currentPage, limit: recordsPerPage }));

      setAssignModal({ isOpen: false, gym: null, selectedPackageId: null, paymentMethod: "" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.errors || "Failed to assign package",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusModal.gym) return;

    setIsUpdating(true);
    try {
      await dispatch(
        updateGymStatusAsyncThunk({
          gym_id: statusModal.gym.id,
        })
      ).unwrap();

      dispatch(getGymAsyncThunk({ page: currentPage, limit: recordsPerPage }));

      setStatusModal({ isOpen: false, gym: null });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.errors || "Failed to update status",
        variant: "destructive",
      });
    }
    finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);


  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gyms</h1>
          <p className="text-muted-foreground">Manage all gyms in the system</p>
        </div>
        <Button onClick={() => navigate("/gym/add")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Gym
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>All Gyms</CardTitle>

            <div className="flex flex-wrap items-end gap-3">
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search by name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="w-full sm:w-40">
                <Select
                  value={filterStatus || "all"}
                  onValueChange={(val) => setFilterStatus(val === "all" ? "" : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(search.trim() || filterStatus || filterGymId.trim()) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setFilterStatus("");
                    setFilterGymId("");
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoadingGyms ? (
            <div className="py-12 text-center">
              <Loading />
            </div>
          ) : gymList.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No gyms found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {gymList.map((gymItem: any, index: number) => (
                  <TableRow key={gymItem.id}>
                    <TableCell>{gymItem.reference_num || "—"}</TableCell>
                    <TableCell>
                      {gymItem.company_name}
                    </TableCell>
                    <TableCell>{gymItem.company_email || "—"}</TableCell>
                    <TableCell>{gymItem.company_phone || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{gymItem.package_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {gymItem.package_type || "—"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-xs truncate">
                      {gymItem.company_address || "—"}
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={
                          gymItem.status === "active"
                            ? "bg-chart-3/10 text-chart-3 border-chart-3/10"
                            : "bg-chart-4/10 text-chart-4 border-chart-4/10"
                        }
                      >
                        {gymItem.status?.toUpperCase() || "UNKNOWN"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right space-x-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate(`/gym/detail/${gymItem.id}`, {
                          state: {
                            fullGymFromList: gymItem,
                          }
                        })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate(`/gym/edit/${gymItem.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setStatusModal({ isOpen: true, gym: gymItem })}
                      >
                        <Power
                          className={
                            gymItem.status === "active"
                              ? "text-green-500"
                              : "text-gray-400"
                          }
                        />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setAssignModal({ isOpen: true, gym: gymItem, selectedPackageId: "" })}
                      >
                        <Backpack className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalRecords={totalRecords}
              recordsPerPage={recordsPerPage}
              setRecordsPerPage={setRecordsPerPage}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={statusModal.isOpen}
        onOpenChange={() => setStatusModal({ isOpen: false, gym: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Gym Status</DialogTitle>
            <DialogDescription>
              Confirm status change for <strong>{statusModal.gym?.company_name}</strong>
            </DialogDescription>
          </DialogHeader>

          {/* Show current status */}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Current Status:</p>
            <Badge
              className={
                statusModal.gym?.status === "active"
                  ? "bg-chart-3/10 text-chart-3 border-chart-3/10"
                  : "bg-chart-4/10 text-chart-4 border-chart-4/10"
              }
            >
              {statusModal.gym?.status?.toUpperCase() || "UNKNOWN"}
            </Badge>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusModal({ isOpen: false, gym: null })}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={assignModal.isOpen} onOpenChange={() => setAssignModal({
        isOpen: false,
        gym: null,
        selectedPackageId: "",
        paymentMethod: "",
      })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Package to Gym</DialogTitle>
            <DialogDescription>
              Select a package to assign to <strong>{assignModal.gym?.company_name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div>
              <Label>Select Package</Label>
              <Select
                value={assignModal.selectedPackageId}
                onValueChange={(value) => {
                  setAssignModal({
                    ...assignModal,
                    selectedPackageId: value,
                    paymentMethod: "",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a package" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingPackages ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading packages...
                    </div>
                  ) : packageList.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No packages found
                    </div>
                  ) : (
                    packageList.map((pkg: any) => (
                      <SelectItem key={pkg.id} value={String(pkg.id)}>
                        {pkg.name} ({pkg.price} PKR) — {pkg.type}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>

              </Select>
            </div>

            {isStandardPackage && (
              <div>
                <Label>Payment Method</Label>
                <Select
                  value={assignModal.paymentMethod}
                  onValueChange={(value) =>
                    setAssignModal({ ...assignModal, paymentMethod: value as "cash" | "card" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignModal({
                isOpen: false,
                gym: null,
                selectedPackageId: "",
                paymentMethod: "",
              })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignPackage}
              disabled={
                isAssigning ||
                !assignModal.selectedPackageId ||
                (isStandardPackage && !assignModal.paymentMethod)
              }
            >
              {isAssigning ? "Assigning..." : "Assign Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}