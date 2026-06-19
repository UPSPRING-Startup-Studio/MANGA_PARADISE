import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight, Filter, TrendingDown } from "lucide-react";
import type { AdhesionFunnelStep } from "@/hooks/association/useAssociationDashboard";

interface AssociationAdhesionFunnelProps {
  steps: AdhesionFunnelStep[] | undefined;
  isLoading: boolean;
}

const STEP_ICONS: Record<string, string> = {
  demandes: "01",
  en_cours: "02",
  paiement: "03",
  valide: "04",
};

const AssociationAdhesionFunnel = ({
  steps,
  isLoading,
}: AssociationAdhesionFunnelProps) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-7 w-28 rounded-md" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const funnelSteps = steps || [];
  const maxCount = funnelSteps.length > 0 ? Math.max(...funnelSteps.map((s) => s.count), 1) : 1;

  // Compute conversion rate
  const firstStep = funnelSteps[0]?.count || 0;
  const lastStep = funnelSteps[funnelSteps.length - 1]?.count || 0;
  const conversionRate =
    firstStep > 0 ? Math.round((lastStep / firstStep) * 100) : 0;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <Filter className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Funnel des adhesions
            </h3>
            <p className="text-[11px] text-muted-foreground/60">
              Taux de conversion global
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {firstStep > 0 && (
            <span
              className={`text-xs font-medium px-2 py-1 rounded-md ${
                conversionRate >= 50
                  ? "bg-emerald-500/10 text-emerald-400"
                  : conversionRate >= 25
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-red-500/10 text-red-400"
              }`}
            >
              {conversionRate}%
            </span>
          )}
          <Link to="/association/adhesions">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 h-7 text-muted-foreground hover:text-foreground"
            >
              Tout voir
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Funnel steps */}
      <div className="px-5 pb-5 space-y-2.5">
        {funnelSteps.length === 0 ? (
          <div className="h-[240px] flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <TrendingDown className="w-5 h-5 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground/60">
                Aucune donnee disponible
              </p>
              <p className="text-xs text-muted-foreground/40 mt-1">
                Les donnees apparaitront avec les premieres adhesions
              </p>
            </div>
          </div>
        ) : (
          funnelSteps.map((step, index) => {
            const widthPct =
              maxCount > 0 ? Math.max((step.count / maxCount) * 100, 6) : 6;
            const stepNum = STEP_ICONS[step.key] || `0${index + 1}`;

            // Dropout indicator
            const prevCount = index > 0 ? funnelSteps[index - 1].count : step.count;
            const dropout = prevCount > 0 ? prevCount - step.count : 0;

            return (
              <div
                key={step.key}
                className="group rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all p-3"
              >
                <div className="flex items-center gap-3">
                  {/* Step number */}
                  <span className="text-[10px] font-display text-muted-foreground/40 w-5 text-center flex-shrink-0">
                    {stepNum}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-foreground/80">
                        {step.label}
                      </span>
                      <div className="flex items-center gap-2">
                        {dropout > 0 && index > 0 && (
                          <span className="text-[10px] text-muted-foreground/40">
                            -{dropout}
                          </span>
                        )}
                        <span className="text-sm font-display font-bold text-foreground">
                          {step.count}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: step.color,
                          boxShadow: `0 0 8px ${step.color}33`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AssociationAdhesionFunnel;
