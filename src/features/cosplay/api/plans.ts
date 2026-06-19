import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CosplayPlan } from "@/features/cosplay/lib";

type PlanInsert = Database["public"]["Tables"]["cosplay_plans"]["Insert"];
type PlanUpdate = Database["public"]["Tables"]["cosplay_plans"]["Update"];

export async function listMyPlans(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<CosplayPlan[]> {
  const { data } = await supabase
    .from("cosplay_plans")
    .select("*")
    .eq("user_id", userId)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPlanById(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<CosplayPlan | null> {
  const { data } = await supabase
    .from("cosplay_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export async function insertPlan(
  supabase: SupabaseClient<Database>,
  plan: PlanInsert,
): Promise<{ id: string | null; error: boolean }> {
  const { data, error } = await supabase
    .from("cosplay_plans")
    .insert(plan)
    .select("id")
    .single();
  return { id: data?.id ?? null, error: Boolean(error) };
}

export function updatePlanById(
  supabase: SupabaseClient<Database>,
  id: string,
  patch: PlanUpdate,
) {
  return supabase.from("cosplay_plans").update(patch).eq("id", id);
}

export function deletePlanById(supabase: SupabaseClient<Database>, id: string) {
  return supabase.from("cosplay_plans").delete().eq("id", id);
}
