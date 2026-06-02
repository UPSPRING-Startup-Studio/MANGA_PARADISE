import { useState, useMemo } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  SearchX,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  LEADER_ROLES,
  useUpdateMemberRole,
  useDeactivateMember,
  useSuspendMember,
  useReactivateMember,
  type Association,
  type AssociationRole,
  type AssociationMembership,
} from "@/hooks/useAssociation";
import {
  useAssociationMembersV2,
  type MembershipV2,
} from "@/hooks/association/useAssociationMembersV2";
import AssociationMemberCard from "@/components/association/members/AssociationMemberCard";
import AssociationMembersFilters, {
  type SortKey,
} from "@/components/association/members/AssociationMembersFilters";
import AssociationMemberRoleSheet from "@/components/association/members/AssociationMemberRoleSheet";
import AssociationMemberDeactivateDialog from "@/components/association/members/AssociationMemberDeactivateDialog";
import AssociationMemberActionDialog, {
  type MemberActionType,
} from "@/components/association/members/AssociationMemberActionDialog";
import { useAssociationPendingInvitations } from "@/hooks/useAssociationInvitations";
import { useAssociationGovernance } from "@/hooks/useAssociationGovernance";
import MemberEntryWizard from "@/components/association/members/MemberEntryWizard";
import MemberDetailPanel from "@/components/association/members/MemberDetailPanel";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const ROLE_SORT_ORDER: Record<AssociationRole, number> = {
  president: 0,
  vice_president: 1,
  secretaire: 2,
  tresorier: 3,
  responsable: 4,
  benevole: 5,
  membre: 6,
};

function getMemberDisplayName(m: MembershipV2): string {
  return m.profile?.display_name || m.profile?.username || "Membre";
}

function filterMembers(
  members: MembershipV2[],
  search: string,
  roleFilter: string
): MembershipV2[] {
  let result = members;

  if (roleFilter && roleFilter !== "all") {
    result = result.filter((m) => m.role === roleFilter);
  }

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    result = result.filter((m) => {
      const name = getMemberDisplayName(m).toLowerCase();
      const username = (m.profile?.username || "").toLowerCase();
      const title = (m.title || "").toLowerCase();
      return name.includes(q) || username.includes(q) || title.includes(q);
    });
  }

  return result;
}

function sortMembers(members: MembershipV2[], sort: SortKey): MembershipV2[] {
  return [...members].sort((a, b) => {
    switch (sort) {
      case "recent":
        return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
      case "oldest":
        return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
      case "name_asc":
        return getMemberDisplayName(a).localeCompare(getMemberDisplayName(b), "fr");
      case "name_desc":
        return getMemberDisplayName(b).localeCompare(getMemberDisplayName(a), "fr");
      case "role":
        return ROLE_SORT_ORDER[a.role] - ROLE_SORT_ORDER[b.role];
      default:
        return 0;
    }
  });
}

function countPresidents(members: MembershipV2[]): number {
  return members.filter((m) => m.role === "president" && m.is_active).length;
}

// Cast helper : MembershipV2 → AssociationMembership (pour les dialogs existants)
function toMembership(m: MembershipV2): AssociationMembership {
  return m as unknown as AssociationMembership;
}

// ──────────────────────────────────────────────
// Context type
// ──────────────────────────────────────────────

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
  isAdminMode?: boolean;
  basePath?: string;
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────

