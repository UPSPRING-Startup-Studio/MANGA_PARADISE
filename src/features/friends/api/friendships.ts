import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type FriendshipRow = Database["public"]["Tables"]["friendships"]["Row"];

export type Person = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

/** Relation entre l'utilisateur courant et une autre personne (vue côté `me`). */
export type RelationState =
  | { kind: "none" }
  | { kind: "friends"; friendshipId: string }
  | { kind: "incoming"; friendshipId: string }
  | { kind: "outgoing"; friendshipId: string };

async function fetchPeople(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<Map<string, Person>> {
  const map = new Map<string, Person>();
  if (ids.length === 0) return map;
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", ids);
  for (const p of data ?? [])
    map.set(p.id, {
      id: p.id,
      username: p.username,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
    });
  return map;
}

export type FriendItem = { friendshipId: string; person: Person };

async function joinPeople(
  supabase: SupabaseClient<Database>,
  rows: FriendshipRow[],
  pick: (r: FriendshipRow) => string,
): Promise<FriendItem[]> {
  const people = await fetchPeople(supabase, rows.map(pick));
  return rows
    .map((r) => {
      const person = people.get(pick(r));
      return person ? { friendshipId: r.id, person } : null;
    })
    .filter((x): x is FriendItem => x !== null);
}

export async function listFriends(
  supabase: SupabaseClient<Database>,
  myId: string,
): Promise<FriendItem[]> {
  const { data } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "accepted")
    .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`);
  const rows = data ?? [];
  return joinPeople(supabase, rows, (r) =>
    r.requester_id === myId ? r.addressee_id : r.requester_id,
  );
}

export async function listIncoming(
  supabase: SupabaseClient<Database>,
  myId: string,
): Promise<FriendItem[]> {
  const { data } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "pending")
    .eq("addressee_id", myId);
  return joinPeople(supabase, data ?? [], (r) => r.requester_id);
}

export async function listOutgoing(
  supabase: SupabaseClient<Database>,
  myId: string,
): Promise<FriendItem[]> {
  const { data } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "pending")
    .eq("requester_id", myId);
  return joinPeople(supabase, data ?? [], (r) => r.addressee_id);
}

export async function getRelationState(
  supabase: SupabaseClient<Database>,
  myId: string,
  otherId: string,
): Promise<RelationState> {
  const { data } = await supabase
    .from("friendships")
    .select("*")
    .or(
      `and(requester_id.eq.${myId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${myId})`,
    )
    .maybeSingle();
  if (!data) return { kind: "none" };
  if (data.status === "accepted")
    return { kind: "friends", friendshipId: data.id };
  if (data.status === "pending")
    return data.requester_id === myId
      ? { kind: "outgoing", friendshipId: data.id }
      : { kind: "incoming", friendshipId: data.id };
  return { kind: "none" };
}

export async function insertRequest(
  supabase: SupabaseClient<Database>,
  requesterId: string,
  addresseeId: string,
): Promise<{ id: string | null; error: boolean }> {
  const { data, error } = await supabase
    .from("friendships")
    .insert({ requester_id: requesterId, addressee_id: addresseeId })
    .select("id")
    .single();
  return { id: data?.id ?? null, error: Boolean(error) };
}

export function setStatus(
  supabase: SupabaseClient<Database>,
  friendshipId: string,
  status: "accepted" | "rejected",
) {
  return supabase.from("friendships").update({ status }).eq("id", friendshipId);
}

export function deleteFriendship(
  supabase: SupabaseClient<Database>,
  friendshipId: string,
) {
  return supabase.from("friendships").delete().eq("id", friendshipId);
}

export async function searchPeople(
  supabase: SupabaseClient<Database>,
  query: string,
  excludeId: string,
): Promise<Person[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .ilike("username", `%${q}%`)
    .neq("id", excludeId)
    .limit(10);
  return (data ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    displayName: p.display_name,
    avatarUrl: p.avatar_url,
  }));
}
