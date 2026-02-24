import { useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ShieldCheck, Shield, Settings as Cog } from "lucide-react";
import GroupPermissionsTab from "@/components/settings/GroupPermissionsTab";
import RolesTab from "@/components/settings/RolesTab";
import UsersTabContent from "@/components/settings/UsersTabContent";
import SystemPreferencesTab from "@/components/settings/SystemPreferencesTab";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import {
  getSystemSettingsAsyncThunk,
  updateSystemSettingsAsyncThunk,
} from "@/redux/pagesSlices/generalSlice";
import { toast } from "@/hooks/use-toast";
import { usePermissions } from "@/permissions/usePermissions";
import { PERMISSIONS } from "@/permissions/permissions";

export default function Settings() {
  const dispatch = useDispatch<AppDispatch>();
  const { systemSettings, loading } = useSelector((state: RootState) => state.general);
  const { hasPermission } = usePermissions();

  // Load system settings
  useEffect(() => {
    dispatch(getSystemSettingsAsyncThunk());
  }, [dispatch]);

  const handleSaveSystemSettings = async (updatedData: any) => {
    try {
      await dispatch(updateSystemSettingsAsyncThunk(updatedData)).unwrap();
      toast({
        title: "Success",
        description: "System settings updated successfully!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: error.response?.data?.errors || error.message || "Could not save settings",
      });
    }
  };

  // Permission checks for each tab
  const canViewUsers = hasPermission(PERMISSIONS.USER_VIEW);
  const canViewGroups = hasPermission(PERMISSIONS.PERMISSION_VIEW); // Adjust permission name if different
  const canViewRoles = hasPermission(PERMISSIONS.ROLE_VIEW);
  const canViewSystem = hasPermission(PERMISSIONS.SYSTEM_SETTINGS_VIEW);

  // Find the first tab user has access to
  const initialTab = useMemo(() => {
    if (canViewUsers) return "users";
    if (canViewGroups) return "groups";
    if (canViewRoles) return "roles";
    if (canViewSystem) return "system";
    return "users"; // fallback (will show message)
  }, [canViewUsers, canViewGroups, canViewRoles, canViewSystem]);

  // If user has zero permissions
  if (!canViewUsers && !canViewGroups && !canViewRoles && !canViewSystem) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You don't have permission to access any settings.
      </div>
    );
  }

  // Load settings
  if (!systemSettings) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage system configuration, permissions & roles
        </p>
      </div>

      {/* Show tabs only if user has >1 permission */}
      {canViewUsers + canViewGroups + canViewRoles + canViewSystem > 1 ? (
        <Tabs defaultValue={initialTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            {canViewUsers && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Users
              </TabsTrigger>
            )}
            {canViewGroups && (
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Group Permissions
              </TabsTrigger>
            )}
            {canViewRoles && (
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Shield className="h-4 w-4" /> Roles
              </TabsTrigger>
            )}
            {canViewSystem && (
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Cog className="h-4 w-4" /> System
              </TabsTrigger>
            )}
          </TabsList>

          {canViewUsers && (
            <TabsContent value="users">
              <UsersTabContent />
            </TabsContent>
          )}

          {canViewGroups && (
            <TabsContent value="groups">
              <GroupPermissionsTab />
            </TabsContent>
          )}

          {canViewRoles && (
            <TabsContent value="roles">
              <RolesTab />
            </TabsContent>
          )}

          {canViewSystem && (
            <TabsContent value="system">
              <SystemPreferencesTab
                initialData={systemSettings}
                onSave={handleSaveSystemSettings}
                isLoading={loading}
              />
            </TabsContent>
          )}
        </Tabs>
      ) : (
        // Only one tab → show content directly (no tabs UI)
        <div className="p-6 space-y-6">
          {canViewUsers && <UsersTabContent />}
          {canViewGroups && <GroupPermissionsTab />}
          {canViewRoles && <RolesTab />}
          {canViewSystem && (
            <SystemPreferencesTab
              initialData={systemSettings}
              onSave={handleSaveSystemSettings}
              isLoading={loading}
            />
          )}
        </div>
      )}
    </div>
  );
}