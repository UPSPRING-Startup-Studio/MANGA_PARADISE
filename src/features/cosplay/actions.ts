"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation";
import {
  deletePlanById,
  insertPlan,
  updatePlanById,
} from "@/features/cosplay/api/plans";
import {
  deleteTask,
  insertTask,
  updateTaskStatus,
} from "@/features/cosplay/api/tasks";
import {
  planSchema,
  taskSchema,
  type PlanInput,
  type TaskInput,
} from "@/features/cosplay/schemas";
import { isTaskStatus } from "@/features/cosplay/lib";
import {
  PHOTOS_BUCKET,
  deletePhotoRow,
  getPhotoById,
  insertPhoto,
} from "@/features/cosplay/api/photos";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user.id;
}

function s(v?: string): string | null {
  const t = v?.trim();
  return t ? t : null;
}

export async function createPlan(
  values: PlanInput,
): Promise<{ error: string } | void> {
  const parsed = planSchema.safeParse(values);
  if (!parsed.success) return { error: "Champs invalides" };
  const userId = await requireUserId();
  const supabase = await createClient();
  const v = parsed.data;

  const { id, error } = await insertPlan(supabase, {
    user_id: userId,
    character_name: v.characterName,
    universe: v.universe,
    status: v.status,
    target_year: v.targetYear,
    deadline: s(v.deadline),
    budget: v.budget ?? null,
    craft_type: v.craftType ? v.craftType : null,
    notes: s(v.notes),
    image_url: s(v.imageUrl),
  });
  if (error || !id) return { error: "Création impossible, réessaie" };

  revalidatePath("/cosplay");
  redirect(`/cosplay/${id}`);
}

export async function updatePlan(
  id: string,
  values: PlanInput,
): Promise<{ error: string } | void> {
  if (!uuid.safeParse(id).success) return { error: "Projet invalide" };
  const parsed = planSchema.safeParse(values);
  if (!parsed.success) return { error: "Champs invalides" };
  await requireUserId();
  const supabase = await createClient();
  const v = parsed.data;

  const { error } = await updatePlanById(supabase, id, {
    character_name: v.characterName,
    universe: v.universe,
    status: v.status,
    target_year: v.targetYear,
    deadline: s(v.deadline),
    budget: v.budget ?? null,
    craft_type: v.craftType ? v.craftType : null,
    notes: s(v.notes),
    image_url: s(v.imageUrl),
  });
  if (error) return { error: "Enregistrement impossible, réessaie" };

  revalidatePath("/cosplay");
  revalidatePath(`/cosplay/${id}`);
  redirect(`/cosplay/${id}`);
}

export async function deletePlan(id: string): Promise<void> {
  if (!uuid.safeParse(id).success) return;
  await requireUserId();
  const supabase = await createClient();
  await deletePlanById(supabase, id);
  revalidatePath("/cosplay");
  redirect("/cosplay");
}

export async function addTask(
  planId: string,
  values: TaskInput,
): Promise<{ error: string } | void> {
  if (!uuid.safeParse(planId).success) return { error: "Projet invalide" };
  const parsed = taskSchema.safeParse(values);
  if (!parsed.success) return { error: "Champs invalides" };
  await requireUserId();
  const supabase = await createClient();
  const { error } = await insertTask(
    supabase,
    planId,
    parsed.data.label,
    parsed.data.category,
  );
  if (error) return { error: "Ajout impossible" };
  revalidatePath(`/cosplay/${planId}`);
}

export async function moveTask(
  planId: string,
  taskId: string,
  status: string,
): Promise<void> {
  if (!uuid.safeParse(taskId).success || !isTaskStatus(status)) return;
  await requireUserId();
  const supabase = await createClient();
  await updateTaskStatus(supabase, taskId, status);
  revalidatePath(`/cosplay/${planId}`);
}

export async function removeTask(
  planId: string,
  taskId: string,
): Promise<void> {
  if (!uuid.safeParse(taskId).success) return;
  await requireUserId();
  const supabase = await createClient();
  await deleteTask(supabase, taskId);
  revalidatePath(`/cosplay/${planId}`);
}

const PHOTO_TYPES = ["toi", "original", "wip", "shooting", "detail"] as const;

export async function addPhoto(
  planId: string,
  path: string,
  photoType: string,
  caption?: string,
): Promise<{ error: string } | void> {
  if (!uuid.safeParse(planId).success) return { error: "Projet invalide" };
  const type = (PHOTO_TYPES as readonly string[]).includes(photoType)
    ? photoType
    : "shooting";
  const userId = await requireUserId();
  // Le chemin doit appartenir à l'utilisateur (cf. RLS storage : 1er segment = uid).
  if (!path.startsWith(`${userId}/`)) return { error: "Chemin invalide" };

  const supabase = await createClient();
  const { error } = await insertPhoto(supabase, {
    cosplay_id: planId,
    user_id: userId,
    photo_url: path,
    photo_type: type,
    caption: s(caption),
  });
  if (error) return { error: "Enregistrement de la photo impossible" };
  revalidatePath(`/cosplay/${planId}`);
}

export async function removePhoto(
  planId: string,
  photoId: string,
): Promise<void> {
  if (!uuid.safeParse(photoId).success) return;
  await requireUserId();
  const supabase = await createClient();

  const photo = await getPhotoById(supabase, photoId);
  if (photo) {
    await supabase.storage.from(PHOTOS_BUCKET).remove([photo.photo_url]);
    await deletePhotoRow(supabase, photoId);
  }
  revalidatePath(`/cosplay/${planId}`);
}
