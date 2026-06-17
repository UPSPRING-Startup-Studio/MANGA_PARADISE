import { motion } from "framer-motion";
import { Pencil, Trash2, Zap } from "lucide-react";

interface CosplayVSCardProps {
  id: string;
  characterName: string;
  universe: string;
  cosplayPhoto: string;
  officialImage: string;
  wearCount?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

const CosplayVSCard = ({ 
  id, 
  characterName, 
  universe, 
  cosplayPhoto, 
  officialImage,
  wearCount = 0,
  onEdit,
  onDelete 
}: CosplayVSCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative aspect-[16/10] bg-header-bg rounded-xl overflow-hidden border border-sakura/30 hover:border-sakura transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,107,190,0.2)]"
    >
      {/* Diagonal Split Images */}
      <div className="absolute inset-0 flex">
        {/* Left Side - Cosplay (60%) */}
        <div className="w-[60%] relative overflow-hidden">
          <img 
            src={cosplayPhoto} 
            alt="Cosplay"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            style={{ clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)" }}
          />
        </div>
        
        {/* Right Side - Original (40%) */}
        <div className="w-[40%] relative overflow-hidden -ml-[5%]">
          <img 
            src={officialImage} 
            alt={characterName}
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            style={{ clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0 100%)" }}
          />
          {/* Slight overlay to push it back visually */}
          <div className="absolute inset-0 bg-header-bg/20" style={{ clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0 100%)" }} />
        </div>
      </div>

      {/* VS Badge */}
      <div className="absolute top-1/2 left-[55%] -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-10 h-10 bg-gradient-to-br from-sakura to-otk rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,107,190,0.4)]">
          <Zap className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Character Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-header-bg via-header-bg/90 to-transparent p-3">
        <p className="font-display text-sm text-white tracking-wider truncate">{characterName}</p>
        <p className="font-body text-xs text-white/50 truncate">{universe}</p>
      </div>

      {/* Labels */}
      <div className="absolute top-2 left-2 bg-header-bg/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-display text-sakura">
        TOI
      </div>
      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
        <div className="bg-header-bg/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-display text-otk">
          ORIGINAL
        </div>
        {wearCount > 0 && (
          <div className="bg-gradient-to-r from-amber-500/80 to-orange-500/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-display text-white flex items-center gap-1">
            🏅 Porté {wearCount}x
          </div>
        )}
      </div>

      {/* Actions on Hover */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button 
          onClick={onEdit}
          className="p-2 bg-header-bg/90 rounded-lg hover:bg-sakura/80 transition-colors"
          title="Modifier"
        >
          <Pencil className="w-4 h-4 text-white" />
        </button>
        <button 
          onClick={onDelete}
          className="p-2 bg-header-bg/90 rounded-lg hover:bg-destructive/80 transition-colors"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4 text-white" />
        </button>
      </div>
    </motion.div>
  );
};

export default CosplayVSCard;
