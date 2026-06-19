"use client";

import { useTransition } from "react";
import { removeFriendship } from "@/features/friends/actions";
import { Button } from "@/components/ui/button";

export function RemoveButton({
  friendshipId,
  label,
}: {
  friendshipId: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        startTransition(async () => void (await removeFriendship(friendshipId)))
      }
      className="shrink-0"
    >
      {label}
    </Button>
  );
}
