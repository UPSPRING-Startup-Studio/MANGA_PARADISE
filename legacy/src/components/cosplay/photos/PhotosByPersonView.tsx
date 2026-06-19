import { useMemo, memo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Users, UserPlus, Check } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { thumbnailUrl } from "@/lib/imageUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/hooks/useFriendships";
import type { EnrichedPhoto, PersonAggregate, TaggedProfile } from "@/hooks/useAllCosplayPhotos";
import type { PhotoSelectionProps } from "./PhotosByEventView";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PhotosByPersonViewProps extends PhotoSelectionProps {
  photosByPerson: Map<string, PersonAggregate>;
  searchTerm: string;
  onOpenViewer: (photos: EnrichedPhoto[], index: number) => void;
}

// ─── Helper: events in common ───────────────────────────────────────────────

interface CommonEvent {
  key: string;
  label: string;
}

function getCommonEvents(photos: EnrichedPhoto[]): CommonEvent[] {
  const seen = new Map<string, string>();
  for (const p of photos) {
    if (p.event && !seen.has(p.event.id)) {
      seen.set(p.event.id, p.event.title);
    } else if (p.event_name_manual && !seen.has(`m:${p.event_name_manual}`)) {
      seen.set(`m:${p.event_name_manual}`, p.event_name_manual);
    }
  }
  return [...seen.entries()].map(([key, label]) => ({ key, label }));
}

// ─── Single person section ──────────────────────────────────────────────────

