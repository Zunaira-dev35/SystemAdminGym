// src/components/ui/button.tsx

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { usePermissions } from "@/permissions/usePermissions"
// import { usePermissions } from "@/hooks/usePermissions" // ← We'll create this hook

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border border-primary",
        destructive: "bg-destructive text-destructive-foreground border border-destructive-border",
        outline: "border border-button-outline shadow-xs active:shadow-none",
        secondary: "border bg-secondary text-secondary-foreground border border-secondary-border",
        ghost: "border border-transparent",
      },
      size: {
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Permission name required to enable this button (e.g. "Create Member", "Delete Role") */
  permission?: string | string[]
  /** Optional: custom tooltip when disabled due to missing permission */
  permissionTooltip?: string
  /** Show disabled state even if permission exists (for loading, etc.) */
  forceDisabled?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      permission,
      permissionTooltip = "You don't have permission",
      forceDisabled = false,
      disabled: propDisabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"

    // Use our permission hook
    const { hasPermission } = usePermissions()

    // Determine if button should be disabled
    const isMissingPermission = permission
      ? Array.isArray(permission)
        ? !permission.some(p => hasPermission(p))
        : !hasPermission(permission)
      : false

    const isDisabled = forceDisabled || isMissingPermission || propDisabled

    // Optional: Add tooltip if disabled due to permission
    const buttonContent = isMissingPermission && permissionTooltip ? (
      <span
        className="relative group flex"
        title={permissionTooltip}
      >
        {children}
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
          {permissionTooltip}
        </span>
      </span>
    ) : (
      children
    )

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          isDisabled && "cursor-not-allowed opacity-60"
        )}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {buttonContent}
      </Comp>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }