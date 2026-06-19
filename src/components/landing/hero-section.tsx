"use client";

import { m } from "motion/react";
import { SakuraPetals, KumoCloud } from "@/components/landing/decorations";

const LOGO_URL =
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768062945/Logo_Manga_Paradise_VIERGE_xhahrh.png";
const PHONE_URL =
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1773148067/APP_TEL_3_tzyjnv.png";

const PERSONAS = [
  { emoji: "🎌", color: "bg-mp-primary" },
  { emoji: "🎭", color: "bg-mp-otaku" },
  { emoji: "👾", color: "bg-mp-cosplayer" },
  { emoji: "🎮", color: "bg-mp-gamer" },
  { emoji: "🎨", color: "bg-mp-creatif" },
] as const;

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export function HeroSection() {
  return (
    <section className="bg-mp-night relative min-h-dvh overflow-hidden">
      {/* Fond vidéo Vimeo */}
      <div className="absolute inset-0 z-0">
        <iframe
          src="https://player.vimeo.com/video/1102758125?h=a073264c5c&badge=0&autopause=0&autoplay=1&loop=1&muted=1&background=1"
          allow="autoplay; fullscreen"
          title="Manga Paradise"
          className="absolute top-1/2 left-1/2 h-dvh min-h-[56.25vw] w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      {/* Voile dégradé pour la lisibilité + fondu vers la section suivante */}
      <div className="from-mp-night/60 via-mp-night/30 to-background absolute inset-0 z-[1] bg-linear-to-b" />
      <SakuraPetals />

      <div className="relative z-[3] mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-6 pt-36 pb-20">
        <div className="min-w-[300px] flex-[1_1_500px]">
          {/* Badge logo */}
          <m.div
            {...fadeUp}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 py-2 pr-4 pl-2 backdrop-blur-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_URL}
              alt="Manga Paradise"
              className="h-7 w-auto brightness-0 invert"
            />
            <span className="text-xs font-bold tracking-widest text-white">
              MANGA PARADISE
            </span>
          </m.div>

          {/* Titre */}
          <m.h1
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mb-5 text-4xl text-white drop-shadow-lg sm:text-5xl lg:text-6xl"
          >
            LE 1<sup className="text-[0.5em]">ER</sup> RÉSEAU SOCIAL
            <br />
            <span className="text-mp-primary">POP CULTURE</span>
            <br />
            JAPONAISE
          </m.h1>

          {/* Sous-titre */}
          <m.p
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg"
          >
            Le premier écosystème phygital dédié à la pop culture japonaise.
            Otaku, Cosplayeur, Gamer ou Créatif : centralise ton identité, gère
            tes événements et connecte-toi à la communauté.
          </m.p>

          {/* CTAs */}
          <m.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mb-8 flex flex-wrap gap-3.5"
          >
            <a
              href="#cta"
              className="from-mp-primary via-mp-coral to-mp-orange [animation:glow-pulse_3s_ease-in-out_infinite] rounded-full bg-linear-to-br px-7 py-3.5 text-sm font-bold tracking-wide text-white uppercase shadow-lg transition-transform hover:scale-105"
            >
              Rejoindre la Beta
            </a>
            <a
              href="#features"
              className="rounded-full border-2 border-white/60 px-7 py-3.5 text-sm font-bold tracking-wide text-white uppercase transition-colors hover:border-white hover:bg-white/15"
            >
              Découvrir
            </a>
          </m.div>

          {/* Preuve sociale */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex items-center gap-2.5"
          >
            <div className="flex">
              {PERSONAS.map((p, i) => (
                <span
                  key={p.emoji}
                  className={`${p.color} grid size-8 place-items-center rounded-full border-2 border-white/80 text-xs ${
                    i > 0 ? "-ml-2" : ""
                  }`}
                >
                  {p.emoji}
                </span>
              ))}
            </div>
            <span className="text-sm font-semibold text-white/80">
              +3 500 membres actifs
            </span>
          </m.div>
        </div>

        {/* Mockup téléphone */}
        <m.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="-mb-28 flex-[0_0_auto] [animation:float-y_6s_ease-in-out_infinite]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PHONE_URL}
            alt="L'application Manga Paradise"
            className="w-[clamp(240px,28vw,340px)] drop-shadow-2xl"
          />
        </m.div>
      </div>

      <div className="absolute inset-x-0 -bottom-px z-[4]">
        <KumoCloud className="text-mp-sand" />
      </div>
    </section>
  );
}
