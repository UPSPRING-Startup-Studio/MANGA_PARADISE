import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Participation (event_participants) et favoris (user_favorites, type 'event'). */

export async function listMyParticipationIds(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("event_participants")
    .select("event_id")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.event_id);
}

export async function listMyFavoriteEventIds(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("user_favorites")
    .select("favoritable_id")
    .eq("user_id", userId)
    .eq("favoritable_type", "event");
  return (data ?? []).map((r) => r.favoritable_id);
}

export async function isParticipating(
  supabase: SupabaseClient<Database>,
  userId: string,
  eventId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("event_participants")
    .select("id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .maybeSingle();
  return Boolean(data);
}

export function addParticipation(
  supabase: SupabaseClient<Database>,
  userId: string,
  eventId: string,
) {
  return supabase
    .from("event_participants")
    .insert({ user_id: userId, event_id: eventId });
}

export function removeParticipation(
  supabase: SupabaseClient<Database>,
  userId: string,
  eventId: string,
) {
  return supabase
    .from("event_participants")
    .delete()
    .eq("user_id", userId)
    .eq("event_id", eventId);
}

export async function isFavoriteEvent(
  supabase: SupabaseClient<Database>,
  userId: string,
  eventId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("favoritable_type", "event")
    .eq("favoritable_id", eventId)
    .maybeSingle();
  return Boolean(data);
}

export function addFavoriteEvent(
  supabase: SupabaseClient<Database>,
  userId: string,
  eventId: string,
) {
  return supabase.from("user_favorites").insert({
    user_id: userId,
    favoritable_type: "event",
    favoritable_id: eventId,
  });
}

export function removeFavoriteEvent(
  supabase: SupabaseClient<Database>,
  userId: string,
  eventId: string,
) {
  return supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("favoritable_type", "event")
    .eq("favoritable_id", eventId);
}
