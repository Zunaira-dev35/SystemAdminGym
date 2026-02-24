// src/components/hrm/AttendanceActions.tsx
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { usePermissions } from "@/permissions/usePermissions";
import { PERMISSIONS } from "@/permissions/permissions";

interface AttendanceActionsProps {
  selectedCount: number;
  onExportPDF: () => void;
}

export default function AttendanceActions({ selectedCount, onExportPDF }: AttendanceActionsProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(PERMISSIONS.ATTENDANCE_EMPLOYEE_EXPORT)) {
    return null;
  }

  return (
    <div className="pt-2">
    <Button variant="outline" size="sm" onClick={onExportPDF} >
      <Download className="h-4 w-4 mr-2" />
      PDF
    </Button>
    </div>
  );
}