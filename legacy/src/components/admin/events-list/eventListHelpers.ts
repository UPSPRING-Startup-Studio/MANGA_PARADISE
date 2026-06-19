/**
 * Event List Helpers — Temporal status, sorting, grouping, filtering
 *
 * Pipeline: raw events → compute temporal status → filter by tab → apply filters → sort → group by month → paginate
 */

import {
  parseISO,
  format,
  startOfDay,
  endOfDay,
  isToday,
  isThisWeek,
  isBefore,
  isAfter,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { ScheduleDay } from "../EventScheduleForm";

// ─── Temporal Status ──────────────────────────────────────────────

export type TemporalStatus = "upcoming" | "ongoing" | "past";
export type TemporalTab = "upcoming" | "ongoing" | "past" | "all";
export type SortOption = "date-asc" | "date-desc" | "title-asc" | "title-desc";
export type ViewMode = "grid" | "list";

// ─── Types ────────────────────────────────────────────────────────

export interface AdminEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  end_date: string | null;
  time: string | null;
  schedule: ScheduleDay[] | null;
  location: string | null;
  venue_name: string | null;
  city: string | null;
  region: string | null;
  category: string;
  status: string;
  image_url: string | null;
  max_attendees: number | null;
  price: string | null;
  ticketing_mode: string;
  external_link: string | null;
  association_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  association?: { name: string } | null;
  association_name?: string;
  event_participants?: { count: number }[];
  present_participants?: { count: number }[];
  _scheduleItems?: any[];
  // Computed
  _temporalStatus?: TemporalStatus;
  _startDate?: Date;
  _endDate?: Date;
  _proximityLabel?: string;
}

/**
 * Full filter state — includes both main bar and advanced panel filters.
 */
export interface EventFilters {
  // ── Main bar ──
  search: string;
  /** Type d'événement (champ `category` en DB) */
  eventType: string;
  /** Type d'organisateur : "all" | "mp" | "associations" */
  organizerType: string;
  city: string;
  /** Nom d'association spécifique (optionnel) */
  association: string;

  // ── Advanced panel ──
  publicationStatus: string;
  dateFrom: string;
  dateTo: string;
  /** "all" | "free" | "paid" */
  priceFilter: string;
  /** "all" | "presentiel" | "hybride" | "en-ligne" */
  formatFilter: string;
}

export const DEFAULT_FILTERS: EventFilters = {
  search: "",
  eventType: "all",
  organizerType: "all",
  city: "all",
  association: "all",
  publicationStatus: "all",
  dateFrom: "",
  dateTo: "",
  priceFilter: "all",
  formatFilter: "all",
};

export interface MonthGroup {
  key: string;   // "2026-04"
  label: string; // "Avril 2026"
  events: AdminEvent[];
}

// ─── Compute Temporal Status ──────────────────────────────────────

export function computeTemporalStatus(event: AdminEvent): AdminEvent {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  let startDate: Date;
  let endDate: Date;

  if (event.schedule && Array.isArray(event.schedule) && event.schedule.length > 0) {
    const sorted = [...event.schedule]
      .filter((d) => d.date)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (sorted.length === 0) {
      startDate = event.date ? parseISO(event.date) : now;
      endDate = event.end_date ? parseISO(event.end_date) : startDate;
    } else {
      startDate = parseISO(sorted[0].date);
      endDate = parseISO(sorted[sorted.length - 1].date);
    }
  } else {
    startDate = event.date ? parseISO(event.date) : now;
    endDate = event.end_date ? parseISO(event.end_date) : startDate;
  }

  const startOfStartDate = startOfDay(startDate);
  const endOfEndDate = endOfDay(endDate);

  let temporalStatus: TemporalStatus;
  if (isAfter(startOfStartDate, todayEnd)) {
    temporalStatus = "upcoming";
  } else if (isBefore(endOfEndDate, todayStart)) {
    temporalStatus = "past";
  } else {
    temporalStatus = "ongoing";
  }

  let proximityLabel: string | undefined;
  if (temporalStatus === "upcoming") {
    if (isToday(startDate)) proximityLabel = "Aujourd'hui";
    else if (isThisWeek(startDate, { weekStartsOn: 1 })) proximityLabel = "Cette semaine";
  } else if (temporalStatus === "ongoing") {
    proximityLabel = isToday(endDate) ? "Dernier jour" : "En cours";
  }

  return {
    ...event,
    _temporalStatus: temporalStatus,
    _startDate: startDate,
    _endDate: endDate,
    _proximityLabel: proximityLabel,
  };
}

export function enrichEvents(events: AdminEvent[]): AdminEvent[] {
  return events.map(computeTemporalStatus);
}

// ─── Filtering by Tab ─────────────────────────────────────────────

export function filterByTab(events: AdminEvent[], tab: TemporalTab): AdminEvent[] {
  if (tab === "all") return events;
  return events.filter((e) => e._temporalStatus === tab);
}

// ─── Secondary Filters ───────────────────────────────────────────

/**
 * Improved multi-word search:
 * splits query into tokens, each token must match in at least one field.
 */
