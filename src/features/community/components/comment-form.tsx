"use client";

import { useState, useTransition } from "react";
import { addComment } from "@/features/community/actions";
import { Button } from "@/components/ui/button";

export function CommentForm({ postId }: { postId: string }) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = content.trim();
    if (!value) return;
    setError(null);
    startTransition(async () => {
      const res = await addComment(postId, value);
      if (res?.error) setError(res.error);
      else setContent("");
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        placeholder="Ajouter un commentaire…"
        className="border-input bg-background focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
      />
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Envoi…" : "Commenter"}
        </Button>
      </div>
    </form>
  );
}
