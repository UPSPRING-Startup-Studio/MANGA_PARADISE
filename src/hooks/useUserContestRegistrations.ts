import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ContestRegistrationStatus = "pending" | "approved" | "rejected" | "waitlist";

export interface UserContestRegistration {
  id: string;
  user_id: string;
  activity_id: string;
  event_id: string;
  status: ContestRegistrationStatus;
  character_name: string;
  universe: string;
  format: string;
  group_name?: string | null;
  passage_order?: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch all contest registrations for a given user.
 * Accepts a userId parameter so it works for both the current user
 * and when viewing another member's agenda.
 *
 * @param userId - The user ID to fetch contest registrations for
 */
export const useUserContestRegistrations = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-contest-registrations", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("contest_registrations" as any)
        .select(`
          id,
          user_id,
          activity_id,
          event_id,
          status,
          character_name,
          universe,
          format,
          group_name,
          passage_order,
          created_at,
          updated_at
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) return [];

      return (data || []) as any as UserContestRegistration[];
    },
    enabled: !!userId,
    staleTime: 0, // Les données sont périmées immédiatement
    refetchOnMount: true, // Revérifier quand le composant s'affiche
    refetchOnWindowFocus: true, // Revérifier quand on revient sur l'onglet
  });
};
