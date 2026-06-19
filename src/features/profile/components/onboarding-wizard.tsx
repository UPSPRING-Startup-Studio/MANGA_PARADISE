"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  onboardingSchema,
  type OnboardingInput,
} from "@/features/profile/schemas";
import { completeOnboarding } from "@/features/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STEPS = [
  { title: "L'identité du héros", subtitle: "Qui es-tu, aventurier ?" },
  { title: "Le serment", subtitle: "Encore une formalité et c'est parti." },
] as const;

export function OnboardingWizard({
  defaultDisplayName,
}: {
  defaultDisplayName?: string;
}) {
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: "",
      displayName: defaultDisplayName ?? "",
      firstName: "",
      lastName: "",
      birthDate: "",
      city: "",
      rulesAccepted: false as unknown as true,
      imageRightsConsent: false,
    },
  });
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = form;

  async function next() {
    const ok = await trigger([
      "username",
      "displayName",
      "firstName",
      "lastName",
      "birthDate",
      "city",
    ]);
    if (ok) setStep(1);
  }

  function onSubmit(values: OnboardingInput) {
    setServerError(null);
    startTransition(async () => {
      const res = await completeOnboarding(values);
      if (res?.error) setServerError(res.error);
    });
  }

  const current = STEPS[step] ?? STEPS[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-mp-primary text-xs font-semibold tracking-wide uppercase">
          Étape {step + 1} / {STEPS.length}
        </span>
        <h1 className="text-3xl">{current.title}</h1>
        <p className="text-muted-foreground text-sm">{current.subtitle}</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        {step === 0 && (
          <>
            <Field label="Nom d'utilisateur" error={errors.username?.message}>
              <Input
                placeholder="ex. otaku_master"
                aria-invalid={!!errors.username}
                {...register("username")}
              />
            </Field>
            <Field label="Pseudo affiché" error={errors.displayName?.message}>
              <Input
                aria-invalid={!!errors.displayName}
                {...register("displayName")}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Prénom (optionnel)"
                error={errors.firstName?.message}
              >
                <Input {...register("firstName")} />
              </Field>
              <Field label="Nom (optionnel)" error={errors.lastName?.message}>
                <Input {...register("lastName")} />
              </Field>
            </div>
            <Field label="Date de naissance" error={errors.birthDate?.message}>
              <Input
                type="date"
                aria-invalid={!!errors.birthDate}
                {...register("birthDate")}
              />
            </Field>
            <Field label="Ville (optionnel)" error={errors.city?.message}>
              <Input {...register("city")} />
            </Field>
            <Button type="button" size="lg" onClick={next}>
              Continuer
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4"
                {...register("rulesAccepted")}
              />
              <span>
                J&apos;accepte le règlement de la communauté Manga Paradise.
              </span>
            </label>
            {errors.rulesAccepted && (
              <p className="text-destructive text-sm">
                {errors.rulesAccepted.message}
              </p>
            )}

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4"
                {...register("imageRightsConsent")}
              />
              <span>
                J&apos;autorise l&apos;utilisation de mon image lors des
                événements (facultatif, modifiable plus tard).
              </span>
            </label>

            {serverError && (
              <p className="text-destructive text-sm">{serverError}</p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setStep(0)}
              >
                Retour
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={pending}
                className="flex-1"
              >
                {pending ? "Création…" : "Créer mon profil"}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
