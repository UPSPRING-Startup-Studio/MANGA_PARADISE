import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Clock,
  Lightbulb,
  Drama,
  Timer,
  Loader2,
  Save,
  Calendar as CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Common input styles
const INPUT_STYLES = "bg-white text-[#1a1a1a] placeholder:text-mp-ink-muted border-slate-300 focus:border-sakura focus:ring-sakura/20";

// ── Contest Config Types ──────────────────────────────────────────────
export interface FormatConfig {
  enabled: boolean;
  max_duration_sec: number;
  max_participants?: number;
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

// Format labels
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

interface ContestConfigModalProps {
  activityId: string;
  currentConfig?: ContestConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContestConfigModal = ({
  activityId,
  currentConfig,
  open,
  onOpenChange,
}: ContestConfigModalProps) => {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<ContestConfig>(
    currentConfig || DEFAULT_CONTEST_CONFIG
  );
  const [isSaving, setIsSaving] = useState(false);

  const updateField = <K extends keyof ContestConfig>(
    field: K,
    value: ContestConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const updateFormat = (
    formatKey: string,
    field: keyof FormatConfig,
    value: boolean | number
  ) => {
    const updatedFormats = {
      ...config.allowed_formats,
      [formatKey]: {
        ...config.allowed_formats[formatKey],
        [field]: value,
      },
    };
    setConfig((prev) => ({ ...prev, allowed_formats: updatedFormats }));
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("event_schedule" as any)
        .update({ contest_config: config })
        .eq("id", activityId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalider tous les caches liés aux données du programme
      queryClient.invalidateQueries({ queryKey: ["contest-activities"] });
      queryClient.invalidateQueries({ queryKey: ["event-program"] });
      queryClient.invalidateQueries({ queryKey: ["event-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["contest-config"] });
      // Invalider les caches de la page admin pour forcer le re-téléchargement
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", activityId] });
      toast.success("Configuration du concours mise à jour et synchronisée !");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error saving config:", error);
      toast.error("Erreur lors de la sauvegarde");
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-950 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display flex items-center gap-2">
            <Drama className="w-6 h-6 text-sakura" />
            Configuration du Concours
          </DialogTitle>
          <DialogDescription>
            Modifiez les paramètres du concours cosplay (horaires, formats autorisés, options scéniques)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* A. Chronométrie & Logistique */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Timer className="w-5 h-5 text-[hsl(var(--mp-primary))]" />
              <h3 className="font-bold text-base">Chronométrie & Logistique</h3>
            </div>

            {/* Pré-judging Time */}
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
                const format = config.allowed_formats[key] || {
                  enabled: false,
                  max_duration_sec: 90,
                };
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
                        onCheckedChange={(checked) =>
                          updateFormat(key, "enabled", !!checked)
                        }
                        className="data-[state=checked]:bg-sakura data-[state=checked]:border-sakura"
                      />
                      <span className="text-lg">{emoji}</span>
                      <span className="font-medium text-sm">{label}</span>
                    </div>

                    {/* Duration Input */}
                    {format.enabled && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">
                          Durée max :
                        </Label>
                        <Input
                          type="number"
                          min={10}
                          max={600}
                          value={format.max_duration_sec}
                          onChange={(e) =>
                            updateFormat(
                              key,
                              "max_duration_sec",
                              parseInt(e.target.value) || 90
                            )
                          }
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
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">
                          Max participants :
                        </Label>
                        <Input
                          type="number"
                          min={5}
                          max={30}
                          value={format.max_participants || 12}
                          onChange={(e) =>
                            updateFormat(
                              key,
                              "max_participants",
                              parseInt(e.target.value) || 12
                            )
                          }
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

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-sakura hover:bg-sakura/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
