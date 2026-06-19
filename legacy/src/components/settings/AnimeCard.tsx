import { motion } from "framer-motion";
import { X } from "lucide-react";

interface AnimeCardProps {
  id: string;
  title: string;
  logoImage: string;
  backgroundImage?: string;
  onDelete: (id: string) => void;
}

const AnimeCard = ({ id, title, logoImage, backgroundImage, onDelete }: AnimeCardProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 0 30px rgba(174, 205, 196, 0.4)"
      }}
      className="relative group cursor-pointer"
    >
      {/* Card container - streaming platform style */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-header-bg shadow-lg border border-border/30">
        {/* Background blur effect */}
        {backgroundImage && (
          <div 
            className="absolute inset-0 opacity-30 blur-sm scale-110"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          />
        )}
        
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-header-bg/70" />
        
        {/* Logo centered */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <img
            src={logoImage}
            alt={title}
            className="max-w-[80%] max-h-[60%] object-contain drop-shadow-lg"
          />
        </div>

        {/* Title at bottom (hidden until hover) */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-header-bg to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <h4 className="font-display text-white text-xs tracking-wide text-center">
            {title.toUpperCase()}
          </h4>
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="absolute top-2 right-2 p-1.5 bg-destructive/90 text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Glow border effect on hover */}
        <div className="absolute inset-0 rounded-xl border-2 border-turquoise/0 group-hover:border-turquoise/50 transition-all duration-300 pointer-events-none" />
      </div>
    </motion.div>
  );
};

export default AnimeCard;
