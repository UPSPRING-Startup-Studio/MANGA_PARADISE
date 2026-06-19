/**
 * OverviewTab — Dashboard de pilotage du cosplay.
 * Cartes de synthèse avec liens vers les onglets spécialisés.
 * Pas de galerie photo détaillée ici.
 */

import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Calendar,
  Camera,
  FolderOpen,
  Euro,
  Sparkles,
  ArrowRight,
  MapPin,
  ExternalLink,
  KanbanSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CosplayProject } from "@/hooks/useCosplayProject";
import { useLineupsByCosplay } from "@/hooks/useUnifiedLineups";
import { useCosplayPhotos } from "@/hooks/useCosplayPhotos";
import { useShowcasePhotos } from "@/hooks/useShowcasePhotos";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  wishlist: "Wishlist",
  started: "En cours",
  in_progress: "En cours",
  paused: "En pause",
  finished: "Terminé",
  completed: "Terminé",
};

const getProgressColor = (p: number) => {
  if (p === 100) return "#00FF00";
  if (p >= 75) return "#00FF88";
  if (p >= 50) return "#00D4FF";
  return "hsl(var(--mp-info))";
};

// ─── Dashboard Card Shell ─────────────────────────────────────────────────────

function DashboardCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className="bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all h-full">
        <CardContent className="p-5 flex flex-col h-full">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Tab Link ─────────────────────────────────────────────────────────────────

