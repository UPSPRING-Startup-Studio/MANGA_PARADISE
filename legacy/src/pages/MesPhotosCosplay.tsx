import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Camera,
  Image,
  CalendarDays,
  Users,
  Search,
  Sparkles,
  ChevronRight,
  CheckSquare,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLinkshellContext } from "@/components/linkshell/LinkshellProvider";
import { useDebounce } from "@/hooks/useDebounce";
import { useAllCosplayPhotos } from "@/hooks/useAllCosplayPhotos";
import type { EnrichedPhoto } from "@/hooks/useAllCosplayPhotos";
import { PhotoViewer } from "@/components/cosplay/photos/PhotoViewer";
import type { PhotoViewerAction } from "@/components/cosplay/photos/PhotoViewer";
import { PhotosByEventView } from "@/components/cosplay/photos/PhotosByEventView";
import { PhotosByCosplayView } from "@/components/cosplay/photos/PhotosByCosplayView";
import { PhotosByPersonView } from "@/components/cosplay/photos/PhotosByPersonView";
import { CaptionEditor } from "@/components/cosplay/photos/CaptionEditor";
import { EventAssociationSheet } from "@/components/cosplay/photos/EventAssociationSheet";
import { PhotoShareSheet } from "@/components/cosplay/photos/PhotoShareSheet";
import { BatchActionBar } from "@/components/cosplay/photos/BatchActionBar";
import { StickyPhotoActions } from "@/components/cosplay/photos/StickyPhotoActions";
import { usePhotoSelection } from "@/hooks/usePhotoSelection";
import { usePhotosBatchActions } from "@/hooks/usePhotosBatchActions";
import type { CosplayPhotoWithTags, PhotoTagWithProfile } from "@/types/cosplayPhotos";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

// ─── Shirt icon (Lucide doesn't export Shirt) ───────────────────────────────

function ShirtIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </svg>
  );
}

// ─── Adapter: EnrichedPhoto → CosplayPhotoWithTags for PhotoViewer ──────────

function toViewerPhoto(p: EnrichedPhoto): CosplayPhotoWithTags {
  const tags: PhotoTagWithProfile[] = p.tags.map((t) => ({
    id: t.id,
    photo_id: p.id,
    tagger_user_id: p.user_id,
    tagged_user_id: t.tagged_user_id,
    tagged_name: t.tagged_name,
    tagged_character: t.tagged_character,
    tagged_social_link: t.tagged_social_link,
    linked_cosplay_id: t.linked_cosplay_id,
    pin_x: t.pin_x,
    pin_y: t.pin_y,
    status: t.status,
    notified_at: null,
    accepted_at: null,
    created_at: t.created_at,
    tagged_profile: t.tagged_profile
      ? { ...t.tagged_profile }
      : null,
    cosplay_plan: t.cosplay_plan ?? null,
  }));

  return {
    id: p.id,
    cosplay_id: p.cosplay_id,
    user_id: p.user_id,
    photo_url: p.photo_url,
    photo_type: p.photo_type,
    is_group_photo: p.is_group_photo,
    event_id: p.event_id,
    activity_id: p.activity_id,
    event_name_manual: p.event_name_manual,
    event_date_manual: p.event_date_manual,
    event_location_manual: null,
    caption: p.caption,
    exif_date: null,
    exif_gps_lat: null,
    exif_gps_lng: null,
    sort_order: 0,
    created_at: p.created_at,
    updated_at: p.created_at,
    tags,
    event_name: p.event_name,
  };
}

// ─── Placeholder photo for batch EventAssociationSheet ──────────────────────

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

// ─── Noise SVG for texture overlay ──────────────────────────────────────────

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

// ─── Stat card config ───────────────────────────────────────────────────────

