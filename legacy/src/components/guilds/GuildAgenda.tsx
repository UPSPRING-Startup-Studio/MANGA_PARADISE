import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarDays, 
  Plus, 
  MapPin, 
  Globe, 
  Clock,
  Trash2,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { GuildEvent, useGuildEvents, useDeleteGuildEvent } from "@/hooks/useGuildEvents";
import { CreateGuildEventModal } from "./CreateGuildEventModal";

interface GuildAgendaProps {
  guildId: string;
  isAdmin: boolean;
}

export function GuildAgenda({ guildId, isAdmin }: GuildAgendaProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { data: events = [], isLoading } = useGuildEvents(guildId);
  const deleteEvent = useDeleteGuildEvent();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-sakura" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      {isAdmin && (
        <div className="flex justify-end">
          <Button 
            onClick={() => setCreateModalOpen(true)}
            className="bg-sakura hover:bg-sakura/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un événement
          </Button>
        </div>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <Card className="p-8 bg-card/50 border-border/50 text-center">
          <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun événement à venir</h3>
          <p className="text-muted-foreground text-sm">
            {isAdmin 
              ? "Créez votre premier événement de guilde !"
              : "La guilde n'a pas encore programmé d'événements."
            }
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              isAdmin={isAdmin}
              onDelete={() => deleteEvent.mutate({ eventId: event.id, guildId })}
              isDeleting={deleteEvent.isPending}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateGuildEventModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen}
        guildId={guildId}
      />
    </div>
  );
}

interface EventCardProps {
  event: GuildEvent;
  isAdmin: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}

function EventCard({ event, isAdmin, onDelete, isDeleting }: EventCardProps) {
  const startDate = new Date(event.start_time);
  const endDate = event.end_time ? new Date(event.end_time) : null;

  return (
    <Card className="p-4 bg-card/50 border-border/50 hover:border-sakura/40 transition-colors overflow-hidden">
      <div className="flex gap-4">
        {/* Date Block */}
        <div className="flex-shrink-0 w-16 text-center">
          <div className="bg-sakura/20 rounded-lg p-2">
            <p className="text-xs font-medium text-sakura uppercase">
              {format(startDate, "MMM", { locale: fr })}
            </p>
            <p className="text-2xl font-bold text-sakura">
              {format(startDate, "dd")}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(startDate, "yyyy")}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
            {isAdmin && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 flex-shrink-0 text-red-400 hover:bg-red-400/10"
                onClick={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {/* Time */}
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {format(startDate, "HH:mm", { locale: fr })}
                {endDate && ` - ${format(endDate, "HH:mm", { locale: fr })}`}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1">
              {event.location_type === "online" ? (
                <>
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-blue-400">En ligne</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400">
                    {event.location_address || "IRL"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cover (if exists) */}
        {event.cover_url && (
          <div className="hidden sm:block flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden">
            <img 
              src={event.cover_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
