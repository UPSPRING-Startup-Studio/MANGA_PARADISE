import { motion } from "framer-motion";
import { Drama } from "lucide-react";

interface CosplayItem {
  id: string;
  character_name: string;
  universe: string;
  user_image_url: string;
}

interface VestiaireGalleryProps {
  cosplays?: CosplayItem[] | null;
  onSelect?: (cosplay: CosplayItem) => void;
  isOwnProfile?: boolean;
}

const VestiaireGallery = ({ cosplays, onSelect, isOwnProfile }: VestiaireGalleryProps) => {
  // Defensive: ensure cosplays is an array
  const safeCosplays = Array.isArray(cosplays) ? cosplays : [];
  
  if (safeCosplays.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Drama className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Aucune incarnation dans le vestiaire.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-6 border"
    >
      <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
        👗 {isOwnProfile ? "Mon Vestiaire" : "Le Vestiaire"}
      </h3>
      
      {/* Masonry-style grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {safeCosplays.map((cosplay, index) => (
          <motion.div
            key={cosplay.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect?.(cosplay)}
            className="relative aspect-[3/4] rounded-xl overflow-hidden group cursor-pointer border shadow-md hover:shadow-xl transition-all hover:scale-[1.02]"
          >
            <img
              src={cosplay.user_image_url}
              alt={cosplay.character_name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
            
            {/* Info on hover */}
            <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <p className="text-white font-display text-sm md:text-base truncate">
                {cosplay.character_name}
              </p>
              <p className="text-white/70 text-xs truncate">
                {cosplay.universe}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default VestiaireGallery;
