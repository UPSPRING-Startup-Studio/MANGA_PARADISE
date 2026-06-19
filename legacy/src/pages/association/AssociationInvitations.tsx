import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  LEADER_ROLES,
  type Association,
  type AssociationRole,
} from "@/hooks/useAssociation";
import {
  useAllAssociationInvitations,
  useSendAssociationInvitation,
  useCancelAssociationInvitation,
  useResendAssociationInvitation,
  useInviteByEmail,
  type AssociationInvitation,
} from "@/hooks/useAssociationInvitations";
import AssociationInvitationsList from "@/components/association/invitations/AssociationInvitationsList";
import AssociationInvitationCreateSheet from "@/components/association/invitations/AssociationInvitationCreateSheet";
import AssociationInvitationCancelDialog from "@/components/association/invitations/AssociationInvitationCancelDialog";
import AssociationInviteByEmailSheet from "@/components/association/invitations/AssociationInviteByEmailSheet";
import { useAssociationGovernance } from "@/hooks/useAssociationGovernance";

// ──────────────────────────────────────────────
// Context type
// ──────────────────────────────────────────────

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────

const AssociationInvitations = () => {
  const { user } = useAuth();
  const { association, role: viewerRole } = useOutletContext<AssociationContext>();
  const associationId = association?.id;

  // Data
  const { data: invitations, isLoading } = useAllAssociationInvitations(associationId);

  // Mutations
  const sendInvitation = useSendAssociationInvitation();
  const cancelInvitation = useCancelAssociationInvitation();
  const resendInvitation = useResendAssociationInvitation();
  const inviteByEmail = useInviteByEmail();

  // Local state
  const [statusFilter, setStatusFilter] = useState("all");
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [emailSheetOpen, setEmailSheetOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<AssociationInvitation | null>(null);

  // Governance
  const gov = useAssociationGovernance();

  // Permissions
  const isLeader = viewerRole ? LEADER_ROLES.includes(viewerRole) : false;
  const isReadOnly = !isLeader || !gov.canInvite;

  // Filter
  const filteredInvitations = useMemo(() => {
    if (!invitations) return [];
    if (statusFilter === "all") return invitations;
    return invitations.filter((inv) => inv.status === statusFilter);
  }, [invitations, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!invitations) return { pending: 0, accepted: 0, cancelled: 0 };
    return {
      pending: invitations.filter((i) => i.status === "pending").length,
      accepted: invitations.filter((i) => i.status === "accepted").length,
      cancelled: invitations.filter(
        (i) => i.status === "rejected" || i.status === "expired"
      ).length,
    };
  }, [invitations]);

  // ── Handlers ──

  const handleSendInvitation = (data: {
    userId: string;
    role: AssociationRole;
    message?: string;
  }) => {
    if (!associationId) return;
    sendInvitation.mutate(
      {
        associationId,
        userId: data.userId,
        role: data.role,
        message: data.message,
      },
      { onSuccess: () => setCreateSheetOpen(false) }
    );
  };

  const handleCancelInvitation = (invitationId: string, assocId: string) => {
    if (!gov.canInvite) {
      toast.error(gov.readOnlyReason || gov.restrictedReason || "Action non autorisée");
      return;
    }
    cancelInvitation.mutate(
      { invitationId, associationId: assocId },
      { onSuccess: () => setCancelTarget(null) }
    );
  };

  const handleResendInvitation = (inv: AssociationInvitation) => {
    if (!gov.canInvite) {
      toast.error(gov.readOnlyReason || gov.restrictedReason || "Action non autorisée");
      return;
    }
    if (!associationId) return;
    resendInvitation.mutate({
      invitationId: inv.id,
      associationId,
    });
  };

  if (!association) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-display text-foreground">Invitations</h1>
          <p className="text-muted-foreground mt-1">
            Inviter de nouveaux membres dans {association.name}
          </p>
        </div>
        {!isReadOnly && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setCreateSheetOpen(true)}
              disabled={!gov.canInvite}
              className="gap-2 border-slate-600 text-slate-200 hover:bg-white"
            >
              <UserPlus className="h-4 w-4" />
              Membre existant
            </Button>
            <Button
              onClick={() => setEmailSheetOpen(true)}
              disabled={!gov.canInvite}
              className="gap-2 bg-gradient-to-r from-[#E84A2B] to-[#F26B2E] hover:from-[#D43D20] hover:to-[#E25E25] text-white"
            >
              <Mail className="h-4 w-4" />
              Inviter par email
            </Button>
          </div>
        )}
      </div>

      {/* Governance banner */}
      {(gov.isBlocked || gov.isRestricted) && (
        <div className={`rounded-lg border p-3 mb-4 ${gov.isBlocked ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
          <p className={`text-sm ${gov.isBlocked ? "text-red-300" : "text-amber-300"}`}>
            {gov.readOnlyReason || gov.restrictedReason}
          </p>
        </div>
      )}

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="flex items-start gap-3 rounded-lg border border-[#F5A623]/20 bg-[#F5A623]/5 p-4">
          <Info className="h-5 w-5 text-[#F5A623] shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Tu peux voir les invitations, mais seul le bureau peut en créer ou
            les modifier. Contacte un membre du bureau si besoin.
          </p>
        </div>
      )}

      {/* Stats badges */}
      {!isLoading && invitations && invitations.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-[#111827]/40 px-3 py-1.5">
            <Clock className="h-4 w-4 text-[#F5A623]" />
            <span className="text-sm text-foreground font-medium">
              {stats.pending}
            </span>
            <span className="text-xs text-muted-foreground">en attente</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-[#111827]/40 px-3 py-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-foreground font-medium">
              {stats.accepted}
            </span>
            <span className="text-xs text-muted-foreground">
              acceptée{stats.accepted > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-[#111827]/40 px-3 py-1.5">
            <XCircle className="h-4 w-4 text-mp-ink-muted" />
            <span className="text-sm text-foreground font-medium">
              {stats.cancelled}
            </span>
            <span className="text-xs text-muted-foreground">
              annulée{stats.cancelled > 1 ? "s" : ""} / expirée{stats.cancelled > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Status filter */}
      {!isLoading && invitations && invitations.length > 0 && (
        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-52 bg-[#111827]/60 border-border/50">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="accepted">Acceptées</SelectItem>
              <SelectItem value="rejected">Annulées</SelectItem>
              <SelectItem value="expired">Expirées</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* List */}
      <AssociationInvitationsList
        invitations={filteredInvitations}
        isLoading={isLoading}
        isReadOnly={isReadOnly}
        onCancel={(inv) => setCancelTarget(inv)}
        onResend={handleResendInvitation}
        onCreateNew={() => setCreateSheetOpen(true)}
      />

      {/* Create Sheet */}
      {associationId && (
        <AssociationInvitationCreateSheet
          open={createSheetOpen}
          onOpenChange={setCreateSheetOpen}
          associationId={associationId}
          onSubmit={handleSendInvitation}
          isSubmitting={sendInvitation.isPending}
        />
      )}

      {/* Cancel Dialog */}
      <AssociationInvitationCancelDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        invitation={cancelTarget}
        onConfirm={handleCancelInvitation}
        isSubmitting={cancelInvitation.isPending}
      />

      {/* Email Invite Sheet */}
      <AssociationInviteByEmailSheet
        open={emailSheetOpen}
        onOpenChange={setEmailSheetOpen}
        onSubmit={(data) => {
          if (!associationId) return;
          inviteByEmail.mutate(
            { associationId, ...data },
            { onSuccess: () => setEmailSheetOpen(false) }
          );
        }}
        isSubmitting={inviteByEmail.isPending}
      />
    </div>
  );
};

export default AssociationInvitations;
