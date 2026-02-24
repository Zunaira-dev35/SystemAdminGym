import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Loading from "@/components/shared/loaders/Loading";
import { cn } from "@/lib/utils";

import {
  createUpdateGymAsyncThunk,
  getGymAsyncThunk,
} from "@/redux/pagesSlices/generalSlice";
import { AppDispatch, RootState } from "@/redux/store";

export default function CreateUpdateGym() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isEditMode = !!id;

  const { gym, loadings } = useSelector((state: RootState) => state.general);
  const isSubmitting = loadings.createUpdateGym || false;

  const [formData, setFormData] = useState({
    company_name: "",
    company_email: "",
    company_phone: "",
    company_address: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    dispatch(getGymAsyncThunk({})); 
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode && id && gym?.data?.length > 0) {
      const gymItem = gym.data.find((g: any) => g.id === Number(id));
      if (gymItem) {
        setFormData({
          company_name: gymItem.company_name || "",
          company_email: gymItem.company_email || "",
          company_phone: gymItem.company_phone || "",
          company_address: gymItem.company_address || "",
          password: "",
        });
      } else {
        toast({
          title: "Gym not found",
          description: "The selected gym could not be loaded.",
          variant: "destructive",
        });
      }
    }
  }, [gym, id, isEditMode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company_name.trim())
      newErrors.company_name = "Company name is required";

    if (!formData.company_email.trim()) {
      newErrors.company_email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.company_email)) {
      newErrors.company_email = "Invalid email format";
    }

    if (!formData.company_phone.trim())
      newErrors.company_phone = "Phone number is required";

    if (!isEditMode && !formData.password.trim()) {
      newErrors.password = "Password is required when creating gym";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setErrors({});

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the highlighted fields",
        variant: "destructive",
      });
      return;
    }

    const data = new FormData();
    data.append("company_name", formData.company_name.trim());
    data.append("company_email", formData.company_email.trim());
    data.append("company_phone", formData.company_phone.trim());
    data.append("company_address", formData.company_address.trim());

    // if (!isEditMode) {
      data.append("password", formData.password);
    // }

    if (isEditMode) {
      data.append("id", id!);
    }

    try {
      await dispatch(createUpdateGymAsyncThunk({ data })).unwrap();

      toast({
        title: "Success",
        description: isEditMode ? "Gym updated successfully!" : "Gym created successfully!",
      });

      navigate("/gyms");
    } catch (err: any) {
      const errorMsg = err?.response?.data?.errors || "Failed to save gym";

      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 max-w-full mx-auto space-y-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <button
          onClick={() => navigate("/gyms")}
          className="flex items-center gap-2 hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Gyms
        </button>
        <span>/</span>
        <span className="font-medium text-foreground">
          {isEditMode ? "Edit Gym" : "Add Gym"}
        </span>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            {isEditMode ? "Edit Gym" : "Add New Gym"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
                placeholder="e.g. Gym"
                className={cn(errors.company_name && "border-red-500")}
              />
              {errors.company_name && (
                <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>
              )}
            </div>

            <div>
              <Label>
                Company Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={formData.company_email}
                onChange={(e) =>
                  setFormData({ ...formData, company_email: e.target.value })
                }
                placeholder="abc@gmail.com"
                className={cn(errors.company_email && "border-red-500")}
              />
              {errors.company_email && (
                <p className="text-red-500 text-xs mt-1">{errors.company_email}</p>
              )}
            </div>

            <div>
              <Label>
                Company Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.company_phone}
                onChange={(e) =>
                  setFormData({ ...formData, company_phone: e.target.value })
                }
                placeholder="1234567890"
                className={cn(errors.company_phone && "border-red-500")}
              />
              {errors.company_phone && (
                <p className="text-red-500 text-xs mt-1">{errors.company_phone}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label>Company Address</Label>
              <Textarea
                value={formData.company_address}
                onChange={(e) =>
                  setFormData({ ...formData, company_address: e.target.value })
                }
                placeholder="Address"
                rows={3}
              />
            </div>

            {/* {!isEditMode && ( */}
              <div>
                <Label>
                  Admin Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter secure password"
                  className={cn(errors.password && "border-red-500")}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>
            {/* )} */}
          </div>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/gyms")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-w-40"
              >
                {isSubmitting && <Loading inButton size="xs" className="mr-2" />}
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? "Update Gym" : "Create Gym"}
              </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}