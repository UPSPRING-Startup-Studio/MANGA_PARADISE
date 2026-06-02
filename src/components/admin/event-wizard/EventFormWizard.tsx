/**
 * EventFormWizard — Orchestrateur principal du formulaire multi-étapes
 * 
 * Gère le flux complet :
 * 1. Écran de choix de preset (ou skip si édition)
 * 2. Navigation par étapes avec stepper
 * 3. Résumé latéral sticky
 * 4. Validation et soumission
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, Save, Loader2, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import EventPresetSelector from "./EventPresetSelector";
import EventFormStepper from "./EventFormStepper";
import EventFormSummary from "./EventFormSummary";

import StepIdentity from "./steps/StepIdentity";
import StepDateTime from "./steps/StepDateTime";
import StepRegistration from "./steps/StepRegistration";
import StepTicketing from "./steps/StepTicketing";
import StepExperience from "./steps/StepExperience";
import StepPopCulture from "./steps/StepPopCulture";

import {
  DEFAULT_WIZARD_FORM_DATA,
  WIZARD_STEPS,
  applyPreset,
  wizardToLegacy,
  type EventWizardFormData,
  type PresetConfig,
  type LegacyEventFormData,
} from "./eventFormTypes";

// Import legacy types for compatibility
import type { ScheduleDay } from "../EventScheduleForm";
import type { ProgramItem } from "../EventProgramForm";

// ─── Props ────────────────────────────────────────────────────────

interface EventFormWizardProps {
  initialData?: Partial<LegacyEventFormData> & { id?: string };
  onSubmit: (data: LegacyEventFormData) => void;
  onSave?: (data: LegacyEventFormData) => void;
  isSubmitting?: boolean;
  isSaving?: boolean;
  isEditing?: boolean;
  onFormDirtyChange?: (isDirty: boolean) => void;
  /** Callback to keep parent in sync with the latest legacy snapshot */
  onFormSnapshotChange?: (data: LegacyEventFormData) => void;
  /** Incremented by parent after a successful save — resets dirty baseline */
  savedVersion?: number;
}

// ─── Legacy Data → Wizard Data converter ──────────────────────────

function legacyToWizard(legacy: Partial<LegacyEventFormData>): Partial<EventWizardFormData> {
  return {
    title: legacy.title || "",
    description: legacy.description || "",
    category: legacy.category || "general",
    status: legacy.status || "upcoming",
    schedule: legacy.schedule || [{ date: "", start_time: "10:00", end_time: "18:00" }],
    venue_name: legacy.venue_name || "",
    city: legacy.city || "",
    region: legacy.region || "",
    ticketing_mode: legacy.ticketing_mode || "internal",
    external_link: legacy.external_link || "",
    is_free: legacy.is_free ?? true,
    price_amount: legacy.price_amount || "",
    is_capacity_limited: legacy.is_capacity_limited ?? false,
    max_attendees: legacy.max_attendees || "",
    image_url: legacy.image_url || "",
    programItems: legacy.programItems || [],
    // Enable gamification module if quest was enabled
    gamification: legacy.enablePresenceQuest
      ? { ...DEFAULT_WIZARD_FORM_DATA.gamification, enabled: true, enable_presence_quest: true }
      : DEFAULT_WIZARD_FORM_DATA.gamification,
    enabled_modules: legacy.enablePresenceQuest
      ? ["gamification"]
      : [],
    // Phase 2 — Series
    series_id: legacy.series_id ?? undefined,
    edition_label: legacy.edition_label ?? undefined,
    // Phase 3 — Association
    association_id: legacy.association_id ?? undefined,
    // Phase 4 — Multi-organisateur
    organizer_type: (legacy as any).organizer_type === "pro_partner"
      ? "pro_partner"
      : (legacy as any).organizer_type === "association"
        ? "association"
        : null,
    organizer_id: (legacy as any).organizer_id ?? null,
  };
}

// ─── Component ────────────────────────────────────────────────────

