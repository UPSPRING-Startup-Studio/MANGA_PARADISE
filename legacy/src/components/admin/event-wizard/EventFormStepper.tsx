/**
 * EventFormStepper — Navigation visuelle par étapes
 * 
 * Barre horizontale avec indicateurs d'étape, progression et navigation.
 * Design premium avec gradient sakura et animations Framer Motion.
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { WIZARD_STEPS, type WizardStep } from "./eventFormTypes";

interface EventFormStepperProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (step: number) => void;
}

const EventFormStepper = ({ currentStep, completedSteps, onStepClick }: EventFormStepperProps) => {
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="relative h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-sakura to-turquoise rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between gap-1">
        {WIZARD_STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.has(step.id);
          const isPast = step.id < currentStep;
          const isAccessible = isCompleted || isPast || step.id <= currentStep;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => isAccessible && onStepClick(step.id)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200 text-left flex-1 min-w-0",
                isActive && "bg-sakura/10 border border-sakura/30",
                !isActive && isAccessible && "hover:bg-muted/50 cursor-pointer",
                !isAccessible && "opacity-40 cursor-not-allowed"
              )}
            >
              {/* Step Indicator */}
              <div className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                isActive && "bg-sakura text-white shadow-[0_0_12px_rgba(255,107,190,0.4)]",
                isCompleted && !isActive && "bg-turquoise text-white",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}>
                {isCompleted && !isActive ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span>{step.icon}</span>
                )}
              </div>

              {/* Step Label — hidden on mobile for space */}
              <div className="min-w-0 hidden md:block">
                <p className={cn(
                  "text-[10px] font-medium truncate",
                  isActive ? "text-sakura" : "text-muted-foreground"
                )}>
                  {step.shortLabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Current Step Title */}
      <div className="text-center">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="font-display text-lg tracking-wide text-foreground">
            {WIZARD_STEPS[currentStep]?.icon} {WIZARD_STEPS[currentStep]?.label}
          </h3>
          <p className="text-xs text-muted-foreground">
            {WIZARD_STEPS[currentStep]?.description}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default EventFormStepper;
