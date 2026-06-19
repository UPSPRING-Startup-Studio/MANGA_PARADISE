import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useSpring } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Trash2,
  Flame,
  PauseCircle,
  PlayCircle,
  Star,
  ArrowUpCircle,
  Pencil,
  Euro,
  CalendarClock,
  StickyNote,
  Calculator,
  KanbanSquare,
  Presentation,
  Camera,
} from "lucide-react";
import { CosplayPlan, CosplanStatus } from "@/hooks/useCosplans";
import { useAutoProgress } from "@/hooks/useAutoProgress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { differenceInDays, parseISO } from "date-fns";

interface CosplanCardProps {
  plan: CosplayPlan;
  onUpdateProgress: (id: string, progress: number) => void;
  onUpdateStatus: (id: string, status: CosplanStatus) => void;
  onDelete: (id: string) => void;
  onTransfer: (plan: CosplayPlan) => void;
  onEdit: (plan: CosplayPlan) => void;
}

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  wishlist: {
    label: "Wishlist",
    icon: Star,
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  started: {
    label: "En cours",
    icon: PlayCircle,
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  in_progress: {
    label: "En cours",
    icon: PlayCircle,
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  paused: {
    label: "En pause",
    icon: PauseCircle,
    className: "bg-muted text-muted-foreground border-muted",
  },
  finished: {
    label: "Terminé",
    icon: Sparkles,
    className: "bg-sakura/20 text-sakura border-sakura/30",
  },
  completed: {
    label: "Terminé",
    icon: Sparkles,
    className: "bg-sakura/20 text-sakura border-sakura/30",
  },
};

const fallbackStatusConfig = {
  label: "Inconnu",
  icon: Star,
  className: "bg-muted text-muted-foreground border-muted",
};

export const CosplanCard = React.forwardRef<HTMLDivElement, CosplanCardProps>(
  function CosplanCard(
    { plan, onUpdateProgress, onUpdateStatus, onDelete, onTransfer, onEdit },
    ref
  ) {
  const navigate = useNavigate();
  const [localProgress, setLocalProgress] = useState(plan.progress_level ?? 0);

  const currentStatusConfig =
    statusConfig[plan?.status as string] ?? fallbackStatusConfig;
  const StatusIcon = currentStatusConfig.icon;

  const { displayProgress, progressColor } = useAutoProgress(
    plan.id,
    plan.auto_progress || false,
    plan.progress_level ?? 0
  );

  const springProgress = useSpring(displayProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    setLocalProgress(displayProgress ?? 0);
  }, [displayProgress]);

  const daysUntilDeadline = plan.deadline
    ? differenceInDays(parseISO(plan.deadline), new Date())
    : null;

  const isDeadlineClose =
    daysUntilDeadline !== null && daysUntilDeadline <= 30 && daysUntilDeadline >= 0;
  const isDeadlinePassed = daysUntilDeadline !== null && daysUntilDeadline < 0;

  const handleProgressChange = (value: number[]) => {
    setLocalProgress(value[0] ?? 0);
  };

  const handleProgressCommit = (value: number[]) => {
    onUpdateProgress(plan.id, value[0] ?? 0);
  };

  const toggleStatus = () => {
    const normalizedStatus =
      plan.status === "in_progress" ? "started" : plan.status;

    const newStatus: CosplanStatus =
      normalizedStatus === "paused" ? "started" : "paused";

    onUpdateStatus(plan.id, newStatus);
  };

  const isCompletedStatus =
    plan.status === "finished" || plan.status === "completed";

  const isStartedLikeStatus =
    plan.status === "started" || plan.status === "in_progress";

  const isReady =
    localProgress === 100 && !isCompletedStatus && !(plan as any).is_in_wardrobe;

  if (!plan) {
    return null;
  }

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative flex gap-4 p-4 rounded-xl border-2 transition-all ${
        isReady
          ? "bg-gradient-to-br from-sakura/10 to-accent/10 border-sakura/50"
          : isDeadlineClose
          ? "bg-gradient-to-br from-orange-500/5 to-amber-500/5 border-orange-500/30"
          : "bg-card/50 border-border/50 hover:border-sakura/30"
      }`}
    >
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onEdit(plan)}
        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground"
      >
        <Pencil className="w-4 h-4" />
      </Button>

      <div className="relative w-20 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        {plan.image_url ? (
          <img
            src={plan.image_url}
            alt={plan.character_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent && !parent.querySelector(".placeholder-emoji")) {
                const placeholder = document.createElement("div");
                placeholder.className =
                  "w-full h-full flex items-center justify-center text-muted-foreground text-2xl placeholder-emoji";
                placeholder.textContent = "🎭";
                parent.appendChild(placeholder);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl">
            🎭
          </div>
        )}

        {plan.priority > 0 && (
          <div className="absolute top-1 right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Flame className="w-3 h-3" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2 pr-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-display text-base text-foreground truncate">
              {plan.character_name}
            </h4>
            <p className="text-sm text-muted-foreground truncate">{plan.universe}</p>
          </div>

          <Badge
            variant="outline"
            className={`shrink-0 text-xs ${currentStatusConfig.className}`}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {currentStatusConfig.label}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Progression</span>
              {plan.auto_progress && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Calculator className="w-3 h-3 text-turquoise" />
                    </TooltipTrigger>
                    <TooltipContent>Progression automatique</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <motion.span
              className="font-bold"
              style={{
                color: localProgress === 100 ? "#00FF00" : progressColor,
              }}
              animate={{
                scale: localProgress === 100 ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              {localProgress ?? 0}%
            </motion.span>
          </div>

          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${displayProgress}%`,
                backgroundColor: progressColor,
                boxShadow: `0 0 10px ${progressColor}40`,
              }}
              initial={{ width: 0 }}
              animate={{
                width: `${displayProgress}%`,
                boxShadow: `0 0 ${
                  displayProgress === 100 ? "15px" : "10px"
                } ${progressColor}${displayProgress === 100 ? "80" : "40"}`,
              }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 30,
                restDelta: 0.001,
              }}
            />

            {localProgress === 100 && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "linear",
                }}
              />
            )}
          </div>

          {!plan.auto_progress && (
            <Slider
              value={[localProgress]}
              min={0}
              max={100}
              step={5}
              onValueChange={handleProgressChange}
              onValueCommit={handleProgressCommit}
              className="[&_[role=slider]]:bg-sakura [&_[role=slider]]:border-sakura opacity-0 hover:opacity-100 transition-opacity absolute inset-x-0 -mt-2"
            />
          )}
        </div>

        {(plan.budget || plan.deadline || plan.notes) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            {plan.budget && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Euro className="w-3 h-3" />
                      <span>{plan.budget}€</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Budget estimé</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {daysUntilDeadline !== null && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex items-center gap-1 ${
                        isDeadlinePassed
                          ? "text-destructive"
                          : isDeadlineClose
                          ? "text-orange-400 font-medium"
                          : ""
                      }`}
                    >
                      <CalendarClock className="w-3 h-3" />
                      <span>
                        {isDeadlinePassed
                          ? `J+${Math.abs(daysUntilDeadline)}`
                          : `J-${daysUntilDeadline}`}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isDeadlinePassed
                      ? "Date butoir dépassée"
                      : `${daysUntilDeadline} jours restants`}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {plan.notes && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <StickyNote className="w-3 h-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="whitespace-pre-wrap">{plan.notes}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          {isReady ? (
            <Button
              size="sm"
              onClick={() => onTransfer(plan)}
              className="flex-1 bg-gradient-to-r from-sakura to-accent text-white hover:opacity-90"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Transférer au Vestiaire
            </Button>
          ) : isCompletedStatus ? (
            <>
              {/* Completed cosplay: Vitrine + Photos */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/espace-membre/cosplay/${plan.id}?tab=overview`)}
                className="text-[hsl(var(--mp-primary))] hover:text-[hsl(var(--mp-primary))]/80 hover:bg-[hsl(var(--mp-primary))]/10"
                title="Voir la Vitrine"
              >
                <Presentation className="w-4 h-4 mr-1" />
                Vitrine
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/espace-membre/cosplay/${plan.id}?tab=photos`)}
                className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10"
                title="Voir les photos"
              >
                <Camera className="w-4 h-4 mr-1" />
                Photos
              </Button>
            </>
          ) : (
            <>
              {isStartedLikeStatus || plan.status === "paused" ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/espace-membre/cosplay/${plan.id}?tab=tasks`)}
                    className="text-[hsl(var(--mp-info))] hover:text-[hsl(var(--mp-info))]/80 hover:bg-[hsl(var(--mp-info))]/10"
                    title="Ouvrir le Kanban"
                  >
                    <KanbanSquare className="w-4 h-4 mr-1" />
                    Kanban
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/espace-membre/cosplay/${plan.id}?tab=photos`)}
                    className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10"
                    title="Voir les photos"
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    Photos
                  </Button>
                </>
              ) : null}

              {!isCompletedStatus && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleStatus}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {plan.status === "paused" ? (
                    <>
                      <PlayCircle className="w-4 h-4 mr-1" /> Reprendre
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-4 h-4 mr-1" /> Pause
                    </>
                  )}
                </Button>
              )}

              {plan.priority === 0 && !isCompletedStatus && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onUpdateStatus(plan.id, plan.status)}
                  className="text-orange-400 hover:text-orange-300"
                  title="Marquer prioritaire"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                </Button>
              )}
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive/80 ml-auto"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Le projet "{plan.character_name}" sera définitivement supprimé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(plan.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  );
  }
);