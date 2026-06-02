import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  MapPin,
  Users,
  ArrowRight,
  Plus,
  HandHelping,
  Sparkles,
} from "lucide-react";
import type { UpcomingEvent } from "@/hooks/association/useAssociationDashboard";

interface AssociationEventsSummaryProps {
  events: UpcomingEvent[] | undefined;
  isLoading: boolean;
  canCreateEvent: boolean;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  publie: { label: "Publie", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  published: { label: "Publie", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  brouillon: { label: "Brouillon", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  draft: { label: "Brouillon", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  complet: { label: "Complet", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  annule: { label: "Annule", className: "bg-red-500/15 text-red-400 border-red-500/30" },
};

function formatEventDate(event: UpcomingEvent): string {
  const dateStr = event.date_debut || event.date;
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

function getDaysUntil(event: UpcomingEvent): number {
  const dateStr = event.date_debut || event.date;
  const eventDate = new Date(dateStr);
  const now = new Date();
  return Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const AssociationEventsSummary = ({
  events,
  isLoading,
  canCreateEvent,
}: AssociationEventsSummaryProps) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const displayEvents = (events || []).slice(0, 3);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-turquoise/10 border border-turquoise/20">
            <CalendarDays className="w-4 h-4 text-turquoise" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Prochains evenements
            </h3>
            <p className="text-[11px] text-muted-foreground/60">
              {displayEvents.length > 0
                ? `${displayEvents.length} evenement${displayEvents.length > 1 ? "s" : ""} planifie${displayEvents.length > 1 ? "s" : ""}`
                : "Aucun evenement"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canCreateEvent && (
            <Link to="/admin/events">
              <Button
                size="sm"
                className="gap-1.5 bg-sakura hover:bg-sakura/90 text-white text-xs h-7 px-3 shadow-[0_0_12px_rgba(255,107,190,0.15)]"
              >
                <Plus className="w-3 h-3" />
                Creer
              </Button>
            </Link>
          )}
          <Link to="/association/evenements">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 h-7 text-muted-foreground hover:text-foreground"
            >
              Tout voir
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-5">
        {displayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
              <Sparkles className="w-6 h-6 text-muted-foreground/30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground/60">
                Aucun evenement a venir
              </p>
              <p className="text-xs text-muted-foreground/40 mt-1.5 max-w-[240px]">
                Creez votre prochain evenement pour engager vos membres
              </p>
            </div>
            {canCreateEvent && (
              <Link to="/admin/events">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-white/10 hover:border-sakura/30 text-xs mt-1"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Creer un evenement
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {displayEvents.map((evt) => {
              const statusBadge = STATUS_BADGE[evt.status] || {
                label: evt.status,
                className: "bg-white/10 text-muted-foreground border-white/10",
              };

              const remainingSlots =
                evt.max_attendees !== null
                  ? Math.max(0, evt.max_attendees - evt.participantCount)
                  : null;

              const daysUntil = getDaysUntil(evt);
              const isImminent = daysUntil <= 3 && daysUntil >= 0;

              return (
                <Link key={evt.id} to={`/evenements/${evt.id}`}>
                  <div
                    className={`group p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isImminent
                        ? "border-sakura/20 bg-sakura/[0.04] hover:border-sakura/30"
                        : "border-white/[0.04] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Date badge */}
                      <div className="flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-white/[0.04] border border-white/[0.06] flex-shrink-0">
                        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase leading-none">
                          {new Date(evt.date_debut || evt.date).toLocaleDateString("fr-FR", { month: "short" })}
                        </span>
                        <span className="text-base font-display text-foreground leading-tight">
                          {new Date(evt.date_debut || evt.date).getDate()}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-foreground truncate group-hover:text-sakura transition-colors">
                            {evt.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-[10px] flex-shrink-0 ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </Badge>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground/60">
                          {evt.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {evt.city}
                            </span>
                          )}
                          {isImminent && (
                            <span className="text-sakura font-medium">
                              {daysUntil === 0 ? "Aujourd'hui" : `Dans ${daysUntil}j`}
                            </span>
                          )}
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 mt-2 text-[11px]">
                          <span className="flex items-center gap-1 text-muted-foreground/60">
                            <Users className="w-3 h-3 text-turquoise/70" />
                            {evt.participantCount} inscrit{evt.participantCount > 1 ? "s" : ""}
                          </span>
                          {evt.volunteerCount > 0 && (
                            <span className="flex items-center gap-1 text-muted-foreground/60">
                              <HandHelping className="w-3 h-3 text-purple-400/70" />
                              {evt.volunteerCount}
                            </span>
                          )}
                          {remainingSlots !== null && remainingSlots <= 10 && (
                            <span className="text-amber-400/80 font-medium">
                              {remainingSlots} place{remainingSlots > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssociationEventsSummary;
