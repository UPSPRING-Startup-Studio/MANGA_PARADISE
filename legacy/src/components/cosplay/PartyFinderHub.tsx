import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Star,
  Zap,
  Lock,
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

// =====================================================
// SKELETON CARD
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
            Tu postules pour la place{" "}
            <span className="text-white font-medium">"{slot.title}"</span> dans
            l'escouade{" "}
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
              style={{
                background: `${modeConfig.color}20`,
                color: modeConfig.color,
              }}
            >
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{slot.title}</p>
              <p className="text-xs text-mp-ink-muted">
                {ROLE_LABELS[slot.role_type]}
                {slot.requirements && (
                  <span className="ml-2 text-amber-400/80">
                    · {slot.requirements}
                  </span>
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
              <Select
                value={selectedCosplayId}
                onValueChange={setSelectedCosplayId}
              >
                <SelectTrigger className="bg-black/40 border-white/20 text-white focus:border-[hsl(var(--mp-info))]/50 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-mp-paper border-white/10 text-white max-h-60">
                  {/* Civilian option */}
                  <SelectItem
                    value="__civilian__"
                    className="focus:bg-white/10 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-mp-ink-muted">👤</span>
                      <div>
                        <p className="font-medium text-slate-200">
                          Visiteur civil
                        </p>
                        <p className="text-xs text-mp-ink-muted">
                          Sans cosplay — participation libre
                        </p>
                      </div>
                    </div>
                  </SelectItem>

                  {/* Wardrobe items */}
                  {wardrobeItems.map((cosplay) => (
                    <SelectItem
                      key={cosplay.id}
                      value={cosplay.id}
                      className="focus:bg-white/10 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <Shirt className="w-3.5 h-3.5 text-[hsl(var(--mp-primary))]" />
                        <div>
                          <p className="font-medium">{cosplay.character_name}</p>
                          <p className="text-xs text-mp-ink-muted">
                            {cosplay.universe}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Action buttons */}
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
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Postuler
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// =====================================================
// SQUAD CARD
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
        "border transition-all duration-300",
        "group"
      )}
      style={{ borderColor: `${modeConfig.color}25` }}
    >
      {/* Mode glow accent */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
        style={{ background: modeConfig.color }}
      />

      {/* Hover overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${modeConfig.color}08, transparent)`,
        }}
      />

      <div className="relative z-10 pl-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mode badge */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: `${modeConfig.color}20`,
                color: modeConfig.color,
              }}
            >
              {modeConfig.icon}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-display text-sm text-white truncate">
                  {squad.name}
                </h4>
                {isOwner && (
                  <Badge className="bg-[hsl(var(--mp-saffron))]/20 text-[hsl(var(--mp-saffron))] border-[hsl(var(--mp-saffron))]/30 text-xs flex-shrink-0">
                    <Crown className="w-2.5 h-2.5 mr-1" />
                    Leader
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-xs font-medium"
                  style={{ color: modeConfig.color }}
                >
                  {modeConfig.emoji} {modeConfig.label}
                </span>
                <span className="text-mp-ink-muted text-xs">·</span>
                <span className="text-xs text-mp-ink-muted">
                  {squad.member_count ?? 0} membre
                  {(squad.member_count ?? 0) !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Creator avatar */}
          <Avatar className="w-8 h-8 flex-shrink-0 ring-1 ring-white/10">
            <AvatarImage src={squad.creator_avatar_url ?? undefined} />
            <AvatarFallback className="bg-white text-xs text-slate-300">
              {squad.creator_username?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Description */}
        {squad.description && (
          <p className="text-xs text-mp-ink-muted line-clamp-2 mb-3">
            {squad.description}
          </p>
        )}

        {/* Slots */}
        {squad.slots && squad.slots.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-mp-ink-muted font-medium uppercase tracking-wider mb-2">
              Places disponibles ({squad.slots.length})
            </p>
            <div className="space-y-1.5">
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
                      <p className="text-xs font-medium text-white truncate">
                        {slot.title}
                      </p>
                      {slot.requirements && (
                        <p className="text-xs text-amber-400/70 truncate">
                          {slot.requirements}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isOwner && (
                    <Button
                      size="sm"
                      onClick={() => onApplySlot(squad, slot)}
                      className={cn(
                        "h-6 px-2.5 text-xs font-medium flex-shrink-0",
                        "bg-transparent border transition-all duration-200"
                      )}
                      style={{
                        borderColor: `${modeConfig.color}40`,
                        color: modeConfig.color,
                      }}
                    >
                      Postuler
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* No slots */}
        {(!squad.slots || squad.slots.length === 0) && (
          <p className="text-xs text-mp-ink-muted italic">
            Aucune place définie pour l'instant.
          </p>
        )}
      </div>
    </motion.div>
  );
};

// =====================================================
// FILTER CHIPS
// =====================================================

type FilterMode = "all" | SquadMode;

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
// MAIN COMPONENT: PartyFinderHub
// =====================================================

interface PartyFinderHubProps {
  eventId: string;
  userId: string;
  onCreateSquad: () => void;
}

export const PartyFinderHub = ({
  eventId,
  userId,
  onCreateSquad,
}: PartyFinderHubProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterMode>("all");
  const [applyTarget, setApplyTarget] = useState<{
    squad: SquadWithSlots;
    slot: SquadSlot;
  } | null>(null);

  const { data: squads = [], isLoading } = useSquadsByEvent(eventId);
  const { data: wardrobeItems = [], isLoading: isLoadingWardrobe } =
    useWardrobeItems(userId);

  // ── Filter logic ─────────────────────────────────────────────────────────────

  const filteredSquads =
    activeFilter === "all"
      ? squads
      : squads.filter((s) => s.mode === activeFilter);

  const counts: Record<FilterMode, number> = {
    all: squads.length,
    squad: squads.filter((s) => s.mode === "squad").length,
    shooting: squads.filter((s) => s.mode === "shooting").length,
    concours: squads.filter((s) => s.mode === "concours").length,
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Top bar: filters + create button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <FilterChips
          active={activeFilter}
          onChange={setActiveFilter}
          counts={counts}
        />

        <Button
          onClick={onCreateSquad}
          size="sm"
          className={cn(
            "flex-shrink-0 font-bold text-xs h-8 px-3",
            "bg-gradient-to-r from-[hsl(var(--mp-saffron))]/20 to-[hsl(var(--mp-primary))]/10",
            "border border-[hsl(var(--mp-saffron))]/40 text-[hsl(var(--mp-saffron))]",
            "hover:from-[hsl(var(--mp-saffron))]/30 hover:border-[hsl(var(--mp-saffron))]/70",
            "hover:shadow-[0_0_12px_rgba(255,215,0,0.3)]",
            "transition-all duration-200"
          )}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Créer un groupe
        </Button>
      </div>

      {/* Squad list */}
      <div className="space-y-3">
        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SquadCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredSquads.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-12 text-center space-y-3"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
              <Swords className="w-8 h-8 text-mp-ink-muted" />
            </div>
            <div>
              <p className="text-sm text-slate-300 font-medium">
                {activeFilter === "all"
                  ? "Aucune escouade pour cet événement"
                  : `Aucune escouade de type "${activeFilter}"`}
              </p>
              <p className="text-xs text-mp-ink-muted mt-1">
                Sois le premier à fonder une escouade !
              </p>
            </div>
            <Button
              onClick={onCreateSquad}
              size="sm"
              className={cn(
                "mt-2 font-bold",
                "bg-gradient-to-r from-[hsl(var(--mp-saffron))]/20 to-[hsl(var(--mp-primary))]/10",
                "border border-[hsl(var(--mp-saffron))]/40 text-[hsl(var(--mp-saffron))]",
                "hover:from-[hsl(var(--mp-saffron))]/30 hover:border-[hsl(var(--mp-saffron))]/70",
                "transition-all duration-200"
              )}
            >
              <Plus className="w-4 h-4 mr-2" />
              Fonder la première escouade
            </Button>
          </motion.div>
        )}

        {/* Squad cards */}
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

      {/* Apply Dialog */}
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
    </div>
  );
};
