import { LayoutGrid, List, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export type SortKey = "date_closest" | "date_recent" | "popularity" | "proximity";

interface AgendaToolbarProps {
  sortBy: SortKey;
  onSortChange: (sort: SortKey) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date_closest", label: "Date (plus proche)" },
  { key: "date_recent", label: "Date (plus récent)" },
  { key: "popularity", label: "Popularité" },
  { key: "proximity", label: "Proximité" },
];

export default function AgendaToolbar({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: AgendaToolbarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentSort =
    SORT_OPTIONS.find((s) => s.key === sortBy) || SORT_OPTIONS[0];

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);

  return (
    <div className="flex items-center gap-3">
      {/* Sort dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setSortOpen(!sortOpen)}
          className="flex items-center gap-1.5 rounded-full transition-colors hover:border-[#C70039] hover:text-[#C70039]"
          style={{
            padding: "8px 16px",
            border: "1px solid #E8E8F0",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: 13,
            color: "#4A4A6A",
            background: "#fff",
          }}
        >
          Trier par : {currentSort.label}
          <ChevronDown
            size={14}
            className={`transition-transform ${sortOpen ? "rotate-180" : ""}`}
          />
        </button>
        {sortOpen && (
          <div
            className="absolute right-0 top-full mt-2 rounded-xl py-1.5 z-50"
            style={{
              background: "#fff",
              border: "1px solid #E8E8F0",
              boxShadow: "0 8px 24px rgba(26,26,46,0.08)",
              minWidth: 200,
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  onSortChange(opt.key);
                  setSortOpen(false);
                }}
                className="block w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#F8F9FC] transition-colors"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: sortBy === opt.key ? 600 : 400,
                  color: sortBy === opt.key ? "#C70039" : "#4A4A6A",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View mode toggle */}
      <div
        className="hidden sm:flex items-center rounded-[10px] p-0.5"
        style={{ background: "#E8E8F0" }}
      >
        {(
          [
            { mode: "grid" as const, icon: LayoutGrid },
            { mode: "list" as const, icon: List },
          ] as const
        ).map(({ mode, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center transition-all"
            style={{
              background: viewMode === mode ? "#FFFFFF" : "transparent",
              boxShadow:
                viewMode === mode
                  ? "0 1px 3px rgba(26,26,46,0.08)"
                  : "none",
            }}
          >
            <Icon
              size={18}
              color={viewMode === mode ? "#1A1A2E" : "#8E8EA0"}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
