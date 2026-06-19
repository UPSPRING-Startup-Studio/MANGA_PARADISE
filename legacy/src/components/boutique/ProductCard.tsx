import { motion } from "framer-motion";
import { Coins, Lock, Check, MapPin, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShopItem, getTypeLabel } from "@/hooks/useShopItems";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: ShopItem;
  userBalance: number;
  index: number;
  onPurchase?: (item: ShopItem) => void;
  isPurchasing?: boolean;
}

const ProductCard = ({ product, userBalance, index, onPurchase, isPurchasing }: ProductCardProps) => {
  const canAfford = userBalance >= product.price;
  const missingOTK = product.price - userBalance;
  const progressPercent = Math.min((userBalance / product.price) * 100, 100);
  const isLocal = product.partner_location !== null;
  const typeInfo = getTypeLabel(product.type);

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case "streaming": return "📺";
      case "gaming": return "🎮";
      case "cinema": return "🍿";
      case "event": return "🎫";
      case "local": return "📍";
      default: return "🛒";
    }
  };

  const getBadgeFromTags = () => {
    if (product.tags.includes("Best-Seller")) return { text: "🔥 Best-Seller", type: "popular" };
    if (product.tags.includes("Légendaire")) return { text: "🏆 Le Graal", type: "graal" };
    if (product.tags.includes("Promo")) return { text: "-10% Promo", type: "promo" };
    if (product.tags.includes("Mega Fan")) return { text: "⭐ Mega Fan", type: "new" };
    if (product.tags.includes("Indispensable")) return { text: "⚡ Indispensable", type: "new" };
    if (isLocal) return { text: `📍 ${product.partner_location}`, type: "local" };
    return null;
  };

  const badge = getBadgeFromTags();

  const getBadgeStyle = (type?: string) => {
    switch (type) {
      case "popular":
        return "bg-orange-500/90 text-white";
      case "graal":
        return "bg-gradient-to-r from-yellow-500 to-amber-600 text-black";
      case "promo":
        return "bg-green-500/90 text-white";
      case "new":
        return "bg-primary text-primary-foreground";
      case "local":
        return "bg-turquoise/90 text-tokyo-night";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "group relative rounded-2xl overflow-hidden transition-all duration-300 backdrop-blur-sm hover:shadow-xl",
        isLocal
          ? "bg-[hsl(255_22%_18%/0.9)] border-2 border-turquoise/40 hover:border-turquoise/70 hover:shadow-turquoise/10"
          : "bg-[hsl(255_22%_18%/0.8)] border border-primary/20 hover:border-primary/40 hover:shadow-primary/10"
      )}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className={`${getBadgeStyle(badge.type)} shadow-lg font-medium`}>
            {badge.text}
          </Badge>
        </div>
      )}

      {/* Type Badge - Top Right */}
      <div className="absolute top-3 right-3 z-10">
        <Badge className={cn("shadow-lg font-medium text-xs", typeInfo.color)}>
          {typeInfo.emoji} {typeInfo.label}
        </Badge>
      </div>

      {/* Image Area */}
      <div className="relative h-44 bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="text-6xl opacity-50">
            {getCategoryEmoji(product.category)}
          </div>
        )}
        
        {/* Out of stock overlay */}
        {!product.is_available && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="text-center">
              <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <span className="text-sm text-muted-foreground">Rupture de stock</span>
            </div>
          </div>
        )}

        {/* Partner overlay for local items */}
        {isLocal && product.partner_name && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-turquoise" />
              <span className="text-sm text-white font-medium">{product.partner_name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs text-muted-foreground mb-1 capitalize flex items-center gap-1">
          {getCategoryEmoji(product.category)} {product.category}
        </p>
        
        {/* Title */}
        <h3 className="font-display text-lg text-foreground mb-2 leading-tight line-clamp-2">
          {product.name}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {product.tags.slice(0, 3).map((tag, i) => (
            <span 
              key={i}
              className={cn(
                "text-xs px-2 py-0.5 rounded-full border",
                tag === "Digital" && "bg-blue-500/20 text-blue-300 border-blue-500/30",
                tag === "E-Ticket" && "bg-purple-500/20 text-purple-300 border-purple-500/30",
                tag === "Physique" && "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                tag === "Partenaire Local" && "bg-turquoise/20 text-turquoise border-turquoise/30",
                !["Digital", "E-Ticket", "Physique", "Partenaire Local"].includes(tag) && 
                  "bg-muted/50 text-muted-foreground border-border"
              )}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <Coins className="w-5 h-5 text-accent" />
          <span className="font-display text-3xl text-accent text-glow-yellow">
            {product.price.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">OTK</span>
        </div>

        {/* Stock indicator */}
        {product.stock !== null && product.stock > 0 && product.stock <= 10 && (
          <p className="text-xs text-orange-400 mb-2">
            ⚠️ Plus que {product.stock} en stock !
          </p>
        )}

        {/* Action Button */}
        {!product.is_available ? (
          <Button variant="outline" disabled className="w-full opacity-50">
            <Lock className="w-4 h-4 mr-2" />
            Indisponible
          </Button>
        ) : canAfford ? (
          <Button 
            variant="cta" 
            className="w-full group/btn"
            onClick={() => onPurchase?.(product)}
            disabled={isPurchasing}
          >
            {isPurchasing ? (
              <span className="animate-pulse">Traitement...</span>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                Échanger
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${progressPercent}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="h-full bg-gradient-to-r from-sakura/50 to-sakura rounded-full"
              />
            </div>
            <Button variant="outline" disabled className="w-full text-sm">
              Manque {missingOTK.toLocaleString()} OTK
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
