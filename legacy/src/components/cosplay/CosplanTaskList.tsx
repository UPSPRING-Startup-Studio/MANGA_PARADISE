import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Trash2, 
  ListChecks,
  Calculator,
  Loader2,
  Gauge
} from "lucide-react";
import {
  useCosplanTasks,
  useCreateCosplanTask,
  useToggleCosplanTask,
  useDeleteCosplanTask,
  calculateProgressFromTasks,
} from "@/hooks/useCosplanTasks";
import { useUpdateCosplan } from "@/hooks/useCosplans";

interface CosplanTaskListProps {
  planId: string;
  userId: string;
  autoProgress: boolean;
  currentProgress: number;
  onAutoProgressChange: (enabled: boolean) => void;
  onProgressChange: (progress: number) => void;
}

export const CosplanTaskList = ({
  planId,
  userId,
  autoProgress,
  currentProgress,
  onAutoProgressChange,
  onProgressChange,
}: CosplanTaskListProps) => {
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [manualProgress, setManualProgress] = useState(currentProgress);
  
  const { data: tasks = [], isLoading } = useCosplanTasks(planId);
  const createTaskMutation = useCreateCosplanTask();
  const toggleTaskMutation = useToggleCosplanTask();
  const deleteTaskMutation = useDeleteCosplanTask();
  const updateCosplanMutation = useUpdateCosplan();

  // Calculate progress from tasks when auto_progress is enabled
  const calculatedProgress = calculateProgressFromTasks(tasks);
  const displayProgress = autoProgress ? calculatedProgress : manualProgress;
  const doneCount = tasks.filter(t => t.is_done).length;

  // Sync manual progress with current progress
  useEffect(() => {
    setManualProgress(currentProgress);
  }, [currentProgress]);

  // Dynamic color based on progress (Cyan → Green)
  const getProgressColor = (progress: number): string => {
    if (progress === 0) return "hsl(var(--mp-info))"; // Cyan
    if (progress < 50) return "hsl(var(--mp-info))"; // Cyan
    if (progress < 75) return "#00D4FF"; // Cyan-Green transition
    if (progress < 100) return "#00FF88"; // Light Green
    return "#00FF00"; // Neon Green at 100%
  };

  const progressColor = getProgressColor(displayProgress);

  // Update cosplan progress when auto mode and tasks change
  useEffect(() => {
    if (autoProgress && tasks.length > 0 && calculatedProgress !== currentProgress) {
      updateCosplanMutation.mutate({
        id: planId,
        userId,
        progress_level: calculatedProgress,
      });
      onProgressChange(calculatedProgress);
    }
  }, [calculatedProgress, autoProgress, tasks.length]);

  const handleAddTask = async () => {
    if (!newTaskLabel.trim()) return;
    
    await createTaskMutation.mutateAsync({
      planId,
      label: newTaskLabel.trim(),
    });
    setNewTaskLabel("");
  };

  const handleToggleTask = async (taskId: string, currentDone: boolean) => {
    await toggleTaskMutation.mutateAsync({
      taskId,
      planId,
      isDone: !currentDone,
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTaskMutation.mutateAsync({ taskId, planId });
  };

  const handleAutoProgressToggle = (enabled: boolean) => {
    onAutoProgressChange(enabled);
    updateCosplanMutation.mutate({
      id: planId,
      userId,
      auto_progress: enabled,
      // If enabling auto-progress, update progress to match tasks
      ...(enabled && tasks.length > 0 && { progress_level: calculatedProgress }),
    });
  };

  const handleManualProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setManualProgress(value);
  };

  const handleManualProgressCommit = () => {
    // Update the cosplan with the new manual progress
    updateCosplanMutation.mutate({
      id: planId,
      userId,
      progress_level: manualProgress,
    });
    onProgressChange(manualProgress);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTask();
    }
  };

  return (
    <div className="space-y-4">
      {/* Bloc Dédié - Gestion de la Progression */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
        {/* Header du bloc avec toggle Auto % */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-[hsl(var(--mp-primary))]" />
            <h3 className="font-display text-base text-white">Gestion de la Progression</h3>
            {tasks.length > 0 && (
              <span className="text-xs text-white/50 font-body">
                ({doneCount}/{tasks.length})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-white/70 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-[hsl(var(--mp-info))]" />
              Auto %
            </Label>
            <Switch
              checked={autoProgress}
              onCheckedChange={handleAutoProgressToggle}
              className="data-[state=checked]:bg-[hsl(var(--mp-info))]"
            />
          </div>
        </div>

        {/* Progress Bar - Animated with color transition */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span className="font-medium">Progression actuelle</span>
            <motion.span
              className="font-bold text-lg"
              style={{ color: progressColor }}
              animate={{
                scale: displayProgress === 100 ? [1, 1.15, 1] : 1
              }}
              transition={{ duration: 0.3 }}
            >
              {displayProgress}%
            </motion.span>
          </div>
          
          {/* Custom animated progress bar */}
          <div className="relative h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                backgroundColor: progressColor,
                boxShadow: `0 0 12px ${progressColor}50`
              }}
              initial={{ width: 0 }}
              animate={{
                width: `${displayProgress}%`,
                boxShadow: `0 0 ${displayProgress === 100 ? '20px' : '12px'} ${progressColor}${displayProgress === 100 ? '80' : '50'}`
              }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 30,
                restDelta: 0.001
              }}
            />
            
            {/* Shimmer effect when complete */}
            {displayProgress === 100 && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "linear"
                }}
              />
            )}
          </div>
          
          {autoProgress && (
            <motion.p
              className="text-[10px] flex items-center gap-1"
              style={{ color: progressColor }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
            >
              <Calculator className="w-3 h-3" />
              Calculé automatiquement selon les tâches
            </motion.p>
          )}
        </div>

        {/* Manual Progress Slider - Animated Appearance */}
        <AnimatePresence>
          {!autoProgress && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-3 overflow-hidden"
            >
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Gauge className="w-4 h-4 text-[hsl(var(--mp-primary))]" />
                <span className="font-medium">Ajustement manuel</span>
              </div>
              
              {/* Slider Container */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={manualProgress}
                  onChange={handleManualProgressChange}
                  onMouseUp={handleManualProgressCommit}
                  onTouchEnd={handleManualProgressCommit}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-5
                    [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-gradient-to-r
                    [&::-webkit-slider-thumb]:from-[hsl(var(--mp-primary))]
                    [&::-webkit-slider-thumb]:to-[hsl(var(--mp-primary))]
                    [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(255,0,127,0.6)]
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:transition-all
                    [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-webkit-slider-thumb]:hover:shadow-[0_0_20px_rgba(255,0,127,0.8)]
                    [&::-moz-range-thumb]:w-5
                    [&::-moz-range-thumb]:h-5
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-gradient-to-r
                    [&::-moz-range-thumb]:from-[hsl(var(--mp-primary))]
                    [&::-moz-range-thumb]:to-[hsl(var(--mp-primary))]
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:shadow-[0_0_15px_rgba(255,0,127,0.6)]
                    [&::-moz-range-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:transition-all
                    [&::-moz-range-thumb]:hover:scale-110
                    [&::-moz-range-thumb]:hover:shadow-[0_0_20px_rgba(255,0,127,0.8)]
                    [&::-webkit-slider-runnable-track]:bg-white/10
                    [&::-webkit-slider-runnable-track]:rounded-full
                    [&::-moz-range-track]:bg-white/10
                    [&::-moz-range-track]:rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${progressColor} 0%, ${progressColor} ${manualProgress}%, rgba(255,255,255,0.1) ${manualProgress}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
                
                {/* Progress Markers */}
                <div className="flex justify-between text-[10px] text-white/40 px-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Task Input */}
      <div className="flex gap-2">
        <Input
          value={newTaskLabel}
          onChange={(e) => setNewTaskLabel(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="ex: Acheter la perruque..."
          className="bg-white/5 border-white/20 text-white text-sm placeholder:text-white/40 focus:border-sakura"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAddTask}
          disabled={!newTaskLabel.trim() || createTaskMutation.isPending}
          className="bg-sakura hover:bg-sakura/90 px-3"
        >
          {createTaskMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-sakura animate-spin" />
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10 group"
              >
                <Checkbox
                  checked={task.is_done}
                  onCheckedChange={() => handleToggleTask(task.id, task.is_done)}
                  disabled={toggleTaskMutation.isPending}
                  className="border-white/30 data-[state=checked]:bg-turquoise data-[state=checked]:border-turquoise"
                />
                <span 
                  className={`flex-1 text-sm font-body transition-all ${
                    task.is_done 
                      ? "text-white/40 line-through" 
                      : "text-white"
                  }`}
                >
                  {task.label}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTask(task.id)}
                  disabled={deleteTaskMutation.isPending}
                  className="w-6 h-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p className="text-center text-white/40 text-sm py-3 font-body">
          Ajoute tes premières tâches ! ✨
        </p>
      )}
    </div>
  );
};
