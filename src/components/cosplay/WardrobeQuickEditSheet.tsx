/**
 * WardrobeQuickEditSheet Component
 * Slide-in panel (shadcn/ui Sheet) for quick editing of a cosplay card's metadata.
 * Fields: character name, universe (Combobox), priority, target event, is_in_wardrobe toggle.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Loader2,
  Sparkles,
  Flame,
  Star,
  Target,
  Calendar,
  ChevronsUpDown,
  Check,
  Plus,
  LayoutDashboard,
  Presentation,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WardrobeItem } from '@/hooks/useWardrobeItems';
import { useUpdateCosplan } from '@/hooks/useCosplans';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PartyFinderModal } from '@/components/cosplay/PartyFinderModal';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface WardrobeQuickEditSheetProps {
  cosplay: WardrobeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** All cosplays in the wardrobe — used to extract existing universes */
  allCosplays?: WardrobeItem[];
}

// ─── Priority Options ──────────────────────────────────────────────────────────

const PRIORITY_OPTIONS = [
  {
    value: '0',
    label: 'Aucune',
    icon: null,
    color: 'text-mp-ink-muted',
  },
  {
    value: '1',
    label: 'Normale',
    icon: <Target className="w-3.5 h-3.5" />,
    color: 'text-[hsl(var(--mp-info))]',
  },
  {
    value: '2',
    label: 'Haute',
    icon: <Star className="w-3.5 h-3.5" />,
    color: 'text-[hsl(var(--mp-saffron))]',
  },
  {
    value: '3',
    label: 'Urgente',
    icon: <Flame className="w-3.5 h-3.5" />,
    color: 'text-red-400',
  },
];

// ─── Universe Combobox ─────────────────────────────────────────────────────────

interface UniverseComboboxProps {
  value: string;
  onChange: (value: string) => void;
  universes: string[];
}

