import { Check, Clock, Eye, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LabsStatus } from "@/hooks/useLabsIdeas";

interface LabsStatusTimelineProps {
  currentStatus: LabsStatus;
}

const statusSteps = [
  { key: "draft", label: "Brouillon", icon: Clock },
  { key: "voting", label: "En Vote", icon: Star },
  { key: "review", label: "En Examen", icon: Eye },
  { key: "approved", label: "Validé", icon: Check },
];

const statusOrder: Record<LabsStatus, number> = {
  draft: 0,
  voting: 1,
  review: 2,
  approved: 3,
  rejected: -1,
};

export const LabsStatusTimeline = ({ currentStatus }: LabsStatusTimelineProps) => {
  const currentIndex = statusOrder[currentStatus];

  if (currentStatus === "rejected") {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-destructive">
          <X className="w-5 h-5" />
          <span className="font-semibold">Idée non retenue</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Cette idée n'a pas été retenue par l'équipe, mais merci pour la proposition !
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">Progression</h3>
      
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
        <div 
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-sakura to-turquoise transition-all duration-500"
          style={{ width: `${(currentIndex / (statusSteps.length - 1)) * 100}%` }}
        />

        {statusSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="relative flex flex-col items-center z-10">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isCompleted
                    ? "bg-sakura border-sakura text-white"
                    : isCurrent
                    ? "bg-turquoise border-turquoise text-white animate-pulse"
                    : "bg-background border-border text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  "text-xs mt-2 font-medium",
                  isCurrent ? "text-turquoise" : isCompleted ? "text-sakura" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
