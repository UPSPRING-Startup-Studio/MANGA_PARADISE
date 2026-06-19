import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CalendarDays } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AssociationEventPayload } from "@/hooks/useAssociationEvents";

const INPUT_CLASS =
  "bg-white border-slate-600 text-slate-50 placeholder:text-mp-ink-muted focus-visible:border-[#E84A2B] focus-visible:ring-1 focus-visible:ring-[#E84A2B]/40";

const EVENT_CATEGORIES = [
  { value: "general", label: "Général" },
  { value: "Atelier", label: "Atelier" },
  { value: "Projection", label: "Projection" },
  { value: "Gaming", label: "Gaming" },
  { value: "Cosplay", label: "Cosplay" },
  { value: "Rencontre", label: "Rencontre" },
  { value: "Convention", label: "Convention" },
  { value: "Festival", label: "Festival" },
  { value: "Tournoi", label: "Tournoi" },
];

const EVENT_TYPES = [
  { value: "convention", label: "Convention" },
  { value: "tournoi", label: "Tournoi" },
  { value: "atelier", label: "Atelier" },
  { value: "meetup", label: "Meetup" },
  { value: "concert", label: "Concert" },
  { value: "exposition", label: "Exposition" },
  { value: "projection", label: "Projection" },
  { value: "autre", label: "Autre" },
];

const eventSchema = z.object({
  title: z.string().min(2, "Titre requis (2 car. min)"),
  description: z.string().optional(),
  category: z.string().min(1, "Catégorie requise"),
  type_evenement: z.string().optional(),
  date: z.string().min(1, "Date requise"),
  time: z.string().optional(),
  end_date: z.string().optional(),
  venue_name: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  price: z.string().optional(),
  max_attendees: z.string().optional(),
  image_url: z.string().optional(),
  ticketing_mode: z.string().default("internal"),
  external_link: z.string().optional(),
});

type EventForm = z.infer<typeof eventSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associationName: string;
  onSubmit: (data: AssociationEventPayload) => void;
  isSubmitting: boolean;
  initialData?: Partial<EventForm>;
  mode?: "create" | "edit";
}

const AssociationEventCreateSheet = ({
  open,
  onOpenChange,
  associationName,
  onSubmit,
  isSubmitting,
  initialData,
  mode = "create",
}: Props) => {
  const form = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "general",
      type_evenement: "",
      date: "",
      time: "",
      end_date: "",
      venue_name: "",
      city: "",
      region: "",
      price: "0",
      max_attendees: "",
      image_url: "",
      ticketing_mode: "internal",
      external_link: "",
      ...initialData,
    },
  });

  const handleSubmit = (data: EventForm) => {
    const locationParts = [data.venue_name, data.city].filter(Boolean);
    const payload: AssociationEventPayload = {
      title: data.title,
      description: data.description || undefined,
      category: data.category,
      status: "upcoming",
      date: data.date,
      time: data.time || undefined,
      end_date: data.end_date || undefined,
      schedule: data.date
        ? [{ date: data.date, start_time: data.time || "10:00", end_time: "18:00" }]
        : [],
      venue_name: data.venue_name || undefined,
      city: data.city || undefined,
      region: data.region || undefined,
      location: locationParts.join(", ") || undefined,
      ticketing_mode: data.ticketing_mode || "internal",
      external_link: data.external_link || undefined,
      price: data.price || "0",
      max_attendees: data.max_attendees ? parseInt(data.max_attendees) : undefined,
      image_url: data.image_url || undefined,
      type_evenement: data.type_evenement || undefined,
    };
    onSubmit(payload);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) form.reset();
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-lg bg-mp-paper border-mp-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-slate-50">
            {mode === "edit" ? "Modifier l'événement" : "Créer un événement"}
          </SheetTitle>
          <SheetDescription className="text-mp-ink-muted">
            {mode === "edit"
              ? "Modifie les informations de l'événement"
              : "Crée un événement au nom de ton association"}
          </SheetDescription>
        </SheetHeader>

        {/* Association badge */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-mp-ink-muted">Organisé par</span>
          <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-xs">
            {associationName}
          </Badge>
        </div>

        <div className="mt-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Titre *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nom de l'événement" className={INPUT_CLASS} />
                    </FormControl>
                    <FormMessage className="text-[#F5A623]" />
                  </FormItem>
                )}
              />

              {/* Type + Category */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="type_evenement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={INPUT_CLASS}>
                            <SelectValue placeholder="Type..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EVENT_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[#F5A623]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Catégorie *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={INPUT_CLASS}>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EVENT_CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[#F5A623]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Date début *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className={INPUT_CLASS} />
                      </FormControl>
                      <FormMessage className="text-[#F5A623]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Date fin</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className={INPUT_CLASS} />
                      </FormControl>
                      <FormMessage className="text-[#F5A623]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Time */}
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Heure de début</FormLabel>
                    <FormControl>
                      <Input {...field} type="time" className={INPUT_CLASS} />
                    </FormControl>
                    <FormMessage className="text-[#F5A623]" />
                  </FormItem>
                )}
              />

              {/* Location */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="venue_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Lieu</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Salle des fêtes..." className={INPUT_CLASS} />
                      </FormControl>
                      <FormMessage className="text-[#F5A623]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Ville</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Lyon" className={INPUT_CLASS} />
                      </FormControl>
                      <FormMessage className="text-[#F5A623]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Décris l'événement..."
                        className={`${INPUT_CLASS} resize-none`}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage className="text-[#F5A623]" />
                  </FormItem>
                )}
              />

              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Prix (0 = gratuit)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0" className={INPUT_CLASS} />
                    </FormControl>
                    <FormMessage className="text-[#F5A623]" />
                  </FormItem>
                )}
              />

              {/* Image URL */}
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">URL de l'affiche</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." className={INPUT_CLASS} />
                    </FormControl>
                    <FormMessage className="text-[#F5A623]" />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-slate-500 text-slate-100 hover:bg-white"
                  onClick={() => handleClose(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#E84A2B] to-[#F26B2E] hover:from-[#D43D20] hover:to-[#E25E25] text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {mode === "edit" ? "Mise à jour..." : "Création..."}
                    </>
                  ) : mode === "edit" ? (
                    "Mettre à jour"
                  ) : (
                    <>
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Créer l'événement
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AssociationEventCreateSheet;
