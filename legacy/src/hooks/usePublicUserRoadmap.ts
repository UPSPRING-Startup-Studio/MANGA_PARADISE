import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RoadmapActivity {
  id: string;
  time: string;
  end_time: string | null;
  title: string;
  location: string | null;
  category: string;
  description: string | null;
  day_date: string | null;
  event_id: string;
}

/**
 * Hook to fetch a user's favorite activities (roadmap) for the current/upcoming event
 * Used for displaying the public profile roadmap
 */
export const usePublicUserRoadmap = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["public-user-roadmap", userId],
    queryFn: async () => {
      if (!userId) {
        console.log("DEBUG usePublicUserRoadmap - No userId provided");
        return [];
      }

      console.log("DEBUG usePublicUserRoadmap - Fetching roadmap for userId:", userId);

      // Get current/upcoming event
      const today = new Date().toISOString().split("T")[0];
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("id, title, date, end_date")
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(1);

      if (eventsError) {
        console.error("DEBUG usePublicUserRoadmap - Error fetching events:", eventsError);
        throw eventsError;
      }
      
      if (!events || events.length === 0) {
        console.log("DEBUG usePublicUserRoadmap - No upcoming events found");
        return [];
      }

      const currentEvent = events[0];
      console.log("DEBUG usePublicUserRoadmap - Current event:", currentEvent);
      console.log("DEBUG usePublicUserRoadmap - Current event ID:", currentEvent.id);
      console.log("DEBUG usePublicUserRoadmap - User ID for query:", userId);

       // Fetch ONLY user's favorites with activity details
       // Strict filtering: only activities that have a user_favorites record
       console.log("DEBUG usePublicUserRoadmap - Fetching favorites for user (strict filter)");
       const { data: favorites, error: favError } = await supabase
         .from("user_favorites")
         .select("*, activity:event_schedule(*)")
         .eq("user_id", userId)
         .order("created_at", { ascending: true });

       if (favError) {
         console.error("DEBUG usePublicUserRoadmap - Error fetching favorites:", favError);
         throw favError;
       }

       console.log("DEBUG usePublicUserRoadmap - Raw favorites data:", favorites);
       console.log("DEBUG usePublicUserRoadmap - Total favorites count:", favorites?.length || 0);

       // Extract and sort activities by time
       // Only include activities that have valid data (strict filtering)
       const activities: RoadmapActivity[] = (favorites || [])
         .filter((fav: any) => {
           // Only include if activity exists and has required fields
           const hasActivity = !!fav.activity;
           if (!hasActivity) {
             console.warn("DEBUG usePublicUserRoadmap - Skipping favorite without activity:", fav.id);
           }
           return hasActivity;
         })
         .map((fav: any) => {
           const activity = fav.activity;
           // Normalize activity_id to string for comparison
           activity.id = String(activity.id);
           console.log("DEBUG usePublicUserRoadmap - Including activity:", activity.title);
           return activity;
         })
         .sort((a: RoadmapActivity, b: RoadmapActivity) => {
           // Sort by day_date first, then by time
           if (a.day_date && b.day_date) {
             const dayCompare = a.day_date.localeCompare(b.day_date);
             if (dayCompare !== 0) return dayCompare;
           }
           return a.time.localeCompare(b.time);
         });

      console.log("DEBUG usePublicUserRoadmap - Final activities:", activities);
      console.log("DEBUG usePublicUserRoadmap - Activities count:", activities.length);

      return activities;
    },
    enabled: !!userId,
  });
};
