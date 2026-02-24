import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import {
  getSystemSettingsAsyncThunk,
  updateSystemSettingsAsyncThunk,
} from "@/redux/pagesSlices/generalSlice";
import { toast } from "@/hooks/use-toast";
import SystemTab from "./SystemTab";

export default function SystemSettings() {
  const dispatch = useDispatch<AppDispatch>();
  const { systemSettings, loading } = useSelector((state: RootState) => state.general);

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

  // If no data yet, show loading
  if (!systemSettings) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading system settings...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Configure global system preferences for your company
        </p>
      </div>

      <SystemTab
        initialData={systemSettings}
        onSave={handleSaveSystemSettings}
        isLoading={loading}
      />
    </div>
  );
}