import { motion } from "framer-motion";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from "recharts";
import { Progress } from "@/components/ui/progress";

interface GenreRadarProps {
  stats: Record<string, number> | null | undefined;
  genres: string[] | null | undefined;
}

const genreColors: Record<string, string> = {
  "Shonen": "bg-sakura",
  "Seinen": "bg-turquoise",
  "Shojo": "bg-pink-400",
  "Josei": "bg-purple-400",
  "Mecha": "bg-amber-500",
  "Isekai": "bg-green-400",
  "Slice of Life": "bg-blue-400",
  "Romance": "bg-rose-400",
  "Horror": "bg-red-500",
  "Sports": "bg-orange-400",
};

const GenreRadar = ({ stats, genres }: GenreRadarProps) => {
  // Defensive: ensure safe objects
  const safeStats = stats && typeof stats === 'object' ? stats : {};
  const safeGenres = Array.isArray(genres) ? genres : [];
  const hasStats = Object.keys(safeStats).length > 0;
  
  if (!hasStats && safeGenres.length === 0) return null;

  // Convert stats to chart data
  const chartData = hasStats
    ? Object.entries(safeStats).map(([genre, value]) => ({
        genre,
        value: (typeof value === 'number' ? value : 0) * 100,
      }))
    : safeGenres.map((genre) => ({
        genre,
        value: 80,
      }));

  // Only show radar chart if we have 3+ data points
  const showRadar = chartData.length >= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-6 border"
    >
      <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
        📊 RADAR DES GENRES
      </h3>

      {showRadar ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
              <PolarAngleAxis 
                dataKey="genre" 
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              />
              <Radar
                name="Intérêt"
                dataKey="value"
                stroke="hsl(var(--sakura))"
                fill="hsl(var(--sakura))"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="space-y-3">
          {chartData.map((item, index) => (
            <motion.div
              key={item.genre}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-1"
            >
              <div className="flex justify-between text-sm">
                <span className="font-body text-foreground">{item.genre}</span>
                <span className="text-muted-foreground">{Math.round(item.value)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`h-full ${genreColors[item.genre] || "bg-sakura"}`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default GenreRadar;
