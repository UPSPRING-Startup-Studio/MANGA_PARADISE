import { useState, useRef, useCallback, memo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Plus, Trash2, Clock, MapPin, GripVertical, Calendar,
  Mic2, Music, Gamepad2, Drama, Users, Award, Film, Coffee, Sparkles, Trophy, Link as LinkIcon,
  Upload, X, Image as ImageIcon, Loader2, Settings, Lightbulb, Boxes, Timer, Calendar as CalendarIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";
import {
  ScheduleCategory,
  SCHEDULE_CATEGORIES
} from "@/hooks/useEventSchedule";
import { ScheduleDay } from "./EventScheduleForm";
import ImageCropperModal from "@/components/ui/ImageCropperModal";
import { getCroppedImg } from "@/lib/canvasUtils";
import type { Area } from "react-easy-crop";

// Common input styles for form fields (readable text - always dark text on light background)
const INPUT_STYLES = "bg-white text-[#1a1a1a] placeholder:text-mp-ink-muted border-slate-300 focus:border-sakura focus:ring-sakura/20";
const SELECT_STYLES = "bg-white text-[#1a1a1a] border-slate-300 focus:border-sakura focus:ring-sakura/20";

// ── Contest Config Types ──────────────────────────────────────────────
export interface FormatConfig {
  enabled: boolean;
  max_duration_sec: number;
  max_participants?: number; // Only for "group" format
}

export interface ContestConfig {
  prejudging_time: string;
  stage_dimensions: string;
  dressing_info: string;
  allow_lights: boolean;
  allow_props: boolean;
  allowed_formats: Record<string, FormatConfig>;
  registration_deadline?: string; // ISO date string (YYYY-MM-DD)
}

// Default contest configuration
const DEFAULT_CONTEST_CONFIG: ContestConfig = {
  prejudging_time: "10:00",
  stage_dimensions: "",
  dressing_info: "",
  allow_lights: false,
  allow_props: false,
  allowed_formats: {
    solo: { enabled: true, max_duration_sec: 90 },
    duo: { enabled: true, max_duration_sec: 120 },
    trio: { enabled: true, max_duration_sec: 180 },
    quatuor: { enabled: true, max_duration_sec: 210 },
    group: { enabled: true, max_duration_sec: 240, max_participants: 12 },
  },
  registration_deadline: undefined,
};

// Format labels for display
const FORMAT_LABELS: Record<string, { label: string; emoji: string }> = {
  solo: { label: "Solo", emoji: "🧍" },
  duo: { label: "Duo", emoji: "👫" },
  trio: { label: "Trio", emoji: "👥" },
  quatuor: { label: "Quatuor", emoji: "🎭" },
  group: { label: "Groupe", emoji: "🎪" },
};

// Helper: convert seconds to human-readable duration
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min} min ${sec}s` : `${min} min`;
};

export interface ProgramItem {
  id: string; // stable ID using nanoid
  time: string;
  end_time: string | null;
  title: string;
  location: string | null;
  category: ScheduleCategory;
  description: string | null;
  day_date: string | null;
  is_cosplay_contest?: boolean;
  external_link?: string; // Link for registration/info
  activity_image_url?: string; // Banner image for activity (3:1 ratio, 1500x500px)
  contest_config?: ContestConfig; // Contest configuration (JSONB)
}

interface EventProgramFormProps {
  eventId?: string;
  scheduleDays: ScheduleDay[];
  existingItems?: ProgramItem[];
  onChange: (items: ProgramItem[]) => void;
  isDirty?: (dirty: boolean) => void;
}

// Generate a stable ID for new items using nanoid
const generateTempId = () => {
  return `temp_${nanoid(12)}`;
};

// Category icon mapping
const categoryIcons: Record<ScheduleCategory, React.ElementType> = {
  animation: Sparkles,
  conference: Mic2,
  meet_greet: Users,
  concert: Music,
  gaming: Gamepad2,
  cosplay: Drama,
  workshop: Award,
  contest: Award,
  screening: Film,
  other: Coffee,
};

// Category color mapping
const categoryColors: Record<ScheduleCategory, string> = {
  animation: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  conference: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  meet_greet: "bg-turquoise/20 text-turquoise border-turquoise/30",
  concert: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  gaming: "bg-green-500/20 text-green-400 border-green-500/30",
  cosplay: "bg-sakura/20 text-sakura border-sakura/30",
  workshop: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  contest: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  screening: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

// Helper to map raw items to ProgramItem shape
const mapExistingItems = (rawItems: ProgramItem[]): ProgramItem[] =>
  rawItems.map(item => ({
    id: item.id,
    time: item.time,
    end_time: item.end_time,
    title: item.title,
    location: item.location,
    category: item.category,
    description: item.description,
    day_date: item.day_date,
    is_cosplay_contest: item.is_cosplay_contest || false,
    activity_image_url: item.activity_image_url || undefined,
    contest_config: item.contest_config || undefined,
  }));

// ── Contest Config Panel Component ────────────────────────────────────
interface ContestConfigPanelProps {
  config: ContestConfig;
  onChange: (config: ContestConfig) => void;
}

const ContestConfigPanel = ({ config, onChange }: ContestConfigPanelProps) => {
  const updateField = <K extends keyof ContestConfig>(field: K, value: ContestConfig[K]) => {
    onChange({ ...config, [field]: value });
  };

  const updateFormat = (formatKey: string, field: keyof FormatConfig, value: boolean | number) => {
    const updatedFormats = {
      ...config.allowed_formats,
      [formatKey]: {
        ...config.allowed_formats[formatKey],
        [field]: value,
      },
    };
    onChange({ ...config, allowed_formats: updatedFormats });
  };

  return (
    <div className="space-y-6">
      {/* A. Chronométrie & Logistique */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Timer className="w-5 h-5 text-[hsl(var(--mp-primary))]" />
          <h3 className="font-bold text-base">Chronométrie & Logistique</h3>
        </div>

        {/* Pré-judging Time - Critical field */}
        <div className="space-y-1">
          <Label className="text-sm font-medium text-red-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Heure de convocation Jury — Impératif ⚠️
          </Label>
          <Input
            type="time"
            value={config.prejudging_time}
            onChange={(e) => updateField("prejudging_time", e.target.value)}
            className={`h-10 text-sm w-full max-w-xs border-red-300 focus:border-red-500 ${INPUT_STYLES}`}
          />
          <p className="text-xs text-muted-foreground">
            Les participants devront être présents à cette heure pour le pré-judging.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stage Dimensions */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-foreground/80">
              Dimensions de la scène
            </Label>
            <Input
              value={config.stage_dimensions}
              onChange={(e) => updateField("stage_dimensions", e.target.value)}
              placeholder="Ex: 10m x 6m"
              className={`h-10 text-sm w-full ${INPUT_STYLES}`}
            />
          </div>

          {/* Dressing Info */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-foreground/80">
              Infos Vestiaires
            </Label>
            <Input
              value={config.dressing_info}
              onChange={(e) => updateField("dressing_info", e.target.value)}
              placeholder="Ex: Loges communes derrière scène"
              className={`h-10 text-sm w-full ${INPUT_STYLES}`}
            />
          </div>
        </div>
      </div>

      {/* Registration Deadline */}
      <div className="space-y-1">
        <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1">
          <CalendarIcon className="w-3 h-3" />
          Date limite d'inscription
        </Label>
        <Input
          type="date"
          value={config.registration_deadline || ""}
          onChange={(e) => updateField("registration_deadline", e.target.value || undefined)}
          className={`h-10 text-sm w-full max-w-xs ${INPUT_STYLES}`}
        />
        <p className="text-xs text-muted-foreground">
          Les inscriptions seront fermées après cette date.
        </p>
      </div>

      {/* B. Options Scéniques */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-base">Options Scéniques</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Allow Lights */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div>
              <Label className="text-sm font-medium">Ambiance lumineuse</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Autoriser les demandes de lumière ?
              </p>
            </div>
            <Switch
              checked={config.allow_lights}
              onCheckedChange={(checked) => updateField("allow_lights", checked)}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>

          {/* Allow Props */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div>
              <Label className="text-sm font-medium">Décors encombrants</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Autoriser les décors sur scène ?
              </p>
            </div>
            <Switch
              checked={config.allow_props}
              onCheckedChange={(checked) => updateField("allow_props", checked)}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
        </div>
      </div>

      {/* C. Matrice des Formats */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Drama className="w-5 h-5 text-sakura" />
          <h3 className="font-bold text-base">Matrice des Formats</h3>
        </div>

        <div className="space-y-3">
          {Object.entries(FORMAT_LABELS).map(([key, { label, emoji }]) => {
            const format = config.allowed_formats[key] || { enabled: false, max_duration_sec: 90 };
            return (
              <div
                key={key}
                className={cn(
                  "flex flex-wrap items-center gap-4 p-3 rounded-lg border transition-all",
                  format.enabled
                    ? "bg-sakura/5 border-sakura/30"
                    : "bg-white/5 border-white/10 opacity-60"
                )}
              >
                {/* Checkbox + Label */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  <Checkbox
                    checked={format.enabled}
                    onCheckedChange={(checked) => updateFormat(key, "enabled", !!checked)}
                    className="data-[state=checked]:bg-sakura data-[state=checked]:border-sakura"
                  />
                  <span className="text-lg">{emoji}</span>
                  <span className="font-medium text-sm">{label}</span>
                </div>

                {/* Duration Input */}
                {format.enabled && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Durée max :</Label>
                    <Input
                      type="number"
                      min={10}
                      max={600}
                      value={format.max_duration_sec}
                      onChange={(e) => updateFormat(key, "max_duration_sec", parseInt(e.target.value) || 90)}
                      className={`h-8 w-20 text-sm ${INPUT_STYLES}`}
                    />
                    <span className="text-xs text-muted-foreground">sec</span>
                    <span className="text-xs font-medium text-sakura ml-1">
                      = {formatDuration(format.max_duration_sec)}
                    </span>
                  </div>
                )}

                {/* Max Participants (Group only) */}
                {format.enabled && key === "group" && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Max participants :</Label>
                    <Input
                      type="number"
                      min={5}
                      max={30}
                      value={format.max_participants || 12}
                      onChange={(e) => updateFormat(key, "max_participants", parseInt(e.target.value) || 12)}
                      className={`h-8 w-20 text-sm ${INPUT_STYLES}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const EventProgramFormComponent = ({
  // eventId is kept in props interface for parent compatibility but not used here
  scheduleDays,
  existingItems = [],
  onChange,
  isDirty
}: EventProgramFormProps) => {
  // Initialize items from existing data or empty array
  const [items, setItems] = useState<ProgramItem[]>(() => {
    if (existingItems.length > 0) {
      return mapExistingItems(existingItems);
    }
    return [];
  });

  // Track initial state for dirty detection
  const initialItemsRef = useRef<ProgramItem[]>(existingItems);

  // Sync items when existingItems changes (e.g., after React Query invalidation)
  useEffect(() => {
    if (existingItems.length > 0) {
      const freshItems = mapExistingItems(existingItems);
      setItems(freshItems);
      initialItemsRef.current = existingItems;
      isDirtyFlagRef.current = false;
    }
  }, [existingItems]);
  const isDirtyFlagRef = useRef(false);

  // Image upload state
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [dragActiveItemId, setDragActiveItemId] = useState<string | null>(null);

  // Crop modal state
  const [cropState, setCropState] = useState<{ open: boolean; imageSrc: string; itemId: string | null }>({
    open: false,
    imageSrc: '',
    itemId: null,
  });

  // Helper: notify parent AND mark dirty — called ONLY from user actions
  const notifyParent = useCallback((updatedItems: ProgramItem[]) => {
    console.log("⚡ [EventProgramForm] Notifying parent (event-driven):", updatedItems.map(i => ({ id: i.id, title: i.title, is_cosplay_contest: i.is_cosplay_contest })));
    onChange(updatedItems);
    // Mark dirty on first change
    if (isDirty && !isDirtyFlagRef.current) {
      const dirty = JSON.stringify(updatedItems) !== JSON.stringify(initialItemsRef.current);
      if (dirty) {
        isDirtyFlagRef.current = true;
        isDirty(true);
      }
    }
  }, [onChange, isDirty]);

  // Add a new item — notifies parent immediately
  const addItem = useCallback(() => {
    const defaultDay = scheduleDays.length > 0 ? scheduleDays[0].date : null;
    const newItem: ProgramItem = {
      id: generateTempId(),
      time: "10:00",
      end_time: null,
      title: "",
      location: null,
      category: "other",
      description: null,
      day_date: defaultDay,
      is_cosplay_contest: false,
    };
    setItems(prev => {
      const updated = [...prev, newItem];
      notifyParent(updated);
      return updated;
    });
  }, [scheduleDays, notifyParent]);

  // Remove an item — notifies parent immediately
  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      notifyParent(updated);
      return updated;
    });
  }, [notifyParent]);

  // Update an item field — notifies parent immediately
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateItem = useCallback((id: string, field: keyof ProgramItem, value: any) => {
    console.log(`🔄 [EventProgramForm] updateItem called:`, { id, field, value, type: typeof value });
    setItems(prev => {
      const updated: ProgramItem[] = prev.map(item => {
        if (item.id === id) {
          // If changing category, reset is_cosplay_contest to false if not cosplay/contest
          if (field === "category" && value !== "cosplay" && value !== "contest") {
            console.log(`✅ [EventProgramForm] Updating ${field} + resetting is_cosplay_contest`);
            return { ...item, [field]: value, is_cosplay_contest: false } as ProgramItem;
          }
          console.log(`✅ [EventProgramForm] Updating ${field} to:`, value);
          return { ...item, [field]: value } as ProgramItem;
        }
        return item;
      });
      notifyParent(updated);
      return updated;
    });
  }, [notifyParent]);

  // Upload a Blob (cropped image) to Supabase
  const uploadBlobToSupabase = useCallback(async (blob: Blob, itemId: string) => {
    setUploadingItemId(itemId);
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `activities/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(filePath, blob, { contentType: "image/jpeg" });

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

      updateItem(itemId, "activity_image_url", urlData.publicUrl);
      toast.success("Image de l'activité téléversée avec succès !");
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage = error?.message || error?.error_description || "Erreur lors du téléversement";
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setUploadingItemId(null);
    }
  }, [updateItem]);

  // Step 1: User selects a file → read as base64 → open crop modal
  const onFileSelect = useCallback((file: File, itemId: string) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropState({ open: true, imageSrc: reader.result as string, itemId });
    };
    reader.readAsDataURL(file);
  }, []);

  // Step 2: User confirms crop → produce blob → upload
  const onCropConfirmed = useCallback(async (croppedAreaPixels: Area) => {
    if (!cropState.itemId) return;
    setCropState(prev => ({ ...prev, open: false }));
    try {
      const blob = await getCroppedImg(cropState.imageSrc, croppedAreaPixels);
      await uploadBlobToSupabase(blob, cropState.itemId);
    } catch (err) {
      console.error("Crop error:", err);
      toast.error("Erreur lors du recadrage de l'image");
    }
  }, [cropState, uploadBlobToSupabase]);

  // Drag and drop handlers for activity images
  const handleActivityDrag = useCallback((e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveItemId(itemId);
    } else if (e.type === "dragleave") {
      setDragActiveItemId(null);
    }
  }, []);

  const handleActivityDrop = useCallback((e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveItemId(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0], itemId);
    }
  }, [onFileSelect]);

  const removeActivityImage = useCallback((itemId: string) => {
    updateItem(itemId, "activity_image_url", undefined);
  }, [updateItem]);

  // Sort items by time
  const sortedItems = [...items].sort((a, b) => {
    // First sort by day if multiple days
    if (a.day_date && b.day_date) {
      const dayCompare = a.day_date.localeCompare(b.day_date);
      if (dayCompare !== 0) return dayCompare;
    }
    // Then sort by time
    return a.time.localeCompare(b.time);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-base">
          <Calendar className="w-4 h-4 text-sakura" />
          Programme des activités
        </Label>
        <span className="text-sm text-muted-foreground">
          {items.length} activité{items.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedItems.map((item) => {
            const IconComponent = categoryIcons[item.category] || Coffee;
            const colorClass = categoryColors[item.category] || categoryColors.other;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                layout
                className="relative"
              >
                <Card className={cn(
                  "p-4 border-l-4 transition-all duration-200 relative",
                  colorClass.replace('bg-', 'border-l-').replace('/20', '')
                )}>
                  {/* Cosplay Contest Badge */}
                  {item.is_cosplay_contest && (
                    <div className="absolute top-2 right-2 bg-[hsl(var(--mp-primary))] text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-[0_0_12px_rgba(255,0,127,0.4)]">
                      <Trophy className="w-3 h-3" />
                      Concours
                    </div>
                  )}
                  
                  {/* Delete Button - Top Right (Mobile Friendly) */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="absolute top-3 right-3 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 md:relative md:top-auto md:right-auto md:shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-start gap-3">
                    {/* Drag Handle & Index */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      <span className="text-xs text-muted-foreground">#{sortedItems.indexOf(item) + 1}</span>
                    </div>

                    {/* Main Content - Wrapped in Tabs for contest items */}
                    <div className="flex-1">
                     {/* Show Tabs only for contest items, otherwise show form directly */}
                     {(item.category === "contest" || item.is_cosplay_contest) ? (
                      <Tabs defaultValue="general" className="w-full">
                        <TabsList className="mb-4 bg-white/10">
                          <TabsTrigger value="general" className="text-xs data-[state=active]:bg-sakura data-[state=active]:text-white">
                            📋 Général
                          </TabsTrigger>
                          <TabsTrigger value="contest" className="text-xs data-[state=active]:bg-[hsl(var(--mp-saffron))] data-[state=active]:text-black">
                            ⚙️ Paramètres Concours
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-5 mt-0">
                       {/* Row 1: Start Time (col-span-6), End Time (col-span-6) */}
                       <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                         {/* Start Time */}
                         <div className="col-span-1 md:col-span-6 space-y-1">
                           <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1">
                             <Clock className="w-3 h-3" />
                             Heure début *
                           </Label>
                           <Input
                             type="time"
                             value={item.time}
                             onChange={(e) => updateItem(item.id, "time", e.target.value)}
                             className={`h-10 text-sm w-full ${INPUT_STYLES}`}
                           />
                         </div>

                         {/* End Time */}
                         <div className="col-span-1 md:col-span-6 space-y-1">
                           <Label className="text-sm font-medium text-foreground/80">
                             Heure fin
                           </Label>
                           <Input
                             type="time"
                             value={item.end_time || ""}
                             onChange={(e) => updateItem(item.id, "end_time", e.target.value || null)}
                             className={`h-10 text-sm w-full ${INPUT_STYLES}`}
                             placeholder="Optionnel"
                           />
                         </div>
                       </div>

                       {/* Row 2: Title (col-span-8), Category (col-span-4) */}
                       <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                         {/* Title */}
                         <div className="col-span-1 md:col-span-8 space-y-1">
                           <Label className="text-sm font-medium text-foreground/80">
                             Titre *
                           </Label>
                           <Input
                             value={item.title}
                             onChange={(e) => updateItem(item.id, "title", e.target.value)}
                             placeholder="Ex: Concours Cosplay"
                             className={`h-10 text-sm w-full ${INPUT_STYLES}`}
                           />
                         </div>

                         {/* Category - Now with 4 columns to prevent wrapping */}
                         <div className="col-span-1 md:col-span-4 space-y-1">
                           <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1">
                             <IconComponent className="w-3 h-3" />
                             Catégorie
                           </Label>
                           <Select
                             value={item.category}
                             onValueChange={(v) => updateItem(item.id, "category", v as ScheduleCategory)}
                           >
                             <SelectTrigger className={`h-10 text-sm w-full ${SELECT_STYLES}`}>
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent className="bg-white dark:bg-white">
                               {SCHEDULE_CATEGORIES.map((cat) => {
                                 const CatIcon = categoryIcons[cat.value];
                                 return (
                                   <SelectItem key={cat.value} value={cat.value}>
                                     <div className="flex items-center gap-2">
                                       <CatIcon className="w-3 h-3" />
                                       {cat.label}
                                     </div>
                                   </SelectItem>
                                 );
                               })}
                             </SelectContent>
                           </Select>
                         </div>
                       </div>

                       {/* Row 3: Location (col-span-6), External Link (col-span-6) */}
                       <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                         {/* Location */}
                         <div className="col-span-1 md:col-span-6 space-y-1">
                           <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1">
                             <MapPin className="w-3 h-3" />
                             Lieu
                           </Label>
                           <Input
                             value={item.location || ""}
                             onChange={(e) => updateItem(item.id, "location", e.target.value || null)}
                             placeholder="Ex: Scène Principale"
                             className={`h-10 text-sm w-full ${INPUT_STYLES}`}
                           />
                         </div>

                         {/* External Link */}
                         <div className="col-span-1 md:col-span-6 space-y-1">
                           <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1">
                             <LinkIcon className="w-3 h-3" />
                             Lien (Inscription/Infos)
                           </Label>
                           <Input
                             type="url"
                             value={item.external_link || ""}
                             onChange={(e) => updateItem(item.id, "external_link", e.target.value || null)}
                             placeholder="https://..."
                             className={`h-10 text-sm w-full ${INPUT_STYLES}`}
                           />
                         </div>
                       </div>

                       {/* Row 4: Activity Image Upload (col-span-12) */}
                       <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                         <div className="col-span-1 md:col-span-12 space-y-1">
                           <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1">
                             <ImageIcon className="w-3 h-3" />
                             Bannière de l'activité (1500x500px)
                           </Label>
                           
                           {item.activity_image_url ? (
                             <div className="relative w-full aspect-[3/1] rounded-md overflow-hidden group border border-slate-200 shadow-sm">
                               <img
                                 src={item.activity_image_url}
                                 alt="Aperçu bannière"
                                 className="w-full h-full object-cover"
                               />
                               <Button
                                 type="button"
                                 variant="destructive"
                                 size="icon"
                                 className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                 onClick={() => removeActivityImage(item.id)}
                               >
                                 <X className="w-4 h-4" />
                               </Button>
                             </div>
                           ) : (
                             <div
                               onDragEnter={(e) => handleActivityDrag(e, item.id)}
                               onDragLeave={(e) => handleActivityDrag(e, item.id)}
                               onDragOver={(e) => handleActivityDrag(e, item.id)}
                               onDrop={(e) => handleActivityDrop(e, item.id)}
                               className={cn(
                                 "relative flex flex-col items-center justify-center w-full aspect-[3/1] rounded-lg border-2 border-dashed transition-colors cursor-pointer",
                                 dragActiveItemId === item.id
                                   ? "border-sakura bg-sakura/10"
                                   : "border-muted-foreground/30 hover:border-sakura/50 hover:bg-muted/50"
                               )}
                             >
                               <input
                                 type="file"
                                 accept="image/*"
                                 onChange={(e) => {
                                   if (e.target.files && e.target.files[0]) {
                                     onFileSelect(e.target.files[0], item.id);
                                   }
                                 }}
                                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                               />
                               
                               {uploadingItemId === item.id ? (
                                 <Loader2 className="w-8 h-8 text-sakura animate-spin" />
                               ) : (
                                 <>
                                   <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                   <p className="text-sm text-muted-foreground text-center">
                                     <span className="font-medium text-foreground">Glissez-déposez</span> une image ici
                                     <br />
                                     ou cliquez pour parcourir
                                   </p>
                                   <p className="text-xs text-muted-foreground mt-1">
                                     PNG, JPG, WEBP • Max 5 Mo
                                   </p>
                                 </>
                               )}
                             </div>
                           )}
                         </div>
                       </div>

                       {/* Row 5: Description (col-span-12) + Cosplay Contest Flag */}
                       <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                         <div className={cn("space-y-1", (item.category === "cosplay" || item.category === "contest") ? "col-span-1 md:col-span-8" : "col-span-1 md:col-span-12")}>
                           <Label className="text-sm font-medium text-foreground/80">
                             Description (optionnelle)
                           </Label>
                           <Textarea
                             value={item.description || ""}
                             onChange={(e) => updateItem(item.id, "description", e.target.value || null)}
                             placeholder="Description de l'activité..."
                             className={`h-20 resize-none text-sm w-full ${INPUT_STYLES}`}
                           />
                         </div>

                         {/* Cosplay Contest Flag - Only show for cosplay/contest categories */}
                         {(item.category === "cosplay" || item.category === "contest") && (
                           <div className="col-span-1 md:col-span-4 space-y-1">
                             <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1">
                               <Trophy className="w-3 h-3" />
                               Concours Officiel
                             </Label>
                             <div className="h-20 flex items-center justify-center gap-3">
                               <Switch
                                 checked={item.is_cosplay_contest === true}
                                 onCheckedChange={(checked) => updateItem(item.id, "is_cosplay_contest", checked)}
                                 className={cn(
                                   "data-[state=checked]:bg-[hsl(var(--mp-primary))]",
                                   item.is_cosplay_contest && "shadow-[0_0_12px_rgba(255,0,127,0.4)]"
                                 )}
                               />
                               <span className="text-sm text-muted-foreground whitespace-nowrap">
                                 {item.is_cosplay_contest ? "🏆 Oui" : "Non"}
                               </span>
                             </div>
                           </div>
                         )}
                       </div>

                       {/* Day selector (if multi-day) - Optional, can be placed at top or bottom */}
                       {scheduleDays.length > 1 && (
                         <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                           <div className="col-span-1 md:col-span-6 space-y-1">
                             <Label className="text-sm font-medium text-foreground/80">
                               Jour
                             </Label>
                             <Select
                               value={item.day_date || ""}
                               onValueChange={(v) => updateItem(item.id, "day_date", v || null)}
                             >
                               <SelectTrigger className={`h-10 text-sm w-full ${SELECT_STYLES}`}>
                                 <SelectValue placeholder="Sélectionner" />
                               </SelectTrigger>
                               <SelectContent className="bg-white dark:bg-white">
                                 {scheduleDays.map((day) => (
                                   <SelectItem key={day.date} value={day.date}>
                                     {day.date}
                                   </SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                           </div>
                         </div>
                       )}
                        </TabsContent>

                        <TabsContent value="contest" className="mt-0">
                          <ContestConfigPanel
                            config={item.contest_config || DEFAULT_CONTEST_CONFIG}
                            onChange={(newConfig) => updateItem(item.id, "contest_config", newConfig)}
                          />
                        </TabsContent>
                      </Tabs>
                     ) : (
                      /* Non-contest items: show form directly without tabs */
                      <div className="space-y-5">
                       {/* Row 1: Start Time (col-span-6), End Time (col-span-6) */}
                       <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                         {/* Start Time */}
                         <div className="col-span-1 md:col-span-6 space-y-1">
                           <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1">
                             <Clock className="w-3 h-3" />
                             Heure début *
                           </Label>
                           <Input
                             type="time"
                             value={item.time}
                             onChange={(e) => updateItem(item.id, "time", e.target.value)}
                             className={`h-10 text-sm w-full ${INPUT_STYLES}`}
                           />
                         </div>

                         {/* End Time */}
                         <div className="col-span-1 md:col-span-6 space-y-1">
                           <Label className="text-sm font-medium text-foreground/80">
                             Heure fin
                           </Label>
                           <Input
                             type="time"
                             value={item.end_time || ""}
                             onChange={(e) => updateItem(item.id, "end_time", e.target.value || null)}
                             className={`h-10 text-sm w-full ${INPUT_STYLES}`}
                             placeholder="Optionnel"
                           />
                         </div>
                       </div>

                       {/* Row 2: Title (col-span-8), Category (col-span-4) */}
                       <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                         {/* Title */}
                         <div className="col-span-1 md:col-span-8 space-y-1">
                           <Label className="text-sm font-medium text-foreground/80">
                             Titre *
                           </Label>
                           <Input
                             value={item.title}
                             onChange={(e) => updateItem(item.id, "title", e.target.value)}
                             placeholder="Ex: Concours Cosplay"
                             className={`h-10 text-sm w-full ${INPUT_STYLES}`}
                           />
                         </div>

                         {/* Category */}
                         <div className="col-span-1 md:col-span-4 space-y-1">
                           <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1">
                             <IconComponent className="w-3 h-3" />
                             Catégorie
                           </Label>
                           <Select
                             value={item.category}
                             onValueChange={(v) => updateItem(item.id, "category", v as ScheduleCategory)}
                           >
                             <SelectTrigger className={`h-10 text-sm w-full ${SELECT_STYLES}`}>
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent className="bg-white dark:bg-white">
                               {SCHEDULE_CATEGORIES.map((cat) => {
                                 const CatIcon = categoryIcons[cat.value];
                                 return (
                                   <SelectItem key={cat.value} value={cat.value}>
                                     <div className="flex items-center gap-2">
                                       <CatIcon className="w-3 h-3" />
                                       {cat.label}
                                     </div>
                                   </SelectItem>
                                 );
                               })}
                             </SelectContent>
                           </Select>
                         </div>
                       </div>

                       {/* Row 3: Location + External Link */}
                       <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                         <div className="col-span-1 md:col-span-6 space-y-1">
                           <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1">
                             <MapPin className="w-3 h-3" />
                             Lieu
                           </Label>
                           <Input
                             value={item.location || ""}
                             onChange={(e) => updateItem(item.id, "location", e.target.value || null)}
                             placeholder="Ex: Scène Principale"
                             className={`h-10 text-sm w-full ${INPUT_STYLES}`}
                           />
                         </div>
                         <div className="col-span-1 md:col-span-6 space-y-1">
                           <Label className="text-sm font-medium text-foreground/80 flex items-center gap-1">
                             <LinkIcon className="w-3 h-3" />
                             Lien (Inscription/Infos)
                           </Label>
                           <Input
                             type="url"
                             value={item.external_link || ""}
                             onChange={(e) => updateItem(item.id, "external_link", e.target.value || null)}
                             placeholder="https://..."
                             className={`h-10 text-sm w-full ${INPUT_STYLES}`}
                           />
                         </div>
                       </div>

                       {/* Row 4: Description */}
                       <div className="space-y-1">
                         <Label className="text-sm font-medium text-foreground/80">
                           Description (optionnelle)
                         </Label>
                         <Textarea
                           value={item.description || ""}
                           onChange={(e) => updateItem(item.id, "description", e.target.value || null)}
                           placeholder="Description de l'activité..."
                           className={`h-20 resize-none text-sm w-full ${INPUT_STYLES}`}
                         />
                       </div>

                       {/* Day selector (if multi-day) */}
                       {scheduleDays.length > 1 && (
                         <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                           <div className="col-span-1 md:col-span-6 space-y-1">
                             <Label className="text-sm font-medium text-foreground/80">
                               Jour
                             </Label>
                             <Select
                               value={item.day_date || ""}
                               onValueChange={(v) => updateItem(item.id, "day_date", v || null)}
                             >
                               <SelectTrigger className={`h-10 text-sm w-full ${SELECT_STYLES}`}>
                                 <SelectValue placeholder="Sélectionner" />
                               </SelectTrigger>
                               <SelectContent className="bg-white dark:bg-white">
                                 {scheduleDays.map((day) => (
                                   <SelectItem key={day.date} value={day.date}>
                                     {day.date}
                                   </SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                           </div>
                         </div>
                       )}
                      </div>
                     )}
                    </div>

                    {/* Delete Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Button */}
      <motion.div
        layout
        className="w-full"
      >
        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          className="w-full border-dashed border-sakura/30 text-sakura hover:bg-sakura/10 hover:border-sakura gap-2 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Ajouter une activité
        </Button>
      </motion.div>

      {/* Empty State */}
      <AnimatePresence>
        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center py-8 text-muted-foreground"
          >
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune activité dans le programme</p>
            <p className="text-xs mt-1">Cliquez sur "Ajouter une activité" pour commencer</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={cropState.open}
        imageSrc={cropState.imageSrc}
        onClose={() => setCropState({ open: false, imageSrc: '', itemId: null })}
        onCropComplete={onCropConfirmed}
      />
    </div>
  );
};

// Memoized component to prevent unnecessary re-renders
const EventProgramForm = memo(EventProgramFormComponent);

export default EventProgramForm;
