import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";
import { usePermissions } from "@/permissions/usePermissions"; // adjust path as needed
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    permission?: string;
    permissionMessage?: string;
  }
>(
  (
    {
      className,
      permission,
      permissionMessage = "You don't have permission",
      disabled,
      ...props
    },
    ref
  ) => {
    const { hasPermission } = usePermissions();

    // Determine if switch should be disabled due to missing permission
    const isPermissionMissing = permission ? !hasPermission(permission) : false;
    const isDisabled = disabled || isPermissionMissing;

    return (
      <TooltipProvider>
        <Tooltip disabled={!isPermissionMissing}>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "inline-block",
                isPermissionMissing && "cursor-not-allowed"
              )}
            >
              <SwitchPrimitives.Root
                className={cn(
                  "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
                  className
                )}
                {...props}
                disabled={isDisabled}
                ref={ref}
              >
                <SwitchPrimitives.Thumb
                  className={cn(
                    "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
                  )}
                />
              </SwitchPrimitives.Root>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-black text-white text-xs">
            {permissionMessage}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
