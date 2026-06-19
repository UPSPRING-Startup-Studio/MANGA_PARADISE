import { eventStart, eventEnd, type EventRow } from "@/features/events/lib";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

type Dates = Pick<EventRow, "date" | "date_debut" | "date_fin" | "end_date">;

/** « 12 avril 2026 » ou « 12 → 14 avril 2026 » selon la durée. */
export function formatEventWhen(e: Dates): string {
  const start = eventStart(e);
  const end = eventEnd(e);
  if (start.toDateString() === end.toDateString()) return DATE.format(start);
  return `${DATE.format(start)} → ${DATE.format(end)}`;
}
