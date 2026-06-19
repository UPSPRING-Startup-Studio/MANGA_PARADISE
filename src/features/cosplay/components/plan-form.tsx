"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  planSchema,
  type PlanInput,
  type PlanFormInput,
} from "@/features/cosplay/schemas";
import { createPlan, updatePlan } from "@/features/cosplay/actions";
import {
  COSPLAN_STATUSES,
  CRAFT_LABELS,
  STATUS_LABELS,
} from "@/features/cosplay/lib";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectCls =
  "border-input bg-background h-9 w-full rounded-lg border px-2 text-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function PlanForm({
  planId,
  initial,
}: {
  planId?: string;
  initial?: Partial<PlanInput>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlanFormInput, unknown, PlanInput>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      characterName: "",
      universe: "",
      status: "wishlist",
      targetYear: new Date().getFullYear(),
      deadline: "",
      craftType: "",
      notes: "",
      imageUrl: "",
      ...initial,
    },
  });

  function onSubmit(values: PlanInput) {
    setServerError(null);
    startTransition(async () => {
      const res = planId
        ? await updatePlan(planId, values)
        : await createPlan(values);
      if (res?.error) setServerError(res.error);
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex max-w-xl flex-col gap-4"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Personnage" error={errors.characterName?.message}>
          <Input {...register("characterName")} />
        </Field>
        <Field label="Univers" error={errors.universe?.message}>
          <Input {...register("universe")} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Statut">
          <select className={selectCls} {...register("status")}>
            {COSPLAN_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Année cible" error={errors.targetYear?.message}>
          <Input type="number" {...register("targetYear")} />
        </Field>
        <Field label="Confection">
          <select className={selectCls} {...register("craftType")}>
            <option value="">—</option>
            {Object.entries(CRAFT_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Deadline (optionnel)">
          <Input type="date" {...register("deadline")} />
        </Field>
        <Field label="Budget € (optionnel)" error={errors.budget?.message}>
          <Input type="number" step="0.01" {...register("budget")} />
        </Field>
      </div>

      <Field label="Image (URL, optionnel)" error={errors.imageUrl?.message}>
        <Input {...register("imageUrl")} placeholder="https://…" />
      </Field>

      <Field label="Notes (optionnel)">
        <textarea
          rows={3}
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          {...register("notes")}
        />
      </Field>

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}

      <div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending
            ? "Enregistrement…"
            : planId
              ? "Enregistrer"
              : "Créer le projet"}
        </Button>
      </div>
    </form>
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
