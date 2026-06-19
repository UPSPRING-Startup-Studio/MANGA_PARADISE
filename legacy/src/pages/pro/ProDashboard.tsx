import { useOutletContext } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  TrendingUp,
  Users,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Clock,
  MapPin,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProPartner, ProPartnerRole } from "@/hooks/useProPartner";
import { MANAGER_ROLES, PRO_PARTNER_TYPE_LABELS } from "@/hooks/useProPartner";
import {
  useProPartnerStats,
  useProPartnerUpcomingEventsPreview,
} from "@/hooks/useProPartnerDashboard";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProPartnerContext {
  partner: ProPartner | undefined;
  role: ProPartnerRole | undefined;
}

const ProDashboard = () => {
  const { partner, role } = useOutletContext<ProPartnerContext>();
  const navigate = useNavigate();
  const partnerId = partner?.id || null;

  const canManageEvents = role ? MANAGER_ROLES.includes(role) : false;

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useProPartnerStats(partnerId);

  const { data: upcomingEvents, isLoading: eventsLoading } =
    useProPartnerUpcomingEventsPreview(partnerId);

  // ── No partner ──
  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Briefcase className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-display text-foreground mb-2">
          Aucun partenaire trouvé
        </h2>
        <p className="text-muted-foreground max-w-md">
          Tu n'es rattaché à aucune structure partenaire.
          Contacte l'équipe Manga Paradise pour être ajouté.
        </p>
      </div>
    );
  }

  // ── Error state ──
  if (statsError) {
    return (
      <div className="space-y-6">
        <HeroBanner partner={partner} />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/[0.08] border border-red-500/20 mb-4">
            <AlertCircle className="w-6 h-6 text-red-400/60" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Erreur lors du chargement des données
          </p>
          <Button
            variant="outline"
            onClick={() => refetchStats()}
            className="gap-2 border-white/10 hover:border-white/20"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ Hero Banner ═══ */}
      <HeroBanner partner={partner} />

      {/* ═══ KPI Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Événements à venir"
          value={stats?.upcomingEventsCount}
          icon={CalendarDays}
          color="cyan"
          isLoading={statsLoading}
        />
        <KpiCard
          label="Événements passés"
          value={stats?.pastEventsCount}
          icon={Clock}
          color="slate"
          isLoading={statsLoading}
        />
        <KpiCard
          label="Total événements"
          value={stats?.totalEventsCount}
          icon={TrendingUp}
          color="emerald"
          isLoading={statsLoading}
        />
        <KpiCard
          label="Membres équipe"
          value={stats?.activeMembersCount}
          icon={Users}
          color="purple"
          isLoading={statsLoading}
        />
      </div>

      {/* ═══ Prochains événements + Actions rapides ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Prochains événements */}
        <Card className="lg:col-span-2 bg-mp-paper/80 border-mp-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-slate-50 text-lg font-display">
              Prochains événements
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/pro/evenements")}
              className="text-cyan-400 hover:text-cyan-300"
            >
              Voir tout
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 bg-white" />
                ))}
              </div>
            ) : upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event: any) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-white/50 border border-mp-border/50 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-50 truncate text-sm">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-mp-ink-muted mt-0.5">
                        <span>
                          {format(new Date(event.date), "d MMM yyyy", { locale: fr })}
                        </span>
                        {event.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.city}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-cyan-500/30 text-cyan-400 shrink-0"
                    >
                      {event.status || "publié"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="w-10 h-10 text-mp-ink-muted mx-auto mb-3" />
                <p className="text-sm text-mp-ink-muted mb-3">
                  Aucun événement à venir
                </p>
                {canManageEvents && (
                  <Button
                    size="sm"
                    onClick={() => navigate("/pro/evenements")}
                    className="bg-cyan-500 hover:bg-cyan-600 text-slate-900"
                  >
                    Créer un événement
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conseils */}
        <Card className="bg-mp-paper/80 border-mp-border/50">
          <CardHeader>
            <CardTitle className="text-slate-50 text-lg font-display">
              Conseils partenaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
              <p className="text-sm text-cyan-300 font-medium mb-1">
                Complétez votre fiche
              </p>
              <p className="text-xs text-mp-ink-muted">
                Une fiche complète avec logo et description augmente votre
                visibilité auprès de la communauté.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-sm text-emerald-300 font-medium mb-1">
                Publiez vos événements
              </p>
              <p className="text-xs text-mp-ink-muted">
                Les événements que vous créez apparaissent dans l'agenda
                global de Manga Paradise.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <p className="text-sm text-purple-300 font-medium mb-1">
                Invitez votre équipe
              </p>
              <p className="text-xs text-mp-ink-muted">
                Ajoutez des collaborateurs pour gérer ensemble votre
                espace partenaire.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Statut du compte ═══ */}
      {partner.status === "suspended" && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-300">
                Compte suspendu
              </p>
              <p className="text-xs text-mp-ink-muted">
                Votre compte partenaire est actuellement suspendu.
                Contactez l'équipe Manga Paradise pour plus d'informations.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function HeroBanner({ partner }: { partner: ProPartner }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 p-6 border border-mp-border/50">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 flex items-center gap-4">
        {partner.logo_url ? (
          <img
            src={partner.logo_url}
            alt={partner.name}
            className="w-16 h-16 rounded-xl object-cover border border-white/10"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-cyan-400" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-display text-slate-50">
            {partner.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="outline"
              className="text-[10px] border-cyan-500/30 text-cyan-400"
            >
              {PRO_PARTNER_TYPE_LABELS[partner.type] || partner.type}
            </Badge>
            <Badge
              variant="outline"
              className={
                partner.status === "active"
                  ? "text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : partner.status === "suspended"
                    ? "text-[10px] bg-red-500/10 text-red-400 border-red-500/30"
                    : "text-[10px] bg-slate-500/10 text-mp-ink-muted border-slate-500/30"
              }
            >
              {partner.status === "active"
                ? "Actif"
                : partner.status === "suspended"
                  ? "Suspendu"
                  : partner.status}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string;
  value: number | undefined;
  icon: any;
  color: string;
  isLoading: boolean;
}) {
  const colorMap: Record<string, string> = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    slate: "text-mp-ink-muted bg-slate-500/10 border-slate-500/20",
  };

  return (
    <Card className="bg-mp-paper/80 border-mp-border/50">
      <CardContent className="p-4 flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorMap[color]}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          {isLoading ? (
            <Skeleton className="h-7 w-12 bg-white" />
          ) : (
            <p className="text-2xl font-bold text-slate-50">{value ?? 0}</p>
          )}
          <p className="text-xs text-mp-ink-muted">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProDashboard;
