import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Loader2, 
  Check, 
  Users, 
  User, 
  Heart, 
  Store, 
  Palette,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Plus,
  AlertTriangle,
  Calendar,
  Copy,
  Ticket,
  ExternalLink,
  Bell,
  PartyPopper
} from "lucide-react";
import { useCosplayVestiaire, CosplayItem } from "@/hooks/useCosplayVestiaire";
import { useNavigate } from "react-router-dom";
import { EVENT_ROLES } from "@/lib/constants";
import { format, parseISO, eachDayOfInterval, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useNotifyNakamas } from "@/hooks/useNotifyNakamas";
import { useProfile } from "@/hooks/useProfile";
import confetti from "canvas-confetti";

interface RSVPModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle: string;
  eventId: string;
  userId: string;
  onSubmit: (data: RSVPData) => Promise<void>;
  isLoading?: boolean;
  existingParticipation?: {
    id: string;
    planned_cosplay_id: string | null;
    role?: string;
    attendance_details?: AttendanceDetail[] | null;
  } | null;
  eventStartDate?: string;
  eventEndDate?: string | null;
  ticketingUrl?: string | null;
}

export interface AttendanceDetail {
  date: string;
  role: "visitor" | "volunteer" | "exhibitor" | "cosplayer";
  cosplay_id: string | null;
}

export interface RSVPData {
  role: "visitor" | "volunteer" | "exhibitor" | "cosplayer";
  plannedCosplayId: string | null;
  attendanceDetails?: AttendanceDetail[] | null;
  cosplayData?: Array<{
    characterName: string;
    universe: string;
    imageUrl?: string;
    role?: string;
  }> | null;
}

// Rôles événements basés sur RI Art. 5.4.1
const roleOptions = [
  { 
    value: EVENT_ROLES.visitor.value, 
    label: EVENT_ROLES.visitor.label, 
    emoji: EVENT_ROLES.visitor.emoji,
    icon: User, 
    color: "from-muted-foreground/20 to-muted-foreground/10",
    borderColor: "border-muted-foreground/50",
    description: EVENT_ROLES.visitor.description,
    requiresValidation: EVENT_ROLES.visitor.requiresValidation,
  },
  { 
    value: EVENT_ROLES.volunteer.value, 
    label: EVENT_ROLES.volunteer.label, 
    emoji: EVENT_ROLES.volunteer.emoji,
    icon: Heart, 
    color: "from-turquoise/20 to-turquoise/10",
    borderColor: "border-turquoise",
    description: EVENT_ROLES.volunteer.description,
    requiresValidation: EVENT_ROLES.volunteer.requiresValidation,
  },
  { 
    value: EVENT_ROLES.exhibitor.value, 
    label: EVENT_ROLES.exhibitor.label, 
    emoji: EVENT_ROLES.exhibitor.emoji,
    icon: Store, 
    color: "from-accent/20 to-accent/10",
    borderColor: "border-accent",
    description: EVENT_ROLES.exhibitor.description,
    requiresValidation: EVENT_ROLES.exhibitor.requiresValidation,
  },
  { 
    value: EVENT_ROLES.cosplayer.value, 
    label: EVENT_ROLES.cosplayer.label, 
    emoji: EVENT_ROLES.cosplayer.emoji,
    icon: Palette, 
    color: "from-sakura/20 to-sakura/10",
    borderColor: "border-sakura",
    description: EVENT_ROLES.cosplayer.description,
    requiresValidation: EVENT_ROLES.cosplayer.requiresValidation,
  },
];

type StepType = "days" | "role" | "cosplay" | "day-config" | "validation" | "ticket-check" | "social-share";

