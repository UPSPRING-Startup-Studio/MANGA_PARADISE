import type { EventScheduleRow } from "@/features/events/api/events";

const DAY = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function groupByDay(rows: EventScheduleRow[]): Map<string, EventScheduleRow[]> {
  const map = new Map<string, EventScheduleRow[]>();
  for (const r of rows) {
    const key = r.day_date ?? "—";
    const list = map.get(key) ?? [];
    list.push(r);
    map.set(key, list);
  }
  return map;
}

export function EventSchedule({ schedule }: { schedule: EventScheduleRow[] }) {
  if (schedule.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Le programme n&apos;est pas encore disponible.
      </p>
    );
  }

  const days = groupByDay(schedule);

  return (
    <div className="flex flex-col gap-6">
      {[...days.entries()].map(([day, rows]) => (
        <div key={day} className="flex flex-col gap-2">
          <h3 className="text-mp-primary text-sm font-semibold tracking-wide uppercase">
            {day !== "—" && !Number.isNaN(Date.parse(day))
              ? DAY.format(new Date(day))
              : "Programme"}
          </h3>
          <ul className="border-border divide-border divide-y rounded-xl border">
            {rows.map((r) => (
              <li key={r.id} className="flex gap-3 p-3">
                <span className="text-foreground w-16 shrink-0 font-mono text-sm">
                  {r.time}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{r.title}</span>
                  {r.location && (
                    <span className="text-muted-foreground text-xs">
                      {r.location}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
