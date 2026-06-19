import { Pencil, UserSquare2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ASSOCIATION_ROLE_LABELS,
  type AssociationRole,
} from "@/hooks/useAssociation";
import {
  ENGAGEMENT_LABELS,
  ENGAGEMENT_COLORS,
  MEMBERSHIP_STATUS_LABELS,
  MEMBERSHIP_STATUS_COLORS,
  type MembershipV2,
} from "@/hooks/association/useAssociationMembersV2";

// ──────────────────────────────────────────────
// Helpers locaux
// ──────────────────────────────────────────────

const ROLE_STYLES: Record<AssociationRole, string> = {
  president: "bg-[#E84A2B]/15 text-[#E84A2B] border-[#E84A2B]/30",
  vice_president: "bg-[#F26B2E]/15 text-[#F26B2E] border-[#F26B2E]/30",
  secretaire: "bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/30",
  tresorier: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  responsable: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  benevole: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  membre: "bg-slate-500/15 text-mp-ink-muted border-slate-500/30",
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getOriginLabel(member: MembershipV2): string {
  switch (member.belonging_status) {
    case "invite":
      return "Via invitation";
    case "dossier_commence":
    case "a_valider":
    case "valide":
      return "Via bulletin d'adhésion";
    default:
      return "—";
  }
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface Props {
  member: MembershipV2 | null;
  canManage: boolean;
  onEdit: (member: MembershipV2) => void;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

const MemberDetailPanel = ({ member, canManage, onEdit }: Props) => {
  // État vide
  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-2xl border border-white/6 bg-white/2 text-center px-6 py-12">
        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <UserSquare2 className="w-7 h-7 text-mp-ink-muted" />
        </div>
        <p className="text-sm font-medium text-mp-ink-muted mb-1">Fiche membre</p>
        <p className="text-xs text-mp-ink-muted max-w-[200px]">
          Sélectionnez un membre dans la liste pour voir sa fiche.
        </p>
      </div>
    );
  }

  const displayName =
    member.profile?.display_name || member.profile?.username || "Membre";
  const initials = displayName.charAt(0).toUpperCase();
  const membershipStatusKey = member.membership_status || "active";
  const membershipLabel = MEMBERSHIP_STATUS_LABELS[membershipStatusKey] || "Inconnu";
  const membershipColor = MEMBERSHIP_STATUS_COLORS[membershipStatusKey] || "bg-slate-500/15 text-mp-ink-muted border-slate-500/30";
  const engagementLabel = ENGAGEMENT_LABELS[member.engagement_level] || member.engagement_level;
  const engagementColor = ENGAGEMENT_COLORS[member.engagement_level] || "bg-slate-500/20 text-slate-300 border-slate-500/30";
  const origin = getOriginLabel(member);

  const isBulletinPending =
    member.belonging_status === "invite" || member.belonging_status === "dossier_commence";

  return (
    <div className="rounded-2xl border border-white/8 bg-[#0D1117]/80 overflow-hidden">
      {/* Header avec avatar et nom */}
      <div className="relative bg-gradient-to-b from-white/4 to-transparent p-5 pb-4 border-b border-white/6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-white/10 shrink-0">
            <AvatarImage src={member.profile?.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-[#E84A2B]/15 text-[#E84A2B] text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base font-bold text-white truncate leading-tight">
              {displayName}
            </h3>
            {member.profile?.username && (
              <p className="text-xs text-mp-ink-muted mt-0.5">
                @{member.profile.username}
              </p>
            )}
            {member.title && (
              <p className="text-xs text-mp-ink-muted mt-1.5 italic">
                {member.title}
              </p>
            )}
          </div>
        </div>

        {/* Badges rôle + statut */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge
            variant="outline"
            className={cn("text-xs font-medium", ROLE_STYLES[member.role])}
          >
            {ASSOCIATION_ROLE_LABELS[member.role]}
          </Badge>
          <Badge
            variant="outline"
            className={cn("text-xs font-medium border", membershipColor)}
          >
            {membershipLabel}
          </Badge>
        </div>
      </div>

      {/* Détails */}
      <div className="p-4 space-y-0 divide-y divide-white/5">
        <DetailRow label="Niveau d'engagement">
          <Badge
            variant="outline"
            className={cn("text-xs font-medium border", engagementColor)}
          >
            {engagementLabel}
          </Badge>
        </DetailRow>

        <DetailRow label="Origine">
          <span className="text-sm text-slate-300">{origin}</span>
        </DetailRow>

        <DetailRow label="Membre depuis">
          <span className="text-sm text-slate-300">{formatDate(member.joined_at)}</span>
        </DetailRow>

        <DetailRow label="Dernière mise à jour">
          <span className="text-sm text-slate-300">{formatDate(member.updated_at)}</span>
        </DetailRow>

        {/* Avertissement si bulletin en attente */}
        {isBulletinPending && (
          <div className="pt-3 pb-1">
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/6 px-3 py-2.5">
              <p className="text-xs text-yellow-300 font-medium mb-0.5">
                Formulaire d'adhésion en attente
              </p>
              <p className="text-[11px] text-yellow-400/70 leading-relaxed">
                {member.belonging_status === "invite"
                  ? "L'invitation a été envoyée. Le formulaire d'adhésion n'a pas encore été rempli."
                  : "Le dossier d'adhésion est en cours de remplissage."}
              </p>
            </div>
          </div>
        )}

        {/* Notes internes */}
        {member.notes && (
          <div className="pt-3 pb-1">
            <p className="text-[10px] text-mp-ink-muted uppercase tracking-wider mb-1.5 font-medium">
              Notes internes
            </p>
            <p className="text-xs text-mp-ink-muted leading-relaxed">{member.notes}</p>
          </div>
        )}
      </div>

      {/* Bouton Éditer */}
      {canManage && (
        <div className="px-4 pb-4">
          <Button
            onClick={() => onEdit(member)}
            className="w-full gap-2 bg-white/6 hover:bg-white/10 text-slate-200 border border-white/10 hover:border-white/20 transition-all"
            variant="outline"
          >
            <Pencil className="w-4 h-4" />
            Éditer la fiche
          </Button>
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Sous-composant ligne de détail
// ──────────────────────────────────────────────

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 gap-3">
      <span className="text-[11px] text-mp-ink-muted font-medium shrink-0">{label}</span>
      <div className="flex items-center justify-end">{children}</div>
    </div>
  );
}

export default MemberDetailPanel;
