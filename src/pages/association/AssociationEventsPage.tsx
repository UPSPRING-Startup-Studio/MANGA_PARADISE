import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { CalendarDays, Plus, Info, Loader2, Link2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  LEADER_ROLES,
  type Association,
  type AssociationRole,
} from "@/hooks/useAssociation";
import {
  useAssociationEvents,
  useDetachEventFromAssociation,
} from "@/hooks/useAssociationEvents";
import { useAssociationGovernance } from "@/hooks/useAssociationGovernance";
import EventEditorSheet from "@/components/events/EventEditorSheet";
import EventListCard from "@/components/events/EventListCard";
import AttachExistingEventSheet from "@/components/association/events/AttachExistingEventSheet";
import DetachEventDialog from "@/components/association/events/DetachEventDialog";

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
}

const AssociationEventsPage = () => {
  const navigate = useNavigate();
  const { association, role: viewerRole } =
    useOutletContext<AssociationContext>();
  const associationId = association?.id;
  const gov = useAssociationGovernance();

  const { data: events, isLoading } = useAssociationEvents(associationId);
  const detachEvent = useDetachEventFromAssociation();

  const [editorState, setEditorState] = useState<{
    open: boolean;
    event: any;
  }>({ open: false, event: null });
  const [attachSheetOpen, setAttachSheetOpen] = useState(false);
  const [detachTarget, setDetachTarget] = useState<any>(null);

  const isLeader = viewerRole ? LEADER_ROLES.includes(viewerRole) : false;

  const handleDetach = () => {
    if (!gov.canManageEvents) { toast.error(gov.readOnlyReason || gov.restrictedReason || "Action non autorisée"); return; }
    if (!detachTarget || !associationId) return;
    detachEvent.mutate(
      { eventId: detachTarget.id, associationId },
      { onSuccess: () => setDetachTarget(null) }
    );
  };

  const openEditor = (event: any) => {
    if (!gov.canManageEvents) { toast.error(gov.readOnlyReason || gov.restrictedReason || "Action non autorisée"); return; }
    setEditorState({ open: true, event });
  };

  if (!association) return null;

  return (
    <div className="space-y-6">
      {/* Governance banner */}
      {(gov.isBlocked || gov.isRestricted) && (
        <div className={`rounded-lg border p-3 mb-4 ${gov.isBlocked ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
          <p className={`text-sm ${gov.isBlocked ? "text-red-300" : "text-amber-300"}`}>
            {gov.readOnlyReason || gov.restrictedReason}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-display text-foreground">
            Événements associatifs
          </h1>
          <p className="text-muted-foreground mt-1">
            Crée et gère les événements au nom de {association.name}. Ils
            apparaîtront dans l'agenda global.
          </p>
        </div>
        {isLeader && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setAttachSheetOpen(true)}
              disabled={!gov.canManageEvents}
              className="gap-2 border-slate-600 text-slate-200 hover:bg-white text-xs"
            >
              <Link2 className="h-4 w-4" />
              Associer un événement
            </Button>
            <Button
              onClick={() => openEditor(null)}
              disabled={!gov.canManageEvents}
              className="gap-2 bg-gradient-to-r from-[#E84A2B] to-[#F26B2E] hover:from-[#D43D20] hover:to-[#E25E25] text-white"
            >
              <Plus className="h-4 w-4" />
              Créer un événement
            </Button>
          </div>
        )}
      </div>

      {/* Read-only banner */}
      {!isLeader && (
        <div className="flex items-start gap-3 rounded-lg border border-[#F5A623]/20 bg-[#F5A623]/5 p-4">
          <Info className="h-5 w-5 text-[#F5A623] shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Seul le bureau de l'association peut créer ou modifier des
            événements.
          </p>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-sakura" />
        </div>
      ) : events && events.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event: any) => (
            <EventListCard
              key={event.id}
              event={event}
              associationName={association.name}
              showEditAction={isLeader}
              onEdit={(e) => openEditor(e)}
              onView={(e) => navigate(`/agenda/${e.id}`)}
              extraActions={
                isLeader ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetachTarget(event)}
                    disabled={!gov.canManageEvents}
                    className="text-[#F5A623] hover:text-[#F5A623]/80 hover:bg-[#F5A623]/10"
                    title="Détacher de l'association"
                  >
                    <Unlink className="w-4 h-4" />
                  </Button>
                ) : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="w-16 h-16 text-mp-ink-muted mb-4" />
          <h2 className="text-xl font-display text-slate-50 mb-2">
            Aucun événement
          </h2>
          <p className="text-mp-ink-muted max-w-md mb-6">
            Aucun événement associatif pour le moment.
            {isLeader &&
              " Crée un événement ou associe un événement existant."}
          </p>
          {isLeader && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setAttachSheetOpen(true)}
                disabled={!gov.canManageEvents}
                className="gap-2 border-slate-600 text-slate-200"
              >
                <Link2 className="h-4 w-4" />
                Associer un existant
              </Button>
              <Button
                onClick={() => openEditor(null)}
                disabled={!gov.canManageEvents}
                className="gap-2 bg-gradient-to-r from-[#E84A2B] to-[#F26B2E] text-white"
              >
                <Plus className="h-4 w-4" />
                Créer un événement
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Event Editor (unified) */}
      <EventEditorSheet
        open={editorState.open}
        onOpenChange={(open) =>
          setEditorState({ open, event: editorState.event })
        }
        mode={editorState.event ? "edit" : "create"}
        initialEvent={editorState.event}
        context={{
          type: "association",
          associationId: association.id,
          associationName: association.name,
        }}
        onSuccess={() => setEditorState({ open: false, event: null })}
      />

      {/* Attach Existing Event Sheet */}
      {associationId && (
        <AttachExistingEventSheet
          open={attachSheetOpen}
          onOpenChange={setAttachSheetOpen}
          associationId={associationId}
          associationName={association.name}
        />
      )}

      {/* Detach Event Dialog */}
      <DetachEventDialog
        open={!!detachTarget}
        onOpenChange={(open) => !open && setDetachTarget(null)}
        eventTitle={detachTarget?.title || ""}
        onConfirm={handleDetach}
        isSubmitting={detachEvent.isPending}
      />
    </div>
  );
};

export default AssociationEventsPage;
