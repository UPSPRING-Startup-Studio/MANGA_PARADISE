import React, { useState, useMemo, useRef, useCallback, useEffect, type RefObject } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Camera, Plus, Trash2, Users, CheckSquare, X, Check, CalendarDays, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useCosplayPhotos, useDeleteCosplayPhoto } from "@/hooks/useCosplayPhotos";
import { PhotoTagPin } from "@/components/cosplay/photos/PhotoTagPin";
import { BatchActionBar } from "@/components/cosplay/photos/BatchActionBar";
import { CosplayPhotosByEvent } from "@/components/cosplay/photos/CosplayPhotosByEvent";
import { CosplayPhotosByPerson } from "@/components/cosplay/photos/CosplayPhotosByPerson";
import { StickyPhotoActions } from "@/components/cosplay/photos/StickyPhotoActions";
import { usePhotoSelection } from "@/hooks/usePhotoSelection";
import { usePhotosBatchActions } from "@/hooks/usePhotosBatchActions";
import { EventAssociationSheet } from "@/components/cosplay/photos/EventAssociationSheet";
import { useLinkshellContext } from "@/components/linkshell/LinkshellProvider";
import type { CosplayPhotoWithTags } from "@/types/cosplayPhotos";
import type { CosplayEventGroup } from "@/components/cosplay/photos/CosplayPhotosByEvent";
import type { CosplayPersonGroup } from "@/components/cosplay/photos/CosplayPhotosByPerson";

// ─── Variants pour la grille et les thumbnails ───────────────────────────────

const GRID_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const THUMB_VARIANTS = {
  normal: {
    hidden: { opacity: 0, scale: 0.95 },
    show:   { opacity: 1, scale: 1 },
  },
  reduced: {
    hidden: { opacity: 0 },
    show:   { opacity: 1 },
  },
};

// ─── Config des badges de type de photo ──────────────────────────────────────

