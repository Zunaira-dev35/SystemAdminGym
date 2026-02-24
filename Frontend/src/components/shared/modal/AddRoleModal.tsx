// src/components/shared/modal/AddRoleModal.tsx

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getGroupPermissionsAsyncThunk,
  createOrUpdateRoleAsyncThunk,
  getRolesAsyncThunk,
} from "@/redux/pagesSlices/userSlice";
import { RootState, AppDispatch } from "@/redux/store";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Search, Loader2 } from "lucide-react";

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleToEdit?: any;
}

export default function AddRoleModal({ isOpen, onClose, roleToEdit }: AddRoleModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { groupPermissions, loadings } = useSelector((state: RootState) => state.user);

  const [roleName, setRoleName] = useState(roleToEdit?.name || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<any>(roleToEdit || null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      dispatch(getGroupPermissionsAsyncThunk({ disable_page_param: 1 }));
      if (roleToEdit) {
        setRoleName(roleToEdit.name);
        setSelectedGroup(roleToEdit);
      } else {
        setRoleName("");
        setSelectedGroup(null);
      }
    }
  }, [isOpen, roleToEdit, dispatch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredGroups = groupPermissions?.results?.filter((group: any) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSubmit = async () => {
    if (!roleName.trim()) {
      toast({ title: "Role name is required", variant: "destructive" });
      return;
    }
    if (!selectedGroup) {
      toast({ title: "Please select a permission group", variant: "destructive" });
      return;
    }

    const data = new FormData();
    data.append("role_name", roleName);
    data.append("assign_group_id", selectedGroup.id);

    if (roleToEdit?.id) {
      data.append("id", roleToEdit.id);
    }

    try {
      await dispatch(createOrUpdateRoleAsyncThunk({ data })).unwrap();
      toast({ title: roleToEdit ? "Role updated!" : "Role created!" });
      await dispatch(getRolesAsyncThunk({}));
      onClose();
    } catch (err: any) {
      toast({ title: err.response.data.errors , variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {roleToEdit ? "Edit Role" : "Create New Role"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Role Name */}
          <div>
            <label className="text-sm font-medium text-foreground">Role Name</label>
            <Input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. Receptionist, Trainer, Manager"
              className="mt-2"
            />
          </div>

          {/* Permission Group Dropdown */}
          <div>
            <label className="text-sm font-medium text-foreground">Assign Permission Group</label>
            <div ref={dropdownRef} className="relative mt-2">
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition flex items-center justify-between"
              >
                <span className={selectedGroup ? "text-foreground" : "text-muted-foreground"}>
                  {selectedGroup?.permission_group_name || "Select a group"}
                </span >
                <svg className={`h-5 w-5 transition ${isDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-card border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search groups..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {loadings.getGroupPermissions ? (
                    <div className="p-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </div>
                  ) : filteredGroups.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">No groups found</div>
                  ) : (
                    filteredGroups.map((group: any) => (
                      <div
                        key={group.id}
                        onClick={() => {
                          setSelectedGroup(group);
                          console.log("group",group)
                          setIsDropdownOpen(false);
                        }}
                        className="px-4 py-3 hover:bg-accent/70 cursor-pointer transition flex items-center justify-between"
                      >
                        <span>{group.name}</span>
                        {selectedGroup?.id === group.id && (
                          <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loadings.createOrUpdateRole}>
            {loadings.createOrUpdateRole ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              roleToEdit ? "Update Role" : "Create Role"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}