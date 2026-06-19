"use client";

import { useTransition } from "react";
import { acceptFriend, removeFriendship } from "@/features/friends/actions";
import { Button } from "@/components/ui/button";

export function IncomingActions({ friendshipId }: { friendshipId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex shrink-0 gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => void (await acceptFriend(friendshipId)))
        }
      >
        Accepter
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() =>
          startTransition(
            async () => void (await removeFriendship(friendshipId)),
          )
        }
      >
        Refuser
      </Button>
    </div>
  );
}
