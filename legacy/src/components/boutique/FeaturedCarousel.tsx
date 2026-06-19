import { motion } from "framer-motion";
import { Coins, Star, Trophy, Flame, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FeaturedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  badge?: string;
  badgeType: "popular" | "graal" | "promo" | "new";
  inStock: boolean;
}

export type { FeaturedProduct };

interface FeaturedCarouselProps {
  products: FeaturedProduct[];
  userBalance: number;
}

const FeaturedCarousel = ({ products, userBalance }: FeaturedCarouselProps) => {
  const getBadgeIcon = (type: string) => {
    switch (type) {
      case "popular":
        return <Flame className="w-4 h-4" />;
      case "graal":
        return <Trophy className="w-4 h-4" />;
      case "promo":
        return <Percent className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "popular":
        return "bg-gradient-to-r from-orange-500 to-red-500 text-white";
      case "graal":
        return "bg-gradient-to-r from-yellow-400 to-amber-500 text-black";
      case "promo":
        return "bg-gradient-to-r from-green-400 to-emerald-500 text-white";
      default:
        return "bg-primary text-primary-foreground";
    }
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="font-display text-4xl md:text-5xl text-primary mb-2">
            ✨ Vitrine Spéciale ✨
          </h2>
          <p className="text-muted-foreground">Les articles les plus convoités par la communauté</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product, index) => {
            const canAfford = userBalance >= product.price;
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.15 }}
                className={`relative group rounded-3xl overflow-hidden ${
                  !product.inStock ? "opacity-60" : ""
                }`}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Card */}
                <div className="relative bg-[hsl(255_22%_14%)] border border-primary/30 rounded-3xl overflow-hidden group-hover:border-primary/60 transition-colors">
                  {/* Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className={`${getBadgeStyle(product.badgeType)} shadow-lg flex items-center gap-1.5 px-3 py-1.5`}>
                      {getBadgeIcon(product.badgeType)}
                      {product.badge}
                    </Badge>
                  </div>

                  {/* Image */}
                  <div className="h-48 md:h-56 bg-gradient-to-br from-muted/30 to-background flex items-center justify-center">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="text-7xl opacity-30">
                        {product.badgeType === "graal" ? "🎮" : product.badgeType === "popular" ? "🎫" : "📺"}
                      </div>
                    )}
                    
                    {/* Out of stock overlay */}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center backdrop-blur-sm">
                        <div className="text-center px-6 py-4 bg-muted/80 rounded-xl">
                          <Trophy className="w-10 h-10 text-accent mx-auto mb-2" />
                          <span className="font-display text-xl text-foreground">Le Graal Suprême</span>
                          <p className="text-sm text-muted-foreground mt-1">Bientôt disponible</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="font-display text-2xl text-foreground mb-2 leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Price */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-xl border border-accent/30">
                        <Coins className="w-6 h-6 text-accent" />
                        <span className="font-display text-3xl text-accent text-glow-yellow">
                          {product.price.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-muted-foreground">OTK</span>
                    </div>

                    {/* Button */}
                    {product.inStock && (
                      <Button 
                        variant={canAfford ? "cta" : "outline"} 
                        size="lg"
                        className="w-full"
                        disabled={!canAfford}
                      >
                        {canAfford ? "🎉 Échanger maintenant" : `Manque ${(product.price - userBalance).toLocaleString()} OTK`}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCarousel;
