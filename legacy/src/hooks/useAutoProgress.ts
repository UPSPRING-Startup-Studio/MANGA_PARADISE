import { useEffect, useState } from "react";
import { useCosplanTasks, calculateProgressFromTasks } from "./useCosplanTasks";

/**
 * Hook to manage automatic progress calculation for a cosplay plan
 * Returns the current progress based on tasks completion when auto_progress is enabled
 */
export const useAutoProgress = (
  planId: string | undefined,
  autoProgress: boolean,
  manualProgress: number
) => {
  const { data: tasks = [] } = useCosplanTasks(planId);
  const [displayProgress, setDisplayProgress] = useState(manualProgress);

  // Calculate progress from tasks
  const calculatedProgress = calculateProgressFromTasks(tasks);

  // Update display progress based on mode
  useEffect(() => {
    if (autoProgress && tasks.length > 0) {
      setDisplayProgress(calculatedProgress);
    } else {
      setDisplayProgress(manualProgress);
    }
  }, [autoProgress, calculatedProgress, manualProgress, tasks.length]);

  // Determine progress bar color based on completion
  const getProgressColor = (progress: number): string => {
    if (progress === 0) return "hsl(var(--mp-info))"; // Cyan
    if (progress < 50) return "hsl(var(--mp-info))"; // Cyan
    if (progress < 75) return "#00D4FF"; // Cyan-Green transition
    if (progress < 100) return "#00FF88"; // Light Green
    return "#00FF00"; // Neon Green at 100%
  };

  return {
    displayProgress,
    calculatedProgress,
    tasks,
    progressColor: getProgressColor(displayProgress),
    isComplete: displayProgress === 100,
  };
};
