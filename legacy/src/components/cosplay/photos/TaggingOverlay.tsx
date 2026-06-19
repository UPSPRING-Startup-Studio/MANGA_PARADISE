import { useState, useRef, useEffect, useLayoutEffect, useCallback, RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Plus, Search, X, Pencil, Trash2, Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/hooks/useFriendships";
import { useAddPhotoTag, useDeletePhotoTag } from "@/hooks/useCosplayPhotos";
import type { CosplayPhotoWithTags, PhotoTagWithProfile } from "@/types/cosplayPhotos";

// ─── Types internes ───────────────────────────────────────────────────────────

interface PendingPin {
  x: number;
  y: number;
  tempId: string;
}

interface DisplayInfo {
  username: string | null;
  avatar_url: string | null;
  character: string | null;
}

interface ConfirmedTag {
  tempId: string;
  pin: { x: number; y: number };
  tagInput: {
    tagged_user_id: string | null;
    tagged_name: string | null;
    tagged_character: string | null;
  };
  displayInfo: DisplayInfo;
  replacesExistingTagId?: string;
}

interface IdentifySheetState {
  pin: PendingPin;
  prefill?: {
    tagged_user_id: string | null;
    tagged_name: string | null;
    tagged_character: string | null;
    username?: string | null;
    avatar_url?: string | null;
  };
  replacesExistingTagId?: string;
  replacesConfirmedTempId?: string;
}

interface ProfileResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface RippleState {
  id: string;
  x: number;
  y: number;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaggingOverlayProps {
  photo: CosplayPhotoWithTags;
  imageRef: RefObject<HTMLImageElement>;
  existingTags: PhotoTagWithProfile[];
  onComplete: () => void;
  onCancel: () => void;
}

// ─── Sous-composant : IdentifySheet ──────────────────────────────────────────

interface IdentifySheetProps {
  state: IdentifySheetState;
  onConfirm: (data: {
    tagged_user_id: string | null;
    tagged_name: string | null;
    tagged_character: string | null;
    displayInfo: DisplayInfo;
  }) => void;
  onCancel: () => void;
}

function IdentifySheet({ state, onConfirm, onCancel }: IdentifySheetProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: friendships = [] } = useFriends(userId);

  const isEdit = !!(state.replacesExistingTagId || state.replacesConfirmedTempId);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedProfile, setSelectedProfile] = useState<ProfileResult | null>(
    state.prefill?.tagged_user_id
      ? {
          id: state.prefill.tagged_user_id,
          username: state.prefill.username ?? null,
          display_name: null,
          avatar_url: state.prefill.avatar_url ?? null,
        }
      : null
  );
  const [manualName, setManualName] = useState(
    !state.prefill?.tagged_user_id ? (state.prefill?.tagged_name ?? "") : ""
  );
  const [character, setCharacter] = useState(state.prefill?.tagged_character ?? "");

  // ── Nakamas ─────────────────────────────────────────────────────────────

  const nakamaProfiles = friendships
    .map((f) => (f.requester_id === userId ? f.addressee : f.requester))
    .filter((p): p is NonNullable<typeof p> => !!p);

  // ── Recherche ───────────────────────────────────────────────────────────

  const handleSearch = async (q: string) => {
    setSearch(q);
    setSelectedProfile(null);
    if (q.length < 2) { setResults([]); return; }
    setIsSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .ilike("username", `%${q}%`)
      .limit(5);
    setResults((data as ProfileResult[]) ?? []);
    setIsSearching(false);
  };

  const handleSelectNakama = (friend: NonNullable<typeof nakamaProfiles[0]>) => {
    onConfirm({
      tagged_user_id: friend.id,
      tagged_name: null,
      tagged_character: null,
      displayInfo: {
        username: friend.username,
        avatar_url: friend.avatar_url,
        character: null,
      },
    });
  };

  const handleConfirm = () => {
    const tagged_user_id  = selectedProfile?.id ?? null;
    const tagged_name     = selectedProfile ? null : (manualName.trim() || null);
    const tagged_character = character.trim() || null;
    onConfirm({
      tagged_user_id,
      tagged_name,
      tagged_character,
      displayInfo: {
        username: selectedProfile?.username ?? tagged_name,
        avatar_url: selectedProfile?.avatar_url ?? null,
        character: tagged_character,
      },
    });
  };

  const canConfirm = !!(selectedProfile || manualName.trim());

  return (
    <motion.div
      key="identify-sheet"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 35 }}
      className="absolute inset-x-0 bottom-0 z-40 bg-[#1A1A2E] rounded-t-2xl border-t border-white/10 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>

      <div className="px-4 pb-8 space-y-3 max-h-[60vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between py-1">
          <p className="text-white font-semibold">
            {isEdit ? "Modifier le tag" : "Identifier la personne"}
          </p>
          <button
            onClick={onCancel}
            className="text-white/40 hover:text-white transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── MES NAKAMAS ──────────────────────────────────────────────── */}
        {nakamaProfiles.length > 0 && !selectedProfile && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="w-3.5 h-3.5 text-pink-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Mes Nakamas
              </p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {nakamaProfiles.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => handleSelectNakama(friend)}
                  className="flex-shrink-0 w-16 flex flex-col items-center gap-1 focus:outline-none group"
                >
                  <Avatar className="w-12 h-12 ring-2 ring-pink-500/30 group-hover:scale-105 transition-transform">
                    <AvatarImage src={friend.avatar_url ?? undefined} />
                    <AvatarFallback className="text-sm bg-white/10 text-white">
                      {(friend.username ?? "?")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-[10px] text-white/70 truncate w-16 text-center">
                    @{friend.username ?? "?"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recherche utilisateur */}
        {!selectedProfile && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher un utilisateur…"
              autoFocus={!isEdit && nakamaProfiles.length === 0}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20 h-10"
            />
          </div>
        )}

        {/* Résultats */}
        <AnimatePresence>
          {results.length > 0 && !selectedProfile && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-xl bg-white/5 border border-white/10 overflow-hidden max-h-44 overflow-y-auto"
            >
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProfile(p); setResults([]); setSearch(""); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition-colors text-left"
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-white/10 text-white">
                      {(p.username ?? "?")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white text-sm">@{p.username}</p>
                    {p.display_name && (
                      <p className="text-white/40 text-xs">{p.display_name}</p>
                    )}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profil sélectionné */}
        {selectedProfile && (
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
            <Avatar className="w-7 h-7 flex-shrink-0">
              <AvatarImage src={selectedProfile.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs bg-white/10 text-white">
                {(selectedProfile.username ?? "?")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-white text-sm flex-1">@{selectedProfile.username}</span>
            <button
              onClick={() => setSelectedProfile(null)}
              className="text-white/40 hover:text-white transition-colors focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Nom manuel */}
        {!selectedProfile && search.length < 2 && !isSearching && (
          <div className="space-y-1">
            <p className="text-xs text-white/30 px-0.5">Ou entre un nom manuellement</p>
            <Input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Nom du cosplayeur"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20 h-10"
            />
          </div>
        )}

        {/* Personnage */}
        <Input
          value={character}
          onChange={(e) => setCharacter(e.target.value)}
          placeholder="Personnage cosplayé (optionnel)"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20 h-10"
        />

        {/* Confirmer */}
        <Button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="w-full bg-gradient-to-r from-[#C70039] to-[#FF5733] text-white border-0 hover:opacity-90 font-semibold"
        >
          Confirmer
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function TaggingOverlay({
  photo,
  imageRef,
  existingTags,
  onComplete,
  onCancel,
}: TaggingOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const [imgBounds, setImgBounds] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [pendingPins, setPendingPins]       = useState<PendingPin[]>([]);
  const [identifyingState, setIdentifyingState] = useState<IdentifySheetState | null>(null);
  const [confirmedTags, setConfirmedTags]   = useState<ConfirmedTag[]>([]);
  const [activeExistingTagId, setActiveExistingTagId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget]     = useState<{ tagId: string; label: string } | null>(null);
  const [isSaving, setIsSaving]             = useState(false);
  const [ripples, setRipples]               = useState<RippleState[]>([]);

  const addTag  = useAddPhotoTag();
  const deleteTag = useDeletePhotoTag();

  const replacedIds = new Set(
    confirmedTags.filter((ct) => ct.replacesExistingTagId).map((ct) => ct.replacesExistingTagId!)
  );
  const visibleExistingTags = existingTags.filter((t) => !replacedIds.has(t.id));
  const totalCount = visibleExistingTags.length + confirmedTags.length;

  // ── Calcul des bounds de l'image ──────────────────────────────────────────

  const computeImgBounds = useCallback(() => {
    const img = imageRef.current;
    const overlay = overlayRef.current;
    if (!img || !overlay) return;
    const ir = img.getBoundingClientRect();
    const or = overlay.getBoundingClientRect();
    setImgBounds({ top: ir.top - or.top, left: ir.left - or.left, width: ir.width, height: ir.height });
  }, [imageRef]);

  useLayoutEffect(() => { computeImgBounds(); }, [computeImgBounds]);
  useEffect(() => {
    window.addEventListener("resize", computeImgBounds);
    return () => window.removeEventListener("resize", computeImgBounds);
  }, [computeImgBounds]);

  // ── Tap sur la photo ──────────────────────────────────────────────────────

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (identifyingState) return;
      const rect = imageRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pinX = (e.clientX - rect.left) / rect.width;
      const pinY = (e.clientY - rect.top)  / rect.height;
      if (pinX < 0 || pinX > 1 || pinY < 0 || pinY > 1) return;

      // Haptic feedback
      navigator.vibrate?.(10);

      // Ripple effect at tap position (relative to overlay)
      const overlayRect = overlayRef.current?.getBoundingClientRect();
      if (overlayRect) {
        const rippleId = crypto.randomUUID();
        setRipples((prev) => [...prev, { id: rippleId, x: e.clientX - overlayRect.left, y: e.clientY - overlayRect.top }]);
        setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== rippleId)), 400);
      }

      const newPin: PendingPin = { x: pinX, y: pinY, tempId: crypto.randomUUID() };
      setPendingPins((prev) => [...prev, newPin]);
      setIdentifyingState({ pin: newPin });
    },
    [imageRef, identifyingState]
  );

  // ── IdentifySheet confirm ─────────────────────────────────────────────────

  const handleIdentifyConfirm = (data: {
    tagged_user_id: string | null;
    tagged_name: string | null;
    tagged_character: string | null;
    displayInfo: DisplayInfo;
  }) => {
    if (!identifyingState) return;
    const { pin, replacesExistingTagId, replacesConfirmedTempId } = identifyingState;

    if (replacesConfirmedTempId) {
      setConfirmedTags((prev) =>
        prev.map((ct) =>
          ct.tempId === replacesConfirmedTempId
            ? { ...ct, tagInput: data, displayInfo: data.displayInfo }
            : ct
        )
      );
    } else {
      setPendingPins((prev) => prev.filter((p) => p.tempId !== pin.tempId));
      setConfirmedTags((prev) => [
        ...prev,
        {
          tempId: pin.tempId,
          pin: { x: pin.x, y: pin.y },
          tagInput: {
            tagged_user_id: data.tagged_user_id,
            tagged_name: data.tagged_name,
            tagged_character: data.tagged_character,
          },
          displayInfo: data.displayInfo,
          replacesExistingTagId,
        },
      ]);
    }
    setIdentifyingState(null);
  };

  const handleIdentifyCancel = () => {
    if (identifyingState && !identifyingState.replacesExistingTagId && !identifyingState.replacesConfirmedTempId) {
      setPendingPins((prev) => prev.filter((p) => p.tempId !== identifyingState.pin.tempId));
    }
    setIdentifyingState(null);
  };

  // ── Suppression d'un tag DB ───────────────────────────────────────────────

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteTag.mutate(
      { tagId: deleteTarget.tagId, photoId: photo.id },
      { onSuccess: () => setDeleteTarget(null) }
    );
  };

  // ── Terminer ─────────────────────────────────────────────────────────────

  const handleComplete = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await Promise.all([
        ...confirmedTags
          .filter((ct) => ct.replacesExistingTagId)
          .map((ct) =>
            deleteTag.mutateAsync({ tagId: ct.replacesExistingTagId!, photoId: photo.id })
          ),
        ...confirmedTags.map((ct) =>
          addTag.mutateAsync({
            photo_id:         photo.id,
            tagged_user_id:   ct.tagInput.tagged_user_id,
            tagged_name:      ct.tagInput.tagged_name,
            tagged_character: ct.tagInput.tagged_character,
            pin_x: ct.pin.x,
            pin_y: ct.pin.y,
          })
        ),
      ]);
      onComplete();
    } catch {
      // Erreurs gérées par les hooks (toasts)
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Overlay principal ───────────────────────────────────────────── */}
      <div
        ref={overlayRef}
        className="absolute inset-0 z-20"
        onClick={handleOverlayClick}
      >
        {/* ── Bandeau instruction ──────────────────────────────────────── */}
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute top-0 inset-x-0 p-3 bg-black/70 backdrop-blur-sm z-30 pointer-events-none"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={confirmedTags.length > 0 ? "has-tags" : "empty"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-white/70 flex-shrink-0" />
              <p className="text-sm text-white/90">
                {confirmedTags.length > 0
                  ? "Tag ajouté ! Touche pour en ajouter d'autres, ou ✓ pour terminer."
                  : "Touche la photo pour placer un tag sur un cosplayeur"}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ── Ripples éphémères ─────────────────────────────────────────── */}
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="absolute w-[60px] h-[60px] rounded-full bg-pink-400/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: "translate(-50%, -50%) scale(0)",
              animation: "tap-ripple 400ms ease-out forwards",
            }}
          />
        ))}

        {/* ── Container calé sur les bounds réels de l'image ──────────── */}
        {imgBounds.width > 0 && (
          <div
            className="absolute"
            style={{
              top:    imgBounds.top,
              left:   imgBounds.left,
              width:  imgBounds.width,
              height: imgBounds.height,
            }}
          >
            {/* A) Pins temporaires — plus grands avec overshoot */}
            <AnimatePresence>
              {pendingPins.map((pin) => (
                <motion.div
                  key={pin.tempId}
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute"
                  style={{
                    left:      `${pin.x * 100}%`,
                    top:       `${pin.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-pink-500/80 flex items-center justify-center ring-2 ring-white/50 shadow-lg">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* B) Tags confirmés en session (avatar + label) */}
            <AnimatePresence>
            {confirmedTags.map((ct) => {
              const labelLeft = ct.pin.x > 0.7;
              const parts = [
                ct.displayInfo.username ? `@${ct.displayInfo.username}` : null,
                ct.displayInfo.character,
              ].filter(Boolean);
              const label = parts.join(" · ");

              return (
                <motion.div
                  key={ct.tempId}
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="absolute"
                  style={{
                    left:      `${ct.pin.x * 100}%`,
                    top:       `${ct.pin.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveExistingTagId(null);
                      setIdentifyingState({
                        pin:                     { x: ct.pin.x, y: ct.pin.y, tempId: ct.tempId },
                        prefill:                 {
                          tagged_user_id:   ct.tagInput.tagged_user_id,
                          tagged_name:      ct.tagInput.tagged_name,
                          tagged_character: ct.tagInput.tagged_character,
                          username:         ct.displayInfo.username,
                          avatar_url:       ct.displayInfo.avatar_url,
                        },
                        replacesConfirmedTempId: ct.tempId,
                      });
                    }}
                    className="focus:outline-none"
                  >
                    <Avatar className="w-7 h-7 ring-2 ring-white shadow-lg hover:scale-110 transition-transform">
                      <AvatarImage src={ct.displayInfo.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px] bg-white/20 text-white">
                        {(ct.displayInfo.username ?? "?")[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>

                  {label && (
                    <div
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 pointer-events-none",
                        "bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5",
                        "text-xs text-white whitespace-nowrap",
                        labelLeft ? "right-full mr-2" : "left-full ml-2"
                      )}
                    >
                      {label}
                    </div>
                  )}
                </motion.div>
              );
            })}
            </AnimatePresence>

            {/* C) Tags existants en base */}
            {visibleExistingTags.map((tag) => {
              const isActive  = activeExistingTagId === tag.id;
              const labelLeft = tag.pin_x > 0.7;
              const pseudo    = tag.tagged_profile?.username ?? tag.tagged_name ?? "?";
              const parts = [
                `@${pseudo}`,
                tag.tagged_character,
              ].filter(Boolean);
              const label = parts.join(" · ");

              return (
                <div
                  key={tag.id}
                  className="absolute"
                  style={{
                    left:      `${tag.pin_x * 100}%`,
                    top:       `${tag.pin_y * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {/* Mini-popup d'actions */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                          "absolute bottom-full mb-2 z-50",
                          "bg-[#1A1A2E] rounded-xl p-3 shadow-xl border border-white/10",
                          "min-w-[150px]",
                          labelLeft ? "right-0" : "left-0"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-6 h-6 flex-shrink-0">
                            <AvatarImage src={tag.tagged_profile?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[8px] bg-white/10 text-white">
                              {pseudo[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white text-sm leading-none">@{pseudo}</p>
                            {tag.tagged_character && (
                              <p className="text-white/50 text-xs mt-0.5">{tag.tagged_character}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2 border-t border-white/10">
                          <button
                            onClick={() => {
                              setActiveExistingTagId(null);
                              setIdentifyingState({
                                pin: { x: tag.pin_x, y: tag.pin_y, tempId: tag.id },
                                prefill: {
                                  tagged_user_id:   tag.tagged_user_id,
                                  tagged_name:      tag.tagged_name,
                                  tagged_character: tag.tagged_character,
                                  username:         tag.tagged_profile?.username ?? null,
                                  avatar_url:       tag.tagged_profile?.avatar_url ?? null,
                                },
                                replacesExistingTagId: tag.id,
                              });
                            }}
                            className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors focus:outline-none"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Modifier
                          </button>
                          <button
                            onClick={() => {
                              setActiveExistingTagId(null);
                              setDeleteTarget({ tagId: tag.id, label: pseudo });
                            }}
                            className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs transition-colors focus:outline-none ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Supprimer
                          </button>
                        </div>

                        <div
                          className={cn(
                            "absolute top-full w-0 h-0",
                            "border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#1A1A2E]",
                            labelLeft ? "right-3" : "left-3"
                          )}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Avatar-pin */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveExistingTagId((prev) => (prev === tag.id ? null : tag.id));
                    }}
                    className="focus:outline-none"
                  >
                    <Avatar className={cn("w-7 h-7 ring-2 ring-white shadow-lg transition-transform", isActive && "scale-110")}>
                      <AvatarImage src={tag.tagged_profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px] bg-white/20 text-white">
                        {pseudo[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>

                  {/* Label flottant */}
                  {!isActive && label && (
                    <div
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 pointer-events-none",
                        "bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5",
                        "text-xs text-white whitespace-nowrap",
                        labelLeft ? "right-full mr-2" : "left-full ml-2"
                      )}
                    >
                      {label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Sheet d'identification ──────────────────────────────────────── */}
      <AnimatePresence>
        {identifyingState && (
          <IdentifySheet
            state={identifyingState}
            onConfirm={handleIdentifyConfirm}
            onCancel={handleIdentifyCancel}
          />
        )}
      </AnimatePresence>

      {/* ── Résumé bas de page ──────────────────────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/80 to-transparent z-[25] pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 mb-3">
            {totalCount > 0 ? (
              <>
                <div className="flex -space-x-1">
                  {visibleExistingTags.slice(0, 3).map((tag) => (
                    <Avatar key={tag.id} className="w-6 h-6 ring-1 ring-[#0D0D0D]">
                      <AvatarImage src={tag.tagged_profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[8px] bg-white/20 text-white">
                        {(tag.tagged_profile?.username ?? tag.tagged_name ?? "?")[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {confirmedTags.slice(0, Math.max(0, 6 - visibleExistingTags.length)).map((ct) => (
                    <Avatar key={ct.tempId} className="w-6 h-6 ring-1 ring-[#0D0D0D]">
                      <AvatarImage src={ct.displayInfo.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[8px] bg-white/20 text-white">
                        {(ct.displayInfo.username ?? "?")[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-white/60 text-sm">
                  {totalCount} cosplayeur{totalCount !== 1 ? "s" : ""} tagué{totalCount !== 1 ? "s" : ""}
                </span>
              </>
            ) : (
              <span className="text-white/30 text-sm">Aucun tag pour l'instant</span>
            )}
          </div>

          <Button
            onClick={handleComplete}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-[#C70039] to-[#FF5733] text-white border-0 hover:opacity-90 font-semibold"
          >
            {isSaving ? "Enregistrement…" : "✓ Terminer le tagging"}
          </Button>

          <button
            onClick={onCancel}
            className="w-full text-center text-white/40 text-xs hover:text-white/60 transition-colors focus:outline-none mt-3"
          >
            Annuler les modifications
          </button>
        </div>
      </div>

      {/* ── Confirmation suppression (AlertDialog) ─────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="z-[300] bg-[#1A1A2E] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Supprimer ce tag ?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Le tag de{" "}
              <span className="text-white/80 font-medium">@{deleteTarget?.label}</span>{" "}
              sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/10 text-white hover:bg-white/20 hover:text-white">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteTag.isPending}
              className="bg-red-600 text-white hover:bg-red-700 border-0"
            >
              {deleteTag.isPending ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default TaggingOverlay;
