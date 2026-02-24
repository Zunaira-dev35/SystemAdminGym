// components/member/MemberSearchCombobox.tsx
import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getAllEmployeesAsyncThunk, getAllMembersAsyncThunk } from "@/redux/pagesSlices/peopleSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { backendBasePath } from "@/constants";

type Member = {
  id: number;
  firstName: string;
  lastName: string;
  userId: string;
  mobile: string;
  photoUrl?: string;
};

export default function EmployeeSearchCombobox({
  onSelect,
}: {
  onSelect: (member: Member) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const { selectedBranchId } = useSelector((state: any) => state.general);
  //   const { data: results = [], isFetching } = useQuery({
  //     queryKey: ["members-search", search],
  //     queryFn: async () => {
  //       if (!search.trim()) return [];
  //     //   const res = await apiRequest(`/api/members/search?q=${encodeURIComponent(search)}`);
  //     const res =await dispatch(getAllMembersAsyncThunk({disable_page_param:1}))
  //       return res.data || [];
  //     },
  //     enabled: search.length >= 2,
  //   });
  const { employees, loadings } = useSelector((state: RootState) => state.people);
  // const membersList = members?.data || [];
  const employeesList = Array.isArray(employees?.data?.data)
    ? employees.data.data
    : employees.data;
  console.log("employeesList", employeesList);
  // Fetch users for dropdown
  const fetchEmployee = async () => {
    await dispatch(
      getAllEmployeesAsyncThunk({params:{
        disable_page_param: 1,
        search: search,
         filter_branch_id:
              selectedBranchId == "all" ? undefined : selectedBranchId,}
      })
    );
  };

  useEffect(() => {
    fetchEmployee();
  }, [dispatch, search,selectedBranchId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between h-14 mt-2 font-medium"
        >
          <span>{search || "Search by ID, Name or Phone..."}</span>
          <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Type to search..."
            value={search}
            onValueChange={setSearch}
            className="h-12"
          />
          <CommandEmpty>
            {loadings.getMembers ? "Searching..." : "No member found"}
          </CommandEmpty>
          <CommandGroup className="max-h-96 overflow-auto">
            {employeesList.map((member: Member) => (
              <CommandItem
                key={member.id}
                onSelect={() => {
                  onSelect(member);
                  setOpen(false);
                  setSearch("");
                }}
                className="cursor-pointer py-4"
              >
                <div className="flex items-center gap-4 w-full">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={
                        member.profile_image
                          ? `${backendBasePath}${member.profile_image}`
                          : undefined
                      }
                    />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">
                      {member.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ID: {member.reference_num}
                    </p>
                  </div>
                  <Check className="ml-auto h-5 w-5 text-green-600 opacity-0 data-[selected=true]:opacity-100" />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
