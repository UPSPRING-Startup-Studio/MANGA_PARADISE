import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Manga Paradise — KirakiraDecor
 * Pluie discrète de pétales sakura (~12 par défaut) en fond.
 * Respecte `prefers-reduced-motion` : retourne null si l'utilisateur le demande.
 *
 * Remplace ParticleBackground (cyberpunk/neon) du legacy.
 */

export interface KirakiraDecorProps {
  count?: number;
  className?: string;
  /** Couleur des pétales — par défaut hsl(var(--mp-primary) / 0.15). */
  color?: string;
}

export function KirakiraDecor({
  count = 12,
  className,
  color = "hsl(var(--mp-primary) / 0.15)",
}: KirakiraDecorProps) {
  const reduceMotion = useReducedMotion();

  const petals = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 8 + Math.random() * 10,
        delay: Math.random() * 12,
        duration: 12 + Math.random() * 10,
        rotate: Math.random() * 360,
      })),
    [count],
  );

  if (reduceMotion) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden -z-0",
        className,
      )}
    >
      {petals.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block animate-sakura-fall"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        >
          <svg viewBox="0 0 24 24" width="100%" height="100%">
            <path
              d="M12 4 C14 4 16 6 14 9 C17 8 19 11 16 13 C19 14 17 18 14 16 C14 19 10 19 10 16 C7 18 5 14 8 13 C5 11 7 8 10 9 C8 6 10 4 12 4 Z"
              fill={color}
            />
          </svg>
        </span>
      ))}
    </div>
  );
}

export default KirakiraDecor;
