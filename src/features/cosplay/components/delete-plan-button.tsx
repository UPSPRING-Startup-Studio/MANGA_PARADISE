"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePlan } from "@/features/cosplay/actions";
import { Button } from "@/components/ui/button";

export function DeletePlanButton({ planId }: { planId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirm) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirm(true)}
      >
        <Trash2 className="size-4" /> Supprimer
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">Confirmer ?</span>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => void (await deletePlan(planId)))
        }
      >
        Oui, supprimer
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirm(false)}
      >
        Annuler
      </Button>
    </div>
  );
}
