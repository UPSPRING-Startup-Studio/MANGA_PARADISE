/**
 * LineupTab — Line-up cosplay.
 * Les événements passés et à venir où tu porteras ce cosplay.
 * Source de vérité unique : event_lineups via useUnifiedLineups.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  X,
  MapPin,
  Loader2,
  Users,
  UserPlus,
  Swords,
  Clock,
  History,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CosplayProject } from "@/hooks/useCosplayProject";
import {
  useAllLineupsByCosplay,
  useAssignCosplayToEventUnified,
  useRemoveLineup,
  UnifiedLineup,
} from "@/hooks/useUnifiedLineups";
import { splitLineups } from "@/lib/splitLineups";
import { useUpcomingEvents } from "@/hooks/useEvents";
import { PartyFinderModal } from "@/components/cosplay/PartyFinderModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatDateShort = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const today = () => new Date().toISOString().slice(0, 10);

// ─── Event Row ────────────────────────────────────────────────────────────────

interface EventRowProps {
  lineup: UnifiedLineup;
  variant: "upcoming" | "past";
  onRemove: (l: UnifiedLineup) => void;
  isRemoving: boolean;
}

const EventRow = React.forwardRef<HTMLDivElement, EventRowProps>(
  function EventRow({ lineup, variant, onRemove, isRemoving }, ref) {
    const navigate = useNavigate();
    const event = lineup.event;
    if (!event) return null;

    const isPast = variant === "past";

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 8 }}
        className={`
          group flex items-center gap-4 p-4 rounded-xl border transition-all
          ${
            isPast
              ? "bg-white/[0.02] border-white/5 opacity-70 hover:opacity-100"
              : "bg-[hsl(var(--mp-info))]/5 border-[hsl(var(--mp-info))]/20 hover:border-[hsl(var(--mp-info))]/40 hover:bg-[hsl(var(--mp-info))]/10"
          }
        `}
      >
        {/* Date column */}
        <div
          className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${
            isPast
              ? "bg-white/5 border border-white/10"
              : "bg-[hsl(var(--mp-info))]/10 border border-[hsl(var(--mp-info))]/20"
          }`}
        >
          <span
            className={`text-lg font-bold leading-none ${
              isPast ? "text-mp-ink-muted" : "text-[hsl(var(--mp-info))]"
            }`}
          >
            {new Date(event.date).getDate()}
          </span>
          <span
            className={`text-[10px] uppercase tracking-wider ${
              isPast ? "text-mp-ink-muted" : "text-[hsl(var(--mp-info))]/70"
            }`}
          >
            {new Date(event.date).toLocaleDateString("fr-FR", {
              month: "short",
            })}
          </span>
        </div>

        {/* Event info */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold truncate ${
              isPast ? "text-slate-300" : "text-white"
            }`}
          >
            {event.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-mp-ink-muted">
              {formatDateShort(event.date)}
            </span>
            {event.city && (
              <>
                <span className="text-[11px] text-mp-ink-muted">·</span>
                <div className="flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5 text-mp-ink-muted" />
                  <span className="text-[11px] text-mp-ink-muted truncate max-w-[120px]">
                    {event.city}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`/agenda/${event.id}`)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-mp-ink-muted hover:text-white hover:bg-white/10 transition-all"
            title="Voir l'événement"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </motion.button>

          {!isPast && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onRemove(lineup)}
              disabled={isRemoving}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/0 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-mp-ink-muted hover:text-red-400 transition-all disabled:opacity-50"
              title="Retirer de la line-up"
            >
              {isRemoving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }
);

// ─── Add Event Dialog ─────────────────────────────────────────────────────────

function AddEventDialog({
  open,
  onClose,
  cosplayProjectId,
  userId,
  assignedEventIds,
}: {
  open: boolean;
  onClose: () => void;
  cosplayProjectId: string;
  userId: string;
  assignedEventIds: string[];
}) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const { data: upcomingEvents = [], isLoading } = useUpcomingEvents();
  const assignMutation = useAssignCosplayToEventUnified();

  const available = upcomingEvents.filter(
    (e) => !assignedEventIds.includes(e.id)
  );

  const handleConfirm = async () => {
    if (!selectedEventId) return;
    const event = upcomingEvents.find((e) => e.id === selectedEventId);
    await assignMutation.mutateAsync({
      cosplayProjectId,
      eventId: selectedEventId,
      userId,
      eventDate: event?.date ?? new Date().toISOString().slice(0, 10),
    });
    setSelectedEventId("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        setSelectedEventId("");
        onClose();
      }}
    >
      <DialogContent className="max-w-md bg-slate-950 border border-[hsl(var(--mp-info))]/30 shadow-[0_0_40px_rgba(0,240,255,0.1)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <Calendar className="w-5 h-5 text-[hsl(var(--mp-info))]" />
            Associer à un événement
          </DialogTitle>
          <DialogDescription className="text-mp-ink-muted text-sm">
            Sélectionne un événement futur pour y porter ce cosplay.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-mp-ink-muted text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
            </div>
          ) : available.length === 0 ? (
            <div className="py-6 text-center">
              <Calendar className="w-10 h-10 text-mp-ink-muted mx-auto" />
              <p className="text-sm text-mp-ink-muted mt-2">
                Aucun événement futur disponible.
              </p>
            </div>
          ) : (
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="bg-black/40 border-white/20 text-white h-12">
                <SelectValue placeholder="Choisir un événement…" />
              </SelectTrigger>
              <SelectContent className="bg-mp-paper border-white/10 text-white max-h-60">
                {available.map((event) => (
                  <SelectItem
                    key={event.id}
                    value={event.id}
                    className="focus:bg-white/10 focus:text-white py-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{event.title}</span>
                      <span className="text-xs text-mp-ink-muted">
                        {formatDateShort(event.date)}
                        {event.city ? ` · ${event.city}` : ""}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedEventId("");
                onClose();
              }}
              className="flex-1 border-white/20 text-slate-300 hover:bg-white/5"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedEventId || assignMutation.isPending}
              className="flex-1 font-bold bg-gradient-to-r from-[hsl(var(--mp-info))]/20 to-[hsl(var(--mp-info))]/10 border border-[hsl(var(--mp-info))]/50 text-[hsl(var(--mp-info))] hover:from-[hsl(var(--mp-info))]/30 hover:to-[hsl(var(--mp-info))]/20 disabled:opacity-50 transition-all"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assignation…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Confirmer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

interface LineupTabProps {
  cosplay: CosplayProject;
  userId: string;
}

export function LineupTab({ cosplay, userId }: LineupTabProps) {
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [partyFinderOpen, setPartyFinderOpen] = useState(false);

  const { data: allLineups = [], isLoading } = useAllLineupsByCosplay(
    cosplay.id
  );
  const removeMutation = useRemoveLineup();

  // Split via shared utility (uses end_date ?? date)
  const { upcoming, past } = splitLineups(allLineups);

  console.log("[LineupTab]", cosplay.character_name, "| total:", allLineups.length, "| upcoming:", upcoming.length, "| past:", past.length);

  const assignedEventIds = allLineups.map((l) => l.event_id);

  const handleRemove = async (lineup: UnifiedLineup) => {
    await removeMutation.mutateAsync({ lineupId: lineup.id });
  };

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--mp-info))]/20 flex items-center justify-center">
            <Swords className="w-4 h-4 text-[hsl(var(--mp-info))]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Line-up cosplay</h2>
            <p className="text-xs text-mp-ink-muted">
              Les événements passés et à venir où tu porteras ce cosplay.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setAddEventOpen(true)}
          size="sm"
          className="font-semibold bg-gradient-to-r from-[hsl(var(--mp-info))]/20 to-[hsl(var(--mp-info))]/10 border border-[hsl(var(--mp-info))]/40 text-[hsl(var(--mp-info))] hover:from-[hsl(var(--mp-info))]/30 hover:to-[hsl(var(--mp-info))]/20 hover:border-[hsl(var(--mp-info))]/70 transition-all"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Associer à un événement
        </Button>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-[72px] rounded-xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ── À venir ── */}
      {!isLoading && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[hsl(var(--mp-info))]" />
            <h3 className="text-sm font-semibold text-slate-300">À venir</h3>
            {upcoming.length > 0 && (
              <span className="text-[10px] text-mp-ink-muted bg-white/5 px-2 py-0.5 rounded-full">
                {upcoming.length}
              </span>
            )}
          </div>

          {upcoming.length > 0 ? (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {upcoming.map((l) => (
                  <EventRow
                    key={l.id}
                    lineup={l}
                    variant="upcoming"
                    onRemove={handleRemove}
                    isRemoving={removeMutation.isPending}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-center space-y-3">
              <Calendar className="w-10 h-10 text-mp-ink-muted" />
              <div>
                <p className="text-sm font-medium text-mp-ink-muted">
                  Aucun événement à venir
                </p>
                <p className="text-xs text-mp-ink-muted mt-1">
                  Associe ce cosplay à un événement futur.
                </p>
              </div>
              <Button
                onClick={() => setAddEventOpen(true)}
                size="sm"
                variant="outline"
                className="border-[hsl(var(--mp-info))]/30 text-[hsl(var(--mp-info))] hover:bg-[hsl(var(--mp-info))]/10 mt-1"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Associer à un
                événement
              </Button>
            </div>
          )}
        </section>
      )}

      {/* ── Historique ── */}
      {!isLoading && past.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-mp-ink-muted" />
            <h3 className="text-sm font-semibold text-mp-ink-muted">Historique</h3>
            <span className="text-[10px] text-mp-ink-muted bg-white/5 px-2 py-0.5 rounded-full">
              {past.length}
            </span>
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {past.map((l) => (
                <EventRow
                  key={l.id}
                  lineup={l}
                  variant="past"
                  onRemove={handleRemove}
                  isRemoving={removeMutation.isPending}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* ── Divider before Party Finder ── */}
      {!isLoading && <div className="h-px bg-white/10" />}

      {/* ── Party Finder CTA ── */}
      {!isLoading && (
        <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-white/10 p-6 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[hsl(var(--mp-info))]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-2">
            <Users className="w-4 h-4 text-[hsl(var(--mp-info))]" />
            <h3 className="text-sm font-medium text-slate-300">
              Trouver une escouade
            </h3>
          </div>
          <p className="relative z-10 text-xs text-mp-ink-muted">
            Rejoins ou crée un groupe de cosplayers pour un événement.
          </p>
          <Button
            onClick={() => setPartyFinderOpen(true)}
            className="relative z-10 w-full h-12 font-bold bg-gradient-to-r from-[hsl(var(--mp-info))]/20 to-[hsl(var(--mp-saffron))]/20 border border-[hsl(var(--mp-info))]/40 text-[hsl(var(--mp-info))] hover:from-[hsl(var(--mp-info))]/30 hover:to-[hsl(var(--mp-saffron))]/30 hover:border-[hsl(var(--mp-info))]/60 transition-all"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Chercher un binôme / squad
          </Button>
        </div>
      )}

      {/* ── Dialogs ── */}
      <AddEventDialog
        open={addEventOpen}
        onClose={() => setAddEventOpen(false)}
        cosplayProjectId={cosplay.id}
        userId={userId}
        assignedEventIds={assignedEventIds}
      />
      <PartyFinderModal
        open={partyFinderOpen}
        onClose={() => setPartyFinderOpen(false)}
        cosplayPlanId={cosplay.id}
        cosplayName={cosplay.character_name}
      />
    </div>
  );
}
