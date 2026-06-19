"use client";

import { LazyMotion, domAnimation, MotionConfig } from "motion/react";

/**
 * Frontière client réutilisable pour motion (landing, nav mobile, etc.).
 * - `LazyMotion` + `domAnimation` : ne charge que les features utilisées (bundle léger).
 * - `strict` : impose les composants `m.*` (interdit `motion.*`, plus lourd).
 * - `reducedMotion="user"` : respecte `prefers-reduced-motion` automatiquement.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
