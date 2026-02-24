// src/components/hrm/PayrollActions.tsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter, Download, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import EmployeeSearchCombobox from "./EmployeeSearchCombobox";
import { Input } from "./ui/input";
import { formatDateToShortString } from "@/utils/helper";
import { HeaderBranchFilter } from "@/components/HeaderBranchFilter";
import { PERMISSIONS } from "@/permissions/permissions";
import { usePermissions } from "@/permissions/usePermissions";

const monthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) =>
  (currentYear - 2 + i).toString()
);
// const authUser = useSelector((state: any) => state.auth?.user);

interface PayrollActionsProps {
  selectedCount: number;
  onExportPDF: () => void;
  filterText: string;
  onFilterChange: (month: string | null, year: string | null) => void;
  onGeneratePayroll: (payload: {
    start_date: string;
    end_date: string;
    employee_id?: string;
    branch_id?: string;
  }) => void;
  generateLoading?: boolean;
  authUser?: any;
}

export default function PayrollActions({
  selectedCount,
  onExportPDF,
  filterText,
  onFilterChange,
  onGeneratePayroll,
  generateLoading = false,
  authUser,
}: PayrollActionsProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(undefined);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(undefined);
  const [startDateError, setStartDateError] = useState("");
  const [endDateError, setEndDateError] = useState("");

  const { branchesList } = useSelector((state: any) => state.plan);  // Assuming branches from Redux

  // Use "all" instead of "" for "All months"
  const [tempFilterMonth, setTempFilterMonth] = useState<string>("all");
  const [tempFilterYear, setTempFilterYear] = useState<string>(
    currentYear.toString()
  );
  const { hasPermission } = usePermissions();

  const handleGenerate = () => {
    // Validate dates
    if (!startDate || !endDate) {
      setStartDateError(!startDate ? "Start date is Required" : "");
      setEndDateError(!endDate ? "End date is required" : "");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setEndDateError("End date must be after start date");
      return;
    }

    onGeneratePayroll({
      start_date: startDate,
      end_date: endDate,
      employee_id: selectedEmployeeId,
      // branch_id: selectedBranchId === "all" ? undefined : selectedBranchId,
    });

    // Reset form
    setStartDate("");
    setEndDate("");
    setSelectedEmployeeId(undefined);
    setSelectedEmployeeName("");
    setSelectedBranchId(undefined);
    setGenerateOpen(false);
  };

  const handleFilter = () => {
    onFilterChange(
      tempFilterMonth === "all" ? null : tempFilterMonth,
      tempFilterYear
    );
    setFilterOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-4">
      {/* Generate Payroll */}
      {hasPermission(PERMISSIONS.PAYROLL_CREATE) && (
        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogTrigger asChild>
            <Button  className="gap-2">
              {/* <RotateCcw className="h-4 w-4" /> */}
              Generate Payroll
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Generate Payroll</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Branch Filter */}
              {/* <div className="space-y-2">
                <Label>Branch (Optional)</Label>
                <HeaderBranchFilter
                  selectedBranchId={selectedBranchId || "all"}
                  setSelectedBranchId={(value) =>
                    setSelectedBranchId(value === "all" ? undefined : value)
                  }
                />
              </div> */}

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date <span  className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  {startDateError && (
                    <p className="text-sm text-red-500">{startDateError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>End Date <span  className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  {endDateError && (
                    <p className="text-sm text-red-500">{endDateError}</p>
                  )}
                </div>
              </div>
               {/* Employee Filter */}
              <div className="space-y-2">
                <Label>Employee (Optional)</Label>
                <EmployeeSearchCombobox
                  onSelect={(employee) => {
                    setSelectedEmployeeId(employee?.id?.toString() || undefined);
                    setSelectedEmployeeName(employee?.name || "");
                  }}
                />
                {selectedEmployeeId && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {selectedEmployeeName} - {selectedEmployeeId}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setGenerateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={generateLoading}>
                {generateLoading ? "Generating..." : "Generate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Filter */}
      {/* <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            {filterText}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Filter Payroll</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Month</Label>
              <Select value={tempFilterMonth} onValueChange={setTempFilterMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {monthNames.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year</Label>
              <Select value={tempFilterYear} onValueChange={setTempFilterYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFilterOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFilter}>Apply Filter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

      {/* Export PDF */}
      
        <Button variant="outline" onClick={onExportPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Export PDF 
        </Button>
    
    </div>
  );
}