import { useState, useMemo, useRef, useEffect, memo, useCallback, useId } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, MapPin, ChevronDown, Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { thumbnailUrl } from "@/lib/imageUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEventActivities } from "@/hooks/useCosplayPhotos";
import { PhotoThumbnail } from "@/components/cosplay/photos/PhotoThumbnail";
import type { EnrichedPhoto, PhotoEvent, TaggedProfile } from "@/hooks/useAllCosplayPhotos";

// ─── Selection props shared by all photo views ─────────────────────────────

export interface PhotoSelectionProps {
  isSelectionMode?: boolean;
  isSelected?: (photoId: string) => boolean;
  toggleSelection?: (photoId: string) => void;
  enterSelectionMode?: () => void;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EventGroup {
  key: string;
  label: string;
  event: PhotoEvent | null;
  photos: EnrichedPhoto[];
}

interface PhotosByEventViewProps extends PhotoSelectionProps {
  photosByEvent: Map<string, EventGroup>;
  searchTerm: string;
  onOpenViewer: (photos: EnrichedPhoto[], index: number) => void;
  /** If set, auto-expand this event and scroll to it */
  highlightEventId?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTaggedPeople(photos: EnrichedPhoto[]): TaggedProfile[] {
  const seen = new Map<string, TaggedProfile>();
  for (const photo of photos) {
    for (const tag of photo.tags) {
      if (tag.status === "accepted" && tag.tagged_user_id && tag.tagged_profile && !seen.has(tag.tagged_user_id)) {
        seen.set(tag.tagged_user_id, tag.tagged_profile);
      }
    }
  }
  return [...seen.values()];
}

function formatEventDate(event: PhotoEvent | null, manualDate?: string | null): string | null {
  if (event?.date) {
    try { return format(parseISO(event.date), "dd MMM yyyy", { locale: fr }); }
    catch { return event.date; }
  }
  if (manualDate) {
    try { return format(parseISO(manualDate), "dd MMM yyyy", { locale: fr }); }
    catch { return manualDate; }
  }
  return null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const INITIAL_VISIBLE = 6;
const PAGE_SIZE = 6;

// ─── Filter chip row with keyboard navigation ──────────────────────────────

const FilterChipRow = memo(function FilterChipRow({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>("button"));
    const idx = buttons.indexOf(e.target as HTMLButtonElement);
    if (idx === -1) return;

    let next: number | null = null;
    if (e.key === "ArrowRight") next = Math.min(idx + 1, buttons.length - 1);
    if (e.key === "ArrowLeft") next = Math.max(idx - 1, 0);

    if (next !== null) {
      e.preventDefault();
      buttons[next].focus();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn("flex gap-1.5 overflow-x-auto pb-2 scrollbar-none", className)}
    >
      {children}
    </div>
  );
});

// ─── Single filter chip ─────────────────────────────────────────────────────

interface FilterChipProps {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  variant?: "day" | "activity";
}

const FilterChip = memo(function FilterChip({
  label,
  count,
  isActive,
  onClick,
  variant = "day",
}: FilterChipProps) {
  const activeStyles =
    variant === "activity"
      ? "bg-purple-500/20 text-purple-200 border-purple-400/40 shadow-[0_0_10px_rgba(168,85,247,0.12)]"
      : "bg-teal-500/25 text-teal-200 border-teal-400/40 shadow-[0_0_10px_rgba(20,184,166,0.12)]";

  return (
    <button
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      className={cn(
        "flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-all border capitalize",
        "min-h-[36px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0D0D0D]",
        isActive
          ? activeStyles
          : "bg-white/[0.04] text-white/50 border-white/[0.08] hover:bg-white/[0.08] hover:text-white/70",
      )}
    >
      {label}
      {count != null ? ` (${count})` : ""}
    </button>
  );
});

// ─── Event section ──────────────────────────────────────────────────────────

interface EventSectionProps extends PhotoSelectionProps {
  group: EventGroup;
  onOpenViewer: (photos: EnrichedPhoto[], index: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  isFirstGroup?: boolean;
}

const EventSection = memo(function EventSection({
  group,
  onOpenViewer,
  isOpen,
  onToggle,
  isFirstGroup = false,
  isSelectionMode = false,
  isSelected,
  toggleSelection,
  enterSelectionMode,
}: EventSectionProps) {
  const sectionId = useId();
  const headerId = `${sectionId}-header`;
  const contentId = `${sectionId}-content`;
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Local filter state ────────────────────────────────────────────────────
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<string | "__none__" | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  // ── Derived data ──────────────────────────────────────────────────────────
  const isNoEvent = group.key === "__none__";
  const banner = group.event?.cover_image ?? null;
  const dateStr = formatEventDate(group.event, group.photos[0]?.event_date_manual);
  const location = group.event?.location ?? null;
  const people = useMemo(() => getTaggedPeople(group.photos), [group.photos]);

  // ── Day chips ─────────────────────────────────────────────────────────────
  const uniqueDays = useMemo(() => {
    const days = new Set<string>();
    for (const p of group.photos) {
      if (p.shot_date) days.add(p.shot_date);
    }
    return [...days].sort();
  }, [group.photos]);

  const hasDayChips = uniqueDays.length > 1;

  // Day counts (memoized to avoid recalculating in render)
  const dayCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of group.photos) {
      if (p.shot_date) map.set(p.shot_date, (map.get(p.shot_date) ?? 0) + 1);
    }
    return map;
  }, [group.photos]);

