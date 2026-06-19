import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Upload,
  X,
  Image as ImageIcon,
  MapPin,
  Building,
  Map,
  Loader2,
  Euro,
  Users,
  Ticket,
  ExternalLink,
  Home,
  Calendar,
  Clock,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EventScheduleForm, { ScheduleDay } from "./EventScheduleForm";
import EventProgramForm, { ProgramItem } from "./EventProgramForm";

// Common input styles for form fields (readable text - always dark text on light background)
const INPUT_STYLES = "bg-white text-[#1a1a1a] placeholder:text-mp-ink-muted border-slate-300 focus:border-sakura focus:ring-sakura/20";
const SELECT_STYLES = "bg-white text-[#1a1a1a] border-slate-300 focus:border-sakura focus:ring-sakura/20";

// Regions data for France
const REGIONS_DATA = [
  {
    label: "PROVENCE-ALPES-CÔTE D'AZUR",
    options: [
      "04 - Alpes-de-Haute-Provence",
      "05 - Hautes-Alpes",
      "06 - Alpes-Maritimes",
      "13 - Bouches-du-Rhône",
      "83 - Var",
      "84 - Vaucluse",
    ],
  },
  {
    label: "AUVERGNE-RHÔNE-ALPES",
    options: [
      "01 - Ain",
      "07 - Ardèche",
      "26 - Drôme",
      "38 - Isère",
      "42 - Loire",
      "69 - Rhône",
      "73 - Savoie",
      "74 - Haute-Savoie",
    ],
  },
  {
    label: "ÎLE-DE-FRANCE",
    options: [
      "75 - Paris",
      "77 - Seine-et-Marne",
      "78 - Yvelines",
      "91 - Essonne",
      "92 - Hauts-de-Seine",
      "93 - Seine-Saint-Denis",
      "94 - Val-de-Marne",
      "95 - Val-d'Oise",
    ],
  },
  {
    label: "OCCITANIE",
    options: [
      "09 - Ariège",
      "11 - Aude",
      "12 - Aveyron",
      "30 - Gard",
      "31 - Haute-Garonne",
      "32 - Gers",
      "34 - Hérault",
      "46 - Lot",
      "48 - Lozère",
      "65 - Hautes-Pyrénées",
      "66 - Pyrénées-Orientales",
      "81 - Tarn",
      "82 - Tarn-et-Garonne",
    ],
  },
  {
    label: "NOUVELLE-AQUITAINE",
    options: [
      "16 - Charente",
      "17 - Charente-Maritime",
      "19 - Corrèze",
      "23 - Creuse",
      "24 - Dordogne",
      "33 - Gironde",
      "40 - Landes",
      "47 - Lot-et-Garonne",
      "64 - Pyrénées-Atlantiques",
      "79 - Deux-Sèvres",
      "86 - Vienne",
      "87 - Haute-Vienne",
    ],
  },
];

