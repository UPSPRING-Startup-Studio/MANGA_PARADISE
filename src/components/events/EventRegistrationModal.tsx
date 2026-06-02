import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  User,
  Camera,
  Heart,
  Users,
  Check,
  Sparkles,
} from "lucide-react";
import { useCosplayVestiaire, CosplayItem } from "@/hooks/useCosplayVestiaire";
import { EVENT_ROLES } from "@/lib/constants";
import { format, parseISO, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import confetti from "canvas-confetti";

interface EventRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle: string;
  eventId: string;
  userId: string;
  onSubmit: (data: RegistrationData) => Promise<void>;
  isLoading?: boolean;
  eventStartDate?: string;
  eventEndDate?: string | null;
}

export interface RegistrationData {
  role: string;
  attendance_dates: string[];
  cosplay_data: Array<{
    character: string;
    universe: string;
    imageUrl: string;
    cosplayId: string;
  }> | null;
}

// Role options with icons
const roleOptions = [
  {
    value: EVENT_ROLES.visitor.value,
    label: "Visiteur",
    emoji: EVENT_ROLES.visitor.emoji,
    icon: User,
    color: "from-slate-400 to-slate-500",
    description: "Juste pour voir",
  },
  {
    value: EVENT_ROLES.cosplayer.value,
    label: "Cosplayeur",
    emoji: EVENT_ROLES.cosplayer.emoji,
    icon: Users,
    color: "from-sakura to-pink-600",
    description: "Je viens costumé",
  },
  {
    value: EVENT_ROLES.volunteer.value,
    label: "Bénévole",
    emoji: EVENT_ROLES.volunteer.emoji,
    icon: Heart,
    color: "from-turquoise to-cyan-600",
    description: "Je viens aider",
  },
  {
    value: "photographer",
    label: "Photographe",
    emoji: "📸",
    icon: Camera,
    color: "from-amber-500 to-orange-600",
    description: "Je viens shooter",
  },
];

