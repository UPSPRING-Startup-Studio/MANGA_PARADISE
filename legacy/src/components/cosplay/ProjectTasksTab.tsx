/**
 * ProjectTasksTab
 * Full Kanban Board for a cosplay project's tasks.
 * Features:
 *  - 3 columns: À Faire (todo), En Cours (in_progress), Terminé (done)
 *  - Drag & Drop via @dnd-kit/core + @dnd-kit/sortable
 *  - Inline task creation per column
 *  - Budget total calculation (sum of all task prices)
 *  - Auto-progress calculation (done / total * 100)
 *  - Supabase mutations on drag end
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import {
  Plus,
  Loader2,
  ListChecks,
  Clock,
  CheckCircle2,
  Euro,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CosplanTask,
  TaskStatus,
  TaskCategory,
  useCosplanTasks,
  useCreateCosplanTask,
  useUpdateCosplanTask,
  useDeleteCosplanTask,
  calculateBudgetFromTasks,
  calculateProgressFromTasks,
  groupTasksByStatus,
} from "@/hooks/useCosplanTasks";
import { KanbanTaskCard, KanbanTaskCardOverlay } from "./KanbanTaskCard";

// ─── Column Config ──────────────────────────────────────────────────────────────

interface ColumnConfig {
  id: TaskStatus;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
  borderColor: string;
  bgColor: string;
  countBg: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: "todo",
    label: "À Faire",
    icon: <ListChecks className="w-4 h-4" />,
    accentColor: "text-white/70",
    glowColor: "shadow-[0_0_15px_rgba(255,255,255,0.05)]",
    borderColor: "border-white/10",
    bgColor: "bg-white/3",
    countBg: "bg-white/10 text-white/60",
  },
  {
    id: "in_progress",
    label: "En Cours",
    icon: <Clock className="w-4 h-4" />,
    accentColor: "text-[hsl(var(--mp-info))]",
    glowColor: "shadow-[0_0_15px_rgba(0,240,255,0.1)]",
    borderColor: "border-[hsl(var(--mp-info))]/20",
    bgColor: "bg-[hsl(var(--mp-info))]/3",
    countBg: "bg-[hsl(var(--mp-info))]/15 text-[hsl(var(--mp-info))]",
  },
  {
    id: "done",
    label: "Terminé",
    icon: <CheckCircle2 className="w-4 h-4" />,
    accentColor: "text-[#00FF88]",
    glowColor: "shadow-[0_0_15px_rgba(0,255,136,0.1)]",
    borderColor: "border-[#00FF88]/20",
    bgColor: "bg-[#00FF88]/3",
    countBg: "bg-[#00FF88]/15 text-[#00FF88]",
  },
];

// ─── Droppable Column ───────────────────────────────────────────────────────────

interface KanbanColumnProps {
  column: ColumnConfig;
  tasks: CosplanTask[];
  onAddTask: (status: TaskStatus, label: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Pick<CosplanTask, "label" | "category" | "price">>) => void;
  onDeleteTask: (taskId: string) => void;
  isOver?: boolean;
}

const KanbanColumn = ({
  column,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: KanbanColumnProps) => {
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const handleAddTask = () => {
    const trimmed = newTaskLabel.trim();
    if (!trimmed) return;
    onAddTask(column.id, trimmed);
    setNewTaskLabel("");
    setIsAddingTask(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAddTask();
    if (e.key === "Escape") {
      setNewTaskLabel("");
      setIsAddingTask(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col rounded-2xl border transition-all duration-300 min-h-[400px]",
        "bg-black/30 backdrop-blur-md",
        column.borderColor,
        isOver
          ? `${column.glowColor} border-opacity-60 scale-[1.01]`
          : "hover:border-opacity-40"
      )}
    >
      {/* Column Header */}
      <div className={cn("flex items-center justify-between p-4 border-b", column.borderColor)}>
        <div className="flex items-center gap-2">
          <span className={column.accentColor}>{column.icon}</span>
          <h3 className={cn("font-display text-sm font-semibold", column.accentColor)}>
            {column.label}
          </h3>
        </div>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", column.countBg)}>
          {tasks.length}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-3 space-y-2 transition-all duration-200 rounded-b-2xl",
          isOver && "bg-white/3"
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <KanbanTaskCard
                key={task.id}
                task={task}
                onUpdate={(updates) => onUpdateTask(task.id, updates)}
                onDelete={() => onDeleteTask(task.id)}
              />
            ))}
          </AnimatePresence>
        </SortableContext>

        {/* Empty State */}
        {tasks.length === 0 && !isOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-2 opacity-30", column.bgColor)}>
              {column.icon}
            </div>
            <p className="text-xs text-white/30">Glisse une tâche ici</p>
          </motion.div>
        )}

        {/* Drop Indicator */}
        {isOver && tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "h-16 rounded-xl border-2 border-dashed flex items-center justify-center",
              column.borderColor
            )}
          >
            <p className={cn("text-xs", column.accentColor)}>Déposer ici</p>
          </motion.div>
        )}
      </div>

      {/* Add Task Footer */}
      <div className={cn("p-3 border-t", column.borderColor)}>
        <AnimatePresence mode="wait">
          {isAddingTask ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <Input
                autoFocus
                value={newTaskLabel}
                onChange={(e) => setNewTaskLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nom de la tâche..."
                className="h-8 text-sm bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[hsl(var(--mp-primary))]/60"
              />
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  onClick={handleAddTask}
                  disabled={!newTaskLabel.trim()}
                  className="h-7 px-3 text-xs bg-[hsl(var(--mp-primary))] hover:bg-[hsl(var(--mp-primary))]/80 text-white flex-1"
                >
                  Ajouter
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNewTaskLabel("");
                    setIsAddingTask(false);
                  }}
                  className="h-7 px-2 text-xs text-white/50 hover:text-white hover:bg-white/10"
                >
                  Annuler
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingTask(true)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
                "text-white/40 hover:text-white/70",
                "hover:bg-white/5 transition-all duration-200",
                "border border-dashed border-white/10 hover:border-white/20"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter une tâche
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── Budget & Progress Summary Bar ─────────────────────────────────────────────

