import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  CalendarDays,
  Plus,
  MapPin,
  Clock,
  Search,
  Filter,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useProPartnerEvents,
  useUpcomingProPartnerEvents,
  usePastProPartnerEvents,
  useCancelProPartnerEvent,
} from "@/hooks/useProPartnerEvents";
import EventEditorSheet from "@/components/events/EventEditorSheet";
import type { ProPartner, ProPartnerRole } from "@/hooks/useProPartner";
import { MANAGER_ROLES } from "@/hooks/useProPartner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProPartnerContext {
  partner: ProPartner | undefined;
  role: ProPartnerRole | undefined;
}

const INPUT_CLASS =
  "bg-white border-slate-600 text-slate-50 placeholder:text-mp-ink-muted focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400/40";

const ProEvents = () => {
  const { partner, role } = useOutletContext<ProPartnerContext>();
  const partnerId = partner?.id;
  const canManage = role ? MANAGER_ROLES.includes(role) : false;

  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const { data: allEvents, isLoading: allLoading } = useProPartnerEvents(partnerId);
  const { data: upcomingEvents, isLoading: upcomingLoading } = useUpcomingProPartnerEvents(partnerId);
  const { data: pastEvents, isLoading: pastLoading } = usePastProPartnerEvents(partnerId);
  const cancelEvent = useCancelProPartnerEvent();

  const filterEvents = (events: any[] | undefined) => {
    if (!events) return [];
    if (!search) return events;
    const q = search.toLowerCase();
    return events.filter(
      (e: any) =>
        e.title?.toLowerCase().includes(q) ||
        e.city?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
    );
  };

  const handleCancel = (eventId: string) => {
    if (!partnerId) return;
    if (window.confirm("Annuler cet événement ?")) {
      cancelEvent.mutate({ eventId, partnerId });
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setEditorOpen(true);
  };

  if (!partner) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-display text-slate-50 flex items-center gap-3">
            <CalendarDays className="h-7 w-7 text-cyan-400" />
            Mes événements
          </h1>
          <p className="text-mp-ink-muted mt-1">
            Créez et gérez les événements de votre structure
          </p>
        </div>
        {canManage && (
          <Button
            onClick={handleCreate}
            className="gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 font-semibold shrink-0"
          >
            <Plus className="h-4 w-4" />
            Créer un événement
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mp-ink-muted" />
        <Input
          placeholder="Rechercher un événement..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`pl-9 ${INPUT_CLASS}`}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="bg-white/50 border border-mp-border/50">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">
            À venir ({upcomingEvents?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="past" className="data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">
            Passés ({pastEvents?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">
            Tous ({allEvents?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <EventList
            events={filterEvents(upcomingEvents)}
            isLoading={upcomingLoading}
            canManage={canManage}
            onEdit={handleEdit}
            onCancel={handleCancel}
            emptyMessage="Aucun événement à venir"
          />
        </TabsContent>
        <TabsContent value="past">
          <EventList
            events={filterEvents(pastEvents)}
            isLoading={pastLoading}
            canManage={false}
            onEdit={handleEdit}
            onCancel={handleCancel}
            emptyMessage="Aucun événement passé"
          />
        </TabsContent>
        <TabsContent value="all">
          <EventList
            events={filterEvents(allEvents)}
            isLoading={allLoading}
            canManage={canManage}
            onEdit={handleEdit}
            onCancel={handleCancel}
            emptyMessage="Aucun événement"
          />
        </TabsContent>
      </Tabs>

      {/* Event Editor Sheet */}
      {editorOpen && (
        <EventEditorSheet
          open={editorOpen}
          onOpenChange={setEditorOpen}
          mode={editingEvent ? "edit" : "create"}
          initialEvent={editingEvent}
          context={{
            type: "pro-partner" as any,
            partnerId: partnerId!,
            partnerName: partner.name,
          }}
          onSuccess={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Sub-component : Event List
// ──────────────────────────────────────────────

function EventList({
  events,
  isLoading,
  canManage,
  onEdit,
  onCancel,
  emptyMessage,
}: {
  events: any[];
  isLoading: boolean;
  canManage: boolean;
  onEdit: (event: any) => void;
  onCancel: (eventId: string) => void;
  emptyMessage: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-mp-paper/80 border-mp-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-lg bg-white" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48 bg-white" />
                  <Skeleton className="h-3 w-32 bg-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CalendarDays className="w-12 h-12 text-mp-ink-muted mb-3" />
        <p className="text-mp-ink-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event: any) => (
        <Card
          key={event.id}
          className="bg-mp-paper/80 border-mp-border/50 hover:border-cyan-500/30 transition-colors"
        >
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Image / Icon */}
              <div className="w-16 h-16 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                {event.image_url || event.cover_image ? (
                  <img
                    src={event.cover_image || event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <CalendarDays className="w-7 h-7 text-cyan-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-50 truncate">
                    {event.title}
                  </h3>
                  {event.status === "cancelled" && (
                    <Badge className="text-[10px] bg-red-500/10 text-red-400 border-red-500/30">
                      Annulé
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-mp-ink-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(event.date), "d MMM yyyy", { locale: fr })}
                  </span>
                  {event.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.city}
                    </span>
                  )}
                  {event.type_evenement && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-slate-600 text-mp-ink-muted"
                    >
                      {event.type_evenement}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              {canManage && event.status !== "cancelled" && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(event)}
                    className="text-xs border-slate-600 text-slate-200 hover:bg-white"
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancel(event.id)}
                    className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Annuler
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default ProEvents;