  // ── Day-filtered photos ───────────────────────────────────────────────────
  const dayFilteredPhotos = useMemo(() => {
    if (!dayFilter) return group.photos;
    return group.photos.filter((p) => p.shot_date === dayFilter);
  }, [group.photos, dayFilter]);

  // ── Activity data ─────────────────────────────────────────────────────────
  const eventId = group.event?.id ?? undefined;
  const hasActivityPhotos = group.photos.some((p) => p.activity_id);
  const { data: activities } = useEventActivities(hasActivityPhotos ? eventId : undefined);

  // Build activity filter options from day-filtered photos
  const activityOptions = useMemo(() => {
    if (!hasActivityPhotos) return [];

    const activityMap = new Map(activities?.map((a) => [a.id, a]) ?? []);
    const counts = new Map<string, number>();
    let noActivityCount = 0;

    for (const p of dayFilteredPhotos) {
      if (p.activity_id) {
        counts.set(p.activity_id, (counts.get(p.activity_id) ?? 0) + 1);
      } else {
        noActivityCount++;
      }
    }

    const options: Array<{ id: string | null; label: string; count: number }> = [];

    // Sort by start_time
    const sortedIds = [...counts.keys()].sort((a, b) => {
      const aTime = activityMap.get(a)?.start_time ?? "";
      const bTime = activityMap.get(b)?.start_time ?? "";
      return aTime.localeCompare(bTime);
    });

    for (const id of sortedIds) {
      options.push({
        id,
        label: activityMap.get(id)?.title ?? "Activité",
        count: counts.get(id)!,
      });
    }

    if (noActivityCount > 0) {
      options.push({ id: null, label: "Non classées", count: noActivityCount });
    }

    return options;
  }, [dayFilteredPhotos, hasActivityPhotos, activities]);

  const hasActivityChips = activityOptions.length > 1;

  // Reset activity filter when it becomes invalid after day change
  useEffect(() => {
    if (!activityFilter) return;
    if (activityFilter === "__none__") {
      if (!activityOptions.some((o) => o.id === null)) setActivityFilter(null);
    } else {
      if (!activityOptions.some((o) => o.id === activityFilter)) setActivityFilter(null);
    }
  }, [activityOptions, activityFilter]);

