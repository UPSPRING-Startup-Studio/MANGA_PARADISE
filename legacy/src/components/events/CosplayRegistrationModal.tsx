import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight, ChevronLeft, User, Users, Sparkles,
  BookOpen, Gamepad2, HelpCircle, Check, Loader2,
  Shirt, PenLine, AlertTriangle, Music, Lightbulb,
  Box, FileSignature, Shield, Swords, Upload, X, Film, Link2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useCosplayVestiaire } from "@/hooks/useCosplayVestiaire";
import { useContestRegistration } from "@/hooks/useContestRegistration";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────
type FormatKey = "solo" | "duo" | "trio" | "quatuor" | "group";
type Universe = "manga" | "jeu_video" | "comics" | "autre";
type MediaType = "audio" | "video" | "link";

/** Shape of the contest_config JSONB from event_schedule */
export interface ContestConfig {
  prejudging_time: string;
  stage_dimensions: string;
  dressing_info: string;
  allow_lights: boolean;
  allow_props: boolean;
  allowed_formats: Record<
    FormatKey,
    { enabled: boolean; max_duration_sec: number; max_participants?: number }
  >;
}

/** Default fallback config */
const DEFAULT_CONFIG: ContestConfig = {
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
};

interface CosplayRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityId: string;
  eventId: string;
  activityTitle?: string;
  contestConfig?: ContestConfig | null;
}

interface FormData {
  // Step 1 – Format & Identity
  format: FormatKey | null;
  groupName: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianConsent: boolean;
  // Step 2 – Character
  costumeId: string | null;
  characterName: string;
  universe: Universe | null;
  // Step 3 – Technical & Stage
  mediaType: MediaType;
  mediaFile: File | null; // For audio or video upload
  mediaLink: string; // For external YouTube/Vimeo links
  wantsLighting: boolean;
  lightingDetails: string;
  wantsProps: boolean;
  propsDetails: string;
  // Step 4 – Validation
  acceptPrejudging: boolean;
  acceptRules: boolean;
  signature: string;
}

const INITIAL_FORM: FormData = {
  format: null,
  groupName: "",
  guardianName: "",
  guardianPhone: "",
  guardianEmail: "",
  guardianConsent: false,
  costumeId: null,
  characterName: "",
  universe: null,
  mediaType: "audio",
  mediaFile: null,
  mediaLink: "",
  wantsLighting: false,
  lightingDetails: "",
  wantsProps: false,
  propsDetails: "",
  acceptPrejudging: false,
  acceptRules: false,
  signature: "",
};

// ─── Format Labels ───────────────────────────────────────
const FORMAT_LABELS: Record<FormatKey, { label: string; icon: React.ElementType; color: string }> = {
  solo: { label: "Solo", icon: User, color: "from-[hsl(var(--mp-primary))] to-pink-600" },
  duo: { label: "Duo", icon: Users, color: "from-purple-500 to-violet-600" },
  trio: { label: "Trio", icon: Users, color: "from-blue-500 to-cyan-600" },
  quatuor: { label: "Quatuor", icon: Users, color: "from-amber-500 to-orange-600" },
  group: { label: "Groupe", icon: Users, color: "from-green-500 to-emerald-600" },
};

// ─── Universe Options ────────────────────────────────────
const UNIVERSE_OPTIONS: { value: Universe; label: string; icon: React.ElementType; color: string }[] = [
  { value: "manga", label: "Manga / Anime", icon: BookOpen, color: "from-[hsl(var(--mp-primary))] to-pink-600" },
  { value: "jeu_video", label: "Jeu Vidéo", icon: Gamepad2, color: "from-purple-500 to-violet-600" },
  { value: "comics", label: "Comics / Western", icon: Swords, color: "from-blue-500 to-cyan-600" },
  { value: "autre", label: "Autre / Original", icon: HelpCircle, color: "from-amber-500 to-orange-600" },
];

