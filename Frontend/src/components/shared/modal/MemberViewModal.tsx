// components/members/MemberViewModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { backendBasePath } from "@/constants";
import { X } from "lucide-react";

interface Member {
  id: number;
  name: string;
  cnic?: string;
  whatsapp_num?: string;
  phone: string;
  reference_num: string;
  status: "active" | "inactive" | "freeze";
  profile_image?: string | null;
  member_profile?: {
    address?: string | null;
    birth_date?: string | null;
    gender?: string | null;
    current_plan_id?: number | null;
    current_plan_start_date?: string | null;
    current_plan_expire_date?: string | null;
    plan?: {
      id: number;
      name: string;
      fee?: number;
      description?: string;
    } | null;
  } | null;
}

interface MemberViewModalProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MemberViewModal({ member, open, onOpenChange }: MemberViewModalProps) {
  if (!member) return null;

  const profile = member.member_profile;
  const plan = profile?.plan;
  const isFrozen = member.status === "freeze";

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd MMM yyyy");
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = () => {
    switch (member.status) {
      case "active":
        return <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20">Active</Badge>;
      case "frozen":
        return <Badge className="bg-chart-1/10 text-chart-2 border-chart-1/20">Frozen</Badge>;
      case "inactive":
        return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">Inactive</Badge>;
      default:
        return <Badge variant="outline">{member.status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Member Details</span>
            {/* <button
              onClick={() => onOpenChange(false)}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
            </button> */}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Header */}
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 ring-4 ring-background">
              {member.profile_image ? (
                <AvatarImage
                  src={`${backendBasePath}${member.profile_image}`}
                  alt={`${member.name} `}
                />
              ) : (
                <AvatarFallback className="text-2xl">
                  {member.name[0]}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                {member.name} 
              </h2>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{member.reference_num}</Badge>
                {getStatusBadge()}
              </div>
              {/* <div className="text-sm text-muted-foreground">
                Member since {member.created_at ? formatDate(member.created_at) : "N/A"}
              </div> */}
            </div>
          </div>

          <Separator />

          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Personal Information</h3>
              <div className="space-y-3 text-sm">

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{member.phone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CNIC</span>
                  <span className="font-medium">{profile?.cnic ? formatDate(profile.cnic) : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Whats App number</span>
                  <span className="font-medium capitalize">{profile?.whatsapp_num || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium text-right max-w-[200px]">{profile?.address || "-"}</span>
                </div>
              </div>
            </div>

            {/* Membership Plan */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Current Membership</h3>
              {plan ? (
                <div className="space-y-3 text-sm border rounded-lg p-4 bg-muted/30">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-semibold text-primary">{plan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date</span>
                    <span className="font-medium">{formatDate(profile?.current_plan_start_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expiry Date</span>
                    <span className="font-medium">
                      {isFrozen ? (
                        <span className="text-orange-600 font-medium">-</span>
                      ) : (
                        formatDate(profile?.current_plan_expire_date)
                      )}
                    </span>
                  </div>
                  {plan.fee && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fee</span>
                      <span className="font-semibold">PKR {plan.fee.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No active plan</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}