/**
 * EventFilterBar — Barre de contrôle principale
 *
 * Ligne 1: Search | Type événement | Type organisateur | Ville | Tri | [Plus de filtres] | [Toggle vue]
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search, X, SlidersHorizontal, ArrowUpDown,
  LayoutGrid, List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SORT_OPTIONS,
  countAdvancedFilters,
  type EventFilters,
  type SortOption,
  type ViewMode,
} from "./eventListHelpers";
import EventFilterAdvancedPanel from "./EventFilterAdvancedPanel";

// ─── Types ────────────────────────────────────────────────────────

interface EventFilterBarProps {
  filters: EventFilters;
  sort: SortOption;
  viewMode: ViewMode;
  onFiltersChange: (updates: Partial<EventFilters>) => void;
  onSortChange: (sort: SortOption) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onReset: () => void;
  /** Available option lists extracted from dataset */
  eventTypes: string[];
  cities: string[];
  associations: string[];
  hasActiveFilters: boolean;
}

// ─── Component ────────────────────────────────────────────────────

const EventFilterBar = ({
  filters,
  sort,
  viewMode,
  onFiltersChange,
  onSortChange,
  onViewModeChange,
  onReset,
  eventTypes,
  cities,
  associations,
  hasActiveFilters,
}: EventFilterBarProps) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const advancedCount = countAdvancedFilters(filters);

  const handleResetAdvanced = () => {
    onFiltersChange({
      publicationStatus: "all",
      dateFrom: "",
      dateTo: "",
      priceFilter: "all",
      formatFilter: "all",
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">

        {/* ── Search ── */}
        <div className="relative flex-1 min-w-[180px] max-w-[280px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            placeholder="Rechercher…"
            className="pl-8 h-9 text-sm bg-muted/30 border-border focus:border-sakura/50"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFiltersChange({ search: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* ── Type d'événement ── */}
        <Select
          value={filters.eventType || "all"}
          onValueChange={(v) => onFiltersChange({ eventType: v })}
        >
          <SelectTrigger className="w-[150px] h-9 text-sm bg-muted/30 border-border">
            <SelectValue placeholder="Type d'événement" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">Tous les types</SelectItem>
            {eventTypes.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* ── Type d'organisateur ── */}
        <Select
          value={filters.organizerType || "all"}
          onValueChange={(v) => {
            onFiltersChange({ organizerType: v, association: "all" });
          }}
        >
          <SelectTrigger className="w-[160px] h-9 text-sm bg-muted/30 border-border">
            <SelectValue placeholder="Organisateur" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">Tous organisateurs</SelectItem>
            <SelectItem value="mp">Manga Paradise</SelectItem>
            <SelectItem value="associations">Associations</SelectItem>
          </SelectContent>
        </Select>

        {/* ── Association spécifique (visible si "associations" sélectionné) ── */}
        {filters.organizerType === "associations" && associations.length > 0 && (
          <Select
            value={filters.association || "all"}
            onValueChange={(v) => onFiltersChange({ association: v })}
          >
            <SelectTrigger className="w-[160px] h-9 text-sm bg-muted/30 border-border">
              <SelectValue placeholder="Association" />
            </SelectTrigger>
            <SelectContent className="bg-popover max-h-[260px]">
              <SelectItem value="all">Toutes associations</SelectItem>
              {associations.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* ── Ville ── */}
        {cities.length > 0 && (
          <Select
            value={filters.city || "all"}
            onValueChange={(v) => onFiltersChange({ city: v })}
          >
            <SelectTrigger className="w-[130px] h-9 text-sm bg-muted/30 border-border">
              <SelectValue placeholder="Ville" />
            </SelectTrigger>
            <SelectContent className="bg-popover max-h-[260px]">
              <SelectItem value="all">Toutes villes</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* ── Spacer ── */}
        <div className="flex-1" />

        {/* ── Tri ── */}
        <Select
          value={sort}
          onValueChange={(v) => onSortChange(v as SortOption)}
        >
          <SelectTrigger className="w-[150px] h-9 text-sm bg-muted/30 border-border gap-1">
            <ArrowUpDown className="w-3 h-3 shrink-0 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* ── Plus de filtres ── */}
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-2 border-border text-sm",
            advancedCount > 0 && "border-sakura/40 text-sakura bg-sakura/5"
          )}
          onClick={() => setAdvancedOpen(true)}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtres
          {advancedCount > 0 && (
            <Badge className="bg-sakura text-white border-0 text-[10px] px-1.5 py-0 h-4 min-w-4">
              {advancedCount}
            </Badge>
          )}
        </Button>

        {/* ── Reset ── */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground px-2"
          >
            <X className="w-3 h-3" />
            Réinitialiser
          </Button>
        )}

        {/* ── Toggle Vue ── */}
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onViewModeChange("grid")}
                  className={cn(
                    "h-9 w-9 flex items-center justify-center transition-colors",
                    viewMode === "grid"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Vue grille</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onViewModeChange("list")}
                  className={cn(
                    "h-9 w-9 flex items-center justify-center transition-colors",
                    viewMode === "list"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Vue liste</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* ── Active filter chips (recap) ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {filters.search && (
            <FilterChip
              label={`"${filters.search}"`}
              onRemove={() => onFiltersChange({ search: "" })}
            />
          )}
          {filters.eventType && filters.eventType !== "all" && (
            <FilterChip
              label={filters.eventType}
              onRemove={() => onFiltersChange({ eventType: "all" })}
            />
          )}
          {filters.organizerType && filters.organizerType !== "all" && (
            <FilterChip
              label={filters.organizerType === "mp" ? "Manga Paradise" : "Associations"}
              onRemove={() => onFiltersChange({ organizerType: "all", association: "all" })}
            />
          )}
          {filters.association && filters.association !== "all" && (
            <FilterChip
              label={filters.association}
              onRemove={() => onFiltersChange({ association: "all" })}
            />
          )}
          {filters.city && filters.city !== "all" && (
            <FilterChip
              label={filters.city}
              onRemove={() => onFiltersChange({ city: "all" })}
            />
          )}
          {filters.priceFilter && filters.priceFilter !== "all" && (
            <FilterChip
              label={filters.priceFilter === "free" ? "Gratuit" : "Payant"}
              onRemove={() => onFiltersChange({ priceFilter: "all" })}
            />
          )}
          {filters.formatFilter && filters.formatFilter !== "all" && (
            <FilterChip
              label={filters.formatFilter}
              onRemove={() => onFiltersChange({ formatFilter: "all" })}
            />
          )}
          {filters.publicationStatus && filters.publicationStatus !== "all" && (
            <FilterChip
              label={filters.publicationStatus}
              onRemove={() => onFiltersChange({ publicationStatus: "all" })}
            />
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <FilterChip
              label={`${filters.dateFrom || "…"} → ${filters.dateTo || "…"}`}
              onRemove={() => onFiltersChange({ dateFrom: "", dateTo: "" })}
            />
          )}
        </div>
      )}

      {/* ── Advanced Panel ── */}
      <EventFilterAdvancedPanel
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        filters={filters}
        onFiltersChange={onFiltersChange}
        onResetAdvanced={handleResetAdvanced}
        advancedCount={advancedCount}
      />
    </>
  );
};

// ─── Filter Chip ──────────────────────────────────────────────────

const FilterChip = ({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) => (
  <span className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 text-[11px] rounded-full bg-sakura/10 text-sakura border border-sakura/20">
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="p-0.5 rounded-full hover:bg-sakura/20"
    >
      <X className="w-2.5 h-2.5" />
    </button>
  </span>
);

export default EventFilterBar;
