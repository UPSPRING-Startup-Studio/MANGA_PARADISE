import { motion } from "framer-motion";
import { LibraryItem } from "@/hooks/useOtakuCollections";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MemberLibraryGridProps {
  items: LibraryItem[];
  type: "MANGA" | "ANIME" | "GAME";
}

const MemberLibraryGrid = ({ items, type }: MemberLibraryGridProps) => {
  const filteredItems = items.filter((item) => item.type === type);

  if (filteredItems.length === 0) return null;

  return (
    <TooltipProvider>
      <div className={type === "MANGA" || type === "GAME"
        ? "grid grid-cols-4 gap-2" 
        : "grid grid-cols-3 gap-2"
      }>
        {filteredItems.slice(0, type === "MANGA" ? 8 : 6).map((item, index) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`relative overflow-hidden rounded-lg cursor-pointer group ${
                  type === "MANGA" 
                    ? "aspect-[2/3]" 
                    : "aspect-square bg-black/40"
                }`}
              >
                <img
                  src={item.cover_url}
                  alt={item.title}
                  className={`w-full h-full transition-transform duration-300 group-hover:scale-110 ${
                    type === "MANGA" ? "object-cover" : "object-contain p-1"
                  }`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = type === "MANGA"
                      ? "https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=150&h=225&fit=crop"
                      : "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&h=100&fit=crop";
                  }}
                />
                {type === "MANGA" && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="absolute bottom-1 left-1 right-1 text-white text-[9px] font-medium truncate">
                      {item.title}
                    </p>
                  </div>
                )}
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-tokyo-night border-white/20">
              <p className="text-sm">{item.title}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      {filteredItems.length > (type === "MANGA" ? 8 : 6) && (
        <p className="text-white/40 text-xs mt-2 text-center">
          +{filteredItems.length - (type === "MANGA" ? 8 : 6)} autres
        </p>
      )}
    </TooltipProvider>
  );
};

export default MemberLibraryGrid;
