import { createClient } from "@/lib/supabase/server";
import {
  getEventById,
  listEventSchedule,
  listPublishedEvents,
  countParticipants,
} from "@/features/events/api/events";
import {
  isFavoriteEvent,
  isParticipating,
  listMyFavoriteEventIds,
  listMyParticipationIds,
} from "@/features/events/api/participation";

/** Données de l'agenda + état (favoris/participations) de l'utilisateur courant. */
export async function getAgendaData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const events = await listPublishedEvents(supabase);
  const [favoriteIds, participationIds] = user
    ? await Promise.all([
        listMyFavoriteEventIds(supabase, user.id),
        listMyParticipationIds(supabase, user.id),
      ])
    : [[], []];

  return { events, favoriteIds, participationIds, isAuthed: Boolean(user) };
}

/** Détail d'un événement + programme + état de l'utilisateur courant. */
export async function getEventDetail(id: string) {
  const supabase = await createClient();
  const event = await getEventById(supabase, id);
  if (!event) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [schedule, participantsCount, participating, favorite] =
    await Promise.all([
      listEventSchedule(supabase, id),
      countParticipants(supabase, id),
      user ? isParticipating(supabase, user.id, id) : Promise.resolve(false),
      user ? isFavoriteEvent(supabase, user.id, id) : Promise.resolve(false),
    ]);

  return {
    event,
    schedule,
    participantsCount,
    participating,
    favorite,
    isAuthed: Boolean(user),
  };
}
