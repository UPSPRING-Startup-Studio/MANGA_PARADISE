import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ReactionType = 'hype' | 'love' | 'favorite' | 'amazing';

export interface CosplanReaction {
  id: string;
  cosplay_plan_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface CosplanStats {
  hype_count: number;
  love_count: number;
  favorite_count: number;
  amazing_count: number;
  total_count: number;
}

/**
 * Hook to fetch reaction statistics for a specific cosplay plan
 */
export const useCosplanStats = (cosplayPlanId: string | undefined) => {
  return useQuery({
    queryKey: ["cosplan-stats", cosplayPlanId],
    queryFn: async (): Promise<CosplanStats> => {
      if (!cosplayPlanId) {
        return {
          hype_count: 0,
          love_count: 0,
          favorite_count: 0,
          amazing_count: 0,
          total_count: 0,
        };
      }

      // Call the PostgreSQL function to get aggregated counts
      const { data, error } = await supabase
        .rpc('get_cosplan_reaction_counts', { p_cosplay_plan_id: cosplayPlanId });

      if (error) {
        console.error("Error fetching cosplan stats:", error);
        throw error;
      }

      // The function returns an array with one row
      const stats = data?.[0] || {
        hype_count: 0,
        love_count: 0,
        favorite_count: 0,
        amazing_count: 0,
        total_count: 0,
      };

      return {
        hype_count: Number(stats.hype_count || 0),
        love_count: Number(stats.love_count || 0),
        favorite_count: Number(stats.favorite_count || 0),
        amazing_count: Number(stats.amazing_count || 0),
        total_count: Number(stats.total_count || 0),
      };
    },
    enabled: !!cosplayPlanId,
    staleTime: 30000, // Cache for 30 seconds
  });
};

/**
 * Hook to get the current user's reaction on a cosplay plan
 */
export const useUserReaction = (cosplayPlanId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-reaction", cosplayPlanId, userId],
    queryFn: async (): Promise<CosplanReaction | null> => {
      if (!cosplayPlanId || !userId) return null;

      const { data, error } = await supabase
        .from("cosplan_reactions")
        .select("*")
        .eq("cosplay_plan_id", cosplayPlanId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user reaction:", error);
        throw error;
      }

      return data;
    },
    enabled: !!cosplayPlanId && !!userId,
  });
};

/**
 * Hook to add or update a reaction on a cosplay plan
 */
export const useAddReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cosplayPlanId,
      userId,
      reactionType,
    }: {
      cosplayPlanId: string;
      userId: string;
      reactionType: ReactionType;
    }) => {
      // Use upsert to handle both insert and update
      const { data, error } = await supabase
        .from("cosplan_reactions")
        .upsert(
          {
            cosplay_plan_id: cosplayPlanId,
            user_id: userId,
            reaction_type: reactionType,
          },
          {
            onConflict: "cosplay_plan_id,user_id",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate stats and user reaction queries
      queryClient.invalidateQueries({ queryKey: ["cosplan-stats", variables.cosplayPlanId] });
      queryClient.invalidateQueries({ queryKey: ["user-reaction", variables.cosplayPlanId, variables.userId] });
      toast.success("Réaction ajoutée ! 🎉");
    },
    onError: (error) => {
      console.error("Error adding reaction:", error);
      toast.error("Erreur lors de l'ajout de la réaction");
    },
  });
};

/**
 * Hook to remove a reaction from a cosplay plan
 */
export const useRemoveReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cosplayPlanId,
      userId,
    }: {
      cosplayPlanId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from("cosplan_reactions")
        .delete()
        .eq("cosplay_plan_id", cosplayPlanId)
        .eq("user_id", userId);

      if (error) throw error;
      return { cosplayPlanId, userId };
    },
    onSuccess: (_, variables) => {
      // Invalidate stats and user reaction queries
      queryClient.invalidateQueries({ queryKey: ["cosplan-stats", variables.cosplayPlanId] });
      queryClient.invalidateQueries({ queryKey: ["user-reaction", variables.cosplayPlanId, variables.userId] });
      toast.success("Réaction retirée");
    },
    onError: (error) => {
      console.error("Error removing reaction:", error);
      toast.error("Erreur lors du retrait de la réaction");
    },
  });
};
