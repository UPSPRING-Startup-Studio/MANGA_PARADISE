/**
 * MANGA PARADISE — Frontend Design (compat layer)
 *
 * @deprecated Les composants Glassmorphic / Neon / Glitch / Particle ont été
 * remplacés par la refonte DA "Pop Sanctuary" :
 *   - GlassmorphicCard → Card
 *   - NeonButton       → Button
 *   - GlitchText       → span stylé Barlow Italic
 *   - ParticleBackground → KirakiraDecor (pétales sakura discrets)
 *
 * Ces ré-exports sont conservés pour ne pas casser les imports existants
 * pendant la migration progressive. Cible : suppression à terme.
 */

// Cards & primitives
export { GlassmorphicCard } from "./GlassmorphicCard";
export { NeonButton } from "./NeonButton";
export { ParticleBackground } from "./ParticleBackground";

// Decor charte (nouveaux)
export { JapanIcon } from "@/components/decor/JapanIcon";
export { KirakiraDecor } from "@/components/decor/KirakiraDecor";

// Conservés tels quels (pas de glow agressif)
export {
  ConfettiEffect,
  useConfetti,
  ConfettiButton,
} from "./ConfettiEffect";

export {
  AnimatedCounter,
  AnimatedXPGain,
  StatCounter,
} from "./AnimatedCounter";

// Typography aliases (charte)
export { GlitchText, GlitchTitle, DataStream } from "./GlitchText";
