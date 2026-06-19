import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlanDetail } from "@/features/cosplay/server";
import { PlanForm } from "@/features/cosplay/components/plan-form";
import type { PlanInput } from "@/features/cosplay/schemas";

export const metadata: Metadata = { title: "Modifier le cosplay" };

type Params = { params: Promise<{ id: string }> };

export default async function EditPlanPage({ params }: Params) {
  const { id } = await params;
  const data = await getPlanDetail(id);
  if (!data) notFound();
  const { plan } = data;

  const initial: Partial<PlanInput> = {
    characterName: plan.character_name,
    universe: plan.universe,
    status: plan.status,
    targetYear: plan.target_year,
    deadline: plan.deadline ?? "",
    budget: plan.budget ?? undefined,
    craftType: (plan.craft_type ?? "") as PlanInput["craftType"],
    notes: plan.notes ?? "",
    imageUrl: plan.image_url ?? "",
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl">Modifier le projet</h1>
      <PlanForm planId={plan.id} initial={initial} />
    </div>
  );
}
