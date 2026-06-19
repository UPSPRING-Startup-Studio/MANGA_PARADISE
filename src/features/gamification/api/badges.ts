import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Accès DB aux badges de l'utilisateur (seul point — règle api). */

export type UserBadge = {
  id: string;
  name: string;
  icon: string;
  rarity: string | null;
  earnedAt: string | null;
};

export async function listUserBadges(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserBadge[]> {
  const { data: owned } = await supabase
    .from("user_badges")
    .select("badge_id, earned_at")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  if (!owned || owned.length === 0) return [];

  const ids = owned.map((r) => r.badge_id);
  const { data: badges } = await supabase
    .from("badges")
    .select("id, name, icon, rarity")
    .in("id", ids);

  const byId = new Map((badges ?? []).map((b) => [b.id, b]));

  return owned
    .map((r) => {
      const b = byId.get(r.badge_id);
      if (!b) return null;
      return {
        id: b.id,
        name: b.name,
        icon: b.icon,
        rarity: b.rarity,
        earnedAt: r.earned_at,
      } satisfies UserBadge;
    })
    .filter((b): b is UserBadge => b !== null);
}
