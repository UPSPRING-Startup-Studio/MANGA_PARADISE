"use client";

import { m } from "motion/react";

/**
 * Apparition au scroll (fade + translation), une seule fois.
 * À utiliser à l'intérieur d'un `MotionProvider`. Respecte `prefers-reduced-motion`
 * via la config motion (l'animation est neutralisée pour ces utilisateurs).
 */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
}
