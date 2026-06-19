/**
 * EventListRow — Vue liste dense pour la page admin événements
 *
 * Une ligne compacte par événement avec toutes les infos essentielles :
 * miniature | titre + catégorie | date | ville | organisateur | badge temporel | actions
 */

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Calendar,
  MapPin,
  Building2,
  Edit,
  ExternalLink,
  MoreHorizontal,
  Users,
  Dot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TemporalStatus } from "./eventListHelpers";
import {
  ScheduleDay,
  formatScheduleDisplay,
} from "@/components/admin/EventScheduleForm";

// ─── Helpers ──────────────────────────────────────────────────────

function getShortDate(event: any): string {
  if (event.schedule && Array.isArray(event.schedule) && event.schedule.length > 0) {
    const sorted = [...event.schedule]
      .filter((d: ScheduleDay) => d.date)
      .sort((a: ScheduleDay, b: ScheduleDay) => a.date.localeCompare(b.date));

    if (sorted.length === 0) return "—";

    if (sorted.length === 1) {
      return format(parseISO(sorted[0].date), "d MMM yyyy", { locale: fr });
    }

    const first = format(parseISO(sorted[0].date), "d MMM", { locale: fr });
    const last = format(parseISO(sorted[sorted.length - 1].date), "d MMM yyyy", { locale: fr });
    return `${first} → ${last}`;
  }

  if (event.date) {
    try {
      return format(parseISO(event.date), "d MMM yyyy", { locale: fr });
    } catch {
      return event.date;
    }
  }
  return "—";
}

function getCity(event: any): string {
  return event.city || event.venue_name || event.location || "—";
}

// ─── Badge configs ────────────────────────────────────────────────

const TEMPORAL_BADGE: Record<TemporalStatus, { label: string; className: string }> = {
  ongoing:  { label: "En cours",  className: "bg-green-500/15 text-green-400 border-green-500/30" },
  upcoming: { label: "À venir",   className: "bg-turquoise/15 text-turquoise border-turquoise/30" },
  past:     { label: "Terminé",   className: "bg-muted/50 text-muted-foreground border-muted" },
};

const PROXIMITY_BADGE: Record<string, string> = {
  "Aujourd'hui":  "bg-sakura/20 text-sakura border-sakura/30",
  "Cette semaine": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Dernier jour": "bg-red-500/15 text-red-400 border-red-500/30",
};

// ─── Types ────────────────────────────────────────────────────────

export interface EventListRowProps {
  event: any;
  onEdit?: (event: any) => void;
  onView?: (event: any) => void;
  /** All extra admin actions — rendered in a popover overflow menu */
  extraActions?: React.ReactNode;
  associationName?: string;
  showEditAction?: boolean;
}

// ─── Component ────────────────────────────────────────────────────

const EventListRow = ({
  event,
  onEdit,
  onView,
  extraActions,
  associationName,
  showEditAction = true,
}: EventListRowProps) => {
  const [overflowOpen, setOverflowOpen] = useState(false);

  const resolvedAssocName =
    associationName || event.association_name || event.association?.name;
  const temporalStatus: TemporalStatus | undefined = event._temporalStatus;
  const proximityLabel: string | undefined = event._proximityLabel;
  const dateStr = getShortDate(event);
  const city = getCity(event);
  const participantCount = event.event_participants?.[0]?.count;
  const isOngoing = temporalStatus === "ongoing";

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150",
        "hover:bg-muted/30",
        isOngoing
          ? "border-green-500/20 bg-green-500/[0.03]"
          : "border-border bg-transparent"
      )}
    >
      {/* ── Thumbnail ── */}
      <div className="shrink-0 w-14 h-10 rounded-lg overflow-hidden bg-muted">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-4 h-4 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* ── Title + category badge ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-sm leading-tight truncate text-foreground">
            {event.title}
          </span>
          {event.category && event.category !== "general" && (
            <Badge
              variant="outline"
              className="shrink-0 text-[10px] px-1.5 py-0 h-4 hidden md:flex"
            >
              {event.category}
            </Badge>
          )}
        </div>
        {/* Mobile: secondary info below title */}
        <div className="flex items-center gap-2 mt-0.5 md:hidden text-xs text-muted-foreground">
          <span>{dateStr}</span>
          {city !== "—" && (
            <>
              <Dot className="w-3 h-3" />
              <span className="truncate">{city}</span>
            </>
          )}
        </div>
      </div>

      {/* ── Date ── (desktop) */}
      <div className="hidden md:flex items-center gap-1.5 shrink-0 w-32 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3 shrink-0" />
        <span className="truncate">{dateStr}</span>
      </div>

      {/* ── City ── (desktop) */}
      <div className="hidden lg:flex items-center gap-1.5 shrink-0 w-28 text-xs text-muted-foreground">
        <MapPin className="w-3 h-3 shrink-0" />
        <span className="truncate">{city !== "—" ? city : <span className="opacity-30">—</span>}</span>
      </div>

      {/* ── Organizer ── (desktop) */}
      <div className="hidden xl:flex items-center gap-1.5 shrink-0 w-28 text-xs">
        {resolvedAssocName ? (
          <>
            <Building2 className="w-3 h-3 shrink-0 text-purple-400" />
            <span className="truncate text-purple-400">{resolvedAssocName}</span>
          </>
        ) : (
          <>
            <span className="w-3 h-3 shrink-0 text-[8px] text-sakura">MP</span>
            <span className="truncate text-muted-foreground/60 text-[10px]">Manga Paradise</span>
          </>
        )}
      </div>

      {/* ── Participants (desktop) ── */}
      {participantCount !== undefined && (
        <div className="hidden xl:flex items-center gap-1 shrink-0 text-xs text-muted-foreground w-16">
          <Users className="w-3 h-3 shrink-0" />
          <span>{participantCount}{event.max_attendees ? `/${event.max_attendees}` : ""}</span>
        </div>
      )}

      {/* ── Temporal badge ── */}
      <div className="shrink-0 flex items-center gap-1">
        {/* Proximity takes priority over temporal if both present */}
        {proximityLabel && PROXIMITY_BADGE[proximityLabel] ? (
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0 h-5 border font-medium",
              PROXIMITY_BADGE[proximityLabel]
            )}
          >
            {proximityLabel}
          </Badge>
        ) : temporalStatus ? (
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0 h-5 border font-medium",
              TEMPORAL_BADGE[temporalStatus].className
            )}
          >
            {TEMPORAL_BADGE[temporalStatus].label}
          </Badge>
        ) : null}
      </div>

      {/* ── Actions ── */}
      <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {showEditAction && onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(event)}
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
        )}
        {onView && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onView(event)}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        )}
        {extraActions && (
          <Popover open={overflowOpen} onOpenChange={setOverflowOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-auto p-1.5"
              onClick={() => setOverflowOpen(false)}
            >
              <div className="flex flex-wrap gap-0.5 max-w-[180px]">
                {extraActions}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};

export default EventListRow;