export function EventRegistrationModal({
  open,
  onOpenChange,
  eventTitle,
  eventId,
  userId,
  onSubmit,
  isLoading = false,
  eventStartDate,
  eventEndDate,
}: EventRegistrationModalProps) {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedCosplay, setSelectedCosplay] = useState<CosplayItem | null>(null);

  // Fetch user's cosplay vestiaire
  const { data: cosplays = [], isLoading: loadingCosplays } = useCosplayVestiaire(userId);

  // Generate event dates
  const eventDates = useMemo(() => {
    if (!eventStartDate) return [];
    const start = parseISO(eventStartDate);
    const end = eventEndDate ? parseISO(eventEndDate) : start;
    return eachDayOfInterval({ start, end });
  }, [eventStartDate, eventEndDate]);

  // Handle date toggle
  const toggleDate = (dateStr: string) => {
    setSelectedDates((prev) =>
      prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  // Handle next step
  const handleNext = () => {
    if (step === 1 && selectedRole && selectedDates.length > 0) {
      // Skip step 2 if not cosplayer
      if (selectedRole !== EVENT_ROLES.cosplayer.value) {
        setStep(3);
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      setStep(3);
    }
  };

  // Handle back
  const handleBack = () => {
    if (step === 3 && selectedRole !== EVENT_ROLES.cosplayer.value) {
      setStep(1);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!selectedRole || selectedDates.length === 0) return;

    const data: RegistrationData = {
      role: selectedRole,
      attendance_dates: selectedDates,
      cosplay_data:
        selectedRole === EVENT_ROLES.cosplayer.value && selectedCosplay
          ? [
              {
                character: selectedCosplay.character_name,
                universe: selectedCosplay.universe,
                imageUrl: selectedCosplay.user_image_url,
                cosplayId: selectedCosplay.id,
              },
            ]
          : null,
    };

    await onSubmit(data);

    // Confetti effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["hsl(var(--mp-primary))", "hsl(var(--mp-info))", "hsl(var(--mp-saffron))"],
    });

    // Reset and close
    setStep(1);
    setSelectedRole(null);
    setSelectedDates([]);
    setSelectedCosplay(null);
  };

  // Can proceed to next step
  const canProceed = step === 1 ? selectedRole && selectedDates.length > 0 : true;

  // Progress steps (skip step 2 if not cosplayer)
  const progressSteps = selectedRole === EVENT_ROLES.cosplayer.value ? [1, 2, 3] : [1, 3];
  const currentStepIndex = progressSteps.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card border-sakura/20 overflow-hidden p-0">
        {/* Header with Progress */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sakura to-turquoise flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block">Mission Prep</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Prépare ta venue
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

        {/* Content */}
        <div className="p-6 min-h-[320px]">
          <AnimatePresence mode="wait">
            {/* STEP 1: Role & Planning */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Role Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">
                    Comment viens-tu ?
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {roleOptions.map((role) => {
                      const Icon = role.icon;
                      const isSelected = selectedRole === role.value;

                      return (
                        <motion.button
                          key={role.value}
                          onClick={() => setSelectedRole(role.value)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "relative p-4 rounded-xl border-2 transition-all duration-300",
                            "bg-card",
                            isSelected
                              ? "border-sakura shadow-lg shadow-sakura/20"
                              : "border-border hover:border-sakura/50"
                          )}
                        >
                          <div className="flex flex-col items-center gap-2 text-center">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-lg flex items-center justify-center",
                                `bg-gradient-to-br ${role.color}`
                              )}
                            >
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground flex items-center justify-center gap-1">
                                <span>{role.emoji}</span>
                                <span>{role.label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {role.description}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-sakura flex items-center justify-center"
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">
                    Quels jours ?
                  </h3>
                  <div className="space-y-2">
                    {eventDates.map((date) => {
                      const dateStr = format(date, "yyyy-MM-dd");
                      const isSelected = selectedDates.includes(dateStr);

                      return (
                        <motion.label
                          key={dateStr}
                          whileHover={{ scale: 1.01 }}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                            "bg-card",
                            isSelected
                              ? "border-sakura shadow-md shadow-sakura/10"
                              : "border-border hover:border-sakura/50"
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleDate(dateStr)}
                            className="border-muted-foreground data-[state=checked]:bg-sakura data-[state=checked]:border-sakura"
                          />
                          <span className="font-medium text-foreground">
                            {format(date, "EEEE d MMMM", { locale: fr })}
                          </span>
                        </motion.label>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Cosplay Selection (Conditional) */}
            {step === 2 && selectedRole === EVENT_ROLES.cosplayer.value && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  Choisis ton cosplay
                </h3>

                {loadingCosplays ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-sakura" />
                  </div>
                ) : cosplays.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Sparkles className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Ton vestiaire est vide. Ajoute un cosplay d'abord !
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {cosplays.map((cosplay) => {
                      const isSelected = selectedCosplay?.id === cosplay.id;

                      return (
                        <motion.button
                          key={cosplay.id}
                          onClick={() => setSelectedCosplay(cosplay)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "relative rounded-xl overflow-hidden border-2 transition-all",
                            isSelected
                              ? "border-sakura shadow-lg shadow-sakura/20"
                              : "border-border hover:border-sakura/50"
                          )}
                        >
                          <div className="aspect-[3/4] relative">
                            <img
                              src={cosplay.user_image_url}
                              alt={cosplay.character_name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <p className="font-semibold text-sm text-white">
                                {cosplay.character_name}
                              </p>
                              <p className="text-xs text-white/80">
                                {cosplay.universe}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-sakura flex items-center justify-center"
                            >
                              <Check className="w-5 h-5 text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: Validation */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  Récapitulatif
                </h3>

                <div className="space-y-4 p-6 rounded-xl bg-muted/30 border border-border">
                  {/* Role */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Rôle</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gradient-to-r from-sakura to-turquoise text-white">
                        {roleOptions.find((r) => r.value === selectedRole)?.emoji}{" "}
                        {roleOptions.find((r) => r.value === selectedRole)?.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Jours</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDates.map((dateStr) => (
                        <Badge
                          key={dateStr}
                          variant="outline"
                          className="border-sakura text-sakura"
                        >
                          {format(parseISO(dateStr), "EEE d MMM", { locale: fr })}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Cosplay (if selected) */}
                  {selectedCosplay && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Cosplay</p>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                        <img
                          src={selectedCosplay.user_image_url}
                          alt={selectedCosplay.character_name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-semibold text-foreground">
                            {selectedCosplay.character_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedCosplay.universe}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between px-6 pb-6 pt-4 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1 || isLoading}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>

          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed || isLoading}
              className="bg-gradient-to-r from-sakura to-turquoise hover:opacity-90 text-white"
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-gradient-to-r from-sakura to-turquoise hover:opacity-90 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Inscription...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Valider mon inscription
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
