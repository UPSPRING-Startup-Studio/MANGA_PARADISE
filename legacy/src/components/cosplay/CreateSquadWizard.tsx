import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Camera,
  Trophy,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  Crown,
  Lock,
  Unlock,
  Sword,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCreateSquad,
  SquadMode,
  SlotRoleType,
  CreateSlotInput,
} from "@/hooks/useSquads";

// =====================================================
// TYPES
// =====================================================

interface WizardFormValues {
  mode: SquadMode;
  name: string;
  description: string;
  is_private: boolean;
  slots: {
    title: string;
    role_type: SlotRoleType;
    requirements: string;
  }[];
}

interface CreateSquadWizardProps {
  targetEventId: string;
  userId: string;
  cosplayName?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// =====================================================
// CONSTANTS: Mode definitions
// =====================================================

const SQUAD_MODES: {
  value: SquadMode;
  label: string;
  emoji: string;
  tagline: string;
  description: string;
  color: string;
  borderColor: string;
  glowColor: string;
  bgGradient: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "squad",
    label: "SQUAD",
    emoji: "🟢",
    tagline: "Social & Fun",
    description:
      "Groupe de cosplay décontracté. Venez comme vous êtes, l'ambiance prime sur la performance.",
    color: "#22c55e",
    borderColor: "border-green-500/50",
    glowColor: "shadow-[0_0_20px_rgba(34,197,94,0.3)]",
    bgGradient: "from-green-500/15 via-black/40 to-green-500/5",
    icon: <Users className="w-6 h-6" />,
  },
  {
    value: "shooting",
    label: "SHOOTING",
    emoji: "🔵",
    tagline: "Casting Photo / Vidéo",
    description:
      "Session photo ou vidéo organisée. Recherche de cosplayers pour un projet créatif.",
    color: "hsl(var(--mp-info))",
    borderColor: "border-[hsl(var(--mp-info))]/50",
    glowColor: "shadow-[0_0_20px_rgba(0,240,255,0.3)]",
    bgGradient: "from-[hsl(var(--mp-info))]/15 via-black/40 to-[hsl(var(--mp-info))]/5",
    icon: <Camera className="w-6 h-6" />,
  },
  {
    value: "concours",
    label: "CONCOURS",
    emoji: "🔴",
    tagline: "Objectif Podium",
    description:
      "Groupe orienté performance et scène. Costumes soignés, répétitions, objectif : gagner.",
    color: "hsl(var(--mp-primary))",
    borderColor: "border-[hsl(var(--mp-primary))]/50",
    glowColor: "shadow-[0_0_20px_rgba(255,0,127,0.3)]",
    bgGradient: "from-[hsl(var(--mp-primary))]/15 via-black/40 to-[hsl(var(--mp-primary))]/5",
    icon: <Trophy className="w-6 h-6" />,
  },
];

const ROLE_TYPE_OPTIONS: { value: SlotRoleType; label: string; icon: string }[] = [
  { value: "character", label: "Personnage", icon: "⚔️" },
  { value: "staff", label: "Staff technique", icon: "📸" },
  { value: "generic", label: "Libre", icon: "🎯" },
];

// =====================================================
// STEP INDICATOR
// =====================================================

const StepIndicator = ({
  currentStep,
  totalSteps,
  accentColor,
}: {
  currentStep: number;
  totalSteps: number;
  accentColor: string;
}) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {Array.from({ length: totalSteps }).map((_, i) => {
      const stepNum = i + 1;
      const isCompleted = stepNum < currentStep;
      const isActive = stepNum === currentStep;

      return (
        <div key={i} className="flex items-center gap-2">
          <motion.div
            animate={{
              scale: isActive ? 1.15 : 1,
              opacity: isCompleted || isActive ? 1 : 0.4,
            }}
            transition={{ duration: 0.2 }}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
              "border-2 transition-all duration-300",
              isCompleted
                ? "bg-white/20 border-white/40 text-white"
                : !isActive
                ? "bg-black/40 border-white/20 text-mp-ink-muted"
                : ""
            )}
            style={
              isActive
                ? {
                    borderColor: accentColor,
                    boxShadow: `0 0 12px ${accentColor}60`,
                    background: `${accentColor}20`,
                    color: accentColor,
                  }
                : {}
            }
          >
            {isCompleted ? "✓" : stepNum}
          </motion.div>
          {i < totalSteps - 1 && (
            <div
              className={cn(
                "w-8 h-0.5 rounded-full transition-all duration-500",
                isCompleted ? "bg-white/40" : "bg-white/10"
              )}
            />
          )}
        </div>
      );
    })}
  </div>
);

