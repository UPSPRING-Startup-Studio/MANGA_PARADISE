"use client";

import { useOptimistic, useTransition } from "react";
import { toggleParticipation } from "@/features/events/actions";
import { Button } from "@/components/ui/button";

export function RsvpButton({
  eventId,
  initial,
}: {
  eventId: string;
  initial: boolean;
}) {
  const [going, setGoing] = useOptimistic(initial);
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="lg"
      variant={going ? "outline" : "default"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setGoing(!going);
          await toggleParticipation(eventId);
        })
      }
    >
      {going ? "J'y participe ✓" : "Participer"}
    </Button>
  );
}
