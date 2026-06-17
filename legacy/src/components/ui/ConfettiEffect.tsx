import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface ConfettiEffectProps {
  trigger: boolean;
  variant?: "default" | "celebration" | "achievement" | "explosion";
  colors?: string[];
  duration?: number;
}

/**
 * ConfettiEffect - Effet confetti pour gamification dans Manga Paradise
 * 
 * @param trigger - Déclenche l'effet quand true
 * @param variant - Type d'animation (default, celebration, achievement, explosion)
 * @param colors - Couleurs personnalisées (défaut: thème Manga Paradise)
 * @param duration - Durée de l'effet en ms (défaut: 3000)
 */
export function ConfettiEffect({
  trigger,
  variant = "default",
  colors = ["hsl(var(--mp-primary))", "hsl(var(--mp-info))", "hsl(var(--mp-saffron))"],
  duration = 3000,
}: ConfettiEffectProps) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (trigger && !hasTriggered.current) {
      hasTriggered.current = true;
      fireConfetti(variant, colors, duration);

      // Reset after animation
      const timeout = setTimeout(() => {
        hasTriggered.current = false;
      }, duration + 500);

      return () => clearTimeout(timeout);
    }
  }, [trigger, variant, colors, duration]);

  return null; // This component doesn't render anything
}

/**
 * Hook pour déclencher manuellement des confettis
 */
export function useConfetti() {
  const fire = (
    variant: "default" | "celebration" | "achievement" | "explosion" = "default",
    colors: string[] = ["hsl(var(--mp-primary))", "hsl(var(--mp-info))", "hsl(var(--mp-saffron))"],
    duration: number = 3000
  ) => {
    fireConfetti(variant, colors, duration);
  };

  return { fire };
}

// Internal function to fire confetti
function fireConfetti(
  variant: "default" | "celebration" | "achievement" | "explosion",
  colors: string[],
  duration: number
) {
  const end = Date.now() + duration;

  switch (variant) {
    case "celebration":
      // Continuous burst from bottom
      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          return;
        }

        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 1 },
          colors,
        });

        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 1 },
          colors,
        });
      }, 50);
      break;

    case "achievement":
      // Single powerful burst from center
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors,
        startVelocity: 45,
        gravity: 1.2,
        scalar: 1.2,
      });

      // Follow-up smaller burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 100,
          origin: { y: 0.6 },
          colors,
          startVelocity: 30,
        });
      }, 200);
      break;

    case "explosion":
      // Radial explosion
      const count = 200;
      const defaults = {
        origin: { y: 0.5 },
        colors,
      };

      function fireExplosion(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fireExplosion(0.25, {
        spread: 26,
        startVelocity: 55,
      });

      fireExplosion(0.2, {
        spread: 60,
      });

      fireExplosion(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });

      fireExplosion(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });

      fireExplosion(0.1, {
        spread: 120,
        startVelocity: 45,
      });
      break;

    default:
      // Simple burst from top
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.4 },
        colors,
      });
      break;
  }
}

/**
 * Composant pour déclencher des confettis au clic
 */
interface ConfettiButtonProps {
  children: React.ReactNode;
  variant?: "default" | "celebration" | "achievement" | "explosion";
  colors?: string[];
  onClick?: () => void;
  className?: string;
}

export function ConfettiButton({
  children,
  variant = "default",
  colors = ["hsl(var(--mp-primary))", "hsl(var(--mp-info))", "hsl(var(--mp-saffron))"],
  onClick,
  className,
}: ConfettiButtonProps) {
  const { fire } = useConfetti();

  const handleClick = () => {
    fire(variant, colors);
    onClick?.();
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