const CATEGORIES = [
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

export type TicketingMode = 'internal' | 'external';

export interface EventFormData {
  title: string;
  description: string;
  category: string;
  status: string;
  // Schedule
  schedule: ScheduleDay[];
  // Location
  venue_name: string;
  city: string;
  region: string;
  // Ticketing
  ticketing_mode: TicketingMode;
  external_link: string;
  is_free: boolean;
  price_amount: string;
  is_capacity_limited: boolean;
  max_attendees: string;
  // Media
  image_url: string;
  // Quest
  enablePresenceQuest: boolean;
  // Program items (for event_schedule table)
  programItems: ProgramItem[];
}

// Helper function to ensure programItems are properly mapped
const mapProgramItems = (items: ProgramItem[]): ProgramItem[] => {
 return items.map(item => ({
   ...item,
   is_cosplay_contest: item.is_cosplay_contest === true,
   external_link: item.external_link || null,
   activity_image_url: item.activity_image_url || null,
 }));
};

interface EventFormAdvancedProps {
  initialData?: Partial<EventFormData> & { id?: string };
  onSubmit: (data: EventFormData & { id?: string }) => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
  onFormDirtyChange?: (isDirty: boolean) => void;
}

const EventFormAdvanced = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  isEditing = false,
  onFormDirtyChange,
}: EventFormAdvancedProps) => {
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "general",
    status: initialData?.status || "upcoming",
    schedule: initialData?.schedule || [{ date: "", start_time: "10:00", end_time: "18:00" }],
    venue_name: initialData?.venue_name || "",
    city: initialData?.city || "",
    region: initialData?.region || "",
    ticketing_mode: initialData?.ticketing_mode || "internal",
    external_link: initialData?.external_link || "",
    is_free: initialData?.is_free ?? true,
    price_amount: initialData?.price_amount || "",
    is_capacity_limited: initialData?.is_capacity_limited ?? false,
    max_attendees: initialData?.max_attendees || "",
    image_url: initialData?.image_url || "",
    enablePresenceQuest: initialData?.enablePresenceQuest ?? false,
    programItems: initialData?.programItems || [],
  });

  // Track initial state and dirty status
  const initialDataRef = useRef<EventFormData>(formData);
  const [isDirtyForm, setIsDirtyForm] = useState(false);
  const [isProgramDirty, setIsProgramDirty] = useState(false);

  // Sync form data ONLY when the Event ID changes (prevent overwriting local edits with stale DB data)
  useEffect(() => {
    // Sécurité : Si pas de données ou si on est sur le même événement qu'avant, on ne fait rien !
    if (!initialData || (initialData.id === formData.id && initialData.id !== undefined)) {
      return;
    }

    console.log("🔄 [EventFormAdvanced] Loading NEW event data:", initialData.id);

    const newFormData: EventFormData = {
      title: initialData.title || "",
      description: initialData.description || "",
      category: initialData.category || "general",
      status: initialData.status || "upcoming",
      schedule: initialData.schedule || [{ date: "", start_time: "10:00", end_time: "18:00" }],
      venue_name: initialData.venue_name || "",
      city: initialData.city || "",
      region: initialData.region || "",
      ticketing_mode: initialData.ticketing_mode || "internal",
      external_link: initialData.external_link || "",
      is_free: initialData.is_free ?? true,
      price_amount: initialData.price_amount || "",
      is_capacity_limited: initialData.is_capacity_limited ?? false,
      max_attendees: initialData.max_attendees || "",
      image_url: initialData.image_url || "",
      enablePresenceQuest: initialData.enablePresenceQuest ?? false,
      // Utilisation du helper mapProgramItems pour garantir la structure
      programItems: mapProgramItems(initialData.programItems || []),
    };

    setFormData(newFormData);
    initialDataRef.current = newFormData;
    setIsDirtyForm(false);
    setIsProgramDirty(false);

    // DEPENDANCE CRITIQUE : Uniquement l'ID !
  }, [initialData?.id]);

  // Sync programItems when they change externally (e.g., after cache invalidation)
  useEffect(() => {
    // Skip if no initialData or if we're on initial load
    if (!initialData?.programItems) return;
    
    // Only update if the content actually changed (deep comparison)
    const currentProgramItemsJson = JSON.stringify(formData.programItems);
    const newProgramItemsJson = JSON.stringify(initialData.programItems);
    
    if (currentProgramItemsJson !== newProgramItemsJson) {
      console.log("🔄 [EventFormAdvanced] Syncing programItems from external update");
      const mappedItems = mapProgramItems(initialData.programItems || []);
      setFormData(prev => ({
        ...prev,
        programItems: mappedItems
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.programItems]);

  // Detect form changes
  useEffect(() => {
    const isFormDirty = JSON.stringify(formData) !== JSON.stringify(initialDataRef.current);
    setIsDirtyForm(isFormDirty);
    // Notify parent component of dirty state
    if (onFormDirtyChange) {
      onFormDirtyChange(isFormDirty || isProgramDirty);
    }
  }, [formData, isProgramDirty, onFormDirtyChange]);

  // Prevent navigation if form is dirty - optimized with passive listener
  useEffect(() => {
    const isDirty = isDirtyForm || isProgramDirty;
    
    if (!isDirty) return; // Skip listener if not dirty
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Vous n'avez pas mis à jour vos modifications, êtes-vous sûr de vouloir quitter ?";
      return "Vous n'avez pas mis à jour vos modifications, êtes-vous sûr de vouloir quitter ?";
    };

    // Add listener only when dirty to avoid interfering with scroll
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirtyForm, isProgramDirty]);

  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general");

  // Handle image upload
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

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw new Error(uploadError.message || "Erreur lors de l'upload");
      }

      const { data: urlData } = supabase.storage
        .from("event-images")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error("Impossible de récupérer l'URL de l'image");
      }

      setFormData((prev) => ({ ...prev, image_url: urlData.publicUrl }));
      toast.success("Image téléversée avec succès !");
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage = error?.message || error?.error_description || "Erreur lors du téléversement";
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image_url: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Additional validation before submit
    const validSchedule = formData.schedule.filter(day => day.date && day.date.trim() !== "");
    if (validSchedule.length === 0) {
      toast.error("Au moins une date est requise pour créer un événement");
      return;
    }
    
    // Ensure programItems have proper boolean values before submit
    const cleanedFormData = {
      ...formData,
      programItems: mapProgramItems(formData.programItems),
      id: initialData?.id
    };
    console.log("📝 [EventFormAdvanced] Submitting with cleaned programItems:", cleanedFormData.programItems);
    onSubmit(cleanedFormData);
  };

  // Validation: external_link required when mode is external
  const isExternalLinkValid = formData.ticketing_mode === 'internal' || 
    (formData.ticketing_mode === 'external' && formData.external_link.trim().startsWith('http'));

  // Validation: at least one valid date is required
  const hasValidDate = formData.schedule.some(day => day.date && day.date.trim() !== "");

  const isFormValid =
    formData.title.trim() &&
    formData.schedule.length > 0 &&
    hasValidDate &&
    isExternalLinkValid;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="program" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Programme
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6 mt-0">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Titre de l'événement *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Festival Otaku Summer 2026"
              className="text-lg h-12 bg-white text-[#1a1a1a] placeholder:text-mp-ink-muted border-slate-300 focus:border-sakura focus:ring-sakura/20"
            />
          </div>

          {/* Image Upload Section */}
          <Card className="p-4 border-dashed">
            <Label className="flex items-center gap-2 mb-3 text-sm font-medium">
              <ImageIcon className="w-4 h-4 text-sakura" />
              Affiche / Image de couverture
            </Label>

            {formData.image_url ? (
              <div className="relative">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={removeImage}
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
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {isUploading ? (
                  <Loader2 className="w-10 h-10 text-sakura animate-spin" />
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground text-center">
                      <span className="font-medium text-foreground">Glissez-déposez</span> une image ici
                      <br />
                      ou cliquez pour parcourir
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG, WEBP • Max 5 Mo
                    </p>
                  </>
                )}
              </div>
            )}
          </Card>

          {/* Schedule Section */}
          <Card className="p-4 border-sakura/20 bg-sakura/5">
            <EventScheduleForm
              schedule={formData.schedule}
              onChange={(schedule) => setFormData({ ...formData, schedule })}
            />
          </Card>

          {/* Location Section */}
          <Card className="p-4">
            <Label className="flex items-center gap-2 mb-4 text-sm font-medium">
              <MapPin className="w-4 h-4 text-sakura" />
              Localisation
            </Label>

            <div className="space-y-4">
              {/* Venue */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  Lieu / Salle
                </Label>
                <Input
                  value={formData.venue_name}
                  onChange={(e) =>
                    setFormData({ ...formData, venue_name: e.target.value })
                  }
                  placeholder="Ex: Palais des Festivals"
                  className={INPUT_STYLES}
                />
              </div>

              {/* City & Region Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Ville
                  </Label>
                  <Input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Ex: Cannes"
                    className={INPUT_STYLES}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Map className="w-3 h-3" />
                    Région / Département
                  </Label>
                  <Select
                    value={formData.region}
                    onValueChange={(v) => setFormData({ ...formData, region: v })}
                  >
                    <SelectTrigger className={SELECT_STYLES}>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] bg-white dark:bg-white">
                      {REGIONS_DATA.map((region) => (
                        <SelectGroup key={region.label}>
                          <SelectLabel className="text-xs font-bold text-sakura py-2">
                            {region.label}
                          </SelectLabel>
                          {region.options.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Décrivez l'événement, le programme, les activités..."
              rows={4}
              className={`resize-none ${INPUT_STYLES}`}
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
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
              <Label className="text-sm font-medium">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger className={SELECT_STYLES}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-white">
                  <SelectItem value="upcoming">🟢 À venir</SelectItem>
                  <SelectItem value="places-limitees">🟡 Places limitées</SelectItem>
                  <SelectItem value="complet">🔴 Complet</SelectItem>
                  <SelectItem value="cancelled">❌ Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ticketing Section */}
          <Card className="p-4">
            <Label className="flex items-center gap-2 mb-4 text-sm font-medium">
              <Ticket className="w-4 h-4 text-sakura" />
              Billetterie & Jauge
            </Label>

            <div className="space-y-4">
              {/* Ticketing Mode Selector */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Type de billetterie</Label>
                <RadioGroup
                  value={formData.ticketing_mode}
                  onValueChange={(value: TicketingMode) => 
                    setFormData({ 
                      ...formData, 
                      ticketing_mode: value,
                      external_link: value === 'internal' ? '' : formData.external_link 
                    })
                  }
                  className="grid grid-cols-1 gap-3"
                >
                  {/* Internal Option */}
                  <label
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                      formData.ticketing_mode === 'internal'
                        ? "border-sakura bg-sakura/10"
                        : "border-muted hover:border-sakura/50"
                    )}
                  >
                    <RadioGroupItem value="internal" className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-sakura" />
                        <span className="font-medium text-sm">Billetterie Manga Paradise</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Inscription gérée directement dans l'application
                      </p>
                    </div>
                  </label>

                  {/* External Option */}
                  <label
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                      formData.ticketing_mode === 'external'
                        ? "border-sakura bg-sakura/10"
                        : "border-muted hover:border-sakura/50"
                    )}
                  >
                    <RadioGroupItem value="external" className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-cyan-400" />
                        <span className="font-medium text-sm">Billetterie Externe / Hybride</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Inscription sur site tiers + Tracking social interne
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* External Link Input (conditional) */}
              {formData.ticketing_mode === 'external' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pl-4 border-l-2 border-cyan-400/50"
                >
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      Lien de la billetterie officielle *
                    </Label>
                    <Input
                      type="url"
                      value={formData.external_link}
                      onChange={(e) =>
                        setFormData({ ...formData, external_link: e.target.value })
                      }
                      placeholder="https://www.billeterie-officielle.fr/event"
                      className={cn(
                        INPUT_STYLES,
                        !formData.external_link && "border-destructive/50"
                      )}
                    />
                    {!formData.external_link && (
                      <p className="text-xs text-destructive">
                        Ce champ est obligatoire pour la billetterie externe
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    💡 Les membres pourront réserver via ce lien ET déclarer leur présence dans l'app pour apparaître dans la Visual Line-Up.
                  </p>
                </motion.div>
              )}

              {/* Price Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Euro className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">
                      {formData.ticketing_mode === 'external' ? "Prix indicatif" : "Tarification"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formData.is_free ? "Entrée gratuite" : "Entrée payante"}
                      {formData.ticketing_mode === 'external' && " (affichage uniquement)"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-xs", formData.is_free && "text-sakura font-medium")}>
                    Gratuit
                  </span>
                  <Switch
                    checked={!formData.is_free}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_free: !checked, price_amount: "" })
                    }
                  />
                  <span className={cn("text-xs", !formData.is_free && "text-sakura font-medium")}>
                    Payant
                  </span>
                </div>
              </div>

              {/* Price Input (conditional) */}
              {!formData.is_free && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pl-4 border-l-2 border-sakura/30"
                >
                  <Label className="text-xs text-muted-foreground">
                    {formData.ticketing_mode === 'external' ? "Prix indicatif (€)" : "Prix d'entrée (€)"}
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.price_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, price_amount: e.target.value })
                      }
                      placeholder="15"
                      className={`w-32 ${INPUT_STYLES}`}
                    />
                    <span className="text-sm text-muted-foreground">€</span>
                  </div>
                </motion.div>
              )}

              {/* Capacity Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">
                      {formData.ticketing_mode === 'external' ? "Jauge du groupe" : "Capacité"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formData.is_capacity_limited ? "Places limitées" : "Entrée libre / Illimité"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-xs", !formData.is_capacity_limited && "text-sakura font-medium")}>
                    Illimité
                  </span>
                  <Switch
                    checked={formData.is_capacity_limited}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_capacity_limited: checked, max_attendees: "" })
                    }
                  />
                  <span className={cn("text-xs", formData.is_capacity_limited && "text-sakura font-medium")}>
                    Limité
                  </span>
                </div>
              </div>

              {/* Capacity Input (conditional) */}
              {formData.is_capacity_limited && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pl-4 border-l-2 border-sakura/30"
                >
                  <Label className="text-xs text-muted-foreground">
                    {formData.ticketing_mode === 'external' 
                      ? "Limite du groupe Manga Paradise" 
                      : "Nombre de places"
                    }
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      min="1"
                      value={formData.max_attendees}
                      onChange={(e) =>
                        setFormData({ ...formData, max_attendees: e.target.value })
                      }
                      placeholder="100"
                      className={`w-32 ${INPUT_STYLES}`}
                    />
                    <span className="text-sm text-muted-foreground">personnes</span>
                  </div>
                  {formData.ticketing_mode === 'external' && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Laissez vide pour illimité, même si l'événement externe a une capacité différente.
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          </Card>

          {/* Presence Quest Toggle (only for new events) */}
          {!isEditing && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-sm">📍 Quête de présence</p>
                <p className="text-xs text-muted-foreground">
                  Activer le check-in par QR Code (récompense XP/OTK)
                </p>
              </div>
              <Switch
                checked={formData.enablePresenceQuest}
                onCheckedChange={(v) =>
                  setFormData({ ...formData, enablePresenceQuest: v })
                }
              />
            </div>
          )}
        </TabsContent>

        {/* Program Tab */}
         <TabsContent value="program" className="mt-0 pb-24">
           <Card className="p-6 border-sakura/20 bg-sakura/5">
             <EventProgramForm
               key={`program-${formData.schedule.map(s => s.date).join(',')}`}
               eventId={initialData?.id}
               scheduleDays={formData.schedule}
               existingItems={formData.programItems}
               onChange={(items) => {
                 console.log("📤 [EventFormAdvanced] Received programItems from child:", items.length, "items");
                 const mappedItems = mapProgramItems(items);
                 console.log("📤 [EventFormAdvanced] Mapped items:", mappedItems.map(i => ({ title: i.title, is_cosplay_contest: i.is_cosplay_contest })));
                 setFormData(prev => ({ ...prev, programItems: mappedItems }));
               }}
               isDirty={setIsProgramDirty}
             />
           </Card>
         </TabsContent>
       </Tabs>

       {/* Submit Button — Sticky Footer */}
       <div className="sticky bottom-0 left-0 right-0 z-50 flex justify-end gap-3 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border shadow-lg mt-6 -mx-6 -mb-6 rounded-b-lg">
         <Button
           type="submit"
           disabled={isSubmitting || !isFormValid}
           className="min-w-[200px] bg-sakura hover:bg-sakura/90 text-white font-semibold"
         >
           {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
           <Save className="w-4 h-4 mr-2" />
           Sauvegarder les informations
         </Button>
       </div>
     </form>
   );
 };
 
 export default EventFormAdvanced;
