import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/features/profile/server";
import { listMyParticipationIds } from "@/features/events/api/participation";
import { getEventsByIds } from "@/features/events/api/events";
import {
  eventStart,
  temporalStatus,
  type EventRow,
} from "@/features/events/lib";
import {
  listUserBadges,
  type UserBadge,
} from "@/features/gamification/api/badges";
import type { Profile } from "@/features/profile/api/profiles";

export type MemberDashboard = {
  profile: Profile | null;
  upcomingEvents: EventRow[];
  badges: UserBadge[];
};

/** Données du tableau de bord membre : profil + prochaines participations + badges. */
export async function getMemberDashboard(): Promise<MemberDashboard> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getMyProfile();

  if (!user) return { profile, upcomingEvents: [], badges: [] };

  const [participationIds, badges] = await Promise.all([
    listMyParticipationIds(supabase, user.id),
    listUserBadges(supabase, user.id),
  ]);

  const events = await getEventsByIds(supabase, participationIds);
  const upcomingEvents = events
    .filter((e) => temporalStatus(e) !== "past")
    .sort((a, b) => eventStart(a).getTime() - eventStart(b).getTime())
    .slice(0, 3);

  return { profile, upcomingEvents, badges };
}
