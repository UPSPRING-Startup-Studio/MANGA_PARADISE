import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface ProPartnerStats {
  activeMembersCount: number;
  upcomingEventsCount: number;
  pastEventsCount: number;
  totalEventsCount: number;
}

// ──────────────────────────────────────────────
// Hook : statistiques du partenaire
// ──────────────────────────────────────────────

export function useProPartnerStats(partnerId: string | null) {
  return useQuery({
    queryKey: ["pro-partner-stats", partnerId],
    queryFn: async (): Promise<ProPartnerStats> => {
      if (!partnerId) {
        return {
          activeMembersCount: 0,
          upcomingEventsCount: 0,
          pastEventsCount: 0,
          totalEventsCount: 0,
        };
      }

      const now = new Date().toISOString();

      // Requêtes parallèles
      const [membersRes, upcomingRes, pastRes] = await Promise.all([
        supabase
          .from("pro_partner_members")
          .select("*", { count: "exact", head: true })
          .eq("partner_id", partnerId)
          .eq("is_active", true),
        supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("organizer_type", "pro_partner")
          .eq("organizer_id", partnerId)
          .gte("date", now),
        supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("organizer_type", "pro_partner")
          .eq("organizer_id", partnerId)
          .lt("date", now),
      ]);

      return {
        activeMembersCount: membersRes.count || 0,
        upcomingEventsCount: upcomingRes.count || 0,
        pastEventsCount: pastRes.count || 0,
        totalEventsCount: (upcomingRes.count || 0) + (pastRes.count || 0),
      };
    },
    enabled: !!partnerId,
    staleTime: 2 * 60 * 1000,
  });
}

// ──────────────────────────────────────────────
// Hook : prochains événements du partenaire (top 5)
// ──────────────────────────────────────────────

export function useProPartnerUpcomingEventsPreview(partnerId: string | null) {
  return useQuery({
    queryKey: ["pro-partner-upcoming-preview", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("events")
        .select("id, title, date, city, location, status, image_url")
        .eq("organizer_type", "pro_partner")
        .eq("organizer_id", partnerId)
        .gte("date", now)
        .order("date", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId,
    staleTime: 2 * 60 * 1000,
  });
}
