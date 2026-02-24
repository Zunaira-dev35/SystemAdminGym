// src/pages/settings/RolesTab.tsx

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getRolesAsyncThunk,
  deleteRoleAsyncThunk,
} from "@/redux/pagesSlices/userSlice";
import { RootState, AppDispatch } from "@/redux/store";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, Plus, Edit2, Trash2, Eye, Search, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import AddRoleModal from "@/components/shared/modal/AddRoleModal"; // your existing modal
import PermissionModal from "@/components/shared/modal/PermissionPreviewModal";
import DeleteConfirmationModal from "@/components/shared/modal/DeleteConfirmationModal";
import Loading from "@/components/shared/loaders/Loading";
import Pagination from "@/components/shared/Pagination";
import { PERMISSIONS } from "@/permissions/permissions";

export default function RolesTab() {
  const dispatch = useDispatch<AppDispatch>();
  const { roles, loadings } = useSelector((state: RootState) => state.user);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const fetchRoles = async () => {
    try {
      await dispatch(
        getRolesAsyncThunk({
          params: {
            search: searchTerm,
            limit: recordsPerPage,
            page: currentPage,
          },
        })
      ).unwrap();
    } catch (error) {
      console.error("Error fetching Roles:", error);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [dispatch, searchTerm, recordsPerPage, currentPage]);

  const totalRecords = roles?.total || 0;

  const filteredRoles = roles?.results?.filter((role: any) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const openAddModal = (role?: any) => {
    setEditingRole(role || null);
    setIsAddModalOpen(true);
  };

  const openPermissionModal = (permissions: string[]) => {
    setSelectedPermissions(permissions);
    setIsPermissionModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setRoleToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;
    try {
      await dispatch(deleteRoleAsyncThunk({ params:{role_group_id: roleToDelete} })).unwrap();
      toast({ title: "Role deleted successfully" });
  fetchRoles();
    } catch (err:any){
      toast({ title: err.response?.data?.errors ||"Failed to delete role", variant: "destructive" });
    }
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle>Roles Management</CardTitle>
            <Badge variant="secondary">{roles?.total || 0} roles</Badge>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button permission={[PERMISSIONS.ROLE_CREATE]} onClick={() => openAddModal()}>
              <Plus className="h-4 w-4 mr-2" /> Add Role
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loadings.getRoles ? (
          <div className="text-center py-16">
            <Loading />
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No roles found
          </div>
        ) : (
          <div className="grid gap-4 overflow-x-auto">
            {filteredRoles.map((role: any) => (
              <div
                key={role.id}
                className="flex items-center justify-between p-6 border rounded-lg hover:bg-accent/50 transition"
              >
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{role.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Group: <span className="font-medium">{role.permission_group_name || "Custom"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {/* Created: {new Date(role.created_at?.split("T")[0]) || "N/A"} */}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    permission={[PERMISSIONS.ROLE_VIEW]}

                    variant="outline"
                    size="sm"
                    onClick={() => openPermissionModal(role.role_group_permissions || [])}
                  >
                    <Eye className="h-4 w-4 mr-1" /> View Permissions
                  </Button>
                  <Button 
                    permission={[PERMISSIONS.ROLE_EDIT]}
                    disabled={role?.name==='Super Admin'}
                  variant="ghost" size="icon" onClick={() => openAddModal(role)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    permission={[PERMISSIONS.ROLE_DELETE]}
                    variant="ghost"
                    size="icon"
                    onClick={() => confirmDelete(role.id)}
                    disabled={role?.name==='Super Admin'}

                  >
                  <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
                {!loadings.getRoles && (
          <Pagination
            recordsPerPage={recordsPerPage}
            setRecordsPerPage={setRecordsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalRecords={totalRecords}
            className="bg-theme-white"
            recordsPerPageOptions={[5, 10, 20, 50]}
          />
        )}
      </CardContent>

      {/* Reusing your existing modals – perfect! */}
      <AddRoleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        roleToEdit={editingRole}
      />

      <PermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        permissions={selectedPermissions}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
      />
    </Card>
  );
}