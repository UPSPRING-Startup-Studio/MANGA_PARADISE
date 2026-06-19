import type { Database } from "@/types/database";

/** Helpers purs du domaine events (dates, statut temporel, géoloc). */

export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type EventType = Database["public"]["Enums"]["event_type"];
export type TemporalStatus = "upcoming" | "ongoing" | "past";

/** Début effectif : date_debut (riche) sinon date (legacy). */
export function eventStart(e: Pick<EventRow, "date" | "date_debut">): Date {
  return new Date(e.date_debut ?? e.date);
}

/** Fin effective : date_fin sinon end_date sinon début. */
export function eventEnd(
  e: Pick<EventRow, "date" | "date_debut" | "date_fin" | "end_date">,
): Date {
  const end = e.date_fin ?? e.end_date;
  return end ? new Date(end) : eventStart(e);
}

export function temporalStatus(
  e: Pick<EventRow, "date" | "date_debut" | "date_fin" | "end_date">,
  now: Date = new Date(),
): TemporalStatus {
  const start = eventStart(e);
  const end = eventEnd(e);
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "ongoing";
}

/** Coordonnées Leaflet depuis le JSONB `coordonnees_gps` ({ lat, lng }). */
export function eventCoords(
  e: Pick<EventRow, "coordonnees_gps">,
): { lat: number; lng: number } | null {
  const raw = e.coordonnees_gps as unknown;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.lat === "number" && typeof o.lng === "number") {
    return { lat: o.lat, lng: o.lng };
  }
  return null;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  convention: "Convention",
  tournoi: "Tournoi",
  atelier: "Atelier",
  meetup: "Meetup",
  concert: "Concert",
  exposition: "Exposition",
  projection: "Projection",
  autre: "Autre",
};

export const TEMPORAL_LABELS: Record<TemporalStatus, string> = {
  upcoming: "À venir",
  ongoing: "En cours",
  past: "Passés",
};
