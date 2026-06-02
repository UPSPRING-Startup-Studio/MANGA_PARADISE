import { useState, useCallback, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Pin,
  PinOff,
  Search,
  X,
  Calendar,
  Loader2,
  Sparkles,
  AlertCircle,
  List,
  Map,
  Ghost,
  MapPinOff,
  Plus,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/contexts/AuthContext";
import {
  useFilteredEvents,
  usePinnedCity,
  useUpdatePinnedCity,
  type EventType,
  type EventFilters,
} from "@/hooks/useEvents";
import { EventCard } from "@/components/events/EventCard";
import { JapanIcon } from "@/components/decor/JapanIcon";
import { KirakiraDecor } from "@/components/decor/KirakiraDecor";

// ============================================================
// TYPES & CONSTANTS
// ============================================================

interface FilterTab {
  value: EventType | "all";
  label: string;
  emoji: string;
}

const FILTER_TABS: FilterTab[] = [
  { value: "all", label: "Tous", emoji: "🌐" },
  { value: "convention", label: "Conventions", emoji: "🎌" },
  { value: "tournoi", label: "Tournois", emoji: "⚔️" },
  { value: "atelier", label: "Ateliers", emoji: "🎨" },
  { value: "projection", label: "Projections", emoji: "🎬" },
];

type OrganizerFilter = "all" | "mp" | "associations";
type TimeFilter = "all" | "weekend" | "month";
type ViewMode = "list" | "radar";

const ORGANIZER_TABS: { value: OrganizerFilter; label: string; emoji: string }[] = [
  { value: "all", label: "Tout l'agenda", emoji: "🌐" },
  { value: "mp", label: "Manga Paradise", emoji: "🏯" },
  { value: "associations", label: "Associations", emoji: "🏛️" },
];

const getDateRange = (filter: TimeFilter): { date_from?: string; date_to?: string } => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  if (filter === "weekend") {
    const dayOfWeek = now.getDay();
    const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSaturday);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    return {
      date_from: saturday.toISOString().split("T")[0],
      date_to: sunday.toISOString().split("T")[0],
    };
  }

  if (filter === "month") {
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      date_from: today,
      date_to: endOfMonth.toISOString().split("T")[0],
    };
  }

  return {};
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

const EventCardSkeleton = ({ index }: { index: number }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.05 }}
    className="rounded-2xl overflow-hidden bg-white border border-mp-border"
  >
    <div className="h-44 bg-mp-cloud animate-pulse" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-mp-cloud rounded animate-pulse w-3/4" />
      <div className="h-3 bg-mp-cloud rounded animate-pulse w-1/2" />
      <div className="h-3 bg-mp-cloud rounded animate-pulse w-2/3" />
    </div>
  </motion.div>
);

const EmptyState = ({
  city,
  type,
  timeFilter,
}: {
  city?: string;
  type?: string;
  timeFilter?: TimeFilter;
}) => {
  const getMessage = () => {
    if (city) return `Aucun événement trouvé à ${city}... Sois le premier à suggérer un Meet-up communautaire !`;
    if (timeFilter === "weekend") return "Aucun événement ce week-end... Mais le prochain arrive bientôt !";
    if (timeFilter === "month") return "Aucun événement ce mois-ci... Reviens bientôt !";
    return "Aucun événement ne correspond à tes filtres... Essaie une autre combinaison !";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="col-span-full flex flex-col items-center justify-center py-20 text-center px-4"
    >
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, -5, 5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 bg-mp-primary/10 border border-mp-primary/20"
      >
        {city ? (
          <MapPinOff className="w-12 h-12 text-mp-primary/60" />
        ) : (
          <Ghost className="w-12 h-12 text-mp-primary/60" />
        )}
      </motion.div>
      <h3 className="font-display italic font-extrabold text-2xl text-mp-ink mb-3">
        Pas encore d'événements ici…
      </h3>
      <p className="text-mp-ink-muted text-sm max-w-sm leading-relaxed mb-6">{getMessage()}</p>
      <Button onClick={() => console.log("[Agenda] Proposer un événement")} className="gap-2">
        <Plus className="w-4 h-4" />
        Proposer un événement
      </Button>
    </motion.div>
  );
};