const EventFormWizard = ({
  initialData,
  onSubmit,
  onSave,
  isSubmitting = false,
  isSaving = false,
  isEditing = false,
  onFormDirtyChange,
  onFormSnapshotChange,
  savedVersion,
}: EventFormWizardProps) => {
  // Phase: "preset" (choosing preset) or "wizard" (filling form steps)
  const [phase, setPhase] = useState<"preset" | "wizard">(isEditing ? "wizard" : "preset");
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Form data state
  const [formData, setFormData] = useState<EventWizardFormData>(() => {
    if (initialData) {
      return { ...DEFAULT_WIZARD_FORM_DATA, ...legacyToWizard(initialData) };
    }
    return { ...DEFAULT_WIZARD_FORM_DATA };
  });

  // Track dirty state
  const initialDataRef = useRef<EventWizardFormData>(formData);

  useEffect(() => {
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialDataRef.current);
    onFormDirtyChange?.(isDirty);
  }, [formData, onFormDirtyChange]);

  // Keep parent in sync with the latest legacy-format snapshot
  useEffect(() => {
    onFormSnapshotChange?.(wizardToLegacy(formData, initialData?.id));
  }, [formData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent navigation if dirty
  useEffect(() => {
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialDataRef.current);
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Modifications non sauvegardées. Quitter ?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData]);

  // Sync from external initial data (edit mode)
  useEffect(() => {
    if (initialData?.id) {
      const newData = { ...DEFAULT_WIZARD_FORM_DATA, ...legacyToWizard(initialData) };
      setFormData(newData);
      initialDataRef.current = newData;
    }
  }, [initialData?.id]);

  // Reset dirty baseline after successful save
  useEffect(() => {
    if (savedVersion !== undefined && savedVersion > 0) {
      initialDataRef.current = formData;
    }
  }, [savedVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handlers ───────────────────────────────────────────────

  const updateFormData = useCallback((updates: Partial<EventWizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handlePresetSelect = (preset: PresetConfig) => {
    const presetDefaults = applyPreset(preset);
    setFormData({ ...DEFAULT_WIZARD_FORM_DATA, ...presetDefaults });
    initialDataRef.current = { ...DEFAULT_WIZARD_FORM_DATA, ...presetDefaults };
    setPhase("wizard");
    setCurrentStep(0);
  };

  const handleBack = () => {
    if (currentStep === 0) {
      if (!isEditing) {
        setPhase("preset");
      }
      return;
    }
    setCurrentStep((prev) => prev - 1);
  };

  const handleNext = () => {
    // Validate current step
    if (!validateStep(currentStep)) return;

    // Mark current step as completed
    setCompletedSteps((prev) => new Set([...prev, currentStep]));

    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleStepClick = (step: number) => {
    // Allow navigating to any previously visited step
    setCurrentStep(step);
  };

  const handleSubmit = () => {
    // Validate all required fields
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      setCurrentStep(0);
      return;
    }

    const hasValidDate = formData.schedule.some((day) => day.date?.trim());
    if (!hasValidDate) {
      toast.error("Au moins une date est requise");
      setCurrentStep(1);
      return;
    }

    if (formData.ticketing_mode === "external" && !formData.external_link.trim().startsWith("http")) {
      toast.error("Le lien de billetterie externe est requis");
      setCurrentStep(3);
      return;
    }

    // Convert to legacy format and submit
    const legacyData = wizardToLegacy(formData, initialData?.id);
    onSubmit(legacyData);
  };

  const handleSave = () => {
    if (!onSave) return;
    if (!formData.title.trim()) {
      toast.error("Le titre est requis pour enregistrer");
      setCurrentStep(0);
      return;
    }
    const legacyData = wizardToLegacy(formData, initialData?.id);
    console.log("[wizard-save] form association_id =", formData.association_id);
    console.log("[wizard-save] legacy association_id =", legacyData.association_id);
    console.log("[wizard-save] legacy event id =", legacyData.id);
    onSave(legacyData);
  };

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialDataRef.current);

  // Visual feedback: brief "saved" state after save completes
  const [justSaved, setJustSaved] = useState(false);
  useEffect(() => {
    if (savedVersion !== undefined && savedVersion > 0) {
      setJustSaved(true);
      const timer = setTimeout(() => setJustSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [savedVersion]);

  // ─── Validation ─────────────────────────────────────────────

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Identity
        if (!formData.title.trim()) {
          toast.error("Le titre de l'événement est requis");
          return false;
        }
        return true;
      case 1: // Date & Location
        const hasDate = formData.schedule.some((d) => d.date?.trim());
        if (!hasDate) {
          toast.error("Au moins une date est requise");
          return false;
        }
        return true;
      case 2: // Registration
        return true;
      case 3: // Ticketing
        if (formData.ticketing_mode === "external" && !formData.external_link.trim().startsWith("http")) {
          toast.error("Le lien de billetterie externe est requis");
          return false;
        }
        return true;
      case 4: // Experience
        return true;
      case 5: // Pop Culture
        return true;
      default:
        return true;
    }
  };

  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const canGoBack = currentStep > 0 || (!isEditing && phase === "wizard");

  // ─── Render ─────────────────────────────────────────────────

  // Phase 1: Preset Selection
  if (phase === "preset") {
    return (
      <div className="py-2">
        <EventPresetSelector onSelect={handlePresetSelect} />
      </div>
    );
  }

  // Phase 2: Wizard Form
  return (
    <div className="space-y-4">
      {/* Stepper */}
      <EventFormStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {/* Main Content Area */}
      <div className="flex gap-4">
        {/* Form Steps */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <StepIdentity
                key="step-identity"
                formData={formData}
                onChange={updateFormData}
              />
            )}
            {currentStep === 1 && (
              <StepDateTime
                key="step-datetime"
                formData={formData}
                onChange={updateFormData}
              />
            )}
            {currentStep === 2 && (
              <StepRegistration
                key="step-registration"
                formData={formData}
                onChange={updateFormData}
              />
            )}
            {currentStep === 3 && (
              <StepTicketing
                key="step-ticketing"
                formData={formData}
                onChange={updateFormData}
              />
            )}
            {currentStep === 4 && (
              <StepExperience
                key="step-experience"
                formData={formData}
                onChange={updateFormData}
              />
            )}
            {currentStep === 5 && (
              <StepPopCulture
                key="step-popculture"
                formData={formData}
                onChange={updateFormData}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Summary Sidebar — Desktop only */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-4">
            <EventFormSummary formData={formData} />
          </div>
        </div>
      </div>

      {/* Navigation Footer — Sticky */}
      <div className="sticky bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-5 py-3.5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/60 -mx-6 -mb-6 rounded-b-lg">
        {/* Left: Back button */}
        <div className="flex items-center gap-2 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={!canGoBack}
            className={cn(
              "gap-1.5 text-muted-foreground hover:text-foreground transition-all",
              !canGoBack && "opacity-0 pointer-events-none"
            )}
          >
            {currentStep === 0 && !isEditing ? (
              <>
                <ArrowLeft className="w-3.5 h-3.5" />
                Presets
              </>
            ) : (
              <>
                <ChevronLeft className="w-3.5 h-3.5" />
                Précédent
              </>
            )}
          </Button>
        </div>

        {/* Center: Step indicator (mobile) */}
        <span className="text-xs text-muted-foreground tabular-nums lg:hidden">
          {currentStep + 1} / {WIZARD_STEPS.length}
        </span>

        {/* Right: Enregistrer + Next / Final Save */}
        <div className="flex items-center gap-2.5">
          {/* Enregistrer — always visible in edit mode, adapts to state */}
          {onSave && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isSubmitting || !isDirty}
              className={cn(
                "gap-1.5 transition-all duration-200",
                justSaved
                  ? "border-sakura/40 text-sakura bg-sakura/5"
                  : isDirty
                    ? "border-sakura/30 text-foreground hover:bg-sakura/5 hover:border-sakura/40"
                    : "border-border text-muted-foreground/60"
              )}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {justSaved ? "Enregistré" : "Enregistrer"}
            </Button>
          )}

          {/* Next / Final submit — primary CTA */}
          {isLastStep ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isSaving}
              className="min-w-[180px] bg-sakura hover:bg-sakura/90 text-white font-semibold gap-2 shadow-sm shadow-sakura/20"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              Sauvegarder l'événement
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSaving}
              className="min-w-[120px] bg-sakura hover:bg-sakura/90 text-white font-semibold gap-2 shadow-sm shadow-sakura/20"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventFormWizard;
