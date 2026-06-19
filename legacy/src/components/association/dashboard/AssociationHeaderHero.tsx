import { Link } from "react-router-dom";
import {
  Sparkles,
  ExternalLink,
  ArrowRight,
  ClipboardList,
  CalendarPlus,
  FileEdit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Association } from "@/hooks/useAssociation";
import type { AssociationStats } from "@/hooks/association/useAssociationDashboard";

interface AssociationHeaderHeroProps {
  association: Association;
  stats: AssociationStats | null | undefined;
  isLoading: boolean;
}

interface CtaConfig {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function getContextualSummary(stats: AssociationStats | null | undefined): string {
  if (!stats) return "Chargement des donnees...";

  const parts: string[] = [];

  if (stats.pendingMembershipsCount > 0) {
    parts.push(
      `${stats.pendingMembershipsCount} adhesion${stats.pendingMembershipsCount > 1 ? "s" : ""} a valider`
    );
  }
  if (stats.pendingDocumentsCount > 0) {
    parts.push(
      `${stats.pendingDocumentsCount} document${stats.pendingDocumentsCount > 1 ? "s" : ""} en attente`
    );
  }
  if (stats.upcomingEventsCount > 0) {
    parts.push(
      `${stats.upcomingEventsCount} evenement${stats.upcomingEventsCount > 1 ? "s" : ""} a venir`
    );
  }
  if (stats.upcomingRegistrationsCount > 0) {
    parts.push(`${stats.upcomingRegistrationsCount} inscription${stats.upcomingRegistrationsCount > 1 ? "s" : ""}`);
  }

  if (parts.length === 0) {
    return "Tout est a jour. Votre association fonctionne bien !";
  }

  return `Cette semaine : ${parts.join(", ")}`;
}

function getPrimaryCta(stats: AssociationStats | null | undefined): CtaConfig {
  if (!stats)
    return {
      label: "Voir les membres",
      href: "/association/membres",
      icon: <ClipboardList className="w-4 h-4" />,
    };

  if (stats.pendingMembershipsCount > 0) {
    return {
      label: "Ouvrir la file de validation",
      href: "/association/adhesions",
      icon: <ClipboardList className="w-4 h-4" />,
    };
  }

  if (stats.upcomingEventsCount === 0) {
    return {
      label: "Creer un evenement",
      href: "/admin/events",
      icon: <CalendarPlus className="w-4 h-4" />,
    };
  }

  return {
    label: "Voir les adhesions",
    href: "/association/adhesions",
    icon: <FileEdit className="w-4 h-4" />,
  };
}

const AssociationHeaderHero = ({
  association,
  stats,
  isLoading,
}: AssociationHeaderHeroProps) => {
  const summary = getContextualSummary(stats);
  const primaryCta = getPrimaryCta(stats);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent backdrop-blur-xl">
      {/* Subtle gradient orb */}
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-sakura/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-turquoise/[0.04] blur-3xl pointer-events-none" />

      <div className="relative px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          {/* Left: Title + context */}
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sakura/10 border border-sakura/20">
                <Sparkles className="w-4.5 h-4.5 text-sakura" />
              </div>
              <div>
                <h1 className="text-2xl font-display tracking-wide text-foreground">
                  Tableau de bord
                </h1>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              {association.name}
              {association.city ? ` — ${association.city}` : ""}
            </p>
            {/* Contextual summary */}
            <div className="flex items-start gap-2 pt-1">
              <div
                className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${
                  isLoading
                    ? "bg-white/[0.03] border-white/[0.06] text-muted-foreground"
                    : stats && stats.pendingMembershipsCount > 0
                      ? "bg-amber-500/[0.08] border-amber-500/20 text-amber-300"
                      : "bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-400"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isLoading
                      ? "bg-muted-foreground animate-pulse"
                      : stats && stats.pendingMembershipsCount > 0
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                  }`}
                />
                {summary}
              </div>
            </div>
          </div>

          {/* Right: CTAs */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link to={primaryCta.href}>
              <Button
                size="sm"
                className="gap-2 bg-sakura hover:bg-sakura/90 text-white font-medium shadow-[0_0_20px_rgba(255,107,190,0.2)] hover:shadow-[0_0_28px_rgba(255,107,190,0.35)] transition-all"
              >
                {primaryCta.icon}
                {primaryCta.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            {association.slug && (
              <Link to={`/asso/${association.slug}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-white/10 hover:border-white/20 hover:bg-white/[0.04] text-muted-foreground"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Voir la fiche
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssociationHeaderHero;