  // ── Fully filtered photos ─────────────────────────────────────────────────
  const filteredPhotos = useMemo(() => {
    if (!activityFilter) return dayFilteredPhotos;
    if (activityFilter === "__none__") {
      return dayFilteredPhotos.filter((p) => !p.activity_id);
    }
    return dayFilteredPhotos.filter((p) => p.activity_id === activityFilter);
  }, [dayFilteredPhotos, activityFilter]);

  // ── Photo index map for O(1) lookup ───────────────────────────────────────
  const photoIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    filteredPhotos.forEach((p, i) => map.set(p.id, i));
    return map;
  }, [filteredPhotos]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const visiblePhotos = filteredPhotos.slice(0, visibleCount);
  const hasMore = filteredPhotos.length > visibleCount;
  const remainingCount = filteredPhotos.length - visibleCount;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePhotoClick = useCallback(
    (photo: EnrichedPhoto) => {
      if (isSelectionMode && toggleSelection) {
        toggleSelection(photo.id);
      } else {
        const idx = photoIndexMap.get(photo.id) ?? 0;
        onOpenViewer(filteredPhotos, idx);
      }
    },
    [isSelectionMode, toggleSelection, onOpenViewer, filteredPhotos, photoIndexMap],
  );

  const handleTouchStart = useCallback(
    (photoId: string) => {
      longPressTimer.current = setTimeout(() => {
        if (!isSelectionMode && enterSelectionMode) enterSelectionMode();
        toggleSelection?.(photoId);
      }, 500);
    },
    [isSelectionMode, enterSelectionMode, toggleSelection],
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleDayFilter = useCallback((day: string | null) => {
    setDayFilter(day);
    setVisibleCount(INITIAL_VISIBLE);
  }, []);

  const handleActivityFilter = useCallback((id: string | "__none__" | null) => {
    setActivityFilter(id);
    setVisibleCount(INITIAL_VISIBLE);
  }, []);

  return (
    <section className="mb-4" aria-labelledby={headerId}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      {isNoEvent ? (
        <button
          id={headerId}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="w-full flex items-center gap-3 py-3 px-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0D0D0D] group"
        >
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-white/40 text-xs font-medium tracking-wider uppercase">
            Sans événement
          </span>
          <span className="text-white/30 text-[10px]">({group.photos.length})</span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-white/30 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
          <div className="h-px flex-1 bg-white/[0.06]" />
        </button>
      ) : (
        <button
          id={headerId}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="relative w-full rounded-xl overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0D] group"
        >
          {/* Banner */}
          {banner ? (
            <img
              src={thumbnailUrl(banner, 600, 200)}
              alt=""
              className="w-full h-[100px] sm:h-[140px] object-cover"
              loading={isFirstGroup ? "eager" : "lazy"}
              decoding="async"
            />
          ) : (
            <div className="w-full h-[100px] sm:h-[140px] bg-gradient-to-br from-teal-900/20 via-[#1A1A2E] to-purple-900/20 flex items-center justify-center">
              <p className="text-white/10 text-xl font-bold truncate px-6">{group.label}</p>
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/60 to-transparent" />

          {/* Count badge */}
          <Badge className="absolute top-2.5 right-2.5 bg-white/10 backdrop-blur-md text-white text-[10px] border border-white/10 px-2 py-0.5 shadow-lg">
            {group.photos.length} photo{group.photos.length > 1 ? "s" : ""}
          </Badge>

          {/* Chevron */}
          <div className="absolute top-2.5 left-2.5">
            <ChevronDown
              className={cn(
                "w-4 h-4 text-white/60 transition-transform duration-200",
                isOpen && "rotate-180",
              )}
            />
          </div>

          {/* Title + meta */}
          <div className="absolute bottom-0 inset-x-0 p-3.5">
            <p
              className="text-lg sm:text-xl leading-tight font-bold text-white truncate"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
            >
              {group.label}
            </p>
            <div className="flex items-center gap-3 mt-1">
              {dateStr && (
                <div className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 text-white/60 flex-shrink-0" />
                  <span className="text-xs text-white/60">{dateStr}</span>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-white/50 flex-shrink-0" />
                  <span className="text-xs text-white/50 truncate">{location}</span>
                </div>
              )}
            </div>
          </div>
        </button>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      {isOpen && (
        <div id={contentId} role="region" aria-labelledby={headerId} className="pt-3 space-y-2">
          {/* ── Day filter chips ────────────────────────────────────────── */}
          {hasDayChips && (
            <FilterChipRow label="Filtrer par jour">
              <FilterChip
                label="Tous"
                count={group.photos.length}
                isActive={!dayFilter}
                onClick={() => handleDayFilter(null)}
              />
              {uniqueDays.map((day) => {
                let label: string;
                try {
                  label = format(parseISO(day), "EEE d MMM", { locale: fr });
                } catch {
                  label = day;
                }
                return (
                  <FilterChip
                    key={day}
                    label={label}
                    count={dayCounts.get(day) ?? 0}
                    isActive={dayFilter === day}
                    onClick={() => handleDayFilter(dayFilter === day ? null : day)}
                  />
                );
              })}
            </FilterChipRow>
          )}

          {/* ── Activity filter chips ──────────────────────────────────── */}
          {hasActivityChips && (
            <FilterChipRow label="Filtrer par activité" className="mb-1">
              <FilterChip
                label="Toutes"
                count={dayFilteredPhotos.length}
                isActive={!activityFilter}
                onClick={() => handleActivityFilter(null)}
                variant="activity"
              />
              {activityOptions.map((opt) => {
                const chipKey = opt.id ?? "__none__";
                const isActive = activityFilter === chipKey;
                return (
                  <FilterChip
                    key={chipKey}
                    label={opt.label}
                    count={opt.count}
                    isActive={isActive}
                    onClick={() => handleActivityFilter(isActive ? null : chipKey)}
                    variant="activity"
                  />
                );
              })}
            </FilterChipRow>
          )}

          {/* ── Filter context indicator ───────────────────────────────── */}
          {(dayFilter || activityFilter) && (
            <p className="text-[11px] text-white/50 px-0.5" aria-live="polite">
              {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? "s" : ""} affichée{filteredPhotos.length !== 1 ? "s" : ""}
            </p>
          )}

          {/* ── Photo grid ─────────────────────────────────────────────── */}
          {visiblePhotos.length > 0 && (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-1.5"
              role="group"
              aria-label={`Photos de ${group.label}`}
            >
              {visiblePhotos.map((photo, i) => (
                <PhotoThumbnail
                  key={photo.id}
                  photo={photo}
                  loading={isFirstGroup && i < 3 ? "eager" : "lazy"}
                  onClick={() => handlePhotoClick(photo)}
                  onTouchStart={() => handleTouchStart(photo.id)}
                  onTouchEnd={handleTouchEnd}
                  isSelectionMode={isSelectionMode ?? false}
                  isSelected={!!(isSelectionMode && isSelected?.(photo.id))}
                />
              ))}
            </div>
          )}

          {/* ── Empty filtered state ───────────────────────────────────── */}
          {filteredPhotos.length === 0 && (
            <p className="text-white/40 text-sm text-center py-4">
              Aucune photo pour ce filtre.
            </p>
          )}

          {/* ── "Voir plus" button ──────────────────────────────────────── */}
          {hasMore && (
            <button
              onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
              className={cn(
                "w-full mt-2 py-2.5 text-sm transition-colors rounded-xl border",
                "text-white/50 hover:text-white/70",
                "bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0D0D0D]",
              )}
            >
              Voir plus ({remainingCount} photo{remainingCount > 1 ? "s" : ""} restante{remainingCount > 1 ? "s" : ""})
            </button>
          )}

          {/* ── People encountered ──────────────────────────────────────── */}
          {people.length > 0 && (
            <div className="flex items-center gap-2 mt-3 px-1">
              <div className="flex -space-x-1.5 flex-shrink-0">
                {people.slice(0, 5).map((p) => (
                  <Avatar key={p.id} className="w-7 h-7 ring-1 ring-[#0D0D0D]">
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[9px] bg-white/10 text-white">
                      {(p.username ?? p.display_name ?? "?")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <p className="text-[11px] text-white/50 truncate">
                Avec{" "}
                {people.slice(0, 2).map((p) => `@${p.username ?? p.display_name}`).join(", ")}
                {people.length > 2 && ` et ${people.length - 2} autre${people.length - 2 > 1 ? "s" : ""}`}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
});

// ─── Main component ─────────────────────────────────────────────────────────

export function PhotosByEventView({
  photosByEvent,
  searchTerm,
  onOpenViewer,
  highlightEventId,
  isSelectionMode,
  isSelected,
  toggleSelection,
  enterSelectionMode,
}: PhotosByEventViewProps) {
  const isMobile = useIsMobile();

  const groups = useMemo(() => {
    let all = [...photosByEvent.values()];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      all = all.filter((g) => g.label.toLowerCase().includes(q));
    }

    all.sort((a, b) => {
      if (a.key === "__none__") return 1;
      if (b.key === "__none__") return -1;
      const dateA = a.event?.date ?? a.photos[0]?.event_date_manual ?? "";
      const dateB = b.event?.date ?? b.photos[0]?.event_date_manual ?? "";
      return dateB.localeCompare(dateA);
    });

    return all;
  }, [photosByEvent, searchTerm]);

  // ── Open state management (accordion on mobile) ───────────────────────────

  const [openKeys, setOpenKeys] = useState<Set<string>>(() => {
    if (highlightEventId) return new Set([highlightEventId]);
    const isMobileInit = typeof window !== "undefined" && window.innerWidth < 768;
    const keys = new Set<string>();
    // Sort events by date desc to open the most recent on mobile
    const sorted = [...photosByEvent.entries()]
      .filter(([k]) => k !== "__none__")
      .sort(([, a], [, b]) => {
        const dateA = a.event?.date ?? a.photos[0]?.event_date_manual ?? "";
        const dateB = b.event?.date ?? b.photos[0]?.event_date_manual ?? "";
        return dateB.localeCompare(dateA);
      });
    for (const [key] of sorted) {
      keys.add(key);
      if (isMobileInit) break; // Only most recent event open on mobile
    }
    return keys;
  });

  // React to highlight changes
  useEffect(() => {
    if (highlightEventId) {
      setOpenKeys(new Set([highlightEventId]));
    }
  }, [highlightEventId]);

  const toggleEvent = useCallback(
    (key: string) => {
      setOpenKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          if (isMobile) next.clear(); // Accordion: close others on mobile
          next.add(key);
        }
        return next;
      });
    },
    [isMobile],
  );

  // Scroll to highlighted event
  const highlightRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (highlightEventId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [highlightEventId]);

  if (groups.length === 0) {
    return (
      <p className="text-white/40 text-sm text-center py-8">
        Aucun événement trouvé.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {groups.map((group, groupIndex) => (
        <div
          key={group.key}
          ref={group.key === highlightEventId ? highlightRef : undefined}
        >
          <EventSection
            group={group}
            onOpenViewer={onOpenViewer}
            isOpen={openKeys.has(group.key)}
            onToggle={() => toggleEvent(group.key)}
            isFirstGroup={groupIndex === 0}
            isSelectionMode={isSelectionMode}
            isSelected={isSelected}
            toggleSelection={toggleSelection}
            enterSelectionMode={enterSelectionMode}
          />
        </div>
      ))}
    </div>
  );
}

export default PhotosByEventView;
