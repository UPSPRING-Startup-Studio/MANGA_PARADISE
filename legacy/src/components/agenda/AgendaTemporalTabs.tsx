import type { AgendaTab, AgendaCounts } from "@/hooks/useAgendaEvents";

interface AgendaTemporalTabsProps {
  activeTab: AgendaTab;
  onTabChange: (tab: AgendaTab) => void;
  counts: AgendaCounts;
}

const TABS: { key: AgendaTab; label: string }[] = [
  { key: "upcoming", label: "À venir" },
  { key: "ongoing", label: "En cours" },
  { key: "past", label: "Passés" },
  { key: "all", label: "Tous" },
];

export default function AgendaTemporalTabs({
  activeTab,
  onTabChange,
  counts,
}: AgendaTemporalTabsProps) {
  return (
    <div
      className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
      style={{ scrollSnapType: "x mandatory" }}
    >
      {TABS.map(({ key, label }) => {
        const isActive = activeTab === key;
        const count = counts[key];

        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className="flex items-center gap-2 whitespace-nowrap rounded-full transition-all duration-200 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C70039]"
            style={{
              padding: "10px 20px",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: isActive ? 700 : 500,
              fontSize: 14,
              background: isActive ? "#1A1A2E" : "transparent",
              color: isActive ? "#FFFFFF" : "#4A4A6A",
              border: isActive
                ? "1.5px solid #1A1A2E"
                : "1.5px solid #E8E8F0",
              scrollSnapAlign: "start",
            }}
          >
            {label}
            <span
              className="inline-flex items-center justify-center rounded-full min-w-[24px] h-[22px] px-1.5"
              style={{
                background: isActive
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(26,26,46,0.06)",
                color: isActive ? "#FFFFFF" : "#8E8EA0",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
