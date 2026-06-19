"use client";

import { type MouseEvent, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/features/events/actions";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  eventId,
  initial,
}: {
  eventId: string;
  initial: boolean;
}) {
  const [fav, setFav] = useState(initial);
  const [pending, startTransition] = useTransition();

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    const next = !fav;
    setFav(next); // optimiste
    startTransition(async () => {
      const res = await toggleFavorite(eventId);
      // Réconcilie avec la vérité serveur (revert si l'écriture a échoué).
      setFav("error" in res ? !next : res.favorite);
    });
  }

  return (
    <button
      type="button"
      aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={fav}
      disabled={pending}
      onClick={handleClick}
      className={cn(
        "grid size-8 place-items-center rounded-full border transition-colors",
        fav
          ? "border-mp-primary bg-mp-primary/10 text-mp-primary"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      <Heart className="size-4" fill={fav ? "currentColor" : "none"} />
    </button>
  );
}
