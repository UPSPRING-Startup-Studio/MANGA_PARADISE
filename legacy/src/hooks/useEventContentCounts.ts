import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Compteurs de contenu associé par événement.
 * Utilisé pour afficher des CTA contextuels sur les cartes passées.
 */
export interface EventContentCounts {
  participants: number;
  photos: number;
  lineups: number;
}

/**
 * Récupère en batch les compteurs de contenu (participants, photos, lineups)
 * pour une liste d'IDs événements.
 *
 * 3 requêtes légères avec GROUP BY, pas de N+1.
 */
export function useEventContentCounts(eventIds: string[]) {
  return useQuery({
    queryKey: ["event-content-counts", eventIds],
    queryFn: async (): Promise<Record<string, EventContentCounts>> => {
      if (eventIds.length === 0) return {};

      // 3 requêtes en parallèle
      const [participantsRes, photosRes, lineupsRes] = await Promise.all([
        supabase
          .from("event_participants")
          .select("event_id")
          .in("event_id", eventIds),
        supabase
          .from("cosplay_photos")
          .select("event_id")
          .in("event_id", eventIds)
          .not("event_id", "is", null),
        supabase
          .from("event_lineups")
          .select("event_id")
          .in("event_id", eventIds),
      ]);

      // Compter côté client (les requêtes retournent les lignes, on les agrège)
      const counts: Record<string, EventContentCounts> = {};

      const ensureEntry = (id: string) => {
        if (!counts[id]) counts[id] = { participants: 0, photos: 0, lineups: 0 };
      };

      if (participantsRes.data) {
        for (const row of participantsRes.data) {
          ensureEntry(row.event_id);
          counts[row.event_id].participants++;
        }
      }

      if (photosRes.data) {
        for (const row of photosRes.data as { event_id: string }[]) {
          ensureEntry(row.event_id);
          counts[row.event_id].photos++;
        }
      }

      if (lineupsRes.data) {
        for (const row of lineupsRes.data) {
          ensureEntry(row.event_id);
          counts[row.event_id].lineups++;
        }
      }

      return counts;
    },
    enabled: eventIds.length > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
