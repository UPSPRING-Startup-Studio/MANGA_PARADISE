import { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WalletBar from "@/components/boutique/WalletBar";
import FeaturedCarousel from "@/components/boutique/FeaturedCarousel";
import CategoryFilters from "@/components/boutique/CategoryFilters";
import ProductCard from "@/components/boutique/ProductCard";
import LocalPartnersSection from "@/components/boutique/LocalPartnersSection";
import { motion } from "framer-motion";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useShopItems, usePurchaseItem, shopCategories, ShopItem } from "@/hooks/useShopItems";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BazarAkihabara = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const userBalance = profile?.otk_coins || 0;
  
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [purchaseItem, setPurchaseItem] = useState<ShopItem | null>(null);

  const { data: shopItems = [], isLoading } = useShopItems();
  const purchaseMutation = usePurchaseItem();

  // Featured products (high price or special tags)
  const featuredProducts = useMemo(() => {
    return shopItems
      .filter(item => 
        item.tags.includes("Best-Seller") || 
        item.tags.includes("Légendaire") ||
        item.tags.includes("Mega Fan") ||
        item.price >= 50000
      )
      .slice(0, 4)
      .map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || "",
        price: item.price,
        badge: item.tags.includes("Légendaire") ? "🏆 Le Graal" : 
               item.tags.includes("Best-Seller") ? "🔥 Populaire" : 
               item.tags.includes("Mega Fan") ? "⭐ Mega Fan" : undefined,
        badgeType: item.tags.includes("Légendaire") ? "graal" as const : 
                   item.tags.includes("Best-Seller") ? "popular" as const : 
                   "new" as const,
        inStock: item.is_available,
      }));
  }, [shopItems]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return shopItems.filter((product) => {
      // Filter by category
      const categoryMatch = 
        selectedCategory === "all" ||
        product.category === selectedCategory;
      
      // Filter by search
      const searchMatch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.partner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      
      return categoryMatch && searchMatch;
    });
  }, [shopItems, selectedCategory, searchQuery]);

  // Local partner products
  const localProducts = useMemo(() => {
    return shopItems.filter(p => p.category === "local" || p.partner_location !== null);
  }, [shopItems]);

  // Main products (exclude local when showing all, unless specifically filtered)
  const mainProducts = useMemo(() => {
    if (selectedCategory === "local") {
      return filteredProducts;
    }
    if (selectedCategory === "all") {
      return filteredProducts.filter(p => p.category !== "local");
    }
    return filteredProducts;
  }, [filteredProducts, selectedCategory]);

  const handlePurchase = (item: ShopItem) => {
    if (!user) {
      // Redirect to auth
      window.location.href = "/auth";
      return;
    }
    setPurchaseItem(item);
  };

  const confirmPurchase = async () => {
    if (!purchaseItem || !user) return;
    
    await purchaseMutation.mutateAsync({
      userId: user.id,
      itemId: purchaseItem.id,
      itemPrice: purchaseItem.price,
      userCoins: userBalance,
    });
    
    setPurchaseItem(null);
  };

  return (
    <div className="min-h-screen bg-[hsl(255_22%_12%)]">
      <Navigation />
      
      {/* Hero Header */}
      <section className="relative pt-20 pb-8 overflow-hidden">
        {/* Neon background effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] opacity-50" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-[100px] opacity-40" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 mb-6"
            >
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent">
                {shopItems.length} articles disponibles !
              </span>
            </motion.div>
            
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-primary mb-4 text-glow">
              Le Bazar d'Akihabara
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Bienvenue dans la boutique de récompenses ! Échangez vos OTK Coins 
              contre des goodies, des places de cinéma, des abonnements et plus encore.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Wallet Bar - Sticky */}
      <WalletBar />

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <FeaturedCarousel products={featuredProducts} userBalance={userBalance} />
      )}

      {/* Category Filters */}
      <CategoryFilters 
        selectedCategory={selectedCategory} 
        onCategoryChange={setSelectedCategory}
      />

      {/* Search Bar */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher un article, partenaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-muted/30 border-border/50 focus:border-primary/50"
          />
        </div>
      </div>

      {/* Products Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-sakura" />
            </div>
          ) : mainProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mainProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  userBalance={userBalance}
                  index={index}
                  onPurchase={handlePurchase}
                  isPurchasing={purchaseMutation.isPending && purchaseItem?.id === product.id}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="text-6xl mb-4 opacity-30">🔍</div>
              <h3 className="font-display text-2xl text-foreground mb-2">Aucun article trouvé</h3>
              <p className="text-muted-foreground">
                Essayez une autre recherche ou catégorie
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Local Partners Section - Always visible except when filtered to other categories */}
      {(selectedCategory === "all" || selectedCategory === "local") && localProducts.length > 0 && (
        <LocalPartnersSection 
          products={localProducts} 
          userBalance={userBalance}
          onPurchase={handlePurchase}
        />
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-t from-primary/5 to-transparent">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
              Pas assez d'OTK ? 🎮
            </h2>
            <p className="text-muted-foreground mb-6">
              Participez aux événements, complétez des quêtes et invitez vos amis 
              pour gagner plus d'OTK Coins !
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <motion.a
                href="/espace-membre"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:shadow-glow transition-shadow"
              >
                Voir mes quêtes
              </motion.a>
              <motion.a
                href="/evenements"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
              >
                Événements à venir
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Purchase Confirmation Dialog */}
      <AlertDialog open={!!purchaseItem} onOpenChange={() => setPurchaseItem(null)}>
        <AlertDialogContent className="bg-card border-sakura/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl flex items-center gap-2">
              <span className="text-2xl">🛒</span>
              Confirmer l'achat
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Tu es sur le point d'échanger :</p>
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <p className="font-display text-lg text-foreground">{purchaseItem?.name}</p>
                <p className="text-2xl font-display text-accent mt-2">
                  {purchaseItem?.price.toLocaleString()} OTK
                </p>
              </div>
              <p className="text-sm">
                Solde après achat : <span className="text-turquoise font-medium">
                  {((userBalance || 0) - (purchaseItem?.price || 0)).toLocaleString()} OTK
                </span>
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPurchase}
              disabled={purchaseMutation.isPending}
              className="bg-gradient-to-r from-sakura to-turquoise hover:opacity-90"
            >
              {purchaseMutation.isPending ? "Traitement..." : "Confirmer l'achat"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BazarAkihabara;
