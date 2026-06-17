import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Recommendation {
  title: string;
  description: string;
  category?: string;
  price?: number;
  date?: string;
  reason: string;
  type?: string;
}

export const useAIRecommendations = () => {
  const [loading, setLoading] = useState(false);
  const [eventRecommendations, setEventRecommendations] = useState<Recommendation[]>([]);
  const [productRecommendations, setProductRecommendations] = useState<Recommendation[]>([]);
  const { toast } = useToast();

  const fetchRecommendations = async (
    userProfile: any,
    preferences: any,
    type: 'events' | 'products'
  ) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-recommendations', {
        body: { userProfile, preferences, type }
      });

      if (error) throw error;

      if (data?.recommendations) {
        if (type === 'events') {
          setEventRecommendations(data.recommendations);
        } else {
          setProductRecommendations(data.recommendations);
        }
      }
      
      return data?.recommendations || [];
    } catch (error: any) {
      console.error('Error fetching AI recommendations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les recommandations. Réessayez plus tard.",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    eventRecommendations,
    productRecommendations,
    fetchRecommendations
  };
};