const PHOTO_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  toi:      { label: "TOI",      className: "bg-red-500 text-white border-0" },
  original: { label: "ORIGINAL", className: "bg-blue-500 text-white border-0" },
  wip:      { label: "WIP",      className: "bg-orange-500 text-white border-0" },
  shooting: { label: "SHOOTING", className: "bg-purple-500 text-white border-0" },
  detail:   { label: "DÉTAIL",   className: "bg-slate-500 text-white border-0" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = "all" | "events" | "people";

interface EnrichedPhotoGridProps {
  cosplayId: string;
  isOwner: boolean;
  onPhotoClick?: (photo: CosplayPhotoWithTags, index: number) => void;
  onAddClick?: () => void;
}

// ─── Sous-composant : miniature d'une photo ───────────────────────────────────

interface EnrichedPhotoThumbnailProps {
  photo: CosplayPhotoWithTags;
  isOwner: boolean;
  onClick: () => void;
  onDeleteRequest: (photoId: string) => void;
  isSelectionMode?: boolean;
  selected?: boolean;
}

const EnrichedPhotoThumbnail = React.forwardRef<HTMLDivElement, EnrichedPhotoThumbnailProps>(
  ({ photo, isOwner, onClick, onDeleteRequest, isSelectionMode = false, selected = false }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const thumbVariants = prefersReducedMotion ? THUMB_VARIANTS.reduced : THUMB_VARIANTS.normal;
    const visibleTags = isOwner
      ? photo.tags.filter((t) => t.status !== "declined")
      : photo.tags.filter((t) => t.status === "accepted");
    const pinTags = visibleTags.slice(0, 4);
    const overflow = visibleTags.length - pinTags.length;
    const typeConfig = PHOTO_TYPE_CONFIG[photo.photo_type] ?? PHOTO_TYPE_CONFIG.shooting;
    const eventLabel = (photo.event_name ?? photo.event_name_manual) || null;
    const truncatedEvent = eventLabel && eventLabel.length > 12 ? eventLabel.slice(0, 12) + "…" : eventLabel;

    return (
      <motion.div
        ref={ref}
        role="button"
        tabIndex={0}
        variants={thumbVariants}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
        className={cn(
          "relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-white/5 group focus:outline-none cursor-pointer transition-all duration-150",
          isSelectionMode && selected && "ring-2 ring-[#C70039] ring-offset-2 ring-offset-[#0D0D0D]",
          isSelectionMode && !selected && "opacity-60",
        )}
      >
        {isSelectionMode && (
          <div className={cn(
            "absolute top-2 left-2 z-20 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150",
            selected ? "bg-[#C70039] border-[#C70039] scale-100" : "bg-black/40 border-white/40 scale-90"
          )}>
            {selected && <Check className="w-3.5 h-3.5 text-white" />}
          </div>
        )}
        <img
          src={photo.photo_url}
          alt={photo.caption ?? "Photo cosplay"}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <Badge className={cn("absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0 h-4 leading-none", typeConfig.className)}>
          {typeConfig.label}
        </Badge>
        {truncatedEvent && (
          <Badge className={cn(
            "absolute top-1.5 text-[9px] px-1.5 py-0 h-4 leading-none bg-teal-500/80 text-white border-0 max-w-[80px] truncate",
            isOwner ? "right-8" : "right-1.5"
          )}>
            {truncatedEvent}
          </Badge>
        )}
        {isOwner && !isSelectionMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteRequest(photo.id); }}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-black/50 text-white/60 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/80 hover:text-white transition-all duration-150 focus:outline-none"
            aria-label="Supprimer la photo"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
        {photo.is_group_photo && (
          <Badge className="absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0 h-4 leading-none bg-purple-500/80 text-white border-0 flex items-center gap-0.5 z-[1]">
            <Users className="w-2.5 h-2.5" />Groupe
          </Badge>
        )}
        {pinTags.map((tag) => (
          <PhotoTagPin
            key={tag.id}
            tag={{
              ...tag,
              profiles: tag.tagged_profile ? { username: tag.tagged_profile.username, avatar_url: tag.tagged_profile.avatar_url } : null,
              cosplay_plan: tag.cosplay_plan ?? null,
            }}
            isOwner={isOwner}
            size="sm"
          />
        ))}
        {overflow > 0 && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">+{overflow}</div>
        )}
      </motion.div>
    );
  }
);
EnrichedPhotoThumbnail.displayName = "EnrichedPhotoThumbnail";

// ─── Skeleton de chargement ───────────────────────────────────────────────────

function PhotoGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="w-full aspect-[4/5] rounded-xl" />
      ))}
    </div>
  );
}

const BATCH_PLACEHOLDER_PHOTO: CosplayPhotoWithTags = {
  id: "__batch__",
  cosplay_id: "",
  user_id: "",
  photo_url: "",
  photo_type: "shooting",
  is_group_photo: false,
  event_id: null,
  activity_id: null,
  event_name_manual: null,
  event_date_manual: null,
  event_location_manual: null,
  caption: null,
  exif_date: null,
  exif_gps_lat: null,
  exif_gps_lng: null,
  sort_order: 0,
  created_at: "",
  updated_at: "",
  tags: [],
  event_name: null,
};

// ─── Composant principal ──────────────────────────────────────────────────────

