"use client";

import { useState, useTransition } from "react";
import {
  acceptFriend,
  removeFriendship,
  sendFriendRequest,
} from "@/features/friends/actions";
import type { RelationState } from "@/features/friends/api/friendships";
import { Button } from "@/components/ui/button";

export function FriendButton({
  targetId,
  initial,
}: {
  targetId: string;
  initial: RelationState;
}) {
  const [state, setState] = useState<RelationState>(initial);
  const [pending, startTransition] = useTransition();

  if (state.kind === "friends") {
    return (
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await removeFriendship(state.friendshipId);
            setState({ kind: "none" });
          })
        }
      >
        Nakama ✓
      </Button>
    );
  }

  if (state.kind === "outgoing") {
    return (
      <Button
        variant="outline"
        disabled={pending || !state.friendshipId}
        onClick={() =>
          startTransition(async () => {
            await removeFriendship(state.friendshipId);
            setState({ kind: "none" });
          })
        }
      >
        Demande envoyée
      </Button>
    );
  }

  if (state.kind === "incoming") {
    return (
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await acceptFriend(state.friendshipId);
            setState({ kind: "friends", friendshipId: state.friendshipId });
          })
        }
      >
        Accepter la demande
      </Button>
    );
  }

  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await sendFriendRequest(targetId);
          if (!("error" in res))
            setState({ kind: "outgoing", friendshipId: res.id });
        })
      }
    >
      Ajouter en ami
    </Button>
  );
}
