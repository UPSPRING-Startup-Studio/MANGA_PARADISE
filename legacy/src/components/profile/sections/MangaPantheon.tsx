import { motion } from "framer-motion";
import { Crown, Medal, Award } from "lucide-react";

interface MangaPantheonProps {
  top3: { title: string; cover_url: string }[] | null | undefined;
}

const MangaPantheon = ({ top3 }: MangaPantheonProps) => {
  // Defensive: ensure top3 is an array
  const safeTop3 = Array.isArray(top3) ? top3 : [];
  if (safeTop3.length === 0) return null;

  const medals = [
    { icon: Crown, color: "text-amber-400", bgColor: "from-amber-400/30 to-amber-600/10", borderColor: "border-amber-400/50", label: "🥇" },
    { icon: Medal, color: "text-gray-300", bgColor: "from-gray-300/30 to-gray-400/10", borderColor: "border-gray-300/50", label: "🥈" },
    { icon: Award, color: "text-amber-600", bgColor: "from-amber-600/30 to-amber-700/10", borderColor: "border-amber-600/50", label: "🥉" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-6 border"
    >
      <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
        🏆 LE PANTHÉON
      </h3>
      
      <div className="flex gap-4 justify-center">
        {safeTop3.map((manga, index) => {
          const medal = medals[index];
          if (!medal) return null;
          
          return (
            <motion.div
              key={manga.title}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex flex-col items-center group"
            >
              {/* Crown/Medal badge */}
              <div className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-2xl`}>
                {medal.label}
              </div>
              
              {/* Manga cover */}
              <div 
                className={`relative w-20 h-28 md:w-24 md:h-32 rounded-lg overflow-hidden border-2 ${medal.borderColor} shadow-lg bg-gradient-to-b ${medal.bgColor} transition-transform group-hover:scale-105`}
              >
                <img
                  src={manga.cover_url}
                  alt={manga.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              
              {/* Title */}
              <p className="mt-2 text-xs font-body text-center text-foreground max-w-[80px] truncate">
                {manga.title}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MangaPantheon;
