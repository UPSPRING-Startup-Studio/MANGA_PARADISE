import { useState } from "react";
import { motion } from "framer-motion";
import { categories, optimizeCloudinaryUrl, Partner, CategoryKey } from "./partnersData";

interface PartnerCardProps {
  partner: Partner;
  onClick: () => void;
  index: number;
}

const PartnerCard = ({ partner, onClick, index }: PartnerCardProps) => {
  const [imageError, setImageError] = useState(false);
  const category = categories[partner.category as CategoryKey] || categories.tous;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className={`
        group relative cursor-pointer rounded-xl p-6
        bg-white/50 backdrop-blur-sm border border-white/10
        hover:border-opacity-60 hover:${category.borderColor}
        transition-all duration-300
        hover:shadow-lg hover:${category.glowColor}
        hover:scale-[1.02]
      `}
      style={{
        boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)'
      }}
    >
      {/* Logo */}
      {partner.logo && !imageError && (
        <div className="relative w-full aspect-square mb-4 flex items-center justify-center overflow-hidden rounded-lg bg-white/5">
          <img
            src={optimizeCloudinaryUrl(partner.logo)}
            alt={partner.name}
            loading="lazy"
            className="max-w-[80%] max-h-[80%] object-contain transition-transform duration-300 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
          {/* Halo effect on hover */}
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${category.bgColor}`} />
        </div>
      )}

      {/* Fallback if no logo or error */}
      {(!partner.logo || imageError) && (
        <div className={`w-full aspect-square mb-4 flex items-center justify-center rounded-lg ${category.bgColor}`}>
          <span className="text-4xl">{category.emoji}</span>
        </div>
      )}

      {/* Partner Name */}
      <h3 className="text-white font-display text-lg font-semibold text-center mb-2 line-clamp-2 group-hover:text-white/90 transition-colors">
        {partner.name}
      </h3>

      {/* Type Badge */}
      <div className="flex justify-center">
        <span className={`text-xs px-3 py-1 rounded-full ${category.bgColor} ${category.textColor} border ${category.borderColor}`}>
          {partner.type}
        </span>
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>
    </motion.div>
  );
};

export default PartnerCard;
