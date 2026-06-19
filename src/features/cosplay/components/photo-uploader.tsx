"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { addPhoto } from "@/features/cosplay/actions";
import { PHOTOS_BUCKET } from "@/features/cosplay/api/photos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TYPES = [
  { v: "shooting", l: "Shooting" },
  { v: "wip", l: "WIP" },
  { v: "toi", l: "Toi" },
  { v: "original", l: "Officielle" },
  { v: "detail", l: "Détail" },
] as const;

function randomId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function PhotoUploader({
  planId,
  userId,
}: {
  planId: string;
  userId: string;
}) {
  const [type, setType] = useState<string>("shooting");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choisis une image.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const path = `${userId}/${planId}/${randomId()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        setError("Échec de l'envoi de l'image.");
        return;
      }
      const res = await addPhoto(planId, path, type, caption || undefined);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setCaption("");
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-border flex flex-col gap-3 rounded-xl border p-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5 sm:col-span-1">
          <Label htmlFor="photo">Image</Label>
          <input
            id="photo"
            ref={inputRef}
            type="file"
            accept="image/*"
            className="text-muted-foreground file:bg-muted file:text-foreground block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ptype">Type</Label>
          <select
            id="ptype"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border-input bg-background h-9 rounded-lg border px-2 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t.v} value={t.v}>
                {t.l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="caption">Légende</Label>
          <Input
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={200}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Envoi…" : "Ajouter la photo"}
        </Button>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    </form>
  );
}
