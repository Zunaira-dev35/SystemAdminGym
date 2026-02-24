// src/components/settings/UsersTabContent.tsx

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createOrUpdateUserAsyncThunk,
  getUserListAsyncThunk,
  getRolesAsyncThunk,
} from "@/redux/pagesSlices/userSlice";
import { RootState } from "@/redux/store";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Edit, Users, Search, EyeOff, Eye, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { backendBasePath } from "@/constants";
import { PERMISSIONS } from "@/permissions/permissions";
import Loading from "../shared/loaders/Loading";
import Pagination from "../shared/Pagination";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import CustomCheckbox from "@shared/CustomCheckbox";

// Zod schema for validation (same strength as Branches.tsx)
const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  // password: z.string().min(6, "Password must be at least 6 characters").optional(),
  password: z.string()
    .optional()
    .refine(
      (val) => {
        // If value is provided → must be at least 6 chars
        return !val || val.length >= 6;
      },
      { message: "Password must be at least 6 characters" }
    ),
  role_id: z
    .number({ required_error: "Role is required" })
    .int()
    .positive("Please select a valid role"),
  profile_image: z.any().optional(), // File or null
  branch_id: z.array(z.number()).optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface User {
  id: number;
  uid: string;
  name: string;
  phone: string;
  role: string;
  status: "active" | "inactive";
  profile_image?: string;
  roles: Array<{ id: number; name: string }>;
  reference_num?: string;
}