const RadarPlaceholder = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
    className="flex flex-col items-center justify-center py-24 text-center bg-white border border-mp-border rounded-3xl shadow-card"
  >
    <div className="relative w-32 h-32 mb-8">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{ border: `1px solid hsl(var(--mp-primary) / ${0.4 - i * 0.1})` }}
          animate={{ scale: [1, 1 + i * 0.3], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-mp-primary/10 border border-mp-primary/30">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
          <Map className="w-10 h-10 text-mp-primary" />
        </motion.div>
      </div>
    </div>
    <h3 className="font-display italic font-extrabold text-2xl text-mp-ink mb-3">
      Vue Radar <span className="text-mp-primary">interactive</span>
    </h3>
    <p className="text-mp-ink-muted text-sm max-w-xs leading-relaxed">
      Vue Radar interactive à venir...<br />
      <span className="text-mp-ink-soft text-xs mt-1 block">Carte Leaflet avec clustering.</span>
    </p>
    <div className="mt-6 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-mp-primary/10 border border-mp-primary/20 text-mp-primary">
      Bientôt disponible
    </div>
  </motion.div>
);

// ============================================================
// Section dédiée : Événements des associations
// ============================================================

const AssociationEventsSection = ({
  events,
  isLoading,
  onViewAll,
}: {
  events: any[] | undefined;
  isLoading: boolean;
  onViewAll: () => void;
}) => {
  const assocEvents = useMemo(
    () => (events || []).filter((e: any) => e.association_id).slice(0, 6),
    [events]
  );

  if (isLoading) return null;
  if (assocEvents.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-2xl p-5 space-y-4 bg-white border border-mp-border shadow-card"
    >
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-mp-primary/10 border border-mp-primary/20">
            <Building2 className="w-4 h-4 text-mp-primary" />
          </div>
          <div>
            <h2 className="text-mp-ink font-bold text-sm uppercase tracking-widest">
              Événements des associations
            </h2>
            <p className="text-mp-ink-muted text-xs mt-0.5">
              Rencontres, ateliers et sorties proposés par les clubs partenaires
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1.5 text-xs shrink-0">
          Voir tout
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Carrousel horizontal */}
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {assocEvents.map((event: any, index: number) => (
          <div key={event.id} className="min-w-[280px] max-w-[320px] snap-start shrink-0">
            <EventCard event={event} index={index} />
          </div>
        ))}
      </div>
    </motion.section>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================

const Agenda = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Détecter si on est sur /agenda/associations
  const isAssociationsRoute = location.pathname === "/agenda/associations";

  // --- État local ---
  const [cityInput, setCityInput] = useState("");
  const [activeTab, setActiveTab] = useState<EventType | "all">("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [organizerFilter, setOrganizerFilter] = useState<OrganizerFilter>(
    isAssociationsRoute ? "associations" : "all"
  );

  // Sync filtre quand la route change
  useEffect(() => {
    if (isAssociationsRoute && organizerFilter !== "associations") {
      setOrganizerFilter("associations");
    }
  }, [isAssociationsRoute]);

  // --- Hooks de données ---
  const { data: pinnedCity, isLoading: isPinnedCityLoading } = usePinnedCity(user?.id);
  const { mutate: updatePinnedCity, isPending: isUpdatingCity } = useUpdatePinnedCity();

  const dateRange = getDateRange(timeFilter);

  const filters: EventFilters = {
    type_evenement: activeTab !== "all" ? activeTab : undefined,
    upcoming_only: false,
    organizer: organizerFilter !== "all" ? organizerFilter : undefined,
    ...dateRange,
  };

  const { data: rawEvents, isLoading: isEventsLoading, error: eventsError } = useFilteredEvents(filters);

  const events = useMemo(() => {
    if (!rawEvents) return rawEvents;
    if (!pinnedCity) return rawEvents;
    const pin = pinnedCity.toLowerCase();
    return [...rawEvents].sort((a, b) => {
      const aMatch = a.city?.toLowerCase().includes(pin) ? 0 : 1;
      const bMatch = b.city?.toLowerCase().includes(pin) ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [rawEvents, pinnedCity]);

  const { data: allEvents } = useFilteredEvents({
    upcoming_only: false,
  });

  // --- Handlers ---
  const handlePinCity = useCallback(() => {
    if (!user?.id || !cityInput.trim()) return;
    updatePinnedCity({ profileId: user.id, city: cityInput.trim() });
    setCityInput("");
  }, [user?.id, cityInput, updatePinnedCity]);

  const handleUnpinCity = useCallback(() => {
    if (!user?.id) return;
    updatePinnedCity({ profileId: user.id, city: null });
  }, [user?.id, updatePinnedCity]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handlePinCity();
  };

  const handleOrganizerChange = (value: OrganizerFilter) => {
    setOrganizerFilter(value);
    if (value !== "associations" && isAssociationsRoute) {
      navigate("/agenda", { replace: true });
    }
  };

  const handleViewAllAssociations = () => {
    setOrganizerFilter("associations");
    navigate("/agenda/associations");
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-mp-paper relative">
      {/* Décor cinabre subtil + pétales sakura */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-mp-primary/5 blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-[28rem] h-[28rem] rounded-full bg-mp-orange/5 blur-3xl" />
        <KirakiraDecor density="low" />
        <div className="absolute top-12 right-12 opacity-10 hidden lg:block">
          <JapanIcon name="torii" className="w-32 h-32 text-mp-primary" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-mp-primary/10 border border-mp-primary/20">
              {isAssociationsRoute ? (
                <Building2 className="w-6 h-6 text-mp-primary" />
              ) : (
                <Calendar className="w-6 h-6 text-mp-primary" />
              )}
            </div>
            <div>
              {isAssociationsRoute ? (
                <>
                  <h1 className="font-display italic font-extrabold text-3xl md:text-5xl text-mp-ink leading-tight">
                    Agenda des <span className="text-mp-primary">Associations</span>
                  </h1>
                  <p className="text-mp-ink-muted text-sm md:text-base">
                    Retrouve tous les événements organisés par les clubs et associations partenaires de Manga Paradise.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="font-display italic font-extrabold text-3xl md:text-5xl text-mp-ink leading-tight">
                    Agenda <span className="text-mp-primary">Otaku</span>
                  </h1>
                  <p className="text-mp-ink-muted text-sm md:text-base">
                    Conventions, tournois, ateliers — ne rate plus rien.
                  </p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── SECTION ASSOCIATION ── */}
        {!isAssociationsRoute && organizerFilter === "all" && (
          <AssociationEventsSection
            events={allEvents}
            isLoading={isEventsLoading}
            onViewAll={handleViewAllAssociations}
          />
        )}

        {/* ── HUB LOCAL ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl p-5 space-y-4 bg-white border border-mp-border shadow-card"
        >
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-mp-primary" />
            <h2 className="text-mp-ink font-bold text-sm uppercase tracking-widest">
              Mon Hub Local
            </h2>
          </div>

          <AnimatePresence mode="wait">
            {pinnedCity && !isPinnedCityLoading ? (
              <motion.div
                key="pinned"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between rounded-xl px-4 py-3 bg-mp-primary/8 border border-mp-primary/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-mp-primary/15">
                    <MapPin className="w-4 h-4 text-mp-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-mp-ink-muted uppercase tracking-wider">Événements à</p>
                    <p className="text-mp-ink font-bold text-base">{pinnedCity}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUnpinCity}
                  disabled={isUpdatingCity}
                  className="text-mp-ink-muted hover:text-mp-primary"
                >
                  {isUpdatingCity ? <Loader2 className="w-4 h-4 animate-spin" /> : <PinOff className="w-4 h-4" />}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="no-pin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-mp-ink-muted text-sm"
              >
                <Sparkles className="w-4 h-4 text-mp-saffron" />
                <span>Épingle une ville pour voir les événements locaux en priorité.</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mp-ink-muted pointer-events-none" />
              <Input
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Rechercher une ville... (ex: Paris, Lyon)"
                className="pl-9 h-11"
              />
              {cityInput && (
                <button
                  onClick={() => setCityInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mp-ink-muted hover:text-mp-ink transition-colors"
                  aria-label="Effacer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              onClick={handlePinCity}
              disabled={!cityInput.trim() || isUpdatingCity}
              className="h-11 px-4 flex-shrink-0"
            >
              {isUpdatingCity ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Pin className="w-4 h-4 mr-1.5" />
                  Épingler
                </>
              )}
            </Button>

            {/* Filtre temporel */}
            <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
              <SelectTrigger className="h-11 w-auto min-w-[160px] flex-shrink-0">
                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                <SelectValue placeholder="Toutes les dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🗓️ Toutes les dates</SelectItem>
                <SelectItem value="weekend">🎉 Ce week-end</SelectItem>
                <SelectItem value="month">📅 Ce mois-ci</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.section>

        {/* ── SEGMENTED CONTROL : Organisateur ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="inline-flex gap-1 p-1 rounded-2xl bg-white border border-mp-border shadow-card">
            {ORGANIZER_TABS.map((tab) => {
              const isActive = organizerFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleOrganizerChange(tab.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-mp-primary text-white shadow-primary"
                      : "text-mp-ink-soft hover:text-mp-ink hover:bg-mp-cloud"
                  }`}
                >
                  <span>{tab.emoji}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── FILTRES PAR TYPE (TABS) + TOGGLE VUE ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex items-center gap-3 flex-wrap"
        >
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as EventType | "all")}
            className="flex-1 min-w-0"
          >
            <TabsList className="flex gap-1 p-1 rounded-2xl w-full overflow-x-auto bg-white border border-mp-border shadow-card">
              {FILTER_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 min-w-fit rounded-xl text-sm font-semibold transition-all data-[state=active]:bg-mp-primary data-[state=active]:text-white data-[state=inactive]:text-mp-ink-soft data-[state=inactive]:hover:text-mp-ink"
                >
                  <span className="mr-1.5">{tab.emoji}</span>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
            className="flex-shrink-0 bg-white border border-mp-border rounded-xl p-1 shadow-card"
          >
            <ToggleGroupItem
              value="list"
              aria-label="Vue Liste"
              className="rounded-lg w-9 h-9 data-[state=on]:bg-mp-primary data-[state=on]:text-white text-mp-ink-soft hover:text-mp-ink transition-colors"
            >
              <List className="w-4 h-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="radar"
              aria-label="Vue Radar"
              className="rounded-lg w-9 h-9 data-[state=on]:bg-mp-primary data-[state=on]:text-white text-mp-ink-soft hover:text-mp-ink transition-colors"
            >
              <Map className="w-4 h-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </motion.div>

        {/* ── RÉSUMÉ DES FILTRES ACTIFS ── */}
        <AnimatePresence>
          {(activeTab !== "all" || timeFilter !== "all" || organizerFilter !== "all") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 flex-wrap"
            >
              <span className="text-mp-ink-muted text-xs">Filtres actifs :</span>
              {activeTab !== "all" && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-mp-primary/10 border border-mp-primary/20 text-mp-primary">
                  {FILTER_TABS.find((t) => t.value === activeTab)?.emoji}{" "}
                  {FILTER_TABS.find((t) => t.value === activeTab)?.label}
                </span>
              )}
              {timeFilter !== "all" && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-mp-saffron/15 border border-mp-saffron/30 text-mp-orange">
                  <Calendar className="w-3 h-3" />
                  {timeFilter === "weekend" ? "Ce week-end" : "Ce mois-ci"}
                </span>
              )}
              {organizerFilter !== "all" && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-mp-coral/10 border border-mp-coral/30 text-mp-coral">
                  <Building2 className="w-3 h-3" />
                  {organizerFilter === "mp" ? "Manga Paradise" : "Associations"}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CONTENU PRINCIPAL ── */}
        <section>
          {!isEventsLoading && events && events.length > 0 && viewMode === "list" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-mp-ink-muted text-sm mb-4"
            >
              <span className="text-mp-ink font-bold">{events.length}</span> événement
              {events.length > 1 ? "s" : ""} trouvé{events.length > 1 ? "s" : ""}
            </motion.p>
          )}

          {eventsError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-4 rounded-xl mb-4 bg-mp-primary/5 border border-mp-primary/30"
            >
              <AlertCircle className="w-5 h-5 text-mp-primary flex-shrink-0" />
              <p className="text-mp-ink text-sm">
                Impossible de charger les événements. Vérifie ta connexion.
              </p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {viewMode === "radar" ? (
              <motion.div
                key="radar"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <RadarPlaceholder />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {isEventsLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} index={i} />)
                  ) : events && events.length > 0 ? (
                    events.map((event, index) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        index={index}
                        participantCount={parseInt(event.id.slice(-2), 16) % 50 || undefined}
                      />
                    ))
                  ) : (
                    !eventsError && (
                      <EmptyState
                        type={activeTab !== "all" ? activeTab : undefined}
                        timeFilter={timeFilter}
                      />
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
};

export default Agenda;
