import { createClient } from "@/lib/supabase/server";
import {
  fetchProfileById,
  type Profile,
} from "@/features/profile/api/profiles";

/** Lectures serveur du profil (Server Components / layouts). */

/** Profil de l'utilisateur courant, ou null si non connecte. */
export async function getMyProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return fetchProfileById(supabase, user.id);
}
