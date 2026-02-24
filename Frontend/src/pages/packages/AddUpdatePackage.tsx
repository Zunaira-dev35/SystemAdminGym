import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Plus, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Loading from "@/components/shared/loaders/Loading";
import { cn } from "@/lib/utils";

import { createUpdatePackageAsyncThunk } from "@/redux/pagesSlices/generalSlice";
import { AppDispatch, RootState } from "@/redux/store";

interface PackageFormData {
  id?: number;
  name: string;
  description?: string;
  type: "standard" | "trial" | "";
  price: string;
  duration: string;
  trial_days?: string;
  branch_limit: string;
  user_limit: string;
  member_limit: string;
  employee_limit: string;
  is_app_avail: "1" | "0" | "";
}

const initialFormData: PackageFormData = {
  name: "",
  description: "",
  type: "",
  price: "",
  duration: "",
  trial_days: "",
  branch_limit: "",
  user_limit: "",
  member_limit: "",
  employee_limit: "",
  is_app_avail: "",
};

const LIMIT_FIELDS = [
  "branch_limit",
  "user_limit",
  "member_limit",
  "employee_limit",
] as const;

export default function AddUpdatePackage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isEditMode = !!id;

  const { loadings, packages } = useSelector((state: RootState) => state.general);
  const isSubmitting = loadings?.createUpdatePackage || false;

  const [formData, setFormData] = useState<PackageFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditMode && id) {
      const pkg = packages?.data?.find((p: any) => p.id === Number(id));
      if (pkg) {
        setFormData({
          id: pkg.id,
          name: pkg.name,
          description: pkg.description || "",
          type: (pkg.type === "trial" ? "trial" : "standard") as "standard" | "trial",
          price: String(pkg.price || ""),
          duration: pkg.duration || "monthly",
          trial_days: pkg.trial_days ? String(pkg.trial_days) : "",
          branch_limit: String(pkg.branch_limit),
          user_limit: String(pkg.user_limit),
          member_limit: String(pkg.member_limit),
          employee_limit: String(pkg.employee_limit),
          is_app_avail: String(pkg.is_app_avail) === "1" ? "1" : "0",
        });
      }
    } else {
      setFormData(initialFormData);
    }
  }, [id, isEditMode, packages?.data]);

  const isTrial = formData.type === "trial";

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Package name is required";
    }

    if (!isTrial) {
      const price = Number(formData.price);
      if (!formData.price || isNaN(price) || price <= 0) {
        newErrors.price = "Enter a valid price";
      }

      if (!formData.duration) {
        newErrors.duration = "Duration is required";
      }
    }

    if (isTrial) {
      const days = Number(formData.trial_days);
      if (!formData.trial_days || isNaN(days) || days <= 0) {
        newErrors.trial_days = "Enter valid trial days";
      }
    }

    LIMIT_FIELDS.forEach((key) => {
      const raw = formData[key];
      if (raw === "") {
        newErrors[key] = "This field is required";
        return;
      }
      const value = Number(raw);
      if (!Number.isInteger(value)) {
        newErrors[key] = "Must be a whole number";
      } else if (value < 0) {
        newErrors[key] = "Cannot be negative";
      }
    });

    if (!formData.is_app_avail) {
      newErrors.is_app_avail = "Please select an option";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setErrors({});

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check the highlighted fields",
        variant: "destructive",
      });
      return;
    }

    const data = new FormData();
    data.append("name", formData.name.trim());
    data.append("description", formData.description?.trim() || "");
    data.append("type", formData.type);

    data.append("price", formData.price || "0");
    data.append("duration", formData.duration || "");

    if (isTrial && formData.trial_days) {
      data.append("trial_days", formData.trial_days);
    }

    data.append("branch_limit", formData.branch_limit);
    data.append("user_limit", formData.user_limit);
    data.append("member_limit", formData.member_limit);
    data.append("employee_limit", formData.employee_limit);
    data.append("is_app_avail", formData.is_app_avail);

    if (isEditMode && formData.id) {
      data.append("id", String(formData.id));
    }

    try {
      await dispatch(createUpdatePackageAsyncThunk({ data })).unwrap();

      toast({
        title: "Success",
        description: isEditMode ? "Package updated successfully" : "Package created successfully",
      });

      navigate("/packages");
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.errors ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save package";

      toast({
        title: "Error",
        description: errMsg,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-full">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={() => navigate("/packages")}
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Packages
          </button>
          <span>/</span>
          <span className="font-medium text-foreground">
            {isEditMode ? "Edit Package" : "New Package"}
          </span>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              {isEditMode ? "Edit Package" : "Create New Package"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="name" className="text-base font-medium">
                    Package Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Professional Plan"
                    className={cn("mt-1.5", errors.name && "border-destructive")}
                  />
                  {errors.name && <p className="mt-1.5 text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="md:col-span-2">
                  <Label className="text-base font-medium">
                    Package Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        type: v as "standard" | "trial",
                      })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select package type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price" className="text-base font-medium">
                    Price {isTrial ? "" : <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className={cn("mt-1.5", errors.price && "border-destructive")}
                  />
                  {errors.price && <p className="mt-1.5 text-sm text-destructive">{errors.price}</p>}
                </div>

                <div>
                  <Label className="text-base font-medium">
                    Duration {isTrial ? "" : <span className="text-red-500">*</span>}
                  </Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(v) => setFormData({ ...formData, duration: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      {/* <SelectItem value="lifetime">Lifetime</SelectItem> */}
                    </SelectContent>
                  </Select>
                  {errors.duration && <p className="mt-1.5 text-sm text-destructive">{errors.duration}</p>}
                </div>

                {isTrial && (
                  <div className="md:col-span-2">
                    <Label htmlFor="trial_days" className="text-base font-medium">
                      Trial Days <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="trial_days"
                      type="number"
                      min="1"
                      value={formData.trial_days}
                      onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                      placeholder="e.g. 14"
                      className={cn("mt-1.5", errors.trial_days && "border-destructive")}
                    />
                    {errors.trial_days && <p className="mt-1.5 text-sm text-destructive">{errors.trial_days}</p>}
                  </div>
                )}

                <div className="md:col-span-2">
                  <Label htmlFor="description" className="text-base font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of what this package includes..."
                    className="mt-1.5 min-h-[90px] resize-y"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Usage Limits</h3>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                {LIMIT_FIELDS.map((key) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key} className="capitalize">
                      {key.replace("_", " ")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={key}
                      type="number"
                      min="0"
                      value={formData[key]}
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-", "."].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        setFormData({ ...formData, [key]: e.target.value });
                        setErrors((prev) => ({ ...prev, [key]: "" }));
                      }}
                      className={cn(errors[key] && "border-destructive")}
                    />
                    {errors[key] && <p className="text-sm text-destructive">{errors[key]}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-base font-medium">
                Mobile App Access <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.is_app_avail}
                onValueChange={(v) =>
                  setFormData({ ...formData, is_app_avail: v as "1" | "0" })
                }
              >
                <SelectTrigger className="w-full max-w-xs mt-1.5">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Yes</SelectItem>
                  <SelectItem value="0">No</SelectItem>
                </SelectContent>
              </Select>
              {errors.is_app_avail && (
                <p className="text-sm text-destructive">{errors.is_app_avail}</p>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => navigate("/packages")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-w-[160px]"
              >
                {isSubmitting && <Loading inButton size="xs" className="mr-2" />}
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? "Update Package" : "Create Package"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}