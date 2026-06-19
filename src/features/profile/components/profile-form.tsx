"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  profileEditSchema,
  type ProfileEditInput,
} from "@/features/profile/schemas";
import { updateProfile } from "@/features/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({ initial }: { initial: ProfileEditInput }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileEditInput>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: initial,
  });

  function onSubmit(values: ProfileEditInput) {
    setServerError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateProfile(values);
      if (res?.error) setServerError(res.error);
      else setSaved(true);
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex max-w-xl flex-col gap-4"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Pseudo affiché</Label>
        <Input
          id="displayName"
          aria-invalid={!!errors.displayName}
          {...register("displayName")}
        />
        {errors.displayName && (
          <p className="text-destructive text-sm">
            {errors.displayName.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          rows={4}
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          {...register("bio")}
        />
        {errors.bio && (
          <p className="text-destructive text-sm">{errors.bio.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">Ville</Label>
          <Input id="city" {...register("city")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="favoriteManga">Manga favori</Label>
          <Input id="favoriteManga" {...register("favoriteManga")} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="favoriteCharacter">Personnage favori</Label>
        <Input id="favoriteCharacter" {...register("favoriteCharacter")} />
      </div>

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}
      {saved && <p className="text-success text-sm">Profil mis à jour.</p>}

      <div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
