/* ═══════════════════════════════════════════════════════════
   AGENDA — Constants, type mappings & helpers
   ═══════════════════════════════════════════════════════════ */
import type { Event, EventType } from "@/hooks/useEvents";

// ── Organizer filter key (UI-level) ─────────────────────

export type OrganizerKey = "all" | "mp" | "associations";

export const ORGANIZER_OPTIONS: { key: OrganizerKey; label: string; icon: string; color: string }[] = [
  { key: "all",           label: "Tous",            icon: "",   color: "#1A1A2E" },
  { key: "mp",            label: "Manga Paradise",  icon: "🏯", color: "#C70039" },
  { key: "associations",  label: "Associations",    icon: "🤝", color: "#27AE60" },
];

export const ORGANIZER_MAP = Object.fromEntries(ORGANIZER_OPTIONS.map(o => [o.key, o])) as Record<OrganizerKey, (typeof ORGANIZER_OPTIONS)[number]>;

// ── Event type chips ─────────────────────────────────────

export const EVENT_TYPE_OPTIONS: { key: EventType | "all"; label: string }[] = [
  { key: "all",        label: "Tous" },
  { key: "convention", label: "Conventions" },
  { key: "tournoi",    label: "Tournois" },
  { key: "atelier",    label: "Ateliers" },
  { key: "projection", label: "Projections" },
  { key: "exposition", label: "Expositions" },
  { key: "meetup",     label: "Rencontres" },
  { key: "concert",    label: "Concerts" },
  { key: "autre",      label: "Autres" },
];

// ── Derive organizer type from a real Event ──────────────

export function getOrganizerLabel(event: Event): { label: string; color: string; icon: string } {
  if (event.association_id) {
    return { label: event.association_name || "Association", color: "#27AE60", icon: "🤝" };
  }
  return { label: "Manga Paradise", color: "#C70039", icon: "🏯" };
}

// ── Date formatting helpers ──────────────────────────────

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateRange(start: string, end?: string | null): string {
  if (!end) return formatDateShort(start);
  const s = new Date(start);
  const e = new Date(end);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}-${e.getDate()} ${s.toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}`;
  }
  return `${formatDateShort(start)} — ${formatDateShort(end)}`;
}

// ── Time period helpers ──────────────────────────────────

export function getWeekendDates(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 0 : 6 - day;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + diff);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  return {
    from: saturday.toISOString().split("T")[0],
    to: sunday.toISOString().split("T")[0],
  };
}

export function getMonthEndDate(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
}
