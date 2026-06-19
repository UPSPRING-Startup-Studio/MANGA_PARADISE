import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brush, 
  Megaphone, 
  Globe2, 
  Mic2, 
  Package, 
  Swords,
  Clock,
  Flame,
  Crown,
  Coins,
  Zap
} from "lucide-react";
import type { VolunteerQuest } from "@/hooks/useVolunteerQuests";

interface QuestCardProps {
  quest: VolunteerQuest;
  onAccept: (questId: string) => void;
  isAccepting?: boolean;
  isAccepted?: boolean;
}

const categoryConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  creation: { icon: <Brush className="w-4 h-4" />, label: "Création", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  communication: { icon: <Megaphone className="w-4 h-4" />, label: "Communication", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  culture: { icon: <Globe2 className="w-4 h-4" />, label: "Culture", color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  animation: { icon: <Mic2 className="w-4 h-4" />, label: "Animation", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  logistique: { icon: <Package className="w-4 h-4" />, label: "Logistique", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  general: { icon: <Swords className="w-4 h-4" />, label: "Général", color: "bg-muted text-muted-foreground" },
};

const priorityConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  normal: { icon: <Clock className="w-3 h-3" />, label: "Normal", color: "bg-muted text-muted-foreground" },
  urgent: { icon: <Flame className="w-3 h-3" />, label: "Urgent", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  legendary: { icon: <Crown className="w-3 h-3" />, label: "Légendaire", color: "bg-accent/20 text-accent border-accent/30" },
};

export const QuestCard = ({ quest, onAccept, isAccepting, isAccepted }: QuestCardProps) => {
  const category = categoryConfig[quest.category] || categoryConfig.general;
  const priority = priorityConfig[quest.priority] || priorityConfig.normal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-card/80 border-2 border-border hover:border-sakura/50 transition-all duration-300 group">
        {/* Priority glow effect */}
        {quest.priority === "legendary" && (
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-accent/10 animate-pulse" />
        )}
        {quest.priority === "urgent" && (
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10" />
        )}

        <div className="relative p-5 space-y-4">
          {/* Header with badges */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge className={`${category.color} flex items-center gap-1`}>
                {category.icon}
                {category.label}
              </Badge>
              <Badge className={`${priority.color} flex items-center gap-1`}>
                {priority.icon}
                {priority.label}
              </Badge>
            </div>
            <span className="text-2xl">{quest.icon || "⚔️"}</span>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h3 className="font-display text-lg leading-tight group-hover:text-sakura transition-colors">
              {quest.title}
            </h3>
            {quest.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {quest.description}
              </p>
            )}
          </div>

          {/* Deadline */}
          {quest.deadline && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Avant le {new Date(quest.deadline).toLocaleDateString("fr-FR")}</span>
            </div>
          )}

          {/* Rewards */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-accent font-display">
                <Coins className="w-5 h-5" />
                <span className="text-lg">+{quest.otk_reward}</span>
                <span className="text-xs text-muted-foreground">OTK</span>
              </div>
              <div className="flex items-center gap-1.5 text-turquoise font-display">
                <Zap className="w-4 h-4" />
                <span>+{quest.xp_reward}</span>
                <span className="text-xs text-muted-foreground">XP</span>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => onAccept(quest.id)}
              disabled={isAccepting || isAccepted}
              className={`font-display ${isAccepted ? "bg-muted text-muted-foreground" : "bg-sakura hover:bg-sakura/90"}`}
            >
              {isAccepted ? "Acceptée" : "J'accepte !"}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