// =====================================================
// STEP 1: Mode Selection (controlled via RHF Controller)
// =====================================================

const Step1Mode = ({
  value,
  onChange,
}: {
  value: SquadMode;
  onChange: (mode: SquadMode) => void;
}) => (
  <motion.div
    key="step1"
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -30 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className="space-y-3"
  >
    <div className="text-center mb-4">
      <h3 className="text-base font-display text-white mb-1">
        Quel type d'escouade ?
      </h3>
      <p className="text-xs text-mp-ink-muted">
        Choisis le mode qui correspond à ton objectif.
      </p>
    </div>

    {SQUAD_MODES.map((mode) => {
      const isSelected = value === mode.value;
      return (
        <motion.button
          key={mode.value}
          type="button"
          onClick={() => onChange(mode.value)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={cn(
            "w-full text-left relative overflow-hidden rounded-xl p-4",
            "bg-black/40 backdrop-blur-md",
            "border-2 transition-all duration-300",
            "group cursor-pointer",
            isSelected ? mode.borderColor : "border-white/10",
            isSelected ? mode.glowColor : ""
          )}
        >
          {/* Background gradient */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br transition-opacity duration-300",
              mode.bgGradient,
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-60"
            )}
          />

          <div className="relative z-10 flex items-center gap-4">
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
              style={{
                background: isSelected
                  ? `${mode.color}30`
                  : "rgba(255,255,255,0.05)",
                color: isSelected ? mode.color : "#94a3b8",
                border: `1px solid ${isSelected ? mode.color + "50" : "rgba(255,255,255,0.1)"}`,
              }}
            >
              {mode.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="font-display text-sm font-bold transition-colors duration-300"
                  style={{ color: isSelected ? mode.color : "white" }}
                >
                  {mode.emoji} {mode.label}
                </span>
                <span className="text-xs text-mp-ink-muted font-normal">
                  — {mode.tagline}
                </span>
              </div>
              <p className="text-xs text-mp-ink-muted leading-relaxed">
                {mode.description}
              </p>
            </div>

            {/* Radio indicator */}
            <div
              className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300"
              style={{
                borderColor: isSelected ? mode.color : "rgba(255,255,255,0.2)",
              }}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: mode.color }}
                />
              )}
            </div>
          </div>
        </motion.button>
      );
    })}
  </motion.div>
);

// =====================================================
// STEP 2: Details & Privacy
// =====================================================

