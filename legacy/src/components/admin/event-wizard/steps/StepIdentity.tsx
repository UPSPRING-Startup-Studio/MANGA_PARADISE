/**
 * Step 1: Identité de l'événement
 * 
 * Titre, sous-titre, catégorie, thème/univers, image de couverture,
 * descriptions (courte + longue), tags.
 */

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Upload, X, Image as ImageIcon, Loader2, Tag, Sparkles, Type, Palette,
  Layers, MapPin, Plus, Check, Save, Building2, Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  INPUT_STYLES,
  SELECT_STYLES,
  CATEGORIES,
  type EventWizardFormData,
} from "../eventFormTypes";
import {
  useEventSeriesAutocomplete,
  useCreateEventSeries,
  type EventSeriesPayload,
} from "@/hooks/useEventSeries";
import { useAssociationsAutocomplete } from "@/hooks/useAssociationEvents";
import { useProPartnersAutocomplete } from "@/hooks/useProPartnerEvents";

interface StepIdentityProps {
  formData: EventWizardFormData;
  onChange: (updates: Partial<EventWizardFormData>) => void;
}

// Popular anime/manga universes for suggestions
const THEME_SUGGESTIONS = [
  "Shonen", "Shojo", "Seinen", "Isekai", "Mecha", "Magical Girl",
  "Cyberpunk", "Steampunk", "Yokai", "Samurai", "J-Horror", "Slice of Life",
  "Dragon Ball", "Naruto", "One Piece", "Demon Slayer", "Jujutsu Kaisen",
  "Ghibli", "Gundam", "Evangelion", "Sailor Moon", "JoJo",
];

