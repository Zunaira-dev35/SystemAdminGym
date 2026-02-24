// src/pages/finance/ExpenseCategoryList.tsx
import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getExpenseCategoriesAsyncThunk,
  createOrUpdateExpenseCategoryAsyncThunk,
  deleteExpenseCategoryAsyncThunk,
} from "@/redux/pagesSlices/financeSlice";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Loading from "@/components/shared/loaders/Loading";
import Pagination from "@/components/shared/Pagination";
import DeleteConfirmationModal from "@/components/shared/modal/DeleteConfirmationModal";
import { PERMISSIONS } from "@/permissions/permissions";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";

type ExpenseCategoryListProps = {
  onRegisterAdd?: (openFn: () => void) => void;
};
interface FormErrors {
  title?: string;
  description?: string;
  general?: string;
}

export default function ExpenseCategoryList({ onRegisterAdd }: ExpenseCategoryListProps) {
  const dispatch = useDispatch<any>();
  const { expenseCategories, loadings } = useSelector((state: any) => state.finance);
  // const loading = loadings.getExpenseCategories ?? true;

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ id: 0, title: "", description: "" });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterBranchId, setFilterBranchId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setDebouncedSearchTerm(searchTerm.trim());
    setCurrentPage(1); 
  }, [searchTerm]);

  useEffect(() => {
    if (onRegisterAdd) {
      onRegisterAdd(openAddDialog);
    }
  }, [onRegisterAdd]);

  const refetchCategories = useCallback(() => {
    dispatch(
      getExpenseCategoriesAsyncThunk({
        disable_page_param: 1,
        page: currentPage,
        search: debouncedSearchTerm,
        filter_branch_id: filterBranchId,

      })
    );
  }, [dispatch, debouncedSearchTerm, currentPage, recordsPerPage,filterBranchId]);

  useEffect(() => {
    refetchCategories();
  }, [refetchCategories]);

  const resetForm = () => {
    setFormData({ id: 0, title: "", description: "" });
    setFormErrors({});
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (record: any) => {
    setFormData({
      id: record.id,
      title: record.title,
      description: record.description || "",
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (id: number) => {
    setCategoryToDelete(id);
    setIsDeleteOpen(true);
  };

const confirmDelete = async () => {
  try {
    await dispatch(deleteExpenseCategoryAsyncThunk({ id: categoryToDelete! })).unwrap();
    toast({ title: "Deleted", description: "Category removed" });
    refetchCategories();
  } catch(err: any) {
    console.log('err', err);
  } finally {
    setIsDeleteOpen(false);
    setCategoryToDelete(null);
  }
};
const handleSubmit = async () => {
  if (!formData.title.trim()) {
    setFormErrors({ title: "Title is required" });
    return;
  }

  setFormErrors({});

  const payload = {
    id: formData.id || undefined,
    title: formData.title.trim(),
    description: formData.description.trim() || undefined,
  };

  try {
    await dispatch(createOrUpdateExpenseCategoryAsyncThunk(payload)).unwrap();

    setIsDialogOpen(false);
    toast({ title: "Success", description: formData.id ? "Category updated" : "Category created" });
    refetchCategories();
  } catch(err: any) {
    console.log('err', err);
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Expense Categories</CardTitle>

            <div className="flex items-center gap-3">
              {/* <Button onClick={openAddDialog}
              permission={PERMISSIONS.EXPENSE_CREATE}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button> */}
                <HeaderBranchFilter onBranchChange={setFilterBranchId} />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 mt-1 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
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
                <TableHead className="text-right w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadings.getExpenseCategories ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-64">
                    <div className="flex items-center justify-center h-full">
                      <Loading />
                    </div>
                  </TableCell>
                </TableRow>
              ) : !expenseCategories?.data?.length ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-16 text-muted-foreground">
                    {debouncedSearchTerm ? "No matching categories found" : "No categories found"}
                  </TableCell>
                </TableRow>
              ) : (
                expenseCategories.data.map((cat: any) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.title}</TableCell>
                    <TableCell className="">
                      {cat.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(cat)}
                          permission={PERMISSIONS.EXPENSE_EDIT}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openDeleteDialog(cat.id)}
                          permission={PERMISSIONS.EXPENSE_DELETE}
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

          {expenseCategories?.meta && (
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalRecords={expenseCategories.meta.total || 0}
              recordsPerPage={recordsPerPage}
              setRecordsPerPage={setRecordsPerPage}
              recordsPerPageOptions={[10, 20, 50]}
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {formData.id ? "Edit Category" : "Add New Category"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {formErrors.general && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md text-center">
                {formErrors.general}
              </div>
            )}

            <div>
              <Label>
                Title <span className="text-white">*</span>
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Rent, Utilities"
                className={formErrors.title ? "border-red-500" : ""}
              />
              {formErrors.title && (
                <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>
              )}
            </div>

            <div>
              <Label>Description (Optional)</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {formData.id ? "Update" : "Create"} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Expense Category"
        message="Are you sure you want to delete this expense category? This action cannot be undone."
      />
    </div>
  );
}