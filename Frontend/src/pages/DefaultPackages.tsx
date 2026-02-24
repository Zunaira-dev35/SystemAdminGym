import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getPackagesAsyncThunk,
  assignGymPackageAsyncThunk,
  getSubscriptionDetailsAsyncThunk,
} from "@/redux/pagesSlices/generalSlice";
import { AppDispatch, RootState } from "@/redux/store";
import Loading from "@/components/shared/loaders/Loading";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, User, Briefcase, Smartphone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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
import { Label } from "@/components/ui/label";
import { fetchUserAsyncThunk } from "@/redux/pagesSlices/authSlice";

const DefaultPackages = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { packages, loadings } = useSelector((state: RootState) => state.general);
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "">("");

  const isLoading = loadings.getPackages;
  const isUpgrading = loadings.assignGymPackage;
  const packageList = packages?.data || [];
  const gymId = user?.gym_id;

  useEffect(() => {
    dispatch(getPackagesAsyncThunk({}));
  }, [dispatch]);

  const handlePackageAction = (pkg: any) => {
    // if (!gymId) {
    //   navigate("/trial", {
    //     state: {
    //       package_type: pkg.type,
    //       package_id: pkg.id,
    //     },
    //   });
    //   return;
    // }

    if (pkg.type?.toLowerCase() === "trial") {
      handleDirectUpgrade(pkg);
    } else {
      setSelectedPackage(pkg);
      setPaymentMethod("");
      setShowPaymentModal(true);
    }
  };

  const handleDirectUpgrade = async (pkg: any) => {
    try {
      await dispatch(
        assignGymPackageAsyncThunk({
          gym_id: gymId,
          package_id: pkg.id,
          package_type: pkg.type,
        })
      ).unwrap();

      toast({
        title: "Success",
        description: `Package upgraded to ${pkg.name}!`,
      });

      dispatch(getSubscriptionDetailsAsyncThunk({ gym_id: gymId }));
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.errors || "Failed to upgrade package.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentMethod) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    try {
      await dispatch(
        assignGymPackageAsyncThunk({
          gym_id: gymId,
          package_id: selectedPackage.id,
          package_type: selectedPackage.type,
          deposit_method: paymentMethod,
        })
      ).unwrap();

      toast({
        title: "Success",
        description: `Package upgraded to ${selectedPackage.name}!`,
      });

      setShowPaymentModal(false);
      setSelectedPackage(null);
      setPaymentMethod("");

      dispatch(getSubscriptionDetailsAsyncThunk({ gym_id: gymId }));
      dispatch(fetchUserAsyncThunk());
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.errors || "Payment / upgrade failed.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
        <section className="mt-10">
          <div className="mx-auto max-w-full px-4">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loading size="lg" />
              </div>
            ) : packageList.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                No packages available at the moment.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {packageList.map((pkg: any, index: number) => {
                  const isFeatured = index === 1;

                  return (
                    <article
                      key={pkg.id}
                      className={`relative flex flex-col rounded-3xl border ${
                        isFeatured
                          ? " shadow-[0_20px_45px_rgba(0,0,0,0.12)] ring-2 ring-primary"
                          : "border-gray-200 shadow-sm"
                      } bg-white p-7 text-left transition hover:-translate-y-1 hover:shadow-md`}
                    >
                      {isFeatured && (
                        <div className="absolute -top-3 left-6 rounded-full border-2 border-primary bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                          Most Popular
                        </div>
                      )}

                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                        {pkg.type?.toUpperCase()} PLAN
                      </p>

                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-gray-900">
                          Rs {pkg.price?.toLocaleString() || "0"}
                        </span>
                        <span className="text-xs font-medium text-gray-500">
                          / {pkg.duration || "-"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-gray-900">
                        {pkg.description || "Perfect for your fitness business."}
                      </p>

                      <ul className="mt-4 flex-1 space-y-2 text-sm text-gray-700">
                        <li>• Up to {pkg.member_limit || "—"} active members</li>
                        <li>• {pkg.branch_limit || "—"} branches</li>
                        <li>• {pkg.user_limit || "—"} users</li>
                        <li>• {pkg.employee_limit || "—"} employees</li>
                        {String(pkg.is_app_avail) === "1" && <li>• Mobile App included</li>}
                      </ul>

                      {gymId ? (
                        <Button
                          onClick={() => handlePackageAction(pkg)}
                          disabled={isUpgrading}
                          className="mt-6 w-full bg-primary border-none text-white font-semibold"
                        >
                          {isUpgrading ? "Upgrading..." : "Upgrade"}
                        </Button>
                      ) : (
                        <button
                          onClick={() => handlePackageAction(pkg)}
                          className="mt-6 w-full py-2 rounded bg-orange-500 hover:bg-orange-600 text-black shadow-lg shadow-orange-500/30"
                        >
                          Buy Now
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {/* <p className="mt-8 text-center text-xs text-gray-500">
              All plans include a trial period. No long-term contracts. Upgrade or cancel anytime.
            </p> */}
          </div>
        </section>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
            <DialogDescription>
              How would you like to pay for the <strong>{selectedPackage?.name}</strong> plan?
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div>
              <Label>
                Payment Method <span className="text-red-500">*</span>
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as "cash" | "card")}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              disabled={!paymentMethod || isUpgrading}
              className="bg-primary border-none"
            >
              {isUpgrading ? "Processing..." : "Confirm & Upgrade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DefaultPackages;