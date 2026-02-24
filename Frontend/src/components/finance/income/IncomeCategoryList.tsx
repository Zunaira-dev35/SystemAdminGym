// src/pages/finance/IncomeCategoryList.tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Loading from "@/components/shared/loaders/Loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import DeleteConfirmationModal from "@/components/shared/modal/DeleteConfirmationModal";
import Pagination from "@/components/shared/Pagination";
import {
  getIncomeCategoriesAsyncThunk,
  createOrUpdateIncomeCategoryAsyncThunk,
  deleteIncomeCategoryAsyncThunk,
} from "@/redux/pagesSlices/financeSlice";
import { PERMISSIONS } from "@/permissions/permissions";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";

type IncomeCategoryListProps = {
  onRegisterAdd?: (openFn: () => void) => void;
};

interface FormErrors {
  title?: string;
  description?: string;
  general?: string;
}

export default function IncomeCategoryList({ onRegisterAdd }: IncomeCategoryListProps) {
  const dispatch = useDispatch<any>();
  const { incomeCategories, loadings } = useSelector((state: any) => state.finance);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(undefined);

  useEffect(() => {
    dispatch(
      getIncomeCategoriesAsyncThunk({ disable_page_param: 1, search: searchTerm || undefined,        filter_branch_id: filterBranchId,
 })
    );
  }, [currentPage, searchTerm, dispatch, recordsPerPage,filterBranchId]);

  useEffect(() => {
    if (onRegisterAdd) {
      onRegisterAdd(openAddDialog);
    }
  }, [onRegisterAdd]);

  const resetForm = () => {
    setFormData({ title: "", description: "" });
    setFormErrors({});
    setIsEditMode(false);
    setSelectedCategory(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (cat: any) => {
    setIsEditMode(true);
    setSelectedCategory(cat);
    setFormData({ title: cat.title, description: cat.description || "" });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (id: number) => {
    setCategoryToDelete(id);
    setIsDeleteOpen(true);
  };
  const confirmDelete = async () => {
    try {
      await dispatch(deleteIncomeCategoryAsyncThunk({ id: categoryToDelete! })).unwrap();
      toast({ title: "Deleted", description: "Category removed" });
      // refresh
    } catch (err: any) {
      console.log('err', err);
    } finally {
      setIsDeleteOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleSubmit = async () => {
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      ...(isEditMode && selectedCategory?.id && { id: selectedCategory.id }),
    };

    setFormErrors({});

    try {
      await dispatch(createOrUpdateIncomeCategoryAsyncThunk(payload)).unwrap();

      setIsDialogOpen(false);
      toast({ title: "Success", description: isEditMode ? "Updated" : "Created" });
      dispatch(getIncomeCategoriesAsyncThunk({
        page: currentPage,
        limit: recordsPerPage,
        search: searchTerm || undefined,
      }));
    } catch (err: any) {
      console.log('err', err);
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Income Categories</CardTitle>
            <div className="flex gap-2 items-center">
              {/* <Button onClick={openAddDialog}
              permission={PERMISSIONS.INCOME_CREATE}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button> */}
                              <HeaderBranchFilter onBranchChange={setFilterBranchId} />

              <div className="relative">
                <Search className="absolute left-3 top-1/2 mt-1 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 max-w-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadings.getIncomeCategories ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-16">
                    <Loading />
                  </TableCell>
                </TableRow>
              ) : incomeCategories.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-16 text-muted-foreground">
                    No income categories found
                  </TableCell>
                </TableRow>
              ) : (
                incomeCategories.data.map((cat: any) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {cat.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(cat)}
                          permission={PERMISSIONS.INCOME_EDIT}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteDialog(cat.id)}
                          permission={PERMISSIONS.INCOME_DELETE}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {incomeCategories?.meta && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalRecords={incomeCategories.meta.total || 0}
                recordsPerPage={recordsPerPage}
                setRecordsPerPage={setRecordsPerPage}
                recordsPerPageOptions={[10, 20, 50]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit" : "Add"} Income Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formErrors.general && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md text-center">
                {formErrors.general}
              </div>
            )}
            <div>
              <Label>Title <span className="text-white">*</span></Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Membership Fees"
                className={formErrors.title ? "border-red-500" : ""}
              />
              {formErrors.title && <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>}
            </div>
            <div>
              <Label>Description <span className="text-muted-foreground">(Optional)</span></Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
                className={formErrors.description ? "border-red-500" : ""}
              />
              {formErrors.description && <p className="text-sm text-red-500 mt-1">{formErrors.description}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loadings.createOrUpdateIncomeCategory}>
              {loadings.createOrUpdateIncomeCategory ? "Saving..." : isEditMode ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Income Category"
        message="Are you sure you want to delete this income category? This action cannot be undone."
      />
    </div>
  );
}