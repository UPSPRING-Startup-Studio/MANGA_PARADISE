import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Bookmark, PenLine, Search, SlidersHorizontal, X, MapPin } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AgendaTemporalTabs from "@/components/agenda/AgendaTemporalTabs";
import AgendaEventCard from "@/components/agenda/AgendaEventCard";
import AgendaToolbar, { type SortKey } from "@/components/agenda/AgendaToolbar";
import AgendaEmptyState from "@/components/agenda/AgendaEmptyState";
import AgendaCTA from "@/components/agenda/AgendaCTA";
import EventProposalModal from "@/components/agenda/EventProposalModal";
import { ORGANIZER_OPTIONS, EVENT_TYPE_OPTIONS, type OrganizerKey } from "@/components/agenda/constants";
import { useAuth } from "@/contexts/AuthContext";
import { type EventType } from "@/hooks/useEvents";
import {
  useAgendaEvents,
  sortEvents,
  getDefaultSort,
  type AgendaTab,
  type EnrichedEvent,
} from "@/hooks/useAgendaEvents";
import { useUserBookmarkIds, useToggleBookmark } from "@/hooks/useEventBookmarks";
import { useEventContentCounts } from "@/hooks/useEventContentCounts";

// ============================================================
// CONSTANTS
// ============================================================

const PAGE_SIZE = 12;

const CITIES = [
  "Toutes",
  "Nice",
  "Paris",
  "Marseille",
  "Lyon",
  "Toulouse",
  "Bordeaux",
  "Cannes",
  "Strasbourg",
  "Montpellier",
];

// ============================================================
// PAGE
// ============================================================