const RSVPModal = ({
  open,
  onOpenChange,
  eventTitle,
  eventId,
  userId,
  onSubmit,
  isLoading = false,
  existingParticipation,
  eventStartDate,
  eventEndDate,
  ticketingUrl,
}: RSVPModalProps) => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const notifyNakamasMutation = useNotifyNakamas();
  
  // Detect multi-day event
  const eventDays = useMemo(() => {
    if (!eventStartDate) return [];
    const start = parseISO(eventStartDate);
    const end = eventEndDate ? parseISO(eventEndDate) : start;
    
    // Check if different days (more than 24h apart)
    if (isSameDay(start, end)) return [];
    
    return eachDayOfInterval({ start, end });
  }, [eventStartDate, eventEndDate]);
  
  const isMultiDay = eventDays.length > 1;
  
  // State
  const [step, setStep] = useState<StepType>(isMultiDay ? "days" : "role");
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [dayConfigs, setDayConfigs] = useState<Map<string, { role: string; cosplayId: string | null }>>(new Map());
  
  // Single-day state (legacy)
  const [role, setRole] = useState<string>(existingParticipation?.role || "visitor");
  const [selectedCosplayId, setSelectedCosplayId] = useState<string | null>(
    existingParticipation?.planned_cosplay_id || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTicket, setHasTicket] = useState<boolean | null>(null);
  const [submittedRole, setSubmittedRole] = useState<string>("visitor");

  const { data: cosplays = [] } = useCosplayVestiaire(userId);


  // Reset state when modal closes or opens
  useEffect(() => {
    if (!open) {
      // Reset on close
      setStep(isMultiDay ? "days" : "role");
      setSelectedDays([]);
      setCurrentDayIndex(0);
      setDayConfigs(new Map());
      setRole(existingParticipation?.role || "visitor");
      setSelectedCosplayId(existingParticipation?.planned_cosplay_id || null);
      setHasTicket(null);
      setSubmittedRole("visitor");
    } else if (open && existingParticipation?.attendance_details && isMultiDay) {
      // Restore existing multi-day config
      const details = existingParticipation.attendance_details;
      const restoredDays: Date[] = [];
      const restoredConfigs = new Map<string, { role: string; cosplayId: string | null }>();
      
      details.forEach(detail => {
        const date = parseISO(detail.date);
        restoredDays.push(date);
        restoredConfigs.set(detail.date, {
          role: detail.role,
          cosplayId: detail.cosplay_id,
        });
      });
      
      setSelectedDays(restoredDays);
      setDayConfigs(restoredConfigs);
    }
  }, [open, existingParticipation, isMultiDay]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let mainRole = "visitor";
      
      if (isMultiDay && selectedDays.length > 0) {
        // Multi-day submission
        const attendanceDetails: AttendanceDetail[] = selectedDays.map(day => {
          const dateKey = format(day, "yyyy-MM-dd");
          const config = dayConfigs.get(dateKey) || { role: "visitor", cosplayId: null };
          return {
            date: dateKey,
            role: config.role as AttendanceDetail["role"],
            cosplay_id: config.cosplayId,
          };
        });
        
        // Use the first day's role as the main role for backward compatibility
        mainRole = attendanceDetails[0]?.role || "visitor";
        const mainCosplayId = attendanceDetails[0]?.cosplay_id || null;
        
        await onSubmit({
          role: mainRole as RSVPData["role"],
          plannedCosplayId: mainCosplayId,
          attendanceDetails,
        });
      } else {
        // Single-day submission
        mainRole = role;
        await onSubmit({
          role: role as RSVPData["role"],
          plannedCosplayId: role === "cosplayer" ? selectedCosplayId : null,
        });
      }
      
      // Store the role for social share
      setSubmittedRole(mainRole);
      
      // For editing, close directly without ticket check
      if (existingParticipation) {
        onOpenChange(false);
      } else {
        // Go to ticket check step for new registrations
        setStep("ticket-check");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isMultiDay) {
      if (step === "days") {
        if (selectedDays.length === 0) return;
        setCurrentDayIndex(0);
        setStep("day-config");
      } else if (step === "day-config") {
        const currentDay = selectedDays[currentDayIndex];
        const dateKey = format(currentDay, "yyyy-MM-dd");
        const config = dayConfigs.get(dateKey);
        
        // If cosplayer role and no cosplay selected yet, show cosplay step
        if (config?.role === "cosplayer" && config.cosplayId === null && cosplays.length > 0) {
          setStep("cosplay");
          return;
        }
        
        // Move to next day or validation
        if (currentDayIndex < selectedDays.length - 1) {
          setCurrentDayIndex(currentDayIndex + 1);
        } else {
          setStep("validation");
        }
      } else if (step === "cosplay") {
        // After selecting cosplay, move to next day or validation
        if (currentDayIndex < selectedDays.length - 1) {
          setCurrentDayIndex(currentDayIndex + 1);
          setStep("day-config");
        } else {
          setStep("validation");
        }
      }
    } else {
      // Single-day flow
      if (step === "role") {
        if (role === "cosplayer") {
          setStep("cosplay");
        } else {
          setStep("validation");
        }
      } else if (step === "cosplay") {
        setStep("validation");
      }
    }
  };

  const handleBack = () => {
    if (isMultiDay) {
      if (step === "day-config") {
        if (currentDayIndex > 0) {
          setCurrentDayIndex(currentDayIndex - 1);
        } else {
          setStep("days");
        }
      } else if (step === "cosplay") {
        setStep("day-config");
      } else if (step === "validation") {
        setCurrentDayIndex(selectedDays.length - 1);
        setStep("day-config");
      }
    } else {
      // Single-day flow
      if (step === "validation") {
        if (role === "cosplayer") {
          setStep("cosplay");
        } else {
          setStep("role");
        }
      } else if (step === "cosplay") {
        setStep("role");
      }
    }
  };

  const toggleDay = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    setSelectedDays(prev => {
      const isSelected = prev.some(d => isSameDay(d, day));
      if (isSelected) {
        // Remove day and its config
        setDayConfigs(configs => {
          const newConfigs = new Map(configs);
          newConfigs.delete(dateKey);
          return newConfigs;
        });
        return prev.filter(d => !isSameDay(d, day));
      } else {
        // Add day with default config
        setDayConfigs(configs => {
          const newConfigs = new Map(configs);
          newConfigs.set(dateKey, { role: "visitor", cosplayId: null });
          return newConfigs;
        });
        return [...prev, day].sort((a, b) => a.getTime() - b.getTime());
      }
    });
  };

  const updateDayConfig = (role: string, cosplayId: string | null = null) => {
    const currentDay = selectedDays[currentDayIndex];
    const dateKey = format(currentDay, "yyyy-MM-dd");
    setDayConfigs(configs => {
      const newConfigs = new Map(configs);
      newConfigs.set(dateKey, { role, cosplayId });
      return newConfigs;
    });
  };

  const duplicatePreviousDay = () => {
    if (currentDayIndex === 0) return;
    const prevDay = selectedDays[currentDayIndex - 1];
    const prevDateKey = format(prevDay, "yyyy-MM-dd");
    const prevConfig = dayConfigs.get(prevDateKey);
    
    if (prevConfig) {
      const currentDay = selectedDays[currentDayIndex];
      const currentDateKey = format(currentDay, "yyyy-MM-dd");
      setDayConfigs(configs => {
        const newConfigs = new Map(configs);
        newConfigs.set(currentDateKey, { ...prevConfig });
        return newConfigs;
      });
    }
  };

  const isEditing = !!existingParticipation;
  
  // Calculate progress
  const getProgressSteps = () => {
    if (isMultiDay) {
      return ["days", "day-config", "validation"];
    }
    return role === "cosplayer" ? ["role", "cosplay", "validation"] : ["role", "validation"];
  };
  
  const progressSteps = getProgressSteps();
  const currentStepIndex = progressSteps.indexOf(step === "cosplay" && isMultiDay ? "day-config" : step);

  // Handle ticket check response
  const handleTicketResponse = (hasIt: boolean) => {
    setHasTicket(hasIt);
    if (hasIt) {
      // Trigger confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setStep("social-share");
    }
  };

  // Handle notify nakamas
  const handleNotifyNakamas = async () => {
    await notifyNakamasMutation.mutateAsync({
      userId,
      userDisplayName: profile?.display_name || profile?.username || "Un membre",
      eventId,
      eventTitle,
      role: submittedRole,
    });
    onOpenChange(false);
  };

  // Close modal with skip
  const handleSkipNotify = () => {
    onOpenChange(false);
  };

  // Check if we're in post-wizard steps
  const isPostWizardStep = step === "ticket-check" || step === "social-share";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card border-sakura/20 overflow-hidden p-0">
        {/* Header with Progress - Hide for post-wizard steps */}
        {!isPostWizardStep && (
          <div className="px-6 pt-6 pb-4 border-b border-border/50">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-foreground flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sakura to-turquoise flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="block">Mission Prep</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {isEditing ? "Modifier ma participation" : "Prépare ta venue"}
                  </span>
                </div>
              </DialogTitle>
              <DialogDescription className="sr-only">
                Inscription à {eventTitle}
              </DialogDescription>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mt-4">
              {progressSteps.map((s, idx) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <motion.div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-display transition-all",
                      currentStepIndex > idx
                        ? "bg-sakura text-white"
                        : currentStepIndex === idx
                        ? "bg-sakura/20 text-sakura border-2 border-sakura"
                        : "bg-muted text-muted-foreground"
                    )}
                    animate={{ scale: currentStepIndex === idx ? 1.1 : 1 }}
                  >
                    {currentStepIndex > idx ? <Check className="w-4 h-4" /> : idx + 1}
                  </motion.div>
                  {idx < progressSteps.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 rounded-full transition-colors",
                      currentStepIndex > idx ? "bg-sakura" : "bg-muted"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 min-h-[320px]">
          <AnimatePresence mode="wait">
            {/* Multi-day: Day Selection */}
            {step === "days" && isMultiDay && (
              <StepDaySelection
                key="step-days"
                eventDays={eventDays}
                selectedDays={selectedDays}
                onToggleDay={toggleDay}
              />
            )}
            
            {/* Multi-day: Day Configuration */}
            {step === "day-config" && isMultiDay && (
              <StepDayConfig
                key={`step-config-${currentDayIndex}`}
                day={selectedDays[currentDayIndex]}
                currentIndex={currentDayIndex}
                totalDays={selectedDays.length}
                config={dayConfigs.get(format(selectedDays[currentDayIndex], "yyyy-MM-dd"))}
                onUpdateRole={(r) => updateDayConfig(r, dayConfigs.get(format(selectedDays[currentDayIndex], "yyyy-MM-dd"))?.cosplayId || null)}
                onDuplicate={currentDayIndex > 0 ? duplicatePreviousDay : undefined}
              />
            )}
            
            {/* Single-day: Role Selection */}
            {step === "role" && !isMultiDay && (
              <StepRole 
                key="step1"
                role={role} 
                setRole={setRole} 
              />
            )}
            
            {/* Cosplay Selection (both flows) */}
            {step === "cosplay" && (
              <StepCosplay 
                key="step-cosplay"
                cosplays={cosplays}
                selectedCosplayId={
                  isMultiDay 
                    ? dayConfigs.get(format(selectedDays[currentDayIndex], "yyyy-MM-dd"))?.cosplayId || null
                    : selectedCosplayId
                }
                setSelectedCosplayId={(id) => {
                  if (isMultiDay) {
                    const config = dayConfigs.get(format(selectedDays[currentDayIndex], "yyyy-MM-dd"));
                    updateDayConfig(config?.role || "cosplayer", id);
                  } else {
                    setSelectedCosplayId(id);
                  }
                }}
                onNavigateToSettings={() => {
                  onOpenChange(false);
                  navigate("/espace-membre/parametres");
                }}
                dayLabel={isMultiDay ? format(selectedDays[currentDayIndex], "EEEE d MMMM", { locale: fr }) : undefined}
              />
            )}
            
            {/* Validation */}
            {step === "validation" && (
              isMultiDay ? (
                <StepMultiDayValidation 
                  key="step-validation"
                  selectedDays={selectedDays}
                  dayConfigs={dayConfigs}
                  cosplays={cosplays}
                  eventTitle={eventTitle}
                />
              ) : (
                <StepValidation 
                  key="step3"
                  role={role}
                  cosplay={cosplays.find(c => c.id === selectedCosplayId)}
                  eventTitle={eventTitle}
                />
              )
            )}

            {/* Ticket Check Step */}
            {step === "ticket-check" && (
              <StepTicketCheck
                key="step-ticket"
                eventTitle={eventTitle}
                ticketingUrl={ticketingUrl}
                hasTicket={hasTicket}
                onResponse={handleTicketResponse}
              />
            )}

            {/* Social Share Step */}
            {step === "social-share" && (
              <StepSocialShare
                key="step-social"
                eventTitle={eventTitle}
                isNotifying={notifyNakamasMutation.isPending}
                onNotify={handleNotifyNakamas}
                onSkip={handleSkipNotify}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Footer - Hide for post-wizard steps */}
        {!isPostWizardStep && (
          <div className="px-6 pb-6 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={
                (step === "days" || (step === "role" && !isMultiDay))
                  ? () => onOpenChange(false) 
                  : handleBack
              }
              disabled={isSubmitting}
              className="gap-2"
            >
              {(step === "days" || (step === "role" && !isMultiDay)) ? (
                "Annuler"
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  Retour
                </>
              )}
            </Button>
            
            {step !== "validation" ? (
              <Button
                onClick={handleNext}
                disabled={step === "days" && selectedDays.length === 0}
                className="bg-gradient-to-r from-sakura to-turquoise hover:opacity-90 text-white font-display gap-2"
              >
                Continuer
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isLoading}
                className="bg-gradient-to-r from-sakura to-turquoise hover:opacity-90 text-white font-display gap-2 min-w-[180px]"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validation...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {isEditing ? "Mettre à jour" : "Valider ma présence"}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Step: Day Selection (Multi-day)
const StepDaySelection = ({ 
  eventDays,
  selectedDays,
  onToggleDay,
}: { 
  eventDays: Date[];
  selectedDays: Date[];
  onToggleDay: (day: Date) => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h3 className="font-display text-xl text-foreground flex items-center justify-center gap-2">
          <Calendar className="w-5 h-5 text-sakura" />
          Quels jours seras-tu présent(e) ?
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Sélectionne les jours où tu comptes venir
        </p>
      </div>

      <div className="grid gap-3">
        {eventDays.map((day) => {
          const isSelected = selectedDays.some(d => isSameDay(d, day));
          const formattedDate = format(day, "EEEE d MMMM", { locale: fr });
          
          return (
            <motion.button
              key={day.toISOString()}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onToggleDay(day)}
              className={cn(
                "relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                isSelected
                  ? "border-sakura bg-gradient-to-r from-sakura/20 to-turquoise/10"
                  : "border-border hover:border-muted-foreground/50 bg-muted/20"
              )}
            >
              {/* Date block */}
              <div className={cn(
                "flex flex-col items-center justify-center w-16 h-16 rounded-xl font-display",
                isSelected ? "bg-sakura text-white" : "bg-muted text-muted-foreground"
              )}>
                <span className="text-2xl font-bold">{format(day, "d")}</span>
                <span className="text-xs uppercase">{format(day, "MMM", { locale: fr })}</span>
              </div>
              
              <div className="flex-1">
                <span className={cn(
                  "font-display text-lg capitalize",
                  isSelected ? "text-foreground" : "text-muted-foreground"
                )}>
                  {formattedDate}
                </span>
              </div>
              
              {/* Checkbox indicator */}
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                isSelected 
                  ? "bg-sakura border-sakura" 
                  : "border-muted-foreground/50"
              )}>
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </div>
            </motion.button>
          );
        })}
      </div>
      
      {selectedDays.length > 0 && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          {selectedDays.length} jour{selectedDays.length > 1 ? "s" : ""} sélectionné{selectedDays.length > 1 ? "s" : ""}
        </p>
      )}
    </motion.div>
  );
};

// Step: Day Configuration (Multi-day)
const StepDayConfig = ({ 
  day,
  currentIndex,
  totalDays,
  config,
  onUpdateRole,
  onDuplicate,
}: { 
  day: Date;
  currentIndex: number;
  totalDays: number;
  config?: { role: string; cosplayId: string | null };
  onUpdateRole: (role: string) => void;
  onDuplicate?: () => void;
}) => {
  const currentRole = config?.role || "visitor";
  const formattedDate = format(day, "EEEE d MMMM", { locale: fr });
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-4">
        <Badge variant="outline" className="mb-2">
          Jour {currentIndex + 1}/{totalDays}
        </Badge>
        <h3 className="font-display text-xl text-foreground capitalize">
          📅 {formattedDate}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Quel sera ton rôle ce jour-là ?
        </p>
      </div>

      {/* Duplicate button */}
      {onDuplicate && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDuplicate}
          className="w-full gap-2 mb-2 border-dashed"
        >
          <Copy className="w-4 h-4" />
          Dupliquer la configuration du jour précédent
        </Button>
      )}

      <div className="grid grid-cols-2 gap-3">
        {roleOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = currentRole === option.value;
          return (
            <motion.button
              key={option.value}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onUpdateRole(option.value)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all overflow-hidden",
                isSelected
                  ? `${option.borderColor} bg-gradient-to-br ${option.color}`
                  : "border-border hover:border-muted-foreground/50 bg-muted/20"
              )}
            >
              <span className="text-3xl">{option.emoji}</span>
              <span className={cn(
                "font-display text-base",
                isSelected ? "text-foreground" : "text-foreground"
              )}>
                {option.label}
              </span>
              <span className="text-xs text-muted-foreground leading-tight line-clamp-2">
                {option.description}
              </span>
              {option.requiresValidation && (
                <span className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 bg-accent/80 text-accent-foreground rounded-full flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Validation
                </span>
              )}
              {isSelected && (
                <motion.div
                  layoutId={`role-check-${currentIndex}`}
                  className="absolute top-2 right-2"
                >
                  <div className="w-5 h-5 rounded-full bg-sakura flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

// Step 1: Role Selection (Single-day)
const StepRole = ({ 
  role, 
  setRole 
}: { 
  role: string; 
  setRole: (r: string) => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h3 className="font-display text-xl text-foreground">Choisis ton rôle</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Comment viens-tu à cet événement ?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {roleOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = role === option.value;
          return (
            <motion.button
              key={option.value}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRole(option.value)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all overflow-hidden",
                isSelected
                  ? `${option.borderColor} bg-gradient-to-br ${option.color}`
                  : "border-border hover:border-muted-foreground/50 bg-muted/20"
              )}
            >
              <span className="text-3xl">{option.emoji}</span>
              <span className={cn(
                "font-display text-base",
                isSelected ? "text-foreground" : "text-foreground"
              )}>
                {option.label}
              </span>
              <span className="text-xs text-muted-foreground leading-tight line-clamp-2">
                {option.description}
              </span>
              {option.requiresValidation && (
                <span className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 bg-accent/80 text-accent-foreground rounded-full flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Validation
                </span>
              )}
              {isSelected && (
                <motion.div
                  layoutId="role-check"
                  className="absolute top-2 right-2"
                >
                  <div className="w-5 h-5 rounded-full bg-sakura flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

// Step: Cosplay Selection
const StepCosplay = ({ 
  cosplays,
  selectedCosplayId,
  setSelectedCosplayId,
  onNavigateToSettings,
  dayLabel,
}: { 
  cosplays: CosplayItem[];
  selectedCosplayId: string | null;
  setSelectedCosplayId: (id: string | null) => void;
  onNavigateToSettings: () => void;
  dayLabel?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h3 className="font-display text-xl text-foreground flex items-center justify-center gap-2">
          <span className="text-2xl">🎭</span>
          Choisis ton skin
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {dayLabel 
            ? `Quel cosplay portes-tu le ${dayLabel} ?`
            : "Quel cosplay portes-tu pour cet événement ?"
          }
        </p>
      </div>

      {cosplays.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 max-h-[280px] overflow-y-auto pr-2">
          {/* Secret option */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedCosplayId(null)}
            className={cn(
              "aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all",
              selectedCosplayId === null
                ? "border-sakura bg-sakura/10"
                : "border-dashed border-muted-foreground/30 hover:border-muted-foreground/50"
            )}
          >
            <span className="text-3xl">🤫</span>
            <span className="text-xs text-muted-foreground text-center px-2">Surprise !</span>
            {selectedCosplayId === null && (
              <div className="w-5 h-5 rounded-full bg-sakura flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </motion.button>

          {cosplays.map((cosplay) => (
            <motion.button
              key={cosplay.id}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedCosplayId(cosplay.id)}
              className={cn(
                "relative aspect-[3/4] rounded-xl border-2 overflow-hidden transition-all",
                selectedCosplayId === cosplay.id
                  ? "border-sakura shadow-[0_0_20px_rgba(255,107,107,0.4)]"
                  : "border-transparent hover:border-muted-foreground/50"
              )}
            >
              <img
                src={cosplay.user_image_url}
                alt={cosplay.character_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="font-display text-xs text-white truncate">
                  {cosplay.character_name}
                </p>
                <p className="text-[10px] text-white/60 truncate">
                  {cosplay.universe}
                </p>
              </div>
              {selectedCosplayId === cosplay.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2"
                >
                  <div className="w-6 h-6 rounded-full bg-sakura flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 px-4 rounded-2xl bg-muted/30 border border-dashed border-muted-foreground/30">
          <span className="text-4xl mb-4 block">👕</span>
          <p className="text-sm text-muted-foreground mb-4">
            Ton vestiaire est vide ! Ajoute tes cosplays dans tes paramètres.
          </p>
          <Button
            variant="outline"
            onClick={onNavigateToSettings}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter un cosplay
          </Button>
        </div>
      )}
    </motion.div>
  );
};

// Step: Multi-Day Validation Summary
const StepMultiDayValidation = ({ 
  selectedDays,
  dayConfigs,
  cosplays,
  eventTitle,
}: { 
  selectedDays: Date[];
  dayConfigs: Map<string, { role: string; cosplayId: string | null }>;
  cosplays: CosplayItem[];
  eventTitle: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-sakura/20 to-turquoise/20 flex items-center justify-center">
          <span className="text-4xl">📜</span>
        </div>
        <h3 className="font-display text-xl text-foreground">Ton Manifeste</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Récapitulatif de ta présence à {eventTitle}
        </p>
      </div>

      <div className="space-y-3">
        {selectedDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const config = dayConfigs.get(dateKey);
          const roleInfo = roleOptions.find(r => r.value === config?.role);
          const cosplay = config?.cosplayId ? cosplays.find(c => c.id === config.cosplayId) : null;
          
          return (
            <motion.div
              key={dateKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 rounded-xl border-2 bg-gradient-to-r",
                roleInfo?.color || "from-muted/20 to-muted/10",
                roleInfo?.borderColor || "border-muted"
              )}
            >
              <div className="flex items-center gap-4">
                {/* Date */}
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-background/50 font-display">
                  <span className="text-xl font-bold text-foreground">{format(day, "d")}</span>
                  <span className="text-[10px] uppercase text-muted-foreground">{format(day, "MMM", { locale: fr })}</span>
                </div>
                
                {/* Role & Cosplay */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{roleInfo?.emoji}</span>
                    <span className="font-display text-foreground">{roleInfo?.label}</span>
                  </div>
                  {config?.role === "cosplayer" && cosplay && (
                    <p className="text-sm text-muted-foreground mt-1">
                      🎭 {cosplay.character_name} ({cosplay.universe})
                    </p>
                  )}
                  {config?.role === "cosplayer" && !cosplay && (
                    <p className="text-sm text-muted-foreground mt-1">
                      🤫 Cosplay surprise !
                    </p>
                  )}
                </div>
                
                {/* Cosplay avatar */}
                {cosplay && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white/20">
                    <img 
                      src={cosplay.user_image_url} 
                      alt={cosplay.character_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// Step: Single-Day Validation Summary
const StepValidation = ({ 
  role,
  cosplay,
  eventTitle
}: { 
  role: string;
  cosplay?: CosplayItem;
  eventTitle: string;
}) => {
  const roleInfo = roleOptions.find(r => r.value === role);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-4">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-sakura/20 to-turquoise/20 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-sakura" />
        </div>
        <h3 className="font-display text-xl text-foreground">Prêt(e) pour l'aventure !</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Vérifie ta participation avant de valider
        </p>
      </div>

      {/* Event Summary */}
      <div className="rounded-2xl bg-muted/30 p-4 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sakura to-turquoise flex items-center justify-center">
            <span className="text-lg">🎌</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Événement</p>
            <p className="font-display text-foreground">{eventTitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
            roleInfo?.color
          )}>
            <span className="text-lg">{roleInfo?.emoji}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ton rôle</p>
            <p className="font-display text-foreground">{roleInfo?.label}</p>
          </div>
        </div>

        {role === "cosplayer" && (
          <div className="flex items-center gap-3 pt-3 border-t border-border/50">
            {cosplay ? (
              <>
                <div className="w-10 h-10 rounded-xl overflow-hidden">
                  <img 
                    src={cosplay.user_image_url} 
                    alt={cosplay.character_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ton cosplay</p>
                  <p className="font-display text-foreground">{cosplay.character_name}</p>
                  <p className="text-xs text-muted-foreground">{cosplay.universe}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <span className="text-lg">🤫</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ton cosplay</p>
                  <p className="font-display text-foreground">Surprise !</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Step: Ticket Check (Post-Wizard)
const StepTicketCheck = ({
  eventTitle,
  ticketingUrl,
  hasTicket,
  onResponse,
}: {
  eventTitle: string;
  ticketingUrl?: string | null;
  hasTicket: boolean | null;
  onResponse: (hasTicket: boolean) => void;
}) => {
  const hasExternalLink = !!ticketingUrl;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6 py-4"
    >
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-turquoise/20 to-sakura/20 flex items-center justify-center">
          <Ticket className="w-10 h-10 text-turquoise" />
        </div>
        <h3 className="font-display text-2xl text-foreground mb-2">
          {hasExternalLink 
            ? "As-tu déjà acheté ton billet ?" 
            : "T'es-tu bien inscrit via la billetterie officielle ?"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Pour <span className="text-foreground font-medium">{eventTitle}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={() => onResponse(true)}
          className="bg-gradient-to-r from-turquoise to-sakura hover:opacity-90 text-white font-display text-lg py-6 gap-2"
        >
          <Check className="w-5 h-5" />
          Oui, c'est bon !
        </Button>

        {hasExternalLink ? (
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => window.open(ticketingUrl!, '_blank')}
              className="w-full py-6 gap-2 border-sakura/30 text-foreground hover:bg-sakura/10"
            >
              <ExternalLink className="w-5 h-5" />
              Prendre ma place
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Cela ouvrira la billetterie officielle dans un nouvel onglet
            </p>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => onResponse(false)}
            className="py-6 text-muted-foreground"
          >
            Non, pas encore
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// Step: Social Share (Post-Wizard)
const StepSocialShare = ({
  eventTitle,
  isNotifying,
  onNotify,
  onSkip,
}: {
  eventTitle: string;
  isNotifying: boolean;
  onNotify: () => void;
  onSkip: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="space-y-6 py-4 text-center"
    >
      {/* Celebration header */}
      <div>
        <motion.div 
          className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-sakura via-turquoise to-accent flex items-center justify-center"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <PartyPopper className="w-12 h-12 text-white" />
        </motion.div>
        
        <motion.h3 
          className="font-display text-2xl text-foreground mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          C'est noté ! 🎉
        </motion.h3>
        
        <motion.p 
          className="text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Tes amis doivent le savoir.
        </motion.p>
      </div>

      {/* Event badge */}
      <motion.div 
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <span className="text-lg">🎌</span>
        <span className="font-medium text-foreground">{eventTitle}</span>
      </motion.div>

      {/* Action buttons */}
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={onNotify}
          disabled={isNotifying}
          className="w-full bg-gradient-to-r from-sakura to-turquoise hover:opacity-90 text-white font-display text-lg py-6 gap-2"
        >
          {isNotifying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Bell className="w-5 h-5" />
              Prévenir mes Nakamas 🔔
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={onSkip}
          disabled={isNotifying}
          className="text-muted-foreground"
        >
          Plus tard
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default RSVPModal;
