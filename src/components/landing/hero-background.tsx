"use client";

import { useEffect, useState } from "react";

/** Image figée (vignette de la vidéo Vimeo) servie comme poster du hero. */
const POSTER_URL =
  "https://i.vimeocdn.com/video/2038631910-2db81786a620fd3afe3f2de660f2cc5dae25be2b7f5ee16573324db242ba1658-d_1280x720?region=us";

const VIDEO_URL =
  "https://player.vimeo.com/video/1102758125?h=a073264c5c&background=1&autoplay=1&loop=1&muted=1&dnt=1";

/**
 * Fond du hero. Affiche toujours le poster (image légère, pas de CLS).
 * Ne monte l'iframe Vimeo que sur desktop, après le premier paint :
 * - mobile : poster seul → zéro JS tiers, zéro cookie tiers, zéro CLS ;
 * - desktop : la vidéo se superpose au poster une fois la page peinte.
 */
export function HeroBackground() {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    const id = window.setTimeout(() => setShowVideo(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={POSTER_URL}
        alt=""
        aria-hidden
        width={1280}
        height={720}
        fetchPriority="high"
        className="absolute inset-0 size-full object-cover"
      />
      {showVideo && (
        <iframe
          src={VIDEO_URL}
          allow="autoplay; fullscreen"
          title="Manga Paradise"
          className="absolute top-1/2 left-1/2 h-dvh min-h-[56.25vw] w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
        />
      )}
    </div>
  );
}
