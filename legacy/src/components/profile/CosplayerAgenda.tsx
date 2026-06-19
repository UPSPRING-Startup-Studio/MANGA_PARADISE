/**
 * CosplayerAgenda Component
 * Profil cosplayer > "Mes line-ups & agenda"
 * 2 onglets : À venir / Historique
 * Source of truth: event_lineups table.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  MapPin,
  Swords,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Clock,
  History,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCosplayerAgenda, AgendaEntry } from "@/hooks/useCosplayerAgenda";

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function AgendaCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
    >
      <Card className="overflow-hidden bg-black/40 backdrop-blur-md border border-white/10">
        <CardContent className="p-0">
          <div className="flex items-stretch gap-0">
            <div className="flex flex-col items-center justify-center px-4 py-4 min-w-[72px] bg-gradient-to-b from-[hsl(var(--mp-info))]/5 to-[hsl(var(--mp-saffron))]/5 border-r border-white/10 gap-1">
              <Skeleton className="h-8 w-8 bg-white/10 rounded" />
              <Skeleton className="h-3 w-8 bg-white/10 rounded" />
            </div>
            <div className="flex-1 flex items-center gap-4 px-4 py-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-white/10 rounded" />
                <Skeleton className="h-3 w-1/2 bg-white/10 rounded" />
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Skeleton className="w-12 h-12 rounded-xl bg-white/10" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20 bg-white/10 rounded" />
                  <Skeleton className="h-3 w-16 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Agenda Card ─────────────────────────────────────────────────────────────

function AgendaCard({
  entry,
  index,
  variant,
}: {
  entry: AgendaEntry;
  index: number;
  variant: "upcoming" | "past";
}) {
  const navigate = useNavigate();
  const eventDate = parseISO(entry.event_start_date);
  const dayLabel = format(eventDate, "dd", { locale: fr });
  const monthLabel = format(eventDate, "MMM", { locale: fr }).toUpperCase();
  const fullDateLabel = format(eventDate, "EEEE d MMMM yyyy", { locale: fr });
  const locationLabel = entry.event_city || entry.event_location || null;
  const isPast = variant === "past";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="cursor-pointer"
      onClick={() => navigate(`/agenda/${entry.event_id}`)}
    >
      <Card
        className={cn(
          "overflow-hidden bg-black/40 backdrop-blur-md border transition-all duration-300",
          isPast
            ? "border-white/5 opacity-80 hover:opacity-100 hover:border-white/20"
            : "border-white/10 hover:border-[hsl(var(--mp-info))]/30 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)]"
        )}
      >
        <CardContent className="p-0">
          <div className="flex items-stretch gap-0">
            {/* Date Column */}
            <div
              className={cn(
                "flex flex-col items-center justify-center px-4 py-4 min-w-[72px] border-r border-white/10",
                isPast
                  ? "bg-white/[0.02]"
                  : "bg-gradient-to-b from-[hsl(var(--mp-info))]/15 to-[hsl(var(--mp-saffron))]/10"
              )}
            >
              <span
                className={cn(
                  "text-3xl font-black leading-none",
                  isPast ? "text-mp-ink-muted" : "text-white"
                )}
              >
                {dayLabel}
              </span>
              <span
                className={cn(
                  "text-xs font-bold tracking-widest mt-0.5",
                  isPast ? "text-mp-ink-muted" : "text-[hsl(var(--mp-info))]"
                )}
              >
                {monthLabel}
              </span>
            </div>

            {/* Event + Cosplay Info */}
            <div className="flex-1 flex items-center gap-4 px-4 py-3 min-w-0">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <p
                    className={cn(
                      "text-sm font-bold truncate",
                      isPast ? "text-slate-300" : "text-white"
                    )}
                  >
                    {entry.event_title}
                  </p>
                  <ExternalLink className="w-3 h-3 text-mp-ink-muted shrink-0" />
                </div>
                <p className="text-xs text-mp-ink-muted capitalize">
                  {fullDateLabel}
                </p>
                {locationLabel && (
                  <div className="flex items-center gap-1 text-xs text-mp-ink-muted">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{locationLabel}</span>
                  </div>
                )}
              </div>

              {/* Cosplay Info */}
              <div
                className="flex items-center gap-3 flex-shrink-0 group/cosplay"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(
                    `/espace-membre/cosplay/${entry.cosplay_plan_id}`
                  );
                }}
                role="button"
                tabIndex={0}
              >
                <Avatar className="w-12 h-12 rounded-xl border border-white/10 group-hover/cosplay:border-[hsl(var(--mp-primary))]/40 transition-colors">
                  <AvatarImage
                    src={entry.image_url ?? undefined}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-xl bg-gradient-to-br from-[hsl(var(--mp-primary))]/20 to-[hsl(var(--mp-info))]/20 text-white text-sm font-bold">
                    {entry.character_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1.5 min-w-0">
                  <p className="text-xs font-semibold text-white truncate max-w-[120px] group-hover/cosplay:text-[hsl(var(--mp-primary))] transition-colors">
                    {entry.character_name}
                  </p>
                  <p className="text-[10px] text-mp-ink-muted truncate max-w-[120px]">
                    {entry.universe}
                  </p>

                  {isPast ? (
                    <Badge className="text-[10px] px-2 py-0.5 h-auto bg-white/5 text-mp-ink-muted border-white/10">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                      Porté
                    </Badge>
                  ) : entry.is_in_wardrobe ? (
                    <Badge className="text-[10px] px-2 py-0.5 h-auto bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                      Prêt
                    </Badge>
                  ) : (
                    <div className="space-y-1">
                      <Badge className="text-[10px] px-2 py-0.5 h-auto bg-[hsl(var(--mp-saffron))]/20 text-[hsl(var(--mp-saffron))] border-[hsl(var(--mp-saffron))]/30">
                        <Sparkles className="w-2.5 h-2.5 mr-1" />
                        En cours · {entry.progress_level}%
                      </Badge>
                      <div className="w-20">
                        <Progress
                          value={entry.progress_level}
                          className="h-1 bg-white [&>div]:bg-gradient-to-r [&>div]:from-[hsl(var(--mp-primary))] [&>div]:to-[hsl(var(--mp-saffron))]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ message, icon: Icon }: { message: string; icon: any }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-8 text-center rounded-xl border border-dashed border-white/10 bg-black/20"
    >
      <div className="w-12 h-12 rounded-full bg-[hsl(var(--mp-info))]/10 border border-[hsl(var(--mp-info))]/20 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-[hsl(var(--mp-info))]/50" />
      </div>
      <p className="text-sm text-mp-ink-muted">{message}</p>
    </motion.div>
  );
}

// ─── Tab Button ──────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
        active
          ? "bg-[hsl(var(--mp-info))]/20 text-[hsl(var(--mp-info))] border border-[hsl(var(--mp-info))]/30"
          : "text-mp-ink-muted hover:text-slate-300 hover:bg-white/5"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {count > 0 && (
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full",
            active ? "bg-[hsl(var(--mp-info))]/20" : "bg-white/5"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Main Section ────────────────────────────────────────────────────────────

interface CosplayerAgendaSectionProps {
  userId: string | null | undefined;
}

export function CosplayerAgendaSection({
  userId,
}: CosplayerAgendaSectionProps) {
  const { isLoading, error, upcomingLineups, pastLineups } =
    useCosplayerAgenda(userId);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const entries = tab === "upcoming" ? upcomingLineups : pastLineups;
  const totalCount = upcomingLineups.length + pastLineups.length;

  console.log("[CosplayerAgendaSection] upcoming:", upcomingLineups.length, "| past:", pastLineups.length, "| active tab:", tab, "| entries shown:", entries.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="bg-card rounded-xl p-6 border"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display text-foreground flex items-center gap-2">
          <Swords className="w-5 h-5 text-[hsl(var(--mp-info))]" />
          Agenda Cosplay
        </h3>
        {totalCount > 0 && (
          <Badge className="bg-[hsl(var(--mp-info))]/20 text-[hsl(var(--mp-info))] border-[hsl(var(--mp-info))]/30 text-xs">
            {totalCount} sortie{totalCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <TabButton
          active={tab === "upcoming"}
          onClick={() => setTab("upcoming")}
          icon={Clock}
          label="À venir"
          count={upcomingLineups.length}
        />
        <TabButton
          active={tab === "past"}
          onClick={() => setTab("past")}
          icon={History}
          label="Historique"
          count={pastLineups.length}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <AgendaCardSkeleton key={i} index={i} />
          ))}
        </div>
      ) : error ? null : entries.length === 0 ? (
        <EmptyState
          message={
            tab === "upcoming"
              ? "Aucun événement à venir planifié"
              : "Aucun historique d'événement"
          }
          icon={tab === "upcoming" ? Calendar : History}
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {entries.map((entry, index) => (
                <AgendaCard
                  key={entry.lineup_id}
                  entry={entry}
                  index={index}
                  variant={tab === "upcoming" ? "upcoming" : "past"}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
