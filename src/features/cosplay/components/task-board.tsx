"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { X } from "lucide-react";
import { addTask, moveTask, removeTask } from "@/features/cosplay/actions";
import {
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  isTaskStatus,
  type CosplayTask,
  type TaskCategory,
  type TaskStatus,
} from "@/features/cosplay/lib";
import { cn } from "@/lib/utils";

type Optimist =
  | { type: "move"; id: string; status: TaskStatus }
  | { type: "remove"; id: string };

export function TaskBoard({
  planId,
  tasks,
}: {
  planId: string;
  tasks: CosplayTask[];
}) {
  const [optimisticTasks, apply] = useOptimistic(
    tasks,
    (state: CosplayTask[], action: Optimist) => {
      if (action.type === "move")
        return state.map((t) =>
          t.id === action.id ? { ...t, status: action.status } : t,
        );
      return state.filter((t) => t.id !== action.id);
    },
  );
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  function onDragEnd(e: DragEndEvent) {
    const id = String(e.active.id);
    const over = e.over?.id;
    if (!over) return;
    const status = String(over);
    if (!isTaskStatus(status)) return;
    const task = optimisticTasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    startTransition(() => {
      apply({ type: "move", id, status });
      void moveTask(planId, id, status);
    });
  }

  function onRemove(id: string) {
    startTransition(() => {
      apply({ type: "remove", id });
      void removeTask(planId, id);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <AddTaskForm planId={planId} />
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {TASK_STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={optimisticTasks.filter((t) => t.status === status)}
              onRemove={onRemove}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function Column({
  status,
  tasks,
  onRemove,
}: {
  status: TaskStatus;
  tasks: CosplayTask[];
  onRemove: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-muted/40 flex min-w-[240px] flex-1 flex-col gap-2 rounded-xl p-2",
        isOver && "ring-mp-primary/50 ring-2",
      )}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase">
          {TASK_STATUS_LABELS[status]}
        </span>
        <span className="text-muted-foreground text-xs">{tasks.length}</span>
      </div>
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function TaskCard({
  task,
  onRemove,
}: {
  task: CosplayTask;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={
        transform
          ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
          : undefined
      }
      className={cn(
        "border-border bg-card flex items-start justify-between gap-2 rounded-lg border p-2 text-sm",
        isDragging && "opacity-60 shadow-lg",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex-1 cursor-grab text-left active:cursor-grabbing"
      >
        <span className="font-medium">{task.label}</span>
        <span className="text-muted-foreground block text-xs">
          {TASK_CATEGORY_LABELS[task.category as TaskCategory] ?? task.category}
        </span>
      </button>
      <button
        type="button"
        aria-label="Supprimer la tâche"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onRemove(task.id)}
        className="text-muted-foreground hover:text-destructive shrink-0"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function AddTaskForm({ planId }: { planId: string }) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<TaskCategory>("craft");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = label.trim();
    if (!value) return;
    startTransition(async () => {
      await addTask(planId, { label: value, category });
      setLabel("");
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Nouvelle tâche…"
        className="border-input bg-background focus-visible:ring-ring/50 h-9 flex-1 rounded-lg border px-3 text-sm outline-none focus-visible:ring-[3px]"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as TaskCategory)}
        className="border-input bg-background h-9 rounded-lg border px-2 text-sm"
      >
        {TASK_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {TASK_CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="bg-mp-primary text-primary-foreground h-9 rounded-lg px-4 text-sm font-semibold"
      >
        Ajouter
      </button>
    </form>
  );
}
