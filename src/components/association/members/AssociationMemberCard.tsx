import { MoreHorizontal, UserMinus, Crown, Ban, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import AssociationMemberRoleBadge from "./AssociationMemberRoleBadge";
import type { MembershipV2 } from "@/hooks/association/useAssociationMembersV2";

interface Props {
  member: MembershipV2;
  isCurrentUser: boolean;
  canManage: boolean;
  isSelected?: boolean;
  onClick?: (member: MembershipV2) => void;
  onEditRole: (member: MembershipV2) => void;
  onDeactivate: (member: MembershipV2) => void;
  onSuspend?: (member: MembershipV2) => void;
  onReactivate?: (member: MembershipV2) => void;
}

const AssociationMemberCard = ({
  member,
  isCurrentUser,
  canManage,
  isSelected = false,
  onClick,
  onEditRole,
  onDeactivate,
  onSuspend,
  onReactivate,
}: Props) => {
  const displayName =
    member.profile?.display_name || member.profile?.username || "Membre";
  const initials = displayName.charAt(0).toUpperCase();
  const joinedDate = new Date(member.joined_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const isInactive = !member.is_active;

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => onClick?.(member)}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(member)}
      className={cn(
        "group flex items-center gap-4 rounded-xl border p-4 transition-all",
        isInactive && "opacity-60",
        isSelected
          ? "border-[#E84A2B]/40 bg-[#E84A2B]/8 ring-1 ring-[#E84A2B]/20"
          : isInactive
          ? "border-mp-border/30 bg-mp-paper/30"
          : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/6",
        onClick && "cursor-pointer"
      )}
    >
      {/* Avatar */}
      <Avatar className="h-11 w-11 shrink-0 border-2 border-white/10">
        <AvatarImage src={member.profile?.avatar_url || undefined} alt={displayName} />
        <AvatarFallback className="bg-[#E84A2B]/10 text-[#E84A2B] text-sm font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-white truncate text-sm">{displayName}</p>
          {isCurrentUser && (
            <Badge
              variant="outline"
              className="text-[10px] bg-[#E84A2B]/10 text-[#E84A2B] border-[#E84A2B]/30 px-1.5 py-0"
            >
              Toi
            </Badge>
          )}
          {isInactive && (
            <Badge
              variant="outline"
              className="text-[10px] bg-slate-500/10 text-mp-ink-muted border-slate-500/30 px-1.5 py-0"
            >
              Suspendu
            </Badge>
          )}
        </div>
        {member.title && (
          <p className="text-xs text-mp-ink-muted truncate mt-0.5">{member.title}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <AssociationMemberRoleBadge role={member.role} />
          <span className="text-[11px] text-mp-ink-muted">Depuis le {joinedDate}</span>
        </div>
      </div>

      {/* Actions (leaders only) */}
      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
              className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-mp-ink-muted hover:text-white"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions membre</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-[#0D1117] border-white/10">
            <DropdownMenuItem
              onSelect={(e) => { e.stopPropagation(); onEditRole(member); }}
              className="gap-2 text-slate-200 focus:bg-white/8 focus:text-white"
            >
              <Crown className="h-4 w-4" />
              Modifier le rôle
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/8" />

            {member.is_active && onSuspend && (
              <DropdownMenuItem
                onSelect={(e) => { e.stopPropagation(); onSuspend(member); }}
                className="gap-2 text-[#F5A623] focus:text-[#F5A623] focus:bg-[#F5A623]/8"
              >
                <Ban className="h-4 w-4" />
                Suspendre
              </DropdownMenuItem>
            )}

            {!member.is_active && onReactivate && (
              <DropdownMenuItem
                onSelect={(e) => { e.stopPropagation(); onReactivate(member); }}
                className="gap-2 text-emerald-400 focus:text-emerald-400 focus:bg-emerald-500/8"
              >
                <RefreshCw className="h-4 w-4" />
                Réactiver
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onSelect={(e) => { e.stopPropagation(); onDeactivate(member); }}
              className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/8"
            >
              <UserMinus className="h-4 w-4" />
              Retirer de l'association
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default AssociationMemberCard;
