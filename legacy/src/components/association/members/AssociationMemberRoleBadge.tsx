import { Badge } from "@/components/ui/badge";
import {
  ASSOCIATION_ROLE_LABELS,
  type AssociationRole,
} from "@/hooks/useAssociation";
import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<AssociationRole, string> = {
  president: "bg-[#E84A2B]/15 text-[#E84A2B] border-[#E84A2B]/30",
  vice_president: "bg-[#F26B2E]/15 text-[#F26B2E] border-[#F26B2E]/30",
  secretaire: "bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/30",
  tresorier: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  responsable: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  benevole: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  membre: "bg-slate-500/15 text-mp-ink-muted border-slate-500/30",
};

interface Props {
  role: AssociationRole;
  className?: string;
}

const AssociationMemberRoleBadge = ({ role, className }: Props) => (
  <Badge
    variant="outline"
    className={cn("text-xs font-medium", ROLE_STYLES[role], className)}
  >
    {ASSOCIATION_ROLE_LABELS[role]}
  </Badge>
);

export default AssociationMemberRoleBadge;