export default function UsersTabContent() {
  const dispatch = useDispatch();
  const {
    userList: users,
    loadings: usersLoading,
    roles,
  } = useSelector((state: RootState) => state.user);
  const branches = useSelector(
    (state: RootState) => state.plan.branchesList || []
  );
  console.log("Branches", branches);
  const planLoadings = useSelector((state: RootState) => state.plan.loadings);
  const [assignBranches, setAssignBranches] = useState(false);

  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [openRoleDropdown, setOpenRoleDropdown] = useState(false);
  const [show, setShow] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const { user: authUser } = useSelector((state: any) => state.auth);

  // Custom phone validation (same as Branches.tsx)
  const validatePhone = (value: string): true | string => {
    if (!value?.trim()) return "Phone number is required";

    const cleaned = value.replace(/[\s\-\(\)]/g, "");
    if (!/^(\+\d{1,4})?\d{7,15}$/.test(cleaned)) {
      return "Please enter a valid phone number (7–15 digits, optional country code)";
    }
    return true;
  };

  // Form with Zod + RHF
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      password: "",
      role_id: undefined,
      profile_image: null,
      branch_id: [],
    },
  });

  // Reset form when dialog opens/closes or editing user changes
  useEffect(() => {
    if (!isAddUserDialogOpen) {
      form.reset();
      setEditingUser(null);
      setAssignBranches(false);
      return;
    }

    if (editingUser) {
      const assignedBranchIds =
        editingUser?.assign_branches?.map((b: any) => b.branch_id) || [];
      form.reset({
        name: editingUser.name || "",
        phone: editingUser.phone || "",
        password: "",
        role_id: editingUser.roles[0]?.id || undefined,
        profile_image: null,
        branch_id: assignedBranchIds,
      });
      setAssignBranches(assignedBranchIds.length > 0);
    } else {
      form.reset({
        name: "",
        phone: "",
        password: "",
        role_id: undefined,
        profile_image: null,
        branch_id: [],
      });
      setAssignBranches(false);
    }
  }, [isAddUserDialogOpen, editingUser, form]);

  // Fetch data
  useEffect(() => {
    dispatch(getRolesAsyncThunk({ disable_page_param: 1 }));
  }, [dispatch]);
  const fetchUsers = () => {
    dispatch(
      getUserListAsyncThunk({
        params: {
          search: searchTerm,
          limit: recordsPerPage,
          page: currentPage,
        },
      })
    );
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, currentPage, recordsPerPage]);

  const handleSave = async (data: UserFormData) => {
    // Extra phone validation (same as Branches)
    const phoneValidation = validatePhone(data.phone);
    if (phoneValidation !== true) {
      form.setError("phone", { message: phoneValidation });
      return;
    }

    const formData = new FormData();
    formData.append("name", data.name.trim());
    formData.append("phone", data.phone.trim());
    formData.append("role_group_id", String(data.role_id));

    if (data.password?.trim()) {
      //!editingUser &&
      formData.append("password", data.password.trim());
    }

    const branchIds: number[] = data.branch_id || [];
    branchIds.forEach((branchId) => {
      formData.append("branch_id[]", String(branchId));
    });

    if (data.profile_image) {
      formData.append("profile_image", data.profile_image);
    }

    if (editingUser?.id) {
      formData.append("id", String(editingUser.id));
    }

    try {
      await dispatch(createOrUpdateUserAsyncThunk(formData)).unwrap();
      toast({
        title: editingUser ? "User Updated" : "User Created",
        description: "Success!",
      });
      setIsAddUserDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.errors || "Failed to save user",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsAddUserDialogOpen(true);
  };

  const totalRecords = users?.total || 0;

  return (
    <div className=" ">
      <div className="flex justify-end">
        <Dialog
          open={isAddUserDialogOpen}
          onOpenChange={(open) => {
            setIsAddUserDialogOpen(open);
            if (!open) {
              setEditingUser(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit User" : "Add New User"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Update user details"
                  : "Create a new system user"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSave)}
                className="grid gap-4 py-4"
              >
                <div className="flex gap-4 items-center">
                  <div className="space-y-2 flex-1">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="name">Name<span className="text-red-500">*</span></Label>
                          <FormControl>
                            <Input
                              id="name"
                              placeholder="Enter Name"
                              {...field}
                              data-testid="input-user-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="userphone">Phone<span className="text-red-500">*</span></Label>
                          <FormControl>
                            <Input
                              id="userphone"
                              type="tel"
                              maxLength={15}
                              placeholder="Enter Phone"
                              {...field}
                              data-testid="input-user-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="role_id"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="userRole">Role<span className="text-red-500">*</span></Label>
                      <Popover
                        open={openRoleDropdown}
                        onOpenChange={setOpenRoleDropdown}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {field.value
                                ? roles?.results?.find(
                                  (r: any) => r.id === field.value
                                )?.name
                                : "Select role..."}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search role..." />
                            <CommandEmpty>
                              {usersLoading.getRoles
                                ? "Loading..."
                                : "No role found"}
                            </CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {roles?.results
                                ?.filter(
                                  (role: any) =>
                                    !["Employee", "Member"].includes(role.name)
                                )
                                .map((role: any) => (
                                  <CommandItem
                                    key={role.id}
                                    onSelect={() => {
                                      field.onChange(role.id);
                                      setOpenRoleDropdown(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === role.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {role.name}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profile_image"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="userProfile">Profile Image</Label>
                      <FormControl>
                        <Input
                          id="userProfile"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            field.onChange(file);
                          }}
                        />
                      </FormControl>

                      {(field.value || editingUser?.profile_image) && (
                        <div className="relative inline-block">
                          <img
                            src={
                              field.value instanceof File
                                ? URL.createObjectURL(field.value)
                                : `${backendBasePath}${editingUser?.profile_image}`
                            }
                            alt="Profile preview"
                            className="mt-3 h-24 w-24 rounded-full object-cover shadow-sm"
                          />
                          {field.value instanceof File && (
                            <span className="absolute top-2 -right-4 bg-chart-3/15 border border-chart-3 text-xs px-2 py-0.5 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* {!editingUser && ( */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="userPassword">Password<span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <FormControl>
                          <Input
                            id="userPassword"
                            type={show ? "text" : "password"}
                            value={field.value || ""}
                            onChange={field.onChange}
                            data-testid="input-user-password"
                            placeholder="Enter Password"
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShow(!show)}
                          className="absolute inset-y-0 right-0 top-2 cursor-pointer flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        >
                          {show ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* )} */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <CustomCheckbox
                      // type="checkbox"
                      id="assignBranches"
                      checked={assignBranches}
                      onChange={(assignBranches) =>
                        setAssignBranches(assignBranches)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      label=" Assign user to specific branches"
                    />
                    {/* <Label
                      htmlFor="assignBranches"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Assign user to specific branches
                    </Label> */}
                  </div>

                  {assignBranches && (
                    <FormField
                      control={form.control}
                      name="branch_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branches</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between"
                                >
                                  {field.value && field.value.length > 0
                                    ? `${field.value.length} branch${field.value.length > 1 ? "es" : ""
                                    } selected`
                                    : "Select branches..."}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search branches..." />
                                <CommandEmpty>
                                  {planLoadings?.getBranchesList
                                    ? "Loading..."
                                    : "No branches found"}
                                </CommandEmpty>
                                <CommandGroup className="max-h-64 overflow-auto">
                                  {Array.isArray(branches) &&
                                    branches?.map((branch: any) => (
                                      <CommandItem
                                        key={branch.id}
                                        onSelect={() => {
                                          const newValue =
                                            field.value?.includes(branch.id)
                                              ? field.value.filter(
                                                (id: number) =>
                                                  id !== branch.id
                                              )
                                              : [
                                                ...(field.value || []),
                                                branch.id,
                                              ];
                                          field.onChange(newValue);
                                        }}
                                      >
                                        <div className="flex gap-2 w-full">
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value?.includes(branch.id)
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div>
                                            {branch.reference_num && (
                                              <span className="text-xs text-muted-foreground mr-1">
                                                {branch.reference_num}
                                              </span>
                                            )}
                                            <span>{branch.name}</span>
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>

                          {field.value && field.value.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {field.value.map((id: number) => {
                                const branch = branches?.find(
                                  (b: any) => b.id === id
                                );
                                return branch ? (
                                  <Badge
                                    key={id}
                                    variant="secondary"
                                    className="font-medium rounded-md"
                                  >
                                    {branch.reference_num && (
                                      <span className="text-xs text-muted-foreground mr-1">
                                        {branch.reference_num}
                                      </span>
                                    )}
                                    {branch.name}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        field.onChange(
                                          field.value.filter(
                                            (x: number) => x !== id
                                          )
                                        );
                                      }}
                                      className="ml-2 hover:text-destructive "
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          )}

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setIsAddUserDialogOpen(false)}
                    data-testid="button-cancel-user"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={usersLoading.createOrUpdateUser}
                    data-testid="button-save-user"
                  >
                    {usersLoading.createOrUpdateUser ? (
                      <>
                        <Loading inButton={true} size="xs" />
                        {editingUser ? "Updating User" : "Saving User"}
                      </>
                    ) : (
                      `${editingUser ? "Update" : "Save"} User`
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rest of your table remains 100% unchanged */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>System Users</CardTitle>
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
                permission={PERMISSIONS.USER_CREATE}
                onClick={() => setIsAddUserDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                {authUser?.type === "default" && <TableHead>Password</TableHead>}
                <TableHead>Role</TableHead>
                <TableHead>Assigned Branches</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading?.getUser ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <Loading />
                  </TableCell>
                </TableRow>
              ) : users?.results?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users?.results?.map((user) => (
                  <TableRow
                    key={user.id}
                    className="hover-elevate"
                    data-testid={`row-user-${user.id}`}
                  >
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {user?.profile_image ? (
                            <AvatarImage
                              className="w-12 h-12 object-contain rounded-full"
                              src={`${backendBasePath}${user?.profile_image}`}
                              alt={user?.name}
                            />
                          ) : null}
                          <AvatarFallback className="w-12 h-12 bg-primary/10 text-primary">
                            {user?.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {user?.reference_num}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <p className="text-sm">{user?.phone}</p>
                      </div>
                    </TableCell>
                    {authUser?.type === "default" && (
                      <TableCell>
                        <div>
                          <p className="text-sm">{user?.password_string ?? "-"}</p>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.roles[0].name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {" "}
                      {/* New cell for branches */}
                      {user.assign_branches.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.assign_branches.map((ab) => {
                            const branch = branches?.find(
                              (b: any) => b.id === ab.branch_id
                            );
                            return branch ? (
                              <Badge
                                key={ab.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {branch.reference_num && (
                                  <span className="text-xs text-muted-foreground mr-1">
                                    {branch.reference_num}
                                  </span>
                                )}
                                {branch.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          None
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.status === "active"
                            ? "bg-chart-3/10 text-chart-3 border-chart-3/20"
                            : "bg-chart-5/10 text-chart-5 border-chart-5/20"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          permission={PERMISSIONS.USER_EDIT}
                          variant="ghost"
                          disabled={user?.type === "default"}
                          size="icon"
                          onClick={() => handleEdit(user)}
                          data-testid={`button-edit-user-${user.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {!usersLoading.getUser && (
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
      </Card>
    </div>
  );
}
