import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskCategory = "craft" | "achat" | "dressing";

export interface CosplanTask {
  id: string;
  plan_id: string;
  label: string;
  is_done: boolean;
  status: TaskStatus;
  category: TaskCategory;
  price: number | null;
  created_at: string;
}

export interface CreateTaskInput {
  planId: string;
  label: string;
  category?: TaskCategory;
  price?: number | null;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  taskId: string;
  planId: string;
  label?: string;
  is_done?: boolean;
  status?: TaskStatus;
  category?: TaskCategory;
  price?: number | null;
}

// ─── Queries ───────────────────────────────────────────────────────────────────

/** Fetch all tasks for a specific cosplay plan */
export const useCosplanTasks = (planId: string | undefined) => {
  return useQuery({
    queryKey: ["cosplan-tasks", planId],
    queryFn: async () => {
      if (!planId) return [];

      const { data, error } = await supabase
        .from("cosplay_plan_tasks")
        .select("*")
        .eq("plan_id", planId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Normalize: ensure status/category have defaults for old rows
      return (data as CosplanTask[]).map((task) => ({
        ...task,
        status: (task.status as TaskStatus) ?? (task.is_done ? "done" : "todo"),
        category: (task.category as TaskCategory) ?? "craft",
        price: task.price ?? null,
      }));
    },
    enabled: !!planId,
  });
};

// ─── Mutations ─────────────────────────────────────────────────────────────────

/** Create a new task */
export const useCreateCosplanTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, label, category = "craft", price = null, status = "todo" }: CreateTaskInput) => {
      const { data, error } = await supabase
        .from("cosplay_plan_tasks")
        .insert({
          plan_id: planId,
          label,
          category,
          price,
          status,
          is_done: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplan-tasks", variables.planId] });
    },
    onError: (error) => {
      console.error("Error creating task:", error);
      toast.error("Erreur lors de l'ajout de la tâche");
    },
  });
};

/** Update a task (label, status, category, price) */
export const useUpdateCosplanTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, planId, ...updates }: UpdateTaskInput) => {
      // Sync is_done with status
      const syncedUpdates: Record<string, unknown> = { ...updates };
      if (updates.status !== undefined) {
        syncedUpdates.is_done = updates.status === "done";
      }

      const { data, error } = await supabase
        .from("cosplay_plan_tasks")
        .update(syncedUpdates)
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplan-tasks", variables.planId] });
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      toast.error("Erreur lors de la mise à jour de la tâche");
    },
  });
};

/** Toggle task done status (legacy support for CosplanTaskList) */
export const useToggleCosplanTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, planId, isDone }: { taskId: string; planId: string; isDone: boolean }) => {
      const { data, error } = await supabase
        .from("cosplay_plan_tasks")
        .update({
          is_done: isDone,
          status: isDone ? "done" : "todo",
        })
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplan-tasks", variables.planId] });
    },
    onError: (error) => {
      console.error("Error toggling task:", error);
      toast.error("Erreur lors de la mise à jour de la tâche");
    },
  });
};

/** Delete a task */
export const useDeleteCosplanTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, planId }: { taskId: string; planId: string }) => {
      const { error } = await supabase
        .from("cosplay_plan_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
      return { taskId, planId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplan-tasks", variables.planId] });
    },
    onError: (error) => {
      console.error("Error deleting task:", error);
      toast.error("Erreur lors de la suppression de la tâche");
    },
  });
};

// ─── Utility Functions ─────────────────────────────────────────────────────────

/** Calculate progress from tasks (done / total * 100) */
export const calculateProgressFromTasks = (tasks: CosplanTask[]): number => {
  if (tasks.length === 0) return 0;
  const doneTasks = tasks.filter((t) => t.status === "done" || t.is_done).length;
  return Math.round((doneTasks / tasks.length) * 100);
};

/** Calculate total budget from all tasks with a price */
export const calculateBudgetFromTasks = (tasks: CosplanTask[]): number => {
  return tasks.reduce((sum, task) => sum + (task.price ?? 0), 0);
};

/** Group tasks by Kanban status */
export const groupTasksByStatus = (tasks: CosplanTask[]): Record<TaskStatus, CosplanTask[]> => {
  return {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    done: tasks.filter((t) => t.status === "done"),
  };
};
