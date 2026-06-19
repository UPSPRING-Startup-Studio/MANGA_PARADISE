import { motion } from "framer-motion";
import { Gamepad2, Target, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface GamerIdentityCardProps {
  playStyle?: string | null;
  platforms?: string[] | null;
  gamerIds?: Record<string, string> | null;
  favoriteGenre?: string | null;
  mobileVice?: string | null;
  rageTrigger?: string | null;
  friendshipBreaker?: string | null;
}

const platformInfo: Record<string, { emoji: string; label: string }> = {
  pc: { emoji: "🖥️", label: "PC" },
  ps5: { emoji: "🎮", label: "PlayStation" },
  xbox: { emoji: "🟢", label: "Xbox" },
  switch: { emoji: "🕹️", label: "Switch" },
  mobile: { emoji: "📱", label: "Mobile" },
  retro: { emoji: "👾", label: "Rétro" },
};

const gamerTagPlatforms = [
  { key: "steam", label: "Steam", icon: "🎮" },
  { key: "psn", label: "PSN", icon: "🔵" },
  { key: "xbox", label: "Xbox Live", icon: "🟢" },
  { key: "nintendo", label: "Nintendo", icon: "🔴" },
  { key: "riot", label: "Riot Games", icon: "⚔️" },
  { key: "battlenet", label: "Battle.net", icon: "💙" },
  { key: "discord", label: "Discord", icon: "💬" },
];

const playStyleLabels: Record<string, { emoji: string; label: string; description: string }> = {
  casual: { emoji: "🎲", label: "Casual", description: "Joue pour le plaisir" },
  tryhard: { emoji: "🔥", label: "Tryhard", description: "La victoire à tout prix" },
  completionist: { emoji: "🏆", label: "Complétionniste", description: "100% ou rien" },
  explorer: { emoji: "🗺️", label: "Explorateur", description: "Chaque recoin compte" },
  social: { emoji: "👥", label: "Social", description: "Les amis avant tout" },
  speedrunner: { emoji: "⚡", label: "Speedrunner", description: "Contre la montre" },
};

const CopyableGamertag = ({ platform, value }: { platform: string; value: string }) => {
  const [copied, setCopied] = useState(false);
  const info = gamerTagPlatforms.find(p => p.key === platform);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!info) return null;

  return (
    <motion.div 
      className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg group hover:bg-muted/80 transition-colors"
      whileHover={{ scale: 1.02 }}
    >
      <span className="text-lg">{info.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{info.label}</p>
        <p className="font-mono text-sm text-foreground truncate">{value}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 h-auto"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>
    </motion.div>
  );
};

const GamerIdentityCard = ({
  playStyle,
  platforms,
  gamerIds,
  favoriteGenre,
  mobileVice,
  rageTrigger,
  friendshipBreaker,
}: GamerIdentityCardProps) => {
  // Defensive: ensure arrays/objects are safe
  const safePlatforms = Array.isArray(platforms) ? platforms : [];
  const safeGamerIds = gamerIds && typeof gamerIds === 'object' && !Array.isArray(gamerIds) ? gamerIds : {};
  
  const styleInfo = playStyle ? playStyleLabels[playStyle] : null;
  const activeGamerIds = Object.entries(safeGamerIds).filter(([_, value]) => value);
  
  const hasContent = playStyle || safePlatforms.length > 0 || activeGamerIds.length > 0;
  if (!hasContent) return null;

  const gamerDNA = [
    { label: "Genre préféré", value: favoriteGenre, emoji: "🎯" },
    { label: "Vice mobile", value: mobileVice, emoji: "📱" },
    { label: "Rage trigger", value: rageTrigger, emoji: "😤" },
    { label: "Briseur d'amitié", value: friendshipBreaker, emoji: "💔" },
  ].filter(q => q.value);

  return (
    <div className="space-y-6">
      {/* Play Style Card - RPG Class Style */}
      {styleInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-turquoise/20 via-background to-accent/10 rounded-xl p-6 border border-turquoise/30 relative overflow-hidden"
        >
          {/* Decorative grid */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `linear-gradient(hsl(var(--turquoise)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--turquoise)) 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }} />
          
          <div className="relative flex items-center gap-4">
            <div className="text-5xl">{styleInfo.emoji}</div>
            <div>
              <p className="text-xs text-turquoise uppercase tracking-wider font-display">Style de Jeu</p>
              <h3 className="text-2xl font-display text-foreground">{styleInfo.label}</h3>
              <p className="text-sm text-muted-foreground">{styleInfo.description}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Platforms */}
      {safePlatforms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-6 border"
        >
          <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-turquoise" />
            Plateformes
          </h3>
          <div className="flex flex-wrap gap-2">
            {safePlatforms.map((platform) => {
              const info = platformInfo[platform];
              return (
                <Badge 
                  key={platform} 
                  variant="secondary" 
                  className="bg-turquoise/20 text-foreground px-3 py-1.5 text-sm"
                >
                  <span className="mr-1.5">{info?.emoji || "🎮"}</span>
                  {info?.label || platform}
                </Badge>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Gamertags */}
      {activeGamerIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-6 border"
        >
          <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
            🏷️ Gamertags
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {activeGamerIds.map(([platform, value]) => (
              <CopyableGamertag key={platform} platform={platform} value={value} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Gamer DNA */}
      {gamerDNA.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl p-6 border"
        >
          <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
            🧬 ADN GAMER
          </h3>
          <div className="space-y-3">
            {gamerDNA.map((q, index) => (
              <div
                key={q.label}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <span className="text-lg">{q.emoji}</span>
                <div>
                  <p className="text-xs text-muted-foreground">{q.label}</p>
                  <p className="text-sm font-body text-foreground">{q.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GamerIdentityCard;
