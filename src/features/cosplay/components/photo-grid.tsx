"use client";

import { useOptimistic, useTransition } from "react";
import { X } from "lucide-react";
import { removePhoto } from "@/features/cosplay/actions";
import type { PhotoView } from "@/features/cosplay/server";

export function PhotoGrid({
  planId,
  photos,
}: {
  planId: string;
  photos: PhotoView[];
}) {
  const [optimistic, remove] = useOptimistic(
    photos,
    (state: PhotoView[], id: string) => state.filter((p) => p.id !== id),
  );
  const [, startTransition] = useTransition();

  if (optimistic.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucune photo pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {optimistic.map((p) => (
        <div
          key={p.id}
          className="border-border bg-mp-cloud relative aspect-square overflow-hidden rounded-xl border"
        >
          {p.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.url}
              alt={p.caption ?? ""}
              className="size-full object-cover"
            />
          ) : (
            <div className="text-muted-foreground grid size-full place-items-center text-xs">
              indisponible
            </div>
          )}
          <button
            type="button"
            aria-label="Supprimer la photo"
            onClick={() =>
              startTransition(() => {
                remove(p.id);
                void removePhoto(planId, p.id);
              })
            }
            className="bg-background/80 text-foreground hover:text-destructive absolute top-1 right-1 grid size-7 place-items-center rounded-full backdrop-blur"
          >
            <X className="size-4" />
          </button>
          {p.caption && (
            <span className="absolute inset-x-0 bottom-0 bg-black/50 p-1 text-xs text-white">
              {p.caption}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
