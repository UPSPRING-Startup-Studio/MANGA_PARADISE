import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

/**
 * @deprecated Bouton néon cyberpunk supprimé par la refonte DA "Pop Sanctuary".
 * Alias compatible : rend désormais un bouton charte cinabre (variant pink → primary,
 * cyan → secondary outline, gold → premium gradient, purple → violet pâle).
 *
 * Migrer progressivement vers `<Button>` (de `@/components/ui/button`).
 */
interface NeonButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  variant?: "pink" | "cyan" | "gold" | "purple";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  glowIntensity?: "low" | "medium" | "high";
  animated?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<NeonButtonProps["variant"]>, string> = {
  pink: "bg-primary text-primary-foreground hover:bg-[hsl(var(--mp-primary-600))] shadow-primary",
  cyan: "bg-white text-mp-ink border border-border hover:bg-mp-paper hover:border-primary/25 shadow-sm",
  gold: "bg-gradient-to-r from-[hsl(var(--mp-saffron))] to-[hsl(var(--mp-orange))] text-amber-900 shadow-sm",
  purple: "bg-mp-violet text-white hover:bg-mp-violet/90 shadow-sm",
};

const SIZES: Record<NonNullable<NeonButtonProps["size"]>, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

export function NeonButton({
  children,
  variant = "pink",
  size = "md",
  loading = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  glowIntensity = "medium",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  animated = false,
  className,
  disabled,
  ...props
}: NeonButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASSES[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </span>
    </motion.button>
  );
}
