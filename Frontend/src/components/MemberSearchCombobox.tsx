// components/member/MemberSearchCombobox.tsx
import { useEffect, useState, useMemo } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getAllMembersAsyncThunk } from "@/redux/pagesSlices/peopleSlice";
import { backendBasePath } from "@/constants";
import { cn } from "@/lib/utils";

type Member = {
  id: number;
  name: string; // full name (or adjust to firstName + lastName)
  reference_num: string;
  profile_image?: string;
  status?: string;
  [key: string]: any;
};

interface MemberSearchComboboxProps {
  onSelect: (member: Member) => void;
  filterStatus?: "active" | "inactive"; // NEW: "active" or "inactive"
  placeholder?: string;
}

export default function MemberSearchCombobox({
  onSelect,
  filterStatus, // "active" or "inactive"
  placeholder = "Search by ID, Name or Phone...",
}: MemberSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const { members, loadings } = useSelector((state: RootState) => state.people);
  const { selectedBranchId } = useSelector((state: any) => state.general);

  // Get all members from Redux
  const allMembers = useMemo(() => {
    return Array.isArray(members?.data?.data)
      ? members.data.data
      : members?.data || [];
  }, [members]);

  // Filter members based on filterStatus prop
  const filteredMembers = useMemo(() => {
    if (!filterStatus) return allMembers; // no filter → show all

    return allMembers.filter((member: Member) => {
      const status = member.status?.toLowerCase() || "";

      if (filterStatus === "active") {
        return status === "active" || status === "frozen";
      }
      if (filterStatus === "inactive") {
        return status === "inactive" || status === "expired";
      }
      return true; // fallback
    });
  }, [allMembers, filterStatus]);

  // Optional: Load members if empty
  useEffect(() => {
    if (allMembers.length === 0) {
      dispatch(
        getAllMembersAsyncThunk({
          disable_page_param: 1,
          filter_branch_id:
            selectedBranchId === "all" ? undefined : selectedBranchId,
        })
      );
    }
  }, [dispatch, allMembers.length, selectedBranchId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-14 font-medium"
        >
          <span className="truncate">{search || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={true}>
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
            {filteredMembers
              .filter((member: Member) =>
                `${member.name || ""} ${member.reference_num || ""}`
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )
              .map((member: Member) => (
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

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg truncate">
                        {member.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        ID: {member.reference_num}
                      </p>
                      {member.status && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Status: {member.status}
                        </p>
                      )}
                    </div>

                    <Check
                      className={cn(
                        "ml-auto h-5 w-5 shrink-0",
                        "opacity-0 data-[selected=true]:opacity-100"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
