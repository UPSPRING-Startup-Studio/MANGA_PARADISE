import { motion } from "framer-motion";
import { CosplayItem } from "@/hooks/useOtakuCollections";

interface MemberVSCarouselProps {
  cosplays: CosplayItem[];
}

const MemberVSCarousel = ({ cosplays }: MemberVSCarouselProps) => {
  if (!cosplays || cosplays.length === 0) return null;

  return (
    <div className="overflow-x-auto pb-2 -mx-2 px-2">
      <div className="flex gap-4" style={{ minWidth: "max-content" }}>
        {cosplays.map((cosplay) => (
          <motion.div
            key={cosplay.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-64 h-36 rounded-xl overflow-hidden flex-shrink-0 group"
          >
            {/* User cosplay photo - Left side (60%) */}
            <div
              className="absolute inset-0 w-[60%]"
              style={{
                clipPath: "polygon(0 0, 100% 0, 70% 100%, 0 100%)",
              }}
            >
              <img
                src={cosplay.user_image_url}
                alt={`Cosplay de ${cosplay.character_name}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop";
                }}
              />
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white font-medium">
                TOI
              </div>
            </div>

            {/* Official character image - Right side (40%) */}
            <div
              className="absolute inset-0 left-[45%]"
              style={{
                clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)",
              }}
            >
              <img
                src={cosplay.official_image_url}
                alt={cosplay.character_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=300&h=200&fit=crop";
                }}
              />
              <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white font-medium">
                ORIGINAL
              </div>
            </div>

            {/* VS Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="w-8 h-8 bg-gradient-to-br from-sakura to-accent rounded-full flex items-center justify-center shadow-lg shadow-sakura/40">
                <span className="text-white text-[10px] font-bold font-display">VS</span>
              </div>
            </div>

            {/* Bottom overlay with character info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
              <p className="text-white font-display text-sm tracking-wide truncate">
                {cosplay.character_name}
              </p>
              <p className="text-white/60 text-[10px] truncate">{cosplay.universe}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MemberVSCarousel;
