"use client";

import { useState, useTransition } from "react";
import { toggleParticipation } from "@/features/events/actions";
import { Button } from "@/components/ui/button";

export function RsvpButton({
  eventId,
  initial,
}: {
  eventId: string;
  initial: boolean;
}) {
  const [going, setGoing] = useState(initial);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const next = !going;
    setGoing(next); // optimiste
    startTransition(async () => {
      const res = await toggleParticipation(eventId);
      // Réconcilie avec la vérité serveur (revert si l'écriture a échoué).
      setGoing("error" in res ? !next : res.participating);
    });
  }

  return (
    <Button
      size="lg"
      variant={going ? "outline" : "default"}
      disabled={pending}
      onClick={handleClick}
    >
      {going ? "J'y participe ✓" : "Participer"}
    </Button>
  );
}
