import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "@/hooks/use-toast";
import { updateUserAsyncThunk } from "@/redux/pagesSlices/userSlice";
import { fetchUserAsyncThunk } from "@/redux/pagesSlices/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currencyList } from "@/utils/global";

interface SystemSettingsData {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string | null;
  currency_id: number;
  country_id: number;
  email_notification_status: number;
  // allow_higher_branch_access: number;
  // higher_branch_allowed_days: number;
  company_logo: File | null;
}

interface SystemPreferencesTabProps {
  initialData: SystemSettingsData
  onSave: (data: Partial<SystemSettingsData> | FormData) => void;
  isLoading?: boolean;
}

interface ProfileUpdateData {
  name: string;
  phone: string;
  password?: string;
}

export default function SystemTab({
  initialData,
  onSave,
  isLoading = false,
}: SystemPreferencesTabProps) {
  const [formData, setFormData] = useState<SystemSettingsData>(
    initialData
  );
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [profileForm, setProfileForm] = useState<ProfileUpdateData>({
    name: user?.name || "",
    phone: user?.phone || "",
    password: "",
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
    const [companyLogo, setCompanyLogo] = useState<File | null>(null);
    const [companyLogoPreview, setCompanyLogoPreview] = useState<File | null>(null);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (key: keyof SystemSettingsData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

    const handleCompanyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    setCompanyLogo(file);
    setFormData(prev => ({ ...prev, company_logo: file })); 

    const reader = new FileReader();
    reader.onloadend = () => {
      setCompanyLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};

  // const handleSave = () => {
  //   onSave(formData);
  // };

   const handleSave = () => {
  const payload = new FormData();

  payload.append("company_name", formData.company_name || "");
  payload.append("company_email", formData.company_email || "");
  payload.append("company_phone", formData.company_phone || "");
  payload.append("company_address", formData.company_address || "");

  if (formData.currency_id !== undefined) {
    payload.append("currency_id", String(formData.currency_id));
  }
  if (formData.country_id !== undefined) {
    payload.append("country_id", String(formData.country_id));
  }
  payload.append("email_notification_status", String(formData.email_notification_status || 0));
  // payload.append("allow_higher_branch_access", String(formData.allow_higher_branch_access || 0));

  // if (formData.higher_branch_allowed_days !== null) {
  //   payload.append("higher_branch_allowed_days", String(formData.higher_branch_allowed_days));
  // }

  if (companyLogo) {
    payload.append("company_logo", companyLogo);
  }
  onSave(payload);
};

  const handleProfileChange = (key: keyof ProfileUpdateData, value: string) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.name.trim() || !profileForm.phone.trim()) {
      setProfileError("Name and phone are required");
      return;
    }

    setProfileLoading(true);
    setProfileError(null);

    try {
      const payload: Partial<ProfileUpdateData> = {
        name: profileForm.name,
        phone: profileForm.phone,
      };

      if (profileForm.password?.trim()) {
        payload.password = profileForm.password.trim();
      }

      await dispatch(updateUserAsyncThunk(payload)).unwrap();

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });

      setProfileForm((prev) => ({ ...prev, password: "" }));
      await dispatch(fetchUserAsyncThunk()).unwrap();
    } catch (err: any) {
      setProfileError(err?.response.data?.errors || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <CardTitle>Update Your Profile</CardTitle>
          <CardDescription>Manage your personal account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                value={profileForm.name}
                onChange={(e) => handleProfileChange("name", e.target.value)}
                placeholder="Enter your full name"
                disabled={profileLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone">Phone Number</Label>
              <Input
                id="profile-phone"
                value={profileForm.phone}
                onChange={(e) => handleProfileChange("phone", e.target.value)}
                placeholder="+92 300 1234567"
                disabled={profileLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-password">New Password</Label>
            <Input
              id="profile-password"
              type="password"
              value={profileForm.password}
              onChange={(e) => handleProfileChange("password", e.target.value)}
              placeholder="Enter new password (optional)"
              disabled={profileLoading}
            />
          </div>

          {profileError && (
            <p className="text-sm text-destructive mt-2">{profileError}</p>
          )}

          <div className="pt-4">
            <Button
              onClick={handleUpdateProfile}
              disabled={profileLoading}
              className="w-full sm:w-auto"
              variant="default"
            >
              {profileLoading ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Company Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Update your gym's business details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={formData.company_name || ""}
              onChange={(e) => handleChange("company_name", e.target.value)}
              placeholder="e.g. FitLife Gym"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_email">Company Email</Label>
              <Input
                id="company_email"
                type="email"
                value={formData.company_email || ""}
                onChange={(e) => handleChange("company_email", e.target.value)}
                placeholder="contact@gym.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_phone">Company Phone</Label>
              <Input
                id="company_phone"
                value={formData.company_phone || ""}
                onChange={(e) => handleChange("company_phone", e.target.value)}
                placeholder="+92 300 1234567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_address">Company Address</Label>
            <Input
              id="company_address"
              value={formData.company_address || ""}
              onChange={(e) => handleChange("company_address", e.target.value)}
              placeholder="123 Fitness Street, Lahore, Pakistan"
            />
          </div>
          <div className="space-y-2">
                      <Label htmlFor="company_logo">Company Logo</Label>
                      <Input
                        id="company_logo"
                        type="file"
                        accept="image/*"
                        onChange={handleCompanyLogoChange}
                        disabled={isLoading}
                        className="cursor-pointer"
                      />
          
                      {companyLogoPreview && (
                        <div className="mt-3">
                          <img
                            src={companyLogoPreview}
                            alt="Logo Preview"
                            className="h-24 w-24 object-contain rounded-md border border-gray-300"
                          />
                        </div>
                      )}
          
                      {/* {user?.company_logo && !companyLogoPreview && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground">Current Logo:</p>
                          <img
                            src={user.company_logo}
                            alt="Current Logo"
                            className="h-24 w-24 object-contain rounded-md border border-gray-300 mt-2"
                          />
                        </div>
                      )} */}
                    </div>
        </CardContent>
      </Card>

      {/* System Preferences Card */}
      <Card>
        <CardHeader>
          <CardTitle>System Preferences</CardTitle>
          <CardDescription>Configure global settings for your gym</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={formData.currency_id?.toString() || "1"}
              onValueChange={(val) => handleChange("currency_id", Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent 
              className="max-h-[300px] overflow-y-auto"
            >
                {currencyList.map((cur) => (
                  <SelectItem key={cur.id} value={cur.id.toString()}>
                    {cur.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Allow Higher Branch Access */}
          {/* <div className="space-y-6 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Higher Branch Access</Label>
                <p className="text-xs text-muted-foreground">
                  Let members visit branches with higher-tier packages
                </p>
              </div>
              <Switch
                checked={formData.allow_higher_branch_access === 1}
                onCheckedChange={(checked) =>
                  handleChange("allow_higher_branch_access", checked ? 1 : 0)
                }
              />
            </div>

            {formData.allow_higher_branch_access === 1 && (
              <div className="space-y-2 mt-4">
                <Label htmlFor="higher_branch_days">Allowed Days per Month</Label>
                <Input
                  id="higher_branch_days"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.higher_branch_allowed_days || ""}
                  onChange={(e) =>
                    handleChange("higher_branch_allowed_days", Number(e.target.value) || 0)
                  }
                  placeholder="e.g. 5"
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum days a member can visit higher branch per month
                </p>
              </div>
            )}
          </div> */}

          {/* Save Button */}
          <div className="pt-6 border-t">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              size="lg"
              className="w-full sm:w-auto"
            >
              {isLoading ? "Saving Changes..." : "Save All Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}