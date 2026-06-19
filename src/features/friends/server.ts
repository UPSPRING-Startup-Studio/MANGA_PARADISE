import { createClient } from "@/lib/supabase/server";
import {
  getRelationState,
  listFriends,
  listIncoming,
  listOutgoing,
  type FriendItem,
  type RelationState,
} from "@/features/friends/api/friendships";

export async function getNakamasData(): Promise<{
  friends: FriendItem[];
  incoming: FriendItem[];
  outgoing: FriendItem[];
  myId: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [friends, incoming, outgoing] = await Promise.all([
    listFriends(supabase, user.id),
    listIncoming(supabase, user.id),
    listOutgoing(supabase, user.id),
  ]);
  return { friends, incoming, outgoing, myId: user.id };
}

/** Relation de l'utilisateur courant avec `otherId` (null si non connecté ou soi-même). */
export async function getRelationWith(
  otherId: string,
): Promise<RelationState | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === otherId) return null;
  return getRelationState(supabase, user.id, otherId);
}
