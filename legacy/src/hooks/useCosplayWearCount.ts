import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch wear counts for all cosplays of a user (from past events).
 * Source: event_lineups JOIN events (for date) JOIN cosplay_plans (for source_vestiaire_id).
 *
 * Returns a map keyed by BOTH cosplay_plan_id AND source_vestiaire_id,
 * so lookups work whether the caller has a plan ID or a vestiaire ID.
 */
export const useCosplayWearCounts = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["cosplay-wear-counts", userId],
    queryFn: async () => {
      if (!userId) return {};

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await (supabase as any)
        .from("event_lineups")
        .select(`
          cosplay_plan_id,
          event:events!event_id ( date, end_date ),
          cosplay:cosplay_plans!cosplay_plan_id ( id, source_vestiaire_id )
        `)
        .eq("user_id", userId);

      if (error) throw error;

      const counts: Record<string, number> = {};

      (data || []).forEach((row: any) => {
        const event = Array.isArray(row.event) ? row.event[0] : row.event;
        const cosplay = Array.isArray(row.cosplay) ? row.cosplay[0] : row.cosplay;
        const eventEndDate = event?.end_date || event?.date;

        if (!eventEndDate || eventEndDate >= today) return;
        if (!row.cosplay_plan_id) return;

        // Key by plan ID
        counts[row.cosplay_plan_id] = (counts[row.cosplay_plan_id] || 0) + 1;

        // Also key by vestiaire ID so lookups from cosplay_vestiaire items work
        const vestId = cosplay?.source_vestiaire_id;
        if (vestId) {
          counts[vestId] = (counts[vestId] || 0) + 1;
        }
      });

      return counts;
    },
    enabled: !!userId,
  });
};

export const useSingleCosplayWearCount = (
  userId: string | undefined,
  cosplayId: string | undefined
) => {
  const { data: counts = {} } = useCosplayWearCounts(userId);
  return cosplayId ? counts[cosplayId] || 0 : 0;
};