const Step2Details = ({
  register,
  control,
  watch,
  errors,
  selectedMode,
}: {
  register: ReturnType<typeof useForm<WizardFormValues>>["register"];
  control: ReturnType<typeof useForm<WizardFormValues>>["control"];
  watch: ReturnType<typeof useForm<WizardFormValues>>["watch"];
  errors: ReturnType<typeof useForm<WizardFormValues>>["formState"]["errors"];
  selectedMode: SquadMode;
}) => {
  const modeConfig = SQUAD_MODES.find((m) => m.value === selectedMode)!;
  const nameValue = watch("name") ?? "";
  const descValue = watch("description") ?? "";
  const isPrivate = watch("is_private");

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="space-y-4"
    >
      {/* Mode badge */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg border"
        style={{
          background: `${modeConfig.color}15`,
          borderColor: `${modeConfig.color}30`,
        }}
      >
        <span style={{ color: modeConfig.color }}>{modeConfig.icon}</span>
        <span
          className="text-sm font-medium"
          style={{ color: modeConfig.color }}
        >
          Mode {modeConfig.label}
        </span>
        <span className="text-xs text-mp-ink-muted">— {modeConfig.tagline}</span>
      </div>

      {/* Squad name */}
      <div className="space-y-1.5">
        <Label className="text-sm text-slate-300 font-medium">
          Nom de l'escouade <span className="text-[hsl(var(--mp-primary))]">*</span>
        </Label>
        <Input
          {...register("name", {
            required: "Le nom est obligatoire",
            minLength: { value: 2, message: "Minimum 2 caractères" },
            maxLength: { value: 60, message: "Maximum 60 caractères" },
          })}
          placeholder='Ex: "Groupe Demon Slayer", "Team JJK"...'
          maxLength={60}
          className={cn(
            "bg-black/40 backdrop-blur-md border-white/20 text-white",
            "placeholder:text-mp-ink-muted",
            "focus:border-[hsl(var(--mp-saffron))]/50 focus:shadow-[0_0_10px_rgba(255,215,0,0.2)]",
            "transition-all duration-200",
            errors.name && "border-red-500/50"
          )}
        />
        <div className="flex justify-between items-center">
          {errors.name ? (
            <p className="text-xs text-red-400">{errors.name.message as string}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-mp-ink-muted">{nameValue.length}/60</p>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-sm text-slate-300 font-medium">
          Description{" "}
          <span className="text-mp-ink-muted">(optionnel)</span>
        </Label>
        <Textarea
          {...register("description", {
            maxLength: { value: 300, message: "Maximum 300 caractères" },
          })}
          placeholder="Décris ton escouade : univers, ambiance, ce que tu recherches..."
          maxLength={300}
          rows={3}
          className={cn(
            "bg-black/40 backdrop-blur-md border-white/20 text-white",
            "placeholder:text-mp-ink-muted resize-none",
            "focus:border-[hsl(var(--mp-saffron))]/50 focus:shadow-[0_0_10px_rgba(255,215,0,0.2)]",
            "transition-all duration-200"
          )}
        />
        <p className="text-xs text-mp-ink-muted text-right">
          {descValue.length}/300
        </p>
      </div>

      {/* Privacy toggle */}
      <div
        className={cn(
          "flex items-center justify-between gap-4 p-4 rounded-xl",
          "border transition-all duration-300",
          isPrivate
            ? "bg-[hsl(var(--mp-primary))]/10 border-[hsl(var(--mp-primary))]/30"
            : "bg-white/5 border-white/10"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300",
              isPrivate
                ? "bg-[hsl(var(--mp-primary))]/20 text-[hsl(var(--mp-primary))]"
                : "bg-white/10 text-mp-ink-muted"
            )}
          >
            {isPrivate ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-white">Groupe Privé</p>
            <p className="text-xs text-mp-ink-muted">
              {isPrivate
                ? "Invisible dans la recherche — accessible par lien uniquement"
                : "Visible dans le Party Finder — ouvert aux candidatures"}
            </p>
          </div>
        </div>
        <Controller
          name="is_private"
          control={control}
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              className="data-[state=checked]:bg-[hsl(var(--mp-primary))]"
            />
          )}
        />
      </div>
    </motion.div>
  );
};

// =====================================================
// STEP 3: Slots
// =====================================================

const Step3Slots = ({
  control,
  register,
  errors,
  selectedMode,
}: {
  control: ReturnType<typeof useForm<WizardFormValues>>["control"];
  register: ReturnType<typeof useForm<WizardFormValues>>["register"];
  errors: ReturnType<typeof useForm<WizardFormValues>>["formState"]["errors"];
  selectedMode: SquadMode;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "slots",
  });

  const modeConfig = SQUAD_MODES.find((m) => m.value === selectedMode)!;

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="space-y-3"
    >
      <div className="text-center mb-2">
        <h3 className="text-base font-display text-white mb-1">
          Définis les places disponibles
        </h3>
        <p className="text-xs text-mp-ink-muted">
          Chaque "slot" est une place que les membres peuvent demander.
        </p>
      </div>

      {/* Slots list */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {fields.map((field, index) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "relative rounded-xl p-4 space-y-3",
                "bg-black/40 backdrop-blur-md",
                "border border-white/10",
                "hover:border-white/20 transition-all duration-200"
              )}
            >
              {/* Slot header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                    style={{
                      background: `${modeConfig.color}20`,
                      color: modeConfig.color,
                    }}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs text-mp-ink-muted font-medium uppercase tracking-wider">
                    Place #{index + 1}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center",
                    "text-mp-ink-muted hover:text-red-400",
                    "hover:bg-red-500/10 transition-all duration-200"
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title + Role type row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-mp-ink-muted">
                    Titre <span className="text-[hsl(var(--mp-primary))]">*</span>
                  </Label>
                  <Input
                    {...register(`slots.${index}.title`, {
                      required: "Titre requis",
                    })}
                    placeholder='Ex: "Zoro", "Photographe"'
                    maxLength={50}
                    className={cn(
                      "h-9 text-sm bg-black/40 border-white/15 text-white",
                      "placeholder:text-mp-ink-muted",
                      "focus:border-[hsl(var(--mp-info))]/40 transition-all duration-200",
                      errors?.slots?.[index]?.title && "border-red-500/50"
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-mp-ink-muted">Type de rôle</Label>
                  <Controller
                    name={`slots.${index}.role_type`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-9 text-sm bg-black/40 border-white/15 text-white focus:border-[hsl(var(--mp-info))]/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-mp-paper border-white/10 text-white">
                          {ROLE_TYPE_OPTIONS.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                              className="focus:bg-white/10"
                            >
                              {opt.icon} {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-1.5">
                <Label className="text-xs text-mp-ink-muted">
                  Prérequis{" "}
                  <span className="text-mp-ink-muted">(optionnel)</span>
                </Label>
                <Input
                  {...register(`slots.${index}.requirements`)}
                  placeholder='Ex: "Costume 100% fini", "Niveau intermédiaire"'
                  maxLength={150}
                  className={cn(
                    "h-9 text-sm bg-black/40 border-white/15 text-white",
                    "placeholder:text-mp-ink-muted",
                    "focus:border-[hsl(var(--mp-info))]/40 transition-all duration-200"
                  )}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add slot button */}
      <motion.button
        type="button"
        onClick={() =>
          append({ title: "", role_type: "generic", requirements: "" })
        }
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "w-full py-3 rounded-xl",
          "border-2 border-dashed border-white/20",
          "text-mp-ink-muted hover:text-white",
          "hover:border-white/40 hover:bg-white/5",
          "flex items-center justify-center gap-2",
          "text-sm font-medium transition-all duration-200"
        )}
      >
        <Plus className="w-4 h-4" />
        Ajouter une place
      </motion.button>

      {/* Validation hint */}
      {fields.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-amber-400/80 py-1"
        >
          ⚠️ Ajoute au moins 1 place pour pouvoir fonder l'escouade.
        </motion.p>
      )}
    </motion.div>
  );
};