const AssociationMembers = () => {
  const { user } = useAuth();
  const { association, role: viewerRole, basePath } = useOutletContext<AssociationContext>();
  const resolvedBasePath = basePath || "/association";
  const associationId = association?.id;

  // Data — utilisation du hook V2 enrichi
  const { data: members, isLoading } = useAssociationMembersV2(associationId);
  const { data: pendingInvitations } = useAssociationPendingInvitations(associationId);

  // Mutations
  const updateRole = useUpdateMemberRole();
  const deactivateMember = useDeactivateMember();
  const suspendMember = useSuspendMember();
  const reactivateMember = useReactivateMember();

  // Local state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("role");

  // Membre sélectionné (panneau droit)
  const [selectedMember, setSelectedMember] = useState<MembershipV2 | null>(null);

  // Sheet / Dialog state
  const [roleSheetMember, setRoleSheetMember] = useState<MembershipV2 | null>(null);
  const [deactivateDialogMember, setDeactivateDialogMember] = useState<MembershipV2 | null>(null);
  const [actionDialogState, setActionDialogState] = useState<{
    member: MembershipV2 | null;
    action: MemberActionType;
  }>({ member: null, action: "suspend" });

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardEditMember, setWizardEditMember] = useState<MembershipV2 | null>(null);

  // Governance
  const gov = useAssociationGovernance();

  // Permissions
  const isLeader = viewerRole ? LEADER_ROLES.includes(viewerRole) : false;

  // Derived data
  const filteredMembers = useMemo(
    () => sortMembers(filterMembers(members ?? [], search, roleFilter), sort),
    [members, search, roleFilter, sort]
  );

  const stats = useMemo(() => {
    if (!members) return { total: 0, leaders: 0, roles: 0 };
    const roleSet = new Set(members.map((m) => m.role));
    return {
      total: members.length,
      leaders: members.filter((m) => LEADER_ROLES.includes(m.role)).length,
      roles: roleSet.size,
    };
  }, [members]);

  // ── Handlers ──

  const handleRoleChange = (membershipId: string, newRole: AssociationRole) => {
    if (!gov.canManageMembers) {
      toast.error(gov.readOnlyReason || "Action non autorisée");
      return;
    }
    if (!members) return;
    const target = members.find((m) => m.id === membershipId);
    if (!target) return;

    if (target.role === "president" && newRole !== "president") {
      if (countPresidents(members) <= 1) {
        toast.error("Impossible : il doit rester au moins un·e président·e dans l'association.");
        return;
      }
    }

    updateRole.mutate(
      { membershipId, newRole },
      { onSuccess: () => setRoleSheetMember(null) }
    );
  };

  const handleDeactivate = (membershipId: string) => {
    if (!gov.canManageMembers) {
      toast.error(gov.readOnlyReason || "Action non autorisée");
      return;
    }
    if (!members) return;
    const target = members.find((m) => m.id === membershipId);
    if (!target) return;

    if (target.role === "president") {
      if (countPresidents(members) <= 1) {
        toast.error("Impossible : tu ne peux pas retirer le/la dernier·ère président·e de l'association.");
        return;
      }
    }

    deactivateMember.mutate(membershipId, {
      onSuccess: () => {
        setDeactivateDialogMember(null);
        if (selectedMember?.id === membershipId) setSelectedMember(null);
      },
    });
  };

  const handleEditRole = (member: MembershipV2) => {
    if (!gov.canManageMembers) {
      toast.error(gov.readOnlyReason || "Action non autorisée");
      return;
    }
    if (
      member.user_id === user?.id &&
      member.role === "president" &&
      members &&
      countPresidents(members) <= 1
    ) {
      toast.error(
        "Tu es le/la seul·e président·e. Nomme d'abord un·e autre président·e avant de modifier ton rôle."
      );
      return;
    }
    setRoleSheetMember(member);
  };

  const handleDeactivateClick = (member: MembershipV2) => {
    if (!gov.canManageMembers) {
      toast.error(gov.readOnlyReason || "Action non autorisée");
      return;
    }
    if (
      member.user_id === user?.id &&
      member.role === "president" &&
      members &&
      countPresidents(members) <= 1
    ) {
      toast.error(
        "Tu es le/la seul·e président·e. Nomme d'abord un·e autre président·e avant de te retirer."
      );
      return;
    }
    setDeactivateDialogMember(member);
  };

  const handleOpenWizardAdd = () => {
    setWizardEditMember(null);
    setWizardOpen(true);
  };

  const handleOpenWizardEdit = (member: MembershipV2) => {
    setWizardEditMember(member);
    setWizardOpen(true);
  };

  const handleWizardClose = (open: boolean) => {
    setWizardOpen(open);
    if (!open) setWizardEditMember(null);
  };

  if (!association) return null;

  // ── Render ──

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Membres de l'association
          </h1>
          <p className="text-sm text-mp-ink-muted mt-1">
            Gestion des membres de <span className="text-slate-300">{association.name}</span>
          </p>
        </div>
        {isLeader && (
          <div className="flex gap-2 shrink-0">
            <Button
              onClick={handleOpenWizardAdd}
              disabled={!gov.canCreateMembers}
              className="gap-2 bg-[#E84A2B] hover:bg-[#E84A2B]/90"
            >
              <Sparkles className="h-4 w-4" />
              Ajouter un membre
            </Button>
            <Link to={`${resolvedBasePath}/invitations`} aria-disabled={!gov.canInvite} tabIndex={!gov.canInvite ? -1 : undefined} style={!gov.canInvite ? { pointerEvents: "none" } : undefined}>
              <Button variant="outline" disabled={!gov.canInvite} className="gap-2 border-white/10 text-slate-300 hover:text-white hover:border-white/20">
                <UserPlus className="h-4 w-4" />
                Inviter
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Governance banner ── */}
      {(gov.isBlocked || gov.isRestricted) && (
        <div className={`rounded-lg border p-3 mb-4 ${gov.isBlocked ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
          <p className={`text-sm ${gov.isBlocked ? "text-red-300" : "text-amber-300"}`}>
            {gov.readOnlyReason || gov.restrictedReason}
          </p>
        </div>
      )}

      {/* ── Stats badges ── */}
      {!isLoading && members && members.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <StatBadge
            icon={<Users className="h-3.5 w-3.5 text-[#E84A2B]" />}
            value={stats.total}
            label={`membre${stats.total > 1 ? "s" : ""} actif${stats.total > 1 ? "s" : ""}`}
          />
          <StatBadge
            icon={<Crown className="h-3.5 w-3.5 text-[#F5A623]" />}
            value={stats.leaders}
            label={`leader${stats.leaders > 1 ? "s" : ""}`}
          />
          <StatBadge
            icon={<Shield className="h-3.5 w-3.5 text-purple-400" />}
            value={stats.roles}
            label={`rôle${stats.roles > 1 ? "s" : ""} distinct${stats.roles > 1 ? "s" : ""}`}
          />
          {pendingInvitations && pendingInvitations.length > 0 && (
            <Link to={`${resolvedBasePath}/invitations`}>
              <div className="flex items-center gap-2 rounded-lg border border-[#F5A623]/20 bg-[#F5A623]/5 px-3 py-1.5 hover:bg-[#F5A623]/10 transition-colors cursor-pointer">
                <Clock className="h-3.5 w-3.5 text-[#F5A623]" />
                <span className="text-sm text-white font-medium">{pendingInvitations.length}</span>
                <span className="text-xs text-[#F5A623]/70">
                  invitation{pendingInvitations.length > 1 ? "s" : ""} en attente
                </span>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* ── Layout split : liste + panneau droit ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_360px] gap-5 items-start">

        {/* ── Colonne gauche : filtres + liste ── */}
        <div className="space-y-3 min-w-0">
          {/* Filtres */}
          {!isLoading && members && members.length > 0 && (
            <AssociationMembersFilters
              search={search}
              onSearchChange={setSearch}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              sort={sort}
              onSortChange={setSort}
            />
          )}

          {/* Contenu de la liste */}
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/3 p-4"
                >
                  <Skeleton className="h-11 w-11 rounded-full bg-white/8" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32 bg-white/8" />
                    <Skeleton className="h-3 w-20 bg-white/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : members && members.length > 0 ? (
            filteredMembers.length > 0 ? (
              <div className="space-y-1.5">
                {filteredMembers.map((member) => (
                  <AssociationMemberCard
                    key={member.id}
                    member={member}
                    isCurrentUser={member.user_id === user?.id}
                    canManage={isLeader}
                    isSelected={selectedMember?.id === member.id}
                    onClick={setSelectedMember}
                    onEditRole={handleEditRole}
                    onDeactivate={handleDeactivateClick}
                    onSuspend={(m) => {
                      if (!gov.canManageMembers) {
                        toast.error(gov.readOnlyReason || "Action non autorisée");
                        return;
                      }
                      setActionDialogState({ member: m, action: "suspend" });
                    }}
                    onReactivate={(m) => {
                      if (!gov.canManageMembers) {
                        toast.error(gov.readOnlyReason || "Action non autorisée");
                        return;
                      }
                      setActionDialogState({ member: m, action: "reactivate" });
                    }}
                  />
                ))}
              </div>
            ) : (
              // empty search
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <SearchX className="w-12 h-12 text-mp-ink-soft mb-4" />
                <h2 className="text-base font-semibold text-slate-300 mb-1">Aucun résultat</h2>
                <p className="text-sm text-mp-ink-muted max-w-xs">
                  Aucun membre ne correspond à ta recherche. Essaie d'autres critères.
                </p>
              </div>
            )
          ) : (
            // empty state
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="w-14 h-14 text-mp-ink-soft mb-4" />
              <h2 className="text-xl font-bold text-slate-200 mb-2">Aucun membre</h2>
              <p className="text-sm text-mp-ink-muted max-w-sm mb-6">
                L'association n'a pas encore de membres. Commence par envoyer des invitations pour
                constituer ton équipe.
              </p>
              {isLeader && (
                <Link to={`${resolvedBasePath}/invitations`}>
                  <Button className="gap-2 bg-[#E84A2B] hover:bg-[#E84A2B]/90">
                    <UserPlus className="h-4 w-4" />
                    Inviter un premier membre
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Colonne droite : Fiche membre ── */}
        <div className="lg:sticky lg:top-4">
          <MemberDetailPanel
            member={selectedMember}
            canManage={isLeader}
            onEdit={handleOpenWizardEdit}
          />
        </div>
      </div>

      {/* ── Dialogs et Sheets ── */}

      {/* Role Sheet */}
      {roleSheetMember && (
        <AssociationMemberRoleSheet
          open={!!roleSheetMember}
          onOpenChange={(open) => !open && setRoleSheetMember(null)}
          member={toMembership(roleSheetMember)}
          onSubmit={handleRoleChange}
          isSubmitting={updateRole.isPending}
        />
      )}

      {/* Deactivate Dialog */}
      {deactivateDialogMember && (
        <AssociationMemberDeactivateDialog
          open={!!deactivateDialogMember}
          onOpenChange={(open) => !open && setDeactivateDialogMember(null)}
          member={toMembership(deactivateDialogMember)}
          onConfirm={handleDeactivate}
          isSubmitting={deactivateMember.isPending}
        />
      )}

      {/* Suspend / Reactivate Dialog */}
      <AssociationMemberActionDialog
        open={!!actionDialogState.member}
        onOpenChange={(open) =>
          !open && setActionDialogState({ member: null, action: "suspend" })
        }
        member={
          actionDialogState.member ? toMembership(actionDialogState.member) : null
        }
        action={actionDialogState.action}
        onConfirm={(membershipId) => {
          if (actionDialogState.action === "suspend") {
            suspendMember.mutate(membershipId, {
              onSuccess: () =>
                setActionDialogState({ member: null, action: "suspend" }),
            });
          } else if (actionDialogState.action === "reactivate") {
            reactivateMember.mutate(membershipId, {
              onSuccess: () =>
                setActionDialogState({ member: null, action: "suspend" }),
            });
          }
        }}
        isSubmitting={suspendMember.isPending || reactivateMember.isPending}
      />

      {/* Entry Wizard (création + édition) */}
      {associationId && (
        <MemberEntryWizard
          open={wizardOpen}
          onOpenChange={handleWizardClose}
          associationId={associationId}
          editMember={wizardEditMember}
        />
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// StatBadge helper
// ──────────────────────────────────────────────

function StatBadge({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/3 px-3 py-1.5">
      {icon}
      <span className="text-sm text-white font-semibold">{value}</span>
      <span className="text-xs text-mp-ink-muted">{label}</span>
    </div>
  );
}

export default AssociationMembers;
