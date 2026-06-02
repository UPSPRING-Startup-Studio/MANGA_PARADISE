import { motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";

interface GameItem {
  id: string;
  title: string;
  cover_url: string;
}

interface GamesGridProps {
  games?: GameItem[] | null;
  isOwnProfile?: boolean;
}

const GamesGrid = ({ games, isOwnProfile }: GamesGridProps) => {
  // Defensive: ensure games is an array
  const safeGames = Array.isArray(games) ? games : [];
  if (safeGames.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-6 border"
    >
      <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
        <Gamepad2 className="w-5 h-5 text-turquoise" />
        {isOwnProfile ? "Mes jeux du moment" : "Jeux du moment"}
      </h3>
      
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {safeGames.slice(0, 10).map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative aspect-[3/4] rounded-lg overflow-hidden group shadow-md hover:shadow-lg transition-shadow"
          >
            <img
              src={game.cover_url}
              alt={game.title}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <p className="text-white text-xs font-body truncate w-full">
                {game.title}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default GamesGrid;
