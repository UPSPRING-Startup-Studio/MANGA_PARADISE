/**
 * EventsEmptyState — Contextual empty states per temporal tab
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  CalendarPlus, CalendarClock, History, Search, Sparkles,
} from "lucide-react";
import type { TemporalTab } from "./eventListHelpers";

interface EventsEmptyStateProps {
  tab: TemporalTab;
  hasFilters: boolean;
  onCreateEvent: () => void;
  onSwitchTab?: (tab: TemporalTab) => void;
  onResetFilters?: () => void;
}

const EventsEmptyState = ({
  tab,
  hasFilters,
  onCreateEvent,
  onSwitchTab,
  onResetFilters,
}: EventsEmptyStateProps) => {
  // If filters are active, show a filter-specific empty state
  if (hasFilters) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 space-y-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Search className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-display text-lg text-foreground">Aucun résultat</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Aucun événement ne correspond à tes filtres. Essaie de modifier ta recherche ou tes critères.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onResetFilters} className="gap-2">
          <Search className="w-4 h-4" />
          Réinitialiser les filtres
        </Button>
      </motion.div>
    );
  }

  // Tab-specific empty states
  const config = getEmptyConfig(tab);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 space-y-4"
    >
      <div className={`w-16 h-16 rounded-2xl ${config.bgClass} flex items-center justify-center`}>
        <config.icon className={`w-8 h-8 ${config.iconClass}`} />
      </div>
      <div className="text-center space-y-1">
        <h3 className="font-display text-lg text-foreground">{config.title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{config.description}</p>
      </div>
      <div className="flex items-center gap-2">
        {config.primaryAction && (
          <Button
            onClick={config.primaryAction.action === "create" ? onCreateEvent : undefined}
            className="gap-2 bg-sakura hover:bg-sakura/90 text-white"
            size="sm"
          >
            <config.primaryAction.icon className="w-4 h-4" />
            {config.primaryAction.label}
          </Button>
        )}
        {config.secondaryAction && onSwitchTab && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSwitchTab(config.secondaryAction!.tab)}
            className="gap-2"
          >
            <config.secondaryAction.icon className="w-4 h-4" />
            {config.secondaryAction.label}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// ─── Empty State Configs ──────────────────────────────────────────

interface EmptyConfig {
  icon: React.ElementType;
  bgClass: string;
  iconClass: string;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    icon: React.ElementType;
    action: "create";
  };
  secondaryAction?: {
    label: string;
    icon: React.ElementType;
    tab: TemporalTab;
  };
}

function getEmptyConfig(tab: TemporalTab): EmptyConfig {
  switch (tab) {
    case "upcoming":
      return {
        icon: CalendarPlus,
        bgClass: "bg-turquoise/10",
        iconClass: "text-turquoise/50",
        title: "Aucun événement à venir",
        description: "Il n'y a pas encore d'événement planifié. Crée-en un pour lancer l'Agenda !",
        primaryAction: { label: "Créer un événement", icon: CalendarPlus, action: "create" },
      };
    case "ongoing":
      return {
        icon: Sparkles,
        bgClass: "bg-green-500/10",
        iconClass: "text-green-500/50",
        title: "Aucun événement en cours",
        description: "Aucun événement ne se déroule actuellement. Consulte les événements à venir.",
        secondaryAction: { label: "Voir les à venir", icon: CalendarClock, tab: "upcoming" },
      };
    case "past":
      return {
        icon: History,
        bgClass: "bg-muted/50",
        iconClass: "text-muted-foreground/30",
        title: "Aucun événement passé",
        description: "L'historique est vide pour le moment. Les événements terminés apparaîtront ici.",
        secondaryAction: { label: "Voir les à venir", icon: CalendarClock, tab: "upcoming" },
      };
    case "all":
    default:
      return {
        icon: CalendarPlus,
        bgClass: "bg-sakura/10",
        iconClass: "text-sakura/50",
        title: "Aucun événement",
        description: "Commence par créer ton premier événement pour faire vivre ta communauté !",
        primaryAction: { label: "Créer un événement", icon: CalendarPlus, action: "create" },
      };
  }
}

export default EventsEmptyState;
