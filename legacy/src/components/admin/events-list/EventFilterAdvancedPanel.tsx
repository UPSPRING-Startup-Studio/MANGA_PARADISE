/**
 * EventFilterAdvancedPanel — Drawer "Plus de filtres"
 *
 * Filtre avancé accessible via un bouton dans la FilterBar.
 * Contient : plage dates, gratuit/payant, présentiel/hybride/en-ligne,
 * statut publication, événements complets/limités.
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Euro, Globe, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PUBLICATION_STATUSES,
  DEFAULT_FILTERS,
  type EventFilters,
} from "./eventListHelpers";

// ─── Types ────────────────────────────────────────────────────────

interface EventFilterAdvancedPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: EventFilters;
  onFiltersChange: (updates: Partial<EventFilters>) => void;
  onResetAdvanced: () => void;
  advancedCount: number;
}

// ─── Chip selector helper ─────────────────────────────────────────

interface ChipOption {
  value: string;
  label: string;
  icon?: string;
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ChipOption[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value === value ? "all" : opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150",
              value === opt.value
                ? "bg-sakura/20 text-sakura border-sakura/40"
                : "bg-muted/30 text-muted-foreground border-border hover:border-sakura/30 hover:text-foreground"
            )}
          >
            {opt.icon && <span>{opt.icon}</span>}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────

const PRICE_OPTIONS: ChipOption[] = [
  { value: "free", label: "Gratuit", icon: "🎁" },
  { value: "paid", label: "Payant",  icon: "💳" },
];

const FORMAT_OPTIONS: ChipOption[] = [
  { value: "presentiel", label: "Présentiel", icon: "📍" },
  { value: "hybride",    label: "Hybride",    icon: "🔗" },
  { value: "en-ligne",   label: "En ligne",   icon: "🌐" },
];

const STATUS_OPTIONS: ChipOption[] = [
  { value: "upcoming",        label: "À venir",         icon: "🟢" },
  { value: "places-limitees", label: "Places limitées", icon: "🟡" },
  { value: "complet",         label: "Complet",         icon: "🔴" },
  { value: "cancelled",       label: "Annulé",          icon: "❌" },
];

const EventFilterAdvancedPanel = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onResetAdvanced,
  advancedCount,
}: EventFilterAdvancedPanelProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-md overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-xl tracking-wide">
              Filtres avancés
            </SheetTitle>
            {advancedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetAdvanced}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3 h-3" />
                Réinitialiser ({advancedCount})
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-7">
          {/* ─ Plage de dates ─ */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Plage de dates
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Du</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => onFiltersChange({ dateFrom: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Au</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => onFiltersChange({ dateTo: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            {(filters.dateFrom || filters.dateTo) && (
              <button
                type="button"
                onClick={() => onFiltersChange({ dateFrom: "", dateTo: "" })}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Effacer les dates
              </button>
            )}
          </div>

          {/* ─ Tarification ─ */}
          <ChipGroup
            label="Tarification"
            options={PRICE_OPTIONS}
            value={filters.priceFilter || "all"}
            onChange={(v) => onFiltersChange({ priceFilter: v })}
          />

          {/* ─ Format ─ */}
          <ChipGroup
            label="Format"
            options={FORMAT_OPTIONS}
            value={filters.formatFilter || "all"}
            onChange={(v) => onFiltersChange({ formatFilter: v })}
          />

          {/* ─ Statut de publication ─ */}
          <ChipGroup
            label="Statut"
            options={STATUS_OPTIONS}
            value={filters.publicationStatus || "all"}
            onChange={(v) => onFiltersChange({ publicationStatus: v })}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-border">
          <Button
            className="w-full bg-sakura hover:bg-sakura/90 text-white"
            onClick={() => onOpenChange(false)}
          >
            Appliquer les filtres
            {advancedCount > 0 && (
              <Badge className="ml-2 bg-white/20 text-white border-0 text-[10px]">
                {advancedCount}
              </Badge>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EventFilterAdvancedPanel;
