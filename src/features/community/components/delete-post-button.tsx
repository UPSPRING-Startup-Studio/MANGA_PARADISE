"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePost } from "@/features/community/actions";

export function DeletePostButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-label="Supprimer la publication"
      disabled={pending}
      onClick={() => {
        if (confirm("Supprimer cette publication ?"))
          startTransition(() => void deletePost(postId));
      }}
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