export function EnrichedPhotoGrid({
  cosplayId,
  isOwner,
  onPhotoClick,
  onAddClick,
}: EnrichedPhotoGridProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { data: photos = [], isLoading } = useCosplayPhotos(cosplayId);
  const deleteMutation = useDeleteCosplayPhoto();

  // ── Selection mode ──────────────────────────────────────────────────────
  const {
    selectedIds, selectedCount, isSelectionMode,
    toggleSelection, selectAll, deselectAll, enterSelectionMode, isSelected,
  } = usePhotoSelection();
  const { deleteMany, updateType, removeEvent, lastAction, undo, clearUndo, isUndoing } = usePhotosBatchActions();
  const [batchEventSheetOpen, setBatchEventSheetOpen] = useState(false);
  const [pendingTargetLabel, setPendingTargetLabel] = useState<string | null>(null);
  const { suppressFAB, restoreFAB } = useLinkshellContext();

  const handlePhotoClick = useCallback((photo: CosplayPhotoWithTags, index: number) => {
    if (isSelectionMode) {
      toggleSelection(photo.id);
    } else {
      onPhotoClick?.(photo, index);
    }
  }, [isSelectionMode, toggleSelection, onPhotoClick]);

  const handleBatchDelete = useCallback(() => {
    deleteMany.mutate(Array.from(selectedIds), { onSuccess: () => deselectAll() });
  }, [deleteMany, selectedIds, deselectAll]);

  const handleBatchChangeType = useCallback((type: string) => {
    updateType.mutate({ photoIds: Array.from(selectedIds), newType: type }, { onSuccess: () => deselectAll() });
  }, [updateType, selectedIds, deselectAll]);

  const handleBatchRemoveEvent = useCallback(() => {
    removeEvent.mutate(Array.from(selectedIds), { onSuccess: () => deselectAll() });
  }, [removeEvent, selectedIds, deselectAll]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSelectionMode) deselectAll();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelectionMode, deselectAll]);

  useEffect(() => {
    if (isSelectionMode) {
      suppressFAB();
    } else {
      restoreFAB();
    }
    return () => { restoreFAB(); };
  }, [isSelectionMode, suppressFAB, restoreFAB]);

  // ── Grouped data for sub-tabs ──────────────────────────────────────────

  const photosByEvent = useMemo(() => {
    const map = new Map<string, CosplayEventGroup>();
    for (const photo of photos) {
      const key = photo.event_id ?? (photo.event_name_manual ? `m:${photo.event_name_manual}` : "__no_event__");
      const existing = map.get(key);
      if (existing) {
        existing.photos.push(photo);
      } else {
        const evt = photo.event_id && (photo as any).events
          ? { id: (photo as any).events.id, title: (photo as any).events.title, date: (photo as any).events.date, location: (photo as any).events.location, cover_image: null }
          : { id: null, title: photo.event_name_manual ?? "Sans événement", date: photo.event_date_manual, location: null, cover_image: null };
        // Use event_name if available as title
        if (photo.event_name && !evt.id) evt.title = photo.event_name;
        else if (photo.event_name && evt.id) evt.title = photo.event_name;
        map.set(key, { key, event: evt, photos: [photo] });
      }
    }
    return map;
  }, [photos]);

  const photosByPerson = useMemo(() => {
    const map = new Map<string, CosplayPersonGroup>();
    for (const photo of photos) {
      for (const tag of photo.tags) {
        if (tag.status === "accepted" && tag.tagged_profile) {
          const uid = tag.tagged_profile.id;
          const existing = map.get(uid);
          if (existing) {
            if (!existing.photos.some((p) => p.id === photo.id)) {
              existing.photos.push(photo);
            }
            // Update linked cosplay if found
            if (!existing.linkedCosplay && tag.cosplay_plan) {
              existing.linkedCosplay = { character_name: tag.cosplay_plan.character_name, universe: tag.cosplay_plan.universe };
            }
          } else {
            map.set(uid, {
              profile: tag.tagged_profile,
              photos: [photo],
              linkedCosplay: tag.cosplay_plan ? { character_name: tag.cosplay_plan.character_name, universe: tag.cosplay_plan.universe } : null,
            });
          }
        }
      }
    }
    return map;
  }, [photos]);

  // Count real events (excluding "no event")
  const eventCount = photosByEvent.size - (photosByEvent.has("__no_event__") ? 1 : 0);
  const personCount = photosByPerson.size;

  // Reset selection when changing tabs
  const handleTabChange = useCallback((tab: string) => {
    if (isSelectionMode) deselectAll();
    setActiveTab(tab as ActiveTab);
  }, [isSelectionMode, deselectAll]);

  const headerActionsRef = useRef<HTMLDivElement>(null);

  if (isLoading) return <PhotoGridSkeleton />;

  return (
    <div className="space-y-3">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
          Photos du cosplay
        </p>
        {isOwner && (
          <div ref={headerActionsRef} className="flex items-center gap-1.5">
            {isSelectionMode ? (
              <Button variant="outline" size="sm" onClick={deselectAll} className="h-7 px-3 text-xs border-pink-500/30 text-pink-400 hover:text-pink-300 bg-pink-500/10">
                <X className="w-3 h-3 mr-1" />Annuler
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={enterSelectionMode} className="h-7 px-3 text-xs border-white/20 text-white/60 hover:text-white hover:bg-white/10">
                <CheckSquare className="w-3 h-3 mr-1" />Sélectionner
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onAddClick} className="h-7 px-3 text-xs border-white/20 text-white/70 hover:text-white hover:bg-white/10">
              <Plus className="w-3 h-3 mr-1" />Ajouter
            </Button>
          </div>
        )}
      </div>

      {/* ── Mini-stats ─────────────────────────────────────────────────────── */}
      {photos.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Image className="w-3.5 h-3.5" />
            <span className="font-medium text-white/70">{photos.length}</span> photos
          </div>
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <CalendarDays className="w-3.5 h-3.5 text-teal-400/60" />
            <span className="font-medium text-white/70">{eventCount}</span> événement{eventCount !== 1 ? "s" : ""}
          </div>
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Users className="w-3.5 h-3.5 text-pink-400/60" />
            <span className="font-medium text-white/70">{personCount}</span> cosplayeur{personCount !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* ── Lien vers page globale ─────────────────────────────────────────── */}
      <Link
        to="/espace-membre/mes-photos"
        className="flex items-center gap-1.5 text-xs text-teal-400/70 hover:text-teal-300 transition-colors"
      >
        <Camera className="w-3.5 h-3.5" />
        Voir toutes mes photos cosplay →
      </Link>

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {photos.length === 0 ? (
        <Card className="bg-white/5 border-white/10 p-8 flex flex-col items-center justify-center gap-3 text-center">
          <Camera className="w-10 h-10 text-white/20" />
          <p className="text-sm text-white/50">Aucune photo pour ce cosplay.</p>
          {isOwner && (
            <Button variant="outline" size="sm" onClick={onAddClick} className="border-white/20 text-white/60 hover:text-white hover:bg-white/10 mt-1">
              <Plus className="w-3.5 h-3.5 mr-1.5" />Ajouter des photos
            </Button>
          )}
        </Card>
      ) : (
        <>
          {/* ── Tabs navigation ──────────────────────────────────────────── */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 h-auto">
              <TabsTrigger
                value="all"
                className={cn(
                  "flex-1 text-xs py-2 rounded-lg gap-1.5 transition-all duration-200",
                  "data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-none",
                  "text-white/40 hover:text-white/60"
                )}
              >
                <Image className="w-3.5 h-3.5" />
                Toutes
              </TabsTrigger>
              <TabsTrigger
                value="events"
                className={cn(
                  "flex-1 text-xs py-2 rounded-lg gap-1.5 transition-all duration-200",
                  "data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-300 data-[state=active]:shadow-none",
                  "text-white/40 hover:text-white/60"
                )}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Événements
                {eventCount > 0 && (
                  <span className={cn("text-[9px] px-1.5 rounded-full", activeTab === "events" ? "bg-white/10 text-white/70" : "bg-white/[0.06] text-white/30")}>
                    {eventCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="people"
                className={cn(
                  "flex-1 text-xs py-2 rounded-lg gap-1.5 transition-all duration-200",
                  "data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300 data-[state=active]:shadow-none",
                  "text-white/40 hover:text-white/60"
                )}
              >
                <Users className="w-3.5 h-3.5" />
                Personnes
                {personCount > 0 && (
                  <span className={cn("text-[9px] px-1.5 rounded-full", activeTab === "people" ? "bg-white/10 text-white/70" : "bg-white/[0.06] text-white/30")}>
                    {personCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* ── Tab content ──────────────────────────────────────────────── */}
          <div key={activeTab}>
            {activeTab === "all" && (
              <motion.div
                className="grid grid-cols-2 gap-2"
                variants={GRID_VARIANTS}
                initial="hidden"
                animate="show"
              >
                <AnimatePresence mode="popLayout">
                  {photos.map((photo) => (
                    <EnrichedPhotoThumbnail
                      key={photo.id}
                      photo={photo}
                      isOwner={isOwner}
                      isSelectionMode={isSelectionMode}
                      selected={isSelected(photo.id)}
                      onDeleteRequest={isSelectionMode ? () => {} : setPendingDeleteId}
                      onClick={() => {
                        const globalIndex = photos.indexOf(photo);
                        handlePhotoClick(photo, globalIndex);
                      }}
                    />
                  ))}
                </AnimatePresence>
                {isOwner && (
                  <motion.button
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                    onClick={onAddClick}
                    className="relative w-full aspect-[4/5] rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/30 hover:text-white/60 hover:border-white/40 transition-all duration-200 focus:outline-none"
                  >
                    <Plus className="w-7 h-7" />
                  </motion.button>
                )}
              </motion.div>
            )}

            {activeTab === "events" && (
              <CosplayPhotosByEvent
                photosByEvent={photosByEvent}
                onPhotoClick={(photo, index) => {
                  const globalIndex = photos.indexOf(photo);
                  handlePhotoClick(photo, globalIndex >= 0 ? globalIndex : index);
                }}
              />
            )}

            {activeTab === "people" && (
              <CosplayPhotosByPerson
                photosByPerson={photosByPerson}
                onPhotoClick={(photo, index) => {
                  const globalIndex = photos.indexOf(photo);
                  handlePhotoClick(photo, globalIndex >= 0 ? globalIndex : index);
                }}
              />
            )}
          </div>
        </>
      )}

      {/* ── Batch action bar ──────────────────────────────────────────────────── */}
      {isOwner && (
        <BatchActionBar
          selectedCount={selectedCount}
          onDelete={handleBatchDelete}
          onChangeType={handleBatchChangeType}
          onAssociateEvent={() => setBatchEventSheetOpen(true)}
          onRemoveEvent={handleBatchRemoveEvent}
          onSelectAll={() => selectAll(photos.map((p) => p.id))}
          onDeselectAll={deselectAll}
          lastAction={lastAction}
          onUndo={undo}
          isUndoing={isUndoing}
          targetLabel={pendingTargetLabel}
        />
      )}

      {batchEventSheetOpen && selectedCount > 0 && (
        <EventAssociationSheet
          photo={BATCH_PLACEHOLDER_PHOTO}
          open
          onOpenChange={(open) => { if (!open) { setBatchEventSheetOpen(false); setPendingTargetLabel(null); } }}
          onAssociated={() => { setBatchEventSheetOpen(false); setPendingTargetLabel(null); deselectAll(); }}
          batchPhotoIds={Array.from(selectedIds)}
          onTargetChange={setPendingTargetLabel}
        />
      )}

      {/* ── Confirmation de suppression ──────────────────────────────────────── */}
      <AlertDialog open={!!pendingDeleteId} onOpenChange={(o) => { if (!o) setPendingDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette photo ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La photo sera définitivement supprimée de ce cosplay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (pendingDeleteId) {
                  deleteMutation.mutate({ photoId: pendingDeleteId, cosplayId });
                  setPendingDeleteId(null);
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Sticky photo actions (visible on scroll) ──────────────────────── */}
      <StickyPhotoActions
        headerRef={headerActionsRef}
        onSelectClick={enterSelectionMode}
        onAddClick={() => onAddClick?.()}
        isOwner={isOwner}
        isSelectionMode={isSelectionMode}
      />
    </div>
  );
}

export default EnrichedPhotoGrid;
