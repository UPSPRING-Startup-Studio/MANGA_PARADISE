import { Trophy, Clock, CheckCircle, XCircle, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CosplayAchievement } from "@/hooks/useCosplayAchievements";

interface AchievementCardProps {
  achievement: CosplayAchievement;
  onDelete?: (id: string, proofUrl: string) => void;
  showStatus?: boolean;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: "En attente de validation",
    shortLabel: "En attente",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    pulseAnimation: true,
  },
  approved: {
    icon: CheckCircle,
    label: "Validé",
    shortLabel: "Validé",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    pulseAnimation: false,
  },
  rejected: {
    icon: XCircle,
    label: "Refusé",
    shortLabel: "Refusé",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    pulseAnimation: false,
  },
};

const AchievementCard = ({ achievement, onDelete, showStatus = true }: AchievementCardProps) => {
  const status = statusConfig[achievement.status];
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        "relative p-4 rounded-xl border transition-all",
        status.bg,
        status.border
      )}
    >
      <div className="flex items-start gap-3">
        {/* Trophy Icon */}
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          achievement.status === "approved" ? "bg-accent/20" : "bg-muted"
        )}>
          <Trophy className={cn(
            "w-5 h-5",
            achievement.status === "approved" ? "text-accent" : "text-muted-foreground"
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-display text-foreground tracking-wide truncate">
            {achievement.award_title}
          </h4>
          <p className="text-sm text-muted-foreground truncate">
            {achievement.contest_name}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {format(new Date(achievement.event_date), "d MMMM yyyy", { locale: fr })}
          </p>
        </div>

        {/* Status Badge */}
        {showStatus && (
          <Badge 
            variant="outline"
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border",
              status.bg,
              status.color,
              status.border
            )}
          >
            {status.pulseAnimation && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
            <StatusIcon className="w-3 h-3" />
            <span className="hidden sm:inline">{status.label}</span>
            <span className="sm:hidden">{status.shortLabel}</span>
          </Badge>
        )}
      </div>

      {/* Pending Warning Message */}
      {achievement.status === "pending" && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-500/80 bg-amber-500/5 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>En cours de vérification par l'équipe Manga Paradise</span>
        </div>
      )}

      {/* Delete button for pending items */}
      {onDelete && achievement.status === "pending" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(achievement.id, achievement.proof_image_url)}
          className="absolute top-2 right-2 h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default AchievementCard;
