"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { KumoCloud } from "@/components/landing/decorations";
import {
  CosCardWidget,
  QuestsWidget,
  RadarWidget,
} from "@/components/landing/feature-widgets";

const LINEUP_URL =
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1773148066/TEL_APP_2_ejxnbu.png";

type Widget = "radar" | "lineup" | "coscard" | "quests";

type Slide = {
  emoji: string;
  label: string;
  accentText: string;
  accentTint: string;
  dot: string;
  description: string;
  details: string[];
  widget: Widget;
};

const SLIDES: Slide[] = [
  {
    emoji: "📍",
    label: "Le Radar Géolocalisé",
    accentText: "text-mp-primary",
    accentTint: "bg-mp-primary/10",
    dot: "bg-mp-primary",
    description: "Découvre la communauté autour de toi en toute sécurité.",
    details: [
      "Carte interactive avec position floue (±500 m)",
      "Filtre par profil : otakus, cosplayers, gamers",
      "Slider de rayon : 5 km à 100 km",
      "Ton marqueur doré pour te repérer",
    ],
    widget: "radar",
  },
  {
    emoji: "🗓️",
    label: "Le Visual Line-Up",
    accentText: "text-mp-cosplayer",
    accentTint: "bg-mp-cosplayer/10",
    dot: "bg-mp-cosplayer",
    description:
      "Annonce ta présence et le cosplay que tu porteras jour par jour.",
    details: [
      "Affecte un costume à chaque journée",
      "Génère automatiquement une Story exportable",
      "Agenda public visible par la communauté",
      "Vois quels nakamas participent",
    ],
    widget: "lineup",
  },
  {
    emoji: "💳",
    label: "La Cos-Card Digitale",
    accentText: "text-mp-otaku",
    accentTint: "bg-mp-otaku/10",
    dot: "bg-mp-otaku",
    description: "Ta carte de membre digitale pour les conventions.",
    details: [
      "QR Code — scan = ajout en ami instantané",
      "Animation de connexion unique",
      "Badges de convention collectionnables",
      "5 scans → badge « Sociable » débloqué",
    ],
    widget: "coscard",
  },
  {
    emoji: "🏆",
    label: "Quêtes IRL & OTK",
    accentText: "text-mp-orange",
    accentTint: "bg-mp-orange/10",
    dot: "bg-mp-orange",
    description: "La vie réelle rapporte des Otaku Coins.",
    details: [
      "Niveaux : Genin → Chūnin → Hokage",
      "Scan QR Code en boutique = +OTK",
      "Participe aux ateliers = XP + badges",
      "Échange OTK contre goodies et billets",
    ],
    widget: "quests",
  },
];

function SlideWidget({ widget }: { widget: Widget }) {
  if (widget === "radar") return <RadarWidget />;
  if (widget === "coscard") return <CosCardWidget />;
  if (widget === "quests") return <QuestsWidget />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LINEUP_URL}
      alt="Visual Line-Up"
      className="mx-auto max-h-[340px] w-full object-contain drop-shadow-2xl"
    />
  );
}

export function FeaturesSection() {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef(0);

  const go = useCallback((dir: number) => {
    setCurrent((p) => (p + dir + SLIDES.length) % SLIDES.length);
  }, []);

  const slide = SLIDES[current]!;

  return (
    <section id="features" className="bg-mp-sand relative">
      <div className="relative z-[2] -mt-px">
        <KumoCloud flip className="text-mp-sand" />
      </div>

      <div className="mx-auto max-w-xl px-6 pt-10 text-center">
        <span className="text-mp-primary text-sm font-bold tracking-wide uppercase">
          Fonctionnalités Killers
        </span>
        <h2 className="text-foreground mt-2 text-3xl sm:text-4xl">
          L&apos;app qui change tout
        </h2>
      </div>

      <div
        className="relative mx-auto max-w-5xl px-6 pt-12 md:px-20"
        onTouchStart={(e) => {
          touchStart.current = e.touches[0]!.clientX;
        }}
        onTouchEnd={(e) => {
          const diff = touchStart.current - e.changedTouches[0]!.clientX;
          if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1);
        }}
      >
        <button
          type="button"
          aria-label="Précédent"
          onClick={() => go(-1)}
          className="border-mp-primary text-mp-primary hover:bg-mp-primary absolute top-1/2 left-2 z-[5] hidden size-12 -translate-y-1/2 place-items-center rounded-full border-2 bg-white/80 backdrop-blur transition-colors hover:text-white md:grid"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Suivant"
          onClick={() => go(1)}
          className="border-mp-primary text-mp-primary hover:bg-mp-primary absolute top-1/2 right-2 z-[5] hidden size-12 -translate-y-1/2 place-items-center rounded-full border-2 bg-white/80 backdrop-blur transition-colors hover:text-white md:grid"
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Viewport à hauteur fixe : les slides en absolute ne poussent pas la hauteur */}
        <div className="relative h-[680px] sm:h-[600px] md:h-[440px]">
          <AnimatePresence>
            <m.div
              key={current}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-8 md:flex-row md:gap-10"
            >
              <div className="w-full md:flex-1">
                <div
                  className={`mb-3.5 inline-flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-2.5 ${slide.accentTint}`}
                >
                  <span className="text-lg">{slide.emoji}</span>
                  <span className={`text-sm font-bold ${slide.accentText}`}>
                    {slide.label}
                  </span>
                </div>
                <p className="text-muted-foreground mb-4.5 max-w-md text-lg leading-relaxed">
                  {slide.description}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {slide.details.map((d) => (
                    <li
                      key={d}
                      className="text-muted-foreground flex items-start gap-2 text-sm"
                    >
                      <span
                        className={`mt-0.5 text-xs font-bold ${slide.accentText}`}
                      >
                        ✦
                      </span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full justify-center md:flex-1">
                <div className="w-full max-w-[300px] sm:max-w-[340px]">
                  <SlideWidget widget={slide.widget} />
                </div>
              </div>
            </m.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.label}
              type="button"
              aria-label={`Aller à ${s.label}`}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                current === i ? `w-6 ${s.dot}` : "bg-border w-2"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="relative z-[2] mt-12">
        <KumoCloud className="text-background" />
      </div>
    </section>
  );
}