const PersonSection = memo(function PersonSection({
  aggregate,
  isNakama,
  onOpenViewer,
  isSelectionMode = false,
  isSelected,
  toggleSelection,
  enterSelectionMode,
}: {
  aggregate: PersonAggregate;
  isNakama: boolean;
  onOpenViewer: (photos: EnrichedPhoto[], index: number) => void;
} & PhotoSelectionProps) {
  const navigate = useNavigate();
  const events = useMemo(() => getCommonEvents(aggregate.photos), [aggregate.photos]);
  const { profile, photos } = aggregate;
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();

  const handlePhotoClick = useCallback((photo: EnrichedPhoto, index: number) => {
    if (isSelectionMode && toggleSelection) {
      toggleSelection(photo.id);
    } else {
      onOpenViewer(photos, index);
    }
  }, [isSelectionMode, toggleSelection, onOpenViewer, photos]);

  const handleTouchStart = useCallback((photoId: string) => {
    longPressTimer.current = setTimeout(() => {
      if (!isSelectionMode && enterSelectionMode) enterSelectionMode();
      toggleSelection?.(photoId);
    }, 500);
  }, [isSelectionMode, enterSelectionMode, toggleSelection]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const displayName = profile.username
    ? `@${profile.username}`
    : (profile.display_name ?? "?");

  return (
    <div className="mb-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(`/u/${profile.username ?? profile.id}`)}
        className="w-full flex items-center gap-3 p-2 mb-2 rounded-xl hover:bg-white/5 transition-colors focus:outline-none text-left"
      >
        <Avatar className={cn(
          "w-12 h-12 flex-shrink-0 ring-2",
          isNakama ? "ring-pink-500/30" : "ring-white/20"
        )}>
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="text-sm bg-white/10 text-white">
            {(profile.username ?? profile.display_name ?? "?")[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-white text-sm truncate">{displayName}</p>
            {isNakama && (
              <Badge className="bg-pink-500/20 text-pink-300 text-[9px] border-0 px-1.5 py-0 h-4">
                Nakama
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-white/40 mt-0.5">
            {photos.length} photo{photos.length > 1 ? "s" : ""} ensemble
            {aggregate.eventCount > 0 && ` · ${aggregate.eventCount} event${aggregate.eventCount > 1 ? "s" : ""} en commun`}
          </p>
        </div>

        <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
      </button>

      {/* ── Horizontal photo scroll ────────────────────────────────────── */}
      <div
        className="flex gap-1.5 pb-2 overflow-x-auto scrollbar-hide"
        style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
      >
        {photos.map((photo, i) => {
          const acceptedCount = photo.acceptedTagCount;
          const selected = isSelectionMode && isSelected?.(photo.id);
          return (
            <button
              key={photo.id}
              onClick={() => handlePhotoClick(photo, i)}
              onTouchStart={() => handleTouchStart(photo.id)}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              className={cn(
                "relative w-28 flex-shrink-0 overflow-hidden rounded-lg bg-white/5 focus:outline-none group transition-all duration-150",
                isSelectionMode && selected && "ring-2 ring-[#C70039] ring-offset-2 ring-offset-[#0D0D0D]",
                isSelectionMode && !selected && "opacity-60",
              )}
              style={{ aspectRatio: "3 / 4" }}
            >
              <img
                src={thumbnailUrl(photo.photo_url, 224, 300)}
                alt={photo.caption ?? "Photo cosplay"}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              {/* Selection checkbox */}
              {isSelectionMode && (
                <div className={cn(
                  "absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150",
                  selected
                    ? "bg-[#C70039] border-[#C70039] scale-100"
                    : "bg-black/40 border-white/40 scale-90"
                )}>
                  {selected && <Check className="w-3 h-3 text-white" />}
                </div>
              )}
              {acceptedCount > 0 && (
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold rounded-full px-1.5 py-px flex items-center gap-0.5">
                  <Users className="w-2 h-2" />
                  {acceptedCount}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Events in common chips ──────────────────────────────────────── */}
      {events.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto px-1 mt-1.5 pb-1">
          {events.map((ev) => (
            <Badge
              key={ev.key}
              variant="outline"
              className="text-[9px] border-teal-500/20 text-teal-400/70 whitespace-nowrap flex-shrink-0 px-2 py-0.5"
            >
              {ev.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Empty state — emotional design ─────────────────────────────────────────

function PersonEmptyState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Pulsing icon */}
      <div className="mb-6">
        <Users
          className="w-20 h-20 text-purple-400/50"
          style={{ animation: "gentle-pulse 3s ease-in-out infinite" }}
        />
      </div>

      {/* Title with gradient word */}
      <p className="text-lg font-semibold text-white/60 mb-1.5">
        Aucune{" "}
        <span className="bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
          rencontre
        </span>{" "}
        enregistrée
      </p>

      {/* Subtitle */}
      <p className="text-white/40 text-sm max-w-[300px] mb-7">
        Tague des cosplayeurs sur tes photos pour voir apparaitre tes rencontres ici !
      </p>

      {/* Premium CTA */}
      <Button
        onClick={() => navigate("/espace-membre/vestiaire")}
        className="group/cta bg-gradient-to-r from-[#C70039] to-[#FF5733] hover:from-[#FF5733] hover:to-[#FF8C42] text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(199,0,57,0.3)]"
      >
        <UserPlus className="w-4 h-4 mr-2 transition-transform duration-300 group-hover/cta:rotate-[5deg]" />
        Aller taguer mes photos
      </Button>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function PhotosByPersonView({ photosByPerson, searchTerm, onOpenViewer, isSelectionMode, isSelected, toggleSelection, enterSelectionMode }: PhotosByPersonViewProps) {
  const { user } = useAuth();
  const { data: friendships = [] } = useFriends(user?.id);

  // Build a set of nakama IDs for badge display
  const nakamaIds = useMemo(() => {
    const ids = new Set<string>();
    for (const f of friendships) {
      if (f.requester_id === user?.id && f.addressee) ids.add(f.addressee.id);
      else if (f.addressee_id === user?.id && f.requester) ids.add(f.requester.id);
    }
    return ids;
  }, [friendships, user?.id]);

  const groups = useMemo(() => {
    let all = [...photosByPerson.values()];

    // Filter by search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      all = all.filter((g) => {
        const name = g.profile.username ?? g.profile.display_name ?? "";
        return name.toLowerCase().includes(q);
      });
    }

    // Sort: nakamas first, then by photo count desc
    all.sort((a, b) => {
      const aNakama = nakamaIds.has(a.profile.id) ? 1 : 0;
      const bNakama = nakamaIds.has(b.profile.id) ? 1 : 0;
      if (aNakama !== bNakama) return bNakama - aNakama;
      return b.photos.length - a.photos.length;
    });

    return all;
  }, [photosByPerson, searchTerm, nakamaIds]);

  if (photosByPerson.size === 0) {
    return <PersonEmptyState />;
  }

  if (groups.length === 0) {
    return <p className="text-white/30 text-sm text-center py-8">Aucun cosplayeur trouvé.</p>;
  }

  return (
    <div>
      {groups.map((aggregate) => (
        <PersonSection
          key={aggregate.profile.id}
          aggregate={aggregate}
          isNakama={nakamaIds.has(aggregate.profile.id)}
          onOpenViewer={onOpenViewer}
          isSelectionMode={isSelectionMode}
          isSelected={isSelected}
          toggleSelection={toggleSelection}
          enterSelectionMode={enterSelectionMode}
        />
      ))}
    </div>
  );
}

export default PhotosByPersonView;
