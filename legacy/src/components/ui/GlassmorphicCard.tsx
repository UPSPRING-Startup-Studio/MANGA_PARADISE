import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

/**
 * @deprecated Glassmorphisme cyberpunk supprimé par la refonte DA "Pop Sanctuary".
 * Cette implémentation est conservée comme **alias compatible** pour ne pas
 * casser les imports existants ; elle rend désormais une carte propre charte
 * (fond blanc, bordure douce, ombre clean — pas de blur, pas de glow).
 *
 * Migrer progressivement vers `<Card>` (de `@/components/ui/card`).
 */
interface GlassmorphicCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  variant?: "default" | "pink" | "cyan" | "gold";
  intensity?: "light" | "medium" | "strong";
  hover?: boolean;
  glow?: boolean;
}

const VARIANT_BORDER: Record<NonNullable<GlassmorphicCardProps["variant"]>, string> = {
  default: "border-border",
  pink: "border-mp-primary/25",
  cyan: "border-mp-info/25",
  gold: "border-mp-saffron/40",
};

export function GlassmorphicCard({
  children,
  variant = "default",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  intensity = "medium",
  hover = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  glow = false,
  className,
  ...props
}: GlassmorphicCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md",
        VARIANT_BORDER[variant],
        className,
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
