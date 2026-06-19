import { useMemo } from "react";
import { useFilteredEvents, type Event, type EventType, type EventFilters } from "./useEvents";
import type { OrganizerKey } from "@/components/agenda/constants";

// ============================================================
// TYPES
// ============================================================

export type TemporalStatus = "upcoming" | "ongoing" | "past";
export type AgendaTab = "upcoming" | "ongoing" | "past" | "all";

export type EnrichedEvent = Event & { temporalStatus: TemporalStatus };

export interface AgendaCounts {
  upcoming: number;
  ongoing: number;
  past: number;
  all: number;
}

export interface AgendaFilters {
  searchQuery: string;
  selectedCity: string;
  selectedOrganizer: OrganizerKey;
  selectedType: EventType | "all";
}

// ============================================================
// TEMPORAL STATUS LOGIC
// ============================================================

export function getTemporalStatus(event: Event): TemporalStatus {
  const now = new Date();

  const startRaw = event.date_debut || event.date;
  const endRaw = event.date_fin || event.end_date || event.date_debut || event.date;

  const startDate = new Date(startRaw);
  const endDate = new Date(endRaw);

  // Les dates sont stockées en TIMESTAMPTZ.
  // Pour l'effectiveEnd, on arrondit à la fin du jour calendaire LOCAL
  // afin qu'un événement reste "en cours" toute la journée de sa date de fin.
  // On utilise une copie pour ne pas muter l'original.
  const endOfDay = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
    23, 59, 59, 999
  );

  if (startDate > now) return "upcoming";
  if (startDate <= now && endOfDay >= now) return "ongoing";
  return "past";
}

// ============================================================
// SORT HELPERS
// ============================================================

type SortKey = "date_closest" | "date_recent" | "popularity" | "proximity";

function getStartTime(e: Event): number {
  return new Date(e.date_debut || e.date).getTime();
}

function getEndTime(e: Event): number {
  return new Date(e.date_fin || e.end_date || e.date_debut || e.date).getTime();
}

export function sortEvents(events: EnrichedEvent[], sortKey: SortKey): EnrichedEvent[] {
  const copy = [...events];
  switch (sortKey) {
    case "date_closest":
      return copy.sort((a, b) => getStartTime(a) - getStartTime(b));
    case "date_recent":
      return copy.sort((a, b) => getStartTime(b) - getStartTime(a));
    case "popularity":
      return copy.sort((a, b) => (b.max_attendees || 0) - (a.max_attendees || 0));
    case "proximity":
      // Pas de coordonnées utilisateur disponibles — fallback date
      return copy.sort((a, b) => getStartTime(a) - getStartTime(b));
    default:
      return copy;
  }
}

export function getDefaultSort(tab: AgendaTab): SortKey {
  switch (tab) {
    case "upcoming":
      return "date_closest";
    case "ongoing":
      return "date_closest";
    case "past":
      return "date_recent";
    case "all":
      return "date_closest";
  }
}

// ============================================================
// MAIN HOOK
// ============================================================

export function useAgendaEvents(filters: AgendaFilters) {
  const { searchQuery, selectedCity, selectedOrganizer, selectedType } = filters;

  // Requête Supabase SANS filtre temporel → on récupère TOUS les événements
  const supabaseFilters: EventFilters = useMemo(() => {
    const f: EventFilters = {};
    if (selectedCity) f.city = selectedCity;
    if (selectedOrganizer === "mp") f.organizer = "mp";
    else if (selectedOrganizer === "associations") f.organizer = "associations";
    if (selectedType !== "all") f.type_evenement = selectedType;
    return f;
  }, [selectedCity, selectedOrganizer, selectedType]);

  const { data: allEvents = [], isLoading, error } = useFilteredEvents(supabaseFilters);

  // Recherche textuelle côté client
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return allEvents;
    const q = searchQuery.toLowerCase();
    return allEvents.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      (e.description && e.description.toLowerCase().includes(q)) ||
      (e.city && e.city.toLowerCase().includes(q)) ||
      (e.venue_name && e.venue_name.toLowerCase().includes(q)) ||
      (e.location && e.location.toLowerCase().includes(q))
    );
  }, [allEvents, searchQuery]);

  // Segmentation temporelle + compteurs
  const { upcoming, ongoing, past, counts } = useMemo(() => {
    const upcoming: EnrichedEvent[] = [];
    const ongoing: EnrichedEvent[] = [];
    const past: EnrichedEvent[] = [];

    for (const event of searchFiltered) {
      const status = getTemporalStatus(event);
      const enriched: EnrichedEvent = { ...event, temporalStatus: status };
      if (status === "upcoming") upcoming.push(enriched);
      else if (status === "ongoing") ongoing.push(enriched);
      else past.push(enriched);
    }

    // Tri par défaut par segment
    upcoming.sort((a, b) => getStartTime(a) - getStartTime(b));
    ongoing.sort((a, b) => getEndTime(a) - getEndTime(b));
    past.sort((a, b) => getStartTime(b) - getStartTime(a));

    return {
      upcoming,
      ongoing,
      past,
      counts: {
        upcoming: upcoming.length,
        ongoing: ongoing.length,
        past: past.length,
        all: upcoming.length + ongoing.length + past.length,
      } as AgendaCounts,
    };
  }, [searchFiltered]);

  return { upcoming, ongoing, past, counts, isLoading, error };
}
