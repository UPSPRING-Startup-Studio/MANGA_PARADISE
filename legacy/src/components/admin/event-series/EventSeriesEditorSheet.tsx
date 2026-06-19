import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import {
  useCreateEventSeries,
  useUpdateEventSeries,
  type EventSeriesWithStats,
  type EventSeriesPayload,
} from "@/hooks/useEventSeries";
import { INPUT_STYLES } from "@/components/admin/event-wizard/eventFormTypes";

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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  series: EventSeriesWithStats | null;
  onSuccess?: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EventSeriesEditorSheet = ({ open, onOpenChange, series, onSuccess }: Props) => {
  const isEditing = !!series;
  const createMutation = useCreateEventSeries();
  const updateMutation = useUpdateEventSeries();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [form, setForm] = useState({
    canonical_name: "",
    slug: "",
    description: "",
    type_evenement: "",
    default_city: "",
    default_venue: "",
    organizer_association_id: "",
    cover_image: "",
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Reset form when series changes
  useEffect(() => {
    if (series) {
      setForm({
        canonical_name: series.canonical_name,
        slug: series.slug,
        description: series.description || "",
        type_evenement: series.type_evenement || "",
        default_city: series.default_city || "",
        default_venue: series.default_venue || "",
        organizer_association_id: series.organizer_association_id || "",
        cover_image: series.cover_image || "",
      });
      setSlugManuallyEdited(true); // Don't auto-update slug in edit mode
    } else {
      setForm({
        canonical_name: "",
        slug: "",
        description: "",
        type_evenement: "",
        default_city: "",
        default_venue: "",
        organizer_association_id: "",
        cover_image: "",
      });
      setSlugManuallyEdited(false);
    }
  }, [series, open]);

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      canonical_name: name,
      slug: slugManuallyEdited ? prev.slug : slugify(name),
    }));
  };

  const handleSubmit = () => {
    if (!form.canonical_name.trim()) return;
    if (!form.slug.trim()) return;

    const payload: EventSeriesPayload = {
      canonical_name: form.canonical_name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      type_evenement: form.type_evenement || null,
      default_city: form.default_city.trim() || null,
      default_venue: form.default_venue.trim() || null,
      organizer_association_id: form.organizer_association_id || null,
      cover_image: form.cover_image.trim() || null,
    };

    if (isEditing && series) {
      updateMutation.mutate(
        { id: series.id, ...payload },
        {
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.();
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display tracking-wide">
            {isEditing ? "Modifier la serie" : "Creer une serie"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formulaire de {isEditing ? "modification" : "creation"} de serie
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Canonical Name */}
          <div className="space-y-1.5">
            <Label htmlFor="canonical_name">
              Nom canonique <span className="text-sakura">*</span>
            </Label>
            <Input
              id="canonical_name"
              placeholder="Japan Expo"
              value={form.canonical_name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={INPUT_STYLES}
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="slug">
              Slug <span className="text-sakura">*</span>
            </Label>
            <Input
              id="slug"
              placeholder="japan-expo"
              value={form.slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setForm((prev) => ({ ...prev, slug: e.target.value }));
              }}
              className={INPUT_STYLES}
            />
            <p className="text-xs text-muted-foreground">
              Identifiant unique, utilise dans les URLs futures.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Festival annuel dedie a la culture japonaise..."
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className={INPUT_STYLES + " min-h-[80px]"}
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type d'evenement par defaut</Label>
            <Select
              value={form.type_evenement || "none"}
              onValueChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  type_evenement: v === "none" ? "" : v,
                }))
              }
            >
              <SelectTrigger className={INPUT_STYLES}>
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City + Venue */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="default_city">Ville par defaut</Label>
              <Input
                id="default_city"
                placeholder="Paris"
                value={form.default_city}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, default_city: e.target.value }))
                }
                className={INPUT_STYLES}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="default_venue">Lieu par defaut</Label>
              <Input
                id="default_venue"
                placeholder="Parc des Expositions"
                value={form.default_venue}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    default_venue: e.target.value,
                  }))
                }
                className={INPUT_STYLES}
              />
            </div>
          </div>

          {/* Cover Image URL */}
          <div className="space-y-1.5">
            <Label htmlFor="cover_image">Image de couverture (URL)</Label>
            <Input
              id="cover_image"
              placeholder="https://..."
              value={form.cover_image}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, cover_image: e.target.value }))
              }
              className={INPUT_STYLES}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isPending || !form.canonical_name.trim() || !form.slug.trim()
              }
              className="gap-2 bg-sakura hover:bg-sakura/90 text-white"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              {isEditing ? "Mettre a jour" : "Creer la serie"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventSeriesEditorSheet;