export default function AgendaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL-driven state ────────────────────────────────────────
  const initialTab = (searchParams.get("tab") as AgendaTab) || "upcoming";
  const initialSort = (searchParams.get("sort") as SortKey) || getDefaultSort(initialTab);

  const [activeTab, setActiveTab] = useState<AgendaTab>(initialTab);
  const [sortBy, setSortBy] = useState<SortKey>(initialSort);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // ── Filters ─────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedOrganizer, setSelectedOrganizer] = useState<OrganizerKey>("all");
  const [selectedType, setSelectedType] = useState<EventType | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  // ── Bookmarks ───────────────────────────────────────────────
  const { data: bookmarkIds = new Set<string>() } = useUserBookmarkIds(user?.id);
  const toggleBookmark = useToggleBookmark();

  const handleToggleBookmark = useCallback(
    (eventId: string) => {
      if (!user?.id) return;
      toggleBookmark.mutate({
        userId: user.id,
        eventId,
        isCurrentlyBookmarked: bookmarkIds.has(eventId),
      });
    },
    [user?.id, bookmarkIds, toggleBookmark]
  );

  // ── Proposal modal ──────────────────────────────────────────
  const [proposalOpen, setProposalOpen] = useState(false);

  // ── Data ────────────────────────────────────────────────────
  const { upcoming, ongoing, past, counts, isLoading, error } = useAgendaEvents({
    searchQuery,
    selectedCity,
    selectedOrganizer,
    selectedType,
  });

  // ── Content counts pour CTA contextuels sur cartes passées ──
  const pastEventIds = useMemo(() => past.map((e) => e.id), [past]);
  const { data: contentCountsMap = {} } = useEventContentCounts(pastEventIds);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCity !== "" ||
    selectedOrganizer !== "all" ||
    selectedType !== "all";

  // ── Tab change → persist in URL + reset sort to default ─────
  const handleTabChange = useCallback(
    (tab: AgendaTab) => {
      setActiveTab(tab);
      const defaultSort = getDefaultSort(tab);
      setSortBy(defaultSort);
      setVisibleCount(PAGE_SIZE);
      setSearchParams(
        { tab, sort: defaultSort },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const handleSortChange = useCallback(
    (sort: SortKey) => {
      setSortBy(sort);
      setVisibleCount(PAGE_SIZE);
      setSearchParams(
        { tab: activeTab, sort },
        { replace: true }
      );
    },
    [activeTab, setSearchParams]
  );

  // ── Derive visible events based on tab + sort ───────────────
  const currentEvents = useMemo((): EnrichedEvent[] => {
    switch (activeTab) {
      case "upcoming":
        return sortEvents(upcoming, sortBy);
      case "ongoing":
        return sortEvents(ongoing, sortBy);
      case "past":
        return sortEvents(past, sortBy);
      case "all":
        // La vue "Tous" est gérée spécialement dans le render
        return [];
    }
  }, [activeTab, upcoming, ongoing, past, sortBy]);

  // "Tous" — blocs éditoriaux triés
  const allUpcomingAndOngoing = useMemo(
    () => sortEvents([...ongoing, ...upcoming], "date_closest"),
    [ongoing, upcoming]
  );
  const allPast = useMemo(
    () => sortEvents(past, "date_recent"),
    [past]
  );

  const visibleEvents = currentEvents.slice(0, visibleCount);
  const hasMore = visibleCount < currentEvents.length;

  // ── Reset ───────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    setSearchQuery("");
    setSelectedCity("");
    setSelectedOrganizer("all");
    setSelectedType("all");
    setShowFilters(false);
    setVisibleCount(PAGE_SIZE);
  }, []);

  // ── Card renderer ───────────────────────────────────────────
  const renderCard = (event: EnrichedEvent) => (
    <AgendaEventCard
      key={event.id}
      event={event}
      temporalStatus={event.temporalStatus}
      contentCounts={contentCountsMap[event.id]}
      isBookmarked={bookmarkIds.has(event.id)}
      onToggleBookmark={handleToggleBookmark}
      isLoggedIn={!!user}
    />
  );

  const gridClass =
    viewMode === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      : "flex flex-col gap-4";

  // ── Skeleton loader ─────────────────────────────────────────
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[20px] overflow-hidden animate-pulse"
          style={{ border: "1px solid #E8E8F0" }}
        >
          <div className="bg-[#F0F4FA]" style={{ aspectRatio: "16/9" }} />
          <div className="p-5 space-y-3">
            <div className="h-3 bg-[#F0F4FA] rounded w-1/3" />
            <div className="h-4 bg-[#F0F4FA] rounded w-3/4" />
            <div className="h-3 bg-[#F0F4FA] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  // ── "Voir plus" button ──────────────────────────────────────
  const renderLoadMore = () => (
    <div className="text-center mt-10">
      <button
        onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
        className="rounded-full transition-all duration-200 hover:bg-[#C70039] hover:text-white hover:border-[#C70039]"
        style={{
          padding: "14px 32px",
          border: "2px solid #C70039",
          color: "#C70039",
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: 14,
          background: "transparent",
        }}
      >
        Voir plus d'événements
      </button>
    </div>
  );

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        color: "#1A1A2E",
        overflowX: "hidden",
      }}
    >
      <Navigation />

      <main>
        {/* ════════════════════════════════════════════════════════
            A. HEADER
        ════════════════════════════════════════════════════════ */}
        <section
          className="relative"
          style={{
            background:
              "linear-gradient(180deg, #EBF1F8 0%, #FFFFFF 100%)",
          }}
        >
          <div className="max-w-[1100px] mx-auto text-center px-4 pt-24 md:pt-28 pb-8">
            <h1
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(28px, 5vw, 46px)",
                color: "#1A1A2E",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              Agenda des événements
            </h1>
            <p
              className="mx-auto mt-3 max-w-lg"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 400,
                fontSize: 17,
                color: "#4A4A6A",
                lineHeight: 1.6,
              }}
            >
              Découvre les conventions, festivals, rencontres et sorties manga,
              cosplay et pop culture.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            B. PILOTAGE ZONE (sticky)
        ════════════════════════════════════════════════════════ */}
        <div
          className="sticky top-16 z-40 transition-all duration-300"
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid #E8E8F0",
          }}
        >
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4 space-y-4">
            {/* Row 1 — Segmented control */}
            <AgendaTemporalTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              counts={counts}
            />

            {/* Row 2 — Search + Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div
                className="flex items-center flex-1 gap-2.5 rounded-full overflow-hidden transition-all duration-200 focus-within:border-[#C70039] focus-within:shadow-[0_2px_8px_rgba(199,0,57,0.08)]"
                style={{
                  padding: "0 16px",
                  height: 44,
                  border: "1.5px solid #E8E8F0",
                  background: "#fff",
                }}
              >
                <Search size={16} color="#8E8EA0" className="flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Rechercher un événement, une ville, un univers…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-[#8E8EA0]"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: "#1A1A2E",
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-[#8E8EA0] hover:text-[#C70039] transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filters toggle + Sort + View */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1.5 rounded-full transition-colors hover:border-[#C70039] hover:text-[#C70039]"
                  style={{
                    padding: "8px 16px",
                    border: `1.5px solid ${showFilters || hasActiveFilters ? "#C70039" : "#E8E8F0"}`,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    fontSize: 13,
                    color: showFilters || hasActiveFilters ? "#C70039" : "#4A4A6A",
                    background: showFilters || hasActiveFilters ? "rgba(199,0,57,0.04)" : "#fff",
                  }}
                >
                  <SlidersHorizontal size={14} />
                  Filtres
                  {hasActiveFilters && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: "#C70039" }}
                    />
                  )}
                </button>

                <AgendaToolbar
                  sortBy={sortBy}
                  onSortChange={handleSortChange}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </div>
            </div>

            {/* Row 3 — Expandable filters */}
            {showFilters && (
              <div
                className="rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4"
                style={{ background: "#F8F9FC" }}
              >
                {/* Ville */}
                <div>
                  <label
                    className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8EA0] mb-1.5"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Ville
                  </label>
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 h-10"
                    style={{
                      background: "#fff",
                      border: "1px solid #E8E8F0",
                    }}
                  >
                    <MapPin size={14} color="#C70039" />
                    <select
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value);
                        setVisibleCount(PAGE_SIZE);
                      }}
                      className="flex-1 appearance-none bg-transparent outline-none cursor-pointer"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 500,
                        fontSize: 13,
                        color: "#4A4A6A",
                      }}
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c === "Toutes" ? "" : c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Type d'événement */}
                <div>
                  <label
                    className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8EA0] mb-1.5"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Type d'événement
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value as EventType | "all");
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className="w-full appearance-none rounded-xl px-3 h-10 outline-none cursor-pointer"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500,
                      fontSize: 13,
                      color: "#4A4A6A",
                      background: "#fff",
                      border: "1px solid #E8E8F0",
                    }}
                  >
                    {EVENT_TYPE_OPTIONS.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Organisateur */}
                <div>
                  <label
                    className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E8EA0] mb-1.5"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Organisateur
                  </label>
                  <select
                    value={selectedOrganizer}
                    onChange={(e) => {
                      setSelectedOrganizer(e.target.value as OrganizerKey);
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className="w-full appearance-none rounded-xl px-3 h-10 outline-none cursor-pointer"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500,
                      fontSize: 13,
                      color: "#4A4A6A",
                      background: "#fff",
                      border: "1px solid #E8E8F0",
                    }}
                  >
                    {ORGANIZER_OPTIONS.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.icon ? `${o.icon} ${o.label}` : o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset */}
                {hasActiveFilters && (
                  <div className="sm:col-span-3 flex justify-end">
                    <button
                      onClick={resetAll}
                      className="flex items-center gap-1 text-[13px] text-[#8E8EA0] hover:text-[#C70039] transition-colors"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 500,
                      }}
                    >
                      <X size={14} /> Réinitialiser les filtres
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            C. SHORTCUTS BAR (favoris + proposer)
        ════════════════════════════════════════════════════════ */}
        <section style={{ background: "#F8F9FC" }}>
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-6 pb-0 flex items-center justify-between flex-wrap gap-3">
            {/* Result count */}
            <div className="flex items-baseline gap-2">
              <span
                className="text-sm font-bold"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  color: "#C70039",
                }}
              >
                {counts[activeTab]}
              </span>
              <span
                className="text-sm text-[#8E8EA0]"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
              >
                événement{counts[activeTab] !== 1 ? "s" : ""}
              </span>
            </div>

            {user && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/agenda/favoris")}
                  className="inline-flex items-center gap-2 rounded-full transition-all duration-200 hover:border-[#C70039] hover:text-[#C70039]"
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
                  <Bookmark size={14} />
                  Mes favoris
                  {bookmarkIds.size > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[11px] font-bold leading-none"
                      style={{
                        background: "rgba(199,0,57,0.1)",
                        color: "#C70039",
                      }}
                    >
                      {bookmarkIds.size}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setProposalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full text-white transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    padding: "8px 16px",
                    background: "#C70039",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  <PenLine size={14} />
                  Proposer
                </button>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════
              D. MAIN CONTENT AREA
          ══════════════════════════════════════════════════════ */}
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
            {isLoading ? (
              renderSkeleton()
            ) : error ? (
              <div className="text-center py-16 px-4">
                <div className="text-5xl mb-4">&#x26a0;&#xfe0f;</div>
                <h3
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: 20,
                    color: "#1A1A2E",
                  }}
                >
                  Impossible de charger les événements
                </h3>
                <p
                  className="mt-2 mb-6 max-w-sm mx-auto"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 400,
                    fontSize: 15,
                    color: "#4A4A6A",
                    lineHeight: 1.6,
                  }}
                >
                  Une erreur est survenue. Vérifie ta connexion et réessaie.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 rounded-full transition-all duration-200 hover:bg-[#C70039] hover:text-white hover:border-[#C70039]"
                  style={{
                    padding: "12px 28px",
                    border: "2px solid #C70039",
                    color: "#C70039",
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    background: "transparent",
                  }}
                >
                  Réessayer
                </button>
              </div>
            ) : activeTab === "all" ? (
              /* ══════════════════════════════════════════════════
                 VUE "TOUS" — 2 blocs éditoriaux
              ══════════════════════════════════════════════════ */
              <div>
                {allUpcomingAndOngoing.length === 0 &&
                allPast.length === 0 ? (
                  <AgendaEmptyState
                    tab="all"
                    hasFilters={hasActiveFilters}
                    onReset={resetAll}
                  />
                ) : (
                  <>
                    {/* Bloc 1 — À venir et en ce moment */}
                    {allUpcomingAndOngoing.length > 0 && (
                      <div className="mb-12">
                        <div className="mb-6">
                          <h2
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontWeight: 800,
                              fontSize: 24,
                              color: "#1A1A2E",
                            }}
                          >
                            À venir et en ce moment
                          </h2>
                          <p
                            className="mt-1"
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontWeight: 400,
                              fontSize: 15,
                              color: "#8E8EA0",
                              lineHeight: 1.5,
                            }}
                          >
                            Les prochains rendez-vous à ne pas manquer.
                          </p>
                        </div>
                        <div className={gridClass}>
                          {allUpcomingAndOngoing.map(renderCard)}
                        </div>
                      </div>
                    )}

                    {/* Séparateur visuel */}
                    {allUpcomingAndOngoing.length > 0 &&
                      allPast.length > 0 && (
                        <div className="relative my-12">
                          <div
                            className="absolute inset-0 flex items-center"
                            aria-hidden
                          >
                            <div
                              className="w-full"
                              style={{
                                height: 2,
                                background:
                                  "linear-gradient(90deg, transparent, #E8E8F0 20%, #E8E8F0 80%, transparent)",
                              }}
                            />
                          </div>
                          <div className="relative flex justify-center">
                            <span
                              className="px-4"
                              style={{
                                background: "#F8F9FC",
                                fontFamily: "'DM Sans', sans-serif",
                                fontWeight: 600,
                                fontSize: 12,
                                color: "#8E8EA0",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                              }}
                            >
                              Archives
                            </span>
                          </div>
                        </div>
                      )}

                    {/* Bloc 2 — Événements passés */}
                    {allPast.length > 0 && (
                      <div>
                        <div className="mb-6">
                          <h2
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontWeight: 800,
                              fontSize: 24,
                              color: "#4A4A6A",
                            }}
                          >
                            Événements passés
                          </h2>
                          <p
                            className="mt-1"
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontWeight: 400,
                              fontSize: 15,
                              color: "#8E8EA0",
                              lineHeight: 1.5,
                            }}
                          >
                            Retrouve les précédentes éditions, les souvenirs et
                            les moments forts de la communauté.
                          </p>
                        </div>
                        <div className={gridClass}>
                          {allPast.slice(0, visibleCount).map(renderCard)}
                        </div>
                        {allPast.length > visibleCount && renderLoadMore()}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : visibleEvents.length === 0 ? (
              <AgendaEmptyState
                tab={activeTab}
                hasFilters={hasActiveFilters}
                onReset={resetAll}
              />
            ) : (
              /* ══════════════════════════════════════════════════
                 VUE STANDARD (À venir / En cours / Passés)
              ══════════════════════════════════════════════════ */
              <>
                <div className={gridClass}>
                  {visibleEvents.map(renderCard)}
                </div>
                {hasMore && renderLoadMore()}
              </>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            E. CTA BOTTOM
        ════════════════════════════════════════════════════════ */}
        <AgendaCTA onProposeEvent={() => setProposalOpen(true)} />
      </main>

      <Footer />

      {/* Proposal modal */}
      <EventProposalModal
        open={proposalOpen}
        onClose={() => setProposalOpen(false)}
      />
    </div>
  );
}
