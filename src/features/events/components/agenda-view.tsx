"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, Map as MapIcon } from "lucide-react";
import { EventCard } from "@/features/events/components/event-card";
import { EventMap } from "@/features/events/components/event-map";
import {
  EVENT_TYPE_LABELS,
  TEMPORAL_LABELS,
  temporalStatus,
  type EventRow,
  type TemporalStatus,
} from "@/features/events/lib";
import { cn } from "@/lib/utils";

type Tab = TemporalStatus | "all";
const TABS: Tab[] = ["upcoming", "ongoing", "past", "all"];
const TAB_LABELS: Record<Tab, string> = { ...TEMPORAL_LABELS, all: "Tous" };

export function AgendaView({
  events,
  favoriteIds,
  participationIds,
  isAuthed,
}: {
  events: EventRow[];
  favoriteIds: string[];
  participationIds: string[];
  isAuthed: boolean;
}) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");

  const favSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const goingSet = useMemo(() => new Set(participationIds), [participationIds]);
  const cities = useMemo(
    () =>
      [
        ...new Set(events.map((e) => e.city).filter((c): c is string => !!c)),
      ].sort(),
    [events],
  );

  const filtered = useMemo(
    () =>
      events.filter((e) => {
        if (tab !== "all" && temporalStatus(e) !== tab) return false;
        if (city && e.city !== city) return false;
        if (type && e.type_evenement !== type) return false;
        if (onlyMine && !goingSet.has(e.id)) return false;
        return true;
      }),
    [events, tab, city, type, onlyMine, goingSet],
  );

  const selectCls =
    "border-input bg-background h-9 rounded-lg border px-2 text-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]";

  return (
    <div className="flex flex-col gap-5">
      {/* Onglets temporels */}
      <div className="border-border flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "border-mp-primary text-mp-primary"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Filtrer par ville"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className={selectCls}
        >
          <option value="">Toutes les villes</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrer par type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={selectCls}
        >
          <option value="">Tous les types</option>
          {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {isAuthed && (
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
            />
            Mes événements
          </label>
        )}

        <div className="border-input ml-auto flex overflow-hidden rounded-lg border">
          <button
            type="button"
            aria-label="Vue liste"
            onClick={() => setView("list")}
            className={cn(
              "grid size-9 place-items-center",
              view === "list"
                ? "bg-mp-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Vue carte"
            onClick={() => setView("map")}
            className={cn(
              "grid size-9 place-items-center",
              view === "map"
                ? "bg-mp-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            <MapIcon className="size-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          Aucun événement pour ces critères.
        </p>
      ) : view === "map" ? (
        <EventMap events={filtered} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              isFavorite={favSet.has(e.id)}
              showFavorite={isAuthed}
            />
          ))}
        </div>
      )}
    </div>
  );
}
