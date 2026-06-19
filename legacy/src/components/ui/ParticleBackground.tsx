import { KirakiraDecor } from "@/components/decor/KirakiraDecor";

/**
 * @deprecated `ParticleBackground` (tsparticles cyberpunk) a été remplacé par
 * `KirakiraDecor` — pluie discrète de pétales sakura cinabre, charte officielle.
 * On conserve cette export pour compat avec les imports existants.
 *
 * Migrer progressivement vers `<KirakiraDecor />`.
 */
interface ParticleBackgroundProps {
  variant?: "default" | "cyberpunk" | "stars" | "minimal";
  density?: number;
}

export function ParticleBackground({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  variant = "default",
  density = 12,
}: ParticleBackgroundProps) {
  // density legacy est ramenée à un nombre raisonnable de pétales
  const count = Math.min(Math.max(Math.round(density / 7), 6), 24);
  return <KirakiraDecor count={count} />;
}
