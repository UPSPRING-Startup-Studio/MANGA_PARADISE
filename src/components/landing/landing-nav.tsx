"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

const LOGO_URL =
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1768062945/Logo_Manga_Paradise_VIERGE_xhahrh.png";

/**
 * Barre de navigation de la landing : transparente au-dessus du hero,
 * devient opaque au scroll. Le bouton « Mon compte » mène au login
 * (ou à l'espace membre si déjà connecté).
 */
export function LandingNav({ isAuthed }: { isAuthed: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/90 border-border border-b shadow-sm backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:h-20">
        <Link href="/" aria-label="Accueil Manga Paradise">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_URL}
            alt="Manga Paradise"
            className={cn(
              "h-9 w-auto object-contain transition-all duration-300",
              !scrolled && "brightness-0 invert",
            )}
          />
        </Link>

        <Link
          href={isAuthed ? "/espace-membre" : "/login"}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold tracking-wide uppercase transition-all duration-200",
            scrolled
              ? "bg-mp-primary text-white hover:opacity-90"
              : "border-2 border-white/50 text-white hover:bg-white/15",
          )}
        >
          <User className="size-4" />
          {isAuthed ? "Mon espace" : "Mon compte"}
        </Link>
      </div>
    </header>
  );
}
