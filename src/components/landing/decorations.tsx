import { cn } from "@/lib/utils";

/**
 * Séparateur « nuage » (kumo) entre deux sections.
 * La couleur de remplissage suit `currentColor` → se pilote via une classe
 * de texte tokenisée (ex. `text-mp-sand`). `flip` retourne le nuage.
 */
export function KumoCloud({
  className,
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "w-full overflow-hidden leading-[0]",
        flip && "-scale-y-100",
        className,
      )}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="block h-20 w-full"
      >
        <path
          d="M0,120 C120,100 180,40 320,60 C420,75 480,20 600,40 C720,60 780,10 900,30 C1020,50 1080,15 1200,35 C1300,50 1380,20 1440,40 L1440,120 Z"
          fill="currentColor"
        />
        <path
          d="M0,120 C160,90 240,50 400,70 C520,85 580,35 720,50 C860,65 920,25 1060,45 C1160,58 1280,30 1440,55 L1440,120 Z"
          fill="currentColor"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}

/** Positions déterministes (pas de Math.random → pas de mismatch d'hydratation). */
const PETALS = [
  { left: "10%", delay: "0s", duration: "9s", size: 12 },
  { left: "26%", delay: "1.8s", duration: "11s", size: 16 },
  { left: "44%", delay: "3.6s", duration: "8.5s", size: 11 },
  { left: "62%", delay: "5.4s", duration: "10.5s", size: 15 },
  { left: "78%", delay: "7.2s", duration: "9.5s", size: 13 },
  { left: "90%", delay: "2.4s", duration: "12s", size: 10 },
] as const;

/** Pluie de pétales de sakura (décor pur CSS, non interactif). */
export function SakuraPetals() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
    >
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="bg-mp-sakura absolute top-[-20px] opacity-0 [animation-iteration-count:infinite] [animation-name:sakura-fall] [animation-timing-function:ease-in]"
          style={{
            left: p.left,
            width: p.size,
            height: p.size * 0.7,
            borderRadius: "50% 0 50% 50%",
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}