function UniverseCombobox({ value, onChange, universes }: UniverseComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Sync input when value changes externally
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter universes based on input
  const filtered = useMemo(() => {
    if (!inputValue.trim()) return universes;
    const q = inputValue.toLowerCase();
    return universes.filter((u) => u.toLowerCase().includes(q));
  }, [inputValue, universes]);

  const handleSelect = (selected: string) => {
    onChange(selected);
    setInputValue(selected);
    setOpen(false);
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    onChange(val); // Allow free-text entry
  };

  const isNewValue = inputValue.trim() && !universes.includes(inputValue.trim());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            "bg-white/5 border-white/10 text-white",
            "hover:bg-white/10 hover:border-white/20",
            "focus:border-[hsl(var(--mp-primary))]/60 focus:ring-[hsl(var(--mp-primary))]/20",
            !value && "text-mp-ink-muted"
          )}
        >
          <span className="truncate">{value || "Ex: Naruto Shippuden"}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-mp-ink-muted" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 bg-mp-paper border-white/10"
        align="start"
      >
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Rechercher ou saisir un univers…"
            value={inputValue}
            onValueChange={handleInputChange}
            className="text-white placeholder:text-mp-ink-muted border-b border-white/10"
          />
          <CommandList>
            <CommandEmpty>
              {inputValue.trim() ? (
                <button
                  onClick={() => handleSelect(inputValue.trim())}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--mp-info))] hover:bg-white/5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Créer "{inputValue.trim()}"
                </button>
              ) : (
                <p className="text-mp-ink-muted text-sm px-3 py-2">Aucun univers trouvé</p>
              )}
            </CommandEmpty>

            {/* Existing universes */}
            {filtered.length > 0 && (
              <CommandGroup heading="Univers existants" className="text-mp-ink-muted">
                {filtered.map((universe) => (
                  <CommandItem
                    key={universe}
                    value={universe}
                    onSelect={() => handleSelect(universe)}
                    className="text-white hover:bg-white/10 cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-[hsl(var(--mp-primary))]",
                        value === universe ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {universe}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Create new option (when input doesn't match existing) */}
            {isNewValue && (
              <CommandGroup heading="Nouveau" className="text-mp-ink-muted">
                <CommandItem
                  value={`__new__${inputValue}`}
                  onSelect={() => handleSelect(inputValue.trim())}
                  className="text-[hsl(var(--mp-info))] hover:bg-[hsl(var(--mp-info))]/10 cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer "{inputValue.trim()}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function WardrobeQuickEditSheet({
  cosplay,
  open,
  onOpenChange,
  allCosplays = [],
}: WardrobeQuickEditSheetProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const updateCosplan = useUpdateCosplan();
  const queryClient = useQueryClient();
  const { data: events = [] } = useEvents();

  // ── Party Finder Modal State ─────────────────────────────────────────────────
  const [partyFinderOpen, setPartyFinderOpen] = useState(false);

  // ── Form State ──────────────────────────────────────────────────────────────
  const [characterName, setCharacterName] = useState('');
  const [universe, setUniverse] = useState('');
  const [priority, setPriority] = useState('0');
  const [targetEventId, setTargetEventId] = useState<string>('none');
  const [isInWardrobe, setIsInWardrobe] = useState(false);

  // Extract unique universes from all cosplays (sorted alphabetically)
  const existingUniverses = useMemo(() => {
    const set = new Set(allCosplays.map((c) => c.universe).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allCosplays]);

  // Sync form state when cosplay changes
  useEffect(() => {
    if (cosplay) {
      setCharacterName(cosplay.character_name);
      setUniverse(cosplay.universe);
      setPriority(String(cosplay.priority ?? 0));
      setTargetEventId(cosplay.target_event_id ?? 'none');
      setIsInWardrobe(cosplay.is_in_wardrobe ?? false);
    }
  }, [cosplay]);

  // ── Submit Handler ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cosplay || !user?.id) return;

    try {
      // is_in_wardrobe is a custom column not yet in Supabase generated types — use any cast
      const updatePayload: any = {
        id: cosplay.id,
        userId: user.id,
        character_name: characterName.trim(),
        universe: universe.trim(),
        priority: parseInt(priority, 10),
        target_event_id: targetEventId === 'none' ? null : targetEventId,
        is_in_wardrobe: isInWardrobe,
      };

      await updateCosplan.mutateAsync(updatePayload);

      // Invalidate wardrobe items cache to refresh the grid
      queryClient.invalidateQueries({ queryKey: ['wardrobe-items', user.id] });

      toast.success('✅ Cosplay mis à jour !');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Erreur : ${err?.message ?? 'Impossible de sauvegarder'}`);
    }
  };

  if (!cosplay) return null;

  const isLoading = updateCosplan.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="
          w-full sm:max-w-md
          bg-slate-950/95 backdrop-blur-xl
          border-l border-white/10
          text-white
          flex flex-col
        "
      >
        {/* Header */}
        <SheetHeader className="pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {cosplay.image_url && (
              <img
                src={cosplay.image_url}
                alt={cosplay.character_name}
                className="w-12 h-12 rounded-lg object-cover border border-white/10"
              />
            )}
            <div>
              <SheetTitle className="text-white text-lg font-bold">
                Édition rapide
              </SheetTitle>
              <SheetDescription className="text-mp-ink-muted text-sm">
                {cosplay.character_name} · {cosplay.universe}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-6 space-y-6">
          {/* Character Name */}
          <div className="space-y-2">
            <Label htmlFor="qs-character" className="text-slate-300 text-sm font-medium">
              Nom du personnage
            </Label>
            <Input
              id="qs-character"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Ex: Naruto Uzumaki"
              required
              className="
                bg-white/5 border-white/10 text-white placeholder:text-mp-ink-muted
                focus:border-[hsl(var(--mp-primary))]/60 focus:ring-[hsl(var(--mp-primary))]/20
              "
            />
          </div>

          {/* Universe — Combobox (Tâche 4A) */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm font-medium">
              Univers / Franchise
            </Label>
            <UniverseCombobox
              value={universe}
              onChange={setUniverse}
              universes={existingUniverses}
            />
            {existingUniverses.length > 0 && (
              <p className="text-xs text-mp-ink-muted">
                {existingUniverses.length} univers dans ta collection
              </p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm font-medium">Priorité</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-[hsl(var(--mp-primary))]/20 focus:border-[hsl(var(--mp-primary))]/60">
                <SelectValue placeholder="Choisir une priorité" />
              </SelectTrigger>
              <SelectContent className="bg-mp-paper border-white/10 text-white">
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="focus:bg-white/10 focus:text-white"
                  >
                    <span className={`flex items-center gap-2 ${opt.color}`}>
                      {opt.icon}
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Event */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[hsl(var(--mp-saffron))]" />
              Événement cible
            </Label>
            <Select value={targetEventId} onValueChange={setTargetEventId}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-[hsl(var(--mp-saffron))]/20 focus:border-[hsl(var(--mp-saffron))]/60">
                <SelectValue placeholder="Aucun événement" />
              </SelectTrigger>
              <SelectContent className="bg-mp-paper border-white/10 text-white max-h-48">
                <SelectItem value="none" className="focus:bg-white/10 focus:text-white">
                  Aucun événement
                </SelectItem>
                {events.map((event) => (
                  <SelectItem
                    key={event.id}
                    value={event.id}
                    className="focus:bg-white/10 focus:text-white"
                  >
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Wardrobe Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="space-y-0.5">
                <Label className="text-slate-200 text-sm font-medium cursor-pointer">
                  Transférer au Vestiaire
                </Label>
                <p className="text-xs text-mp-ink-muted">
                  {isInWardrobe
                    ? '✅ Ce cosplay est dans ton vestiaire (terminé)'
                    : '🔧 Ce cosplay est en cours de création'}
                </p>
              </div>
              <Switch
                checked={isInWardrobe}
                onCheckedChange={setIsInWardrobe}
                className="data-[state=checked]:bg-[hsl(var(--mp-primary))]"
              />
            </div>

            {/* Visual feedback on toggle */}
            {isInWardrobe && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ce cosplay sera marqué comme terminé et rangé dans ton vestiaire.
              </motion.div>
            )}
          </div>
        </form>

        {/* Navigation shortcut buttons */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          {cosplay.is_in_wardrobe ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                navigate(`/espace-membre/cosplay/${cosplay.id}?tab=overview`);
              }}
              className="
                w-full border-[hsl(var(--mp-primary))]/30 text-[hsl(var(--mp-primary))]
                hover:bg-[hsl(var(--mp-primary))]/10 hover:border-[hsl(var(--mp-primary))]/60
                hover:shadow-[0_0_10px_rgba(255,0,127,0.2)]
                transition-all duration-200
              "
            >
              <Presentation className="w-4 h-4 mr-2" />
              Voir la Vitrine
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                navigate(`/espace-membre/cosplay/${cosplay.id}?tab=tasks`);
              }}
              className="
                w-full border-[hsl(var(--mp-saffron))]/30 text-[hsl(var(--mp-saffron))]
                hover:bg-[hsl(var(--mp-saffron))]/10 hover:border-[hsl(var(--mp-saffron))]/60
                hover:shadow-[0_0_10px_rgba(255,215,0,0.2)]
                transition-all duration-200
              "
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Ouvrir le tableau de bord
            </Button>
          )}

          {/* Party Finder shortcut */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPartyFinderOpen(true)}
              className="
                w-full border-[hsl(var(--mp-info))]/30 text-[hsl(var(--mp-info))]
                hover:bg-[hsl(var(--mp-info))]/10 hover:border-[hsl(var(--mp-info))]/60
                hover:shadow-[0_0_12px_rgba(0,240,255,0.2)]
                transition-all duration-200
              "
            >
              <Users className="w-4 h-4 mr-2" />
              Trouver une escouade
            </Button>
          </motion.div>
        </div>

        {/* Footer */}
        <SheetFooter className="pt-4 border-t border-white/10 flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 text-mp-ink-muted hover:text-white hover:bg-white/10"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !characterName.trim() || !universe.trim()}
            className="
              flex-1 bg-gradient-to-r from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-primary))]/80
              hover:from-[hsl(var(--mp-primary))]/90 hover:to-[hsl(var(--mp-primary))]/70
              text-white font-semibold
              shadow-[0_0_15px_rgba(255,0,127,0.4)]
              hover:shadow-[0_0_20px_rgba(255,0,127,0.6)]
              transition-all duration-200
            "
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sauvegarde…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>

      {/* Party Finder Modal — agnostic mode: cosplayPlanId pre-filled */}
      <PartyFinderModal
        open={partyFinderOpen}
        onClose={() => setPartyFinderOpen(false)}
        cosplayPlanId={cosplay.id}
        cosplayName={cosplay.character_name}
      />
    </Sheet>
  );
}
