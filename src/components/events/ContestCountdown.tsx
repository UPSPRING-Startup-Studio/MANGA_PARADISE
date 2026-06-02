import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContestCountdownProps {
  deadline: string; // ISO date string (YYYY-MM-DD or full ISO)
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number; // Total milliseconds remaining
}

/**
 * Calculate time remaining until deadline
 */
const calculateTimeRemaining = (deadline: string): TimeRemaining => {
  const now = new Date().getTime();
  const deadlineTime = new Date(deadline).getTime();
  const total = deadlineTime - now;

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
};

/**
 * Get urgency level based on time remaining
 */
const getUrgencyLevel = (timeRemaining: TimeRemaining): "normal" | "warning" | "critical" | "expired" => {
  if (timeRemaining.total <= 0) return "expired";
  
  const hoursRemaining = timeRemaining.days * 24 + timeRemaining.hours;
  
  if (hoursRemaining < 24) return "critical"; // < 24h
  if (timeRemaining.days < 3) return "warning"; // < 3 days
  return "normal"; // > 3 days
};

/**
 * Countdown timer for contest registration deadline
 * - 🟢 > 3 days: Normal (Green)
 * - 🟠 < 3 days: Warning (Orange)
 * - 🔴 < 24h: Critical (Red + Pulse animation)
 * - ⚫ Expired: Closed (Gray)
 */
export const ContestCountdown = ({ deadline, className }: ContestCountdownProps) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(deadline)
  );

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(deadline));
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const urgency = getUrgencyLevel(timeRemaining);

  // Urgency-based styling
  const urgencyConfig = {
    normal: {
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      text: "text-green-400",
      glow: "shadow-[0_0_15px_rgba(34,197,94,0.2)]",
      icon: Clock,
      label: "Temps restant",
      pulse: false,
    },
    warning: {
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      text: "text-orange-400",
      glow: "shadow-[0_0_15px_rgba(249,115,22,0.3)]",
      icon: AlertTriangle,
      label: "⚠️ Plus que",
      pulse: false,
    },
    critical: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]",
      icon: AlertTriangle,
      label: "🔴 DERNIÈRES HEURES",
      pulse: true,
    },
    expired: {
      bg: "bg-mp-cloud/30",
      border: "border-slate-600/30",
      text: "text-mp-ink-muted",
      glow: "",
      icon: Clock,
      label: "🚫 Inscriptions closes",
      pulse: false,
    },
  };

  const config = urgencyConfig[urgency];
  const Icon = config.icon;

  // If expired, show simple message
  if (urgency === "expired") {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 px-4 py-2 rounded-lg border backdrop-blur-sm",
          config.bg,
          config.border,
          config.text,
          className
        )}
      >
        <Icon className="w-4 h-4" />
        <span className="font-bold text-sm uppercase tracking-wide">{config.label}</span>
      </div>
    );
  }

  return (
    <motion.div
      animate={config.pulse ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className={cn(
        "flex flex-col gap-2 p-4 rounded-lg border backdrop-blur-sm",
        config.bg,
        config.border,
        config.glow,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 justify-center">
        <Icon className={cn("w-4 h-4", config.text)} />
        <span className={cn("font-bold text-xs uppercase tracking-wide", config.text)}>
          {config.label}
        </span>
      </div>

      {/* Countdown Display - Monospace for stability */}
      <div className="flex items-center justify-center gap-2">
        {/* Days */}
        {timeRemaining.days > 0 && (
          <>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "font-mono text-2xl font-bold tabular-nums min-w-[3ch] text-center",
                  config.text
                )}
              >
                {String(timeRemaining.days).padStart(2, "0")}
              </div>
              <span className="text-xs text-muted-foreground uppercase">Jours</span>
            </div>
            <span className={cn("text-xl font-bold", config.text)}>:</span>
          </>
        )}

        {/* Hours */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "font-mono text-2xl font-bold tabular-nums min-w-[3ch] text-center",
              config.text
            )}
          >
            {String(timeRemaining.hours).padStart(2, "0")}
          </div>
          <span className="text-xs text-muted-foreground uppercase">Heures</span>
        </div>

        <span className={cn("text-xl font-bold", config.text)}>:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "font-mono text-2xl font-bold tabular-nums min-w-[3ch] text-center",
              config.text
            )}
          >
            {String(timeRemaining.minutes).padStart(2, "0")}
          </div>
          <span className="text-xs text-muted-foreground uppercase">Min</span>
        </div>

        {/* Seconds - Only show if < 1 day */}
        {timeRemaining.days === 0 && (
          <>
            <span className={cn("text-xl font-bold", config.text)}>:</span>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "font-mono text-2xl font-bold tabular-nums min-w-[3ch] text-center",
                  config.text
                )}
              >
                {String(timeRemaining.seconds).padStart(2, "0")}
              </div>
              <span className="text-xs text-muted-foreground uppercase">Sec</span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
