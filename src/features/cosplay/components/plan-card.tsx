import Link from "next/link";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  type CosplayPlan,
} from "@/features/cosplay/lib";
import { cn } from "@/lib/utils";

export function PlanCard({ plan }: { plan: CosplayPlan }) {
  return (
    <Link
      href={`/cosplay/${plan.id}`}
      className="border-border bg-card flex flex-col overflow-hidden rounded-xl border"
    >
      <div className="bg-mp-cloud relative aspect-[4/3] w-full overflow-hidden">
        {plan.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plan.image_url} alt="" className="size-full object-cover" />
        ) : (
          <div className="text-mp-primary/40 font-heading grid size-full place-items-center text-2xl italic">
            {plan.character_name.charAt(0).toUpperCase()}
          </div>
        )}
        <span
          className={cn(
            "absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-semibold",
            STATUS_STYLES[plan.status],
          )}
        >
          {STATUS_LABELS[plan.status]}
        </span>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h3 className="line-clamp-1 font-semibold">{plan.character_name}</h3>
        <p className="text-muted-foreground line-clamp-1 text-sm">
          {plan.universe}
        </p>
        <div className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-mp-primary h-full rounded-full"
            style={{
              width: `${Math.min(100, Math.max(0, plan.progress_level))}%`,
            }}
          />
        </div>
      </div>
    </Link>
  );
}
