import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Loader2,
  Users,
  QrCode,
  Download,
  Trash2,
  Store,
  Drama,
  Layers,
  CalendarDays as CalendarIcon,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import ExhibitorsTab from "@/components/admin/ExhibitorsTab";
import EventEditorSheet from "@/components/events/EventEditorSheet";
import EventListCard from "@/components/events/EventListCard";
import AdminEventSeries from "@/pages/admin/AdminEventSeries";
import AdminEventProposals, { useProposalCount } from "@/pages/admin/AdminEventProposals";
import { cn } from "@/lib/utils";

// events-list components
import EventTemporalTabs from "@/components/admin/events-list/EventTemporalTabs";
import EventFilterBar from "@/components/admin/events-list/EventFilterBar";
import EventsMonthSection from "@/components/admin/events-list/EventsMonthSection";
import EventsEmptyState from "@/components/admin/events-list/EventsEmptyState";
import EventsLoadMore from "@/components/admin/events-list/EventsLoadMore";
import EventListRow from "@/components/admin/events-list/EventListRow";

// helpers
import {
  DEFAULT_FILTERS,
  enrichEvents,
  computeCounts,
  processEvents,
  paginateMonthGroups,
  getDefaultSort,
  extractEventTypes,
  extractCities,
  extractAssociations,
  hasActiveFilters,
  EVENTS_PER_PAGE,
  type TemporalTab,
  type SortOption,
  type EventFilters,
  type AdminEvent,
  type ViewMode,
} from "@/components/admin/events-list/eventListHelpers";

// ─── Component ────────────────────────────────────────────────────

type MainView = "events" | "series" | "proposals";

