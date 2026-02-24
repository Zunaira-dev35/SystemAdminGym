import { cn } from "@/lib/utils";
import { Button } from "./button";

export default function MethodButton({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  icon: any;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      variant={active ? "outline" : "outline"}
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-w-[75px] h-8.5 flex items-center justify-center gap-1 text-xs",
        active && "border-primary text-primary shadow-md"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Button>
  );
}