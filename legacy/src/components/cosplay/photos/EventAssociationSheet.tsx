import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO, eachDayOfInterval, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarDays,
  MapPin,
  Search,
  CheckCircle2,
  BookOpen,
  Eye,
  Users,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useUpdatePhotoMeta, useEventActivities } from "@/hooks/useCosplayPhotos";
import type { EventActivity } from "@/hooks/useCosplayPhotos";
import { usePhotosBatchActions } from "@/hooks/usePhotosBatchActions";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import type { CosplayPhotoWithTags } from "@/types/cosplayPhotos";

// ─── Types locaux ─────────────────────────────────────────────────────────────

interface EventSuggestion {
  id: string;
  title: string;
  date: string;
  end_date: string | null;
  location: string | null;
  cover_image: string | null;
  image_url: string | null;
}

type SelectedEvent =
  | { type: "supabase"; event: EventSuggestion }
  | { type: "external"; name: string; date?: string; location?: string };

type AssocStep = "search" | "select-day" | "select-activity" | "confirm";

const STEP_ORDER: AssocStep[] = ["search", "select-day", "select-activity", "confirm"];

function stepIndex(step: AssocStep): number {
  return STEP_ORDER.indexOf(step);
}

// Large batch threshold — show extra warning above this count
const LARGE_BATCH_THRESHOLD = 10;

// ─── Schema Zod : événement externe ──────────────────────────────────────────

const externalSchema = z.object({
  name:     z.string().min(1, "Le nom est requis"),
  date:     z.string().optional(),
  location: z.string().optional(),
});
type ExternalForm = z.infer<typeof externalSchema>;

// ─── Sous-composant : barre de progression ───────────────────────────────────

function StepProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 rounded-full flex-1 transition-all duration-300",
            i <= currentStep ? "bg-teal-400" : "bg-white/10"
          )}
        />
      ))}
    </div>
  );
}

// ─── Sous-composant : carte événement ────────────────────────────────────────

interface EventCardProps {
  event: EventSuggestion;
  selected?: boolean;
  onSelect: () => void;
}

