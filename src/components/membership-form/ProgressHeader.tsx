import { Progress } from "@/components/ui/progress";

interface ProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  progressPercent: number;
}

const ProgressHeader = ({
  currentStep,
  totalSteps,
  stepTitle,
  progressPercent,
}: ProgressHeaderProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Etape {currentStep + 1} / {totalSteps}
        </span>
        <span className="text-muted-foreground">{progressPercent}%</span>
      </div>
      <Progress value={progressPercent} className="h-2" />
      <h2 className="text-xl font-display text-foreground">{stepTitle}</h2>
    </div>
  );
};

export default ProgressHeader;