// ─── Helpers ─────────────────────────────────────────────
function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}min${s.toString().padStart(2, "0")}` : `${m}min`;
}

function mapUniverseToType(universe: string): Universe | null {
  const lower = universe.toLowerCase();
  if (lower.includes("manga") || lower.includes("anime")) return "manga";
  if (lower.includes("jeu") || lower.includes("game") || lower.includes("vidéo")) return "jeu_video";
  if (lower.includes("comic") || lower.includes("western") || lower.includes("marvel") || lower.includes("dc")) return "comics";
  if (lower.includes("autre") || lower.includes("original")) return "autre";
  return null;
}

function isMinorFromBirthDate(birthDate: string | null | undefined): boolean {
  if (!birthDate) return false;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age < 18;
}

// ─── Step Indicator ──────────────────────────────────────
const STEP_LABELS = ["Format", "Personnage", "Technique", "Validation"];

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center mb-4">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center gap-1">
            <motion.div
              animate={{
                scale: i + 1 === currentStep ? 1.15 : 1,
                backgroundColor: i + 1 <= currentStep ? "hsl(var(--mp-primary))" : "rgba(255,255,255,0.1)",
              }}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                i + 1 <= currentStep ? "text-white" : "text-muted-foreground"
              )}
            >
              {i + 1 < currentStep ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </motion.div>
            <span className={cn(
              "text-[9px] font-medium",
              i + 1 === currentStep ? "text-[hsl(var(--mp-primary))]" : i + 1 < currentStep ? "text-[hsl(var(--mp-primary))]/60" : "text-muted-foreground"
            )}>
              {STEP_LABELS[i]}
            </span>
          </div>
          {i < totalSteps - 1 && (
            <div className={cn(
              "w-6 h-0.5 rounded-full transition-colors mb-4",
              i + 1 < currentStep ? "bg-[hsl(var(--mp-primary))]" : "bg-white/10"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Permanent Header Warning ────────────────────────────
function ContestWarningHeader({ config }: { config: ContestConfig }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm p-3 space-y-1.5"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-xs font-semibold text-amber-300">
          ⚠️ Présence impérative au pré-judging à {config.prejudging_time}
        </p>
      </div>
      {config.stage_dimensions && (
        <p className="text-[11px] text-amber-200/70 pl-6">
          🎭 Scène : {config.stage_dimensions}
        </p>
      )}
      {config.dressing_info && (
        <p className="text-[11px] text-amber-200/70 pl-6">
          👗 Loge : {config.dressing_info}
        </p>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function CosplayRegistrationModal({
  open,
  onOpenChange,
  activityId,
  eventId,
  activityTitle = "Concours Cosplay",
  contestConfig,
}: CosplayRegistrationModalProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data: costumes, isLoading: costumesLoading } = useCosplayVestiaire(user?.id);
  const { data: existingRegistration, isLoading: registrationLoading } = useContestRegistration(activityId);
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Merge provided config with defaults
  const config: ContestConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...contestConfig,
    allowed_formats: {
      ...DEFAULT_CONFIG.allowed_formats,
      ...(contestConfig?.allowed_formats || {}),
    },
  }), [contestConfig]);

  // Detect minor status from profile birth_date
  const isMinor = useMemo(() => isMinorFromBirthDate(profile?.birth_date), [profile?.birth_date]);

  // Get enabled formats
  const enabledFormats = useMemo(() => {
    return (Object.entries(config.allowed_formats) as [FormatKey, { enabled: boolean; max_duration_sec: number }][])
      .filter(([, v]) => v.enabled);
  }, [config.allowed_formats]);

  // Selected format duration
  const selectedFormatDuration = useMemo(() => {
    if (!form.format) return 0;
    return config.allowed_formats[form.format]?.max_duration_sec || 0;
  }, [form.format, config.allowed_formats]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setForm(INITIAL_FORM);
    }
  }, [open]);

  // ─── Validation per step ───────────────────────────────
  const isStep1Valid = useMemo(() => {
    if (!form.format) return false;
    if (form.format !== "solo" && !form.groupName.trim()) return false;
    if (isMinor && (!form.guardianName.trim() || !form.guardianPhone.trim() || !form.guardianEmail.trim() || !form.guardianConsent)) return false;
    return true;
  }, [form.format, form.groupName, isMinor, form.guardianName, form.guardianPhone, form.guardianEmail, form.guardianConsent]);

  const isStep2Valid = useMemo(() => {
    return form.characterName.trim().length > 0 && form.universe !== null;
  }, [form.characterName, form.universe]);

  const isStep3Valid = true; // Audio/lighting/props are optional

  const isStep4Valid = useMemo(() => {
    return form.acceptPrejudging && form.acceptRules && form.signature.trim().length >= 2;
  }, [form.acceptPrejudging, form.acceptRules, form.signature]);

  const stepValidation = [isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid];

  // ─── Costume Selection ─────────────────────────────────
  const handleSelectCostume = (costume: { id: string; character_name: string; universe: string }) => {
    const mappedUniverse = mapUniverseToType(costume.universe);
    setForm((f) => ({
      ...f,
      costumeId: costume.id,
      characterName: costume.character_name,
      universe: mappedUniverse,
    }));
  };

  const handleDeselectCostume = () => {
    setForm((f) => ({ ...f, costumeId: null, characterName: "", universe: null }));
  };

  // ─── Media File Selection ──────────────────────────────
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type based on mediaType
    const isAudio = form.mediaType === "audio";
    const isVideo = form.mediaType === "video";
    
    const validAudioTypes = ["audio/mpeg", "audio/mp3", "audio/mp4"];
    const validVideoTypes = ["video/mp4", "video/quicktime"];
    
    if (isAudio && !validAudioTypes.includes(file.type)) {
      toast.error("Format audio non supporté", { description: "Seuls les fichiers MP3 sont acceptés." });
      return;
    }
    
    if (isVideo && !validVideoTypes.includes(file.type)) {
      toast.error("Format vidéo non supporté", { description: "Seuls les fichiers MP4 sont acceptés." });
      return;
    }
    
    // Max 50MB for video, 20MB for audio
    const maxSize = isVideo ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Fichier trop volumineux", {
        description: `Maximum ${isVideo ? '50' : '20'} Mo.`
      });
      return;
    }
    
    setForm((f) => ({ ...f, mediaFile: file }));
  };

  // ─── Navigation ────────────────────────────────────────
  const goNext = () => {
    if (step < 4 && stepValidation[step - 1]) setStep(step + 1);
  };
  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // ─── Upload media to Supabase Storage ──────────────────
  const uploadMediaFile = async (): Promise<string | null> => {
    if (!form.mediaFile || !user) return null;
    setMediaUploading(true);
    try {
      const ext = form.mediaFile.name.split(".").pop() || (form.mediaType === "video" ? "mp4" : "mp3");
      const folder = form.mediaType === "video" ? "contest-video" : "contest-audio";
      const filePath = `${folder}/${user.id}/${activityId}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("contest-files")
        .upload(filePath, form.mediaFile, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("contest-files").getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (err: any) {
      console.error("Media upload error:", err);
      toast.error("Erreur upload média", { description: err?.message });
      return null;
    } finally {
      setMediaUploading(false);
    }
  };

  // ─── Submit ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user || !isStep1Valid || !isStep2Valid || !isStep4Valid) return;

    setIsSubmitting(true);
    try {
      // Upload media file if present
      let mediaUrl: string | null = null;
      if (form.mediaFile) {
        mediaUrl = await uploadMediaFile();
      }

      // Build lighting needs JSON
      const lightingNeeds = form.wantsLighting
        ? { enabled: true, details: form.lightingDetails }
        : { enabled: false };

      // Insert into contest_registrations
      const { error } = await supabase.from("contest_registrations" as any).insert({
        event_id: eventId,
        activity_id: activityId,
        user_id: user.id,
        character_name: form.characterName.trim(),
        universe: form.universe,
        format: form.format,
        group_name: form.format !== "solo" ? form.groupName.trim() : null,
        media_type: form.mediaType,
        audio_file_url: mediaUrl, // Reused for both audio and video
        media_link: form.mediaType === "link" ? form.mediaLink.trim() : null,
        lighting_needs: lightingNeeds,
        props_needs: form.wantsProps ? form.propsDetails.trim() : null,
        is_minor: isMinor,
        guardian_name: isMinor ? form.guardianName.trim() : null,
        guardian_consent: isMinor ? form.guardianConsent : null,
        status: "pending",
      } as any);

       if (error) throw error;

        // Invalidate all related queries to ensure unified agenda is updated
        // This ensures the event appears in the user's agenda regardless of contest status
        queryClient.invalidateQueries({ queryKey: ["unified-agenda", user.id] });
        queryClient.invalidateQueries({ queryKey: ["contest-registrations"] });
        queryClient.invalidateQueries({ queryKey: ["contest-registration", activityId, user.id] });
        // CRITICAL: Invalidate user-contest-registrations to trigger immediate UI update in EventScheduleTimeline
        queryClient.invalidateQueries({ queryKey: ["user-contest-registrations", user.id] });
        queryClient.invalidateQueries({ queryKey: ["approved-contestants"] });
        queryClient.invalidateQueries({ queryKey: ["event-schedule"] });
        queryClient.invalidateQueries({ queryKey: ["activity-participation"] });
        queryClient.invalidateQueries({ queryKey: ["allApprovedContestants"] });

       toast.success("🎉 Inscription envoyée !", {
         description: "Tu recevras une confirmation par notification.",
       });
       onOpenChange(false);
    } catch (err: any) {
      console.error("Registration error:", err);
      toast.error("Erreur lors de l'inscription", {
        description: err?.message || "Réessaie plus tard.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasCostumes = costumes && costumes.length > 0;

  // ─── Step animation variants ───────────────────────────
  const stepVariants = {
    enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 30 : -30 }),
    center: { opacity: 1, x: 0 },
    exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -30 : 30 }),
  };
  const [direction, setDirection] = useState(1);

  const navigateStep = (target: number) => {
    setDirection(target > step ? 1 : -1);
    setStep(target);
  };

  const handleNext = () => { setDirection(1); goNext(); };
  const handleBack = () => { setDirection(-1); goBack(); };

  // ─── Security Barrier: Block if registration already exists ────
  const hasExistingRegistration = existingRegistration !== null;

  // ─── Render ────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-950 border-white/10 text-white overflow-hidden max-h-[90vh] flex flex-col p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-2 space-y-3">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[hsl(var(--mp-saffron))]" />
              Inscription — {activityTitle}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm sr-only">
              Wizard d'inscription au concours cosplay en 4 étapes
            </DialogDescription>
          </DialogHeader>

          {/* Permanent Warning Header */}
          <ContestWarningHeader config={config} />

          {/* Step Indicator */}
          <StepIndicator currentStep={step} totalSteps={4} />
        </div>

        {/* Security Barrier: Show error if registration exists */}
        {hasExistingRegistration ? (
          <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-300">
                    🚫 Candidature déjà enregistrée
                  </h3>
                  <p className="text-sm text-red-200/70 mt-1">
                    Vous avez déjà un dossier en cours pour ce concours
                  </p>
                </div>
              </div>
              
              <div className="bg-mp-paper/50 rounded-lg p-4 space-y-2">
                <p className="text-xs text-slate-300">
                  <span className="font-semibold">Statut actuel :</span>{" "}
                  <span className={cn(
                    "font-bold",
                    existingRegistration?.status === "pending" && "text-amber-400",
                    existingRegistration?.status === "approved" && "text-green-400",
                    existingRegistration?.status === "rejected" && "text-red-400",
                    existingRegistration?.status === "waitlist" && "text-blue-400"
                  )}>
                    {existingRegistration?.status === "pending" && "⏳ En examen"}
                    {existingRegistration?.status === "approved" && "✅ Approuvé"}
                    {existingRegistration?.status === "rejected" && "❌ Refusé"}
                    {existingRegistration?.status === "waitlist" && "ℹ️ Liste d'attente"}
                  </span>
                </p>
                <p className="text-xs text-mp-ink-muted">
                  Une seule candidature par utilisateur et par concours est autorisée.
                </p>
              </div>

              <Button
                onClick={() => onOpenChange(false)}
                className="w-full bg-mp-cloud hover:bg-slate-600 text-white"
              >
                Fermer
              </Button>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Steps Content */}
            <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-2">
              <AnimatePresence mode="wait" custom={direction}>
            {/* ═══════════════════════════════════════════════
                STEP 1 — Format & Identity
            ═══════════════════════════════════════════════ */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Format Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-[hsl(var(--mp-primary))]" />
                    Format de participation
                  </Label>

                  {enabledFormats.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      Aucun format n'est activé pour ce concours.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {enabledFormats.map(([key, val]) => {
                        const fmtInfo = FORMAT_LABELS[key];
                        const Icon = fmtInfo.icon;
                        const isSelected = form.format === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, format: key, groupName: key === "solo" ? "" : f.groupName }))}
                            className={cn(
                              "flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all duration-200 text-left",
                              isSelected
                                ? "ring-2 ring-[hsl(var(--mp-primary))] border-[hsl(var(--mp-primary))] bg-[hsl(var(--mp-primary))]/10 shadow-[0_0_15px_rgba(255,0,127,0.3)]"
                                : "border-white/10 bg-white/5 hover:border-white/20"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
                              isSelected ? fmtInfo.color : "from-white/10 to-white/5"
                            )}>
                              <Icon className={cn("w-4 h-4", isSelected ? "text-white" : "text-muted-foreground")} />
                            </div>
                            <div>
                              <p className={cn("text-sm font-medium", isSelected ? "text-white" : "text-muted-foreground")}>
                                {fmtInfo.label}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Max {formatDuration(val.max_duration_sec)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Group Name (conditional) */}
                <AnimatePresence>
                  {form.format && form.format !== "solo" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <Label className="text-sm font-medium text-white">Nom du groupe</Label>
                      <Input
                        value={form.groupName}
                        onChange={(e) => setForm((f) => ({ ...f, groupName: e.target.value }))}
                        placeholder="Ex: Les Mugiwara"
                        className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-[hsl(var(--mp-info))] focus:ring-[hsl(var(--mp-info))]/20"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Minor Authorization Block */}
                {isMinor && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <p className="text-sm font-semibold text-amber-300">
                        Autorisation Parentale Obligatoire
                      </p>
                    </div>
                    <p className="text-[11px] text-amber-200/70">
                      Tu es mineur(e). Un tuteur légal doit autoriser ta participation.
                    </p>

                    <div className="space-y-2">
                      <Label className="text-xs text-amber-200">Nom complet du tuteur</Label>
                      <Input
                        value={form.guardianName}
                        onChange={(e) => setForm((f) => ({ ...f, guardianName: e.target.value }))}
                        placeholder="Prénom Nom"
                        className="bg-black/30 border-amber-500/20 text-white placeholder:text-muted-foreground focus:border-amber-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-amber-200">Téléphone</Label>
                        <Input
                          value={form.guardianPhone}
                          onChange={(e) => setForm((f) => ({ ...f, guardianPhone: e.target.value }))}
                          placeholder="06 XX XX XX XX"
                          className="bg-black/30 border-amber-500/20 text-white placeholder:text-muted-foreground focus:border-amber-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-amber-200">Email</Label>
                        <Input
                          type="email"
                          value={form.guardianEmail}
                          onChange={(e) => setForm((f) => ({ ...f, guardianEmail: e.target.value }))}
                          placeholder="tuteur@email.com"
                          className="bg-black/30 border-amber-500/20 text-white placeholder:text-muted-foreground focus:border-amber-400"
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-2 pt-1">
                      <Checkbox
                        id="guardian-consent"
                        checked={form.guardianConsent}
                        onCheckedChange={(checked) => setForm((f) => ({ ...f, guardianConsent: !!checked }))}
                        className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 mt-0.5"
                      />
                      <label htmlFor="guardian-consent" className="text-[11px] text-amber-200/80 leading-tight cursor-pointer">
                        Je certifie que mon tuteur légal autorise ma participation à ce concours cosplay.
                      </label>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════
                STEP 2 — Character Selection
            ═══════════════════════════════════════════════ */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Section A: From Vestiaire */}
                {hasCostumes && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shirt className="w-4 h-4 text-[hsl(var(--mp-primary))]" />
                      <Label className="text-sm font-medium text-white">
                        Depuis mon Vestiaire
                      </Label>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-white/10">
                      {costumesLoading ? (
                        [...Array(3)].map((_, i) => (
                          <div key={i} className="w-28 h-36 rounded-xl bg-muted/50 animate-pulse flex-shrink-0" />
                        ))
                      ) : (
                        costumes?.map((costume) => {
                          const isSelected = form.costumeId === costume.id;
                          return (
                            <button
                              key={costume.id}
                              type="button"
                              onClick={() => isSelected ? handleDeselectCostume() : handleSelectCostume(costume)}
                              className={cn(
                                "relative w-28 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200",
                                "focus:outline-none focus-visible:outline-none",
                                isSelected
                                  ? "ring-2 ring-[hsl(var(--mp-primary))] border-[hsl(var(--mp-primary))] shadow-[0_0_20px_rgba(255,0,127,0.4)] scale-[1.02]"
                                  : "border-white/10 hover:border-white/30"
                              )}
                            >
                              <div className="w-full h-28 bg-muted">
                                {costume.user_image_url ? (
                                  <img src={costume.user_image_url} alt={costume.character_name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-[hsl(var(--mp-primary))]/20 to-[hsl(var(--mp-info))]/20">
                                    🎭
                                  </div>
                                )}
                              </div>
                              <div className={cn("px-2 py-1.5 text-center", isSelected ? "bg-[hsl(var(--mp-primary))]/20" : "bg-white/5")}>
                                <p className="text-[11px] font-medium text-white truncate">{costume.character_name}</p>
                                <p className="text-[9px] text-muted-foreground truncate">{costume.universe}</p>
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[hsl(var(--mp-primary))] flex items-center justify-center"
                                >
                                  <Check className="w-3 h-3 text-white" />
                                </motion.div>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Divider */}
                {hasCostumes && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-muted-foreground">ou</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                )}

                {/* Section B: Manual input */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <PenLine className="w-4 h-4 text-[hsl(var(--mp-info))]" />
                    <Label className="text-sm font-medium text-white">
                      {hasCostumes ? "Ou saisir manuellement" : "Ton personnage"}
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Nom du personnage</Label>
                    <Input
                      value={form.characterName}
                      onChange={(e) => setForm((f) => ({ ...f, characterName: e.target.value, costumeId: null }))}
                      placeholder="Ex: Monkey D. Luffy"
                      className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-[hsl(var(--mp-primary))] focus:ring-[hsl(var(--mp-primary))]/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Univers</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {UNIVERSE_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isSelected = form.universe === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, universe: option.value, costumeId: null }))}
                            className={cn(
                              "flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all duration-200 text-left",
                              isSelected
                                ? "ring-2 ring-[hsl(var(--mp-primary))] border-[hsl(var(--mp-primary))] bg-[hsl(var(--mp-primary))]/10 shadow-[0_0_12px_rgba(255,0,127,0.2)]"
                                : "border-white/10 bg-white/5 hover:border-white/20"
                            )}
                          >
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br",
                              isSelected ? option.color : "from-white/10 to-white/5"
                            )}>
                              <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-white" : "text-muted-foreground")} />
                            </div>
                            <span className={cn("text-xs font-medium", isSelected ? "text-white" : "text-muted-foreground")}>
                              {option.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Selection summary */}
                {form.characterName && form.universe && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 rounded-lg p-3 border border-[hsl(var(--mp-primary))]/20"
                  >
                    <p className="text-xs text-muted-foreground mb-1">Personnage sélectionné</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs border-[hsl(var(--mp-info))]/30 text-[hsl(var(--mp-info))]">
                        {form.characterName}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-[hsl(var(--mp-saffron))]/30 text-[hsl(var(--mp-saffron))]">
                        {UNIVERSE_OPTIONS.find((u) => u.value === form.universe)?.label}
                      </Badge>
                      {form.costumeId && (
                        <Badge variant="outline" className="text-xs border-[hsl(var(--mp-primary))]/30 text-[hsl(var(--mp-primary))]">
                          <Shirt className="w-3 h-3 mr-1" /> Vestiaire
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════
                STEP 3 — Technical & Stage
            ═══════════════════════════════════════════════ */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Media Type Selector & Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-[hsl(var(--mp-info))]" />
                    <Label className="text-sm font-medium text-white">Bande son / Support Média</Label>
                  </div>
                  
                  <p className="text-[11px] text-muted-foreground">
                    Durée max autorisée : <span className="text-[hsl(var(--mp-info))] font-semibold">{formatDuration(selectedFormatDuration)}</span>
                  </p>

                  {/* Media Type Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, mediaType: "audio", mediaFile: null, mediaLink: "" }))}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                        form.mediaType === "audio"
                          ? "border-[hsl(var(--mp-info))] bg-[hsl(var(--mp-info))]/10 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                    >
                      <Music className={cn("w-5 h-5", form.mediaType === "audio" ? "text-[hsl(var(--mp-info))]" : "text-muted-foreground")} />
                      <span className={cn("text-xs font-medium", form.mediaType === "audio" ? "text-[hsl(var(--mp-info))]" : "text-muted-foreground")}>
                        Audio MP3
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, mediaType: "video", mediaFile: null, mediaLink: "" }))}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                        form.mediaType === "video"
                          ? "border-[hsl(var(--mp-primary))] bg-[hsl(var(--mp-primary))]/10 shadow-[0_0_15px_rgba(255,0,127,0.3)]"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                    >
                      <Film className={cn("w-5 h-5", form.mediaType === "video" ? "text-[hsl(var(--mp-primary))]" : "text-muted-foreground")} />
                      <span className={cn("text-xs font-medium", form.mediaType === "video" ? "text-[hsl(var(--mp-primary))]" : "text-muted-foreground")}>
                        Vidéo MP4
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, mediaType: "link", mediaFile: null, mediaLink: "" }))}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                        form.mediaType === "link"
                          ? "border-[hsl(var(--mp-saffron))] bg-[hsl(var(--mp-saffron))]/10 shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                    >
                      <Link2 className={cn("w-5 h-5", form.mediaType === "link" ? "text-[hsl(var(--mp-saffron))]" : "text-muted-foreground")} />
                      <span className={cn("text-xs font-medium", form.mediaType === "link" ? "text-[hsl(var(--mp-saffron))]" : "text-muted-foreground")}>
                        Lien Externe
                      </span>
                    </button>
                  </div>

                  {/* File Upload (Audio or Video) */}
                  {(form.mediaType === "audio" || form.mediaType === "video") && (
                    <>
                      <input
                        ref={mediaInputRef}
                        type="file"
                        accept={form.mediaType === "audio" ? ".mp3,audio/mpeg,audio/mp3" : ".mp4,video/mp4"}
                        onChange={handleMediaSelect}
                        className="hidden"
                      />

                      {form.mediaFile ? (
                        <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-[hsl(var(--mp-info))]/20">
                          {form.mediaType === "audio" ? (
                            <Music className="w-5 h-5 text-[hsl(var(--mp-info))] flex-shrink-0" />
                          ) : (
                            <Film className="w-5 h-5 text-[hsl(var(--mp-primary))] flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{form.mediaFile.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {(form.mediaFile.size / (1024 * 1024)).toFixed(1)} Mo
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, mediaFile: null }))}
                            className="p-1 rounded-full hover:bg-white/10 transition-colors"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => mediaInputRef.current?.click()}
                          className="w-full border-dashed border-white/20 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choisir un fichier {form.mediaType === "audio" ? "audio" : "vidéo"}
                        </Button>
                      )}
                    </>
                  )}

                  {/* External Link Input */}
                  {form.mediaType === "link" && (
                    <div className="space-y-2">
                      <Input
                        value={form.mediaLink}
                        onChange={(e) => setForm((f) => ({ ...f, mediaLink: e.target.value }))}
                        placeholder="Ex: https://youtube.com/watch?v=..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-[hsl(var(--mp-saffron))] focus:ring-[hsl(var(--mp-saffron))]/20"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        💡 Lien YouTube (Non répertorié) ou Vimeo. Assurez-vous que le lien est accessible.
                      </p>
                    </div>
                  )}
                </div>

                {/* Lighting */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-[hsl(var(--mp-saffron))]" />
                      <Label className="text-sm font-medium text-white">Éclairage personnalisé</Label>
                    </div>
                    <Switch
                      checked={config.allow_lights ? form.wantsLighting : false}
                      onCheckedChange={(checked) => setForm((f) => ({ ...f, wantsLighting: checked }))}
                      disabled={!config.allow_lights}
                      className="data-[state=checked]:bg-[hsl(var(--mp-saffron))]"
                    />
                  </div>
                  {!config.allow_lights ? (
                    <p className="text-[11px] text-muted-foreground italic pl-6">
                      🚫 Option non disponible pour ce concours
                    </p>
                  ) : (
                    <AnimatePresence>
                      {form.wantsLighting && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <Input
                            value={form.lightingDetails}
                            onChange={(e) => setForm((f) => ({ ...f, lightingDetails: e.target.value }))}
                            placeholder="Ex: Lumière bleue froide, ambiance nuit..."
                            className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-[hsl(var(--mp-saffron))] focus:ring-[hsl(var(--mp-saffron))]/20"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>

                {/* Props / Décors */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-[hsl(var(--mp-primary))]" />
                      <Label className="text-sm font-medium text-white">Décors / Accessoires scène</Label>
                    </div>
                    <Switch
                      checked={config.allow_props ? form.wantsProps : false}
                      onCheckedChange={(checked) => setForm((f) => ({ ...f, wantsProps: checked }))}
                      disabled={!config.allow_props}
                      className="data-[state=checked]:bg-[hsl(var(--mp-primary))]"
                    />
                  </div>
                  {!config.allow_props ? (
                    <p className="text-[11px] text-muted-foreground italic pl-6">
                      🚫 Option non disponible pour ce concours
                    </p>
                  ) : (
                    <AnimatePresence>
                      {form.wantsProps && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <Textarea
                            value={form.propsDetails}
                            onChange={(e) => setForm((f) => ({ ...f, propsDetails: e.target.value }))}
                            placeholder="Décris les éléments que tu souhaites apporter sur scène..."
                            rows={3}
                            className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-[hsl(var(--mp-primary))] focus:ring-[hsl(var(--mp-primary))]/20 resize-none"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════
                STEP 4 — Validation & Signature
            ═══════════════════════════════════════════════ */}
            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Summary */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-[hsl(var(--mp-saffron))]" />
                    Récapitulatif
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-black/30 rounded-lg p-2">
                      <p className="text-muted-foreground">Format</p>
                      <p className="text-white font-medium">{form.format ? FORMAT_LABELS[form.format].label : "—"}</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2">
                      <p className="text-muted-foreground">Personnage</p>
                      <p className="text-white font-medium truncate">{form.characterName || "—"}</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2">
                      <p className="text-muted-foreground">Univers</p>
                      <p className="text-white font-medium">
                        {form.universe ? UNIVERSE_OPTIONS.find((u) => u.value === form.universe)?.label : "—"}
                      </p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2">
                      <p className="text-muted-foreground">Média</p>
                      <p className="text-white font-medium truncate">
                        {form.mediaType === "link"
                          ? (form.mediaLink ? "Lien externe" : "Aucun")
                          : (form.mediaFile ? form.mediaFile.name : "Aucun")
                        }
                      </p>
                    </div>
                    {form.format !== "solo" && form.groupName && (
                      <div className="bg-black/30 rounded-lg p-2 col-span-2">
                        <p className="text-muted-foreground">Groupe</p>
                        <p className="text-white font-medium">{form.groupName}</p>
                      </div>
                    )}
                    {form.wantsLighting && (
                      <div className="bg-black/30 rounded-lg p-2 col-span-2">
                        <p className="text-muted-foreground">Éclairage</p>
                        <p className="text-white font-medium">{form.lightingDetails || "Demandé"}</p>
                      </div>
                    )}
                    {form.wantsProps && (
                      <div className="bg-black/30 rounded-lg p-2 col-span-2">
                        <p className="text-muted-foreground">Décors</p>
                        <p className="text-white font-medium">{form.propsDetails || "Demandé"}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Engagement Checkboxes */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <Checkbox
                      id="accept-prejudging"
                      checked={form.acceptPrejudging}
                      onCheckedChange={(checked) => setForm((f) => ({ ...f, acceptPrejudging: !!checked }))}
                      className="border-[hsl(var(--mp-primary))]/50 data-[state=checked]:bg-[hsl(var(--mp-primary))] data-[state=checked]:border-[hsl(var(--mp-primary))] mt-0.5"
                    />
                    <label htmlFor="accept-prejudging" className="text-xs text-white/80 leading-tight cursor-pointer">
                      Je serai présent(e) au <span className="text-[hsl(var(--mp-primary))] font-semibold">pré-judging à {config.prejudging_time}</span>.
                      Mon absence entraînera ma disqualification.
                    </label>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <Checkbox
                      id="accept-rules"
                      checked={form.acceptRules}
                      onCheckedChange={(checked) => setForm((f) => ({ ...f, acceptRules: !!checked }))}
                      className="border-[hsl(var(--mp-info))]/50 data-[state=checked]:bg-[hsl(var(--mp-info))] data-[state=checked]:border-[hsl(var(--mp-info))] mt-0.5"
                    />
                    <label htmlFor="accept-rules" className="text-xs text-white/80 leading-tight cursor-pointer">
                      J'accepte le <span className="text-[hsl(var(--mp-info))] font-semibold">règlement du concours</span> et le droit à l'image.
                    </label>
                  </div>
                </div>

                {/* Warning Alert - Final Submission */}
                <Alert className="border-orange-500/50 bg-orange-900/20">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <AlertDescription className="text-sm text-orange-200 ml-2">
                    <span className="font-bold">⚠️ Attention :</span> Une fois validée, cette candidature est <span className="font-semibold underline">définitive</span>.
                    Toute modification nécessitera de contacter l'organisation.
                  </AlertDescription>
                </Alert>

                {/* Signature */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-[hsl(var(--mp-saffron))]" />
                    Signature (Prénom Nom)
                  </Label>
                  <Input
                    value={form.signature}
                    onChange={(e) => setForm((f) => ({ ...f, signature: e.target.value }))}
                    placeholder="Tape ton prénom et nom pour signer"
                    className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-[hsl(var(--mp-saffron))] focus:ring-[hsl(var(--mp-saffron))]/20 font-serif italic text-lg"
                  />
                  {form.signature.trim().length > 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] text-[hsl(var(--mp-saffron))]/60"
                    >
                      ✍️ Signé électroniquement par : {form.signature}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          {step > 1 ? (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-muted-foreground hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Retour
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!stepValidation[step - 1]}
              className={cn(
                "bg-gradient-to-r from-[hsl(var(--mp-primary))] to-pink-600 text-white font-semibold",
                "hover:shadow-[0_0_20px_rgba(255,0,127,0.4)] transition-all",
                !stepValidation[step - 1] && "opacity-50 cursor-not-allowed"
              )}
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStep4Valid || isSubmitting || mediaUploading}
              className={cn(
                "bg-gradient-to-r from-[hsl(var(--mp-saffron))] to-amber-600 text-black font-bold",
                "hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all",
                (!isStep4Valid || isSubmitting || mediaUploading) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting || mediaUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mediaUploading ? "Upload média..." : "Envoi..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Confirmer l'inscription
                </>
              )}
            </Button>
          )}
        </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
