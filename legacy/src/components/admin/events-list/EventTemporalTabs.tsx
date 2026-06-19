/**
 * EventTemporalTabs — Segmented control with temporal tabs and counts
 * 
 * 4 tabs: À venir | En cours | Passés | Tous
 * Each shows a count badge.
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CalendarClock, Play, History, LayoutGrid } from "lucide-react";
import type { TemporalTab, TemporalCounts } from "./eventListHelpers";

interface EventTemporalTabsProps {
  activeTab: TemporalTab;
  counts: TemporalCounts;
  onTabChange: (tab: TemporalTab) => void;
}

const TAB_CONFIG: { id: TemporalTab; label: string; icon: React.ElementType; color: string }[] = [
  { id: "upcoming", label: "À venir", icon: CalendarClock, color: "text-turquoise" },
  { id: "ongoing", label: "En cours", icon: Play, color: "text-green-400" },
  { id: "past", label: "Passés", icon: History, color: "text-muted-foreground" },
  { id: "all", label: "Tous", icon: LayoutGrid, color: "text-foreground" },
];

const EventTemporalTabs = ({ activeTab, counts, onTabChange }: EventTemporalTabsProps) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border">
      {TAB_CONFIG.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        const count = counts[tab.id];

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            )}
          >
            {/* Active background indicator */}
            {isActive && (
              <motion.div
                layoutId="temporal-tab-bg"
                className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm"
                transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
              />
            )}

            {/* Content */}
            <div className="relative flex items-center gap-2">
              <Icon className={cn("w-4 h-4", isActive ? tab.color : "text-muted-foreground")} />
              <span>{tab.label}</span>

              {/* Count Badge */}
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full transition-colors",
                  isActive
                    ? tab.id === "ongoing"
                      ? "bg-green-500/20 text-green-400"
                      : tab.id === "upcoming"
                        ? "bg-turquoise/20 text-turquoise"
                        : "bg-sakura/20 text-sakura"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default EventTemporalTabs;
