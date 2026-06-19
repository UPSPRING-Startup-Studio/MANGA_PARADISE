import { motion } from "framer-motion";
import { BookOpen, MapPin, ShoppingBag, Frown, Music, Sparkles } from "lucide-react";

interface OtakuDNAProps {
  firstManga: string | null;
  japanDestination: string | null;
  japanMustBuy: string | null;
  socialNightmare: string | null;
  favoriteArtist: string | null;
  conActivity: string | null;
}

const OtakuDNA = ({
  firstManga,
  japanDestination,
  japanMustBuy,
  socialNightmare,
  favoriteArtist,
  conActivity,
}: OtakuDNAProps) => {
  const questions = [
    { icon: BookOpen, label: "Mon premier manga", value: firstManga, color: "text-sakura" },
    { icon: MapPin, label: "Ma destination de rêve au Japon", value: japanDestination, color: "text-turquoise" },
    { icon: ShoppingBag, label: "Mon must-buy au Japon", value: japanMustBuy, color: "text-amber-500" },
    { icon: Frown, label: "Ma hantise sociale en convention", value: socialNightmare, color: "text-red-400" },
    { icon: Music, label: "Mon artiste/groupe favori", value: favoriteArtist, color: "text-purple-400" },
    { icon: Sparkles, label: "Mon activité préférée en convention", value: conActivity, color: "text-green-400" },
  ].filter(q => q.value);

  if (questions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-6 border"
    >
      <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
        🧬 ADN OTAKU
      </h3>
      
      <div className="space-y-3">
        {questions.map((q, index) => (
          <motion.div
            key={q.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <q.icon className={`w-5 h-5 ${q.color} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">{q.label}</p>
              <p className="text-sm font-body text-foreground">{q.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default OtakuDNA;
