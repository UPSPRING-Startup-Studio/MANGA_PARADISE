import { motion } from "framer-motion";
import { User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CharacterDuelDisplayProps {
  bestCharacterId: string | null;
  worstCharacterId: string | null;
}

interface Character {
  id: string;
  name: string;
  official_image_url: string | null;
  universe: { name: string } | null;
}

const CharacterDuelDisplay = ({ bestCharacterId, worstCharacterId }: CharacterDuelDisplayProps) => {
  // Fetch best character
  const { data: bestCharacter } = useQuery({
    queryKey: ["ref-character", bestCharacterId],
    queryFn: async () => {
      if (!bestCharacterId) return null;
      const { data, error } = await supabase
        .from("ref_characters")
        .select("id, name, official_image_url, universe:ref_universes(name)")
        .eq("id", bestCharacterId)
        .single();
      if (error) return null;
      return data as Character;
    },
    enabled: !!bestCharacterId,
  });

  // Fetch worst character
  const { data: worstCharacter } = useQuery({
    queryKey: ["ref-character", worstCharacterId],
    queryFn: async () => {
      if (!worstCharacterId) return null;
      const { data, error } = await supabase
        .from("ref_characters")
        .select("id, name, official_image_url, universe:ref_universes(name)")
        .eq("id", worstCharacterId)
        .single();
      if (error) return null;
      return data as Character;
    },
    enabled: !!worstCharacterId,
  });

  if (!bestCharacterId && !worstCharacterId) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden border shadow-lg"
    >
      <h3 className="font-display text-lg text-foreground p-4 pb-0 flex items-center gap-2">
        ⚔️ LE DUEL
      </h3>

      <div className="relative h-64 md:h-72 flex">
        {/* LEFT SIDE - The Glory (Best Character) */}
        <div className="relative flex-1 overflow-hidden">
          {/* Background gradient - Sakura/Light */}
          <div className="absolute inset-0 bg-gradient-to-br from-sakura/20 via-pink-100/30 to-amber-100/20 dark:from-sakura/30 dark:via-pink-900/20 dark:to-amber-900/10" />
          
          {/* Sakura petals decoration */}
          <div className="absolute top-4 left-4 text-3xl opacity-30">🌸</div>
          
          {/* Spotlight overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,215,0,0.2)_0%,_transparent_70%)] opacity-50" />
          
          {/* Character image or placeholder */}
          {bestCharacter?.official_image_url ? (
            <img
              src={bestCharacter.official_image_url}
              alt={bestCharacter.name}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          ) : bestCharacterId ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-16 h-16 text-sakura/40" />
            </div>
          ) : null}
          
          {/* Golden glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 via-transparent to-transparent" />
          
          {/* Title badge */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <p className="font-display text-xs text-amber-300 tracking-wider mb-1">MON GOAT 👑</p>
            {bestCharacter && (
              <>
                <p className="text-white font-semibold text-base truncate">{bestCharacter.name}</p>
                {bestCharacter.universe && (
                  <p className="text-white/70 text-xs truncate">{bestCharacter.universe.name}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* VS Badge - Center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-red-600 rounded-full blur-xl opacity-60 animate-pulse" />
            <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-4 border-white/30 flex items-center justify-center shadow-2xl">
              <span className="font-display text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-400 via-white to-red-500 bg-clip-text text-transparent">
                VS
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - The Shadow (Worst Character) */}
        <div className="relative flex-1 overflow-hidden">
          {/* Background gradient - Dark/Red */}
          <div className="absolute inset-0 bg-gradient-to-bl from-gray-900/90 via-red-950/50 to-gray-800/90" />
          
          {/* Skull decoration */}
          <div className="absolute top-4 right-4 text-3xl opacity-20">💀</div>
          
          {/* Character image or placeholder */}
          {worstCharacter?.official_image_url ? (
            <img
              src={worstCharacter.official_image_url}
              alt={worstCharacter.name}
              className="absolute inset-0 w-full h-full object-cover object-top filter saturate-50"
            />
          ) : worstCharacterId ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-16 h-16 text-red-500/40" />
            </div>
          ) : null}
          
          {/* Dark fog overlay */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Title badge */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="font-display text-xs text-red-400 tracking-wider mb-1">MA HANTISE 💀</p>
            {worstCharacter && (
              <>
                <p className="text-white font-semibold text-base truncate">{worstCharacter.name}</p>
                {worstCharacter.universe && (
                  <p className="text-white/70 text-xs truncate">{worstCharacter.universe.name}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CharacterDuelDisplay;
