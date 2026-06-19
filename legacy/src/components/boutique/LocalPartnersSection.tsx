import { motion } from "framer-motion";
import { MapPin, Heart, Store } from "lucide-react";
import ProductCard from "./ProductCard";
import { ShopItem } from "@/hooks/useShopItems";

interface LocalPartnersSectionProps {
  products: ShopItem[];
  userBalance: number;
  onPurchase?: (item: ShopItem) => void;
}

const LocalPartnersSection = ({ products, userBalance, onPurchase }: LocalPartnersSectionProps) => {
  if (products.length === 0) return null;

  // Get unique partner names
  const partnerNames = [...new Set(products.map(p => p.partner_name).filter(Boolean))];

  return (
    <section className="py-12 bg-gradient-to-b from-turquoise/5 to-transparent">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <MapPin className="w-6 h-6 text-turquoise" />
            <h2 className="font-display text-3xl md:text-4xl text-turquoise">
              Partenaires Locaux
            </h2>
            <Heart className="w-5 h-5 text-sakura" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Soutenez l'économie locale ! Ces offres exclusives sont proposées par nos partenaires de la région.
          </p>
        </motion.div>

        {/* Partner logos/badges */}
        {partnerNames.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mb-8"
          >
            {partnerNames.map((partner, i) => (
              <div 
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-turquoise/10 border border-turquoise/30"
              >
                <Store className="w-4 h-4 text-turquoise" />
                <span className="text-sm text-turquoise">{partner}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              userBalance={userBalance}
              index={index}
              onPurchase={onPurchase}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LocalPartnersSection;
