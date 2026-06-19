import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  X,
  UserPlus,
  CalendarDays,
  MessageSquare,
  Share2,
  Calendar,
  Check,
  Target,
  Users,
  Hand,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { CosplayPhotoWithTags } from "@/types/cosplayPhotos";
import { TaggingOverlay } from "@/components/cosplay/photos/TaggingOverlay";
import { SelfTagOverlay } from "@/components/cosplay/photos/SelfTagOverlay";
import { PhotoTagPin } from "@/components/cosplay/photos/PhotoTagPin";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PhotoViewerAction = "event" | "caption" | "share";
type InternalMode = null | "tagging" | "self-tag";
type Direction = "left" | "right";

interface PhotoViewerProps {
  photos: CosplayPhotoWithTags[];
  initialIndex: number;
  isOwner: boolean;
  onClose: () => void;
  /** Callback when user clicks a toolbar action that opens a Radix Sheet. The parent mounts the Sheet. */
  onAction?: (action: PhotoViewerAction, photo: CosplayPhotoWithTags) => void;
}

// ─── Helper : rendu de la légende avec @mentions ──────────────────────────────

function renderCaption(caption: string) {
  return caption.split(/(@\w+)/g).map((part, i) =>
    /^@\w+$/.test(part) ? (
      <span key={i} className="text-cyan-400">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}


// ─── Sous-composant : bouton d'action bottom bar ─────────────────────────────

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badgeCount?: number;
  onClick: () => void;
}

function ActionButton({ icon, label, active = false, badgeCount, onClick }: ActionButtonProps) {
  return (
    <button
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        (e.currentTarget as HTMLElement).blur();
        onClick();
      }}
      className="flex flex-col items-center gap-1.5 focus:outline-none"
    >
      <div className="relative">
        <div
          className={cn(
            "w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center border active:scale-95 transition-transform",
            active
              ? "bg-green-500/20 border-green-400/50"
              : "bg-white/10 border-white/20"
          )}
        >
          <span className={cn(active ? "text-green-400" : "text-white")}>
            {icon}
          </span>
        </div>
        {typeof badgeCount === "number" && badgeCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold leading-none">{badgeCount}</span>
          </div>
        )}
        {active && typeof badgeCount !== "number" && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <span className="text-[11px] text-white/70 font-medium leading-none">{label}</span>
    </button>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function PhotoViewer({ photos, initialIndex, isOwner, onClose, onAction }: PhotoViewerProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection]       = useState<Direction>("left");
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [internalMode, setInternalMode] = useState<InternalMode>(null);
  const prefersReducedMotion = useReducedMotion();

  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const imgRef       = useRef<HTMLImageElement>(null);
  const photo = photos[currentIndex];

  // ── Group photo logic ───────────────────────────────────────────────────
  const isGroupPhoto = !!photo?.is_group_photo;
  const userAlreadyTagged = isGroupPhoto && user
    ? photo.tags.some((t) => t.tagged_user_id === user.id && t.status !== "declined")
    : false;

  // ── Auto-hide toolbar ────────────────────────────────────────────────────

  const resetHideTimer = useCallback(() => {
    setToolbarVisible(true);
    clearTimeout(hideTimerRef.current);
    if (internalMode !== "tagging") {
      hideTimerRef.current = setTimeout(() => setToolbarVisible(false), 4000);
    }
  }, [internalMode]);

  useEffect(() => {
    if (internalMode === "tagging") {
      clearTimeout(hideTimerRef.current);
      setToolbarVisible(true);
    } else {
      resetHideTimer();
    }
    return () => clearTimeout(hideTimerRef.current);
  }, [currentIndex, internalMode, resetHideTimer]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const goTo = useCallback(
    (index: number, dir: Direction) => {
      if (index < 0 || index >= photos.length) return;
      setDirection(dir);
      setCurrentIndex(index);
      resetHideTimer();
    },
    [photos.length, resetHideTimer]
  );

  const goPrev = useCallback(() => goTo(currentIndex - 1, "right"), [currentIndex, goTo]);
  const goNext = useCallback(() => goTo(currentIndex + 1, "left"),  [currentIndex, goTo]);

  // ── Clavier ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape")      { onClose(); return; }
      if (e.key === "ArrowLeft")   goPrev();
      if (e.key === "ArrowRight")  goNext();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, goPrev, goNext]);

  // ── Scroll lock du body ───────────────────────────────────────────────────

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── Dots d'état pour les boutons toolbar ─────────────────────────────────

  const hasEvent   = !!photo?.event_id || !!photo?.event_name_manual;
  const hasCaption = !!photo?.caption;
  const hasTags    = (photo?.tags?.length ?? 0) > 0;

  const eventLabel = photo?.event_name ?? photo?.event_name_manual ?? null;
  const eventDate  = photo?.event_date_manual ?? null;

  if (!photo) return null;

  // ─────────────────────────────────────────────────────────────────────────

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black select-none">
      {/* ── Entrée animée du viewer ──────────────────────────────────────── */}
      <motion.div
        className="w-full h-full flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* ── Bouton Fermer — haut gauche ─────────────────────────────── */}
        <motion.div
          animate={{ opacity: toolbarVisible ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-4 left-4 z-20 pointer-events-none"
        >
          <button
            aria-label="Fermer"
            onClick={onClose}
            className="pointer-events-auto w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>

        {/* ── Bandeau tagging — centre haut ──────────────────────────────── */}
        <AnimatePresence>
          {internalMode === "tagging" && (
            <motion.div
              key="tagging-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/70 backdrop-blur-md rounded-full px-5 py-2.5 flex items-center gap-2 pointer-events-none"
            >
              <Target className="w-[18px] h-[18px] text-pink-400 animate-pulse" />
              <span className="text-sm text-white/90 font-medium">Touche la photo pour taguer</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Badge photo de groupe — haut droite ───────────────────── */}
        {isGroupPhoto && internalMode === null && (
          <motion.div
            animate={{ opacity: toolbarVisible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 right-4 z-20 pointer-events-none"
          >
            <Badge className="bg-purple-500/80 backdrop-blur-sm text-white border-0 flex items-center gap-1.5 px-3 py-1.5">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs font-medium">
                {userAlreadyTagged ? "Photo de groupe" : "Photo de groupe · Tague-toi !"}
              </span>
            </Badge>
          </motion.div>
        )}

        {/* ── CTA auto-tag pour les photos de groupe */}
        {isGroupPhoto && !isOwner && !userAlreadyTagged && internalMode === null && (
          <motion.div
            animate={{ opacity: toolbarVisible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-[140px] inset-x-0 z-20 flex justify-center pointer-events-none"
          >
            <button
              onClick={(e) => { (e.currentTarget as HTMLElement).blur(); setInternalMode("self-tag"); }}
              className="pointer-events-auto flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold px-5 py-2.5 rounded-full shadow-lg active:scale-95 transition-all"
            >
              <Hand className="w-4 h-4" />
              Je suis sur cette photo !
            </button>
          </motion.div>
        )}

        {/* ── Barre d'actions — bas de l'écran (style Instagram) ──────── */}
        <motion.div
          animate={{ opacity: toolbarVisible ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 inset-x-0 z-20 pointer-events-none"
        >
          <div className="h-[120px] bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="absolute bottom-6 inset-x-0 px-4 pointer-events-auto"
          >
            <div className="flex justify-around">
              <ActionButton
                icon={<UserPlus className="w-[22px] h-[22px]" />}
                label="Taguer"
                active={hasTags}
                badgeCount={photo.tags?.length || 0}
                onClick={() => setInternalMode("tagging")}
              />
              <ActionButton
                icon={<CalendarDays className="w-[22px] h-[22px]" />}
                label="Événement"
                active={hasEvent}
                onClick={() => onAction?.("event", photo)}
              />
              <ActionButton
                icon={<MessageSquare className="w-[22px] h-[22px]" />}
                label="Légende"
                active={hasCaption}
                onClick={() => onAction?.("caption", photo)}
              />
              <ActionButton
                icon={<Share2 className="w-[22px] h-[22px]" />}
                label="Partager"
                onClick={() => onAction?.("share", photo)}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* ── Zone photo draggable ─────────────────────────────────────────── */}
        <div
          className="flex-1 relative overflow-hidden flex items-center justify-center"
          onClick={resetHideTimer}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={photo.id}
              custom={direction}
              drag={prefersReducedMotion ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_, info) => {
                if (info.velocity.x > 500 || info.offset.x > 100)  goPrev();
                if (info.velocity.x < -500 || info.offset.x < -100) goNext();
              }}
              initial={prefersReducedMotion
                ? { opacity: 0 }
                : { x: direction === "left" ? 300 : -300, opacity: 0 }}
              animate={prefersReducedMotion
                ? { opacity: 1 }
                : { x: 0, opacity: 1 }}
              exit={prefersReducedMotion
                ? { opacity: 0 }
                : { x: direction === "left" ? -300 : 300, opacity: 0 }}
              transition={prefersReducedMotion
                ? { duration: 0.15 }
                : { type: "spring", stiffness: 300, damping: 35 }}
              className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
            >
              {/* Image */}
              <img
                ref={imgRef}
                src={photo.photo_url}
                alt={photo.caption ?? "Photo cosplay"}
                className="max-w-full max-h-full object-contain pointer-events-none"
                draggable={false}
              />

              {/* Pins des taggés — permanents, dimmed en mode tagging */}
              <div className={cn("absolute inset-0 pointer-events-none", internalMode === "tagging" && "opacity-60")}>
                {photo.tags.map((tag) => (
                  <div key={tag.id} className="pointer-events-auto">
                    <PhotoTagPin
                      tag={{
                        ...tag,
                        profiles: tag.tagged_profile
                          ? { username: tag.tagged_profile.username, avatar_url: tag.tagged_profile.avatar_url }
                          : null,
                        cosplay_plan: tag.cosplay_plan ?? null,
                      }}
                      isOwner={isOwner}
                      size="md"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Overlays fixes (hors AnimatePresence pour ne pas animer) ─── */}

          {/* Badge événement — bas gauche */}
          {eventLabel && (
            <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
              <Badge className="bg-teal-500/80 backdrop-blur-sm text-white border-0 flex items-center gap-1.5 px-3 py-1.5">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="text-xs font-medium">{eventLabel}</span>
                {eventDate && (
                  <span className="text-[10px] text-teal-100/80">
                    · {new Date(eventDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                )}
              </Badge>
            </div>
          )}

          {/* Légende — bas de l'image */}
          {photo.caption && (
            <div className="absolute bottom-0 inset-x-0 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
              <p className="text-white text-sm leading-relaxed text-center">
                {renderCaption(photo.caption)}
              </p>
            </div>
          )}

          {/* Pagination — centré en bas */}
          {internalMode !== "tagging" && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <span className="text-white/60 text-sm tabular-nums">
                {currentIndex + 1}/{photos.length}
              </span>
            </div>
          )}

          {/* ── Overlay de tagging (div, pas un Sheet Radix — reste ici) ──── */}
          <AnimatePresence>
            {internalMode === "tagging" && (
              <motion.div
                key="tagging-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0"
              >
                <TaggingOverlay
                  photo={photo}
                  imageRef={imgRef}
                  existingTags={photo.tags}
                  onComplete={() => setInternalMode(null)}
                  onCancel={() => setInternalMode(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Overlay self-tag (div, pas un Sheet Radix — reste ici) ────── */}
          <AnimatePresence>
            {internalMode === "self-tag" && (
              <motion.div
                key="self-tag-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0"
              >
                <SelfTagOverlay
                  photo={photo}
                  imageRef={imgRef}
                  onComplete={() => setInternalMode(null)}
                  onCancel={() => setInternalMode(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.div>
    </div>,
    document.body
  );
}

export default PhotoViewer;
