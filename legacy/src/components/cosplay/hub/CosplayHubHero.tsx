/**
 * CosplayHubHero
 * Adaptive hero banner for the unified cosplay page.
 * Shows vitrine-style for completed, dashboard-style for in-progress.
 */

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Euro,
  Sparkles,
  Flame,
  Star,
  Target,
  Trophy,
  TrendingUp,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CosplayProject } from "@/hooks/useCosplayProject";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface CosplayHubHeroProps {
  cosplay: CosplayProject;
  liveBudget?: number;
  effectiveProgress?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  wishlist: { label: "Wishlist", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  started: { label: "En cours", color: "bg-[hsl(var(--mp-info))]/15 text-[hsl(var(--mp-info))] border-[hsl(var(--mp-info))]/30" },
  in_progress: { label: "En cours", color: "bg-[hsl(var(--mp-info))]/15 text-[hsl(var(--mp-info))] border-[hsl(var(--mp-info))]/30" },
  paused: { label: "En pause", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  finished: { label: "Terminé", color: "bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30" },
  completed: { label: "Terminé", color: "bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30" },
};

const FALLBACK_STATUS = { label: "Statut inconnu", color: "bg-white/10 text-white/70 border-white/20" };

const CRAFT_TYPE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  handmade: { label: "Fait Main", emoji: "✋", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" },
  bought: { label: "Acheté", emoji: "🛍️", color: "bg-slate-500/20 text-slate-300 border-slate-500/40" },
  mixed: { label: "Mixte", emoji: "🎨", color: "bg-purple-500/20 text-purple-400 border-purple-500/40" },
};

const getProgressColor = (p: number) => {
  if (p === 100) return "#00FF00";
  if (p >= 75) return "#00FF88";
  if (p >= 50) return "#00D4FF";
  return "hsl(var(--mp-info))";
};

export function CosplayHubHero({ cosplay, liveBudget, effectiveProgress }: CosplayHubHeroProps) {
  const navigate = useNavigate();
  const isCompleted = cosplay.status === "completed" || cosplay.status === "finished";
  const statusCfg = STATUS_CONFIG[cosplay.status] ?? FALLBACK_STATUS;
  const craftCfg = cosplay.craft_type ? CRAFT_TYPE_CONFIG[cosplay.craft_type] : null;

  const progress = effectiveProgress ?? cosplay.progress_level ?? 0;
  const progressColor = getProgressColor(progress);
  const budget = liveBudget ?? cosplay.budget ?? 0;

  if (isCompleted) {
    // ── Vitrine Hero (full-height, cinematic) ──
    return (
      <section className="relative h-[50vh] min-h-[360px] overflow-hidden">
        {cosplay.image_url ? (
          <img src={cosplay.image_url} alt={cosplay.character_name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <ImageIcon className="w-24 h-24 text-mp-ink-muted" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />

        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="absolute top-6 left-6 z-10">
          <Button variant="ghost" onClick={() => navigate("/espace-membre/vestiaire")} className="bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-black/60">
            <ArrowLeft className="w-4 h-4 mr-2" /> Mes cosplays
          </Button>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/40 text-xs">
                <Trophy className="w-3 h-3 mr-1" /> Terminé
              </Badge>
              {craftCfg && <Badge className={`border text-xs ${craftCfg.color}`}>{craftCfg.emoji} {craftCfg.label}</Badge>}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-2xl">{cosplay.character_name}</h1>
            <p className="text-xl text-slate-300 font-medium">{cosplay.universe}</p>
          </motion.div>
        </div>
      </section>
    );
  }

  // ── Project Hero (compact, dashboard-style) ──
  return (
    <div className="relative overflow-hidden">
      {cosplay.image_url && (
        <div className="absolute inset-0 bg-cover bg-center opacity-10 blur-2xl scale-110" style={{ backgroundImage: `url(${cosplay.image_url})` }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/80 to-slate-950" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-6 pb-0">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <Button onClick={() => navigate("/espace-membre/vestiaire")} variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Mes cosplays
          </Button>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end pb-6">
          {/* Project Image */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex-shrink-0 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            {cosplay.image_url ? (
              <img src={cosplay.image_url} alt={cosplay.character_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Sparkles className="w-10 h-10 text-white/20" /></div>
            )}
            {cosplay.priority > 0 && (
              <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <Flame className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </motion.div>

          {/* Project Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className={cn("text-xs border", statusCfg.color)}>{statusCfg.label}</Badge>
              {cosplay.target_year && (
                <Badge variant="outline" className="text-xs bg-black/40 border-white/20 text-white/60">
                  <Calendar className="w-3 h-3 mr-1" />{cosplay.target_year}
                </Badge>
              )}
              {cosplay.deadline && (
                <Badge variant="outline" className="text-xs bg-black/40 border-white/20 text-white/60">
                  <Target className="w-3 h-3 mr-1" />{format(parseISO(cosplay.deadline), "dd MMM yyyy", { locale: fr })}
                </Badge>
              )}
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-white leading-tight truncate">{cosplay.character_name}</h1>
            <p className="text-lg text-white/50 mt-1">{cosplay.universe}</p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex gap-3 flex-shrink-0">
            <div className="bg-black/40 backdrop-blur-md border border-[hsl(var(--mp-saffron))]/20 rounded-xl px-4 py-3 text-center min-w-[100px]">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Euro className="w-3.5 h-3.5 text-[hsl(var(--mp-saffron))]" />
                <span className="text-xs text-white/50 uppercase tracking-wider">Budget</span>
              </div>
              <p className="text-xl font-bold text-[hsl(var(--mp-saffron))]">{budget.toFixed(2)} €</p>
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-center min-w-[100px]">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--mp-info))]" />
                <span className="text-xs text-white/50 uppercase tracking-wider">Avancement</span>
              </div>
              <p className="text-xl font-bold" style={{ color: progressColor }}>{progress}%</p>
              <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: progressColor }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 80, damping: 20 }} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