interface KanbanSummaryProps {
  tasks: CosplanTask[];
  totalBudget: number;
  progress: number;
}

const KanbanSummary = ({ tasks, totalBudget, progress }: KanbanSummaryProps) => {
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;

  const progressColor =
    progress === 100
      ? "#00FF00"
      : progress >= 75
      ? "#00FF88"
      : progress >= 50
      ? "#00D4FF"
      : "hsl(var(--mp-info))";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Progress Section */}
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[hsl(var(--mp-info))]" />
              <span className="text-xs text-white/60 font-medium">Progression</span>
              <span className="text-xs text-white/40">
                ({doneCount}/{totalCount} tâches)
              </span>
            </div>
            <motion.span
              className="text-lg font-bold"
              style={{ color: progressColor }}
              animate={{ scale: progress === 100 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              {progress}%
            </motion.span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                backgroundColor: progressColor,
                boxShadow: `0 0 10px ${progressColor}60`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            />
            {progress === 100 && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              />
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-10 bg-white/10" />

        {/* Budget Section */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--mp-saffron))]/10 border border-[hsl(var(--mp-saffron))]/20 flex items-center justify-center">
            <Euro className="w-5 h-5 text-[hsl(var(--mp-saffron))]" />
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider">Budget Total</p>
            <p className="text-xl font-bold text-[hsl(var(--mp-saffron))]">
              {totalBudget.toFixed(2)} €
            </p>
          </div>
        </div>

        {/* Completion Badge */}
        {progress === 100 && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00FF88]/15 border border-[#00FF88]/30 text-[#00FF88] text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            TERMINÉ !
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────

interface ProjectTasksTabProps {
  planId: string;
  userId: string;
  autoProgress: boolean;
  onBudgetChange?: (budget: number) => void;
  onProgressChange?: (progress: number) => void;
}

export const ProjectTasksTab = ({
  planId,
  userId,
  autoProgress,
  onBudgetChange,
  onProgressChange,
}: ProjectTasksTabProps) => {
  const [activeTask, setActiveTask] = useState<CosplanTask | null>(null);

  // ── Data ──
  const { data: tasks = [], isLoading } = useCosplanTasks(planId);
  const createTaskMutation = useCreateCosplanTask();
  const updateTaskMutation = useUpdateCosplanTask();
  const deleteTaskMutation = useDeleteCosplanTask();

  // ── Computed Values ──
  const groupedTasks = useMemo(() => groupTasksByStatus(tasks), [tasks]);
  const totalBudget = useMemo(() => calculateBudgetFromTasks(tasks), [tasks]);
  const progress = useMemo(() => calculateProgressFromTasks(tasks), [tasks]);

  // Notify parent of budget/progress changes
  useEffect(() => {
    onBudgetChange?.(totalBudget);
  }, [totalBudget, onBudgetChange]);

  useEffect(() => {
    if (autoProgress) {
      onProgressChange?.(progress);
    }
  }, [progress, autoProgress, onProgressChange]);

  // ── DnD Sensors ──
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );

  // ── Handlers ──

  const handleAddTask = useCallback(
    (status: TaskStatus, label: string) => {
      createTaskMutation.mutate({ planId, label, status });
    },
    [planId, createTaskMutation]
  );

  const handleUpdateTask = useCallback(
    (taskId: string, updates: Partial<Pick<CosplanTask, "label" | "category" | "price">>) => {
      updateTaskMutation.mutate({ taskId, planId, ...updates });
    },
    [planId, updateTaskMutation]
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      deleteTaskMutation.mutate({ taskId, planId });
    },
    [planId, deleteTaskMutation]
  );

  // ── DnD Events ──

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Determine target column
    // overId can be either a column id (TaskStatus) or a task id
    const targetStatus = (["todo", "in_progress", "done"] as TaskStatus[]).includes(
      overId as TaskStatus
    )
      ? (overId as TaskStatus)
      : tasks.find((t) => t.id === overId)?.status;

    if (!targetStatus) return;

    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask || currentTask.status === targetStatus) return;

    // Optimistic update + Supabase mutation
    updateTaskMutation.mutate({
      taskId,
      planId,
      status: targetStatus,
    });
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Allow real-time visual feedback during drag
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const targetStatus = (["todo", "in_progress", "done"] as TaskStatus[]).includes(
      overId as TaskStatus
    )
      ? (overId as TaskStatus)
      : tasks.find((t) => t.id === overId)?.status;

    if (!targetStatus) return;
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask || currentTask.status === targetStatus) return;
  };

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[hsl(var(--mp-primary))] animate-spin" />
          <p className="text-sm text-white/50">Chargement du Kanban...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Bar: Budget + Progress */}
      <KanbanSummary tasks={tasks} totalBudget={totalBudget} progress={progress} />

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={groupedTasks[column.id]}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>

        {/* Drag Overlay - Ghost card while dragging */}
        <DragOverlay>
          {activeTask ? <KanbanTaskCardOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
