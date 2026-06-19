import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  CosplayTask,
  TaskCategory,
  TaskStatus,
} from "@/features/cosplay/lib";

export async function listPlanTasks(
  supabase: SupabaseClient<Database>,
  planId: string,
): Promise<CosplayTask[]> {
  const { data } = await supabase
    .from("cosplay_plan_tasks")
    .select("*")
    .eq("plan_id", planId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export function insertTask(
  supabase: SupabaseClient<Database>,
  planId: string,
  label: string,
  category: TaskCategory,
) {
  return supabase
    .from("cosplay_plan_tasks")
    .insert({ plan_id: planId, label, category });
}

export function updateTaskStatus(
  supabase: SupabaseClient<Database>,
  taskId: string,
  status: TaskStatus,
) {
  return supabase
    .from("cosplay_plan_tasks")
    .update({ status, is_done: status === "done" })
    .eq("id", taskId);
}

export function deleteTask(supabase: SupabaseClient<Database>, taskId: string) {
  return supabase.from("cosplay_plan_tasks").delete().eq("id", taskId);
}
