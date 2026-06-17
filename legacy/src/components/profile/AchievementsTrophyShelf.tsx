import { Trophy, Award, CheckCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import type { CosplayAchievement } from "@/hooks/useCosplayAchievements";

interface AchievementsTrophyShelfProps {
  achievements: CosplayAchievement[];
}

const AchievementsTrophyShelf = ({ achievements }: AchievementsTrophyShelfProps) => {
  if (!achievements || achievements.length === 0) {
    return null;
  }

  return (
    <section className="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent rounded-xl p-4 border border-accent/20">
      <h3 className="text-accent font-display text-lg tracking-wide mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5" />
        🏆 Palmarès & Distinctions
      </h3>

      <div className="space-y-3">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
          >
            {/* Trophy/Medal Icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg shadow-accent/20">
              <Award className="w-6 h-6 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-display text-white tracking-wide truncate">
                  {achievement.award_title}
                </h4>
                {/* Certified Badge */}
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-medium flex-shrink-0">
                  <CheckCircle className="w-3 h-3" />
                  Certifié
                </span>
              </div>
              
              <p className="text-sm text-white/60 truncate">
                {achievement.contest_name}
              </p>
              
              <p className="text-xs text-white/40 flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(achievement.event_date), "MMMM yyyy", { locale: fr })}
              </p>
            </div>

            {/* Decorative shine effect */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default AchievementsTrophyShelf;
