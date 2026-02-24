// src/components/shared/modal/PermissionPreviewModal.tsx

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Shield } from "lucide-react";

interface PermissionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: string[];
  title?: string;
}

export default function PermissionPreviewModal({
  isOpen,
  onClose,
  permissions,
  title = "Assigned Permissions"
}: PermissionPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <Shield className="h-7 w-7 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {permissions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
              {permissions.map((permission, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                >
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground break-words">
                    {permission}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No permissions assigned</p>
            </div>
          )}
        </ScrollArea>

        {permissions.length > 0 && (
          <div className="flex justify-end pt-4 border-t">
            <Badge variant="secondary" className="text-sm">
              {permissions.length} permission{permissions.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}