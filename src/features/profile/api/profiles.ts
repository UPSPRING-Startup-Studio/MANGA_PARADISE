import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Acces DB au profil (seul point, cf. regle des modules api de chaque feature). */

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type ProfilePrivateUpdate =
  Database["public"]["Tables"]["profiles_private"]["Update"];
export type PublicProfile =
  Database["public"]["Views"]["public_profiles"]["Row"];

export async function fetchProfileById(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

/** Profil public (vue safe) par nom d'utilisateur — lisible en anonyme. */
export async function fetchPublicProfileByUsername(
  supabase: SupabaseClient<Database>,
  username: string,
): Promise<PublicProfile | null> {
  const { data } = await supabase
    .from("public_profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  return data ?? null;
}

export async function updateProfileById(
  supabase: SupabaseClient<Database>,
  id: string,
  patch: ProfileUpdate,
) {
  return supabase.from("profiles").update(patch).eq("id", id);
}

export async function updateProfilePrivateById(
  supabase: SupabaseClient<Database>,
  id: string,
  patch: ProfilePrivateUpdate,
) {
  return supabase.from("profiles_private").update(patch).eq("id", id);
}
