import { Camera, Shirt, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventContributionBannerProps {
  onAddPhotos: () => void;
  onViewMyCosplays: () => void;
}

/**
 * Bandeau CTA affiché sur un événement passé pour les participants éligibles.
 * Invite les cosplayers à enrichir la galerie communautaire.
 * Design : gradient contrasté, glow subtil, hiérarchie claire.
 */
export default function EventContributionBanner({
  onAddPhotos,
  onViewMyCosplays,
}: EventContributionBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* ── Background gradient ───────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(13,148,136,0.18) 0%, rgba(168,85,247,0.12) 50%, rgba(199,0,57,0.08) 100%)",
        }}
      />
      {/* Glow spot */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(13,148,136,0.6), transparent 70%)" }}
      />

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="relative p-5 sm:p-6 space-y-4" style={{ border: "1px solid rgba(13,148,136,0.25)", borderRadius: 16 }}>
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Camera className="w-5 h-5 text-teal-400" />
          </div>
          <div className="min-w-0">
            <h3
              className="flex items-center gap-1.5"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 800,
                fontSize: 16,
                color: "#F0F0FF",
                letterSpacing: "-0.01em",
              }}
            >
              Tu étais à cet événement ?
              <Sparkles className="w-4 h-4 text-teal-400 flex-shrink-0" />
            </h3>
            <p
              className="mt-1"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "rgba(200,200,220,0.7)",
                lineHeight: 1.55,
              }}
            >
              Ajoute tes photos depuis ton vestiaire ou importe de nouvelles images
              pour enrichir la galerie de la communauté.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2.5 pl-[52px]">
          <Button
            onClick={onAddPhotos}
            className="bg-teal-500 hover:bg-teal-400 text-white gap-2 font-bold text-sm shadow-lg shadow-teal-500/25 transition-all hover:shadow-teal-400/30 hover:scale-[1.02]"
          >
            <Camera className="w-4 h-4" />
            Ajouter mes photos
          </Button>

          <Button
            onClick={onViewMyCosplays}
            variant="outline"
            className="border-white/15 text-white/70 hover:text-white hover:bg-white/10 gap-2 text-sm"
          >
            <Shirt className="w-4 h-4" />
            Voir mes cosplays liés
          </Button>
        </div>
      </div>
    </div>
  );
}
