/**
 * splitLineups — shared temporal split for lineup items.
 *
 * effectiveDate = end_date ?? date
 * future: effectiveDate >= today  (ascending: closest first)
 * past:   effectiveDate <  today  (descending: most recent first)
 */

const todayStr = () => new Date().toISOString().slice(0, 10);

export function splitLineups<
  T extends { event?: { date: string; end_date: string | null } | null }
>(items: T[]): { upcoming: T[]; past: T[] } {
  const now = todayStr();
  const upcoming: T[] = [];
  const past: T[] = [];

  for (const item of items) {
    if (!item.event) continue;
    const effective = item.event.end_date || item.event.date;
    if (effective >= now) {
      upcoming.push(item);
    } else {
      past.push(item);
    }
  }

  const getDate = (i: T) => i.event?.date ?? "";
  upcoming.sort((a, b) => getDate(a).localeCompare(getDate(b)));
  past.sort((a, b) => getDate(b).localeCompare(getDate(a)));

  return { upcoming, past };
}
