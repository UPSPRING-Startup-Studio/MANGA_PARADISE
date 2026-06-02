import { Link, useOutletContext } from "react-router-dom";
import {
  ClipboardList,
  Users,
  UserCog,
  Briefcase,
  AlertTriangle,
  Clock,
  Plus,
  UserPlus,
  CheckCircle,
  CalendarDays,
  ArrowUpRight,
  ShieldAlert,
  Trophy,
  Timer,
  TrendingUp,
  Inbox,
  Ban,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Association, AssociationRole } from "@/hooks/useAssociation";
import { LEADER_ROLES } from "@/hooks/useAssociation";
import { useAssociationGovernance } from "@/hooks/useAssociationGovernance";
import {
  useVolunteerDashboard,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
} from "@/hooks/association/useVolunteerModule";
import type {
  VolunteerMission,
  VolunteerApplication,
} from "@/hooks/association/useVolunteerModule";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface OutletContext {
  association: Association;
  role: AssociationRole;
  basePath?: string;
}

// ──────────────────────────────────────────────
// KPI Config
// ──────────────────────────────────────────────

interface KpiConfig {
  key: string;
  label: string;
  field: keyof ReturnType<typeof useKpiFields>;
  icon: React.ReactNode;
  color: string;
  accentBg: string;
}

function useKpiFields(data: {
  pendingApplications: number;
  activeVolunteers: number;
  onboardingIncomplete: number;
  openMissions: number;
  unfilledSlots: number;
  toConfirmShifts: number;
}) {
  return data;
}

const KPI_CARDS: {
  key: string;
  label: string;
  field: string;
  icon: React.ReactNode;
  color: string;
  accentBg: string;
}[] = [
  {
    key: "pending-apps",
    label: "Candidatures en attente",
    field: "pendingApplications",
    icon: <ClipboardList className="w-4.5 h-4.5" />,
    color: "text-orange-400",
    accentBg: "bg-orange-500/10 border-orange-500/20",
  },
  {
    key: "active-vol",
    label: "Benevoles actifs",
    field: "activeVolunteers",
    icon: <Users className="w-4.5 h-4.5" />,
    color: "text-emerald-400",
    accentBg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    key: "onboarding",
    label: "Onboarding incomplets",
    field: "onboardingIncomplete",
    icon: <UserCog className="w-4.5 h-4.5" />,
    color: "text-yellow-400",
    accentBg: "bg-yellow-500/10 border-yellow-500/20",
  },
  {
    key: "open-missions",
    label: "Missions ouvertes",
    field: "openMissions",
    icon: <Briefcase className="w-4.5 h-4.5" />,
    color: "text-blue-400",
    accentBg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    key: "unfilled",
    label: "Postes a pourvoir",
    field: "unfilledSlots",
    icon: <AlertTriangle className="w-4.5 h-4.5" />,
    color: "text-red-400",
    accentBg: "bg-red-500/10 border-red-500/20",
  },
  {
    key: "shifts",
    label: "Shifts a confirmer",
    field: "toConfirmShifts",
    icon: <Clock className="w-4.5 h-4.5" />,
    color: "text-cyan-400",
    accentBg: "bg-cyan-500/10 border-cyan-500/20",
  },
];

// ──────────────────────────────────────────────
// Quick Actions
// ──────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    key: "create-mission",
    label: "Creer une mission",
    icon: <Plus className="w-4 h-4" />,
    href: "/association/vol-missions",
    color: "text-sakura",
    borderColor: "border-sakura/30 hover:border-sakura/50",
  },
  {
    key: "invite-vol",
    label: "Inviter un benevole",
    icon: <UserPlus className="w-4 h-4" />,
    href: "/association/vol-candidatures",
    color: "text-cyan-400",
    borderColor: "border-cyan-500/30 hover:border-cyan-500/50",
  },
  {
    key: "validate-apps",
    label: "Valider les candidatures",
    icon: <CheckCircle className="w-4 h-4" />,
    href: "/association/vol-candidatures",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30 hover:border-emerald-500/50",
  },
  {
    key: "planning",
    label: "Consulter le planning",
    icon: <CalendarDays className="w-4 h-4" />,
    href: "/association/vol-planning",
    color: "text-purple-400",
    borderColor: "border-purple-500/30 hover:border-purple-500/50",
  },
];

