import { motion } from "framer-motion";
import { Sparkles, Clock, CheckCircle2, Loader2, AlertCircle, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useContestRegistration, ContestRegistrationStatus } from "@/hooks/useContestRegistration";

interface ContestRegistrationButtonProps {
  activityId: string;
  onRegisterClick: () => void;
  onViewPassClick?: () => void;
  className?: string;
  registrationDeadline?: string; // ISO date string for registration deadline
}

/**
 * Smart button that adapts based on user's contest registration status
 * - Not registered: Gold "✨ M'inscrire au Concours" button
 * - Pending: Gray/Blue "⏳ Candidature en examen" button (disabled or opens recap)
 * - Approved: Green "✅ Qualifié - Voir mon pass" button
 * - Rejected: Red/Orange "❌ Candidature refusée" button (disabled)
 * - Waitlist: Orange "⏳ Liste d'attente" button
 */
export const ContestRegistrationButton = ({
  activityId,
  onRegisterClick,
  onViewPassClick,
  className,
  registrationDeadline,
}: ContestRegistrationButtonProps) => {
  const { data: registration, isLoading } = useContestRegistration(activityId);

  // Check if registration deadline has passed
  const isDeadlinePassed = registrationDeadline
    ? new Date(registrationDeadline).getTime() < new Date().getTime()
    : false;

  // Check if deadline is within 24 hours (for pulse animation)
  const isUrgent = registrationDeadline
    ? new Date(registrationDeadline).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 &&
      !isDeadlinePassed
    : false;

  // Loading state
  if (isLoading) {
    return (
      <Button
        disabled
        className={cn(
          "gap-2 font-bold uppercase tracking-wide",
          "bg-mp-cloud/50 text-mp-ink-muted border-slate-600/30",
          className
        )}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Chargement...
      </Button>
    );
  }

  // Deadline passed - Show disabled button
  if (isDeadlinePassed && !registration) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            disabled
            className={cn(
              "gap-2 font-bold uppercase tracking-wide cursor-not-allowed",
              "bg-mp-cloud/30 text-mp-ink-muted border-slate-600/30",
              className
            )}
          >
            <Ban className="w-4 h-4" />
            🚫 Inscriptions Closes
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-mp-paper text-white border-white/20">
          La date limite d'inscription est dépassée
        </TooltipContent>
      </Tooltip>
    );
  }

  // No registration - Show register button (with pulse if urgent)
  if (!registration) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={isUrgent ? { scale: [1, 1.03, 1] } : {}}
        transition={isUrgent ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
      >
        <Button
          onClick={onRegisterClick}
          className={cn(
            "gap-2 font-bold uppercase tracking-wide transition-all duration-300",
            "bg-gradient-to-r from-[hsl(var(--mp-saffron))] to-[#FFA500] text-black",
            "hover:shadow-[0_0_20px_rgba(255,215,0,0.5)]",
            "border-0",
            isUrgent && "animate-pulse",
            className
          )}
        >
          <Sparkles className="w-4 h-4" />
          M'inscrire au Concours
        </Button>
      </motion.div>
    );
  }

  // Status-based rendering
  const statusConfig: Record<
    ContestRegistrationStatus,
    {
      label: string;
      icon: React.ReactNode;
      className: string;
      disabled: boolean;
      onClick?: () => void;
      tooltip?: string;
    }
  > = {
    pending: {
      label: "⏳ Candidature en examen",
      icon: <Clock className="w-4 h-4" />,
      className:
        "bg-amber-400 text-slate-950 border-amber-500 cursor-not-allowed shadow-[0_0_20px_rgba(251,191,36,0.6)] font-extrabold",
      disabled: true,
    },
    approved: {
      label: "✅ Candidature Approuvée",
      icon: <CheckCircle2 className="w-4 h-4" />,
      className:
        "bg-green-500 text-white border-green-600 cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.6)] font-extrabold",
      disabled: true,
    },
    rejected: {
      label: "❌ Candidature refusée",
      icon: <span className="text-base">❌</span>,
      className:
        "bg-red-500 text-white border-red-600 cursor-not-allowed shadow-[0_0_20px_rgba(239,68,68,0.6)] font-extrabold",
      disabled: true,
    },
    waitlist: {
      label: "ℹ️ Sur liste d'attente",
      icon: <AlertCircle className="w-4 h-4" />,
      className:
        "bg-blue-500 text-white border-blue-600 cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.6)] font-extrabold",
      disabled: true,
      tooltip: "L'équipe reviendra vers vous si une place se libère.",
    },
  };

  const config = statusConfig[registration?.status || "pending"];

  const buttonContent = (
    <motion.div
      whileHover={!config.disabled ? { scale: 1.02 } : {}}
      whileTap={!config.disabled ? { scale: 0.98 } : {}}
    >
      <Button
        onClick={config.onClick}
        disabled={config.disabled}
        className={cn(
          "gap-2 font-bold uppercase tracking-wide transition-all duration-300",
          config.className,
          className
        )}
      >
        {config.icon}
        {config.label}
      </Button>
    </motion.div>
  );

  // Wrap with tooltip if available
  if (config.tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent className="bg-mp-paper text-white border-white/20">
          {config.tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return buttonContent;
};
