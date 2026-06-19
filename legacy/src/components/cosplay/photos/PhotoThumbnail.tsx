import React from "react";
import { CalendarDays, Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { thumbnailUrl } from "@/lib/imageUtils";

// ─── Minimal photo shape accepted by this component ─────────────────────────

export interface ThumbnailPhoto {
  id: string;
  photo_url: string;
  photo_type: string;
  caption?: string | null;
  is_group_photo?: boolean;
  /** Resolved event name (from join or manual field) */
  event_name?: string | null;
  event_name_manual?: string | null;
  /** Activity joined from event_schedule */
  activity?: { id: string; title: string; start_time?: string; category?: string } | null;
  /** Pre-computed accepted tag count (EnrichedPhoto) or raw tags array */
  acceptedTagCount?: number;
  tags?: { status: string }[];
}

// ─── Type badge config ──────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, string> = {
  toi: "bg-rose-500 text-white",
  original: "bg-blue-500 text-white",
  wip: "bg-orange-500 text-white",
  shooting: "bg-purple-500 text-white",
  detail: "bg-teal-500 text-white",
};

const TYPE_LABELS: Record<string, string> = {
  toi: "TOI",
  original: "ORI",
  wip: "WIP",
  shooting: "SHOOT",
  detail: "DET",
};

// ─── Props ──────────────────────────────────────────────────────────────────

export interface PhotoThumbnailProps {
  photo: ThumbnailPhoto;
  onClick?: () => void;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  /** Image thumbnail width for Supabase transform (default 300) */
  thumbWidth?: number;
  thumbHeight?: number;
  /** loading="eager" for above-the-fold images */
  loading?: "eager" | "lazy";
  /** Selection mode state */
  isSelectionMode?: boolean;
  isSelected?: boolean;
  /** aspect-ratio class override (default "aspect-square") */
  aspectClass?: string;
  /** Additional className on the root button */
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const PhotoThumbnail = React.memo(function PhotoThumbnail({
  photo,
  onClick,
  onTouchStart,
  onTouchEnd,
  thumbWidth = 300,
  thumbHeight,
  loading = "lazy",
  isSelectionMode = false,
  isSelected = false,
  aspectClass = "aspect-square",
  className,
}: PhotoThumbnailProps) {
  const typeStyle = TYPE_STYLES[photo.photo_type] ?? "bg-gray-500 text-white";
  const typeLabel = TYPE_LABELS[photo.photo_type] ?? photo.photo_type?.toUpperCase() ?? "PHOTO";

  const eventLabel = photo.event_name ?? photo.event_name_manual ?? null;

  const acceptedCount =
    photo.acceptedTagCount ??
    (photo.tags?.filter((t) => t.status === "accepted").length ?? 0);

  return (
    <button
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      aria-label={photo.caption ?? `Photo cosplay ${typeLabel}`}
      className={cn(
        "relative overflow-hidden rounded-xl bg-white/5 group/thumb transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0D]",
        aspectClass,
        isSelectionMode && isSelected && "ring-2 ring-[#C70039] ring-offset-2 ring-offset-[#0D0D0D]",
        isSelectionMode && !isSelected && "opacity-60",
        !isSelectionMode && "border border-transparent hover:border-[#C70039]/50",
        className,
      )}
    >
      {/* Image */}
      <img
        src={thumbnailUrl(photo.photo_url, thumbWidth, thumbHeight)}
        alt={photo.caption ?? "Photo cosplay"}
        className="w-full h-full object-cover transition-transform duration-200 group-hover/thumb:scale-[1.02]"
        loading={loading}
        decoding="async"
      />

      {/* A) Selection checkbox — z-20, overrides everything */}
      {isSelectionMode && (
        <div
          className={cn(
            "absolute top-1.5 left-1.5 z-20 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150",
            isSelected
              ? "bg-[#C70039] border-[#C70039] scale-100"
              : "bg-black/40 border-white/40 scale-90",
          )}
        >
          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
      )}

      {/* B) Type badge — top left (hidden when selection checkbox is shown) */}
      {!isSelectionMode && (
        <span
          className={cn(
            "absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider",
            typeStyle,
          )}
        >
          {typeLabel}
        </span>
      )}

      {/* C) Event badge — top right */}
      {eventLabel && (
        <span className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded bg-teal-500/80 backdrop-blur-sm text-[8px] font-medium text-white max-w-[90px] truncate flex items-center gap-0.5">
          <CalendarDays className="w-2.5 h-2.5 flex-shrink-0" />
          {eventLabel}
        </span>
      )}

      {/* D) Activity banner — bottom */}
      {photo.activity?.title && (
        <div className="absolute bottom-0 inset-x-0 z-10 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-[9px] text-white/80 font-medium truncate">
            {photo.activity.title}
          </p>
        </div>
      )}

      {/* E) Group badge — bottom left (only if no activity banner) */}
      {photo.is_group_photo && !photo.activity?.title && (
        <span className="absolute bottom-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-500/80 text-white flex items-center gap-0.5">
          <Users className="w-2.5 h-2.5" />
          Groupe
        </span>
      )}

      {/* F) Tag count — bottom right */}
      {acceptedCount > 0 && !photo.activity?.title && (
        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-bold rounded-full px-1.5 py-px">
          <Users className="w-2 h-2 inline mr-px" />
          {acceptedCount}
        </div>
      )}
    </button>
  );
});
