import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  variant?: "default" | "pink" | "cyan" | "gold";
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * AnimatedCounter - Compteur animé pour XP, stats, et gamification
 * 
 * @param value - Valeur à afficher
 * @param duration - Durée de l'animation en secondes (défaut: 1)
 * @param prefix - Préfixe (ex: "+", "$")
 * @param suffix - Suffixe (ex: "XP", "pts")
 * @param decimals - Nombre de décimales (défaut: 0)
 * @param variant - Couleur du texte
 * @param size - Taille du texte
 */
export function AnimatedCounter({
  value,
  duration = 1,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
  variant = "default",
  size = "md",
}: AnimatedCounterProps) {
  // Spring animation for smooth counting
  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const display = useTransform(spring, (current) =>
    (prefix + current.toFixed(decimals) + suffix)
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  // Color variants
  const colors = {
    default: "text-white",
    pink: "text-[hsl(var(--mp-primary))]",
    cyan: "text-[hsl(var(--mp-info))]",
    gold: "text-[hsl(var(--mp-saffron))]",
  };

  // Size variants
  const sizes = {
    sm: "text-sm",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
  };

  return (
    <motion.span
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "font-bold tabular-nums",
        colors[variant],
        sizes[size],
        className
      )}
    >
      {display}
    </motion.span>
  );
}

/**
 * AnimatedXPGain - Composant spécialisé pour afficher un gain d'XP
 */
interface AnimatedXPGainProps {
  amount: number;
  onComplete?: () => void;
}

export function AnimatedXPGain({ amount, onComplete }: AnimatedXPGainProps) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 1 }}
      animate={{ y: -50, opacity: 0, scale: 1.2 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      onAnimationComplete={onComplete}
      className="pointer-events-none fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2"
    >
      <div className="flex items-center gap-2 rounded-lg bg-black/80 px-6 py-3 backdrop-blur-md">
        <span className="text-2xl">✨</span>
        <AnimatedCounter
          value={amount}
          prefix="+"
          suffix=" XP"
          variant="gold"
          size="lg"
          duration={0.8}
        />
      </div>
    </motion.div>
  );
}

/**
 * StatCounter - Compteur avec label pour afficher des statistiques
 */
interface StatCounterProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  variant?: "default" | "pink" | "cyan" | "gold";
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
}

export function StatCounter({
  label,
  value,
  icon,
  variant = "default",
  trend,
  trendValue,
}: StatCounterProps) {
  const trendColors = {
    up: "text-green-500",
    down: "text-red-500",
    neutral: "text-mp-ink-muted",
  };

  const trendIcons = {
    up: "↑",
    down: "↓",
    neutral: "→",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2 rounded-lg bg-black/40 p-4 backdrop-blur-md"
    >
      {/* Label */}
      <div className="flex items-center gap-2 text-sm text-mp-ink-muted">
        {icon}
        <span>{label}</span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <AnimatedCounter
          value={value}
          variant={variant}
          size="lg"
          duration={1.2}
        />

        {/* Trend indicator */}
        {trend && trendValue !== undefined && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className={cn("text-sm font-medium", trendColors[trend])}
          >
            {trendIcons[trend]} {Math.abs(trendValue)}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
