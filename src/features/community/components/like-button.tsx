"use client";

import { useOptimistic, useTransition } from "react";
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
  const [opt, apply] = useOptimistic(
    { liked, count },
    (s: { liked: boolean; count: number }) => ({
      liked: !s.liked,
      count: s.count + (s.liked ? -1 : 1),
    }),
  );
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={opt.liked}
      onClick={() =>
        startTransition(() => {
          apply(null);
          void toggleLike(postId);
        })
      }
      className={cn(
        "flex items-center gap-1.5 text-sm transition-colors",
        opt.liked
          ? "text-mp-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Heart className="size-4" fill={opt.liked ? "currentColor" : "none"} />
      {opt.count}
    </button>
  );
}
