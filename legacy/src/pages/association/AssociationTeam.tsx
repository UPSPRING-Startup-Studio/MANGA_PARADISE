import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Crown,
  Shield,
  UserPlus,
  GripVertical,
  Eye,
  EyeOff,
  Calendar,
  Pencil,
  SearchX,
} from "lucide-react";
import { toast } from "sonner";
import { useAssociationGovernance } from "@/hooks/useAssociationGovernance";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  useAssociationBureau,
  useUpdateMemberEngagement,
  ENGAGEMENT_LABELS,
  ENGAGEMENT_COLORS,
  type MembershipV2,
} from "@/hooks/association/useAssociationMembersV2";
import {
  LEADER_ROLES,
  ASSOCIATION_ROLE_LABELS,
  type Association,
  type AssociationRole,
} from "@/hooks/useAssociation";
import MemberEntryWizard from "@/components/association/members/MemberEntryWizard";

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
}

const BUREAU_ROLES: AssociationRole[] = [
  "president",
  "vice_president",
  "tresorier",
  "secretaire",
];

function getDisplayName(m: MembershipV2): string {
  return m.profile?.display_name || m.profile?.username || "Membre";
}

const ROLE_COLORS: Partial<Record<AssociationRole, string>> = {
  president: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  vice_president: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  tresorier: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  secretaire: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  responsable: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

const AssociationTeam = () => {
  const { association, role: viewerRole } = useOutletContext<AssociationContext>();
  const associationId = association?.id;
  const gov = useAssociationGovernance();

  const { data: bureau, isLoading } = useAssociationBureau(associationId);
  const updateEngagement = useUpdateMemberEngagement();

  const [editMember, setEditMember] = useState<MembershipV2 | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const isLeader = viewerRole ? LEADER_ROLES.includes(viewerRole) : false;
  const isBureau = viewerRole ? BUREAU_ROLES.includes(viewerRole) : false;

  // Split bureau / responsables
  const { bureauMembers, staffMembers } = useMemo(() => {
    if (!bureau) return { bureauMembers: [], staffMembers: [] };
    const bureauM = bureau.filter((m) => BUREAU_ROLES.includes(m.role));
    const staffM = bureau.filter((m) => m.role === "responsable");
    return {
      bureauMembers: bureauM.sort((a, b) => a.display_order - b.display_order),
      staffMembers: staffM.sort((a, b) => a.display_order - b.display_order),
    };
  }, [bureau]);

  if (!association) return null;

  return (
    <div className="space-y-8">
      {/* Governance banner */}
      {(gov.isBlocked || gov.isRestricted) && (
        <div className={`rounded-lg border p-3 mb-4 ${gov.isBlocked ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
          <p className={`text-sm ${gov.isBlocked ? "text-red-300" : "text-amber-300"}`}>
            {gov.readOnlyReason || gov.restrictedReason}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-display text-foreground">
            Équipe & Bureau
          </h1>
          <p className="text-muted-foreground mt-1">
            Membres du bureau et responsables de {association.name}
          </p>
        </div>
        {isBureau && (
          <Button
            onClick={() => setWizardOpen(true)}
            disabled={!gov.canManageMembers}
            className="gap-2 bg-[#E84A2B] hover:bg-[#E84A2B]/90 shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            Ajouter au bureau
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border/30 bg-[#111827]/40 p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bureau section */}
      {!isLoading && bureauMembers.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-display text-foreground">Bureau</h2>
            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300 ml-2">
              {bureauMembers.length} membre{bureauMembers.length > 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {bureauMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                canEdit={isBureau}
                onEdit={() => setEditMember(member)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Staff / Responsables section */}
      {!isLoading && staffMembers.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-display text-foreground">
              Responsables
            </h2>
            <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300 ml-2">
              {staffMembers.length} membre{staffMembers.length > 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {staffMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                canEdit={isBureau}
                onEdit={() => setEditMember(member)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!isLoading && bureauMembers.length === 0 && staffMembers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Crown className="w-16 h-16 text-muted-foreground/20 mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">
            Aucun membre du bureau
          </h2>
          <p className="text-muted-foreground max-w-md mb-6">
            L'équipe dirigeante n'a pas encore été constituée.
          </p>
          {isBureau && (
            <Button
              onClick={() => setWizardOpen(true)}
              disabled={!gov.canManageMembers}
              className="gap-2 bg-[#E84A2B] hover:bg-[#E84A2B]/90"
            >
              <UserPlus className="h-4 w-4" />
              Constituer le bureau
            </Button>
          )}
        </div>
      )}

      {/* Edit Sheet */}
      <TeamEditSheet
        member={editMember}
        onClose={() => setEditMember(null)}
        onSave={(membershipId, updates) => {
          if (!gov.canManageMembers) { toast.error(gov.readOnlyReason || gov.restrictedReason || "Action non autorisée"); return; }
          updateEngagement.mutate(
            { membershipId, updates },
            { onSuccess: () => setEditMember(null) }
          );
        }}
        isSaving={updateEngagement.isPending}
      />

      {/* Entry Wizard */}
      {associationId && (
        <MemberEntryWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          associationId={associationId}
        />
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Team Member Card
// ──────────────────────────────────────────────

function TeamMemberCard({
  member,
  canEdit,
  onEdit,
}: {
  member: MembershipV2;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const name = getDisplayName(member);
  const roleColor = ROLE_COLORS[member.role] || "bg-gray-500/20 text-gray-300 border-gray-500/30";
  const hasMandateDates = member.mandate_start || member.mandate_end;

  return (
    <Card className="p-5 bg-[#111827]/40 border-border/30 hover:border-amber-500/20 transition-all group relative">
      {/* Edit button */}
      {canEdit && (
        <button
          onClick={onEdit}
          className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/5 transition-all"
        >
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar className="h-14 w-14">
            <AvatarImage src={member.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-amber-500/20 text-amber-300 text-lg">
              {name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {member.public_visibility && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Eye className="w-3 h-3 text-emerald-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{name}</p>
          {member.title && (
            <p className="text-sm text-muted-foreground">{member.title}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge
              variant="outline"
              className={cn("text-xs border", roleColor)}
            >
              {ASSOCIATION_ROLE_LABELS[member.role]}
            </Badge>
          </div>
          {hasMandateDates && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>
                Mandat :{" "}
                {member.mandate_start
                  ? new Date(member.mandate_start).toLocaleDateString("fr-FR", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
                {" → "}
                {member.mandate_end
                  ? new Date(member.mandate_end).toLocaleDateString("fr-FR", {
                      month: "short",
                      year: "numeric",
                    })
                  : "en cours"}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ──────────────────────────────────────────────
// Edit Sheet
// ──────────────────────────────────────────────

function TeamEditSheet({
  member,
  onClose,
  onSave,
  isSaving,
}: {
  member: MembershipV2 | null;
  onClose: () => void;
  onSave: (membershipId: string, updates: Record<string, unknown>) => void;
  isSaving: boolean;
}) {
  const [mandateStart, setMandateStart] = useState("");
  const [mandateEnd, setMandateEnd] = useState("");
  const [publicVisibility, setPublicVisibility] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(999);

  // Sync state when member changes
  useState(() => {
    if (member) {
      setMandateStart(member.mandate_start || "");
      setMandateEnd(member.mandate_end || "");
      setPublicVisibility(member.public_visibility);
      setDisplayOrder(member.display_order);
    }
  });

  // Reset on member change
  useMemo(() => {
    if (member) {
      setMandateStart(member.mandate_start || "");
      setMandateEnd(member.mandate_end || "");
      setPublicVisibility(member.public_visibility);
      setDisplayOrder(member.display_order);
    }
  }, [member]);

  if (!member) return null;

  const name = getDisplayName(member);

  return (
    <Sheet open={!!member} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto bg-[#0D0D0D] border-l border-border/50"
      >
        <SheetHeader>
          <SheetTitle className="text-foreground">
            Modifier — {name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Début mandat
              </Label>
              <Input
                type="date"
                value={mandateStart}
                onChange={(e) => setMandateStart(e.target.value)}
                className="bg-[#111827]/60 border-border/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Fin mandat
              </Label>
              <Input
                type="date"
                value={mandateEnd}
                onChange={(e) => setMandateEnd(e.target.value)}
                className="bg-[#111827]/60 border-border/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Ordre d'affichage
            </Label>
            <Input
              type="number"
              min={1}
              max={99}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              className="bg-[#111827]/60 border-border/40 w-24"
            />
            <p className="text-xs text-muted-foreground">
              Plus petit = affiché en premier sur la fiche publique
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[#111827]/40 border border-border/30">
            <div>
              <p className="text-sm font-medium text-foreground">
                Visibilité publique
              </p>
              <p className="text-xs text-muted-foreground">
                Affiché sur la fiche publique de l'association
              </p>
            </div>
            <Switch
              checked={publicVisibility}
              onCheckedChange={setPublicVisibility}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border/30">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={() =>
                onSave(member.id, {
                  mandate_start: mandateStart || null,
                  mandate_end: mandateEnd || null,
                  public_visibility: publicVisibility,
                  display_order: displayOrder,
                })
              }
              disabled={isSaving}
              className="flex-1 bg-[#E84A2B] hover:bg-[#E84A2B]/90"
            >
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default AssociationTeam;
