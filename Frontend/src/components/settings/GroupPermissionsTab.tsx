import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getGroupPermissionsAsyncThunk,
  getDefaultPermissionsAsyncThunk,
  createOrUpdateGroupPermissionsAsyncThunk,
  deleteGroupPermissionsAsyncThunk,
  getGroupPermissionByIdAsyncThunk,
} from "@/redux/pagesSlices/userSlice";
import { RootState, AppDispatch } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, ShieldCheck, Edit, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import CreateEditGroupModal from "../../pages/CreateEditGroupModal";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/shared/Pagination";
import { PERMISSIONS } from "@/permissions/permissions";
import Loading from "@/components/shared/loaders/Loading";
import DeleteConfirmationModal from "../shared/modal/DeleteConfirmationModal";
import { useNavigate } from "react-router-dom";

export default function GroupPermissionsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const { groupPermissions, loadings } = useSelector(
    (state: RootState) => state.user
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selecetedTable, setSelectedTable] = useState("");
  const navigate=useNavigate();
  const fetchPermission = async () => {
    try {
      await dispatch(
        getGroupPermissionsAsyncThunk({
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
    fetchPermission();
  }, [dispatch, searchTerm, recordsPerPage, currentPage]);
  const totalRecords = groupPermissions?.total || 0;

  const handleDelete = async () => {
    // if (!confirm("Delete this permission group?")) return;
    try {
      await dispatch(
        deleteGroupPermissionsAsyncThunk({
          params: { permission_group_id: selecetedTable },
        })
      ).unwrap();
      fetchPermission();
      toast({ title: "Group deleted" });
    } catch (err: any) {
      toast({
        title: err.response?.data?.errors || "Failed to delete group",
        variant: "destructive",
      });
    } finally {
      setIsDeleteOpen(false);
      setSelectedTable("");
    }
  };
  const openModal = (group?: any) => {
    navigate(`/settings/permission`)
    setEditingGroup(group || null);
    setIsModalOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <CardTitle>Permission Groups</CardTitle>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-[60%] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Permission Groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            <Button
              permission={[PERMISSIONS.PERMISSION_CREATE]}
              onClick={() => openModal()}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Group
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 overflow-x-auto">
          {loadings.getGroupPermissions ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loading />
            </div>
          ) : groupPermissions?.results?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No permission groups found
            </div>
          ) : (
            groupPermissions?.results?.map((group: any) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-6 border rounded-lg hover:bg-accent/50 transition"
              >
                <div>
                  <h3 className="font-semibold text-lg">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {group.permissions?.length || 0} permissions
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {group.permissions?.length} perms
                  </Badge>
                  <Button
                    permission={[PERMISSIONS.PERMISSION_EDIT]}
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/settings/permission/${group.id}`)}
                    disabled={group?.name==='Default Group'}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    permission={[PERMISSIONS.PERMISSION_DELETE]}
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsDeleteOpen(true);
                      setSelectedTable(group.id);
                    }}
                    disabled={group?.name==='Default Group'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        {!loadings.getGroupPermissions && (
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

      {/* <CreateEditGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        group={editingGroup}
      /> */}
      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Permission Group"
        message="Are you sure you want to delete this Permission Group? This action cannot be undone."
      />
    </Card>
  );
}