const STAT_STYLES: Record<string, { gradient: string; border: string; glow: string; shadow: string }> = {
  photos: {
    gradient: "bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-violet-500/10",
    border: "border-indigo-400/10 hover:border-indigo-400/30",
    glow: "rgba(99, 102, 241, 0.3)",
    shadow: "group-hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]",
  },
  events: {
    gradient: "bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-emerald-500/10",
    border: "border-teal-400/10 hover:border-teal-400/30",
    glow: "rgba(20, 184, 166, 0.3)",
    shadow: "group-hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]",
  },
  cosplays: {
    gradient: "bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-fuchsia-500/10",
    border: "border-pink-400/10 hover:border-pink-400/30",
    glow: "rgba(236, 72, 153, 0.3)",
    shadow: "group-hover:shadow-[0_0_20px_rgba(236,72,153,0.15)]",
  },
  cosplayeurs: {
    gradient: "bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10",
    border: "border-amber-400/10 hover:border-amber-400/30",
    glow: "rgba(245, 158, 11, 0.3)",
    shadow: "group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  },
};

// ─── Stat card ──────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, variant }: { icon: React.ReactNode; value: number; label: string; variant: keyof typeof STAT_STYLES }) {
  const s = STAT_STYLES[variant];
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "group relative rounded-2xl p-3 text-center overflow-hidden border transition-all duration-300",
        s.gradient, s.border, s.shadow
      )}
    >
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay"
        style={{ backgroundImage: NOISE_SVG, backgroundSize: "128px 128px" }}
      />
      <div className="relative z-10">
        <div className="flex justify-center mb-1.5 text-white/40">{icon}</div>
        <p
          className="text-4xl font-extrabold text-white"
          style={{ textShadow: `0 0 20px ${s.glow}` }}
        >
          {value}
        </p>
        <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Loading skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 rounded-lg" />
      <div className="grid grid-cols-3 gap-1">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-md" />
        ))}
      </div>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative mb-6">
        <Camera className="w-16 h-16 text-white/10" />
        <Sparkles className="w-6 h-6 text-yellow-400/50 absolute -top-1 -right-1" />
      </div>
      <p className="text-white/50 text-sm mb-1">Tu n'as pas encore de photos cosplay.</p>
      <p className="text-white/30 text-xs mb-6">
        Importe des photos depuis tes projets cosplay !
      </p>
      <Button
        onClick={() => navigate("/espace-membre/vestiaire")}
        className="bg-gradient-to-r from-[#C70039] to-[#FF5733] text-white font-semibold"
      >
        Aller au vestiaire
      </Button>
    </div>
  );
}

// ─── Page principale ────────────────────────────────────────────────────────

