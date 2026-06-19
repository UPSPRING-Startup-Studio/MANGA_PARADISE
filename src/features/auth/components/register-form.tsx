"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/features/auth/schemas";
import { signUpWithPassword } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/features/auth/components/google-button";

export function RegisterForm({ next }: { next?: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  function onSubmit(values: RegisterInput) {
    setServerError(null);
    startTransition(async () => {
      const res = await signUpWithPassword(values, next);
      if (res?.error) setServerError(res.error);
      else if (res?.needsConfirmation) setConfirmation(true);
    });
  }

  if (confirmation) {
    return (
      <div className="bg-mp-cloud/60 flex flex-col gap-2 rounded-xl p-6 text-center">
        <h2 className="text-2xl">Vérifie ta boîte mail</h2>
        <p className="text-muted-foreground text-sm">
          Un lien de confirmation vient de t&apos;être envoyé. Clique dessus
          pour activer ton compte, puis reviens te connecter.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <GoogleButton next={next} />

      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        ou
        <span className="bg-border h-px flex-1" />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="displayName">Pseudo</Label>
          <Input
            id="displayName"
            autoComplete="nickname"
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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-destructive text-sm">
              {errors.password.message}
            </p>
          )}
        </div>

        {serverError && (
          <p className="text-destructive text-sm">{serverError}</p>
        )}

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Création…" : "Créer mon compte"}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Déjà inscrit ?{" "}
        <Link
          href="/login"
          className="text-mp-primary font-medium hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
