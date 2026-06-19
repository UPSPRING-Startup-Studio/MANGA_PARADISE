"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createPost } from "@/features/community/actions";
import { POST_IMAGE_BUCKET } from "@/features/community/api/posts";
import { Button } from "@/components/ui/button";

function randomId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function PostComposer({ userId }: { userId: string }) {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0] ?? null;
    if (!content.trim() && !file) {
      setError("Ajoute un texte ou une image.");
      return;
    }
    setError(null);
    startTransition(async () => {
      let mediaUrl: string | undefined;
      if (file) {
        const supabase = createClient();
        const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
        const path = `${userId}/feed/${randomId()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(POST_IMAGE_BUCKET)
          .upload(path, file, { contentType: file.type });
        if (upErr) {
          setError("Échec de l'envoi de l'image.");
          return;
        }
        mediaUrl = supabase.storage.from(POST_IMAGE_BUCKET).getPublicUrl(path)
          .data.publicUrl;
      }
      const res = await createPost(content, mediaUrl);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setContent("");
      setFileName(null);
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-border bg-card flex flex-col gap-3 rounded-xl border p-4"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Quoi de neuf dans le sanctuaire ?"
        className="bg-background focus-visible:ring-ring/50 w-full resize-none rounded-lg border-0 text-sm outline-none focus-visible:ring-0"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1.5 text-sm">
          <ImagePlus className="size-4" />
          <span>{fileName ?? "Image"}</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Publication…" : "Publier"}
        </Button>
      </div>
    </form>
  );
}
