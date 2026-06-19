import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type Member = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  city: string | null;
  otakuClass: string | null;
  level: number | null;
};

/** Liste des membres publics (vue `public_profiles` : colonnes safe, visibilité publique). */
export async function listMembers(
  supabase: SupabaseClient<Database>,
  limit = 120,
): Promise<Member[]> {
  const { data } = await supabase
    .from("public_profiles")
    .select("id, username, display_name, avatar_url, city, otaku_class, level")
    .order("level", { ascending: false, nullsFirst: false })
    .limit(limit);

  return (data ?? [])
    .filter((m): m is typeof m & { id: string; username: string } =>
      Boolean(m.id && m.username),
    )
    .map((m) => ({
      id: m.id,
      username: m.username,
      displayName: m.display_name,
      avatarUrl: m.avatar_url,
      city: m.city,
      otakuClass: m.otaku_class,
      level: m.level,
    }));
}
