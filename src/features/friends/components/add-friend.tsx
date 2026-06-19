"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { searchUsers, sendFriendRequest } from "@/features/friends/actions";
import type { Person } from "@/features/friends/api/friendships";
import { PersonRow } from "@/features/friends/components/person-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddFriend() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setResults(await searchUsers(query));
      setSearched(true);
    });
  }

  function add(id: string) {
    startTransition(async () => {
      const res = await sendFriendRequest(id);
      if (!("error" in res)) setSent((prev) => new Set(prev).add(id));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={onSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom d'utilisateur…"
        />
        <Button type="submit" disabled={pending}>
          <Search className="size-4" />
        </Button>
      </form>

      {results.length > 0 && (
        <ul className="flex flex-col gap-3">
          {results.map((p) => (
            <li key={p.id}>
              <PersonRow
                person={p}
                action={
                  sent.has(p.id) ? (
                    <span className="text-muted-foreground shrink-0 text-sm">
                      Demande envoyée
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => add(p.id)}
                      className="shrink-0"
                    >
                      Ajouter
                    </Button>
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
      {searched && results.length === 0 && (
        <p className="text-muted-foreground text-sm">Aucun résultat.</p>
      )}
    </div>
  );
}
