import { Search, MapPin, Navigation, CalendarDays, Pin, PinOff } from "lucide-react";
import KumoSeparator from "./KumoSeparator";

interface AgendaHeroProps {
  eventCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCity: string;
  onCityChange: (c: string) => void;
  onQuickFilter: (key: "nearby" | "weekend") => void;
  pinnedCity: string | null;
  onPinCity: () => void;
  onUnpinCity: () => void;
  isLoggedIn: boolean;
}

const CITIES = ["Toutes", "Nice", "Paris", "Marseille", "Lyon", "Toulouse", "Bordeaux", "Cannes", "Strasbourg", "Montpellier"];

export default function AgendaHero({ eventCount, searchQuery, onSearchChange, selectedCity, onCityChange, onQuickFilter, pinnedCity, onPinCity, onUnpinCity, isLoggedIn }: AgendaHeroProps) {
  const cityIsPinned = !!pinnedCity && selectedCity.toLowerCase() === pinnedCity.toLowerCase();

  return (
    <section className="relative" style={{ background: "linear-gradient(180deg, #EBF1F8 0%, #FFFFFF 100%)" }}>
      {/* Decorative kumo */}
      <div className="hidden md:block absolute top-8 -left-16 w-44 opacity-30 pointer-events-none">
        <svg viewBox="0 0 200 80" fill="none"><ellipse cx="100" cy="50" rx="90" ry="30" fill="#E8E8F0" /><ellipse cx="70" cy="40" rx="50" ry="25" fill="#F0F4FA" /><ellipse cx="140" cy="45" rx="45" ry="22" fill="#F0F4FA" /></svg>
      </div>
      <div className="hidden md:block absolute top-20 -right-12 w-36 opacity-20 pointer-events-none">
        <svg viewBox="0 0 200 80" fill="none"><ellipse cx="100" cy="40" rx="80" ry="28" fill="#E8E8F0" /><ellipse cx="60" cy="35" rx="45" ry="20" fill="#F0F4FA" /></svg>
      </div>

      <div className="max-w-3xl mx-auto text-center px-4 pt-24 md:pt-28 pb-12">
        {/* Counter badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full mb-4" style={{ background: "rgba(199,0,57,0.06)", border: "1px solid rgba(199,0,57,0.1)" }}>
          <span className="text-base">🎪</span>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: "#C70039" }}>{eventCount}</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 13, color: "#4A4A6A" }}>événement{eventCount !== 1 ? "s" : ""} à venir</span>
        </div>

        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(30px, 5vw, 50px)", color: "#1A1A2E", letterSpacing: "-0.03em", lineHeight: 1.05 }}>AGENDA OTAKU</h1>
        <p className="mx-auto mt-3 mb-7 max-w-md" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: 17, color: "#4A4A6A", lineHeight: 1.6 }}>
          Conventions, ateliers, tournois, rencontres — trouve ton prochain événement pop culture.
        </p>

        {/* Search bar — desktop pill */}
        <div className="hidden sm:flex max-w-xl mx-auto items-center overflow-hidden rounded-full transition-all duration-200 focus-within:border-[#C70039] focus-within:shadow-[0_4px_16px_rgba(199,0,57,0.1)]" style={{ border: "1.5px solid #E8E8F0", background: "#fff", boxShadow: "0 4px 12px rgba(26,26,46,0.06), 0 2px 4px rgba(199,0,57,0.04)", height: 52 }}>
          <div className="flex items-center flex-1 px-4 gap-2.5">
            <Search size={18} color="#8E8EA0" />
            <input type="text" placeholder="Convention, atelier, cosplay..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-[#8E8EA0]" style={{ fontFamily: "'DM Sans', sans-serif", color: "#1A1A2E" }} />
          </div>
          <div className="w-px h-6 bg-[#E8E8F0]" />
          <div className="flex items-center px-3 gap-1.5 cursor-pointer">
            <MapPin size={16} color="#C70039" />
            <select value={selectedCity} onChange={(e) => onCityChange(e.target.value)} className="appearance-none bg-transparent outline-none cursor-pointer pr-2" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14, color: "#4A4A6A", width: 100 }}>
              {CITIES.map(c => <option key={c} value={c === "Toutes" ? "" : c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Search bar — mobile stacked */}
        <div className="sm:hidden mx-auto max-w-sm rounded-2xl overflow-hidden" style={{ border: "1.5px solid #E8E8F0", background: "#fff", boxShadow: "0 4px 12px rgba(26,26,46,0.06)" }}>
          <div className="flex items-center px-4 h-12 gap-2.5 border-b border-[#E8E8F0]">
            <Search size={18} color="#8E8EA0" />
            <input type="text" placeholder="Rechercher un événement..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-[#8E8EA0]" style={{ fontFamily: "'DM Sans', sans-serif", color: "#1A1A2E" }} />
          </div>
          <div className="flex items-center px-4 h-11 gap-2">
            <MapPin size={16} color="#C70039" />
            <select value={selectedCity} onChange={(e) => onCityChange(e.target.value)} className="flex-1 appearance-none bg-transparent outline-none" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14, color: "#4A4A6A" }}>
              {CITIES.map(c => <option key={c} value={c === "Toutes" ? "" : c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Quick actions + pin city */}
        <div className="flex items-center justify-center gap-2.5 mt-4 flex-wrap">
          <button onClick={() => onQuickFilter("nearby")} className="inline-flex items-center gap-1.5 rounded-full transition-all duration-200 hover:bg-[#C70039] hover:text-white hover:border-[#C70039]" style={{ padding: "9px 18px", background: "rgba(199,0,57,0.06)", border: "1.5px solid rgba(199,0,57,0.12)", color: "#C70039", fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 13 }}>
            <Navigation size={14} /> Autour de moi
          </button>
          <button onClick={() => onQuickFilter("weekend")} className="inline-flex items-center gap-1.5 rounded-full transition-all duration-200 hover:bg-[#C70039] hover:text-white hover:border-[#C70039]" style={{ padding: "9px 18px", background: "rgba(199,0,57,0.06)", border: "1.5px solid rgba(199,0,57,0.12)", color: "#C70039", fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 13 }}>
            <CalendarDays size={14} /> Ce week-end
          </button>

          {/* Pin/unpin city — only if logged in and a city is selected */}
          {isLoggedIn && selectedCity && (
            <button onClick={cityIsPinned ? onUnpinCity : onPinCity} className="inline-flex items-center gap-1.5 rounded-full transition-all duration-200" style={{ padding: "9px 18px", background: cityIsPinned ? "rgba(39,174,96,0.06)" : "rgba(26,26,46,0.04)", border: `1.5px solid ${cityIsPinned ? "rgba(39,174,96,0.15)" : "#E8E8F0"}`, color: cityIsPinned ? "#27AE60" : "#8E8EA0", fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 13 }}>
              {cityIsPinned ? <PinOff size={14} /> : <Pin size={14} />}
              {cityIsPinned ? "Désépingler" : `Épingler ${selectedCity}`}
            </button>
          )}
        </div>

        {/* Pinned city indicator */}
        {pinnedCity && (
          <div className="mt-3 text-[13px]" style={{ fontFamily: "'DM Sans', sans-serif", color: "#27AE60", fontWeight: 500 }}>
            📍 Ville épinglée : {pinnedCity}
          </div>
        )}
      </div>

      <KumoSeparator color="#FFFFFF" />
    </section>
  );
}