function matchesSearch(event: AdminEvent, query: string): boolean {
  if (!query.trim()) return true;
  const tokens = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const fields = [
    event.title,
    event.description,
    event.category,
    event.city,
    event.region,
    event.venue_name,
    event.location,
    event.association?.name,
    event.association_name,
  ]
    .filter(Boolean)
    .map((f) => f!.toLowerCase());

  return tokens.every((token) => fields.some((field) => field.includes(token)));
}

export function applyFilters(events: AdminEvent[], filters: EventFilters): AdminEvent[] {
  let result = events;

  // Multi-word search
  if (filters.search.trim()) {
    result = result.filter((e) => matchesSearch(e, filters.search));
  }

  // Event type (category)
  if (filters.eventType && filters.eventType !== "all") {
    result = result.filter(
      (e) => e.category?.toLowerCase() === filters.eventType.toLowerCase()
    );
  }

  // Organizer type
  if (filters.organizerType && filters.organizerType !== "all") {
    if (filters.organizerType === "mp") {
      result = result.filter((e) => !e.association_id);
    } else if (filters.organizerType === "associations") {
      result = result.filter((e) => !!e.association_id);
    }
  }

  // Specific association name
  if (filters.association && filters.association !== "all") {
    result = result.filter(
      (e) =>
        (e.association?.name || e.association_name || "").toLowerCase() ===
        filters.association.toLowerCase()
    );
  }

  // City
  if (filters.city && filters.city !== "all") {
    result = result.filter(
      (e) => e.city?.toLowerCase() === filters.city.toLowerCase()
    );
  }

  // Publication status
  if (filters.publicationStatus && filters.publicationStatus !== "all") {
    result = result.filter((e) => e.status === filters.publicationStatus);
  }

  // Date range — from
  if (filters.dateFrom) {
    const from = startOfDay(parseISO(filters.dateFrom));
    result = result.filter((e) => e._startDate && !isBefore(e._startDate, from));
  }

  // Date range — to
  if (filters.dateTo) {
    const to = endOfDay(parseISO(filters.dateTo));
    result = result.filter((e) => e._startDate && !isAfter(e._startDate, to));
  }

  // Price filter
  if (filters.priceFilter && filters.priceFilter !== "all") {
    if (filters.priceFilter === "free") {
      result = result.filter(
        (e) => !e.price || e.price === "0" || e.price === "Gratuit"
      );
    } else if (filters.priceFilter === "paid") {
      result = result.filter(
        (e) => e.price && e.price !== "0" && e.price !== "Gratuit"
      );
    }
  }

  // Format filter (uses ticketing_mode as proxy since format isn't in DB yet)
  if (filters.formatFilter && filters.formatFilter !== "all") {
    if (filters.formatFilter === "external") {
      result = result.filter((e) => e.ticketing_mode === "external");
    }
    // For "presentiel" / "hybride" / "en-ligne" the data isn't stored per event yet
    // — keep as no-op to avoid filtering out everything
  }

  return result;
}

// ─── Sorting ──────────────────────────────────────────────────────

export function getDefaultSort(tab: TemporalTab): SortOption {
  switch (tab) {
    case "past": return "date-desc";
    default: return "date-asc";
  }
}

export function sortEvents(
  events: AdminEvent[],
  sort: SortOption,
  tab: TemporalTab
): AdminEvent[] {
  return [...events].sort((a, b) => {
    switch (sort) {
      case "date-asc": {
        if (tab === "ongoing") {
          return (a._endDate?.getTime() || 0) - (b._endDate?.getTime() || 0);
        }
        return (a._startDate?.getTime() || 0) - (b._startDate?.getTime() || 0);
      }
      case "date-desc":
        return (b._startDate?.getTime() || 0) - (a._startDate?.getTime() || 0);
      case "title-asc":
        return a.title.localeCompare(b.title, "fr");
      case "title-desc":
        return b.title.localeCompare(a.title, "fr");
      default:
        return 0;
    }
  });
}

export function sortAllTab(events: AdminEvent[]): AdminEvent[] {
  return [
    ...sortEvents(events.filter((e) => e._temporalStatus === "ongoing"), "date-asc", "ongoing"),
    ...sortEvents(events.filter((e) => e._temporalStatus === "upcoming"), "date-asc", "upcoming"),
    ...sortEvents(events.filter((e) => e._temporalStatus === "past"), "date-desc", "past"),
  ];
}

// ─── Group by Month ───────────────────────────────────────────────

export function groupByMonth(events: AdminEvent[]): MonthGroup[] {
  const groups = new Map<string, AdminEvent[]>();

  for (const event of events) {
    const date = event._startDate || (event.date ? parseISO(event.date) : new Date());
    const key = format(date, "yyyy-MM");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  }

  return Array.from(groups.entries()).map(([key, events]) => ({
    key,
    label: format(parseISO(`${key}-01`), "MMMM yyyy", { locale: fr }),
    events,
  }));
}

// ─── Counts ───────────────────────────────────────────────────────

export interface TemporalCounts {
  upcoming: number;
  ongoing: number;
  past: number;
  all: number;
}

