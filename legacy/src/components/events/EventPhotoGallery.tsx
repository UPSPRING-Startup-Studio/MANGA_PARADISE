import { useState, useMemo } from "react";
import { Camera, Plus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { thumbnailUrl } from "@/lib/imageUtils";
import { useEventPhotos, useEventActivities } from "@/hooks/useCosplayPhotos";
import type { EventPhotoEnriched, EventActivity } from "@/hooks/useCosplayPhotos";

// ─── Types ──────────────────────────────────────────────────────────────────

interface EventPhotoGalleryProps {
  eventId: string;
  eventTitle: string;
  isParticipant: boolean;
  onAddPhotos?: () => void;
  onPhotoClick?: (photo: EventPhotoEnriched, index: number) => void;
}

// ─── Photo grid with pagination ─────────────────────────────────────────────

function PhotoActivityGrid({
  photos,
  onPhotoClick,
}: {
  photos: EventPhotoEnriched[];
  onPhotoClick?: (photo: EventPhotoEnriched, index: number) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(6);
  const visible = photos.slice(0, visibleCount);
  const hasMore = photos.length > visibleCount;

  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5">
        {visible.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => onPhotoClick?.(photo, i)}
            className="relative aspect-square rounded-lg overflow-hidden bg-white/5 focus:outline-none group"
          >
            <img
              src={thumbnailUrl(photo.photo_url, 300, 300)}
              alt={photo.caption ?? "Photo cosplay"}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
            {photo.photographer && (
              <div className="absolute bottom-1 left-1">
                <Avatar className="w-5 h-5 ring-1 ring-black/50">
                  <AvatarImage src={photo.photographer.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[8px] bg-white/10 text-white">
                    {(photo.photographer.username ?? "?")[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </button>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setVisibleCount((v) => v + 6)}
          className="w-full mt-2 py-2 text-xs text-white/30 hover:text-white/50 transition-colors rounded-lg bg-white/[0.02] hover:bg-white/[0.04]"
        >
          Voir plus ({photos.length - visibleCount} restante{photos.length - visibleCount > 1 ? "s" : ""})
        </button>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function EventPhotoGallery({
  eventId,
  eventTitle,
  isParticipant,
  onAddPhotos,
  onPhotoClick,
}: EventPhotoGalleryProps) {
  const { data: photos, isLoading } = useEventPhotos(eventId);
  const { data: activities } = useEventActivities(eventId);

  const photosByActivity = useMemo(() => {
    const groups = new Map<string, EventPhotoEnriched[]>();
    for (const photo of photos ?? []) {
      const key = photo.activity_id ?? "__uncategorized__";
      const existing = groups.get(key);
      if (existing) {
        existing.push(photo);
      } else {
        groups.set(key, [photo]);
      }
    }
    return groups;
  }, [photos]);

  const orderedActivities = useMemo(() => {
    const withPhotos = (activities ?? [])
      .filter((a) => photosByActivity.has(a.id))
      .sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));
    const withoutPhotos = (activities ?? [])
      .filter((a) => !photosByActivity.has(a.id));
    return { withPhotos, withoutPhotos };
  }, [activities, photosByActivity]);

  const uncategorizedPhotos = photosByActivity.get("__uncategorized__") ?? [];
  const totalPhotos = (photos ?? []).length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (totalPhotos === 0 && !isParticipant) return null;

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
            <Camera className="w-4 h-4 text-teal-400" />
            Photos souvenirs
          </h2>
          <p className="text-xs text-white/30 mt-1">
            {totalPhotos} photo{totalPhotos > 1 ? "s" : ""} partagee{totalPhotos > 1 ? "s" : ""} par la communaute
          </p>
        </div>
        {isParticipant && onAddPhotos && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddPhotos}
            className="gap-1.5 border-teal-500/30 text-teal-400 text-xs hover:bg-teal-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter mes photos
          </Button>
        )}
      </div>

      {/* ── Empty state for participants ────────────────────────────────── */}
      {totalPhotos === 0 && isParticipant && (
        <Card className="bg-teal-500/5 border-teal-500/20 p-6 text-center">
          <Camera className="w-10 h-10 text-teal-400/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-white/70">Tu etais a cet evenement !</p>
          <p className="text-xs text-white/40 mt-1 mb-4">
            Partage tes photos souvenirs pour enrichir la galerie communautaire
          </p>
          {onAddPhotos && (
            <Button onClick={onAddPhotos} className="bg-teal-500 hover:bg-teal-600 text-sm">
              Ajouter des photos
            </Button>
          )}
        </Card>
      )}

      {/* ── Activities WITH photos ──────────────────────────────────────── */}
      {orderedActivities.withPhotos.map((activity) => {
        const activityPhotos = photosByActivity.get(activity.id) ?? [];
        return (
          <div key={activity.id} className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full bg-teal-500/60" />
              <div>
                <p className="text-sm font-medium text-white">{activity.title}</p>
                <p className="text-xs text-white/40 flex items-center gap-1.5">
                  {activity.start_time && <span>{activity.start_time}</span>}
                  {activity.category && (
                    <>
                      <span className="text-white/10">·</span>
                      <Badge variant="outline" className="text-[9px] border-white/10 py-0 h-4">
                        {activity.category}
                      </Badge>
                    </>
                  )}
                  <span className="text-white/10">·</span>
                  <span>{activityPhotos.length} photo{activityPhotos.length > 1 ? "s" : ""}</span>
                </p>
              </div>
            </div>
            <PhotoActivityGrid photos={activityPhotos} onPhotoClick={onPhotoClick} />
          </div>
        );
      })}

      {/* ── Activities WITHOUT photos (subtle incitation) ────────────────── */}
      {orderedActivities.withoutPhotos.length > 0 && isParticipant && (
        <div className="space-y-2 opacity-50">
          <p className="text-xs text-white/30 uppercase tracking-wider">Activites sans photos</p>
          {orderedActivities.withoutPhotos.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-dashed border-white/[0.06]"
            >
              <span className="text-xs text-white/30">{activity.title}</span>
              {onAddPhotos && (
                <Button variant="ghost" size="sm" onClick={onAddPhotos} className="text-[10px] text-teal-400/50 h-6">
                  + Ajouter
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Uncategorized ────────────────────────────────────────────────── */}
      {uncategorizedPhotos.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs text-white/30 uppercase tracking-wider">Non categorise</p>
          <PhotoActivityGrid photos={uncategorizedPhotos} onPhotoClick={onPhotoClick} />
        </div>
      )}
    </div>
  );
}
