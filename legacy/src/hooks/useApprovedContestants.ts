import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ApprovedContestant {
  id: string;
  user_id: string;
  character_name: string;
  universe: string;
  format: string;
  group_name?: string | null;
  passage_order?: number | null;
  profiles?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Hook to fetch approved contestants for a specific contest activity
 * @param activityId - The activity ID to fetch approved contestants for
 * @param enabled - Whether to enable the query (default: true)
 */
export const useApprovedContestants = (activityId: string | null, enabled = true) => {
  return useQuery({
    queryKey: ["approved-contestants", activityId],
    queryFn: async () => {
      if (!activityId) return [];

      const { data, error } = await supabase
        .from("contest_registrations" as any)
        .select(`
          id,
          user_id,
          character_name,
          universe,
          format,
          group_name,
          passage_order,
          profiles:user_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq("activity_id", activityId)
        .eq("status", "approved")
        .order("passage_order", { ascending: true, nullsFirst: false });

      if (error) {
        console.error("Error fetching approved contestants:", error);
        throw error;
      }

      return (data || []) as any as ApprovedContestant[];
    },
    enabled: enabled && !!activityId,
    staleTime: 1000 * 60 * 2, // 2 minutes - shorter than registration status since this changes more often
  });
};