function TabLink({
  label,
  tab,
  accent = "text-[hsl(var(--mp-primary))]",
}: {
  label: string;
  tab: string;
  accent?: string;
}) {
  const [, setSearchParams] = useSearchParams();

  return (
    <button
      onClick={() => setSearchParams({ tab })}
      className={cn(
        "mt-auto pt-3 flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80",
        accent
      )}
    >
      {label}
      <ArrowRight className="w-3.5 h-3.5" />
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface OverviewTabProps {
  cosplay: CosplayProject;
  userId: string;
}

export function OverviewTab({ cosplay, userId }: OverviewTabProps) {
  const navigate = useNavigate();
  const { data: lineups = [] } = useLineupsByCosplay(cosplay.id);
  const { data: wipPhotos = [] } = useCosplayPhotos(cosplay.id);
  const { data: showcasePhotos = [] } = useShowcasePhotos(cosplay.id);

  const totalPhotos = wipPhotos.length + showcasePhotos.length;
  const progressColor = getProgressColor(cosplay.progress_level);
  const isCompleted =
    cosplay.status === "completed" || cosplay.status === "finished";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* ── Card 1 : Progression & statut ── */}
      <DashboardCard delay={0}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--mp-info))]/10 border border-[hsl(var(--mp-info))]/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[hsl(var(--mp-info))]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Progression & statut
            </h3>
            <p className="text-xs text-mp-ink-muted">
              {STATUS_LABELS[cosplay.status] ?? cosplay.status}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-mp-ink-muted">Avancement</span>
            <span className="font-bold" style={{ color: progressColor }}>
              {cosplay.progress_level}%
            </span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: progressColor }}
              initial={{ width: 0 }}
              animate={{ width: `${cosplay.progress_level}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            />
          </div>
        </div>

        {/* Budget + year row */}
        <div className="flex items-center gap-4 text-xs text-mp-ink-muted">
          {cosplay.budget != null && (
            <div className="flex items-center gap-1">
              <Euro className="w-3.5 h-3.5 text-[hsl(var(--mp-saffron))]" />
              <span className="text-white font-semibold">
                {cosplay.budget} €
              </span>
            </div>
          )}
          {cosplay.target_year > 0 && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[hsl(var(--mp-info))]" />
              <span>{cosplay.target_year}</span>
            </div>
          )}
        </div>

        <TabLink
          label="Ouvrir les tâches"
          tab="tasks"
          accent="text-[hsl(var(--mp-info))]"
        />
      </DashboardCard>

      {/* ── Card 2 : Line-up cosplay ── */}
      <DashboardCard delay={0.05}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--mp-saffron))]/10 border border-[hsl(var(--mp-saffron))]/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[hsl(var(--mp-saffron))]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Line-up cosplay</h3>
            <p className="text-xs text-mp-ink-muted">
              Tes prochaines apparitions avec ce cosplay.
            </p>
          </div>
        </div>

        {lineups.length > 0 ? (
          <div className="space-y-2 mb-2">
            {lineups.slice(0, 3).map((l) => (
              <div
                key={l.id}
                onClick={() => l.event && navigate(`/agenda/${l.event.id}`)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--mp-saffron))]/5 border border-[hsl(var(--mp-saffron))]/15 cursor-pointer hover:bg-[hsl(var(--mp-saffron))]/10 hover:border-[hsl(var(--mp-saffron))]/30 transition-all group"
                role="button"
                tabIndex={0}
              >
                <Calendar className="w-3.5 h-3.5 text-[hsl(var(--mp-saffron))] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-[hsl(var(--mp-saffron))] transition-colors">
                    {l.event?.title}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-mp-ink-muted">
                      {l.event?.date
                        ? new Date(l.event.date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })
                        : ""}
                    </span>
                    {l.event?.city && (
                      <>
                        <span className="text-[10px] text-mp-ink-muted">·</span>
                        <MapPin className="w-2.5 h-2.5 text-mp-ink-muted" />
                        <span className="text-[10px] text-mp-ink-muted truncate">
                          {l.event.city}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-mp-ink-muted group-hover:text-[hsl(var(--mp-saffron))] transition-colors shrink-0" />
              </div>
            ))}
            {lineups.length > 3 && (
              <p className="text-[10px] text-mp-ink-muted pl-1">
                +{lineups.length - 3} autre
                {lineups.length - 3 > 1 ? "s" : ""}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-mp-ink-muted mb-2">
            Aucun événement programmé pour ce cosplay.
          </p>
        )}

        <TabLink
          label="Voir toute la line-up"
          tab="lineup"
          accent="text-[hsl(var(--mp-saffron))]"
        />
      </DashboardCard>

      {/* ── Card 3 : Photos ── */}
      <DashboardCard delay={0.1}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Camera className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Photos</h3>
            <p className="text-xs text-mp-ink-muted">
              Galerie complète de ce cosplay.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{totalPhotos}</p>
            <p className="text-[10px] text-mp-ink-muted uppercase tracking-wider">
              Photos
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{wipPhotos.length}</p>
            <p className="text-[10px] text-mp-ink-muted uppercase tracking-wider">
              Projet
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {showcasePhotos.length}
            </p>
            <p className="text-[10px] text-mp-ink-muted uppercase tracking-wider">
              Vitrine
            </p>
          </div>
        </div>

        {/* Mini photo preview: show up to 4 thumbnails */}
        {totalPhotos > 0 && (
          <div className="flex gap-1.5 mb-2">
            {[...showcasePhotos, ...wipPhotos].slice(0, 4).map((p: any) => (
              <div
                key={p.id}
                className="w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0"
              >
                <img
                  src={p.image_url || p.photo_url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
            {totalPhotos > 4 && (
              <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] text-mp-ink-muted font-semibold">
                  +{totalPhotos - 4}
                </span>
              </div>
            )}
          </div>
        )}

        <TabLink
          label="Ouvrir la galerie photos"
          tab="photos"
          accent="text-teal-400"
        />
      </DashboardCard>

      {/* ── Card 4 : Dossiers ── */}
      <DashboardCard delay={0.15}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--mp-saffron))]/10 border border-[hsl(var(--mp-saffron))]/20 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-[hsl(var(--mp-saffron))]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Dossiers</h3>
            <p className="text-xs text-mp-ink-muted">
              Fichiers de référence et organisation.
            </p>
          </div>
        </div>

        <p className="text-xs text-mp-ink-muted mb-2">
          Organise tes patrons, tutoriels et références dans des dossiers
          dédiés.
        </p>

        <TabLink
          label="Ouvrir les dossiers"
          tab="files"
          accent="text-[hsl(var(--mp-saffron))]"
        />
      </DashboardCard>
    </div>
  );
}
