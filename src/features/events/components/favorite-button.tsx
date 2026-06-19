"use client";

import { useOptimistic, useTransition } from "react";
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
  const [fav, setFav] = useOptimistic(initial);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={fav}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        startTransition(async () => {
          setFav(!fav);
          await toggleFavorite(eventId);
        });
      }}
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
