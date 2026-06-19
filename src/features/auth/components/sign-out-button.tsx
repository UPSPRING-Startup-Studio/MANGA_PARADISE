"use client";

import { useTransition } from "react";
import { signOut } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(async () => void (await signOut()))}
    >
      {pending ? "…" : "Déconnexion"}
    </Button>
  );
}
