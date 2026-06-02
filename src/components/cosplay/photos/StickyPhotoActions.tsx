import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Plus, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StickyPhotoActionsProps {
  onSelectClick: () => void;
  onAddClick: () => void;
  isOwner: boolean;
  isSelectionMode: boolean;
  /** Ref to the original header actions — sticky bar shows when this leaves viewport */
  headerRef: React.RefObject<HTMLDivElement | null>;
}

export function StickyPhotoActions({
  onSelectClick,
  onAddClick,
  isOwner,
  isSelectionMode,
  headerRef,
}: StickyPhotoActionsProps) {
  const [showSticky, setShowSticky] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        setShowSticky(rect.bottom < 0);
      }
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headerRef]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Hide when not owner or when selection mode is active (BatchActionBar takes over)
  if (!isOwner || isSelectionMode) return null;

  return (
    <>
      {/* Sticky bar: Sélectionner + Ajouter */}
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: 80, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: 80, opacity: 0, x: "-50%" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-20 left-1/2 z-40"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#1A1A2E]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectClick}
                className="gap-1.5 text-white/70 hover:text-white hover:bg-white/10 text-xs h-9"
              >
                <CheckSquare className="w-4 h-4" />
                Sélectionner
              </Button>

              <div className="w-px h-5 bg-white/10" />

              <Button
                variant="ghost"
                size="sm"
                onClick={onAddClick}
                className="gap-1.5 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 text-xs h-9"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to top button — positioned above LinkshellFAB (bottom-6 right-6 z-50) */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={scrollToTop}
            className="fixed bottom-[72px] right-6 z-40 w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-colors shadow-lg shadow-black/30"
            aria-label="Retour en haut"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
