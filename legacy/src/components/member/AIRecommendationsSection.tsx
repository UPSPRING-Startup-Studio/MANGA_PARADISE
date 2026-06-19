import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Calendar, ShoppingBag, RefreshCw, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAIRecommendations, Recommendation } from "@/hooks/useAIRecommendations";
import { usePreferences } from "@/hooks/usePreferences";
import { Profile } from "@/hooks/useProfile";

interface AIRecommendationsSectionProps {
  profile: Profile | null;
}

const RecommendationCard = ({ recommendation, type, index }: { 
  recommendation: Recommendation; 
  type: 'events' | 'products';
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <Card className="h-full bg-card/50 backdrop-blur border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="secondary" className="text-xs">
            {recommendation.category || recommendation.type || (type === 'events' ? 'Événement' : 'Produit')}
          </Badge>
          {recommendation.price && (
            <span className="text-sm font-bold text-primary flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {recommendation.price} OTK
            </span>
          )}
        </div>
        
        <h4 className="font-semibold text-foreground mb-2 line-clamp-2">
          {recommendation.title}
        </h4>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {recommendation.description}
        </p>
        
        {recommendation.date && (
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {recommendation.date}
          </p>
        )}
        
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-primary/80 flex items-start gap-1">
            <Star className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{recommendation.reason}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="bg-card/50">
        <CardContent className="p-4">
          <Skeleton className="h-5 w-20 mb-3" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4 mb-3" />
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const AIRecommendationsSection = ({ profile }: AIRecommendationsSectionProps) => {
  const { preferences, loading: prefsLoading } = usePreferences();
  const { 
    loading, 
    eventRecommendations, 
    productRecommendations, 
    fetchRecommendations 
  } = useAIRecommendations();
  
  const [activeTab, setActiveTab] = useState<'events' | 'products'>('events');
  const [hasLoaded, setHasLoaded] = useState({ events: false, products: false });

  useEffect(() => {
    if (profile && preferences && !hasLoaded.events) {
      loadRecommendations('events');
    }
  }, [profile, preferences]);

  const loadRecommendations = async (type: 'events' | 'products') => {
    if (!profile || !preferences) return;
    
    await fetchRecommendations(profile, preferences, type);
    setHasLoaded(prev => ({ ...prev, [type]: true }));
  };

  const handleTabChange = (tab: 'events' | 'products') => {
    setActiveTab(tab);
    if (!hasLoaded[tab]) {
      loadRecommendations(tab);
    }
  };

  const handleRefresh = () => {
    loadRecommendations(activeTab);
  };

  const currentRecommendations = activeTab === 'events' ? eventRecommendations : productRecommendations;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Recommandations IA</h3>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading || prefsLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'events' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTabChange('events')}
          className="gap-2"
        >
          <Calendar className="h-4 w-4" />
          Événements
        </Button>
        <Button
          variant={activeTab === 'products' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTabChange('products')}
          className="gap-2"
        >
          <ShoppingBag className="h-4 w-4" />
          Produits
        </Button>
      </div>

      {/* Recommendations Grid */}
      {loading || prefsLoading ? (
        <LoadingSkeleton />
      ) : currentRecommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentRecommendations.map((rec, index) => (
            <RecommendationCard
              key={`${rec.title}-${index}`}
              recommendation={rec}
              type={activeTab}
              index={index}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="p-6 text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">
              Cliquez sur "Actualiser" pour générer des recommandations personnalisées
            </p>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Les recommandations sont générées par IA en fonction de vos préférences et votre historique
      </p>
    </section>
  );
};
