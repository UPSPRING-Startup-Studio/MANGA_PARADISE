import { Shield, Sword, Crown, Zap, Timer, TrendingUp, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { League, UserLeagueStats } from "@/hooks/useLeagueStats";

interface LeagueCardProps {
  currentLeague: League | null;
  nextLeague: League | null;
  userStats: UserLeagueStats | null;
  daysRemaining: number;
  progressPercent: number;
  questsRemaining: number;
}

const getLeagueIcon = (iconName: string, color: string) => {
  const iconProps = { className: "w-10 h-10", style: { color } };
  switch (iconName) {
    case "Sword": return <Sword {...iconProps} />;
    case "Crown": return <Crown {...iconProps} />;
    case "Zap": return <Zap {...iconProps} />;
    default: return <Shield {...iconProps} />;
  }
};

const LeagueCard = ({
  currentLeague,
  nextLeague,
  userStats,
  daysRemaining,
  progressPercent,
  questsRemaining
}: LeagueCardProps) => {
  if (!currentLeague) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card/95 to-card/90 border-2"
        style={{ borderColor: currentLeague.color + "40" }}
      >
        {/* Glow effect */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            background: `radial-gradient(ellipse at top, ${currentLeague.color}40 0%, transparent 60%)`
          }}
        />

        <div className="relative p-6 space-y-6">
          {/* Header with rank */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                className="p-3 rounded-xl"
                style={{ backgroundColor: currentLeague.color + "20" }}
                animate={{ 
                  boxShadow: [
                    `0 0 20px ${currentLeague.color}40`,
                    `0 0 40px ${currentLeague.color}60`,
                    `0 0 20px ${currentLeague.color}40`
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {getLeagueIcon(currentLeague.icon, currentLeague.color)}
              </motion.div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Rang Actuel</p>
                <h2 className="text-2xl font-bold" style={{ color: currentLeague.color }}>
                  {currentLeague.name}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50">
              <Timer className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium">
                Fin de saison dans : <span className="text-orange-400 font-bold">{daysRemaining} jours</span>
              </span>
            </div>
          </div>

          {/* Progress section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Quêtes ce mois-ci
              </span>
              <span className="font-bold">
                {userStats?.quests_completed_this_month || 0} / {nextLeague?.min_quests || currentLeague.min_quests}
              </span>
            </div>

            <div className="relative">
              <Progress 
                value={progressPercent} 
                className="h-4 bg-muted"
              />
              <motion.div 
                className="absolute inset-0 rounded-full overflow-hidden"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${progressPercent}%`,
                    background: `linear-gradient(90deg, ${currentLeague.color}, ${nextLeague?.color || currentLeague.color})`,
                    boxShadow: `0 0 20px ${currentLeague.color}80`
                  }}
                />
              </motion.div>
            </div>

            {nextLeague && questsRemaining > 0 && (
              <p className="text-sm text-center">
                Plus que <span className="font-bold text-primary">{questsRemaining} quête{questsRemaining > 1 ? "s" : ""}</span> pour atteindre la{" "}
                <span className="font-bold" style={{ color: nextLeague.color }}>{nextLeague.name}</span>{" "}
                et gagner <span className="font-bold text-yellow-400">{nextLeague.monthly_rent} OTK</span> de rente !
              </p>
            )}

            {progressPercent >= 100 && (
              <p className="text-sm text-center text-green-400 font-medium">
                ✨ Objectif atteint ! Tu conserves ton rang pour le mois prochain.
              </p>
            )}
          </div>

          {/* Reward card */}
          <Card className="p-4 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10 border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Coins className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rente acquise pour le 31 du mois</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {currentLeague.monthly_rent} OTK
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Équivalent</p>
                <p className="font-medium text-yellow-200">
                  ~{(currentLeague.monthly_rent / 1000).toFixed(2)}€
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </motion.div>
  );
};

export default LeagueCard;