// ──────────────────────────────────────────────
// Skeleton helpers
// ──────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
    </div>
  );
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

// ──────────────────────────────────────────────
// Format helpers
// ──────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return formatDate(dateStr);
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function MissionRow({ mission }: { mission: VolunteerMission }) {
  const slotsRatio = `${mission.slots_filled}/${mission.slots_needed}`;
  const isFull = mission.slots_filled >= mission.slots_needed;

  return (
    <div className="group flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg border shrink-0",
          PRIORITY_COLORS[mission.priority]
        )}
      >
        <Briefcase className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {mission.title}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
          {mission.event?.title && (
            <span className="truncate max-w-[120px]">{mission.event.title}</span>
          )}
          {mission.start_at && (
            <>
              <span className="text-muted-foreground/30">|</span>
              <span>{formatDate(mission.start_at)}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            "text-xs font-mono tabular-nums",
            isFull ? "text-emerald-400" : "text-muted-foreground"
          )}
        >
          {slotsRatio}
        </span>
        <Badge
          className={cn(
            "text-[10px] px-1.5 py-0 border",
            PRIORITY_COLORS[mission.priority]
          )}
        >
          {PRIORITY_LABELS[mission.priority]}
        </Badge>
      </div>
    </div>
  );
}

function ApplicationRow({ app }: { app: VolunteerApplication }) {
  const displayName = [app.first_name, app.last_name].filter(Boolean).join(" ")
    || app.profile?.display_name
    || app.email
    || "Candidat inconnu";

  return (
    <div className="group flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-white/[0.08] bg-white/[0.04] shrink-0">
        <UserPlus className="w-4 h-4 text-muted-foreground/60" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {displayName}
        </p>
        <p className="text-[11px] text-muted-foreground/60 truncate">
          {app.email || "Pas d'email"}
          {app.created_at && (
            <> &middot; {formatRelativeDate(app.created_at)}</>
          )}
        </p>
      </div>

      <Badge
        className={cn(
          "text-[10px] px-1.5 py-0 border shrink-0",
          APPLICATION_STATUS_COLORS[app.status]
        )}
      >
        {APPLICATION_STATUS_LABELS[app.status]}
      </Badge>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

const VolunteerDashboard = () => {
  const { association, role, basePath } = useOutletContext<OutletContext>();
  const gov = useAssociationGovernance();
  const resolvedBasePath = basePath || "/association";
  const associationId = association?.id;
  const isLeader = role ? LEADER_ROLES.includes(role) : false;
  const govBlocked = gov.isBlocked || gov.isRestricted;

  const { data, isLoading } = useVolunteerDashboard(associationId);

  // ── No association ──
  if (!association) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-display text-foreground mb-2">
          Aucune association trouvee
        </h2>
        <p className="text-muted-foreground max-w-md">
          Tu n'es rattache a aucune association pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ Governance banner ═══ */}
      {govBlocked && (
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
            gov.isBlocked
              ? "border-red-500/30 bg-red-500/[0.06]"
              : "border-amber-500/30 bg-amber-500/[0.06]"
          }`}
        >
          <Ban
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

      {/* ═══ Read-only banner for non-leaders ═══ */}
      {!isLeader && !govBlocked && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-200/80">
            Tu es en mode <span className="font-semibold text-amber-300">lecture seule</span>.
            Seuls les responsables peuvent gerer le benevolat.
          </p>
        </div>
      )}

      {/* ═══ Header ═══ */}
      <div>
        <h1 className="text-2xl font-display tracking-tight text-foreground">
          Benevolat — Dashboard
        </h1>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Vue d'ensemble du benevolat de{" "}
          <span className="text-foreground/80 font-medium">{association.name}</span>
        </p>
      </div>

      {/* ═══ KPI Cards ═══ */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {KPI_CARDS.map((kpi) => {
            const value = data ? (data as Record<string, unknown>)[kpi.field] as number : 0;

            return (
              <div
                key={kpi.key}
                className={cn(
                  "group relative rounded-xl border p-4 transition-all duration-200",
                  "border-white/[0.06] bg-white/[0.025] hover:bg-white/[0.05]",
                  "hover:border-white/[0.12]",
                  value > 0 && kpi.key === "pending-apps" &&
                    "border-orange-500/30 bg-orange-500/[0.04] shadow-[0_0_20px_rgba(249,115,22,0.06)]",
                  value > 0 && kpi.key === "unfilled" &&
                    "border-red-500/30 bg-red-500/[0.04] shadow-[0_0_20px_rgba(239,68,68,0.06)]"
                )}
              >
                <div className="flex flex-col gap-3">
                  <div
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-lg border",
                      kpi.accentBg,
                      kpi.color
                    )}
                  >
                    {kpi.icon}
                  </div>
                  <p className={cn("text-3xl font-display tracking-tight leading-none", kpi.color)}>
                    {value}
                  </p>
                  <p className="text-xs font-medium text-foreground/80">
                    {kpi.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Quick Actions ═══ */}
      {isLeader && (
        <div className={!gov.canManageVolunteers ? "pointer-events-none opacity-50" : ""}>
          <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-3">
            Actions rapides
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.key} to={action.href} className="block" aria-disabled={!gov.canManageVolunteers} tabIndex={!gov.canManageVolunteers ? -1 : undefined}>
                <div
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border p-4 transition-all duration-200",
                    "bg-white/[0.025] hover:bg-white/[0.05]",
                    action.borderColor
                  )}
                >
                  <div className={cn("shrink-0", action.color)}>
                    {action.icon}
                  </div>
                  <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                    {action.label}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-auto text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Two-column: Missions + Applications ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left — Upcoming Missions */}
        <Card className="border-border/30 bg-[#111827]/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-display text-foreground">
                Prochaines missions
              </CardTitle>
              <Link
                to={`${resolvedBasePath}/vol-missions`}
                className="text-xs text-muted-foreground hover:text-sakura transition-colors flex items-center gap-1"
              >
                Tout voir
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ListSkeleton rows={4} />
            ) : !data?.upcomingMissions?.length ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/[0.08] border border-blue-500/20 mb-3">
                  <Briefcase className="w-5 h-5 text-blue-400/60" />
                </div>
                <p className="text-sm text-muted-foreground/70 mb-1">
                  Aucune mission a venir
                </p>
                <p className="text-[11px] text-muted-foreground/50">
                  Les prochaines missions apparaitront ici
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.upcomingMissions.map((mission) => (
                  <MissionRow key={mission.id} mission={mission} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right — Recent Applications */}
        <Card className="border-border/30 bg-[#111827]/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-display text-foreground">
                Candidatures recentes
              </CardTitle>
              <Link
                to={`${resolvedBasePath}/vol-candidatures`}
                className="text-xs text-muted-foreground hover:text-sakura transition-colors flex items-center gap-1"
              >
                Tout voir
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ListSkeleton rows={4} />
            ) : !data?.recentApplications?.length ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/[0.08] border border-orange-500/20 mb-3">
                  <Inbox className="w-5 h-5 text-orange-400/60" />
                </div>
                <p className="text-sm text-muted-foreground/70 mb-1">
                  Aucune candidature recente
                </p>
                <p className="text-[11px] text-muted-foreground/50">
                  Les nouvelles candidatures apparaitront ici
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentApplications.map((app) => (
                  <ApplicationRow key={app.id} app={app} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ Stats Footer ═══ */}
      <div className="rounded-xl border border-border/30 bg-[#111827]/40 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider">
            Statistiques globales
          </h2>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
            <div className="flex flex-col items-center gap-1.5 py-5">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-blue-400" />
                <span className="text-2xl font-display tracking-tight text-foreground">
                  {data?.totalHours ?? 0}h
                </span>
              </div>
              <p className="text-xs text-muted-foreground/60">
                Heures de benevolat
              </p>
            </div>

            <div className="flex flex-col items-center gap-1.5 py-5">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-2xl font-display tracking-tight text-foreground">
                  {data?.totalMissionsCompleted ?? 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/60">
                Missions terminees
              </p>
            </div>

            <div className="flex flex-col items-center gap-1.5 py-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-display tracking-tight text-foreground">
                  {data?.avgReliability ?? 100}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground/60">
                Fiabilite moyenne
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerDashboard;
