import type { Metadata } from "next";
import { PlanForm } from "@/features/cosplay/components/plan-form";

export const metadata: Metadata = { title: "Nouveau cosplay" };

export default function NewPlanPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl">Nouveau projet cosplay</h1>
      <PlanForm />
    </div>
  );
}