// =====================================================
// MAIN COMPONENT: CreateSquadWizard
// =====================================================

export const CreateSquadWizard = ({
  targetEventId,
  userId,
  onSuccess,
  onCancel,
}: CreateSquadWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const TOTAL_STEPS = 3;

  const createSquadMutation = useCreateSquad();

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<WizardFormValues>({
    defaultValues: {
      mode: "squad",
      name: "",
      description: "",
      is_private: false,
      slots: [{ title: "", role_type: "generic", requirements: "" }],
    },
  });

  const selectedMode = watch("mode");
  const slots = watch("slots");
  const modeConfig = SQUAD_MODES.find((m) => m.value === selectedMode)!;

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNext = async () => {
    let isValid = true;

    if (currentStep === 2) {
      isValid = await trigger(["name", "description"]);
    }

    if (isValid) {
      setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
    }
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const onSubmit = async (values: WizardFormValues) => {
    if (!values.slots || values.slots.length === 0) return;

    const slotsPayload: CreateSlotInput[] = values.slots.map((s) => ({
      title: s.title,
      role_type: s.role_type,
      requirements: s.requirements || undefined,
    }));

    await createSquadMutation.mutateAsync({
      name: values.name,
      description: values.description || undefined,
      target_event_id: targetEventId,
      created_by: userId,
      mode: values.mode,
      is_private: values.is_private,
      slots: slotsPayload,
    });

    onSuccess?.();
  };

  const canSubmit =
    !createSquadMutation.isPending &&
    slots &&
    slots.length > 0 &&
    slots.every((s) => s.title.trim().length > 0);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
      {/* Header banner — color shifts with selected mode */}
      <motion.div
        animate={{
          borderColor: `${modeConfig.color}30`,
          background: `linear-gradient(135deg, ${modeConfig.color}15, rgba(0,0,0,0.4), ${modeConfig.color}08)`,
        }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-xl p-4 mb-5 border"
      >
        <motion.div
          animate={{ background: modeConfig.color }}
          transition={{ duration: 0.4 }}
          className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20"
        />
        <div className="relative z-10 flex items-center gap-3">
          <motion.div
            animate={{
              background: `${modeConfig.color}25`,
              color: modeConfig.color,
              borderColor: `${modeConfig.color}40`,
            }}
            transition={{ duration: 0.4 }}
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border"
          >
            <Crown className="w-5 h-5" />
          </motion.div>
          <div>
            <h4 className="font-display text-sm text-white">
              Fonde ton escouade
            </h4>
            <p className="text-xs text-mp-ink-muted">
              En tant que fondateur, tu seras le leader de l'escouade.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Step indicator */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        accentColor={modeConfig.color}
      />

      {/* Step content */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <Controller
              key="step1-controller"
              name="mode"
              control={control}
              render={({ field }) => (
                <Step1Mode
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          )}
          {currentStep === 2 && (
            <Step2Details
              key="step2"
              register={register}
              control={control}
              watch={watch}
              errors={errors}
              selectedMode={selectedMode}
            />
          )}
          {currentStep === 3 && (
            <Step3Slots
              key="step3"
              control={control}
              register={register}
              errors={errors}
              selectedMode={selectedMode}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-4 border-t border-white/10 mt-4">
        {/* Back / Cancel */}
        {currentStep === 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-white/20 text-slate-300 hover:bg-white/5"
          >
            Annuler
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="flex-1 border-white/20 text-slate-300 hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>
        )}

        {/* Next / Submit */}
        {currentStep < TOTAL_STEPS ? (
          <motion.div
            className="flex-1"
            animate={{
              filter: `drop-shadow(0 0 8px ${modeConfig.color}40)`,
            }}
            transition={{ duration: 0.4 }}
          >
            <Button
              type="button"
              onClick={handleNext}
              className="w-full font-bold border transition-all duration-300"
              style={{
                background: `${modeConfig.color}20`,
                borderColor: `${modeConfig.color}50`,
                color: modeConfig.color,
              }}
            >
              Continuer
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        ) : (
          <Button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "flex-1 h-11 font-bold text-sm",
              "bg-gradient-to-r from-[hsl(var(--mp-saffron))] to-yellow-500",
              "hover:from-[hsl(var(--mp-saffron))]/90 hover:to-yellow-500/90",
              "text-black",
              "shadow-[0_0_20px_rgba(255,215,0,0.4)]",
              "hover:shadow-[0_0_30px_rgba(255,215,0,0.6)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-300"
            )}
          >
            {createSquadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Sword className="w-4 h-4 mr-2" />
                Fonder l'escouade
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
};
