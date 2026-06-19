import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserPlus,
  CalendarDays,
  Ticket,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AssociationStats } from "@/hooks/association/useAssociationDashboard";

interface AssociationKpiCardsProps {
  stats: AssociationStats | null | undefined;
  isLoading: boolean;
}

interface KpiCardConfig {
  key: string;
  label: string;
  getValue: (s: AssociationStats) => number;
  getSubtext: (s: AssociationStats) => string;
  icon: React.ReactNode;
  color: string;
  accentBg: string;
  href?: string;
  highlight?: (s: AssociationStats) => boolean;
}

const KPI_CARDS: KpiCardConfig[] = [
  {
    key: "active-members",
    label: "Membres actifs",
    getValue: (s) => s.activeMembersCount,
    getSubtext: () => "dans l'association",
    icon: <Users className="w-4.5 h-4.5" />,
    color: "text-sakura",
    accentBg: "bg-sakura/10 border-sakura/20",
    href: "/association/membres",
  },
  {
    key: "validated",
    label: "Adhesions validees",
    getValue: (s) => s.validatedMembershipsCount,
    getSubtext: (s) => {
      const total = s.validatedMembershipsCount + s.pendingMembershipsCount;
      if (total === 0) return "saison en cours";
      const pct = Math.round((s.validatedMembershipsCount / total) * 100);
      return `${pct}% des membres a jour`;
    },
    icon: <UserCheck className="w-4.5 h-4.5" />,
    color: "text-emerald-400",
    accentBg: "bg-emerald-500/10 border-emerald-500/20",
    href: "/association/adhesions",
  },
  {
    key: "pending",
    label: "En attente",
    getValue: (s) => s.pendingMembershipsCount,
    getSubtext: (s) =>
      s.incompleteMembershipsCount > 0
        ? `dont ${s.incompleteMembershipsCount} incomplet${s.incompleteMembershipsCount > 1 ? "s" : ""}`
        : "file de validation",
    icon: <UserPlus className="w-4.5 h-4.5" />,
    color: "text-amber-400",
    accentBg: "bg-amber-500/10 border-amber-500/20",
    href: "/association/adhesions",
    highlight: (s) => s.pendingMembershipsCount > 0,
  },
  {
    key: "events",
    label: "Evenements",
    getValue: (s) => s.upcomingEventsCount,
    getSubtext: () => "a venir",
    icon: <CalendarDays className="w-4.5 h-4.5" />,
    color: "text-turquoise",
    accentBg: "bg-turquoise/10 border-turquoise/20",
    href: "/association/evenements",
  },
  {
    key: "registrations",
    label: "Inscriptions",
    getValue: (s) => s.upcomingRegistrationsCount,
    getSubtext: (s) =>
      s.volunteerRegistrationsCount > 0
        ? `dont ${s.volunteerRegistrationsCount} benevole${s.volunteerRegistrationsCount > 1 ? "s" : ""}`
        : "sur evenements a venir",
    icon: <Ticket className="w-4.5 h-4.5" />,
    color: "text-purple-400",
    accentBg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    key: "documents",
    label: "Documents",
    getValue: (s) => s.pendingDocumentsCount,
    getSubtext: (s) =>
      s.pendingDocumentsCount === 0 ? "tout est a jour" : "a examiner",
    icon: <FileText className="w-4.5 h-4.5" />,
    color: "text-orange-400",
    accentBg: "bg-orange-500/10 border-orange-500/20",
    href: "/association/documents",
    highlight: (s) => s.pendingDocumentsCount > 0,
  },
];

function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
    </div>
  );
}

const AssociationKpiCards = ({ stats, isLoading }: AssociationKpiCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {KPI_CARDS.map((kpi) => {
        const value = kpi.getValue(stats);
        const subtext = kpi.getSubtext(stats);
        const isHighlighted = kpi.highlight ? kpi.highlight(stats) : false;

        const card = (
          <div
            className={cn(
              "group relative rounded-xl border p-4 transition-all duration-200",
              "border-white/[0.06] bg-white/[0.025] hover:bg-white/[0.05]",
              "hover:border-white/[0.12]",
              isHighlighted &&
                "border-amber-500/30 bg-amber-500/[0.04] shadow-[0_0_20px_rgba(245,158,11,0.06)]"
            )}
          >
            {/* Link indicator on hover */}
            {kpi.href && (
              <ArrowUpRight className="absolute top-3 right-3 w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all" />
            )}

            <div className="flex flex-col gap-3">
              {/* Icon */}
              <div
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-lg border",
                  kpi.accentBg,
                  kpi.color
                )}
              >
                {kpi.icon}
              </div>

              {/* Value */}
              <div>
                <p className={cn("text-3xl font-display tracking-tight leading-none", kpi.color)}>
                  {value}
                </p>
              </div>

              {/* Label + subtext */}
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-foreground/80">
                  {kpi.label}
                </p>
                <p className="text-[10px] text-muted-foreground/60 leading-tight">
                  {subtext}
                </p>
              </div>
            </div>
          </div>
        );

        if (kpi.href) {
          return (
            <Link key={kpi.key} to={kpi.href} className="block">
              {card}
            </Link>
          );
        }

        return <div key={kpi.key}>{card}</div>;
      })}
    </div>
  );
};

export default AssociationKpiCards;
