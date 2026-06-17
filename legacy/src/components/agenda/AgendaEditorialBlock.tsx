import { ChevronRight } from "lucide-react";
import type { Event } from "@/hooks/useEvents";
import AgendaEventCard from "./AgendaEventCard";

interface AgendaEditorialBlockProps {
  label: string;
  labelColor: string;
  title: string;
  events: Event[];
  variant: "featured" | "rail";
  bookmarkIds?: Set<string>;
  onToggleBookmark?: (eventId: string) => void;
  isLoggedIn?: boolean;
}

export default function AgendaEditorialBlock({ label, labelColor, title, events, variant, bookmarkIds, onToggleBookmark, isLoggedIn }: AgendaEditorialBlockProps) {
  if (events.length === 0) return null;

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="text-sm uppercase tracking-wider mb-1" style={{ fontFamily: "'Bangers', cursive", color: labelColor, letterSpacing: "0.04em", fontSize: 14 }}>{label}</div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "clamp(20px, 3vw, 26px)", color: "#1A1A2E", letterSpacing: "-0.01em" }}>{title}</h2>
        </div>
        <button className="hidden sm:flex items-center gap-1 text-[13px] hover:underline transition-colors" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: "#C70039" }}>
          Voir tout <ChevronRight size={14} />
        </button>
      </div>

      {/* Featured layout */}
      {variant === "featured" && (
        <>
          <div className="hidden lg:grid gap-4" style={{ gridTemplateColumns: "3fr 2fr", gridTemplateRows: "1fr 1fr", height: 380 }}>
            <div style={{ gridRow: "1 / 3" }}><AgendaEventCard event={events[0]} variant="xl" isBookmarked={bookmarkIds?.has(events[0].id)} onToggleBookmark={onToggleBookmark} isLoggedIn={isLoggedIn} /></div>
            {events.slice(1, 3).map((ev) => <AgendaEventCard key={ev.id} event={ev} isBookmarked={bookmarkIds?.has(ev.id)} onToggleBookmark={onToggleBookmark} isLoggedIn={isLoggedIn} />)}
          </div>
          <div className="hidden sm:grid lg:hidden grid-cols-2 gap-4">
            {events.slice(0, 3).map((ev) => <AgendaEventCard key={ev.id} event={ev} isBookmarked={bookmarkIds?.has(ev.id)} onToggleBookmark={onToggleBookmark} isLoggedIn={isLoggedIn} />)}
          </div>
          <div className="sm:hidden flex gap-4 overflow-x-auto pb-3 scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
            {events.slice(0, 3).map((ev) => (
              <div key={ev.id} className="flex-shrink-0 w-[280px]" style={{ scrollSnapAlign: "start" }}><AgendaEventCard event={ev} isBookmarked={bookmarkIds?.has(ev.id)} onToggleBookmark={onToggleBookmark} isLoggedIn={isLoggedIn} /></div>
            ))}
          </div>
        </>
      )}

      {/* Rail layout */}
      {variant === "rail" && (
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
          {events.map((ev) => (
            <div key={ev.id} className="flex-shrink-0 w-[260px] sm:w-[280px]" style={{ scrollSnapAlign: "start" }}><AgendaEventCard event={ev} isBookmarked={bookmarkIds?.has(ev.id)} onToggleBookmark={onToggleBookmark} isLoggedIn={isLoggedIn} /></div>
          ))}
        </div>
      )}
    </div>
  );
}
