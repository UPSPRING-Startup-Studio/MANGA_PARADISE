import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UnifiedAgendaEvent {
  id: string; // event ID
  title: string;
  date: string;
  end_date?: string | null;
  city?: string | null;
  image_url?: string | null;
  category?: string | null;
  // Source tracking
  fromParticipation: boolean;
  fromContest: boolean;
  participationId?: string;
  participationRole?: string;
}

/**
 * Hook that returns a unified agenda for a user by merging:
 * - event_participants (general event registrations)
 * - contest_registrations (contest submissions)
 *
 * This ensures that submitting a contest candidacy automatically
 * adds the event to the user's agenda, even if they didn't register
 * as a general participant.
 *
 * @param userId - The user ID to fetch the agenda for
 * @param enabled - Whether to enable the query (e.g., only for friends)
 */
export const useUnifiedAgenda = (userId: string | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ["unified-agenda", userId],
    queryFn: async () => {
      if (!userId) return [];

      console.log("🔍 DEBUG UNIFIED AGENDA - Fetching for user:", userId);

      // 1. Fetch event_participants
      const { data: participations, error: partError } = await supabase
        .from("event_participants")
        .select(`
          id,
          role,
          registered_at,
          event_id,
          event:events (
            id,
            title,
            date,
            end_date,
            city,
            image_url,
            category
          )
        `)
        .eq("user_id", userId)
        .order("registered_at", { ascending: false });

      if (partError) {
        console.error("❌ DEBUG UNIFIED AGENDA - event_participants error:", partError);
      }

      // 2. Fetch contest_registrations
      const { data: contestRegs, error: contestError } = await supabase
        .from("contest_registrations" as any)
        .select(`
          id,
          event_id,
          status,
          created_at
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (contestError) {
        console.error("❌ DEBUG UNIFIED AGENDA - contest_registrations error:", contestError);
      }

      console.log("✅ DEBUG UNIFIED AGENDA - Participations:", participations?.length || 0, "Contest regs:", contestRegs?.length || 0);

      // 3. Build a map of event_id -> UnifiedAgendaEvent
      const eventMap = new Map<string, UnifiedAgendaEvent>();

      // Add events from participations
      for (const p of (participations || []) as any[]) {
        if (!p.event) continue;
        const event = p.event as any;
        eventMap.set(event.id, {
          id: event.id,
          title: event.title,
          date: event.date,
          end_date: event.end_date,
          city: event.city,
          image_url: event.image_url,
          category: event.category,
          fromParticipation: true,
          fromContest: false,
          participationId: p.id,
          participationRole: p.role,
        });
      }

      // Add events from contest registrations (merge or add new)
      for (const cr of (contestRegs || []) as any[]) {
        const eventId = cr.event_id;
        if (eventMap.has(eventId)) {
          // Already in agenda from participation, just mark as contest too
          const existing = eventMap.get(eventId)!;
          existing.fromContest = true;
        } else {
          // Not in agenda yet — need to fetch event details
          const { data: eventData } = await supabase
            .from("events")
            .select("id, title, date, end_date, city, image_url, category")
            .eq("id", eventId)
            .maybeSingle();

          if (eventData) {
            eventMap.set(eventId, {
              id: eventData.id,
              title: eventData.title,
              date: eventData.date,
              end_date: eventData.end_date,
              city: eventData.city,
              image_url: eventData.image_url,
              category: eventData.category,
              fromParticipation: false,
              fromContest: true,
            });
          }
        }
      }

      // 4. Convert to array and sort by date descending
      const result = Array.from(eventMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      console.log("📊 DEBUG UNIFIED AGENDA - Final merged events:", result.length, result.map(e => e.title));

      return result;
    },
    enabled: !!userId && enabled,
    staleTime: 0,
    refetchOnMount: "always" as const,
  });
};
