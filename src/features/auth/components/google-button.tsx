"use client";

import { useState, useTransition } from "react";
import { signInWithGoogle } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export function GoogleButton({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await signInWithGoogle(next);
            if (res?.error) setError(res.error);
          })
        }
      >
        {pending ? "Redirection…" : "Continuer avec Google"}
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
