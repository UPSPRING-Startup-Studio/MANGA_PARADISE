import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { ORGANIZER_OPTIONS, EVENT_TYPE_OPTIONS, type OrganizerKey } from "./constants";
import type { EventType } from "@/hooks/useEvents";

interface AgendaFiltersBarProps {
  selectedOrganizer: OrganizerKey;
  onOrganizerChange: (k: OrganizerKey) => void;
  selectedType: EventType | "all";
  onTypeChange: (k: EventType | "all") => void;
  selectedPeriod: "all" | "weekend" | "month";
  onPeriodChange: (k: "all" | "weekend" | "month") => void;
  resultCount: number;
  onReset: () => void;
  hasActiveFilters: boolean;
}

function Chip({ active, label, icon, color, onClick }: { active: boolean; label: string; icon?: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full transition-all duration-200 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C70039]"
      style={{
        padding: "7px 16px",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: active ? 600 : 500,
        fontSize: 13,
        background: active ? color : "#FFFFFF",
        border: `1.5px solid ${active ? color : "#E8E8F0"}`,
        color: active ? "#FFFFFF" : "#4A4A6A",
        boxShadow: active ? `0 2px 8px ${color}25` : "none",
      }}>
      {icon && <span className="text-sm">{icon}</span>}
      {label}
    </button>
  );
}

const PERIOD_OPTIONS = [
  { key: "all" as const, label: "Toutes les dates" },
  { key: "weekend" as const, label: "Ce week-end" },
  { key: "month" as const, label: "Ce mois-ci" },
];

export default function AgendaFiltersBar({ selectedOrganizer, onOrganizerChange, selectedType, onTypeChange, selectedPeriod, onPeriodChange, resultCount, onReset, hasActiveFilters }: AgendaFiltersBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setIsSticky(!e.isIntersecting), { threshold: 1, rootMargin: "-65px 0px 0px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <div ref={barRef} className="h-0" />
      <div className="z-40 transition-all duration-300" style={{
        position: "sticky", top: 64,
        background: isSticky ? "rgba(255,255,255,0.92)" : "#FFFFFF",
        backdropFilter: isSticky ? "blur(16px)" : "none",
        borderBottom: isSticky ? "1px solid #E8E8F0" : "1px solid transparent",
        boxShadow: isSticky ? "0 4px 12px rgba(26,26,46,0.04)" : "none",
      }}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-3.5">
          {/* Row 1 — Organizer */}
          <div className="mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8EA0] mr-3 hidden sm:inline" style={{ fontFamily: "'DM Sans', sans-serif" }}>Organisateur</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
            {ORGANIZER_OPTIONS.map((o) => (
              <Chip key={o.key} active={selectedOrganizer === o.key} label={o.label} icon={o.icon} color={o.color} onClick={() => onOrganizerChange(o.key)} />
            ))}
          </div>

          {/* Row 2 — Type */}
          <div className="mb-1.5 mt-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8EA0] mr-3 hidden sm:inline" style={{ fontFamily: "'DM Sans', sans-serif" }}>Type</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
            {EVENT_TYPE_OPTIONS.map((t) => (
              <Chip key={t.key} active={selectedType === t.key} label={t.label} color="#C70039" onClick={() => onTypeChange(t.key)} />
            ))}
          </div>

          {/* Row 3 — Period + Results + More + Reset */}
          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span className="text-sm font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "#C70039" }}>{resultCount}</span>
                <span className="text-sm text-[#8E8EA0]">événement{resultCount !== 1 ? "s" : ""}</span>
              </div>
              {/* Period chips inline */}
              <div className="hidden sm:flex gap-1.5">
                {PERIOD_OPTIONS.map(p => (
                  <button key={p.key} onClick={() => onPeriodChange(p.key)}
                    className="px-3 py-1 rounded-full text-[12px] font-medium transition-colors"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      background: selectedPeriod === p.key ? "rgba(199,0,57,0.06)" : "transparent",
                      color: selectedPeriod === p.key ? "#C70039" : "#8E8EA0",
                      border: `1px solid ${selectedPeriod === p.key ? "rgba(199,0,57,0.15)" : "transparent"}`,
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMore(!showMore)} className="flex items-center gap-1.5 text-[13px] text-[#8E8EA0] hover:text-[#C70039] transition-colors" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                <SlidersHorizontal size={14} /> Plus de filtres
              </button>
              {hasActiveFilters && (
                <button onClick={onReset} className="flex items-center gap-1 text-[13px] text-[#8E8EA0] hover:text-[#C70039] transition-colors" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                  <X size={14} /> Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Collapse — mobile period + more filters */}
          {showMore && (
            <div className="mt-3 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ background: "#F8F9FC" }}>
              {/* Mobile period selector */}
              <div className="sm:hidden">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8EA0] mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Période</div>
                <div className="flex gap-1.5 flex-wrap">
                  {PERIOD_OPTIONS.map(p => (
                    <button key={p.key} onClick={() => onPeriodChange(p.key)}
                      className="px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors"
                      style={{ fontFamily: "'DM Sans', sans-serif", borderColor: selectedPeriod === p.key ? "#C70039" : "#E8E8F0", color: selectedPeriod === p.key ? "#C70039" : "#4A4A6A", background: selectedPeriod === p.key ? "rgba(199,0,57,0.06)" : "transparent" }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
