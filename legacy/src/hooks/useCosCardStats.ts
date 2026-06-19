import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CosCardStats {
  eventsCount: number;
  nakamasCount: number;
  cosplaysCount: number;
  mangasCount: number;
  animesCount: number;
  gamesCount: number;
  topBadges: Array<{
    id: string;
    name: string;
    icon: string;
    rarity: string | null;
  }>;
}

export const useCosCardStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["coscard-stats", userId],
    queryFn: async (): Promise<CosCardStats> => {
      if (!userId) {
        return {
          eventsCount: 0,
          nakamasCount: 0,
          cosplaysCount: 0,
          mangasCount: 0,
          animesCount: 0,
          gamesCount: 0,
          topBadges: [],
        };
      }

      // Fetch all stats in parallel
      const [
        eventsResult,
        friendsResult,
        cosplaysResult,
        libraryResult,
        badgesResult,
      ] = await Promise.all([
        // Events count
        supabase
          .from("event_participants")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        // Friends count
        supabase
          .from("friendships")
          .select("id", { count: "exact", head: true })
          .eq("status", "accepted")
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
        // Cosplays count
        supabase
          .from("cosplay_vestiaire")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        // Library (manga + anime)
        supabase
          .from("otaku_library")
          .select("type")
          .eq("user_id", userId),
        // Top 3 rarest badges
        supabase
          .from("user_badges")
          .select(`
            badges (
              id,
              name,
              icon,
              rarity
            )
          `)
          .eq("user_id", userId)
          .order("earned_at", { ascending: false })
          .limit(10),
      ]);

      // Count mangas and animes
      const mangasCount = libraryResult.data?.filter((item) => item.type === "MANGA").length || 0;
      const animesCount = libraryResult.data?.filter((item) => item.type === "ANIME").length || 0;

      // Sort badges by rarity and take top 3
      const rarityOrder: Record<string, number> = {
        legendary: 4,
        epic: 3,
        rare: 2,
        common: 1,
      };

      const sortedBadges = (badgesResult.data || [])
        .map((ub: any) => ub.badges)
        .filter(Boolean)
        .sort((a: any, b: any) => {
          const aRarity = rarityOrder[a.rarity || "common"] || 0;
          const bRarity = rarityOrder[b.rarity || "common"] || 0;
          return bRarity - aRarity;
        })
        .slice(0, 3);

      return {
        eventsCount: eventsResult.count || 0,
        nakamasCount: friendsResult.count || 0,
        cosplaysCount: cosplaysResult.count || 0,
        mangasCount,
        animesCount,
        gamesCount: 0, // No games table yet, placeholder
        topBadges: sortedBadges,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
