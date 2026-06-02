import { motion } from "framer-motion";
import { X } from "lucide-react";

interface MangaCardProps {
  id: string;
  title: string;
  coverImage: string;
  onDelete: (id: string) => void;
}

const MangaCard = ({ id, title, coverImage, onDelete }: MangaCardProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ 
        y: -8, 
        rotateY: 5,
        boxShadow: "0 20px 40px -10px rgba(255, 107, 190, 0.3)"
      }}
      className="relative group cursor-pointer"
      style={{ perspective: "1000px" }}
    >
      {/* Card container with book aspect ratio */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-lg transform-gpu transition-all duration-300">
        {/* Cover Image */}
        <img
          src={coverImage}
          alt={title}
          className="w-full h-full object-cover"
        />
        
        {/* Hover overlay with title */}
        <div className="absolute inset-0 bg-gradient-to-t from-header-bg/90 via-header-bg/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h4 className="font-display text-white text-sm tracking-wide line-clamp-2">
              {title.toUpperCase()}
            </h4>
          </div>
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

        {/* Book spine effect */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-black/30 to-transparent" />
      </div>
    </motion.div>
  );
};

export default MangaCard;
