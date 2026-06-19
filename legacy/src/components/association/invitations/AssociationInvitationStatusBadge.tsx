import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type InvitationStatus = "pending" | "accepted" | "rejected" | "expired";

const STATUS_CONFIG: Record<InvitationStatus, { label: string; className: string }> = {
  pending: {
    label: "En attente",
    className: "bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/30",
  },
  accepted: {
    label: "Acceptée",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  rejected: {
    label: "Annulée",
    className: "bg-slate-500/15 text-mp-ink-muted border-slate-500/30",
  },
  expired: {
    label: "Expirée",
    className: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
};

interface Props {
  status: InvitationStatus;
  className?: string;
}

const AssociationInvitationStatusBadge = ({ status, className }: Props) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
};

export default AssociationInvitationStatusBadge;
