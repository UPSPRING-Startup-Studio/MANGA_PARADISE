import React, { useState, useMemo, useCallback } from "react";
import { Camera, Users, Shirt, Filter, ImagePlus, User, ChevronDown, SortDesc } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { thumbnailUrl } from "@/lib/imageUtils";
import { useAuth } from "@/contexts/AuthContext";
import {
  useEventCommunityGallery,
  type GalleryFilter,
  type GallerySort,
  type GalleryPhotoCard,
  type GalleryContributor,
  type GalleryCosplay,
} from "@/hooks/useEventCommunityGallery";

// ─── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

// Thumbnail sizes matched to actual grid cell size (retina × 2)
const THUMB_W = 240;
const THUMB_H = 240;

// ─── Types ──────────────────────────────────────────────────────────────────

interface EventCommunityGalleryProps {
  eventId: string;
  eventTitle: string;
  isParticipant: boolean;
  onAddPhotos?: () => void;
  onPhotoClick?: (photo: GalleryPhotoCard, index: number) => void;
}

// ─── Filter config ──────────────────────────────────────────────────────────

interface FilterDef {
  key: GalleryFilter;
  label: string;
  icon: React.ReactNode;
  needsAuth?: boolean;
}

const FILTERS: FilterDef[] = [
  { key: "all",          label: "Toutes",           icon: <Camera className="w-3 h-3" /> },
  { key: "mine",         label: "Mes photos",       icon: <User className="w-3 h-3" />, needsAuth: true },
  { key: "by_cosplayer", label: "Par cosplayer",    icon: <Users className="w-3 h-3" /> },
  { key: "by_cosplay",   label: "Par cosplay",      icon: <Shirt className="w-3 h-3" /> },
  { key: "group",        label: "Groupe",           icon: <Users className="w-3 h-3" /> },
];

const SORTS: { key: GallerySort; label: string }[] = [
  { key: "recent",  label: "Récentes" },
  { key: "popular", label: "Populaires" },
];

// ─── Sub-selectors ──────────────────────────────────────────────────────────

const ContributorSelector = React.memo(function ContributorSelector({
  contributors,
  selected,
  onSelect,
}: {
  contributors: GalleryContributor[];
  selected: string | undefined;
  onSelect: (id: string | undefined) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide pl-1">
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={cn(
          "flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all",
          !selected
            ? "bg-teal-500/25 text-teal-200 ring-1 ring-teal-400/40"
            : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08]"
        )}
      >
        Tous ({contributors.reduce((s, c) => s + c.photoCount, 0)})
      </button>
      {contributors.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c.id)}
          className={cn(
            "flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all",
            selected === c.id
              ? "bg-teal-500/25 text-teal-200 ring-1 ring-teal-400/40"
              : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08]"
          )}
        >
          <Avatar className="w-4 h-4">
            <AvatarImage src={c.avatar_url ?? undefined} />
            <AvatarFallback className="text-[7px] bg-white/10 text-white">
              {(c.username ?? "?")[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[80px] truncate">{c.username ?? "Cosplayer"}</span>
          <span className="opacity-40">{c.photoCount}</span>
        </button>
      ))}
    </div>
  );
});

const CosplaySelector = React.memo(function CosplaySelector({
  cosplays,
  selected,
  onSelect,
}: {
  cosplays: GalleryCosplay[];
  selected: string | undefined;
  onSelect: (id: string | undefined) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide pl-1">
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={cn(
          "flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all",
          !selected
            ? "bg-teal-500/25 text-teal-200 ring-1 ring-teal-400/40"
            : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08]"
        )}
      >
        Tous
      </button>
      {cosplays.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c.id)}
          className={cn(
            "flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all",
            selected === c.id
              ? "bg-teal-500/25 text-teal-200 ring-1 ring-teal-400/40"
              : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08]"
          )}
        >
          {c.character_name}
          <span className="opacity-40 ml-1">{c.photoCount}</span>
        </button>
      ))}
    </div>
  );
});

// ─── Photo card ─────────────────────────────────────────────────────────────

