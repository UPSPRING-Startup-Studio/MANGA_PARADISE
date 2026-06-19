import { createClient } from "@/lib/supabase/server";
import { getPlanById, listMyPlans } from "@/features/cosplay/api/plans";
import { listPlanTasks } from "@/features/cosplay/api/tasks";
import { listPlanPhotos, signPhotoPaths } from "@/features/cosplay/api/photos";
import type { CosplayPlan, CosplayTask } from "@/features/cosplay/lib";

export type PhotoView = {
  id: string;
  url: string | null;
  photoType: string;
  caption: string | null;
};

export async function getMyVestiaire(): Promise<CosplayPlan[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return listMyPlans(supabase, user.id);
}

export async function getPlanDetail(id: string): Promise<{
  plan: CosplayPlan;
  tasks: CosplayTask[];
  photos: PhotoView[];
} | null> {
  const supabase = await createClient();
  const plan = await getPlanById(supabase, id);
  if (!plan) return null;

  const [tasks, photoRows] = await Promise.all([
    listPlanTasks(supabase, id),
    listPlanPhotos(supabase, id),
  ]);

  const signed = await signPhotoPaths(
    supabase,
    photoRows.map((p) => p.photo_url),
  );
  const photos: PhotoView[] = photoRows.map((p) => ({
    id: p.id,
    url: signed.get(p.photo_url) ?? null,
    photoType: p.photo_type,
    caption: p.caption,
  }));

  return { plan, tasks, photos };
}
