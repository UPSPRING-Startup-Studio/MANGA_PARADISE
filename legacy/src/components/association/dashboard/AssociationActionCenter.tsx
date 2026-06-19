import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardCheck,
  CalendarPlus,
  FileText,
  ScrollText,
  Building2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AssociationStats } from "@/hooks/association/useAssociationDashboard";
import type { Association } from "@/hooks/useAssociation";

interface AssociationActionCenterProps {
  stats: AssociationStats | null | undefined;
  association: Association;
  isLoading: boolean;
}

interface ActionItem {
  id: string;
  label: string;
  description: string;
  count?: number;
  href: string;
  ctaLabel: string;
  icon: React.ReactNode;
  severity: "urgent" | "warning" | "info";
}

function getActionItems(
  stats: AssociationStats | null | undefined,
  association: Association
): ActionItem[] {
  if (!stats) return [];

  const items: ActionItem[] = [];

  if (stats.pendingMembershipsCount > 0) {
    items.push({
      id: "pending-adhesions",
      label: "Adhesions a valider",
      description: `${stats.pendingMembershipsCount} dossier${stats.pendingMembershipsCount > 1 ? "s" : ""} en attente de traitement`,
      count: stats.pendingMembershipsCount,
      href: "/association/adhesions",
      ctaLabel: "Valider",
      icon: <ClipboardCheck className="w-4 h-4" />,
      severity: stats.pendingMembershipsCount >= 5 ? "urgent" : "warning",
    });
  }

  if (stats.pendingDocumentsCount > 0) {
    items.push({
      id: "pending-documents",
      label: "Documents en attente",
      description: `${stats.pendingDocumentsCount} document${stats.pendingDocumentsCount > 1 ? "s" : ""} a examiner`,
      count: stats.pendingDocumentsCount,
      href: "/association/documents",
      ctaLabel: "Examiner",
      icon: <FileText className="w-4 h-4" />,
      severity: "warning",
    });
  }

  if (stats.upcomingEventsCount === 0) {
    items.push({
      id: "no-events",
      label: "Aucun evenement prevu",
      description: "Planifiez votre prochain rassemblement",
      href: "/admin/events",
      ctaLabel: "Creer",
      icon: <CalendarPlus className="w-4 h-4" />,
      severity: "info",
    });
  }

  if (!association.description || !association.email) {
    items.push({
      id: "incomplete-fiche",
      label: "Fiche incomplète",
      description: "Completez votre profil public pour gagner en visibilite",
      href: "/association/parametres",
      ctaLabel: "Completer",
      icon: <Building2 className="w-4 h-4" />,
      severity: "info",
    });
  }

  if (stats.incompleteMembershipsCount > 0) {
    items.push({
      id: "incomplete-memberships",
      label: "Dossiers incomplets",
      description: `${stats.incompleteMembershipsCount} membre${stats.incompleteMembershipsCount > 1 ? "s" : ""} n'ont pas termine leur inscription`,
      count: stats.incompleteMembershipsCount,
      href: "/association/adhesions",
      ctaLabel: "Voir",
      icon: <ScrollText className="w-4 h-4" />,
      severity: "info",
    });
  }

  return items;
}

const SEVERITY_STYLES = {
  urgent: {
    border: "border-red-500/25",
    bg: "bg-red-500/[0.06]",
    iconBg: "bg-red-500/15 text-red-400",
    badge: "bg-red-500/20 text-red-400",
    glow: "shadow-[0_0_12px_rgba(239,68,68,0.08)]",
  },
  warning: {
    border: "border-amber-500/25",
    bg: "bg-amber-500/[0.06]",
    iconBg: "bg-amber-500/15 text-amber-400",
    badge: "bg-amber-500/20 text-amber-400",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.08)]",
  },
  info: {
    border: "border-blue-500/20",
    bg: "bg-blue-500/[0.04]",
    iconBg: "bg-blue-500/15 text-blue-400",
    badge: "bg-blue-500/20 text-blue-400",
    glow: "",
  },
};

const AssociationActionCenter = ({
  stats,
  association,
  isLoading,
}: AssociationActionCenterProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-5 w-44" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const items = getActionItems(stats, association);

  // All clear state
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/15">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-400">
              Tout est a jour
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aucune action urgente requise. Votre association fonctionne bien.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
          A traiter maintenant
        </h2>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
          {items.length}
        </span>
      </div>

      {/* Action cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const style = SEVERITY_STYLES[item.severity];

          return (
            <div
              key={item.id}
              className={`group relative rounded-xl border ${style.border} ${style.bg} ${style.glow} p-4 transition-all hover:border-white/20 hover:bg-white/[0.05]`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${style.iconBg}`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {item.label}
                      </h3>
                      {item.count !== undefined && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${style.badge}`}
                        >
                          {item.count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>

              <Link to={item.href} className="mt-3 block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-xs h-8 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/10"
                >
                  {item.ctaLabel}
                  <ArrowRight className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssociationActionCenter;
