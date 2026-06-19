import { MoreHorizontal, RefreshCw, XCircle, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AssociationInvitationStatusBadge from "./AssociationInvitationStatusBadge";
import AssociationMemberRoleBadge from "@/components/association/members/AssociationMemberRoleBadge";
import type { AssociationInvitation } from "@/hooks/useAssociationInvitations";

interface Props {
  invitations: AssociationInvitation[];
  isLoading: boolean;
  isReadOnly: boolean;
  onCancel: (invitation: AssociationInvitation) => void;
  onResend: (invitation: AssociationInvitation) => void;
  onCreateNew: () => void;
}

const AssociationInvitationsList = ({
  invitations,
  isLoading,
  isReadOnly,
  onCancel,
  onResend,
  onCreateNew,
}: Props) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-border/30 bg-[#111827]/40 p-4"
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <UserPlus className="w-16 h-16 text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-display text-foreground mb-2">
          Aucune invitation
        </h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Aucune invitation en cours. Invite un nouveau membre pour commencer.
        </p>
        {!isReadOnly && (
          <Button
            onClick={onCreateNew}
            className="gap-2 bg-[#E84A2B] hover:bg-[#E84A2B]/90"
          >
            <UserPlus className="h-4 w-4" />
            Inviter un membre
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {invitations.map((inv) => {
        const inviteeName =
          inv.invitee?.display_name || inv.invitee?.username || "Utilisateur";
        const inviterName =
          inv.inviter?.display_name || inv.inviter?.username || "Inconnu";
        const createdDate = new Date(inv.created_at).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const canAct =
          !isReadOnly && (inv.status === "pending" || inv.status === "expired");

        return (
          <div
            key={inv.id}
            className="group flex items-center gap-4 rounded-xl border border-border/50 bg-[#111827]/60 p-4 transition-colors hover:border-[#E84A2B]/25 hover:bg-[#111827]/80"
          >
            {/* Avatar invité */}
            <Avatar className="h-10 w-10 shrink-0 border-2 border-border/60">
              <AvatarImage
                src={inv.invitee?.avatar_url || undefined}
                alt={inviteeName}
              />
              <AvatarFallback className="bg-[#E84A2B]/10 text-[#E84A2B] text-sm font-semibold">
                {inviteeName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-foreground truncate">
                  {inviteeName}
                </p>
                <AssociationInvitationStatusBadge status={inv.status} />
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <AssociationMemberRoleBadge role={inv.role} className="text-[10px]" />
                <span className="text-[11px] text-muted-foreground/70">
                  Invité par {inviterName}
                </span>
                <span className="text-[11px] text-muted-foreground/50">
                  le {createdDate}
                </span>
              </div>
              {inv.message && (
                <p className="text-[11px] text-muted-foreground/60 truncate mt-1 italic">
                  "{inv.message}"
                </p>
              )}
            </div>

            {/* Accepted date */}
            {inv.status === "accepted" && inv.responded_at && (
              <span className="hidden sm:block text-[11px] text-emerald-400/70 shrink-0">
                Acceptée le{" "}
                {new Date(inv.responded_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}

            {/* Actions (leaders only, pending/expired) */}
            {canAct && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions invitation</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => onResend(inv)}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Renvoyer l'invitation
                  </DropdownMenuItem>
                  {inv.status === "pending" && (
                    <DropdownMenuItem
                      onClick={() => onCancel(inv)}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <XCircle className="h-4 w-4" />
                      Annuler l'invitation
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AssociationInvitationsList;
