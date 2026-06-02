import { useMemo, memo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { thumbnailUrl } from "@/lib/imageUtils";
import { PhotoThumbnail } from "@/components/cosplay/photos/PhotoThumbnail";
import type { EnrichedPhoto, PhotoCosplan } from "@/hooks/useAllCosplayPhotos";
import type { PhotoSelectionProps } from "./PhotosByEventView";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CosplayGroup {
  cosplan: PhotoCosplan | null;
  photos: EnrichedPhoto[];
}

interface PhotosByCosplayViewProps extends PhotoSelectionProps {
  photosByCosplay: Map<string, CosplayGroup>;
  searchTerm: string;
  onOpenViewer: (photos: EnrichedPhoto[], index: number) => void;
}

// ─── Helper: count distinct events for a cosplay's photos ───────────────────

function countEvents(photos: EnrichedPhoto[]): number {
  const ids = new Set<string>();
  for (const p of photos) {
    if (p.event_id) ids.add(p.event_id);
    else if (p.event_name_manual) ids.add(`m:${p.event_name_manual}`);
  }
  return ids.size;
}

// ─── Helper: unique events as timeline dots ─────────────────────────────────

interface TimelineDot {
  key: string;
  label: string;
  date: string | null;
}

function getTimelineDots(photos: EnrichedPhoto[]): TimelineDot[] {
  const seen = new Map<string, TimelineDot>();
  for (const p of photos) {
    if (p.event && !seen.has(p.event.id)) {
      seen.set(p.event.id, { key: p.event.id, label: p.event.title, date: p.event.date });
    } else if (p.event_name_manual && !seen.has(`m:${p.event_name_manual}`)) {
      seen.set(`m:${p.event_name_manual}`, { key: `m:${p.event_name_manual}`, label: p.event_name_manual, date: p.event_date_manual });
    }
  }
  return [...seen.values()].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
}

// ─── Single cosplay section ─────────────────────────────────────────────────

const CosplaySection = memo(function CosplaySection({ cosplanId, group, onOpenViewer, isSelectionMode = false, isSelected, toggleSelection, enterSelectionMode }: { cosplanId: string; group: CosplayGroup; onOpenViewer: (photos: EnrichedPhoto[], index: number) => void } & PhotoSelectionProps) {
  const navigate = useNavigate();
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();

  const handlePhotoClick = useCallback((photo: EnrichedPhoto, index: number) => {
    if (isSelectionMode && toggleSelection) {
      toggleSelection(photo.id);
    } else {
      onOpenViewer(group.photos, index);
    }
  }, [isSelectionMode, toggleSelection, onOpenViewer, group.photos]);

  const handleTouchStart = useCallback((photoId: string) => {
    longPressTimer.current = setTimeout(() => {
      if (!isSelectionMode && enterSelectionMode) enterSelectionMode();
      toggleSelection?.(photoId);
    }, 500);
  }, [isSelectionMode, enterSelectionMode, toggleSelection]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);
  const eventCount = useMemo(() => countEvents(group.photos), [group.photos]);
  const dots = useMemo(() => getTimelineDots(group.photos), [group.photos]);

  const characterName = group.cosplan?.character_name ?? "Cosplay inconnu";
  const universe = group.cosplan?.universe ?? "";
  const image = group.cosplan?.image_url ?? null;

  return (
    <div className="mb-7">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-2 mb-2">
        {/* Thumbnail with animated ring */}
        <div className="relative flex-shrink-0">
          {image ? (
            <img
              src={thumbnailUrl(image, 112, 112)}
              alt={characterName}
              className="w-14 h-14 rounded-xl object-cover bg-white/5 ring-2 ring-pink-500/30"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-pink-500/10 flex items-center justify-center ring-2 ring-pink-500/20">
              <span className="text-pink-400 text-lg font-bold">{characterName[0]?.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">{characterName}</p>
          {universe && <p className="text-xs text-white/40 truncate">{universe}</p>}
          <p className="text-[11px] text-white/30 mt-0.5">
            {group.photos.length} photo{group.photos.length > 1 ? "s" : ""}
            <span className="text-white/10 mx-1">·</span>
            {eventCount > 0
              ? <>{eventCount} event{eventCount > 1 ? "s" : ""}</>
              : <span className="text-white/20">aucun event</span>
            }
          </p>
        </div>

        {/* Link to project */}
        <button
          onClick={() => navigate(`/espace-membre/cosplay/${cosplanId}?tab=photos`)}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors focus:outline-none"
          aria-label="Voir le projet"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Horizontal photo scroll — scroll-snap carousel ─────────────── */}
      <div
        className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide"
        style={{
          scrollSnapType: "x mandatory",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {group.photos.map((photo, i) => (
          <div key={photo.id} className="flex-shrink-0 w-24 sm:w-28" style={{ scrollSnapAlign: "start", aspectRatio: "3 / 4" }}>
            <PhotoThumbnail
              photo={photo}
              thumbWidth={224}
              thumbHeight={300}
              aspectClass="w-full h-full"
              onClick={() => handlePhotoClick(photo, i)}
              onTouchStart={() => handleTouchStart(photo.id)}
              onTouchEnd={handleTouchEnd}
              isSelectionMode={isSelectionMode ?? false}
              isSelected={!!(isSelectionMode && isSelected?.(photo.id))}
            />
          </div>
        ))}
      </div>

      {/* ── Event timeline dots ─────────────────────────────────────────── */}
      {dots.length > 0 && (
        <div className="flex items-center gap-1.5 px-1 mt-1.5">
          <span className="text-[9px] text-white/20 flex-shrink-0">Events :</span>
          <div className="flex items-center gap-1 overflow-x-auto">
            {dots.map((dot) => (
              <div key={dot.key} className="group/dot relative flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-500/40 group-hover/dot:bg-teal-400 transition-colors cursor-default" />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/dot:block z-10 whitespace-nowrap">
                  <div className="bg-[#1A1A2E] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white shadow-xl">
                    {dot.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ─── Main component ─────────────────────────────────────────────────────────

export function PhotosByCosplayView({ photosByCosplay, searchTerm, onOpenViewer, isSelectionMode, isSelected, toggleSelection, enterSelectionMode }: PhotosByCosplayViewProps) {
  const groups = useMemo(() => {
    let entries = [...photosByCosplay.entries()];

    // Filter by search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      entries = entries.filter(([, g]) => {
        const name = g.cosplan?.character_name ?? "";
        const universe = g.cosplan?.universe ?? "";
        return name.toLowerCase().includes(q) || universe.toLowerCase().includes(q);
      });
    }

    // Sort by photo count desc
    entries.sort(([, a], [, b]) => b.photos.length - a.photos.length);

    return entries;
  }, [photosByCosplay, searchTerm]);

  if (groups.length === 0) {
    return <p className="text-white/30 text-sm text-center py-8">Aucun cosplay trouvé.</p>;
  }

  return (
    <div>
      {groups.map(([cosplanId, group]) => (
        <CosplaySection key={cosplanId} cosplanId={cosplanId} group={group} onOpenViewer={onOpenViewer} isSelectionMode={isSelectionMode} isSelected={isSelected} toggleSelection={toggleSelection} enterSelectionMode={enterSelectionMode} />
      ))}
    </div>
  );
}

export default PhotosByCosplayView;
