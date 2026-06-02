import { Lock, Award, Star, Gem, Crown } from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge as BadgeType } from "@/hooks/useProfile";

interface BadgeCardProps {
  badge: BadgeType;
  isUnlocked: boolean;
  earnedAt?: string;
}

const getRarityStyles = (rarity: string | null) => {
  switch (rarity) {
    case "legendary":
      return {
        bg: "from-purple-600/30 via-pink-500/20 to-purple-600/30",
        border: "border-purple-500/50",
        glow: "shadow-purple-500/50",
        icon: Crown,
        label: "Légendaire"
      };
    case "epic":
      return {
        bg: "from-violet-600/30 via-indigo-500/20 to-violet-600/30",
        border: "border-violet-500/50",
        glow: "shadow-violet-500/50",
        icon: Gem,
        label: "Épique"
      };
    case "rare":
      return {
        bg: "from-blue-600/30 via-cyan-500/20 to-blue-600/30",
        border: "border-blue-500/50",
        glow: "shadow-blue-500/50",
        icon: Star,
        label: "Rare"
      };
    default:
      return {
        bg: "from-slate-600/30 via-gray-500/20 to-slate-600/30",
        border: "border-slate-500/50",
        glow: "shadow-slate-500/30",
        icon: Award,
        label: "Commun"
      };
  }
};

const BadgeCard = ({ badge, isUnlocked, earnedAt }: BadgeCardProps) => {
  const rarityStyle = getRarityStyles(badge.rarity);
  const RarityIcon = rarityStyle.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          className={`relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
            isUnlocked
              ? `bg-gradient-to-br ${rarityStyle.bg} ${rarityStyle.border} hover:scale-105`
              : "bg-muted/30 border-muted opacity-50 grayscale"
          }`}
          whileHover={isUnlocked ? { y: -4 } : {}}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Glow effect for unlocked badges */}
          {isUnlocked && (
            <motion.div
              className={`absolute inset-0 rounded-xl ${rarityStyle.glow}`}
              animate={{
                boxShadow: [
                  `0 0 15px 0px currentColor`,
                  `0 0 25px 5px currentColor`,
                  `0 0 15px 0px currentColor`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ color: `hsl(var(--primary))` }}
            />
          )}

          <div className="relative flex flex-col items-center gap-3 text-center">
            {/* Badge icon */}
            <div className={`relative p-3 rounded-full ${
              isUnlocked 
                ? "bg-gradient-to-br from-primary/20 to-primary/10" 
                : "bg-muted"
            }`}>
              {isUnlocked ? (
                <span className="text-3xl">{badge.icon}</span>
              ) : (
                <Lock className="w-8 h-8 text-muted-foreground" />
              )}
            </div>

            {/* Badge name */}
            <div>
              <h4 className={`font-semibold text-sm ${
                isUnlocked ? "text-foreground" : "text-muted-foreground"
              }`}>
                {badge.name}
              </h4>
              
              {/* Rarity indicator */}
              <div className="flex items-center justify-center gap-1 mt-1">
                <RarityIcon className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {rarityStyle.label}
                </span>
              </div>
            </div>

            {/* Earned date for unlocked badges */}
            {isUnlocked && earnedAt && (
              <span className="text-xs text-muted-foreground">
                Obtenu le {new Date(earnedAt).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-2">
          <p className="font-semibold">{badge.name}</p>
          <p className="text-sm text-muted-foreground">
            {badge.description || "Accomplissez des défis pour débloquer ce badge."}
          </p>
          {badge.xp_reward && (
            <p className="text-xs text-primary">+{badge.xp_reward} XP</p>
          )}
          {badge.otk_reward && (
            <p className="text-xs text-yellow-400">+{badge.otk_reward} OTK</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default BadgeCard;