const GalleryCard = React.memo(function GalleryCard({
  photo,
  index,
  onClick,
}: {
  photo: GalleryPhotoCard;
  index: number;
  onClick?: (photo: GalleryPhotoCard, index: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(photo, index)}
      className="relative aspect-[4/5] rounded-xl overflow-hidden bg-white/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 group"
    >
      <img
        src={thumbnailUrl(photo.photo_url, THUMB_W, THUMB_H)}
        alt={photo.caption ?? "Photo cosplay"}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
      />

      {/* Persistent bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

      {/* Author — always visible */}
      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 z-10">
        <Avatar className="w-5 h-5 ring-1 ring-white/20 shadow-sm">
          <AvatarImage src={photo.authorAvatar ?? undefined} />
          <AvatarFallback className="text-[8px] bg-black/40 text-white/80">
            {(photo.authorName ?? "?")[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-[10px] text-white/90 font-medium drop-shadow-sm leading-none max-w-[80px] truncate">
          {photo.authorName}
        </span>
      </div>

      {/* Cosplay badge — top left */}
      {photo.cosplayLabel && (
        <div className="absolute top-1.5 left-1.5 z-10">
          <span className="inline-block text-[9px] font-semibold bg-black/50 backdrop-blur-sm text-white/90 rounded-md px-1.5 py-0.5 max-w-[110px] truncate leading-none">
            {photo.cosplay?.character_name}
          </span>
        </div>
      )}

      {/* Group badge — top right */}
      {photo.is_group_photo && (
        <div className="absolute top-1.5 right-1.5 z-10">
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-purple-500/70 backdrop-blur-sm text-white rounded-md px-1.5 py-0.5 leading-none">
            <Users className="w-2.5 h-2.5" />
            Groupe
          </span>
        </div>
      )}

      {/* Tag count — bottom right */}
      {photo.acceptedTagCount > 0 && (
        <div className="absolute bottom-1.5 right-1.5 z-10">
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-black/50 backdrop-blur-sm text-white/80 rounded-full px-1.5 py-0.5 leading-none">
            <Users className="w-2.5 h-2.5" />
            {photo.acceptedTagCount}
          </span>
        </div>
      )}
    </button>
  );
});

// ─── Skeleton grid ──────────────────────────────────────────────────────────

function GallerySkeleton() {
  return (
    <div className="space-y-5">
      {/* Header skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="w-7 h-7 rounded-lg" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
      {/* Card skeletons — match grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function EventCommunityGallery({
  eventId,
  eventTitle,
  isParticipant,
  onAddPhotos,
  onPhotoClick,
}: EventCommunityGalleryProps) {
  const { user } = useAuth();
  const [filter, setFilter] = useState<GalleryFilter>("all");
  const [sort, setSort] = useState<GallerySort>("recent");
  const [selectedContributor, setSelectedContributor] = useState<string>();
  const [selectedCosplay, setSelectedCosplay] = useState<string>();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { enriched, stats, contributors, cosplays, applyFilterSort, isLoading } =
    useEventCommunityGallery(eventId, eventTitle);

  // Filtered photos — recomputed when filter/sort/selection changes, NOT when data changes
  const photos = useMemo(
    () => applyFilterSort(filter, sort, selectedContributor, selectedCosplay, user?.id),
    [enriched, filter, sort, selectedContributor, selectedCosplay, user?.id],
  );

  const handleFilterChange = useCallback((key: GalleryFilter) => {
    setFilter(key);
    setSelectedContributor(undefined);
    setSelectedCosplay(undefined);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((v) => v + PAGE_SIZE);
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) return <GallerySkeleton />;

  // ── Derived ──────────────────────────────────────────────────────────────

  const visible = photos.slice(0, visibleCount);
  const remaining = photos.length - visibleCount;
  const hasMore = remaining > 0;
  const hasPhotos = stats.totalPhotos > 0;

  // Available filters (hide "Mes photos" if not logged in, hide "Groupe" if 0 group photos)
  const availableFilters = FILTERS.filter((f) => {
    if (f.needsAuth && !user) return false;
    if (f.key === "group" && stats.totalGroupPhotos === 0) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2.5 text-[15px] font-extrabold tracking-wide uppercase" style={{ color: "#E0E0F0", fontFamily: "'DM Sans', sans-serif" }}>
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
              <Camera className="w-4 h-4 text-teal-400" />
            </div>
            Photos de la communauté
          </h2>

          {/* Stats inline */}
          {hasPhotos && (
            <div className="flex items-center gap-3 mt-1.5 pl-[38px] text-[12px]" style={{ color: "rgba(180,180,210,0.55)" }}>
              <span><b style={{ color: "rgba(220,220,240,0.85)" }}>{stats.totalPhotos}</b> photo{stats.totalPhotos > 1 ? "s" : ""}</span>
              <span className="text-white/10">|</span>
              <span><b style={{ color: "rgba(220,220,240,0.85)" }}>{stats.totalContributors}</b> cosplayer{stats.totalContributors > 1 ? "s" : ""}</span>
              {stats.totalCosplays > 1 && (
                <>
                  <span className="text-white/10">|</span>
                  <span><b style={{ color: "rgba(220,220,240,0.85)" }}>{stats.totalCosplays}</b> cosplays</span>
                </>
              )}
            </div>
          )}

          {!hasPhotos && (
            <p className="mt-1 pl-[38px] text-[13px]" style={{ color: "rgba(180,180,210,0.6)" }}>
              Retrouve les photos partagées par les cosplayers présents.
            </p>
          )}
        </div>

        {isParticipant && onAddPhotos && (
          <Button
            size="sm"
            onClick={onAddPhotos}
            className="gap-1.5 bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold shadow-md shadow-teal-500/20 flex-shrink-0 mt-0.5"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            Ajouter
          </Button>
        )}
      </div>

      {/* ── Filters + Sort — two distinct zones ────────────────────────── */}
      {hasPhotos && (
        <div className="space-y-2">
          {/* Vues */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest mr-1" style={{ color: "rgba(180,180,210,0.35)" }}>
              Vue
            </span>
            {availableFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => handleFilterChange(f.key)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all",
                  filter === f.key
                    ? "bg-teal-500/25 text-teal-200 ring-1 ring-teal-400/40 shadow-sm shadow-teal-500/10"
                    : "bg-white/[0.04] text-white/35 hover:bg-white/[0.08] hover:text-white/55"
                )}
              >
                {f.icon}
                {f.label}
              </button>
            ))}

            {/* Sort toggle — right-aligned */}
            <div className="flex-shrink-0 w-px h-4 bg-white/[0.08] mx-1.5" />
            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest mr-1" style={{ color: "rgba(180,180,210,0.35)" }}>
              <SortDesc className="w-3 h-3 inline -mt-px" />
            </span>
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                className={cn(
                  "flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all",
                  sort === s.key
                    ? "bg-white/[0.08] text-white/70 ring-1 ring-white/15"
                    : "bg-white/[0.03] text-white/30 hover:bg-white/[0.06] hover:text-white/50"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Sub-selector */}
          {filter === "by_cosplayer" && contributors.length > 0 && (
            <ContributorSelector
              contributors={contributors}
              selected={selectedContributor}
              onSelect={setSelectedContributor}
            />
          )}
          {filter === "by_cosplay" && cosplays.length > 0 && (
            <CosplaySelector
              cosplays={cosplays}
              selected={selectedCosplay}
              onSelect={setSelectedCosplay}
            />
          )}
        </div>
      )}

      {/* ── Empty state — global ───────────────────────────────────────── */}
      {!hasPhotos && (
        <div
          className="rounded-xl p-6 sm:p-8 text-center"
          style={{
            background: "linear-gradient(180deg, rgba(13,148,136,0.08) 0%, rgba(13,148,136,0.02) 100%)",
            border: "1px solid rgba(13,148,136,0.2)",
          }}
        >
          <div className="w-14 h-14 rounded-2xl bg-teal-500/15 flex items-center justify-center mx-auto mb-4">
            <Camera className="w-7 h-7 text-teal-400/60" />
          </div>
          <p className="text-[15px] font-bold" style={{ color: "#D0D0E0" }}>
            Aucune photo n'a encore été ajoutée pour cet événement.
          </p>
          <p className="mt-2 max-w-sm mx-auto text-[13px]" style={{ color: "rgba(180,180,200,0.65)", lineHeight: 1.55 }}>
            {isParticipant
              ? "Sois le premier à partager tes souvenirs de cette édition."
              : "Les participants pourront bientôt partager leurs souvenirs ici."}
          </p>
          {isParticipant && onAddPhotos && (
            <Button
              onClick={onAddPhotos}
              className="mt-5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold gap-2 shadow-lg shadow-teal-500/25"
            >
              <Camera className="w-4 h-4" />
              Ajouter des photos
            </Button>
          )}
        </div>
      )}

      {/* ── Empty filtered ─────────────────────────────────────────────── */}
      {hasPhotos && photos.length === 0 && (
        <div className="py-10 text-center">
          <Filter className="w-7 h-7 mx-auto mb-2" style={{ color: "rgba(180,180,210,0.2)" }} />
          <p className="text-[13px] font-medium" style={{ color: "rgba(180,180,210,0.5)" }}>
            Aucune photo avec ce filtre.
          </p>
        </div>
      )}

      {/* ── Photo grid ─────────────────────────────────────────────────── */}
      {visible.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {visible.map((photo, i) => (
            <GalleryCard
              key={photo.id}
              photo={photo}
              index={i}
              onClick={onPhotoClick}
            />
          ))}
        </div>
      )}

      {/* ── Load more ──────────────────────────────────────────────────── */}
      {hasMore && (
        <button
          type="button"
          onClick={handleLoadMore}
          className={cn(
            "w-full py-2.5 rounded-xl text-[12px] font-semibold transition-all",
            "bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1]",
          )}
          style={{ color: "rgba(180,180,210,0.55)" }}
        >
          <ChevronDown className="w-3.5 h-3.5 inline -mt-px mr-1" />
          Voir plus ({remaining})
        </button>
      )}
    </div>
  );
}
