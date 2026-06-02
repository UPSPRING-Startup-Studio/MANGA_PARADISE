import { motion } from "framer-motion";
import { Clock, Trophy, Users, CheckCircle, AlertCircle, XCircle, Info, DoorOpen, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Contest registration status type
export type ContestStatus = "approved" | "pending" | "waitlist" | "rejected";

// Contest registration data interface
export interface ContestRegistrationData {
  id: string;
  status: ContestStatus;
  character_name: string;
  universe?: string;
  format?: string; // "Solo", "Duo", "Groupe"
  group_name?: string;
  passage_order?: number;
  passage_time?: string; // Horaire de passage scène (ex: "14:30")
  judging_time?: string; // NEW: Horaire de pré-judging/convocation (ex: "13:45")
  contest_name?: string; // Nom du concours (ex: "Concours Cosplay Principal")
  description?: string; // Description du cosplay
  media_url?: string; // URL de la bande son ou image de référence
  media_type?: "audio" | "image"; // Type de média
}

interface ContestActivityModuleProps {
  contestData: ContestRegistrationData;
  className?: string;
  onClick?: () => void; // NEW: Callback pour ouvrir la modal
}

// Get status styling configuration with tooltip
const getStatusConfig = (status: ContestStatus) => {
  switch (status) {
    case "approved":
      return {
        borderColor: "border-green-500",
        bgColor: "bg-green-500/10",
        textColor: "text-green-400",
        glowColor: "shadow-[0_0_20px_rgba(34,197,94,0.3)]",
        icon: CheckCircle,
        label: "Validé",
        emoji: "✅",
        tooltip: "Votre candidature est validée ! Rendez-vous à l'heure indiquée.",
      };
    case "pending":
      return {
        borderColor: "border-yellow-500",
        bgColor: "bg-yellow-500/10",
        textColor: "text-yellow-400",
        glowColor: "shadow-[0_0_20px_rgba(234,179,8,0.3)]",
        icon: AlertCircle,
        label: "En examen",
        emoji: "⏳",
        tooltip: "Les organisateurs valident votre bande son et vos informations.",
      };
    case "waitlist":
      return {
        borderColor: "border-blue-500",
        bgColor: "bg-blue-500/10",
        textColor: "text-blue-400",
        glowColor: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
        icon: Info,
        label: "Liste d'attente",
        emoji: "ℹ️",
        tooltip: "Vous êtes sur liste d'attente. Nous vous contacterons si une place se libère.",
      };
    case "rejected":
      return {
        borderColor: "border-red-500",
        bgColor: "bg-red-500/10",
        textColor: "text-red-400",
        glowColor: "shadow-[0_0_20px_rgba(239,68,68,0.3)]",
        icon: XCircle,
        label: "Refusé",
        emoji: "❌",
        tooltip: "Votre candidature n'a pas été retenue pour cette édition.",
      };
  }
};

/**
 * ContestActivityModule - "La Bulle Compétition"
 *
 * Module distinct qui affiche les détails d'une inscription à un concours.
 * S'intègre visuellement dans ou sous la carte événement principale.
 * Utilise un code couleur strict selon le statut de la candidature.
 * Cliquable pour ouvrir la modal de détails.
 */
export const ContestActivityModule = ({ contestData, className, onClick }: ContestActivityModuleProps) => {
  const statusConfig = getStatusConfig(contestData.status);
  const StatusIcon = statusConfig.icon;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={cn("w-full", className)}
      >
        <Card
          onClick={onClick}
          className={cn(
            "relative overflow-hidden backdrop-blur-md border-2 transition-all duration-300",
            statusConfig.borderColor,
            statusConfig.bgColor,
            statusConfig.glowColor,
            onClick && "cursor-pointer hover:scale-[1.02] hover:shadow-2xl"
          )}
        >
          {/* Gradient overlay for extra depth */}
          <div
            className={cn(
              "absolute inset-0 opacity-20 pointer-events-none",
              "bg-gradient-to-br from-white/5 to-transparent"
            )}
          />

          <div className="relative p-4 space-y-3">
            {/* Header: Contest Title + Status Badge with Tooltip */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Trophy className={cn("w-5 h-5", statusConfig.textColor)} />
                <h4 className="font-display text-base text-white font-semibold">
                  {contestData.contest_name || "Ma Compétition"}
                </h4>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    className={cn(
                      "border-0 font-semibold text-xs cursor-help",
                      statusConfig.bgColor,
                      statusConfig.textColor
                    )}
                  >
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="bg-mp-paper border-white/10 text-white max-w-xs">
                  <p className="text-sm">{statusConfig.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </div>

          {/* Contest Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {/* Character Info */}
            <div className="flex items-start gap-2">
              <span className="text-[hsl(var(--mp-saffron))] font-semibold shrink-0">🎭 Personnage:</span>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">
                  {contestData.character_name}
                </div>
                {contestData.universe && (
                  <div className="text-white/50 text-xs truncate">
                    {contestData.universe}
                  </div>
                )}
              </div>
            </div>

            {/* Format */}
            {contestData.format && (
              <div className="flex items-center gap-2">
                <span className="text-[hsl(var(--mp-saffron))] font-semibold shrink-0">📋 Format:</span>
                <span className="text-white/80">{contestData.format}</span>
              </div>
            )}

            {/* Group Name */}
            {contestData.group_name && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[hsl(var(--mp-saffron))] shrink-0" />
                <span className="text-white/80 truncate">{contestData.group_name}</span>
              </div>
            )}

            {/* Passage Order */}
            {contestData.passage_order && (
              <div className="flex items-center gap-2">
                <span className="text-[hsl(var(--mp-saffron))] font-semibold shrink-0">🎬 Passage:</span>
                <span className="text-white/80">#{contestData.passage_order}</span>
              </div>
            )}
          </div>

          {/* Critical Info: Judging Time & Passage Time (if approved) */}
          {contestData.status === "approved" && (contestData.judging_time || contestData.passage_time) && (
            <div className="mt-3 space-y-2">
              {/* Pré-judging / Convocation */}
              {contestData.judging_time && (
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "p-3 rounded-lg border-2",
                    "bg-gradient-to-r from-cyan-500/20 to-blue-500/20",
                    "border-cyan-500/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <DoorOpen className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="text-xs text-cyan-300 font-semibold uppercase tracking-wider">
                        🚪 Convocation Pré-judging
                      </div>
                      <div className="text-lg font-display text-white font-bold">
                        {contestData.judging_time}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Passage Scène */}
              {contestData.passage_time && (
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "p-3 rounded-lg border-2",
                    "bg-gradient-to-r from-green-500/20 to-emerald-500/20",
                    "border-green-500/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-400 animate-pulse" />
                    <div>
                      <div className="text-xs text-green-300 font-semibold uppercase tracking-wider">
                        ⏰ Horaire de Passage Scène
                      </div>
                      <div className="text-lg font-display text-white font-bold">
                        {contestData.passage_time}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Pending/Waitlist Message */}
          {(contestData.status === "pending" || contestData.status === "waitlist") && (
            <div className={cn("text-xs", statusConfig.textColor, "flex items-center gap-1")}>
              <StatusIcon className="w-3 h-3" />
              <span>
                {contestData.status === "pending"
                  ? "Votre candidature est en cours d'examen par l'équipe organisatrice."
                  : "Vous êtes sur liste d'attente. Nous vous contacterons si une place se libère."}
              </span>
            </div>
          )}

          {/* Rejected Message */}
          {contestData.status === "rejected" && (
            <div className="text-xs text-red-400 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              <span>Votre candidature n'a pas été retenue pour cette édition.</span>
            </div>
          )}

          {/* Click indicator (if clickable) */}
          {onClick && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/50">
              <span>Cliquer pour voir les détails</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
    </TooltipProvider>
  );
};