const EVENT_TYPES_SERIES = [
  { value: "convention", label: "Convention" },
  { value: "tournoi", label: "Tournoi" },
  { value: "atelier", label: "Atelier" },
  { value: "meetup", label: "Meetup" },
  { value: "concert", label: "Concert" },
  { value: "exposition", label: "Exposition" },
  { value: "projection", label: "Projection" },
  { value: "autre", label: "Autre" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const StepIdentity = ({ formData, onChange }: StepIdentityProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // Series state
  const [seriesSearch, setSeriesSearch] = useState("");
  const [showCreateSeries, setShowCreateSeries] = useState(false);
  const [newSeriesForm, setNewSeriesForm] = useState({
    canonical_name: "",
    slug: "",
    type_evenement: "",
    default_city: "",
    default_venue: "",
  });

  const { data: seriesSuggestions = [], isLoading: seriesLoading } =
    useEventSeriesAutocomplete(seriesSearch);
  const createSeriesMutation = useCreateEventSeries();

  // Association state
  const [assoSearch, setAssoSearch] = useState("");
  const { data: assoSuggestions = [], isLoading: assoLoading } =
    useAssociationsAutocomplete(assoSearch);

  // Pro-partner state
  const [proSearch, setProSearch] = useState("");
  const { data: proSuggestions = [], isLoading: proLoading } =
    useProPartnersAutocomplete(proSearch);

  // Hydrate association metadata on edit (when association_id exists but name is missing)
  useEffect(() => {
    if (formData.association_id && !(formData as any)._association_name) {
      supabase
        .from("associations")
        .select("id, name, city")
        .eq("id", formData.association_id)
        .single()
        .then(({ data }) => {
          if (data) {
            onChange({
              _association_name: data.name,
              _association_city: data.city || undefined,
            } as any);
          }
        });
    }
  }, [formData.association_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hydrate pro-partner metadata on edit
  useEffect(() => {
    if (
      formData.organizer_type === "pro_partner" &&
      formData.organizer_id &&
      !formData._pro_partner_name
    ) {
      supabase
        .from("pro_partners")
        .select("id, name, city")
        .eq("id", formData.organizer_id)
        .single()
        .then(({ data }) => {
          if (data) {
            onChange({
              _pro_partner_name: data.name,
              _pro_partner_city: data.city || undefined,
            } as any);
          }
        });
    }
  }, [formData.organizer_id, formData.organizer_type]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectSeries = useCallback(
    (series: any) => {
      const updates: Partial<EventWizardFormData> = {
        series_id: series.id,
        series_canonical_name: series.canonical_name,
        _series_city: series.default_city || null,
        _series_type: series.type_evenement || null,
      } as any;
      if (!formData.city && series.default_city) updates.city = series.default_city;
      if (!formData.venue_name && series.default_venue) updates.venue_name = series.default_venue;
      if (!formData.image_url && series.cover_image) updates.image_url = series.cover_image;
      onChange(updates);
      setSeriesSearch("");
    },
    [formData.city, formData.venue_name, formData.image_url, onChange]
  );

  const handleClearSeries = () => {
    onChange({
      series_id: null,
      series_canonical_name: undefined,
      edition_label: undefined,
      _series_city: undefined,
      _series_type: undefined,
    } as any);
  };

  const handleCreateSeriesSubmit = () => {
    if (!newSeriesForm.canonical_name.trim() || !newSeriesForm.slug.trim()) return;
    createSeriesMutation.mutate(
      {
        canonical_name: newSeriesForm.canonical_name.trim(),
        slug: newSeriesForm.slug.trim(),
        type_evenement: newSeriesForm.type_evenement || null,
        default_city: newSeriesForm.default_city.trim() || null,
        default_venue: newSeriesForm.default_venue.trim() || null,
      },
      {
        onSuccess: (data) => {
          handleSelectSeries({
            id: data.id,
            canonical_name: newSeriesForm.canonical_name.trim(),
            default_city: newSeriesForm.default_city.trim() || null,
            default_venue: newSeriesForm.default_venue.trim() || null,
            cover_image: null,
          });
          setShowCreateSeries(false);
          setNewSeriesForm({ canonical_name: "", slug: "", type_evenement: "", default_city: "", default_venue: "" });
        },
      }
    );
  };

  // ─── Association handlers ───────────────────────────────────
  const handleSelectAssociation = useCallback(
    (asso: any) => {
      onChange({
        association_id: asso.id,
        _association_name: asso.name,
        _association_city: asso.city || null,
        organizer_type: "association",
        organizer_id: asso.id,
        // Clear pro-partner if an association is selected
        _pro_partner_name: undefined,
        _pro_partner_city: undefined,
      } as any);
      setAssoSearch("");
    },
    [onChange],
  );

  const handleClearAssociation = () => {
    onChange({
      association_id: null,
      _association_name: undefined,
      _association_city: undefined,
      organizer_type: null,
      organizer_id: null,
    } as any);
  };

  // ─── Pro-partner handlers ─────────────────────────────────
  const handleSelectProPartner = useCallback(
    (partner: any) => {
      const updates: Partial<EventWizardFormData> = {
        organizer_type: "pro_partner",
        organizer_id: partner.id,
        _pro_partner_name: partner.name,
        _pro_partner_city: partner.city || null,
        // Clear association if a pro-partner is selected
        association_id: null,
        _association_name: undefined,
        _association_city: undefined,
      } as any;
      // Pre-fill city from partner if empty
      if (!formData.city && partner.city) updates.city = partner.city;
      onChange(updates);
      setProSearch("");
    },
    [formData.city, onChange],
  );

  const handleClearProPartner = () => {
    onChange({
      organizer_type: null,
      organizer_id: null,
      _pro_partner_name: undefined,
      _pro_partner_city: undefined,
    } as any);
  };

  // ─── Image Upload ───────────────────────────────────────────
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(filePath, file);

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage
        .from("event-images")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) throw new Error("Impossible de récupérer l'URL");

      onChange({ image_url: urlData.publicUrl });
      toast.success("Image téléversée !");
    } catch (error: any) {
      toast.error(`Erreur: ${error?.message || "Erreur lors du téléversement"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleImageUpload(e.dataTransfer.files[0]);
  }, []);

  // ─── Tags ───────────────────────────────────────────────────
  const addTag = (tag: string) => {
    const cleaned = tag.trim().toLowerCase();
    if (cleaned && !formData.tags.includes(cleaned)) {
      onChange({ tags: [...formData.tags, cleaned] });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    onChange({ tags: formData.tags.filter((t) => t !== tag) });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Title — Hero Input */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Type className="w-4 h-4 text-sakura" />
          Titre de l'événement *
        </Label>
        <Input
          value={formData.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Ex: Manga Paradise Summer Fest 2026"
          className="text-lg h-12 font-display bg-white text-[#1a1a1a] placeholder:text-mp-ink-muted border-slate-300 focus:border-sakura focus:ring-sakura/20"
        />
      </div>

      {/* Subtitle */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          Sous-titre (optionnel)
        </Label>
        <Input
          value={formData.subtitle}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Ex: Le plus grand rassemblement otaku du sud !"
          className={INPUT_STYLES}
        />
      </div>

      {/* Category & Theme Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sakura" />
            Catégorie *
          </Label>
          <Select
            value={formData.category}
            onValueChange={(v) => onChange({ category: v })}
          >
            <SelectTrigger className={SELECT_STYLES}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-white">
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-400" />
            Thème / Univers
          </Label>
          <Input
            value={formData.theme_universe}
            onChange={(e) => onChange({ theme_universe: e.target.value })}
            placeholder="Ex: Shonen, Ghibli, Cyberpunk..."
            className={INPUT_STYLES}
            list="theme-suggestions"
          />
          <datalist id="theme-suggestions">
            {THEME_SUGGESTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Cover Image */}
      <Card className="p-4 border-dashed border-sakura/20">
        <Label className="flex items-center gap-2 mb-3 text-sm font-medium">
          <ImageIcon className="w-4 h-4 text-sakura" />
          Affiche / Image de couverture
        </Label>

        {formData.image_url ? (
          <div className="relative group">
            <img
              src={formData.image_url}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border border-border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onChange({ image_url: "" })}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "relative flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed transition-colors cursor-pointer",
              dragActive
                ? "border-sakura bg-sakura/10"
                : "border-muted-foreground/30 hover:border-sakura/50 hover:bg-muted/50"
            )}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {isUploading ? (
              <Loader2 className="w-10 h-10 text-sakura animate-spin" />
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground text-center">
                  <span className="font-medium text-foreground">Glissez-déposez</span> une image ici
                  <br />ou cliquez pour parcourir
                </p>
                <p className="text-xs text-muted-foreground mt-2">PNG, JPG, WEBP — Max 5 Mo</p>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Short Description */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Description courte</Label>
        <Input
          value={formData.description_short}
          onChange={(e) => onChange({ description_short: e.target.value })}
          placeholder="Résumé en une phrase (visible dans les aperçus)"
          maxLength={150}
          className={INPUT_STYLES}
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.description_short.length}/150
        </p>
      </div>

      {/* Long Description */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Description complète</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Décris l'événement en détail : programme, activités, ambiance, ce qui rend cet event unique..."
          rows={5}
          className={`resize-none ${INPUT_STYLES}`}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Tag className="w-4 h-4 text-turquoise" />
          Tags
        </Label>

        {/* Tag Input */}
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Ajouter un tag (Entrée pour valider)"
            className={`flex-1 ${INPUT_STYLES}`}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addTag(tagInput)}
            disabled={!tagInput.trim()}
            className="shrink-0"
          >
            <Tag className="w-4 h-4" />
          </Button>
        </div>

        {/* Active Tags */}
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {formData.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 px-2 py-1 bg-sakura/10 text-sakura border border-sakura/20 hover:bg-sakura/20 cursor-pointer"
                onClick={() => removeTag(tag)}
              >
                #{tag}
                <X className="w-3 h-3" />
              </Badge>
            ))}
          </div>
        )}

        {/* Suggested Tags */}
        {formData.tags.length < 5 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Suggestions :</p>
            <div className="flex flex-wrap gap-1">
              {["manga", "anime", "cosplay", "otaku", "japan", "pop-culture", "geek"]
                .filter((t) => !formData.tags.includes(t))
                .slice(0, 5)
                .map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer text-xs hover:bg-muted/50 transition-colors"
                    onClick={() => addTag(tag)}
                  >
                    +{tag}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Series Block (optional) ──────────────────────────────── */}
      <Card className="p-4 border-dashed border-purple-500/20">
        <Label className="flex items-center gap-2 mb-1 text-sm font-medium">
          <Layers className="w-4 h-4 text-purple-400" />
          Série d'événements
          <Badge variant="outline" className="text-[10px] ml-1 font-normal">
            optionnel
          </Badge>
        </Label>

        {formData.series_id ? (
          /* ── Selected series — rich card ── */
          <div className="space-y-4 mt-2">
            <div className="rounded-lg border border-purple-500/25 bg-gradient-to-r from-purple-500/[0.06] to-transparent overflow-hidden">
              {/* Series info */}
              <div className="flex items-start gap-3 p-3.5">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm text-foreground leading-tight">
                    {formData.series_canonical_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                    {(formData as any)._series_type && (
                      <Badge variant="outline" className="text-[10px] h-4 bg-purple-500/5 border-purple-500/20">
                        {(formData as any)._series_type}
                      </Badge>
                    )}
                    {(formData as any)._series_city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {(formData as any)._series_city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 px-3.5 py-2 border-t border-purple-500/10 bg-purple-500/[0.02]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    handleClearSeries();
                    setSeriesSearch("");
                  }}
                >
                  <Layers className="w-3 h-3" />
                  Changer
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
                  onClick={handleClearSeries}
                >
                  <X className="w-3 h-3" />
                  Retirer
                </Button>
              </div>
            </div>

            {/* Edition label — visible only when series is selected */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Édition
              </Label>
              <Input
                placeholder="2026, Sud 2026, 19e édition..."
                value={formData.edition_label || ""}
                onChange={(e) => onChange({ edition_label: e.target.value || undefined })}
                className={INPUT_STYLES}
              />
              <p className="text-xs text-muted-foreground">
                Nom de cette occurrence au sein de la série.
              </p>
            </div>
          </div>
        ) : (
          /* ── Search + create ── */
          <div className="space-y-3 mt-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Rattache cet événement à une série récurrente comme Japan Expo ou Play Azur Festival.
              Si tu laisses ce champ vide, l'événement reste autonome.
            </p>

            <Input
              placeholder="Rechercher une série..."
              value={seriesSearch}
              onChange={(e) => setSeriesSearch(e.target.value)}
              className={INPUT_STYLES}
            />

            {/* Suggestions dropdown */}
            {seriesSearch.length >= 1 && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {seriesLoading ? (
                  <div className="p-3 text-center">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : seriesSuggestions.length > 0 ? (
                  seriesSuggestions.map((s: any) => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0"
                      onClick={() => handleSelectSeries(s)}
                    >
                      <div className="w-8 h-8 rounded-md bg-purple-500/10 border border-purple-500/15 flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.canonical_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {s.default_city && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {s.default_city}
                            </span>
                          )}
                          {s.type_evenement && (
                            <Badge variant="outline" className="text-[10px] h-4">{s.type_evenement}</Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    Aucune série trouvée
                  </div>
                )}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setShowCreateSeries(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Créer une nouvelle série
            </Button>
          </div>
        )}
      </Card>

      {/* ── Association Block (optional) ──────────────────────────── */}
      <Card className="p-4 border-dashed border-turquoise/20">
        <Label className="flex items-center gap-2 mb-1 text-sm font-medium">
          <Building2 className="w-4 h-4 text-turquoise" />
          Structure associative
          <Badge variant="outline" className="text-[10px] ml-1 font-normal">
            optionnel
          </Badge>
        </Label>

        {formData.association_id ? (
          /* ── Selected association — rich card ── */
          <div className="space-y-2 mt-2">
            <div className="rounded-lg border border-turquoise/25 bg-gradient-to-r from-turquoise/[0.06] to-transparent overflow-hidden">
              {/* Association info */}
              <div className="flex items-start gap-3 p-3.5">
                <div className="w-10 h-10 rounded-lg bg-turquoise/10 border border-turquoise/20 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-turquoise" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm text-foreground leading-tight">
                    {(formData as any)._association_name || "Association"}
                  </p>
                  {(formData as any)._association_city && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {(formData as any)._association_city}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 px-3.5 py-2 border-t border-turquoise/10 bg-turquoise/[0.02]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    handleClearAssociation();
                    setAssoSearch("");
                  }}
                >
                  <Building2 className="w-3 h-3" />
                  Changer
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
                  onClick={handleClearAssociation}
                >
                  <X className="w-3 h-3" />
                  Retirer
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Search ── */
          <div className="space-y-3 mt-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Rattache cet événement à une association de la plateforme.
              Si tu laisses ce champ vide, l'événement reste autonome.
            </p>

            <Input
              placeholder="Rechercher une association..."
              value={assoSearch}
              onChange={(e) => setAssoSearch(e.target.value)}
              className={INPUT_STYLES}
            />

            {/* Suggestions dropdown */}
            {assoSearch.length >= 1 && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {assoLoading ? (
                  <div className="p-3 text-center">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : assoSuggestions.length > 0 ? (
                  assoSuggestions.map((a: any) => (
                    <button
                      key={a.id}
                      type="button"
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0"
                      onClick={() => handleSelectAssociation(a)}
                    >
                      <div className="w-8 h-8 rounded-md bg-turquoise/10 border border-turquoise/15 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-turquoise" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.name}</p>
                        {a.city && (
                          <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {a.city}
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    Aucune association trouvée
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Pro Partner Block (optional) ────────────────────────── */}
      <Card className="p-4 border-dashed border-orange-500/20">
        <Label className="flex items-center gap-2 mb-1 text-sm font-medium">
          <Briefcase className="w-4 h-4 text-orange-400" />
          Structure professionnelle
          <Badge variant="outline" className="text-[10px] ml-1 font-normal">
            optionnel
          </Badge>
        </Label>

        {formData.organizer_type === "pro_partner" && formData.organizer_id ? (
          /* ── Selected pro-partner — rich card ── */
          <div className="space-y-2 mt-2">
            <div className="rounded-lg border border-orange-500/25 bg-gradient-to-r from-orange-500/[0.06] to-transparent overflow-hidden">
              <div className="flex items-start gap-3 p-3.5">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm text-foreground leading-tight">
                    {formData._pro_partner_name || "Structure pro"}
                  </p>
                  {formData._pro_partner_city && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {formData._pro_partner_city}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-2 border-t border-orange-500/10 bg-orange-500/[0.02]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    handleClearProPartner();
                    setProSearch("");
                  }}
                >
                  <Briefcase className="w-3 h-3" />
                  Changer
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
                  onClick={handleClearProPartner}
                >
                  <X className="w-3 h-3" />
                  Retirer
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Search ── */
          <div className="space-y-3 mt-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Rattache cet événement à une structure professionnelle partenaire.
              Si une association est déjà sélectionnée, elle sera remplacée.
            </p>

            <Input
              placeholder="Rechercher une structure pro..."
              value={proSearch}
              onChange={(e) => setProSearch(e.target.value)}
              className={INPUT_STYLES}
            />

            {proSearch.length >= 1 && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {proLoading ? (
                  <div className="p-3 text-center">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : proSuggestions.length > 0 ? (
                  proSuggestions.map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0"
                      onClick={() => handleSelectProPartner(p)}
                    >
                      <div className="w-8 h-8 rounded-md bg-orange-500/10 border border-orange-500/15 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        {p.city && (
                          <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {p.city}
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    Aucune structure trouvée
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Create Series Modal ──────────────────────────────────── */}
      <Dialog open={showCreateSeries} onOpenChange={setShowCreateSeries}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer une série</DialogTitle>
            <DialogDescription>
              Crée une série récurrente, puis sélectionne-la pour cet événement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Nom canonique <span className="text-sakura">*</span>
              </Label>
              <Input
                placeholder="Japan Expo"
                value={newSeriesForm.canonical_name}
                onChange={(e) => {
                  const name = e.target.value;
                  setNewSeriesForm((prev) => ({
                    ...prev,
                    canonical_name: name,
                    slug: slugify(name),
                  }));
                }}
                className={INPUT_STYLES}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Slug <span className="text-sakura">*</span>
              </Label>
              <Input
                placeholder="japan-expo"
                value={newSeriesForm.slug}
                onChange={(e) => setNewSeriesForm((prev) => ({ ...prev, slug: e.target.value }))}
                className={INPUT_STYLES}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Type par defaut</Label>
              <Select
                value={newSeriesForm.type_evenement || "none"}
                onValueChange={(v) =>
                  setNewSeriesForm((prev) => ({ ...prev, type_evenement: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger className={INPUT_STYLES}>
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {EVENT_TYPES_SERIES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Ville par defaut</Label>
                <Input
                  placeholder="Paris"
                  value={newSeriesForm.default_city}
                  onChange={(e) => setNewSeriesForm((prev) => ({ ...prev, default_city: e.target.value }))}
                  className={INPUT_STYLES}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Lieu par defaut</Label>
                <Input
                  placeholder="Parc des Expos"
                  value={newSeriesForm.default_venue}
                  onChange={(e) => setNewSeriesForm((prev) => ({ ...prev, default_venue: e.target.value }))}
                  className={INPUT_STYLES}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreateSeries(false)}>
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleCreateSeriesSubmit}
                disabled={
                  createSeriesMutation.isPending ||
                  !newSeriesForm.canonical_name.trim() ||
                  !newSeriesForm.slug.trim()
                }
                className="gap-1.5 bg-sakura hover:bg-sakura/90 text-white"
              >
                {createSeriesMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Creer et selectionner
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default StepIdentity;
