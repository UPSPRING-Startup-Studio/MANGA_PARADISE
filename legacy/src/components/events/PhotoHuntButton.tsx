import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PhotoHuntButtonProps {
  participantName: string;
  participantId: string;
  className?: string;
}

/**
 * PhotoHuntButton — Micro-interaction "Photo Hunt"
 * Allows users to add a cosplayer to their photo wishlist directly from their card.
 * Manages local `isHunted` state with Framer Motion animations + Sonner toast feedback.
 *
 * TODO: Replace local state with Supabase mutation (photo_hunt_list table)
 * when backend is ready.
 */
export const PhotoHuntButton = ({
  participantName,
  participantId,
  className,
}: PhotoHuntButtonProps) => {
  const [isHunted, setIsHunted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent triggering parent card click / tooltip
    e.stopPropagation();
    e.preventDefault();

    if (isAnimating) return;

    setIsAnimating(true);
    const nextState = !isHunted;
    setIsHunted(nextState);

    if (nextState) {
      toast.success("Ajouté à votre liste de Photo Hunt ! Le cosplayer en sera notifié.", {
        icon: "📸",
        duration: 3500,
        style: {
          background: "rgba(0,0,0,0.85)",
          border: "1px solid rgba(255,0,127,0.4)",
          color: "#fff",
          backdropFilter: "blur(12px)",
        },
      });
    } else {
      toast.info(`${participantName} retiré de votre Photo Hunt.`, {
        icon: "🚫",
        duration: 2500,
        style: {
          background: "rgba(0,0,0,0.85)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
          backdropFilter: "blur(12px)",
        },
      });
    }

    // Reset animation lock after bounce completes
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <motion.button
      key={`photo-hunt-${participantId}`}
      onClick={handleClick}
      aria-label={isHunted ? "Retirer du Photo Hunt" : "Ajouter au Photo Hunt"}
      title={isHunted ? "Retirer du Photo Hunt" : "Ajouter au Photo Hunt"}
      // Entrance animation
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
      // Bounce on click
      whileTap={{ scale: 0.75 }}
      className={cn(
        // Base shape — round floating button
        "absolute top-2 right-2 z-20",
        "w-8 h-8 rounded-full",
        "flex items-center justify-center",
        "transition-all duration-300",
        // Glassmorphism base
        "bg-black/50 backdrop-blur-md",
        "border border-white/20",
        // Hunted state: neon pink glow + gold icon
        isHunted
          ? "border-[hsl(var(--mp-primary))]/70 shadow-[0_0_12px_rgba(255,0,127,0.7)] bg-[hsl(var(--mp-primary))]/20"
          : "hover:border-[hsl(var(--mp-primary))]/50 hover:shadow-[0_0_10px_rgba(255,0,127,0.4)] hover:bg-black/70",
        className
      )}
    >
      <AnimatePresence mode="wait">
        {isHunted ? (
          <motion.span
            key="hunted"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 30 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {/* Filled camera icon — gold when hunted */}
            <Camera
              className="w-4 h-4 fill-[hsl(var(--mp-saffron))] text-[hsl(var(--mp-saffron))] drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]"
              strokeWidth={1.5}
            />
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ scale: 0, rotate: 30 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -30 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {/* Outline camera icon — white/muted when idle */}
            <Camera
              className="w-4 h-4 text-white/70 group-hover:text-white transition-colors"
              strokeWidth={1.5}
            />
          </motion.span>
        )}
      </AnimatePresence>

      {/* Ripple pulse when hunted */}
      {isHunted && (
        <motion.span
          className="absolute inset-0 rounded-full border border-[hsl(var(--mp-primary))]/50"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.2 }}
        />
      )}
    </motion.button>
  );
};

export default PhotoHuntButton;
