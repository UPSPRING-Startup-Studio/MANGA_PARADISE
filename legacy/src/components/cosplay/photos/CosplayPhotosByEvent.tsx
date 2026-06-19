import { useState, useMemo, memo } from "react";
import { CalendarDays, MapPin, ChevronDown, Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { thumbnailUrl } from "@/lib/imageUtils";
import { PhotoThumbnail } from "@/components/cosplay/photos/PhotoThumbnail";
import type { CosplayPhotoWithTags } from "@/types/cosplayPhotos";

// ─── Types ──────────────────────────────────────────────────────────────────

interface EventData {
  id: string | null;
  title: string;
  date: string | null;
  location: string | null;
  cover_image: string | null;
}

export interface CosplayEventGroup {
  key: string;
  event: EventData;
  photos: CosplayPhotoWithTags[];
}

interface CosplayPhotosByEventProps {
  photosByEvent: Map<string, CosplayEventGroup>;
  onPhotoClick: (photo: CosplayPhotoWithTags, index: number) => void;
}

// ─── Config ─────────────────────────────────────────────────────────────────

const INITIAL_VISIBLE = 6;

// ─── Helpers ────────────────────────────────────────────────────────────────

interface TaggedPerson {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

function getTaggedPeople(photos: CosplayPhotoWithTags[]): TaggedPerson[] {
  const seen = new Map<string, TaggedPerson>();
  for (const photo of photos) {
    for (const tag of photo.tags) {
      if (tag.status === "accepted" && tag.tagged_profile && !seen.has(tag.tagged_profile.id)) {
        seen.set(tag.tagged_profile.id, {
          id: tag.tagged_profile.id,
          username: tag.tagged_profile.username,
          avatar_url: tag.tagged_profile.avatar_url,
        });
      }
    }
  }
  return [...seen.values()];
}

// ─── Single event section ───────────────────────────────────────────────────

const EventSection = memo(function EventSection({
  group, onPhotoClick, defaultOpen, isFirst,
}: {
  group: CosplayEventGroup;
  onPhotoClick: (photo: CosplayPhotoWithTags, index: number) => void;
  defaultOpen: boolean;
  isFirst: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const people = useMemo(() => getTaggedPeople(group.photos), [group.photos]);

  const isNoEvent = group.key === "__no_event__";
  const banner = group.event.cover_image;
  const visiblePhotos = group.photos.slice(0, visibleCount);
  const hasMore = group.photos.length > visibleCount;
  const remainingCount = group.photos.length - visibleCount;

  return (
    <div className="mb-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      {isNoEvent ? (
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-3 py-3 px-1 focus:outline-none"
        >
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-white/30 text-xs font-medium tracking-wider uppercase">Sans événement</span>
          <span className="text-white/20 text-[10px]">({group.photos.length})</span>
          <ChevronDown className={cn("w-3.5 h-3.5 text-white/20 transition-transform duration-200", open && "rotate-180")} />
          <div className="h-px flex-1 bg-white/[0.06]" />
        </button>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative w-full rounded-xl overflow-hidden text-left focus:outline-none group"
        >
          {banner ? (
            <img
              src={thumbnailUrl(banner, 600, 180)}
              alt={group.event.title}
              className="w-full h-28 object-cover"
              loading={isFirst ? "eager" : "lazy"}
              decoding="async"
            />
          ) : (
            <div className="w-full h-28 bg-gradient-to-br from-teal-900/20 via-[#1A1A2E] to-purple-900/20 flex items-center justify-center">
              <p className="text-white/10 text-lg font-bold truncate px-6">{group.event.title}</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/50 to-transparent" />
          <Badge className="absolute top-2 right-2 bg-white/10 backdrop-blur-md text-white text-[10px] border border-white/10 px-2 py-0.5">
            {group.photos.length} photo{group.photos.length > 1 ? "s" : ""}
          </Badge>
          <ChevronDown className={cn("absolute top-2 left-2 w-4 h-4 text-white/50 transition-transform duration-200", open && "rotate-180")} />
          <div className="absolute bottom-0 inset-x-0 p-3">
            <p className="text-lg font-bold text-white truncate" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
              {group.event.title}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              {group.event.date && (
                <div className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 text-white/50" />
                  <span className="text-[11px] text-white/50">{group.event.date}</span>
                </div>
              )}
              {group.event.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-white/40" />
                  <span className="text-[11px] text-white/40 truncate">{group.event.location}</span>
                </div>
              )}
            </div>
          </div>
        </button>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      {open && (
        <div className="pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {visiblePhotos.map((photo, i) => (
              <PhotoThumbnail
                key={photo.id}
                photo={photo}
                loading={isFirst && i < 3 ? "eager" : "lazy"}
                onClick={() => onPhotoClick(photo, i)}
              />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => setVisibleCount((v) => v + INITIAL_VISIBLE)}
              className="w-full mt-3 py-2.5 text-sm text-white/40 hover:text-white/60 transition-colors rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06]"
            >
              Voir plus ({remainingCount} photo{remainingCount > 1 ? "s" : ""} restante{remainingCount > 1 ? "s" : ""})
            </button>
          )}

          {people.length > 0 && (
            <div className="flex items-center gap-2 mt-3 px-1">
              <div className="flex -space-x-1.5 flex-shrink-0">
                {people.slice(0, 5).map((p) => (
                  <Avatar key={p.id} className="w-6 h-6 ring-1 ring-[#0D0D0D]">
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[8px] bg-white/10 text-white">
                      {(p.username ?? "?")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <p className="text-[11px] text-white/40 truncate">
                Avec {people.slice(0, 2).map((p) => `@${p.username ?? "?"}`).join(", ")}
                {people.length > 2 && ` et ${people.length - 2} autre${people.length - 2 > 1 ? "s" : ""}`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ─── Main ───────────────────────────────────────────────────────────────────

export function CosplayPhotosByEvent({ photosByEvent, onPhotoClick }: CosplayPhotosByEventProps) {
  const groups = useMemo(() => {
    const all = [...photosByEvent.values()];
    // Real events first (sorted by date desc), "no event" last
    all.sort((a, b) => {
      if (a.key === "__no_event__") return 1;
      if (b.key === "__no_event__") return -1;
      return (b.event.date ?? "").localeCompare(a.event.date ?? "");
    });
    return all;
  }, [photosByEvent]);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CalendarDays className="w-10 h-10 text-white/10 mb-3" />
        <p className="text-white/40 text-sm">Associe tes photos à des événements pour les organiser ici</p>
      </div>
    );
  }

  return (
    <div>
      {groups.map((group, i) => (
        <EventSection
          key={group.key}
          group={group}
          onPhotoClick={onPhotoClick}
          defaultOpen={group.key !== "__no_event__"}
          isFirst={i === 0}
        />
      ))}
    </div>
  );
}
