"use client";

import { useState } from "react";
import { KumoCloud } from "@/components/landing/decorations";

function Torii() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="text-mp-primary size-[400px]"
      fill="none"
      aria-hidden
    >
      <ellipse
        cx="50"
        cy="18"
        rx="18"
        ry="6"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <rect x="28" y="32" width="44" height="5" rx="2" fill="currentColor" />
      <rect
        x="32"
        y="42"
        width="36"
        height="3.5"
        rx="1.5"
        fill="currentColor"
      />
      <rect x="34" y="42" width="5" height="48" rx="2" fill="currentColor" />
      <rect x="61" y="42" width="5" height="48" rx="2" fill="currentColor" />
    </svg>
  );
}

export function FinalCtaSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  }

  return (
    <section id="cta" className="bg-mp-sky relative overflow-hidden">
      <KumoCloud flip className="text-mp-sky" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04]">
        <Torii />
      </div>

      <div className="relative z-[1] mx-auto max-w-xl px-6 pt-10 pb-20 text-center">
        <span className="text-mp-primary text-sm font-bold tracking-wide uppercase">
          Prêt à rejoindre l&apos;aventure ?
        </span>
        <h2 className="text-foreground mt-2 text-3xl sm:text-4xl">
          Rejoins <span className="text-mp-primary">3 500</span> nakamas
        </h2>
        <p className="text-muted-foreground mt-3 mb-8">
          Inscris-toi à la liste d&apos;attente de la Beta Publique.
        </p>

        <form
          onSubmit={onSubmit}
          className="border-border bg-card mx-auto mb-4 flex max-w-md overflow-hidden rounded-full border shadow-sm"
        >
          <label htmlFor="cta-email" className="sr-only">
            Adresse e-mail
          </label>
          <input
            id="cta-email"
            type="email"
            required
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-foreground min-w-0 flex-1 bg-transparent px-5 py-3.5 text-sm outline-none"
          />
          <button
            type="submit"
            className="from-mp-primary via-mp-coral to-mp-orange bg-linear-to-br px-6 py-3.5 text-xs font-bold tracking-wide whitespace-nowrap text-white uppercase"
          >
            {submitted ? "✓ Inscrit !" : "S'inscrire"}
          </button>
        </form>

        <p className="text-muted-foreground text-sm">
          Beta prévue fin 2026 · Gratuit · Pas de spam 🍥
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {[
            "📸 Instagram · 3 200+ abonnés",
            "💬 Discord · Communauté active",
          ].map((label) => (
            <span
              key={label}
              className="border-border bg-card text-muted-foreground rounded-full border px-4 py-2 text-sm font-medium shadow-sm"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