const AdminEvents = () => {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Main view toggle (events / series / proposals) ──────────────
  const viewParam = searchParams.get("view");
  const mainView: MainView = viewParam === "series" ? "series" : viewParam === "proposals" ? "proposals" : "events";

  const setMainView = useCallback((view: MainView) => {
    setSearchParams((p) => {
      if (view === "events") {
        p.delete("view");
      } else {
        p.set("view", view);
      }
      return p;
    });
  }, [setSearchParams]);

  // ── Proposal count for header ───────────────────────────────────
  const proposalCount = useProposalCount();

  // ── Handle "Nouvelle edition" from series tab ───────────────────
  const handleNewEditionFromSeries = useCallback((seriesId: string, seriesName: string) => {
    // Switch to events tab and open the wizard with series pre-selected
    setSearchParams((p) => {
      p.delete("view");
      p.set("action", "new-edition");
      p.set("seriesId", seriesId);
      p.set("seriesName", seriesName);
      return p;
    });
  }, [setSearchParams]);

  // ── State from URL (tab, sort) ──────────────────────────────────
  const activeTab   = (searchParams.get("tab")  as TemporalTab)  || "upcoming";
  const currentSort = (searchParams.get("sort") as SortOption)   || getDefaultSort(activeTab);

  // ── View mode — persisted in localStorage ──────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("admin-events-view");
    return (saved === "list" || saved === "grid") ? saved : "grid";
  });

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("admin-events-view", mode);
  }, []);

  // ── Filters (partially synced to URL for shareability) ──────────
  const [filters, setFilters] = useState<EventFilters>(() => ({
    ...DEFAULT_FILTERS,
    search:            searchParams.get("q")       || "",
    eventType:         searchParams.get("etype")   || "all",
    organizerType:     searchParams.get("orgtype") || "all",
    city:              searchParams.get("city")    || "all",
    association:       searchParams.get("asso")    || "all",
    publicationStatus: searchParams.get("status")  || "all",
    dateFrom:          searchParams.get("dfrom")   || "",
    dateTo:            searchParams.get("dto")     || "",
    priceFilter:       searchParams.get("price")   || "all",
    formatFilter:      searchParams.get("fmt")     || "all",
  }));

  const [visibleCount, setVisibleCount] = useState(EVENTS_PER_PAGE);

  // ── Modal states ────────────────────────────────────────────────
  const [editorState, setEditorState] = useState<{ open: boolean; event: any }>({
    open: false,
    event: null,
  });
  const [qrModal, setQrModal] = useState<{ open: boolean; event: any }>({
    open: false,
    event: null,
  });
  const [participantsModal, setParticipantsModal] = useState<{ open: boolean; event: any }>({
    open: false,
    event: null,
  });
  const [selectedEventForExhibitors, setSelectedEventForExhibitors] = useState<any>(null);

  // ── Auto-open wizard for "new edition" from series tab ──────────
  const actionParam = searchParams.get("action");
  const seriesIdParam = searchParams.get("seriesId");
  const seriesNameParam = searchParams.get("seriesName");

  useState(() => {
    if (actionParam === "new-edition" && seriesIdParam && !editorState.open) {
      // Build a fake initialEvent with series pre-selected
      setEditorState({
        open: true,
        event: {
          series_id: seriesIdParam,
          series_canonical_name: decodeURIComponent(seriesNameParam || ""),
        },
      });
      // Clean up URL params
      setSearchParams((p) => {
        p.delete("action");
        p.delete("seriesId");
        p.delete("seriesName");
        return p;
      });
    }
  });

  // ── Data fetch ──────────────────────────────────────────────────
  const { data: rawEvents = [], isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          association:associations(name),
          event_participants(count),
          present_participants:event_participants(count)
        `)
        .eq("event_participants.is_present", true)
        .order("date", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const eventIds = data.map((e) => e.id);
        const { data: scheduleData } = await supabase
          .from("event_schedule")
          .select("*")
          .in("event_id", eventIds);

        if (scheduleData) {
          (data as any[]).forEach((event) => {
            event._scheduleItems = scheduleData.filter((s) => s.event_id === event.id);
          });
        }
      }

      return data as AdminEvent[];
    },
  });

  // ── Derived data ────────────────────────────────────────────────
  const enrichedEvents = useMemo(() => enrichEvents(rawEvents), [rawEvents]);
  const counts         = useMemo(() => computeCounts(enrichedEvents), [enrichedEvents]);
  const eventTypes     = useMemo(() => extractEventTypes(enrichedEvents), [enrichedEvents]);
  const cities         = useMemo(() => extractCities(enrichedEvents), [enrichedEvents]);
  const associations   = useMemo(() => extractAssociations(enrichedEvents), [enrichedEvents]);

  const { monthGroups, totalFiltered } = useMemo(
    () => processEvents(rawEvents, activeTab, filters, currentSort),
    [rawEvents, activeTab, filters, currentSort]
  );

  const { visibleGroups, hasMore } = useMemo(
    () => paginateMonthGroups(monthGroups, visibleCount),
    [monthGroups, visibleCount]
  );

  const filtersActive = useMemo(() => hasActiveFilters(filters), [filters]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleTabChange = useCallback((tab: TemporalTab) => {
    const newSort = getDefaultSort(tab);
    setSearchParams((p) => { p.set("tab", tab); p.set("sort", newSort); return p; });
    setVisibleCount(EVENTS_PER_PAGE);
  }, [setSearchParams]);

  const handleFiltersChange = useCallback((updates: Partial<EventFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setVisibleCount(EVENTS_PER_PAGE);

    setSearchParams((p) => {
      const urlMap: [keyof EventFilters, string][] = [
        ["search",            "q"],
        ["eventType",         "etype"],
        ["organizerType",     "orgtype"],
        ["city",              "city"],
        ["association",       "asso"],
        ["publicationStatus", "status"],
        ["dateFrom",          "dfrom"],
        ["dateTo",            "dto"],
        ["priceFilter",       "price"],
        ["formatFilter",      "fmt"],
      ];
      urlMap.forEach(([field, param]) => {
        if (updates[field] !== undefined) {
          const val = updates[field] as string;
          const isEmpty = !val || val === "all" || val === "";
          isEmpty ? p.delete(param) : p.set(param, val);
        }
      });
      return p;
    });
  }, [setSearchParams]);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSearchParams((p) => { p.set("sort", sort); return p; });
  }, [setSearchParams]);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setVisibleCount(EVENTS_PER_PAGE);
    setSearchParams((p) => {
      ["q","etype","orgtype","city","asso","status","dfrom","dto","price","fmt"].forEach((k) => p.delete(k));
      return p;
    });
  }, [setSearchParams]);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + EVENTS_PER_PAGE);
  }, []);

  // ── Participants query ───────────────────────────────────────────
  const { data: participants = [] } = useQuery({
    queryKey: ["event-participants", participantsModal.event?.id],
    queryFn: async () => {
      if (!participantsModal.event?.id) return [];
      const { data, error } = await supabase
        .from("event_participants")
        .select(`*, profile:user_id(username, display_name, avatar_url)`)
        .eq("event_id", participantsModal.event.id);
      if (error) throw error;
      return data;
    },
    enabled: !!participantsModal.event?.id,
  });

  // ── Delete mutation ──────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Événement supprimé");
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    },
  });

  // ── QR helper ───────────────────────────────────────────────────
  const generateQRCode = (id: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      `${window.location.origin}/checkin/${id}`
    )}`;

  const exportParticipantsCSV = () => {
    if (!participants.length) return;
    const rows = participants.map((p: any) => [
      p.profile?.username || "",
      p.profile?.display_name || "",
      p.role || "visitor",
      format(parseISO(p.registered_at), "dd/MM/yyyy HH:mm"),
    ]);
    const csv = [["Pseudo","Nom affiché","Rôle","Date inscription"], ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    Object.assign(document.createElement("a"), {
      href: url,
      download: `participants-${participantsModal.event?.title || "event"}.csv`,
    }).click();
  };

  // ── Extra actions (unchanged, just extracted) ────────────────────
  const renderExtraActions = (event: any) => (
    <>
      <Button variant="ghost" size="sm" onClick={() => setQrModal({ open: true, event })}>
        <QrCode className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setParticipantsModal({ open: true, event })}>
        <Users className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost" size="sm"
        className="text-sakura hover:text-sakura/80"
        onClick={() => navigate(`/admin/scan/${event.id}`)}
      >
        <QrCode className="w-4 h-4" />
      </Button>
      {event._scheduleItems?.some((s: any) => s.is_cosplay_contest || s.category === "contest") && (
        <Button
          variant="ghost" size="sm"
          className="text-[hsl(var(--mp-primary))] hover:text-[hsl(var(--mp-primary))]/80 hover:bg-[hsl(var(--mp-primary))]/10"
          title="Concours Cosplay"
          onClick={() => navigate(`/admin/events/${event.id}/contest-manager`)}
        >
          <Drama className="w-4 h-4" />
        </Button>
      )}
      <Button
        variant="ghost" size="sm"
        className="text-purple-500 hover:text-purple-400"
        onClick={() => setSelectedEventForExhibitors(event)}
      >
        <Store className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost" size="sm"
        className="text-destructive hover:text-destructive ml-auto"
        onClick={() => deleteMutation.mutate(event.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </>
  );

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl mb-1">Gestion des Événements</h1>
          {mainView === "events" && !isLoading && (
            <p className="text-sm text-muted-foreground">
              {enrichedEvents.length} événement{enrichedEvents.length > 1 ? "s" : ""} au total
            </p>
          )}
          {mainView === "proposals" && (
            <p className="text-sm text-muted-foreground">
              {proposalCount} proposition{proposalCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
        {mainView === "events" && (
          <Button
            onClick={() => setEditorState({ open: true, event: null })}
            className="gap-2 bg-sakura hover:bg-sakura/90 text-white shrink-0"
          >
            <Plus className="w-4 h-4" />
            Créer un événement
          </Button>
        )}
      </div>

      {/* ── Main View Toggle (Events / Series / Proposals) ── */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 w-fit">
        <button
          onClick={() => setMainView("events")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            mainView === "events"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarIcon className="w-4 h-4" />
          Événements
        </button>
        <button
          onClick={() => setMainView("series")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            mainView === "series"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="w-4 h-4" />
          Séries
        </button>
        <button
          onClick={() => setMainView("proposals")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            mainView === "proposals"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Inbox className="w-4 h-4" />
          Propositions
          {proposalCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none bg-sakura/15 text-sakura">
              {proposalCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Series View ── */}
      {mainView === "series" && (
        <AdminEventSeries
          onNewEdition={handleNewEditionFromSeries}
          onEditEvent={(event) => setEditorState({ open: true, event })}
          onViewEvent={(event) => navigate(`/agenda/${event.id}`)}
        />
      )}

      {/* ── Proposals View ── */}
      {mainView === "proposals" && (
        <AdminEventProposals />
      )}

      {/* ── Events View ── */}
      {mainView === "events" && <>

      {/* ── Temporal Tabs ── */}
      {!isLoading && (
        <EventTemporalTabs
          activeTab={activeTab}
          counts={counts}
          onTabChange={handleTabChange}
        />
      )}

      {/* ── Filter Bar ── */}
      {!isLoading && (
        <EventFilterBar
          filters={filters}
          sort={currentSort}
          viewMode={viewMode}
          onFiltersChange={handleFiltersChange}
          onSortChange={handleSortChange}
          onViewModeChange={handleViewModeChange}
          onReset={handleResetFilters}
          eventTypes={eventTypes}
          cities={cities}
          associations={associations}
          hasActiveFilters={filtersActive}
        />
      )}

      {/* ── Events Content ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-sakura" />
        </div>
      ) : totalFiltered === 0 ? (
        <EventsEmptyState
          tab={activeTab}
          hasFilters={filtersActive}
          onCreateEvent={() => setEditorState({ open: true, event: null })}
          onSwitchTab={handleTabChange}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <div className="space-y-5">
          {visibleGroups.map((group) => (
            <EventsMonthSection
              key={group.key}
              label={group.label}
              count={group.events.length}
              viewMode={viewMode}
            >
              {group.events.map((event) =>
                viewMode === "list" ? (
                  <EventListRow
                    key={event.id}
                    event={event}
                    associationName={event.association?.name || event.association_name}
                    onEdit={(e) => setEditorState({ open: true, event: e })}
                    onView={(e) => navigate(`/agenda/${e.id}`)}
                    extraActions={renderExtraActions(event)}
                  />
                ) : (
                  <EventListCard
                    key={event.id}
                    event={event}
                    compact
                    associationName={event.association?.name || event.association_name}
                    onEdit={(e) => setEditorState({ open: true, event: e })}
                    onView={(e) => navigate(`/agenda/${e.id}`)}
                    extraActions={renderExtraActions(event)}
                  />
                )
              )}
            </EventsMonthSection>
          ))}

          <EventsLoadMore
            visibleCount={Math.min(visibleCount, totalFiltered)}
            totalCount={totalFiltered}
            onLoadMore={handleLoadMore}
          />
        </div>
      )}

      </>}

      {/* ── Event Editor (always mounted for both views) ── */}
      <EventEditorSheet
        open={editorState.open}
        onOpenChange={(open) => setEditorState({ open, event: editorState.event })}
        mode={editorState.event ? "edit" : "create"}
        initialEvent={editorState.event}
        context={{ type: "admin-global" }}
        onSuccess={() => setEditorState({ open: false, event: null })}
      />

      {/* ── QR Modal ── */}
      <Dialog
        open={qrModal.open}
        onOpenChange={(open) => setQrModal({ open, event: qrModal.event })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code — {qrModal.event?.title}</DialogTitle>
            <DialogDescription>Imprimez ce QR Code pour le check-in à l'entrée</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            {qrModal.event && (
              <img src={generateQRCode(qrModal.event.id)} alt="QR Code" className="w-64 h-64 border rounded-lg" />
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                Object.assign(document.createElement("a"), {
                  href: generateQRCode(qrModal.event.id),
                  download: `qr-${qrModal.event?.title || "event"}.png`,
                }).click()
              }
              className="gap-2"
            >
              <Download className="w-4 h-4" /> Télécharger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Participants Modal ── */}
      <Dialog
        open={participantsModal.open}
        onOpenChange={(open) => setParticipantsModal({ open, event: participantsModal.event })}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Participants — {participantsModal.event?.title}</DialogTitle>
            <DialogDescription>{participants.length} inscrit(s)</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 py-4">
            {participants.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sakura/20 flex items-center justify-center text-sm">
                    {p.profile?.display_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {p.profile?.display_name || p.profile?.username || "Anonyme"}
                    </p>
                    <p className="text-xs text-muted-foreground">@{p.profile?.username}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">{p.role || "visitor"}</Badge>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={exportParticipantsCSV} className="gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Exhibitors Modal ── */}
      <Dialog
        open={!!selectedEventForExhibitors}
        onOpenChange={(open) => !open && setSelectedEventForExhibitors(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Store className="w-5 h-5 text-purple-500" />
              Exposants — {selectedEventForExhibitors?.title}
            </DialogTitle>
            <DialogDescription>Gère les demandes de stands pour cet événement</DialogDescription>
          </DialogHeader>
          {selectedEventForExhibitors && (
            <ExhibitorsTab eventId={selectedEventForExhibitors.id} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEvents;
