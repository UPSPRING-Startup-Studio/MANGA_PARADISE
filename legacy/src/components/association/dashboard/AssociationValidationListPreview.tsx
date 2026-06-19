import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  ArrowRight,
  Clock,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import type { PendingMember } from "@/hooks/association/useAssociationDashboard";

interface AssociationValidationListPreviewProps {
  members: PendingMember[] | undefined;
  isLoading: boolean;
}

const STATUS_BADGE_MAP: Record<string, { label: string; className: string }> = {
  pending_payment: {
    label: "Paiement",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  en_attente: {
    label: "En attente",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
};

function getInitials(member: PendingMember): string {
  const name = member.display_name || member.username || "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
  return `Il y a ${Math.floor(diffDays / 30)} mois`;
}

const AssociationValidationListPreview = ({
  members,
  isLoading,
}: AssociationValidationListPreviewProps) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-7 w-24 rounded-md" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayMembers = members || [];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <ClipboardList className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              File de validation
            </h3>
            <p className="text-[11px] text-muted-foreground/60">
              {displayMembers.length > 0
                ? `${displayMembers.length} dossier${displayMembers.length > 1 ? "s" : ""} en attente`
                : "File vide"}
            </p>
          </div>
        </div>
        <Link to="/association/adhesions">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 h-7 text-muted-foreground hover:text-foreground"
          >
            Ouvrir la file
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="px-5 pb-5">
        {displayMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6 text-emerald-400/50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground/60">
                Aucun dossier en attente
              </p>
              <p className="text-xs text-muted-foreground/40 mt-1.5 max-w-[240px]">
                Toutes les adhesions ont ete traitees
              </p>
            </div>
            <Link to="/association/adhesions">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-white/10 hover:border-white/20 text-xs mt-1"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Voir toutes les adhesions
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {displayMembers.map((member, index) => {
              const statusBadge =
                STATUS_BADGE_MAP[member.membership_status || ""] || {
                  label: member.membership_status || "Inconnu",
                  className: "bg-white/10 text-muted-foreground border-white/10",
                };

              return (
                <div
                  key={member.id}
                  className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-all cursor-pointer"
                >
                  {/* Priority dot */}
                  <div className="w-1.5 flex-shrink-0">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        index === 0 ? "bg-amber-400" : "bg-white/10"
                      }`}
                    />
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-8 w-8 flex-shrink-0 border border-white/[0.06]">
                    <AvatarImage
                      src={member.avatar_url || undefined}
                      alt={member.display_name || member.username || ""}
                    />
                    <AvatarFallback className="bg-white/[0.06] text-foreground/70 text-[10px] font-bold">
                      {getInitials(member)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.display_name || member.username || "Sans nom"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 h-4 ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </Badge>
                      {member.created_at && (
                        <span className="text-[10px] text-muted-foreground/40 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatRelativeDate(member.created_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action hint */}
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-all flex-shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssociationValidationListPreview;
