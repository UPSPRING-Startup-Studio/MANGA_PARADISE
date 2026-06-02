import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ContestRegistrationStatus = "pending" | "approved" | "rejected" | "waitlist";

export interface ContestRegistration {
  id: string;
  user_id: string;
  activity_id: string;
  event_id: string;
  status: ContestRegistrationStatus;
  format: string;
  character_name: string;
  universe: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch the user's contest registration for a specific activity
 * @param activityId - The activity ID to check registration for
 * @param enabled - Whether to enable the query (default: true)
 */
export const useContestRegistration = (activityId: string | null, enabled = true) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["contest-registration", activityId, user?.id],
    queryFn: async () => {
      if (!user?.id || !activityId) return null;

      const { data, error } = await supabase
        .from("contest_registrations" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("activity_id", activityId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching contest registration:", error);
        throw error;
      }

      return data as ContestRegistration | null;
    },
    enabled: enabled && !!user?.id && !!activityId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
