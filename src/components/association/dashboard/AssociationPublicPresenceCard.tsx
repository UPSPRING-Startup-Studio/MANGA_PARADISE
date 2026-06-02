import { Link } from "react-router-dom";
import {
  Globe,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ExternalLink,
  Settings,
  Mail,
  Phone,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Association } from "@/hooks/useAssociation";

interface AssociationPublicPresenceCardProps {
  association: Association;
}

interface PresenceCheck {
  label: string;
  ok: boolean;
  icon: React.ReactNode;
}

function getPresenceChecks(association: Association): PresenceCheck[] {
  return [
    {
      label: "Fiche publique",
      ok: !!association.slug,
      icon: <Globe className="w-3.5 h-3.5" />,
    },
    {
      label: "Description renseignee",
      ok: !!association.description && association.description.length > 10,
      icon: <FileText className="w-3.5 h-3.5" />,
    },
    {
      label: "Email de contact",
      ok: !!association.email,
      icon: <Mail className="w-3.5 h-3.5" />,
    },
    {
      label: "Telephone",
      ok: !!association.phone,
      icon: <Phone className="w-3.5 h-3.5" />,
    },
  ];
}

function getCompletionScore(checks: PresenceCheck[]): number {
  const completed = checks.filter((c) => c.ok).length;
  return Math.round((completed / checks.length) * 100);
}

const AssociationPublicPresenceCard = ({
  association,
}: AssociationPublicPresenceCardProps) => {
  const checks = getPresenceChecks(association);
  const score = getCompletionScore(checks);
  const allComplete = score === 100;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-lg border ${
              allComplete
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-violet-500/10 border-violet-500/20"
            }`}
          >
            <Globe
              className={`w-4 h-4 ${
                allComplete ? "text-emerald-400" : "text-violet-400"
              }`}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Presence publique
            </h3>
            <p className="text-[11px] text-muted-foreground/60">
              Visibilite de votre association
            </p>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              allComplete
                ? "bg-emerald-500/10 text-emerald-400"
                : score >= 50
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-red-500/10 text-red-400"
            }`}
          >
            {score}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-3">
        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${score}%`,
              background: allComplete
                ? "linear-gradient(90deg, #22c55e, #4ade80)"
                : score >= 50
                  ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                  : "linear-gradient(90deg, #ef4444, #f87171)",
            }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="px-5 pb-4">
        <div className="space-y-1.5">
          {checks.map((check) => (
            <div
              key={check.label}
              className="flex items-center gap-2.5 py-1.5"
            >
              {check.ok ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />
              )}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-muted-foreground/50">{check.icon}</span>
                <span
                  className={`text-xs ${
                    check.ok
                      ? "text-foreground/70"
                      : "text-muted-foreground/50"
                  }`}
                >
                  {check.label}
                </span>
              </div>
              {!check.ok && (
                <span className="text-[10px] text-amber-400/60 font-medium flex-shrink-0">
                  Manquant
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex items-center gap-2">
        {!allComplete && (
          <Link to="/association/parametres" className="flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs h-8 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/10"
            >
              <span className="flex items-center gap-1.5">
                <Settings className="w-3 h-3" />
                Completer la fiche
              </span>
              <ArrowRight className="w-3 h-3 opacity-50" />
            </Button>
          </Link>
        )}
        {association.slug && (
          <Link
            to={`/asso/${association.slug}`}
            className={!allComplete ? "" : "flex-1"}
          >
            <Button
              variant="ghost"
              size="sm"
              className={`justify-between text-xs h-8 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/10 ${
                allComplete ? "w-full" : ""
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ExternalLink className="w-3 h-3" />
                Voir la fiche publique
              </span>
              <ArrowRight className="w-3 h-3 opacity-50" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default AssociationPublicPresenceCard;
