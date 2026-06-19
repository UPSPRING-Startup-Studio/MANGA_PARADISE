"use client";

import { useMemo, useState } from "react";
import { MemberCard } from "@/features/directory/components/member-card";
import type { Member } from "@/features/directory/api/members";
import { Input } from "@/components/ui/input";

const selectCls =
  "border-input bg-background h-9 rounded-lg border px-2 text-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function MembersView({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [otakuClass, setOtakuClass] = useState("");

  const cities = useMemo(
    () =>
      [
        ...new Set(members.map((m) => m.city).filter((c): c is string => !!c)),
      ].sort(),
    [members],
  );
  const classes = useMemo(
    () =>
      [
        ...new Set(
          members.map((m) => m.otakuClass).filter((c): c is string => !!c),
        ),
      ].sort(),
    [members],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return members.filter((m) => {
      if (q) {
        const text = `${m.displayName ?? ""} ${m.username}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      if (city && m.city !== city) return false;
      if (otakuClass && m.otakuClass !== otakuClass) return false;
      return true;
    });
  }, [members, query, city, otakuClass]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un membre…"
          className="max-w-xs"
        />
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
        {classes.length > 0 && (
          <select
            aria-label="Filtrer par classe"
            value={otakuClass}
            onChange={(e) => setOtakuClass(e.target.value)}
            className={selectCls}
          >
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Aucun membre pour ces critères.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}
