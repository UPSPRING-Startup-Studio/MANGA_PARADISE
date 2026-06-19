import type { Database } from "@/types/database";

export type CosplayPlan = Database["public"]["Tables"]["cosplay_plans"]["Row"];
export type CosplayTask =
  Database["public"]["Tables"]["cosplay_plan_tasks"]["Row"];
export type CosplanStatus = Database["public"]["Enums"]["cosplan_status"];

export const COSPLAN_STATUSES: CosplanStatus[] = [
  "wishlist",
  "started",
  "paused",
  "finished",
];

export const STATUS_LABELS: Record<CosplanStatus, string> = {
  wishlist: "Wishlist",
  started: "En cours",
  paused: "En pause",
  finished: "Terminé",
};

export const STATUS_STYLES: Record<CosplanStatus, string> = {
  wishlist: "bg-mp-cloud text-mp-ink",
  started: "bg-info/15 text-info",
  paused: "bg-warning/15 text-warning",
  finished: "bg-success/15 text-success",
};

export const CRAFT_LABELS: Record<string, string> = {
  handmade: "Fait main",
  bought: "Acheté",
  mixed: "Mixte",
};

export type TaskCategory = "craft" | "achat" | "dressing";
export type TaskStatus = "todo" | "in_progress" | "done";

export const TASK_CATEGORIES: TaskCategory[] = ["craft", "achat", "dressing"];
export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  craft: "Confection",
  achat: "Achats",
  dressing: "Habillage",
};

export const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Fait",
};

export function isTaskStatus(v: string): v is TaskStatus {
  return (TASK_STATUSES as string[]).includes(v);
}

/** Progression (%) dérivée des tâches faites. */
export function progressFromTasks(
  tasks: Pick<CosplayTask, "status">[],
): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "done").length;
  return Math.round((done / tasks.length) * 100);
}
