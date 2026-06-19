import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface ActivityParticipant {
  id: string;
  username: string;
  avatar_url?: string;
  display_name: string;
}

export interface ActivityParticipationStats {
  activity_id: string;
  event_id: string;
  participant_count: number;
  participants: ActivityParticipant[];
}

interface UseActivityParticipationReturn {
  participationByActivity: Record<string, ActivityParticipationStats>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch participation statistics for all activities in an event
 * Fetches directly from user_favorites with profiles jointure (bypassing SQL view)
 * Aggregates data client-side to ensure avatars are properly included
 * Integrates with React Query for automatic cache invalidation
 */
export function useActivityParticipation(eventId?: string): UseActivityParticipationReturn {
  const { data: participationByActivity = {}, isLoading, error, refetch } = useQuery({
    queryKey: ["activity-participation", eventId],
    queryFn: async () => {
      if (!eventId) return {};

      try {
        const { data: favorites, error: fetchError } = await supabase
          .from("user_favorites")
          .select(`
            activity_id,
            user_id,
            profiles (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq("event_id", eventId);

        if (fetchError) throw fetchError;

        const statsMap: Record<string, ActivityParticipationStats> = {};

        if (favorites && favorites.length > 0) {
          favorites.forEach((fav: any) => {
            const activityId = String(fav.activity_id).toLowerCase();
            const profile = fav.profiles;

            if (!statsMap[activityId]) {
              statsMap[activityId] = {
                activity_id: activityId,
                event_id: eventId,
                participant_count: 0,
                participants: []
              };
            }

            statsMap[activityId].participant_count++;

            if (profile) {
              statsMap[activityId].participants.push({
                id: profile.id,
                username: profile.username || "Utilisateur",
                display_name: profile.display_name || profile.username || "Utilisateur",
                avatar_url: profile.avatar_url
              });
            }
          });
        }

        return statsMap;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!eventId,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Real-time subscription to user_favorites changes
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`activity-participation-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_favorites",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log("Real-time update for activity participation:", payload);
          // Refetch participation stats when favorites change
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, refetch]);

  return {
    participationByActivity,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
