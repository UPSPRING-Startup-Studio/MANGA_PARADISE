"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addFavoriteEvent,
  addParticipation,
  isFavoriteEvent,
  isParticipating,
  removeFavoriteEvent,
  removeParticipation,
} from "@/features/events/api/participation";

const eventIdSchema = z.string().uuid();

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user.id;
}

/**
 * Bascule la participation (RSVP) de l'utilisateur courant à un événement.
 * Pas de `revalidatePath` : les pages concernées sont dynamiques (relues à
 * chaque navigation) et revalider la route courante réinitialiserait l'état
 * local du bouton. La vérité renvoyée pilote l'UI côté client.
 */
export async function toggleParticipation(
  eventId: string,
): Promise<{ participating: boolean } | { error: string }> {
  if (!eventIdSchema.safeParse(eventId).success)
    return { error: "Événement invalide" };

  const userId = await requireUserId();
  const supabase = await createClient();

  const already = await isParticipating(supabase, userId, eventId);
  const { error } = already
    ? await removeParticipation(supabase, userId, eventId)
    : await addParticipation(supabase, userId, eventId);
  if (error) return { error: "Action impossible, réessaie" };

  return { participating: !already };
}

/** Bascule le favori (bookmark) de l'utilisateur courant sur un événement. */
export async function toggleFavorite(
  eventId: string,
): Promise<{ favorite: boolean } | { error: string }> {
  if (!eventIdSchema.safeParse(eventId).success)
    return { error: "Événement invalide" };

  const userId = await requireUserId();
  const supabase = await createClient();

  const already = await isFavoriteEvent(supabase, userId, eventId);
  const { error } = already
    ? await removeFavoriteEvent(supabase, userId, eventId)
    : await addFavoriteEvent(supabase, userId, eventId);
  if (error) return { error: "Action impossible, réessaie" };

  return { favorite: !already };
}
