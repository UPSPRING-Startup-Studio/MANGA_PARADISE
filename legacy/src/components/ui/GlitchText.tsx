import { motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * @deprecated Effet glitch cyberpunk supprimé par la refonte DA "Pop Sanctuary".
 * Alias compatible : rend désormais un texte stylé charte (Barlow Condensed Italic
 * + couleur cinabre/saffron/orange selon variant). API conservée pour compat.
 */
interface GlitchTextProps {
  children: string;
  variant?: "default" | "pink" | "cyan" | "gold";
  intensity?: "low" | "medium" | "high";
  continuous?: boolean;
  className?: string;
}

const VARIANT_COLOR: Record<NonNullable<GlitchTextProps["variant"]>, string> = {
  default: "text-mp-ink",
  pink: "text-mp-primary",
  cyan: "text-mp-info",
  gold: "text-mp-orange",
};

export function GlitchText({
  children,
  variant = "pink",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  intensity = "medium",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  continuous = false,
  className,
}: GlitchTextProps) {
  return (
    <span
      className={cn(
        "inline-block font-display italic font-extrabold tracking-tight",
        VARIANT_COLOR[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

interface GlitchTitleProps {
  children: string;
  variant?: "default" | "pink" | "cyan" | "gold";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES: Record<NonNullable<GlitchTitleProps["size"]>, string> = {
  sm: "text-2xl",
  md: "text-display-sm",
  lg: "text-display-md",
  xl: "text-display-lg",
};

export function GlitchTitle({
  children,
  variant = "pink",
  size = "lg",
  className,
}: GlitchTitleProps) {
  return (
    <h2 className={cn("font-display italic font-extrabold uppercase tracking-tight", SIZES[size], className)}>
      <GlitchText variant={variant}>{children}</GlitchText>
    </h2>
  );
}

interface DataStreamProps {
  text: string;
  speed?: number;
  variant?: "pink" | "cyan" | "gold";
}

const STREAM_COLOR: Record<NonNullable<DataStreamProps["variant"]>, string> = {
  pink: "text-mp-primary",
  cyan: "text-mp-info",
  gold: "text-mp-orange",
};

/**
 * @deprecated Effet "data stream" Matrix supprimé. Conservé en alias compat :
 * un simple typewriter charte sur Poppins mono.
 */
export function DataStream({ text, speed = 50, variant = "cyan" }: DataStreamProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("font-mono", STREAM_COLOR[variant])}
    >
      {displayText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="ml-1"
        >
          ▊
        </motion.span>
      )}
    </motion.span>
  );
}
