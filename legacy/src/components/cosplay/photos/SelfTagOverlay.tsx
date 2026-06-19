import { useState, useRef, useCallback, useLayoutEffect, useEffect, RefObject } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, Check } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAddPhotoTag } from "@/hooks/useCosplayPhotos";
import type { CosplayPhotoWithTags } from "@/types/cosplayPhotos";

interface SelfTagOverlayProps {
  photo: CosplayPhotoWithTags;
  imageRef: RefObject<HTMLImageElement>;
  onComplete: () => void;
  onCancel: () => void;
}

export function SelfTagOverlay({ photo, imageRef, onComplete, onCancel }: SelfTagOverlayProps) {
  const { user } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);
  const addTag = useAddPhotoTag();

  // Fetch current user's profile for avatar/username display
  const { data: myProfile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const [imgBounds, setImgBounds] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Calcul des bounds ────────────────────────────────────────────────────

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

  // ── Tap pour placer le pin ────────────────────────────────────────────────

  const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isSaving) return;
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pinX = (e.clientX - rect.left) / rect.width;
    const pinY = (e.clientY - rect.top) / rect.height;
    if (pinX < 0 || pinX > 1 || pinY < 0 || pinY > 1) return;

    navigator.vibrate?.(10);
    setPin({ x: pinX, y: pinY });
  }, [imageRef, isSaving]);

  // ── Confirmer le self-tag ────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (!pin || !user || isSaving) return;
    setIsSaving(true);
    try {
      await addTag.mutateAsync({
        photo_id: photo.id,
        tagged_user_id: user.id,
        pin_x: pin.x,
        pin_y: pin.y,
      });
      onComplete();
    } catch {
      // error handled by hook toast
    } finally {
      setIsSaving(false);
    }
  };

  const username = myProfile?.username ?? user?.email?.split("@")[0] ?? "Moi";
  const avatarUrl = myProfile?.avatar_url ?? null;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-20"
      onClick={handleTap}
    >
      {/* ── Bandeau instruction ─────────────────────────────────────────── */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-purple-500/80 backdrop-blur-md rounded-full px-5 py-2.5 flex items-center gap-2 pointer-events-none"
      >
        <Hand className="w-[18px] h-[18px] text-white animate-pulse" />
        <span className="text-sm text-white font-medium">
          {pin ? "C'est bien toi ? Confirme !" : "Touche l'endroit ou tu te trouves"}
        </span>
      </motion.div>

      {/* ── Pin du self-tag ─────────────────────────────────────────────── */}
      {imgBounds.width > 0 && (
        <div
          className="absolute"
          style={{
            top: imgBounds.top,
            left: imgBounds.left,
            width: imgBounds.width,
            height: imgBounds.height,
          }}
        >
          <AnimatePresence>
            {pin && (
              <motion.div
                key="self-pin"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="absolute"
                style={{
                  left: `${pin.x * 100}%`,
                  top: `${pin.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Avatar className="w-12 h-12 ring-[3px] ring-purple-400 shadow-lg">
                  <AvatarImage src={avatarUrl ?? undefined} />
                  <AvatarFallback className="text-base bg-purple-500/30 text-white">
                    {(username ?? "?")[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
                  <span className="text-[10px] text-white bg-black/60 rounded-full px-1.5 py-px">
                    @{username}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Barre de confirmation ───────────────────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/80 to-transparent z-[25] pointer-events-none">
        <div className="pointer-events-auto space-y-2">
          <Button
            onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
            disabled={!pin || isSaving}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white border-0 hover:opacity-90 font-semibold"
          >
            {isSaving ? "Envoi…" : (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                Confirmer — c'est moi !
              </>
            )}
          </Button>
          <button
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className="w-full text-center text-white/40 text-xs hover:text-white/60 transition-colors focus:outline-none"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

export default SelfTagOverlay;
