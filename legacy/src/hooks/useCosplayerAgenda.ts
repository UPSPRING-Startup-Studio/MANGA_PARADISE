/**
 * useCosplayerAgenda Hook
 * Source of truth: event_lineups table.
 * Joins events + cosplay_plans.
 * Returns { upcoming, past } split by effective date.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { splitLineups } from "@/lib/splitLineups";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AgendaEntry {
  lineup_id: string;
  cosplay_plan_id: string;
  character_name: string;
  universe: string;
  image_url: string | null;
  progress_level: number;
  is_in_wardrobe: boolean;
  event_id: string;
  event_title: string;
  event_start_date: string;
  event_end_date: string | null;
  event_location: string | null;
  event_city: string | null;
  event_image_url: string | null;
  /** Synthetic field used by splitLineups */
  event?: { date: string; end_date: string | null } | null;
}

// ─── Raw query + mapping ──────────────────────────────────────────────────────

const fetchAllLineups = async (userId: string): Promise<AgendaEntry[]> => {
  const { data, error } = await (supabase as any)
    .from("event_lineups")
    .select(
      `
      id,
      cosplay_plan_id,
      event_id,
      user_id,
      created_at,
      event:events!event_id (
        id,
        title,
        date,
        end_date,
        location,
        city,
        image_url
      ),
      cosplay:cosplay_plans!cosplay_plan_id (
        id,
        character_name,
        universe,
        image_url,
        progress_level,
        is_in_wardrobe
      )
    `
    )
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching cosplayer agenda:", error);
    throw error;
  }

  if (!data || data.length === 0) return [];

  return (data as any[])
    .map((row) => {
      const ev = Array.isArray(row.event) ? row.event[0] : row.event;
      const cos = Array.isArray(row.cosplay) ? row.cosplay[0] : row.cosplay;
      if (!ev || !cos) return null;

      return {
        lineup_id: row.id,
        cosplay_plan_id: cos.id,
        character_name: cos.character_name,
        universe: cos.universe,
        image_url: cos.image_url ?? null,
        progress_level: cos.progress_level ?? 0,
        is_in_wardrobe: cos.is_in_wardrobe ?? false,
        event_id: ev.id,
        event_title: ev.title,
        event_start_date: ev.date,
        event_end_date: ev.end_date ?? null,
        event_location: ev.location ?? null,
        event_city: ev.city ?? null,
        event_image_url: ev.image_url ?? null,
        // For splitLineups compatibility
        event: { date: ev.date, end_date: ev.end_date ?? null },
      } as AgendaEntry;
    })
    .filter((e): e is AgendaEntry => e !== null);
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export const useCosplayerAgenda = (userId: string | null | undefined) => {
  const query = useQuery({
    queryKey: ["cosplayer-agenda", userId],
    queryFn: () => fetchAllLineups(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const { upcoming, past } = useMemo(() => {
    const all = query.data ?? [];
    const result = splitLineups(all);
    console.log(
      "[useCosplayerAgenda] total rows from event_lineups:",
      all.length,
      "| upcoming:",
      result.upcoming.length,
      "| past:",
      result.past.length,
      "| sample dates:",
      all.slice(0, 5).map((e) => ({
        eventDate: e.event_start_date,
        endDate: e.event_end_date,
      }))
    );
    return result;
  }, [query.data]);

  return {
    isLoading: query.isLoading,
    error: query.error,
    upcomingLineups: upcoming,
    pastLineups: past,
  };
};
