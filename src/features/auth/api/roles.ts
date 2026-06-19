import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isAppRole, type AppRole } from "@/lib/rbac";

/**
 * Acces aux roles globaux (table user_roles). Seul point d'acces Supabase pour
 * les roles (regle : aucun acces DB hors des modules api de chaque feature).
 *
 * Recoit un client deja construit (serveur ou navigateur) pour rester agnostique
 * du contexte d'execution.
 */
export async function fetchUserRoles(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error || !data) return [];

  return data.map((row) => row.role).filter(isAppRole);
}
