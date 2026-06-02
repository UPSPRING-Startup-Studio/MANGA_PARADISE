import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Save, X, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ScheduleDay } from "@/components/admin/EventScheduleForm";
import EventFormWizard from "@/components/admin/event-wizard/EventFormWizard";
import type { LegacyEventFormData } from "@/components/admin/event-wizard/eventFormTypes";
// Keep legacy types for backward compatibility
import type {
  EventFormData,
  TicketingMode,
} from "@/components/admin/EventFormAdvanced";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type EventEditorMode = "create" | "edit";

export type EventEditorContext =
  | { type: "admin-global" }
  | {
      type: "association";
      associationId: string;
      associationName: string;
    }
  | {
      type: "pro-partner";
      partnerId: string;
      partnerName: string;
    };

export interface EventEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: EventEditorMode;
  initialEvent?: any;
  context: EventEditorContext;
  onSuccess?: () => void;
}

// ──────────────────────────────────────────────
// Helper : transformer un event brut en initialData pour EventFormAdvanced
// ──────────────────────────────────────────────

function eventToFormData(
  event: any
): Partial<EventFormData> & { id?: string } {
  if (!event) return {};

  let schedule: ScheduleDay[] = [];
  if (event.schedule && Array.isArray(event.schedule)) {
    schedule = event.schedule as ScheduleDay[];
  } else if (event.date) {
    schedule = [
      {
        date: event.date,
        start_time: event.time || "10:00",
        end_time: "",
      },
    ];
  } else {
    schedule = [{ date: "", start_time: "10:00", end_time: "18:00" }];
  }

  const isFree =
    !event.price || event.price === "Gratuit" || event.price === "0";
  const priceMatch = event.price?.match(/(\d+(?:[.,]\d+)?)/);
  const priceAmount = priceMatch ? priceMatch[1] : "";

  const programItems =
    event._scheduleItems?.map((item: any) => ({
      id: item.id,
      time: item.time || "10:00",
      end_time: item.end_time || null,
      title: item.title || "",
      location: item.location || null,
      category: item.category || "other",
      description: item.description || null,
      day_date: item.day_date || null,
      is_cosplay_contest: item.is_cosplay_contest === true,
      external_link: item.external_link || null,
      activity_image_url: item.activity_image_url || null,
    })) || [];

  return {
    id: event.id,
    title: event.title || "",
    description: event.description || "",
    category: event.category || "general",
    status: event.status || "upcoming",
    schedule,
    venue_name: event.venue_name || "",
    city: event.city || "",
    region: event.region || "",
    ticketing_mode: (event.ticketing_mode as TicketingMode) || "internal",
    external_link: event.external_link || "",
    is_free: isFree,
    price_amount: priceAmount,
    is_capacity_limited: !!event.max_attendees,
    max_attendees: event.max_attendees?.toString() || "",
    image_url: event.image_url || "",
    enablePresenceQuest: false,
    programItems,
    // Phase 2 — Series
    series_id: event.series_id || null,
    edition_label: event.edition_label || null,
    // Phase 3 — Association
    association_id: event.association_id || null,
    // Phase 4 — Multi-organisateur
    organizer_type: event.organizer_type || null,
    organizer_id: event.organizer_id || null,
  };
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

const EventEditorSheet = ({
  open,
  onOpenChange,
  mode,
  initialEvent,
  context,
  onSuccess,
}: EventEditorSheetProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [savedVersion, setSavedVersion] = useState(0);
  /** Tracks whether the current mutation should close the dialog on success */
  const shouldCloseRef = useRef(false);

  const saveMutation = useMutation({
    mutationFn: async (data: LegacyEventFormData) => {
      const validSchedule = data.schedule.filter(
        (day) => day.date && day.date.trim() !== ""
      );
      if (validSchedule.length === 0) {
        throw new Error("Au moins une date est requise");
      }

      const sortedSchedule = [...validSchedule].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      const firstDay = sortedSchedule[0];
      const lastDay = sortedSchedule[sortedSchedule.length - 1];

      const locationParts = [data.venue_name, data.city].filter(Boolean);
      const priceStr = data.is_free ? "0" : data.price_amount || "0";

      const payload: Record<string, any> = {
        title: data.title,
        description: data.description || null,
        category: data.category,
        status: data.status,
        date: firstDay.date,
        time: firstDay.start_time || null,
        end_date: sortedSchedule.length > 1 ? lastDay.date : null,
        schedule: sortedSchedule as unknown as Json,
        location: locationParts.join(", ") || null,
        venue_name: data.venue_name || null,
        city: data.city || null,
        region: data.region || null,
        ticketing_mode: data.ticketing_mode,
        external_link:
          data.ticketing_mode === "external" ? data.external_link : null,
        price: priceStr,
        max_attendees:
          data.is_capacity_limited && data.max_attendees
            ? parseInt(data.max_attendees)
            : null,
        image_url: data.image_url || null,
      };

      // Phase 2 — Series
      if (data.series_id !== undefined) {
        payload.series_id = data.series_id || null;
      }
      if (data.edition_label !== undefined) {
        payload.edition_label = data.edition_label || null;
      }

      // Phase 3 — Association (depuis le wizard, comme series_id)
      if (data.association_id !== undefined) {
        payload.association_id = data.association_id || null;
      }
      // Surcharge si contexte association : forcer le rattachement uniquement
      // à la CRÉATION (INSERT). En édition (UPDATE), on respecte la valeur du
      // formulaire pour permettre le détachement.
      if (context.type === "association" && !data.id) {
        payload.association_id = context.associationId;
      }

      // Phase 4 — Multi-organisateur (depuis le wizard via wizardToLegacy)
      if (data.organizer_type !== undefined) {
        payload.organizer_type = data.organizer_type || "manga_paradise";
        payload.organizer_id = data.organizer_id || null;
      }
      // Surcharge si contexte pro-partner : forcer à la CRÉATION
      if (context.type === "pro-partner" && !data.id) {
        payload.organizer_type = "pro_partner";
        payload.organizer_id = context.partnerId;
      }

      console.log("[event-save] context.type =", context.type);
      console.log("[event-save] data.id =", data.id);
      console.log("[event-save] payload.organizer_type =", payload.organizer_type);
      console.log("[event-save] payload.organizer_id =", payload.organizer_id);
      console.log("[event-save] payload.association_id =", payload.association_id);

      let eventId = data.id;

      if (data.id) {
        // UPDATE — use .select() to detect silent RLS rejections (0 rows)
        let updateQuery = supabase
          .from("events")
          .update(payload)
          .eq("id", data.id);

        // Sécurité : si association, vérifier que l'event appartient bien à cette asso
        if (context.type === "association") {
          updateQuery = (updateQuery as any).eq("association_id", context.associationId);
        }

        const { data: updatedRows, error } = await updateQuery.select("id");
        console.log("[event-update] rows =", updatedRows?.length, "error =", error);
        if (error) throw error;
        if (!updatedRows || updatedRows.length === 0) {
          throw new Error("La modification n'a pas pu être enregistrée. Vérifiez vos permissions.");
        }

        // DEBUG — re-fetch pour vérifier la valeur en base
        const { data: verify } = await supabase
          .from("events")
          .select("id, association_id, organizer_type, organizer_id")
          .eq("id", data.id)
          .single();
        console.log("[event-verify] after save, association_id =", verify?.association_id, "organizer_type =", verify?.organizer_type, "organizer_id =", verify?.organizer_id);
      } else {
        // INSERT
        if (!user) throw new Error("Non connecté");
        payload.created_by = user.id;

        const { data: newEvent, error } = await supabase
          .from("events")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        eventId = newEvent.id;

        // Quête de présence (admin global uniquement)
        if (
          data.enablePresenceQuest &&
          context.type === "admin-global" &&
          newEvent
        ) {
          const { data: existingQuest } = await supabase
            .from("quests")
            .select("id")
            .eq("title", "Présence validée")
            .single();

          let questId = existingQuest?.id;
          if (!questId) {
            const { data: newQuest } = await supabase
              .from("quests")
              .insert({
                title: "Présence validée",
                description: "Valide ta présence à l'événement",
                xp_reward: 50,
                otk_reward: 25,
                icon: "📍",
                validation_type: "QR_SCAN",
                quest_type: "event",
              })
              .select()
              .single();
            questId = newQuest?.id;
          }
          if (questId) {
            await supabase.from("event_quests").insert({
              event_id: newEvent.id,
              quest_id: questId,
              is_active: true,
            });
          }
        }
      }

      // Save program items
      if (eventId) {
        const eventStartDate = firstDay?.date || null;
        const scheduleItems = (data.programItems || [])
          .filter((item) => item.title && item.title.trim())
          .map((item) => {
            const timeValue = String(item.time || "10:00");
            return {
              event_id: String(eventId),
              time: timeValue,
              start_time: timeValue,
              title: String(item.title || ""),
              category: String(item.category || "other"),
              end_time: item.end_time ? String(item.end_time) : undefined,
              location: item.location ? String(item.location) : undefined,
              description: item.description
                ? String(item.description)
                : undefined,
              day_date: item.day_date
                ? String(item.day_date)
                : eventStartDate
                  ? String(eventStartDate)
                  : undefined,
              is_cosplay_contest: item.is_cosplay_contest === true,
              external_link: item.external_link
                ? String(item.external_link)
                : undefined,
              activity_image_url: item.activity_image_url || null,
            };
          });

        if (scheduleItems.length > 0) {
          await supabase
            .from("event_schedule")
            .delete()
            .eq("event_id", eventId);

          const { error: insertError } = await supabase
            .from("event_schedule")
            .insert(scheduleItems);

          if (insertError) {
            console.error("Error saving program items:", insertError);
            // Fallback one-by-one
            for (const item of scheduleItems) {
              await supabase.from("event_schedule").insert(item);
            }
          }
        } else if (data.programItems && data.programItems.length === 0) {
          await supabase
            .from("event_schedule")
            .delete()
            .eq("event_id", eventId);
        }
      }

      return eventId;
    },
    onSuccess: () => {
      // Invalidation large pour couvrir tous les contextes
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event_schedule"] });
      if (context.type === "association") {
        queryClient.invalidateQueries({
          queryKey: ["association-events", context.associationId],
        });
        queryClient.invalidateQueries({
          queryKey: ["association-upcoming-events", context.associationId],
        });
      }
      if (context.type === "pro-partner") {
        queryClient.invalidateQueries({
          queryKey: ["pro-partner-events", context.partnerId],
        });
        queryClient.invalidateQueries({
          queryKey: ["pro-partner-events-upcoming", context.partnerId],
        });
        queryClient.invalidateQueries({
          queryKey: ["pro-partner-events-past", context.partnerId],
        });
      }

      setIsFormDirty(false);

      if (shouldCloseRef.current) {
        // Save-and-close (final submit or "Enregistrer et quitter")
        const label =
          context.type === "association"
            ? `Événement ${mode === "edit" ? "mis à jour" : "créé"} pour l'association !`
            : context.type === "pro-partner"
              ? `Événement ${mode === "edit" ? "mis à jour" : "créé"} pour le partenaire !`
              : `Événement ${mode === "edit" ? "mis à jour" : "créé"} !`;
        toast.success(label);
        onSuccess?.();
      } else {
        // Save-and-stay (intermediate "Enregistrer")
        setSavedVersion((v) => v + 1);
        toast.success("Modifications enregistrées");
      }
    },
    onError: (error: any) => {
      const msg =
        error?.message || "Impossible de sauvegarder l'événement, réessaie.";
      toast.error(msg);
      console.error("Event save error:", error);
    },
  });

  // Latest form snapshot for "Enregistrer et quitter" from the unsaved dialog
  const latestSnapshotRef = useRef<LegacyEventFormData | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isFormDirty) {
      setShowUnsavedDialog(true);
      return;
    }
    onOpenChange(nextOpen);
  };

  const handleForceClose = () => {
    setShowUnsavedDialog(false);
    setIsFormDirty(false);
    onOpenChange(false);
  };

  const handleSaveAndClose = () => {
    setShowUnsavedDialog(false);
    if (latestSnapshotRef.current) {
      shouldCloseRef.current = true;
      saveMutation.mutate(latestSnapshotRef.current);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-display tracking-wide">
              {mode === "edit"
                ? "Modifier l'événement"
                : "Créer un événement"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulaire de {mode === "edit" ? "modification" : "création"}{" "}
              d'événement
            </DialogDescription>
          </DialogHeader>

          {/* Association context badge */}
          {context.type === "association" && (
            <div className="flex items-center gap-2 -mt-2 mb-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-mp-ink-muted">Organisé par</span>
              <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-xs">
                {context.associationName}
              </Badge>
            </div>
          )}

          {/* Pro Partner context badge */}
          {context.type === "pro-partner" && (
            <div className="flex items-center gap-2 -mt-2 mb-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-mp-ink-muted">Organisé par</span>
              <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-xs">
                {context.partnerName}
              </Badge>
            </div>
          )}

          <EventFormWizard
            initialData={eventToFormData(initialEvent)}
            onSubmit={(data) => {
              shouldCloseRef.current = true;
              saveMutation.mutate(data);
            }}
            onSave={(data) => {
              shouldCloseRef.current = false;
              saveMutation.mutate(data);
            }}
            isSubmitting={saveMutation.isPending && shouldCloseRef.current}
            isSaving={saveMutation.isPending && !shouldCloseRef.current}
            isEditing={mode === "edit"}
            onFormDirtyChange={setIsFormDirty}
            onFormSnapshotChange={(data) => {
              latestSnapshotRef.current = data;
            }}
            savedVersion={savedVersion}
          />
        </DialogContent>
      </Dialog>

      {/* ── Unsaved Changes Dialog ── */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent className="max-w-[420px]">
          {/* ── Header: icon + title + description ── */}
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-sakura/10 border border-sakura/20 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-sakura" />
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialogTitle className="text-base font-display font-semibold leading-snug">
                Modifications non enregistrées
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed mt-1.5">
                Si vous quittez maintenant, vos dernières modifications seront perdues.
              </AlertDialogDescription>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 pt-1">
            {/* Ghost destructive — left on desktop, bottom on mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleForceClose}
              className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 sm:mr-auto"
            >
              <X className="w-3.5 h-3.5" />
              Quitter sans enregistrer
            </Button>

            {/* Outline secondary */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnsavedDialog(false)}
              className="gap-1.5"
            >
              Continuer l'édition
            </Button>

            {/* Primary — sakura */}
            <Button
              size="sm"
              onClick={handleSaveAndClose}
              disabled={saveMutation.isPending}
              className="gap-1.5 bg-sakura hover:bg-sakura/90 text-white font-medium shadow-sm shadow-sakura/20"
            >
              {saveMutation.isPending ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Enregistrer et quitter
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EventEditorSheet;
