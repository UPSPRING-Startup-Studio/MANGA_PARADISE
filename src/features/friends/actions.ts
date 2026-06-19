"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  deleteFriendship,
  getRelationState,
  insertRequest,
  searchPeople,
  setStatus,
  type Person,
} from "@/features/friends/api/friendships";

const uuid = z.string().uuid();

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user.id;
}

export async function sendFriendRequest(
  addresseeId: string,
): Promise<{ error: string } | { ok: true; id: string }> {
  if (!uuid.safeParse(addresseeId).success)
    return { error: "Utilisateur invalide" };
  const me = await requireUserId();
  if (addresseeId === me) return { error: "Impossible" };

  const supabase = await createClient();
  const rel = await getRelationState(supabase, me, addresseeId);
  if (rel.kind !== "none") return { error: "Relation déjà existante" };

  const { id, error } = await insertRequest(supabase, me, addresseeId);
  if (error || !id) return { error: "Envoi impossible, réessaie" };
  revalidatePath("/mes-amis");
  return { ok: true, id };
}

export async function acceptFriend(friendshipId: string): Promise<void> {
  if (!uuid.safeParse(friendshipId).success) return;
  await requireUserId();
  const supabase = await createClient();
  await setStatus(supabase, friendshipId, "accepted");
  revalidatePath("/mes-amis");
}

/** Refuse une demande reçue, annule une demande envoyée, ou retire un ami. */
export async function removeFriendship(friendshipId: string): Promise<void> {
  if (!uuid.safeParse(friendshipId).success) return;
  await requireUserId();
  const supabase = await createClient();
  await deleteFriendship(supabase, friendshipId);
  revalidatePath("/mes-amis");
}

export async function searchUsers(query: string): Promise<Person[]> {
  const me = await requireUserId();
  const supabase = await createClient();
  return searchPeople(supabase, query, me);
}
