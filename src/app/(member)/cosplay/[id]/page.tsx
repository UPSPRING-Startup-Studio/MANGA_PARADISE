import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { getPlanDetail } from "@/features/cosplay/server";
import { TaskBoard } from "@/features/cosplay/components/task-board";
import { DeletePlanButton } from "@/features/cosplay/components/delete-plan-button";
import { PhotoUploader } from "@/features/cosplay/components/photo-uploader";
import { PhotoGrid } from "@/features/cosplay/components/photo-grid";
import {
  CRAFT_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/features/cosplay/lib";
import { cn } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const data = await getPlanDetail(id);
  return { title: data ? data.plan.character_name : "Cosplay" };
}

export default async function PlanPage({ params }: Params) {
  const { id } = await params;
  const data = await getPlanDetail(id);
  if (!data) notFound();
  const { plan, tasks, photos } = data;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="bg-mp-cloud aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl sm:w-64">
          {plan.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={plan.image_url}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="text-mp-primary/40 font-heading grid size-full place-items-center text-4xl italic">
              {plan.character_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span
            className={cn(
              "w-fit rounded-full px-2 py-0.5 text-xs font-semibold",
              STATUS_STYLES[plan.status],
            )}
          >
            {STATUS_LABELS[plan.status]}
          </span>
          <h1 className="text-3xl sm:text-4xl">{plan.character_name}</h1>
          <p className="text-muted-foreground">{plan.universe}</p>
          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>Année cible : {plan.target_year}</span>
            {plan.craft_type && (
              <span>{CRAFT_LABELS[plan.craft_type] ?? plan.craft_type}</span>
            )}
            {plan.budget != null && <span>Budget : {plan.budget} €</span>}
          </div>
          {plan.notes && (
            <p className="text-muted-foreground mt-1 max-w-prose text-sm whitespace-pre-line">
              {plan.notes}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Link
              href={`/cosplay/${plan.id}/modifier`}
              className="border-border hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium"
            >
              <Pencil className="size-4" /> Modifier
            </Link>
            <DeletePlanButton planId={plan.id} />
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl">Tâches</h2>
        <TaskBoard planId={plan.id} tasks={tasks} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl">Photos</h2>
        <PhotoUploader planId={plan.id} userId={plan.user_id} />
        <PhotoGrid planId={plan.id} photos={photos} />
      </section>
    </div>
  );
}
