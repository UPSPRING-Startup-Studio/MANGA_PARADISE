import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getMyVestiaire } from "@/features/cosplay/server";
import { PlanCard } from "@/features/cosplay/components/plan-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Cosplay" };

export default async function CosplayPage() {
  const plans = await getMyVestiaire();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl">Mon vestiaire</h1>
          <p className="text-muted-foreground">Tes projets cosplay.</p>
        </div>
        <Link
          href="/cosplay/nouveau"
          className={cn(buttonVariants({ size: "lg" }))}
        >
          <Plus className="size-4" /> Nouveau projet
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="bg-mp-cloud/50 flex flex-col items-start gap-2 rounded-xl p-6">
          <p className="text-muted-foreground text-sm">
            Aucun projet pour l&apos;instant.
          </p>
          <Link
            href="/cosplay/nouveau"
            className="text-mp-primary text-sm font-medium hover:underline"
          >
            Créer mon premier cosplay →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
        </div>
      )}
    </div>
  );
}
