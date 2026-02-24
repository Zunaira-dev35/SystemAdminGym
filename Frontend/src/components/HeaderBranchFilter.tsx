// HeaderBranchFilter.tsx
import { Search, Building2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useDispatch, useSelector } from "react-redux";
import { loggedBranchAsyncThunk } from "@/redux/pagesSlices/generalSlice";
import { getBranchesListsAsyncThunk } from "@/redux/pagesSlices/planSlice";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
type HeaderBranchFilterProps = {
  onBranchChange: (branchId: string | undefined) => void;
  value?: string; // optional controlled value
};
export const HeaderBranchFilter = ({ onBranchChange }: HeaderBranchFilterProps) => {
  const [localValue, setLocalValue] = useState<string>("all");
  const dispatch = useDispatch();
  const { branchesList, loadings } = useSelector((state: any) => state.plan);
  const { loggedBranch } = useSelector((state: any) => state.general);
  const { user } = useSelector((state: any) => state.auth);

  // Local state for this specific page instance
  const [localSelectedBranch, setLocalSelectedBranch] = useState<string>("all");

  // Extract user branch info
  const userBranch = user?.logged_branch;
  const isMainBranchUser = userBranch?.type === "main" || userBranch?.is_main === 1;
  const isAdminOrOwner = user?.type === "default";

  const shouldShowBranchFilter = isMainBranchUser && isAdminOrOwner;

  useEffect(() => {
    dispatch(loggedBranchAsyncThunk({}) as any);
  }, [dispatch]);

  useEffect(() => {
  if (shouldShowBranchFilter && loggedBranch?.data?.gym_id) {
    dispatch(
      getBranchesListsAsyncThunk({
        disable_page_param: 1,
        gym_id: loggedBranch?.data?.gym_id,
      })
    ).unwrap();
  }
}, [dispatch, shouldShowBranchFilter, loggedBranch?.data?.gym_id]);


  // Auto-select user's branch if not allowed to filter
  useEffect(() => {
    if (!shouldShowBranchFilter && userBranch?.id) {
      setLocalSelectedBranch(String(userBranch.id));
    }
  }, [shouldShowBranchFilter, userBranch]);

  // If user is not allowed to filter branches → hide filter
  if (!shouldShowBranchFilter) {
    return null;
  }

  // Loading state
  if (loadings?.branchesList) {
    return (
      <div className="flex gap-3 items-center">
        <Select disabled>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Loading branches..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-center">
      <Select
     value={localValue}
      onValueChange={(value) => {
        setLocalValue(value);
        onBranchChange(value === "all" ? undefined : value);
          // Optional: Save per-page preference if needed later
          // localStorage.setItem(`branchFilter_${window.location.pathname}`, value);
        }}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select branch" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              All Branches
            </span>
          </SelectItem>

          {branchesList?.length > 0 ? (
            branchesList.map((branch: any) => (
              <SelectItem key={branch.id} value={String(branch.id)}>
                <div className="flex gap-2 items-center">
                  <Building2 className="h-4 w-4" />
                 <div className="flex gap-2 items-center">
                  <Badge  variant="secondary" className="w-fit">
                    {branch.reference_num}
                  </Badge> {branch.name}
                 </div>
                </div>
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>
              No branches available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};