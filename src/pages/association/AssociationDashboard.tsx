import { useOutletContext } from "react-router-dom";
import {
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Association, AssociationRole } from "@/hooks/useAssociation";
import { LEADER_ROLES } from "@/hooks/useAssociation";
import { useAssociationGovernance } from "@/hooks/useAssociationGovernance";
import {
  useAssociationStats,
  useAssociationMembersHistory,
  useAssociationAdhesionFunnel,
  useAssociationUpcomingEvents,
  useAssociationPendingMembers,
} from "@/hooks/association/useAssociationDashboard";
import AssociationHeaderHero from "@/components/association/dashboard/AssociationHeaderHero";
import AssociationActionCenter from "@/components/association/dashboard/AssociationActionCenter";
import AssociationKpiCards from "@/components/association/dashboard/AssociationKpiCards";
import AssociationMembersChart from "@/components/association/dashboard/AssociationMembersChart";
import AssociationAdhesionFunnel from "@/components/association/dashboard/AssociationAdhesionFunnel";
import AssociationEventsSummary from "@/components/association/dashboard/AssociationEventsSummary";
import AssociationValidationListPreview from "@/components/association/dashboard/AssociationValidationListPreview";
import AssociationPublicPresenceCard from "@/components/association/dashboard/AssociationPublicPresenceCard";

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
}

const AssociationDashboard = () => {
  const { association, role } = useOutletContext<AssociationContext>();
  const gov = useAssociationGovernance();
  const associationId = association?.id || null;

  // Permissions
  const isLeader = role ? LEADER_ROLES.includes(role) : false;
  const canCreateEvent = isLeader && gov.canManageEvents;

  // Data hooks
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useAssociationStats(associationId);

  const { data: membersHistory, isLoading: historyLoading } =
    useAssociationMembersHistory(associationId);

  const { data: funnelSteps, isLoading: funnelLoading } =
    useAssociationAdhesionFunnel(associationId);

  const { data: upcomingEvents, isLoading: eventsLoading } =
    useAssociationUpcomingEvents(associationId);

  const { data: pendingMembers, isLoading: pendingLoading } =
    useAssociationPendingMembers();

  // ── No association ──
  if (!association) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <TrendingUp className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-display text-foreground mb-2">
          Aucune association trouvee
        </h2>
        <p className="text-muted-foreground max-w-md">
          Tu n'es rattache a aucune association pour le moment.
          Contacte un administrateur pour etre ajoute.
        </p>
      </div>
    );
  }

  // ��─ Error state ──
  if (statsError) {
    return (
      <div className="space-y-6">
        <AssociationHeaderHero
          association={association}
          stats={null}
          isLoading={false}
        />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/[0.08] border border-red-500/20 mb-4">
            <AlertCircle className="w-6 h-6 text-red-400/60" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Erreur lors du chargement des donnees
          </p>
          <Button
            variant="outline"
            onClick={() => refetchStats()}
            className="gap-2 border-white/10 hover:border-white/20"
          >
            <RefreshCw className="w-4 h-4" />
            Reessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ Governance banner ═══ */}
      {(gov.isBlocked || gov.isRestricted) && (
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
            gov.isBlocked
              ? "border-red-500/30 bg-red-500/[0.06]"
              : "border-amber-500/30 bg-amber-500/[0.06]"
          }`}
        >
          <ShieldAlert
            className={`w-5 h-5 shrink-0 ${
              gov.isBlocked ? "text-red-400" : "text-amber-400"
            }`}
          />
          <p
            className={`text-sm ${
              gov.isBlocked ? "text-red-200/80" : "text-amber-200/80"
            }`}
          >
            {gov.readOnlyReason || gov.restrictedReason}
          </p>
        </div>
      )}

      {/* ═══ A. Hero / Bandeau de pilotage ═══ */}
      <AssociationHeaderHero
        association={association}
        stats={stats}
        isLoading={statsLoading}
      />

      {/* ═══ B. Bloc "A traiter maintenant" ═══ */}
      <AssociationActionCenter
        stats={stats}
        association={association}
        isLoading={statsLoading}
      />

      {/* ═══ C. KPIs repenses ═���═ */}
      <AssociationKpiCards stats={stats} isLoading={statsLoading} />

      {/* ═══ D. Zone analytique (Chart + Funnel) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AssociationMembersChart
          data={membersHistory}
          isLoading={historyLoading}
        />
        <AssociationAdhesionFunnel
          steps={funnelSteps}
          isLoading={funnelLoading}
        />
      </div>

      {/* ═══ E. Zone operationnelle (Events + Validation) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AssociationEventsSummary
          events={upcomingEvents}
          isLoading={eventsLoading}
          canCreateEvent={canCreateEvent}
        />
        <AssociationValidationListPreview
          members={pendingMembers}
          isLoading={pendingLoading}
        />
      </div>

      {/* ═══ F. Presence publique ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AssociationPublicPresenceCard association={association} />
      </div>
    </div>
  );
};

export default AssociationDashboard;
