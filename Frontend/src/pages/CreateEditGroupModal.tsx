// src/pages/settings/CreateEditGroupPage.tsx

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getDefaultPermissionsAsyncThunk,
  createOrUpdateGroupPermissionsAsyncThunk,
  getGroupPermissionByIdAsyncThunk,
} from "@/redux/pagesSlices/userSlice";
import { RootState, AppDispatch } from "@/redux/store";

import { useParams, useNavigate } from "react-router-dom"; // React Router v6

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import Loading from "@/components/shared/loaders/Loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Permission {
  id: number;
  name: string;
}

interface GroupedPermissions {
  [module: string]: {
    view: number | null;
    create: number | null;
    edit: number | null;
    delete: number | null;
    export: number | null;
  };
}

export default function CreateEditGroupPage() {
  const { id } = useParams<{ id?: string }>(); // Get id from URL params
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { defaultPermissions, loadings } = useSelector(
    (state: RootState) => state.user
  );

  const groupId = id ? Number(id) : undefined;

  const [groupName, setGroupName] = useState<string>("");
  const [selectedPerms, setSelectedPerms] = useState<Set<number>>(new Set());
  const [isLoadingGroup, setIsLoadingGroup] = useState<boolean>(false);

  // Load default permissions on mount
  useEffect(() => {
    dispatch(getDefaultPermissionsAsyncThunk({}));
  }, [dispatch]);

  // Load group data when editing
  useEffect(() => {
    if (groupId) {
      setIsLoadingGroup(true);
      dispatch(getGroupPermissionByIdAsyncThunk({ id: groupId }))
        .unwrap()
        .then((res) => {
          const data = res?.data || res;
          setGroupName(data.name || "");

          const selectedIds = new Set<number>();
          (data.permissions || []).forEach((permName: string) => {
            const perm = defaultPermissions?.results?.find(
              (p: Permission) => p.name === permName
            );
            if (perm?.id) {
              selectedIds.add(perm.id);
            }
          });
          setSelectedPerms(selectedIds);
        })
        .catch(() => {
          toast({ title: "Failed to load group data", variant: "destructive" });
        })
        .finally(() => setIsLoadingGroup(false));
    } else {
      // Creating new group
      setGroupName("");
      setSelectedPerms(new Set());
    }
  }, [groupId, dispatch, defaultPermissions]);

  // Group permissions by module
  const groupedPermissions: GroupedPermissions =
    defaultPermissions?.results?.reduce((acc, perm: Permission) => {
      const match = perm.name.match(/(Create|Edit|View|Delete|Export) (.+)/);
      if (!match) return acc;

      const action = match[1];
      let module = match[2];

      // Normalize module names
      if (module.endsWith("s") && module !== "Settings") {
        module = module.slice(0, -1);
      }
      if (module === "Fee Collection") module = "Fee Collection";
      if (module === "Freeze Request") module = "Freeze Requests";
      if (module === "System Setting") module = "Settings";

      if (!acc[module]) {
        acc[module] = {
          view: null,
          create: null,
          edit: null,
          delete: null,
          export: null,
        };
      }  

      if (action === "View") acc[module].view = perm.id;
      if (action === "Create") acc[module].create = perm.id;
      if (action === "Edit") acc[module].edit = perm.id;
      if (action === "Delete") acc[module].delete = perm.id;
      if (action === "Export") acc[module].export = perm.id;

      return acc;
    }, {} as GroupedPermissions) || {};

  const togglePermission = (permId: number | null) => {
    if (!permId) return;
    setSelectedPerms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permId)) {
        newSet.delete(permId);
      } else {
        newSet.add(permId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!groupName.trim()) {
      toast({ title: "Group name is required", variant: "destructive" });
      return;
    }

    const data = new FormData();
    data.append("name", groupName);

    const selectedNames: string[] = [];
    selectedPerms.forEach((id) => {
      const perm = defaultPermissions?.results?.find((p) => p.id === id);
      if (perm?.name) {
        selectedNames.push(perm.name);
      }
    });

    selectedNames.forEach((name, index) => {
      data.append(`permissions[${index}]`, name);
    });

    if (groupId) {
      data.append("id", String(groupId));
    }

    try {
      await dispatch(
        createOrUpdateGroupPermissionsAsyncThunk({ data })
      ).unwrap();
      toast({
        title: groupId
          ? "Group updated successfully!"
          : "Group created successfully!",
      });
      navigate("/settings"); // Go back to groups list
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err.response?.data?.errors || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate("/settings");
  };

  return (
    <div className=" bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 text-sm mb-8">
          <button
            onClick={handleCancel || (() => navigate("/settings"))}
            className="flex items-center gap-2 hover:text-primary transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Settings
          </button>
          <span>/</span>
          <span className="font-medium">
            {groupId ? "Edit" : "Add"} Permissions
          </span>
        </div>
        <Card className="max-w-5xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {groupId ? "Edit Permission Group" : "Create New Group"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {isLoadingGroup ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Group Name
                  </label>
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. Receptionist, Manager"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Module Permissions
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-48">Module</TableHead>
                        <TableHead className="text-center">View</TableHead>
                        <TableHead className="text-center">Create</TableHead>
                        <TableHead className="text-center">Edit</TableHead>
                        <TableHead className="text-center">Delete</TableHead>
                        <TableHead className="text-center">Export</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {defaultPermissions?.results ? (
                        Object.entries(groupedPermissions).map(
                          ([module, perms]) => (
                            <TableRow key={module}>
                              <TableCell className="font-medium">
                                {module}
                              </TableCell>
                              {[
                                "view",
                                "create",
                                "edit",
                                "delete",
                                "export",
                              ].map((action) => (
                                <TableCell key={action} className="text-center">
                                  <Switch
                                    checked={
                                      !!perms[action as keyof typeof perms] &&
                                      selectedPerms.has(
                                        perms[action as keyof typeof perms]!
                                      )
                                    }
                                    onCheckedChange={() =>
                                      togglePermission(
                                        perms[action as keyof typeof perms]
                                      )
                                    }
                                  />
                                </TableCell>
                              ))}
                            </TableRow>
                          )
                        )
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Loading />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <div className="sticky bottom-0 left-0 right-0  bg-sidebar border-t z-50 py-2 px-6 mt-0">

            <div className="flex justify-end gap-4 mt-0">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loadings.createOrUpdateGroupPermission}
              >
                {loadings.createOrUpdateGroupPermission
                  ? "Saving..."
                  : "Save Group"}
              </Button>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