export function computeCounts(events: AdminEvent[]): TemporalCounts {
  return {
    upcoming: events.filter((e) => e._temporalStatus === "upcoming").length,
    ongoing: events.filter((e) => e._temporalStatus === "ongoing").length,
    past: events.filter((e) => e._temporalStatus === "past").length,
    all: events.length,
  };
}

// ─── Extract unique values for filter dropdowns ───────────────────

export function extractEventTypes(events: AdminEvent[]): string[] {
  const types = new Set<string>();
  events.forEach((e) => { if (e.category) types.add(e.category); });
  return Array.from(types).sort();
}

/** @deprecated use extractEventTypes */
export const extractCategories = extractEventTypes;

export function extractCities(events: AdminEvent[]): string[] {
  const cities = new Set<string>();
  events.forEach((e) => { if (e.city) cities.add(e.city); });
  return Array.from(cities).sort((a, b) => a.localeCompare(b, "fr"));
}

export function extractAssociations(events: AdminEvent[]): string[] {
  const assocs = new Set<string>();
  events.forEach((e) => {
    const name = e.association?.name || e.association_name;
    if (name) assocs.add(name);
  });
  return Array.from(assocs).sort((a, b) => a.localeCompare(b, "fr"));
}

// ─── Full Pipeline ────────────────────────────────────────────────

export interface PipelineResult {
  monthGroups: MonthGroup[];
  totalFiltered: number;
}

export function processEvents(
  rawEvents: AdminEvent[],
  tab: TemporalTab,
  filters: EventFilters,
  sort: SortOption
): PipelineResult {
  const enriched = enrichEvents(rawEvents);
  const tabFiltered = filterByTab(enriched, tab);
  const filtered = applyFilters(tabFiltered, filters);

  let sorted: AdminEvent[];
  if (tab === "all" && sort === "date-asc") {
    sorted = sortAllTab(filtered);
  } else {
    sorted = sortEvents(filtered, sort, tab);
  }

  return {
    monthGroups: groupByMonth(sorted),
    totalFiltered: filtered.length,
  };
}

// ─── Pagination ───────────────────────────────────────────────────

export const EVENTS_PER_PAGE = 12;

export function paginateMonthGroups(
  groups: MonthGroup[],
  visibleCount: number
): { visibleGroups: MonthGroup[]; totalCount: number; hasMore: boolean } {
  let count = 0;
  const totalCount = groups.reduce((sum, g) => sum + g.events.length, 0);
  const visibleGroups: MonthGroup[] = [];

  for (const group of groups) {
    if (count >= visibleCount) break;
    const remaining = visibleCount - count;
    if (group.events.length <= remaining) {
      visibleGroups.push(group);
      count += group.events.length;
    } else {
      visibleGroups.push({ ...group, events: group.events.slice(0, remaining) });
      count += remaining;
    }
  }

  return { visibleGroups, totalCount, hasMore: visibleCount < totalCount };
}

// ─── Sort Options ─────────────────────────────────────────────────

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date-asc",   label: "Date (plus proche)" },
  { value: "date-desc",  label: "Date (plus récente)" },
  { value: "title-asc",  label: "Titre A→Z" },
  { value: "title-desc", label: "Titre Z→A" },
];

// ─── Publication Statuses ─────────────────────────────────────────

export const PUBLICATION_STATUSES = [
  { value: "all",             label: "Tous les statuts" },
  { value: "upcoming",        label: "À venir" },
  { value: "places-limitees", label: "Places limitées" },
  { value: "complet",         label: "Complet" },
  { value: "cancelled",       label: "Annulé" },
];

// ─── Advanced filter helpers ──────────────────────────────────────

/**
 * Returns true if any advanced panel filter is non-default.
 */
export function hasAdvancedFilters(filters: EventFilters): boolean {
  return (
    (filters.publicationStatus !== "all" && filters.publicationStatus !== "") ||
    !!filters.dateFrom ||
    !!filters.dateTo ||
    (filters.priceFilter !== "all" && filters.priceFilter !== "") ||
    (filters.formatFilter !== "all" && filters.formatFilter !== "")
  );
}

/**
 * Returns true if any main bar filter is non-default.
 */
export function hasMainFilters(filters: EventFilters): boolean {
  return (
    !!filters.search.trim() ||
    (filters.eventType !== "all" && !!filters.eventType) ||
    (filters.organizerType !== "all" && !!filters.organizerType) ||
    (filters.city !== "all" && !!filters.city) ||
    (filters.association !== "all" && !!filters.association)
  );
}

export function hasActiveFilters(filters: EventFilters): boolean {
  return hasMainFilters(filters) || hasAdvancedFilters(filters);
}

// ─── Count active advanced filters ───────────────────────────────

export function countAdvancedFilters(filters: EventFilters): number {
  let count = 0;
  if (filters.publicationStatus !== "all" && filters.publicationStatus) count++;
  if (filters.dateFrom || filters.dateTo) count++;
  if (filters.priceFilter !== "all" && filters.priceFilter) count++;
  if (filters.formatFilter !== "all" && filters.formatFilter) count++;
  return count;
}
