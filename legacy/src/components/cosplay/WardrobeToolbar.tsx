/**
 * WardrobeToolbar Component
 * Toolbar for the Cosplay Wardrobe grid: search, status filters, universe filter, and sort options
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Globe, X, Check, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusFilter = 'all' | 'in_progress' | 'finished';
export type SortOption = 'alpha' | 'priority_desc' | 'recent';

export interface WardrobeToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  sortOption: SortOption;
  onSortChange: (value: SortOption) => void;
  totalCount: number;
  filteredCount: number;
  /** Available universes for the filter (Tâche 4B) */
  universes?: string[];
  /** Currently selected universe filter */
  universeFilter?: string | null;
  /** Called when universe filter changes */
  onUniverseFilterChange?: (universe: string | null) => void;
}

// ─── Status Tab Button ─────────────────────────────────────────────────────────

interface StatusTabProps {
  label: string;
  value: StatusFilter;
  active: boolean;
  onClick: () => void;
}

function StatusTab({ label, value, active, onClick }: StatusTabProps) {
  const activeStyles: Record<StatusFilter, string> = {
    all: 'bg-[hsl(var(--mp-primary))] text-white shadow-[0_0_12px_rgba(255,0,127,0.5)]',
    in_progress: 'bg-[hsl(var(--mp-info))]/20 text-[hsl(var(--mp-info))] border border-[hsl(var(--mp-info))]/50 shadow-[0_0_12px_rgba(0,240,255,0.3)]',
    finished: 'bg-green-500/20 text-green-400 border border-green-500/50 shadow-[0_0_12px_rgba(34,197,94,0.3)]',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`
        px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200
        ${active
          ? activeStyles[value]
          : 'bg-white/5 text-mp-ink-muted border border-white/10 hover:bg-white/10 hover:text-white'
        }
      `}
    >
      {label}
    </motion.button>
  );
}

// ─── Universe Filter Popover ───────────────────────────────────────────────────

interface UniverseFilterProps {
  universes: string[];
  selected: string | null;
  onChange: (universe: string | null) => void;
}

function UniverseFilter({ universes, selected, onChange }: UniverseFilterProps) {
  const [open, setOpen] = useState(false);

  if (universes.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-2 transition-all duration-200",
            selected
              ? "bg-[hsl(var(--mp-info))]/15 border-[hsl(var(--mp-info))]/50 text-[hsl(var(--mp-info))] shadow-[0_0_10px_rgba(0,240,255,0.2)]"
              : "bg-white/5 border-white/10 text-mp-ink-muted hover:bg-white/10 hover:text-white hover:border-white/20"
          )}
        >
          <Globe className="w-3.5 h-3.5" />
          {selected ? (
            <span className="max-w-[120px] truncate">{selected}</span>
          ) : (
            <span>Univers</span>
          )}
          <ChevronDown className="w-3 h-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0 bg-mp-paper border-white/10"
        align="start"
      >
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Filtrer par univers…"
            className="text-white placeholder:text-mp-ink-muted border-b border-white/10"
          />
          <CommandList>
            <CommandEmpty>
              <p className="text-mp-ink-muted text-sm px-3 py-2">Aucun univers trouvé</p>
            </CommandEmpty>
            <CommandGroup>
              {/* "Tous" option */}
              <CommandItem
                value="__all__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="text-white hover:bg-white/10 cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 text-[hsl(var(--mp-primary))]",
                    selected === null ? "opacity-100" : "opacity-0"
                  )}
                />
                Tous les univers
              </CommandItem>

              {universes.map((universe) => (
                <CommandItem
                  key={universe}
                  value={universe}
                  onSelect={() => {
                    onChange(universe === selected ? null : universe);
                    setOpen(false);
                  }}
                  className="text-white hover:bg-white/10 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-[hsl(var(--mp-info))]",
                      selected === universe ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {universe}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main Toolbar ──────────────────────────────────────────────────────────────

export function WardrobeToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOption,
  onSortChange,
  totalCount,
  filteredCount,
  universes = [],
  universeFilter = null,
  onUniverseFilterChange,
}: WardrobeToolbarProps) {
  const STATUS_TABS: { label: string; value: StatusFilter }[] = [
    { label: 'Tous', value: 'all' },
    { label: 'En cours', value: 'in_progress' },
    { label: 'Terminés', value: 'finished' },
  ];

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || universeFilter;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-6 space-y-3"
    >
      {/* Row 1: Search + Universe Filter + Sort */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mp-ink-muted pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par personnage ou univers…"
            className="
              pl-9 bg-white/5 border-white/10 text-white placeholder:text-mp-ink-muted
              focus:border-[hsl(var(--mp-primary))]/60 focus:ring-[hsl(var(--mp-primary))]/20
              transition-all duration-200
            "
          />
        </div>

        {/* Universe Filter (Tâche 4B) */}
        {universes.length > 0 && onUniverseFilterChange && (
          <UniverseFilter
            universes={universes}
            selected={universeFilter}
            onChange={onUniverseFilterChange}
          />
        )}

        {/* Sort Select */}
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-mp-ink-muted" />
          <Select value={sortOption} onValueChange={(v) => onSortChange(v as SortOption)}>
            <SelectTrigger className="w-52 bg-white/5 border-white/10 text-white focus:ring-[hsl(var(--mp-primary))]/20 focus:border-[hsl(var(--mp-primary))]/60">
              <SelectValue placeholder="Trier par…" />
            </SelectTrigger>
            <SelectContent className="bg-mp-paper border-white/10 text-white">
              <SelectItem value="recent" className="focus:bg-white/10 focus:text-white">
                🕐 Récemment ajoutés
              </SelectItem>
              <SelectItem value="alpha" className="focus:bg-white/10 focus:text-white">
                🔤 Ordre alphabétique
              </SelectItem>
              <SelectItem value="priority_desc" className="focus:bg-white/10 focus:text-white">
                🔥 Priorité (plus haute d'abord)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Status Tabs + Active Filters + Count */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <StatusTab
              key={tab.value}
              label={tab.label}
              value={tab.value}
              active={statusFilter === tab.value}
              onClick={() => onStatusFilterChange(tab.value)}
            />
          ))}

          {/* Active Universe Filter Badge */}
          <AnimatePresence>
            {universeFilter && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Badge
                  className="
                    flex items-center gap-1.5 px-3 py-1
                    bg-[hsl(var(--mp-info))]/15 text-[hsl(var(--mp-info))] border border-[hsl(var(--mp-info))]/40
                    shadow-[0_0_8px_rgba(0,240,255,0.2)]
                    cursor-pointer hover:bg-[hsl(var(--mp-info))]/25 transition-colors
                  "
                  onClick={() => onUniverseFilterChange?.(null)}
                >
                  <Globe className="w-3 h-3" />
                  {universeFilter}
                  <X className="w-3 h-3 ml-0.5" />
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Count */}
        <span className="text-xs text-mp-ink-muted shrink-0">
          {filteredCount === totalCount
            ? `${totalCount} projet${totalCount > 1 ? 's' : ''}`
            : `${filteredCount} / ${totalCount} projet${totalCount > 1 ? 's' : ''}`}
        </span>
      </div>
    </motion.div>
  );
}
