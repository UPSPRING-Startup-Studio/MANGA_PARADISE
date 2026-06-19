import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight, Users } from "lucide-react";
import type { MembersHistoryPoint } from "@/hooks/association/useAssociationDashboard";

interface AssociationMembersChartProps {
  data: MembersHistoryPoint[] | undefined;
  isLoading: boolean;
}

const AssociationMembersChart = ({
  data,
  isLoading,
}: AssociationMembersChartProps) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-7 w-24 rounded-md" />
        </div>
        <Skeleton className="h-[260px] w-full rounded-lg" />
      </div>
    );
  }

  const chartData = data || [];
  const hasData = chartData.length > 0 && chartData.some((d) => d.count > 0);

  // Compute delta
  const currentCount = chartData.length > 0 ? chartData[chartData.length - 1].count : 0;
  const prevCount = chartData.length > 1 ? chartData[chartData.length - 2].count : currentCount;
  const delta = currentCount - prevCount;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sakura/10 border border-sakura/20">
            <TrendingUp className="w-4 h-4 text-sakura" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Evolution des membres
            </h3>
            <p className="text-[11px] text-muted-foreground/60">
              6 derniers mois
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasData && delta !== 0 && (
            <span
              className={`text-xs font-medium px-2 py-1 rounded-md ${
                delta > 0
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {delta} ce mois
            </span>
          )}
          <Link to="/association/membres">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 h-7 text-muted-foreground hover:text-foreground"
            >
              Voir tous
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Chart */}
      <div className="px-3 pb-4">
        {!hasData ? (
          <div className="h-[260px] flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <Users className="w-5 h-5 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground/60">
                Pas encore de donnees
              </p>
              <p className="text-xs text-muted-foreground/40 mt-1">
                L'historique apparaitra avec les premiers membres
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="memberGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6BBE" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#FF6BBE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 15, 25, 0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  fontSize: 12,
                  padding: "8px 12px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                }}
                labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
                itemStyle={{ color: "#FF6BBE" }}
                formatter={(value: number) => [`${value} membres`, "Actifs"]}
                cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#FF6BBE"
                strokeWidth={2.5}
                fill="url(#memberGradient)"
                dot={{
                  r: 4,
                  fill: "#FF6BBE",
                  stroke: "rgba(15,15,25,0.8)",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "#FF6BBE",
                  stroke: "rgba(255,107,190,0.3)",
                  strokeWidth: 4,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AssociationMembersChart;