function EventCard({ event, selected = false, onSelect }: EventCardProps) {
  const banner = event.cover_image ?? event.image_url;
  const dateLabel = (() => {
    try {
      const start = format(parseISO(event.date), "dd MMM yyyy", { locale: fr });
      if (event.end_date) {
        const end = format(parseISO(event.end_date), "dd MMM yyyy", { locale: fr });
        return `${start} → ${end}`;
      }
      return start;
    } catch { return event.date; }
  })();

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-full rounded-xl overflow-hidden border text-left transition-all duration-150 mb-2",
        "focus:outline-none",
        selected
          ? "border-teal-400 ring-1 ring-teal-400/30"
          : "border-white/10 hover:border-teal-500/50"
      )}
    >
      {banner ? (
        <img src={banner} alt={event.title} className="w-full h-20 object-cover" />
      ) : (
        <div className="w-full h-20 bg-gradient-to-r from-teal-900/30 to-purple-900/30 flex items-center justify-center">
          <p className="text-white/20 text-lg font-bold truncate px-4">{event.title}</p>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E] via-[#1A1A2E]/60 to-transparent" />

      {selected && (
        <div className="absolute top-2 right-2 z-10">
          <CheckCircle2 className="w-5 h-5 text-teal-400 drop-shadow" />
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 p-3">
        <p className="text-sm font-bold text-white truncate">{event.title}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <CalendarDays className="w-3 h-3 text-white/60 flex-shrink-0" />
          <p className="text-xs text-white/60">{dateLabel}</p>
        </div>
        {event.location && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-white/40 flex-shrink-0" />
            <p className="text-xs text-white/40 truncate">{event.location}</p>
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Sous-composant : navigation Précédent / Suivant ─────────────────────────

interface StepNavProps {
  onBack: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
}

function StepNav({ onBack, onNext, backLabel = "Précédent", nextLabel = "Suivant", nextDisabled = false }: StepNavProps) {
  return (
    <div className="flex gap-2 pt-2">
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex-1 text-white/50 hover:text-white hover:bg-white/5 gap-1.5"
      >
        <ChevronLeft className="w-4 h-4" />
        {backLabel}
      </Button>
      {onNext && (
        <Button
          onClick={onNext}
          disabled={nextDisabled}
          className="flex-1 bg-teal-500 hover:bg-teal-600 text-white gap-1.5"
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

// ─── Sous-composant : écran de confirmation ────────────────────────────────

interface ConfirmScreenProps {
  selected: SelectedEvent;
  selectedActivity?: EventActivity | null;
  selectedDay?: string | null;
  batchCount: number;
  onConfirm: () => void;
  onBack: () => void;
  isPending: boolean;
}

function ConfirmScreen({ selected, selectedActivity, selectedDay, batchCount, onConfirm, onBack, isPending }: ConfirmScreenProps) {
  const title    = selected.type === "supabase" ? selected.event.title : selected.name;
  const location = selected.type === "supabase" ? selected.event.location : selected.location;
  const banner   = selected.type === "supabase" ? (selected.event.cover_image ?? selected.event.image_url) : null;
  const isLargeBatch = batchCount >= LARGE_BATCH_THRESHOLD;

  const dateLabel = (() => {
    if (selected.type === "supabase") {
      try {
        const start = format(parseISO(selected.event.date), "dd MMM yyyy", { locale: fr });
        if (selected.event.end_date) {
          const end = format(parseISO(selected.event.end_date), "dd MMM yyyy", { locale: fr });
          return `${start} → ${end}`;
        }
        return start;
      } catch { return selected.event.date; }
    }
    if (selected.date) {
      try { return format(parseISO(selected.date), "dd MMM yyyy", { locale: fr }); }
      catch { return selected.date; }
    }
    return null;
  })();

  return (
    <div className="space-y-4">
      {/* ── Batch summary banner ─────────────────────────────────────── */}
      {batchCount > 1 && (
        <div className={cn(
          "rounded-xl p-3 flex items-center gap-3 border",
          isLargeBatch
            ? "bg-amber-500/10 border-amber-500/30"
            : "bg-teal-500/10 border-teal-500/20"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
            isLargeBatch ? "bg-amber-500/20" : "bg-teal-500/20"
          )}>
            {isLargeBatch
              ? <AlertTriangle className="w-5 h-5 text-amber-400" />
              : <ImageIcon className="w-5 h-5 text-teal-400" />}
          </div>
          <div>
            <p className={cn(
              "text-sm font-bold",
              isLargeBatch ? "text-amber-200" : "text-teal-200"
            )}>
              {batchCount} photo{batchCount > 1 ? "s" : ""} sélectionnée{batchCount > 1 ? "s" : ""}
            </p>
            {isLargeBatch && (
              <p className="text-xs text-amber-300/70 mt-0.5">
                Assignation en masse — vérifiez bien la cible ci-dessous
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Event banner card ────────────────────────────────────────── */}
      <div className="relative h-32 rounded-xl overflow-hidden">
        {banner ? (
          <img src={banner} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-teal-900/40 to-purple-900/40 flex items-center justify-center">
            <p className="text-white/15 text-2xl font-bold truncate px-6">{title}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E] via-[#1A1A2E]/50 to-transparent" />

        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>

        <div className="absolute bottom-0 inset-x-0 p-3">
          <p className="text-white font-bold text-sm">{title}</p>
          {dateLabel && (
            <div className="flex items-center gap-1 mt-0.5">
              <CalendarDays className="w-3 h-3 text-white/60 flex-shrink-0" />
              <p className="text-xs text-white/60">{dateLabel}</p>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-white/40 flex-shrink-0" />
              <p className="text-xs text-white/40 truncate">{location}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary text ─────────────────────────────────────────────── */}
      <div className="text-center space-y-1">
        <p className="text-white/60 text-sm">
          {batchCount > 1
            ? `Vous allez rattacher ${batchCount} photos à l'événement`
            : "Cette photo sera associée à cet événement"}
        </p>
        <p className="text-white font-semibold text-sm">« {title} »</p>
      </div>

      {/* Day badge */}
      {selectedDay && (
        <div className="flex items-center justify-center gap-2 text-sm text-white/60">
          <CalendarDays className="w-4 h-4 text-teal-400" />
          <span>Jour : <span className="text-white/80 font-medium capitalize">
            {(() => { try { return format(parseISO(selectedDay), "EEEE d MMMM", { locale: fr }); } catch { return selectedDay; } })()}
          </span></span>
        </div>
      )}

      {/* Activity badge */}
      {selectedActivity && (
        <div className="flex items-center justify-center gap-2 text-sm text-white/60">
          <Clock className="w-4 h-4 text-teal-400" />
          <span>Activité : <span className="text-white/80 font-medium">{selectedActivity.title}</span></span>
        </div>
      )}

      {/* Benefits (single photo only) */}
      {batchCount <= 1 && (
        <div className="space-y-2.5">
          {[
            { icon: <BookOpen className="w-4 h-4 text-teal-400" />, bg: "bg-teal-500/20", text: "Apparaît dans ton journal de l'événement" },
            { icon: <Eye className="w-4 h-4 text-blue-400" />, bg: "bg-blue-500/20", text: "Visible dans la galerie de l'événement" },
            { icon: <Users className="w-4 h-4 text-pink-400" />, bg: "bg-pink-500/20", text: "Les personnes taggées peuvent te retrouver" },
          ].map(({ icon, bg, text }, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", bg)}>
                {icon}
              </div>
              <p className="text-white/60 text-sm">{text}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <Button
        onClick={onConfirm}
        disabled={isPending}
        className={cn(
          "w-full font-semibold text-white",
          isLargeBatch
            ? "bg-amber-500 hover:bg-amber-600"
            : "bg-teal-500 hover:bg-teal-600"
        )}
      >
        {isPending
          ? "Enregistrement…"
          : batchCount > 1
            ? `Confirmer l'assignation de ${batchCount} photos`
            : "Confirmer l'association"}
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-sm text-white/40 hover:text-white/70 transition-colors focus:outline-none flex items-center justify-center gap-1.5"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Revenir à l'étape précédente
      </button>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface EventAssociationSheetProps {
  photo: CosplayPhotoWithTags;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssociated: () => void;
  batchPhotoIds?: string[];
  /** Called whenever the user selects / deselects a target inside the drawer */
  onTargetChange?: (label: string | null) => void;
}

export function EventAssociationSheet({
  photo,
  open,
  onOpenChange,
  onAssociated,
  batchPhotoIds,
  onTargetChange,
}: EventAssociationSheetProps) {
  const [searchTerm, setSearchTerm]         = useState("");
  const [selected, setSelected]             = useState<SelectedEvent | null>(null);
  const [externalOpen, setExternalOpen]     = useState(false);
  const [assocState, setAssocState]         = useState<AssocStep>("search");
  const [selectedActivity, setSelectedActivity] = useState<EventActivity | null>(null);
  const [selectedDay, setSelectedDay]       = useState<string | null>(null);

  const isBatchMode = !!(batchPhotoIds && batchPhotoIds.length > 0);
  const batchCount = isBatchMode ? batchPhotoIds!.length : 1;

  // ── Notify parent of current target in real-time ──────────────────────
  useEffect(() => {
    if (!onTargetChange) return;
    if (!selected) {
      onTargetChange(null);
    } else if (selected.type === "supabase") {
      onTargetChange(selected.event.title);
    } else {
      onTargetChange(selected.name);
    }
  }, [selected, onTargetChange]);

  // Clear target when drawer closes
  useEffect(() => {
    if (!open && onTargetChange) onTargetChange(null);
  }, [open, onTargetChange]);

  const debouncedSearch = useDebounce(searchTerm, 350);
  const updateMeta      = useUpdatePhotoMeta(photo.id);
  const { associateEvent: batchAssociate } = usePhotosBatchActions();

  // Fetch activities for the selected Supabase event
  const selectedEventId = selected?.type === "supabase" ? selected.event.id : undefined;
  const { data: eventActivities = [] } = useEventActivities(selectedEventId);

  // Compute the days of the selected event (for multi-day picker)
  const eventDays = useMemo((): Date[] => {
    if (selected?.type !== "supabase") return [];
    const ev = selected.event;
    if (!ev.end_date || ev.date === ev.end_date) return [];
    try {
      return eachDayOfInterval({ start: parseISO(ev.date), end: parseISO(ev.end_date) });
    } catch { return []; }
  }, [selected]);

  const isMultiDayEvent = eventDays.length > 1;

  // Auto-detect shot_date from EXIF for pre-selection
  const exifDateStr = photo.exif_date
    ? photo.exif_date.split("T")[0]
    : null;

  // ── Compute the steps available for current selection ──────────────────

  const availableSteps = useMemo((): AssocStep[] => {
    const steps: AssocStep[] = ["search"];
    if (selected?.type === "supabase") {
      if (isMultiDayEvent && !isBatchMode) steps.push("select-day");
      if (eventActivities.length > 0 && !isBatchMode) steps.push("select-activity");
    }
    steps.push("confirm");
    return steps;
  }, [selected, isMultiDayEvent, eventActivities.length, isBatchMode]);

  const currentStepIdx = availableSteps.indexOf(assocState);
  const totalSteps = availableSteps.length;

  // ── External form ─────────────────────────────────────────────────────

  const form = useForm<ExternalForm>({
    resolver: zodResolver(externalSchema),
    defaultValues: { name: "", date: "", location: "" },
  });

  // ── Query : suggestions EXIF ──────────────────────────────────────────

  const { data: exifEvents = [], isLoading: exifLoading } = useQuery({
    queryKey: ["events-exif-suggestion", exifDateStr],
    queryFn: async (): Promise<EventSuggestion[]> => {
      const { data, error } = await (supabase as any)
        .from("events")
        .select("id, title, date, end_date, location, cover_image, image_url")
        .lte("date", exifDateStr!)
        .or(`end_date.is.null,end_date.gte.${exifDateStr}`)
        .order("date", { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data as EventSuggestion[]) ?? [];
    },
    enabled: !!exifDateStr && open,
    staleTime: 1000 * 60 * 10,
  });

  // ── Query : recherche texte ───────────────────────────────────────────

  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ["events-search", debouncedSearch],
    queryFn: async (): Promise<EventSuggestion[]> => {
      const { data, error } = await (supabase as any)
        .from("events")
        .select("id, title, date, end_date, location, cover_image, image_url")
        .ilike("title", `%${debouncedSearch}%`)
        .order("date", { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data as EventSuggestion[]) ?? [];
    },
    enabled: debouncedSearch.length >= 2 && open,
    staleTime: 1000 * 60 * 2,
  });

  // ── Selection d'un événement Manga Paradise ───────────────────────────

  function selectSupabaseEvent(event: EventSuggestion) {
    setSelected({ type: "supabase", event });
    setSelectedActivity(null);

    // Auto-detect day from EXIF if the event is multi-day
    const days = (() => {
      if (!event.end_date || event.date === event.end_date) return [];
      try { return eachDayOfInterval({ start: parseISO(event.date), end: parseISO(event.end_date) }); }
      catch { return []; }
    })();

    if (days.length > 1 && exifDateStr) {
      const exifDay = parseISO(exifDateStr);
      const match = days.find((d) => isSameDay(d, exifDay));
      setSelectedDay(match ? format(match, "yyyy-MM-dd") : null);
    } else if (days.length <= 1 && event.date) {
      setSelectedDay(event.date.split("T")[0]);
    } else {
      setSelectedDay(null);
    }

    // In batch mode: go directly to confirm (no day/activity for batches)
    // In single mode: navigate through day → activity → confirm as needed
    if (isBatchMode) {
      setAssocState("confirm");
    } else if (days.length > 1) {
      setAssocState("select-day");
    } else {
      // Will go to select-activity if activities exist, else confirm
      // (handled by the next step logic)
      setAssocState("select-activity");
    }
  }

  // ── Soumission formulaire événement externe ───────────────────────────

  function onExternalSubmit(values: ExternalForm) {
    setSelected({ type: "external", name: values.name, date: values.date, location: values.location });
    setAssocState("confirm");
    setExternalOpen(false);
  }

  // ── Navigation: go back one step ─────────────────────────────────────

  function handleBack() {
    const idx = availableSteps.indexOf(assocState);
    if (idx <= 0) {
      // Already at search — reset
      setSelected(null);
      setSelectedActivity(null);
      setSelectedDay(null);
      setAssocState("search");
      return;
    }
    const prevStep = availableSteps[idx - 1];
    if (prevStep === "search") {
      // Going back to search resets the selection
      setSelected(null);
      setSelectedActivity(null);
      setSelectedDay(null);
    }
    setAssocState(prevStep);
  }

  // ── Navigation: go forward one step ──────────────────────────────────

  function handleNext() {
    const idx = availableSteps.indexOf(assocState);
    if (idx < availableSteps.length - 1) {
      setAssocState(availableSteps[idx + 1]);
    }
  }

  // ── Confirmation ──────────────────────────────────────────────────────

  function handleConfirm() {
    if (!selected) return;

    const eventName = selected.type === "supabase" ? selected.event.title : selected.name;

    const resetState = () => {
      setSelected(null);
      setSelectedActivity(null);
      setSelectedDay(null);
      setAssocState("search");
      setSearchTerm("");
      form.reset();
    };

    if (isBatchMode) {
      const payload = selected.type === "supabase"
        ? { photoIds: batchPhotoIds!, eventId: selected.event.id, eventLabel: eventName }
        : { photoIds: batchPhotoIds!, eventName: selected.name, eventLabel: eventName };

      batchAssociate.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false);
          onAssociated();
          resetState();
        },
      });
      return;
    }

    const updates =
      selected.type === "supabase"
        ? {
            event_id: selected.event.id,
            activity_id: selectedActivity?.id || null,
            event_name_manual: null,
            event_date_manual: null,
            event_location_manual: null,
            shot_date: selectedDay || null,
          }
        : {
            event_id: null,
            activity_id: null,
            event_name_manual: selected.name,
            event_date_manual: selected.date || null,
            event_location_manual: selected.location || null,
            shot_date: selected.date || null,
          };

    updateMeta.mutate(updates, {
      onSuccess: () => {
        toast.success(`Photo associée à "${eventName}" !`);
        onOpenChange(false);
        onAssociated();
        resetState();
      },
    });
  }

  // ── Formatage de la date EXIF ─────────────────────────────────────────

  const exifDateFormatted = photo.exif_date
    ? (() => {
        try {
          return format(parseISO(photo.exif_date), "dd MMMM yyyy", { locale: fr });
        } catch { return photo.exif_date; }
      })()
    : null;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[#1A1A2E] border-t border-white/10 max-h-[82vh]">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <DrawerHeader className="pb-2 space-y-2">
          <DrawerTitle className="flex items-center gap-2 text-white">
            <CalendarDays className="w-5 h-5 text-teal-400" />
            {isBatchMode
              ? `Associer ${batchPhotoIds!.length} photo${batchPhotoIds!.length > 1 ? "s" : ""} à un événement`
              : "Associer à un événement"}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {isBatchMode
              ? "Associe les photos sélectionnées à un événement cosplay"
              : "Associe cette photo à un événement cosplay"}
          </DrawerDescription>

          {/* Step progress bar */}
          {selected && (
            <StepProgressBar currentStep={currentStepIdx} totalSteps={totalSteps} />
          )}
        </DrawerHeader>

        {/* ── Contenu scrollable ──────────────────────────────────────────── */}
        <div className="overflow-y-auto px-4 pb-8 space-y-5">
          {assocState === "confirm" && selected ? (
            <ConfirmScreen
              selected={selected}
              selectedActivity={selectedActivity}
              selectedDay={selectedDay}
              batchCount={batchCount}
              onConfirm={handleConfirm}
              onBack={handleBack}
              isPending={isBatchMode ? batchAssociate.isPending : updateMeta.isPending}
            />
          ) : assocState === "select-day" && selected?.type === "supabase" && eventDays.length > 1 ? (
            /* ── Day selection step (multi-day events) ───────────────── */
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-teal-400" />
                  Quel jour cette photo a-t-elle été prise ?
                </h3>
                <p className="text-xs text-white/30 mt-1">
                  {selected.event.title} se déroule sur {eventDays.length} jours
                </p>
              </div>

              <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
                {eventDays.map((day) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const isSelected = selectedDay === dayStr;
                  const isExifMatch = exifDateStr === dayStr;
                  return (
                    <button
                      key={dayStr}
                      type="button"
                      onClick={() => setSelectedDay(isSelected ? null : dayStr)}
                      className={cn(
                        "w-full p-3 rounded-xl border text-left transition-all duration-150",
                        isSelected
                          ? "border-teal-400 bg-teal-500/10"
                          : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white capitalize">
                            {format(day, "EEEE d MMMM", { locale: fr })}
                          </p>
                          {isExifMatch && (
                            <p className="text-[11px] text-teal-400 mt-0.5">Correspond à la date EXIF</p>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-teal-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <StepNav
                onBack={handleBack}
                onNext={handleNext}
                nextLabel={eventActivities.length > 0 ? "Activité" : "Confirmer"}
              />
            </div>
          ) : assocState === "select-activity" && selected?.type === "supabase" ? (
            /* ── Activity selection step ──────────────────────────────── */
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  À quelle activité correspond cette photo ?
                </h3>
                <p className="text-xs text-white/30 mt-1">
                  Sélectionne l'activité pendant laquelle cette photo a été prise
                </p>
              </div>

              {eventActivities.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-white/30 text-sm mb-4">Cet événement n'a pas de programme renseigné.</p>
                  <Button onClick={() => setAssocState("confirm")} className="bg-teal-500 hover:bg-teal-600 text-white">
                    Continuer sans activité
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                    {eventActivities.map((activity) => (
                      <button
                        key={activity.id}
                        type="button"
                        onClick={() => setSelectedActivity(selectedActivity?.id === activity.id ? null : activity)}
                        className={cn(
                          "w-full p-3 rounded-xl border text-left transition-all duration-150",
                          selectedActivity?.id === activity.id
                            ? "border-teal-400 bg-teal-500/10"
                            : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">{activity.title}</p>
                            <p className="text-xs text-white/40 flex items-center gap-1.5 mt-0.5">
                              {activity.start_time && (
                                <>
                                  <Clock className="w-3 h-3" />
                                  {activity.start_time}
                                </>
                              )}
                              {activity.category && (
                                <>
                                  <span className="text-white/10">·</span>
                                  {activity.category}
                                </>
                              )}
                            </p>
                          </div>
                          {selectedActivity?.id === activity.id && (
                            <Check className="w-5 h-5 text-teal-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}

                    {/* "No activity" option */}
                    <button
                      type="button"
                      onClick={() => setSelectedActivity(null)}
                      className={cn(
                        "w-full p-3 rounded-xl border text-left transition-all duration-150",
                        selectedActivity === null
                          ? "border-white/20 bg-white/10"
                          : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]"
                      )}
                    >
                      <p className="text-sm text-white/50">Pas d'activité spécifique</p>
                    </button>
                  </div>

                  <StepNav
                    onBack={handleBack}
                    onNext={() => setAssocState("confirm")}
                    nextLabel="Confirmer"
                  />
                </>
              )}
            </div>
          ) : (
            <>
              {/* ── Suggestion EXIF ──────────────────────────────────────── */}
              {exifDateStr && (
                <div className="space-y-3">
                  <Card className="bg-teal-500/10 border-teal-500/20 p-3 flex items-center gap-2">
                    <span className="text-base">📅</span>
                    <p className="text-teal-200 text-sm">
                      Photo prise le{" "}
                      <span className="font-semibold text-teal-100">
                        {exifDateFormatted}
                      </span>
                    </p>
                  </Card>

                  {exifLoading ? (
                    <p className="text-white/30 text-xs text-center py-2">Recherche…</p>
                  ) : exifEvents.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                        Événements ce jour-là
                      </p>
                      {exifEvents.map((ev) => (
                        <EventCard
                          key={ev.id}
                          event={ev}
                          selected={
                            selected?.type === "supabase" &&
                            selected.event.id === ev.id
                          }
                          onSelect={() => selectSupabaseEvent(ev)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/30 text-xs text-center py-1">
                      Aucun événement Manga Paradise ce jour-là.
                    </p>
                  )}
                </div>
              )}

              {/* ── Recherche ────────────────────────────────────────────── */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Chercher un événement…"
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-teal-500/50"
                  />
                </div>

                {searchLoading && debouncedSearch.length >= 2 && (
                  <p className="text-white/30 text-xs text-center py-2">Recherche…</p>
                )}

                {!searchLoading && debouncedSearch.length >= 2 && (
                  <div className="space-y-2">
                    {searchResults.length === 0 ? (
                      <p className="text-white/30 text-xs text-center py-2">
                        Aucun résultat pour « {debouncedSearch} »
                      </p>
                    ) : (
                      searchResults.map((ev) => (
                        <EventCard
                          key={ev.id}
                          event={ev}
                          selected={
                            selected?.type === "supabase" &&
                            selected.event.id === ev.id
                          }
                          onSelect={() => selectSupabaseEvent(ev)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* ── Événement externe ────────────────────────────────────── */}
              <Collapsible open={externalOpen} onOpenChange={setExternalOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between py-2 text-sm text-white/50 hover:text-white/80 transition-colors focus:outline-none"
                  >
                    <span>Mon événement n'est pas sur Manga Paradise</span>
                    {externalOpen ? (
                      <ChevronUp className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onExternalSubmit)}
                      className="space-y-3 pt-3 pb-1"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/70 text-xs">
                              Nom de l'événement *
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Japan Expo, Epitanime…"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-teal-500/50"
                              />
                            </FormControl>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/70 text-xs">
                              Date (optionnel)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="date"
                                className="bg-white/5 border-white/10 text-white focus-visible:ring-teal-500/50 [color-scheme:dark]"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/70 text-xs">
                              Lieu (optionnel)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Paris, Lyon…"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-teal-500/50"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full border-teal-500/40 text-teal-400 hover:bg-teal-500/10 hover:text-teal-300"
                      >
                        Utiliser cet événement
                      </Button>
                    </form>
                  </Form>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default EventAssociationSheet;
