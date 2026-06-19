/**
 * EventPartyFinderOverview
 *
 * Inline Party Finder section displayed directly on the Event Detail page.
 * Shows squads, filter chips, and opens the CreateSquadWizard in a Dialog.
 *
 * Architecture:
 *   - Hub (inline) : filter chips + squad cards grid
 *   - Wizard (Dialog) : CreateSquadWizard in a shadcn Dialog
 *   - Apply (Dialog) : slot application dialog
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Users,
  Camera,
  Trophy,
  Plus,
  Swords,
  Crown,
  Loader2,
  UserPlus,
  Shirt,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSquadsByEvent,
  useJoinSquad,
  SquadWithSlots,
  SquadSlot,
  SquadMode,
  SlotRoleType,
} from "@/hooks/useSquads";
import { useWardrobeItems } from "@/hooks/useWardrobeItems";
import { CreateSquadWizard } from "@/components/cosplay/CreateSquadWizard";

// =====================================================
// CONSTANTS
// =====================================================

const MODE_CONFIG: Record<
  SquadMode,
  { label: string; emoji: string; color: string; icon: React.ReactNode }
> = {
  squad: {
    label: "Squad",
    emoji: "🟢",
    color: "#22c55e",
    icon: <Users className="w-3.5 h-3.5" />,
  },
  shooting: {
    label: "Shooting",
    emoji: "🔵",
    color: "hsl(var(--mp-info))",
    icon: <Camera className="w-3.5 h-3.5" />,
  },
  concours: {
    label: "Concours",
    emoji: "🔴",
    color: "hsl(var(--mp-primary))",
    icon: <Trophy className="w-3.5 h-3.5" />,
  },
};

const ROLE_LABELS: Record<SlotRoleType, string> = {
  character: "⚔️ Personnage",
  staff: "📸 Staff",
  generic: "🎯 Libre",
};

type FilterMode = "all" | SquadMode;

// =====================================================
// SKELETON
// =====================================================

const SquadCardSkeleton = () => (
  <div className="rounded-xl p-4 bg-black/40 border border-white/10 space-y-3 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/10" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 bg-white/10 rounded w-2/3" />
        <div className="h-3 bg-white/5 rounded w-1/3" />
      </div>
    </div>
    <div className="h-3 bg-white/5 rounded w-full" />
    <div className="flex gap-2">
      <div className="h-6 bg-white/10 rounded-full w-20" />
      <div className="h-6 bg-white/10 rounded-full w-24" />
    </div>
  </div>
);

// =====================================================
// APPLY DIALOG
// =====================================================

interface ApplyDialogProps {
  open: boolean;
  onClose: () => void;
  squad: SquadWithSlots;
  slot: SquadSlot;
  userId: string;
  wardrobeItems: { id: string; character_name: string; universe: string }[];
  isLoadingWardrobe: boolean;
}

const ApplyDialog = ({
  open,
  onClose,
  squad,
  slot,
  userId,
  wardrobeItems,
  isLoadingWardrobe,
}: ApplyDialogProps) => {
  const [selectedCosplayId, setSelectedCosplayId] = useState<string>("__civilian__");
  const joinMutation = useJoinSquad();
  const modeConfig = MODE_CONFIG[squad.mode];

  const handleApply = async () => {
    await joinMutation.mutateAsync({
      squad_id: squad.id,
      user_id: userId,
      slot_id: slot.id,
      cosplay_plan_id:
        selectedCosplayId === "__civilian__" ? null : selectedCosplayId,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-950 border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-display">
            <UserPlus className="w-5 h-5 text-[hsl(var(--mp-info))]" />
            Postuler à cette place
          </DialogTitle>
          <DialogDescription className="text-mp-ink-muted text-sm">
            Tu postules pour{" "}
            <span className="text-white font-medium">"{slot.title}"</span> dans{" "}
            <span className="text-white font-medium">"{squad.name}"</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Slot info */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl border"
            style={{
              background: `${modeConfig.color}10`,
              borderColor: `${modeConfig.color}25`,
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${modeConfig.color}20`, color: modeConfig.color }}
            >
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{slot.title}</p>
              <p className="text-xs text-mp-ink-muted">
                {ROLE_LABELS[slot.role_type]}
                {slot.requirements && (
                  <span className="ml-2 text-amber-400/80">· {slot.requirements}</span>
                )}
              </p>
            </div>
          </div>

          {/* Cosplay selector */}
          <div className="space-y-2">
            <Label className="text-sm text-slate-300 font-medium">
              Avec quel cosplay ?
            </Label>
            {isLoadingWardrobe ? (
              <div className="flex items-center gap-2 text-mp-ink-muted text-sm py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement du vestiaire...
              </div>
            ) : (
              <Select value={selectedCosplayId} onValueChange={setSelectedCosplayId}>
                <SelectTrigger className="bg-black/40 border-white/20 text-white focus:border-[hsl(var(--mp-info))]/50 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-mp-paper border-white/10 text-white max-h-60">
                  <SelectItem value="__civilian__" className="focus:bg-white/10 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-mp-ink-muted">👤</span>
                      <div>
                        <p className="font-medium text-slate-200">Visiteur civil</p>
                        <p className="text-xs text-mp-ink-muted">Sans cosplay — participation libre</p>
                      </div>
                    </div>
                  </SelectItem>
                  {wardrobeItems.map((cosplay) => (
                    <SelectItem key={cosplay.id} value={cosplay.id} className="focus:bg-white/10 py-3">
                      <div className="flex items-center gap-2">
                        <Shirt className="w-3.5 h-3.5 text-[hsl(var(--mp-primary))]" />
                        <div>
                          <p className="font-medium">{cosplay.character_name}</p>
                          <p className="text-xs text-mp-ink-muted">{cosplay.universe}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/20 text-slate-300 hover:bg-white/5"
            >
              Annuler
            </Button>
            <Button
              onClick={handleApply}
              disabled={joinMutation.isPending}
              className={cn(
                "flex-1 font-bold",
                "bg-gradient-to-r from-[hsl(var(--mp-info))]/20 to-[hsl(var(--mp-info))]/10",
                "border border-[hsl(var(--mp-info))]/50 text-[hsl(var(--mp-info))]",
                "hover:from-[hsl(var(--mp-info))]/30 hover:border-[hsl(var(--mp-info))]/80",
                "hover:shadow-[0_0_16px_rgba(0,240,255,0.3)]",
                "disabled:opacity-50 transition-all duration-200"
              )}
            >
              {joinMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Envoi...</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" />Postuler</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// =====================================================
// SQUAD CARD (inline version)
// =====================================================

interface SquadCardProps {
  squad: SquadWithSlots;
  currentUserId: string;
  onApplySlot: (squad: SquadWithSlots, slot: SquadSlot) => void;
}

const SquadCard = ({ squad, currentUserId, onApplySlot }: SquadCardProps) => {
  const isOwner = squad.created_by === currentUserId;
  const modeConfig = MODE_CONFIG[squad.mode];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      className={cn(
        "relative overflow-hidden rounded-xl p-4",
        "bg-black/40 backdrop-blur-md",
        "border transition-all duration-300 group"
      )}
      style={{ borderColor: `${modeConfig.color}25` }}
    >
      {/* Mode accent bar */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
        style={{ background: modeConfig.color }}
      />

      {/* Hover overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${modeConfig.color}08, transparent)` }}
      />

      <div className="relative z-10 pl-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${modeConfig.color}20`, color: modeConfig.color }}
            >
              {modeConfig.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-display text-sm text-white truncate">{squad.name}</h4>
                {isOwner && (
                  <Badge className="bg-[hsl(var(--mp-saffron))]/20 text-[hsl(var(--mp-saffron))] border-[hsl(var(--mp-saffron))]/30 text-xs flex-shrink-0">
                    <Crown className="w-2.5 h-2.5 mr-1" />
                    Leader
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-medium" style={{ color: modeConfig.color }}>
                  {modeConfig.emoji} {modeConfig.label}
                </span>
                <span className="text-mp-ink-muted text-xs">·</span>
                <span className="text-xs text-mp-ink-muted">
                  {squad.member_count ?? 0} membre{(squad.member_count ?? 0) !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
          <Avatar className="w-8 h-8 flex-shrink-0 ring-1 ring-white/10">
            <AvatarImage src={squad.creator_avatar_url ?? undefined} />
            <AvatarFallback className="bg-white text-xs text-slate-300">
              {squad.creator_username?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Description */}
        {squad.description && (
          <p className="text-xs text-mp-ink-muted line-clamp-2 mb-3">{squad.description}</p>
        )}

        {/* Slots */}
        {squad.slots && squad.slots.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs text-mp-ink-muted font-medium uppercase tracking-wider mb-2">
              Places disponibles ({squad.slots.length})
            </p>
            {squad.slots.map((slot) => (
              <motion.div
                key={slot.id}
                whileHover={{ x: 2 }}
                className={cn(
                  "flex items-center justify-between gap-2",
                  "px-3 py-2 rounded-lg",
                  "bg-white/5 border border-white/8",
                  "hover:border-white/15 transition-all duration-200"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs">{ROLE_LABELS[slot.role_type].split(" ")[0]}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{slot.title}</p>
                    {slot.requirements && (
                      <p className="text-xs text-amber-400/70 truncate">{slot.requirements}</p>
                    )}
                  </div>
                </div>
                {!isOwner && (
                  <Button
                    size="sm"
                    onClick={() => onApplySlot(squad, slot)}
                    className="h-6 px-2.5 text-xs font-medium flex-shrink-0 bg-transparent border transition-all duration-200"
                    style={{ borderColor: `${modeConfig.color}40`, color: modeConfig.color }}
                  >
                    Postuler
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-mp-ink-muted italic">Aucune place définie.</p>
        )}
      </div>
    </motion.div>
  );
};

// =====================================================
// FILTER CHIPS
// =====================================================

interface FilterChipsProps {
  active: FilterMode;
  onChange: (mode: FilterMode) => void;
  counts: Record<FilterMode, number>;
}

const FilterChips = ({ active, onChange, counts }: FilterChipsProps) => {
  const chips: { value: FilterMode; label: string; emoji: string; color?: string }[] = [
    { value: "all", label: "Tous", emoji: "✨" },
    { value: "squad", label: "Squads", emoji: "🟢", color: "#22c55e" },
    { value: "shooting", label: "Shootings", emoji: "🔵", color: "hsl(var(--mp-info))" },
    { value: "concours", label: "Concours", emoji: "🔴", color: "hsl(var(--mp-primary))" },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {chips.map((chip) => {
        const isActive = active === chip.value;
        const count = counts[chip.value];
        return (
          <motion.button
            key={chip.value}
            type="button"
            onClick={() => onChange(chip.value)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
              "border transition-all duration-200",
              isActive
                ? "text-white"
                : "bg-black/40 border-white/15 text-mp-ink-muted hover:text-white hover:border-white/30"
            )}
            style={
              isActive
                ? {
                    background: chip.color ? `${chip.color}20` : "rgba(255,255,255,0.1)",
                    borderColor: chip.color ? `${chip.color}50` : "rgba(255,255,255,0.3)",
                    color: chip.color ?? "white",
                    boxShadow: chip.color ? `0 0 10px ${chip.color}30` : undefined,
                  }
                : {}
            }
          >
            <span>{chip.emoji}</span>
            <span>{chip.label}</span>
            {count > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs font-bold",
                  isActive ? "bg-white/20" : "bg-white/10 text-mp-ink-muted"
                )}
              >
                {count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

// =====================================================
// MAIN COMPONENT: EventPartyFinderOverview
// =====================================================

interface EventPartyFinderOverviewProps {
  eventId: string;
  userId: string;
}

export const EventPartyFinderOverview = ({
  eventId,
  userId,
}: EventPartyFinderOverviewProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterMode>("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [applyTarget, setApplyTarget] = useState<{
    squad: SquadWithSlots;
    slot: SquadSlot;
  } | null>(null);

  const { data: squads = [], isLoading } = useSquadsByEvent(eventId);
  const { data: wardrobeItems = [], isLoading: isLoadingWardrobe } =
    useWardrobeItems(userId);

  // ── Computed counts ──────────────────────────────────────────────────────────

  const counts = useMemo<Record<FilterMode, number>>(
    () => ({
      all: squads.length,
      squad: squads.filter((s) => s.mode === "squad").length,
      shooting: squads.filter((s) => s.mode === "shooting").length,
      concours: squads.filter((s) => s.mode === "concours").length,
    }),
    [squads]
  );

  const filteredSquads = useMemo(
    () =>
      activeFilter === "all"
        ? squads
        : squads.filter((s) => s.mode === activeFilter),
    [squads, activeFilter]
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(var(--mp-info))] to-[hsl(var(--mp-saffron))] flex items-center justify-center flex-shrink-0">
            <Swords className="w-4 h-4 text-black" />
          </div>
          <div>
            <h3 className="font-display text-lg text-white leading-tight">
              Party Finder
            </h3>
            <p className="text-xs text-mp-ink-muted">
              Trouve ou crée ton groupe pour cet événement
            </p>
          </div>
        </div>

        {/* Create squad CTA */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setWizardOpen(true)}
            className={cn(
              "font-bold text-sm h-9 px-4",
              "bg-gradient-to-r from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-saffron))]",
              "text-black",
              "shadow-[0_0_16px_rgba(255,0,127,0.4)]",
              "hover:shadow-[0_0_24px_rgba(255,0,127,0.6)]",
              "hover:from-[hsl(var(--mp-primary))]/90 hover:to-[hsl(var(--mp-saffron))]/90",
              "transition-all duration-300"
            )}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Créer un groupe
          </Button>
        </motion.div>
      </div>

      {/* Filter chips */}
      <FilterChips active={activeFilter} onChange={setActiveFilter} counts={counts} />

      {/* Squad grid */}
      <div className="space-y-3">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map((i) => <SquadCardSkeleton key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredSquads.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-10 text-center space-y-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-mp-ink-muted" />
            </div>
            <div>
              <p className="text-sm text-slate-300 font-medium">
                {activeFilter === "all"
                  ? "Aucun groupe pour cet événement"
                  : `Aucun groupe de type "${activeFilter}"`}
              </p>
              <p className="text-xs text-mp-ink-muted mt-1">
                Sois le premier à en créer un !
              </p>
            </div>
            <Button
              onClick={() => setWizardOpen(true)}
              size="sm"
              className={cn(
                "mt-1 font-bold",
                "bg-gradient-to-r from-[hsl(var(--mp-primary))]/20 to-[hsl(var(--mp-saffron))]/10",
                "border border-[hsl(var(--mp-primary))]/40 text-[hsl(var(--mp-primary))]",
                "hover:from-[hsl(var(--mp-primary))]/30 hover:border-[hsl(var(--mp-primary))]/70",
                "transition-all duration-200"
              )}
            >
              <Plus className="w-4 h-4 mr-2" />
              Fonder la première escouade
            </Button>
          </motion.div>
        )}

        {/* Cards */}
        {!isLoading && filteredSquads.length > 0 && (
          <AnimatePresence mode="popLayout">
            {filteredSquads.map((squad) => (
              <SquadCard
                key={squad.id}
                squad={squad}
                currentUserId={userId}
                onApplySlot={(s, slot) => setApplyTarget({ squad: s, slot })}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* ── Wizard Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-lg bg-slate-950 border-white/10 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl font-display">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-saffron))] flex items-center justify-center">
                <Swords className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="bg-gradient-to-r from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-saffron))] bg-clip-text text-transparent">
                Créer une escouade
              </span>
            </DialogTitle>
            <DialogDescription className="text-mp-ink-muted text-sm">
              Définis ton groupe en 3 étapes et ouvre les candidatures.
            </DialogDescription>
          </DialogHeader>

          <CreateSquadWizard
            targetEventId={eventId}
            userId={userId}
            onSuccess={() => setWizardOpen(false)}
            onCancel={() => setWizardOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* ── Apply Dialog ──────────────────────────────────────────────────────── */}
      {applyTarget && (
        <ApplyDialog
          open={!!applyTarget}
          onClose={() => setApplyTarget(null)}
          squad={applyTarget.squad}
          slot={applyTarget.slot}
          userId={userId}
          wardrobeItems={wardrobeItems.map((w) => ({
            id: w.id,
            character_name: w.character_name,
            universe: w.universe,
          }))}
          isLoadingWardrobe={isLoadingWardrobe}
        />
      )}
    </section>
  );
};
