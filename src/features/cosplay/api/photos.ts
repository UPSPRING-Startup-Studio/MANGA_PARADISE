import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type CosplayPhoto =
  Database["public"]["Tables"]["cosplay_photos"]["Row"];

export const PHOTOS_BUCKET = "cosplay-photos";

export async function listPlanPhotos(
  supabase: SupabaseClient<Database>,
  planId: string,
): Promise<CosplayPhoto[]> {
  const { data } = await supabase
    .from("cosplay_photos")
    .select("*")
    .eq("cosplay_id", planId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPhotoById(
  supabase: SupabaseClient<Database>,
  photoId: string,
): Promise<CosplayPhoto | null> {
  const { data } = await supabase
    .from("cosplay_photos")
    .select("*")
    .eq("id", photoId)
    .maybeSingle();
  return data ?? null;
}

export function insertPhoto(
  supabase: SupabaseClient<Database>,
  row: {
    cosplay_id: string;
    user_id: string;
    photo_url: string;
    photo_type: string;
    caption: string | null;
  },
) {
  return supabase.from("cosplay_photos").insert(row);
}

export function deletePhotoRow(
  supabase: SupabaseClient<Database>,
  photoId: string,
) {
  return supabase.from("cosplay_photos").delete().eq("id", photoId);
}

/** URLs signées (bucket privé) pour une liste de chemins de stockage. */
export async function signPhotoPaths(
  supabase: SupabaseClient<Database>,
  paths: string[],
  expiresIn = 3600,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paths.length === 0) return map;
  const { data } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrls(paths, expiresIn);
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) map.set(item.path, item.signedUrl);
  }
  return map;
}
