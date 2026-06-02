import {
  Calendar,
  MapPin,
  Users,
  Edit,
  ExternalLink,
  Building2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  ScheduleDay,
  formatScheduleDisplay,
} from "@/components/admin/EventScheduleForm";
import type { TemporalStatus } from "@/components/admin/events-list/eventListHelpers";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface EventListCardProps {
  event: any;
  onEdit?: (event: any) => void;
  onView?: (event: any) => void;
  /** Extra action buttons (QR, participants, etc.) — admin only */
  extraActions?: React.ReactNode;
  /** Nom de l'association si association_id est set */
  associationName?: string;
  /** Afficher les actions d'édition */
  showEditAction?: boolean;
  /** Mode compact (vue grille dense) */
  compact?: boolean;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const getDateDisplay = (event: any): string => {
  if (
    event.schedule &&
    Array.isArray(event.schedule) &&
    event.schedule.length > 0
  ) {
    return formatScheduleDisplay(event.schedule as ScheduleDay[]);
  }
  if (event.date) {
    try {
      const dateStr = format(parseISO(event.date), "d MMM yyyy", { locale: fr });
      return event.time ? `${dateStr} · ${event.time}` : dateStr;
    } catch {
      return event.date;
    }
  }
  return "Date non définie";
};

const getLocation = (event: any): string | null => {
  if (event.venue_name || event.city) {
    return [event.venue_name, event.city].filter(Boolean).join(", ");
  }
  return event.location || null;
};

// ──────────────────────────────────────────────
// Temporal Badge configs
// ──────────────────────────────────────────────

const TEMPORAL_BADGE_CONFIG: Record<TemporalStatus, { label: string; className: string }> = {
  ongoing:  { label: "En cours", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  upcoming: { label: "À venir",  className: "bg-turquoise/20 text-turquoise border-turquoise/30" },
  past:     { label: "Terminé",  className: "bg-muted text-muted-foreground border-muted/50" },
};

const PROXIMITY_BADGE_CONFIG: Record<string, { className: string }> = {
  "Aujourd'hui":   { className: "bg-sakura/20 text-sakura border-sakura/30" },
  "Cette semaine": { className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  "En cours":      { className: "bg-green-500/20 text-green-400 border-green-500/30" },
  "Dernier jour":  { className: "bg-red-500/20 text-red-400 border-red-500/30" },
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

const EventListCard = ({
  event,
  onEdit,
  onView,
  extraActions,
  associationName,
  showEditAction = true,
  compact = false,
}: EventListCardProps) => {
  const location = getLocation(event);
  const resolvedAssocName =
    associationName || event.association_name || event.association?.name;

  const temporalStatus: TemporalStatus | undefined = event._temporalStatus;
  const proximityLabel: string | undefined = event._proximityLabel;
  const isOngoing = temporalStatus === "ongoing";

  return (
    <Card
      className={cn(
        "transition-colors relative overflow-hidden group",
        compact ? "p-3" : "p-4",
        isOngoing ? "border-green-500/25 hover:border-green-500/50" : "hover:border-sakura/40"
      )}
    >
      {/* Cover image */}
      {event.image_url && (
        <div
          className={cn(
            "mb-3 rounded-lg overflow-hidden bg-muted relative",
            compact ? "aspect-[3/1.6]" : "aspect-video"
          )}
        >
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />

          {/* Temporal badges on image */}
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
            {temporalStatus && (
              <Badge
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 border font-medium backdrop-blur-sm bg-black/30",
                  TEMPORAL_BADGE_CONFIG[temporalStatus].className
                )}
              >
                {TEMPORAL_BADGE_CONFIG[temporalStatus].label}
              </Badge>
            )}
            {proximityLabel && PROXIMITY_BADGE_CONFIG[proximityLabel] && (
              <Badge
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 border font-medium backdrop-blur-sm bg-black/30",
                  PROXIMITY_BADGE_CONFIG[proximityLabel].className
                )}
              >
                {proximityLabel}
              </Badge>
            )}
          </div>

          {/* Multi-day pill on image */}
          {event.schedule?.length > 1 && (
            <div className="absolute bottom-1.5 right-1.5">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-black/50 text-white border-0">
                {event.schedule.length}j
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Badge fallback if no image */}
      {!event.image_url && temporalStatus && (
        <div className="flex items-center gap-1 mb-2">
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0 h-4 border font-medium",
              TEMPORAL_BADGE_CONFIG[temporalStatus].className
            )}
          >
            {TEMPORAL_BADGE_CONFIG[temporalStatus].label}
          </Badge>
          {proximityLabel && PROXIMITY_BADGE_CONFIG[proximityLabel] && (
            <Badge
              className={cn(
                "text-[10px] px-1.5 py-0 h-4 border font-medium",
                PROXIMITY_BADGE_CONFIG[proximityLabel].className
              )}
            >
              {proximityLabel}
            </Badge>
          )}
        </div>
      )}

      <div className={cn("space-y-2", compact && "space-y-1.5")}>
        {/* Title + category */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              "font-display leading-tight",
              compact ? "text-sm" : "text-base"
            )}
          >
            {event.title}
          </h3>
          {event.category && event.category !== "general" && (
            <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 h-4">
              {event.category}
            </Badge>
          )}
        </div>

        {/* Association */}
        {resolvedAssocName && (
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="text-[11px] text-purple-400 truncate">
              {resolvedAssocName}
            </span>
          </div>
        )}

        {/* Meta — date + city */}
        <div className="space-y-0.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 shrink-0" />
            <span className="truncate">{getDateDisplay(event)}</span>
          </div>
          {location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
          {event.event_participants?.[0]?.count !== undefined && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3 shrink-0" />
              <span>
                {event.event_participants[0].count} inscrit
                {event.event_participants[0].count > 1 ? "s" : ""}
                {event.max_attendees ? ` / ${event.max_attendees}` : ""}
              </span>
              {event.present_participants?.[0]?.count > 0 && (
                <span className="flex items-center gap-1 text-green-400 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {event.present_participants[0].count} présent
                  {event.present_participants[0].count > 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1.5 border-t border-border/60">
          {showEditAction && onEdit && (
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onEdit(event)}>
              <Edit className="w-3.5 h-3.5" />
            </Button>
          )}
          {onView && (
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onView(event)}>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
          {extraActions}
        </div>
      </div>
    </Card>
  );
};

export default EventListCard;
