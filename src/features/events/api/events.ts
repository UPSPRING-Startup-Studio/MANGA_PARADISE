import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { EventRow, EventType } from "@/features/events/lib";

/** Accès DB en lecture aux événements (seul point — règle des modules api). */

export type EventScheduleRow =
  Database["public"]["Tables"]["event_schedule"]["Row"];

export async function listPublishedEvents(
  supabase: SupabaseClient<Database>,
  filters: { city?: string; type?: EventType } = {},
): Promise<EventRow[]> {
  let q = supabase.from("events").select("*").eq("status", "published");
  if (filters.city) q = q.eq("city", filters.city);
  if (filters.type) q = q.eq("type_evenement", filters.type);
  const { data, error } = await q.order("date", { ascending: true });
  if (error || !data) return [];
  return data;
}

export async function getEventById(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<EventRow | null> {
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export async function listEventSchedule(
  supabase: SupabaseClient<Database>,
  eventId: string,
): Promise<EventScheduleRow[]> {
  const { data, error } = await supabase
    .from("event_schedule")
    .select("*")
    .eq("event_id", eventId)
    .order("day_date", { ascending: true })
    .order("time", { ascending: true });
  if (error || !data) return [];
  return data;
}

export async function countParticipants(
  supabase: SupabaseClient<Database>,
  eventId: string,
): Promise<number> {
  const { count } = await supabase
    .from("event_participants")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);
  return count ?? 0;
}

export async function getEventsByIds(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<EventRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .in("id", ids);
  if (error || !data) return [];
  return data;
}
