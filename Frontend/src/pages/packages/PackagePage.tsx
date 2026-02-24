import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "@/redux/store";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MoreVertical,
  Edit,
  Trash2,
  Power,
  Plus,
  Users,
  Building2,
  User,
  Briefcase,
  Smartphone,
} from "lucide-react";
import Loading from "@/components/shared/loaders/Loading";

import {
  getPackagesAsyncThunk,
  updatePackageStatusAsyncThunk,
  deletePackageAsyncThunk,
} from "@/redux/pagesSlices/generalSlice";
import { Toast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export default function PackagePage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const { packages, loadings } = useSelector((state: RootState) => state.general);
  const user = useSelector((state: RootState) => state.auth.user);

  const systemCurrency = user?.system_currency || 'Rs'


  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    package: null as any,
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    package: null as any,
  });

  const isLoadingPackages = loadings.getPackages;


  useEffect(() => {
    const params: any = {};

    if (search.trim()) {
      params.search = search.trim();
    }

    if (filterStatus) {
      params.filter_status = filterStatus;
    }

    dispatch(getPackagesAsyncThunk(params));
  }, [dispatch, search, filterStatus]);

  const packageList = packages?.data || [];

  const handleStatusUpdate = async () => {
    if (!statusModal.package) return;

    setIsUpdating(true);
    try {
      await dispatch(
        updatePackageStatusAsyncThunk({
          package_id: statusModal.package.id,
        })
      ).unwrap();

      dispatch(getPackagesAsyncThunk({}));
      toast({
        title: "Success",
        description: "Package status updated successfully",
      })
      setStatusModal({ isOpen: false, package: null });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.errors || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePackage = async () => {
    if (!deleteModal.package) return;

    setIsDeleting(true);
    try {
      await dispatch(
        deletePackageAsyncThunk({
          package_id: deleteModal.package.id,
        })
      ).unwrap();

      dispatch(getPackagesAsyncThunk({}));
      setDeleteModal({ isOpen: false, package: null });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.errors || "Failed to delete package",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Packages</h1>
          <p className="text-muted-foreground mt-1.5">
            Manage Packages plan and resource limits
          </p>
        </div>

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

          {(search.trim() || filterStatus) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setFilterStatus("");
              }}
            >
              Clear Filters
            </Button>
          )}

          <Button onClick={() => navigate("/packages/add")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Package
          </Button>
        </div>
      </div>

      {isLoadingPackages ? (
        <div className="flex justify-center items-center py-32">
          <Loading size="lg" />
        </div>
      ) : packageList.length === 0 ? (
        <Card className="py-16 text-center border-dashed">
          <CardContent className="space-y-4">
            <p className="text-xl text-muted-foreground">No package Found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packageList.map((pkg: any) => (
            <Card
              key={pkg.id}
              className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow flex flex-col h-full min-h-[420px]"
            >
              <CardHeader className="pb-4 relative bg-muted/20">
                <div className="flex justify-between items-start">
                  <div className="absolute top-4 right-4 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm border shadow-sm hover:bg-muted"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/packages/edit/${pkg.id}`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setStatusModal({ isOpen: true, package: pkg })}
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {pkg.status === "active" ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteModal({ isOpen: true, package: pkg })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <span>
                    <CardTitle className="text-xl font-semibold leading-tight">{pkg.name}</CardTitle>
                  </span>
                </div>

                <div className="border-b pb-3">
                  <CardDescription className="mt-1 text-sm">
                    {pkg.description || "No description"}
                  </CardDescription>
                </div>

                <div className="mt-3 flex items-center">
                  <Badge
                    variant={pkg.status === "active" ? "default" : "secondary"}
                    className={pkg.status === "active" ? "bg-chart-3/10 text-chart-3 border-chart-3/10" : "bg-chart-4/10 text-chart-4 border-chart-4/10"}
                  >
                    {pkg.status?.toUpperCase()}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="ml-2 text-sm capitalize"
                  >
                    {pkg.type}
                  </Badge>
                  {pkg.type === "trial" && pkg.trial_days && (
                    <Badge
                      variant="outline"
                      className="ml-2 text-sm capitalize"
                    >
                      {pkg.trial_days} days trial
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 pt-2 space-y-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold">
                    <span className="pr-1">{systemCurrency}</span>{pkg.price?.toLocaleString()}
                  </span>
                  <span className="text-base text-muted-foreground">/</span>
                  {pkg.duration || "-"}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Branches</p>
                      <p className="font-medium">{pkg.branch_limit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Users</p>
                      <p className="font-medium">{pkg.user_limit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Members</p>
                      <p className="font-medium">{pkg.member_limit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Employees</p>
                      <p className="font-medium">{pkg.employee_limit}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-3 border-t">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <Badge
                    variant={String(pkg.is_app_avail) === "1" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {String(pkg.is_app_avail) === "1" ? "Mobile App" : "No App"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={statusModal.isOpen} onOpenChange={() => setStatusModal({ isOpen: false, package: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Do you want to {statusModal.package?.status === "active" ? "deactivate" : "activate"}{" "}
              <strong>{statusModal.package?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {/* <Button variant="outline" onClick={() => setStatusModal({ isOpen: false, package: null })}>
              Cancel
            </Button> */}
            <Button onClick={handleStatusUpdate} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModal.isOpen} onOpenChange={() => setDeleteModal({ isOpen: false, package: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Package</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteModal.package?.name}</strong>?<br />
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {/* <Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, package: null })}>
              Cancel
            </Button> */}
            <Button variant="destructive" onClick={handleDeletePackage} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}