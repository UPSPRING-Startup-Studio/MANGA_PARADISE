"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleLike } from "@/features/community/actions";
import { cn } from "@/lib/utils";

export function LikeButton({
  postId,
  liked,
  count,
}: {
  postId: string;
  liked: boolean;
  count: number;
}) {
  const [state, setState] = useState({ liked, count });
  const [pending, startTransition] = useTransition();

  function handleClick() {
    // Optimiste
    setState((s) => ({
      liked: !s.liked,
      count: s.count + (s.liked ? -1 : 1),
    }));
    startTransition(async () => {
      const res = await toggleLike(postId);
      // Réconcilie avec la vérité serveur (revert si l'écriture a échoué).
      if ("error" in res) {
        setState((s) => ({
          liked: !s.liked,
          count: s.count + (s.liked ? -1 : 1),
        }));
      } else {
        setState({ liked: res.liked, count: res.count });
      }
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={state.liked}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1.5 text-sm transition-colors",
        state.liked
          ? "text-mp-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Heart className="size-4" fill={state.liked ? "currentColor" : "none"} />
      {state.count}
    </button>
  );
}