export default function MesPhotosCosplay() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const headerActionsRef = useRef<HTMLDivElement>(null);
  const { suppressFAB, restoreFAB } = useLinkshellContext();

  const {
    photos,
    photosByEvent,
    photosByCosplay,
    photosByPerson,
    stats,
    isLoading,
  } = useAllCosplayPhotos(user?.id);

  const [activeTab, setActiveTab] = useState<string>("events");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // ── Selection mode ──────────────────────────────────────────────────────
  const {
    selectedIds, selectedCount, isSelectionMode,
    toggleSelection, selectAll, deselectAll, enterSelectionMode, isSelected,
  } = usePhotoSelection();
  const { deleteMany, updateType, removeEvent, lastAction, undo, clearUndo, isUndoing } = usePhotosBatchActions();

  const handleBatchDelete = useCallback(() => {
    deleteMany.mutate(Array.from(selectedIds), { onSuccess: () => deselectAll() });
  }, [deleteMany, selectedIds, deselectAll]);

  const handleBatchChangeType = useCallback((type: string) => {
    updateType.mutate({ photoIds: Array.from(selectedIds), newType: type }, { onSuccess: () => deselectAll() });
  }, [updateType, selectedIds, deselectAll]);

  const handleBatchRemoveEvent = useCallback(() => {
    removeEvent.mutate(Array.from(selectedIds), { onSuccess: () => deselectAll() });
  }, [removeEvent, selectedIds, deselectAll]);

  // "Select all" picks all photos visible in the current tab
  const handleSelectAll = useCallback(() => {
    selectAll(photos.map((p) => p.id));
  }, [selectAll, photos]);

  // Exit selection mode when switching tabs
  const handleTabChange = useCallback((tab: string) => {
    if (isSelectionMode) deselectAll();
    setActiveTab(tab);
  }, [isSelectionMode, deselectAll]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSelectionMode) deselectAll();
      if (e.key === "a" && (e.ctrlKey || e.metaKey) && isSelectionMode) {
        e.preventDefault();
        handleSelectAll();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelectionMode, deselectAll, handleSelectAll]);

  // ── Masquer le FAB Linkshell pendant la sélection multiple ──────────────
  useEffect(() => {
    if (isSelectionMode) {
      suppressFAB();
    } else {
      restoreFAB();
    }
    return () => { restoreFAB(); };
  }, [isSelectionMode, suppressFAB, restoreFAB]);

  // ── Deep links: ?event=X, ?cosplay=X, ?person=X ─────────────────────────
  useEffect(() => {
    const eventParam = searchParams.get("event");
    const cosplayParam = searchParams.get("cosplay");
    const personParam = searchParams.get("person");

    if (eventParam) {
      setActiveTab("events");
    } else if (cosplayParam) {
      setActiveTab("cosplays");
    } else if (personParam) {
      setActiveTab("people");
    }
  }, [searchParams]);

  // PhotoViewer state
  const [viewerState, setViewerState] = useState<{
    photos: EnrichedPhoto[];
    index: number;
  } | null>(null);

  // Sheets state (mounted outside PhotoViewer portal)
  const [sheetAction, setSheetAction] = useState<{
    type: PhotoViewerAction;
    photo: CosplayPhotoWithTags;
  } | null>(null);

  // Batch event association sheet
  const [batchEventSheetOpen, setBatchEventSheetOpen] = useState(false);

  // Real-time target label from the event association drawer
  const [pendingTargetLabel, setPendingTargetLabel] = useState<string | null>(null);

  const handleOpenViewer = useCallback((groupPhotos: EnrichedPhoto[], index: number) => {
    setViewerState({ photos: groupPhotos, index });
  }, []);

  const handleViewerAction = useCallback((action: PhotoViewerAction, photo: CosplayPhotoWithTags) => {
    setSheetAction({ type: action, photo });
  }, []);

  const closeSheet = useCallback(() => {
    setSheetAction(null);
  }, []);

  // Convert viewer photos for PhotoViewer
  const viewerPhotos = useMemo(
    () => viewerState?.photos.map(toViewerPhoto) ?? [],
    [viewerState?.photos]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D]">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
          <LoadingSkeleton />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <Navigation />

      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        {/* ── Breadcrumb ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 text-xs text-white/30 mb-4">
          <button onClick={() => navigate("/espace-membre")} className="hover:text-white/60 transition-colors">
            Profil
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/60">Mes Photos Cosplay</span>
        </div>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Camera className="w-5 h-5 text-white/60" />
            <h1 className="text-lg font-bold text-white uppercase tracking-wider flex-1">
              Mes Photos Cosplay
            </h1>
            {photos.length > 0 && (
              <div ref={headerActionsRef}>
                {isSelectionMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAll}
                    className="gap-1.5 border-pink-500/30 text-pink-400 hover:text-pink-300 bg-pink-500/10 h-8"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={enterSelectionMode}
                    className="gap-1.5 border-white/10 text-white/60 hover:text-white h-8"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Sélectionner
                  </Button>
                )}
              </div>
            )}
          </div>
          <p className="text-white/40 text-sm">
            Toutes tes photos, tous tes souvenirs, un seul endroit.
          </p>
        </div>

        {photos.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ── Stats bar ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
              {([
                { icon: <Image className="w-4 h-4" />, value: stats.totalPhotos, label: "photos", variant: "photos" as const },
                { icon: <CalendarDays className="w-4 h-4" />, value: stats.totalEvents, label: "events", variant: "events" as const },
                { icon: <ShirtIcon className="w-4 h-4" />, value: stats.totalCosplays, label: "cosplays", variant: "cosplays" as const },
                { icon: <Users className="w-4 h-4" />, value: stats.totalPeopleTagged, label: "cosplayeurs", variant: "cosplayeurs" as const },
              ]).map((card, i) => (
                <motion.div
                  key={card.variant}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
                >
                  <StatCard {...card} />
                </motion.div>
              ))}
            </div>

            {/* ── Search bar ─────────────────────────────────────────────── */}
            <div className="relative mb-4 group/search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/search:text-white/50 transition-colors duration-300 pointer-events-none" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par événement, cosplay, ou cosplayeur..."
                className="pl-9 bg-white/[0.03] backdrop-blur-sm border-white/[0.06] text-white placeholder:text-white/25 h-10 rounded-xl transition-all duration-300 focus-visible:ring-0 focus-visible:border-white/[0.15] focus-visible:shadow-[0_0_0_1px_rgba(0,212,255,0.1)]"
              />
            </div>

            {/* ── Tabs ───────────────────────────────────────────────────── */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 h-auto relative">
                {([
                  {
                    value: "events",
                    icon: <CalendarDays className="w-3.5 h-3.5" />,
                    label: "Événements",
                    count: photosByEvent.size,
                    active: "from-teal-500/20 to-cyan-500/20 text-teal-300 border-teal-400/20",
                    shimmer: "from-teal-400 via-cyan-300 to-teal-400",
                  },
                  {
                    value: "cosplays",
                    icon: <ShirtIcon className="w-3.5 h-3.5" />,
                    label: "Cosplays",
                    count: photosByCosplay.size,
                    active: "from-pink-500/20 to-rose-500/20 text-pink-300 border-pink-400/20",
                    shimmer: "from-pink-400 via-cyan-300 to-pink-400",
                  },
                  {
                    value: "people",
                    icon: <Users className="w-3.5 h-3.5" />,
                    label: "Personnes",
                    count: photosByPerson.size,
                    active: "from-violet-500/20 to-purple-500/20 text-purple-300 border-violet-400/20",
                    shimmer: "from-violet-400 via-cyan-300 to-violet-400",
                  },
                ] as const).map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "flex-1 text-xs py-2 rounded-lg gap-1.5 relative overflow-hidden transition-all duration-200",
                      "text-white/40 hover:text-white/60",
                      activeTab === tab.value
                        ? `bg-gradient-to-r ${tab.active} shadow-none border`
                        : "border border-transparent"
                    )}
                  >
                    {tab.icon}
                    <span className="hidden xs:inline">{tab.label}</span>
                    <span className="inline xs:hidden">{tab.label.slice(0, 4)}.</span>
                    <span className={cn(
                      "inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ml-0.5",
                      activeTab === tab.value
                        ? "bg-white/10 text-white/70"
                        : "bg-white/[0.06] text-white/30"
                    )}>
                      {tab.count}
                    </span>
                    {/* Shimmer underline for active tab */}
                    {activeTab === tab.value && (
                      <motion.div
                        layoutId="tab-shimmer"
                        className={cn(
                          "absolute bottom-0 left-2 right-2 h-[3px] rounded-full",
                          `bg-gradient-to-r ${tab.shimmer}`
                        )}
                        style={{
                          backgroundSize: "200% 100%",
                          animation: "shimmer 3s linear infinite",
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-4" key={activeTab}>
                {activeTab === "events" && (
                  <PhotosByEventView
                    photosByEvent={photosByEvent}
                    searchTerm={debouncedSearch}
                    onOpenViewer={handleOpenViewer}
                    highlightEventId={searchParams.get("event") ?? undefined}
                    isSelectionMode={isSelectionMode}
                    isSelected={isSelected}
                    toggleSelection={toggleSelection}
                    enterSelectionMode={enterSelectionMode}
                  />
                )}
                {activeTab === "cosplays" && (
                  <PhotosByCosplayView
                    photosByCosplay={photosByCosplay}
                    searchTerm={debouncedSearch}
                    onOpenViewer={handleOpenViewer}
                    isSelectionMode={isSelectionMode}
                    isSelected={isSelected}
                    toggleSelection={toggleSelection}
                    enterSelectionMode={enterSelectionMode}
                  />
                )}
                {activeTab === "people" && (
                  <PhotosByPersonView
                    photosByPerson={photosByPerson}
                    searchTerm={debouncedSearch}
                    onOpenViewer={handleOpenViewer}
                    isSelectionMode={isSelectionMode}
                    isSelected={isSelected}
                    toggleSelection={toggleSelection}
                    enterSelectionMode={enterSelectionMode}
                  />
                )}
              </div>
            </Tabs>
          </>
        )}
      </div>

      <Footer />

      {/* ── Batch action bar ────────────────────────────────────────────── */}
      <BatchActionBar
        selectedCount={selectedCount}
        onDelete={handleBatchDelete}
        onChangeType={handleBatchChangeType}
        onAssociateEvent={() => setBatchEventSheetOpen(true)}
        onRemoveEvent={handleBatchRemoveEvent}
        onSelectAll={handleSelectAll}
        onDeselectAll={deselectAll}
        lastAction={lastAction}
        onUndo={undo}
        isUndoing={isUndoing}
        targetLabel={pendingTargetLabel}
      />

      {/* ── Sticky photo actions (visible on scroll) ───────────────────── */}
      <StickyPhotoActions
        headerRef={headerActionsRef}
        onSelectClick={enterSelectionMode}
        onAddClick={() => navigate("/espace-membre/vestiaire")}
        isOwner={true}
        isSelectionMode={isSelectionMode}
      />

      {/* ── PhotoViewer (portal to body) ─────────────────────────────────── */}
      {viewerState && (
        <PhotoViewer
          photos={viewerPhotos}
          initialIndex={viewerState.index}
          isOwner={true}
          onClose={() => setViewerState(null)}
          onAction={handleViewerAction}
        />
      )}

      {/* ── Sheets (Radix portals to body at z-200, above viewer z-100) ── */}
      {sheetAction?.type === "caption" && (
        <CaptionEditor
          photo={sheetAction.photo}
          open
          onOpenChange={(open) => { if (!open) closeSheet(); }}
          onSaved={closeSheet}
        />
      )}
      {sheetAction?.type === "event" && (
        <EventAssociationSheet
          photo={sheetAction.photo}
          open
          onOpenChange={(open) => { if (!open) closeSheet(); }}
          onAssociated={closeSheet}
        />
      )}
      {sheetAction?.type === "share" && (
        <PhotoShareSheet
          photo={sheetAction.photo}
          open
          onOpenChange={(open) => { if (!open) closeSheet(); }}
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
    </div>
  );
}
