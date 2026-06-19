import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface UserFavorite {
  id: string;
  user_id: string;
  activity_id: string;
  event_id: string;
  created_at: string;
}

export interface FavoriteActivity {
  id: string;
  time: string;
  end_time: string | null;
  title: string;
  location: string | null;
  category: string;
  description: string | null;
  day_date: string | null;
}

/**
 * Hook to fetch user's favorite activities for a specific event
 */
export const useUserFavorites = (eventId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user favorites with activity details
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["user-favorites", eventId, user?.id],
    queryFn: async () => {
      if (!eventId || !user?.id) return [];

      const { data, error } = await supabase
        .from("user_favorites")
        .select(`
          id,
          user_id,
          activity_id,
          event_id,
          created_at,
          activity:event_schedule (
            id,
            time,
            end_time,
            title,
            location,
            category,
            description,
            day_date
          )
        `)
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId && !!user?.id,
  });

  // Get list of favorite activity IDs for quick lookup
  const favoriteIds = favorites.map((fav: any) => fav.activity_id);

  // Get favorite activities sorted by time
  const favoriteActivities: FavoriteActivity[] = favorites
    .map((fav: any) => fav.activity)
    .filter(Boolean)
    .sort((a: FavoriteActivity, b: FavoriteActivity) => {
      // Sort by time (HH:MM format)
      return a.time.localeCompare(b.time);
    });

  // Toggle favorite mutation with optimistic updates
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({
      activityId,
      isFavorite,
    }: {
      activityId: string;
      isFavorite: boolean;
    }) => {
      if (!user?.id || !eventId) throw new Error("User or event not found");

      if (isFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("activity_id", activityId);

        if (error) throw error;
        return { action: "removed", activityId };
      } else {
        // Add favorite (with conflict handling)
        const { error } = await supabase
          .from("user_favorites")
          .upsert(
            {
              user_id: user.id,
              activity_id: activityId,
              event_id: eventId,
            },
            {
              onConflict: "user_id,activity_id",
            }
          );

        if (error) throw error;
        return { action: "added", activityId };
      }
    },
    // Optimistic update
    onMutate: async ({ activityId, isFavorite }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["user-favorites", eventId, user?.id],
      });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData([
        "user-favorites",
        eventId,
        user?.id,
      ]);

      // Optimistically update
      queryClient.setQueryData(
        ["user-favorites", eventId, user?.id],
        (old: any[] = []) => {
          if (isFavorite) {
            // Remove from favorites
            return old.filter((fav) => fav.activity_id !== activityId);
          } else {
            // Add to favorites (optimistic - we don't have full activity data yet)
            return [
              ...old,
              {
                id: `temp-${activityId}`,
                user_id: user?.id,
                activity_id: activityId,
                event_id: eventId,
                created_at: new Date().toISOString(),
              },
            ];
          }
        }
      );

      return { previousFavorites };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          ["user-favorites", eventId, user?.id],
          context.previousFavorites
        );
      }
      console.error("Error toggling favorite:", error);
      toast.error("Erreur lors de la mise à jour des favoris");
    },
    onSuccess: (data) => {
      // Refetch to get accurate data
      queryClient.invalidateQueries({
        queryKey: ["user-favorites", eventId, user?.id],
      });
      
      // Invalidate activity participation stats to update participant counts
      queryClient.invalidateQueries({
        queryKey: ["activity-participation", eventId],
      });

      // Show success toast
      if (data.action === "added") {
        toast.success("Activité ajoutée à ton programme ! 📌");
      } else {
        toast.success("Activité retirée de ton programme");
      }
    },
  });

  // Helper function to check if activity is favorited
  const isFavorite = (activityId: string) => favoriteIds.includes(activityId);

  // Helper function to toggle favorite
  const toggleFavorite = (activityId: string) => {
    const currentlyFavorite = isFavorite(activityId);
    toggleFavoriteMutation.mutate({
      activityId,
      isFavorite: currentlyFavorite,
    });
  };

  return {
    favorites,
    favoriteIds,
    favoriteActivities,
    isLoading,
    isFavorite,
    toggleFavorite,
    isToggling: toggleFavoriteMutation.isPending,
  };
};
