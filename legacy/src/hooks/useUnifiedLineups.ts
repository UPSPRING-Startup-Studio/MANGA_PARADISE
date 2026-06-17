/**
 * useUnifiedLineups
 * Source of truth: event_lineups table.
 *
 * Schema:
 *   id              uuid PK
 *   cosplay_plan_id uuid NOT NULL FK → cosplay_plans
 *   event_id        uuid NOT NULL FK → events
 *   user_id         uuid NOT NULL FK → auth.users
 *   created_at      timestamptz
 *   UNIQUE (cosplay_plan_id, event_id)
 *
 * No event_date column — dates come from the joined events table.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ─── Shared Interface ─────────────────────────────────────────────────────── */

export interface UnifiedLineup {
  id: string;
  cosplay_plan_id: string;
  event_id: string;
  user_id: string;
  created_at: string;
  event?: {
    id: string;
    title: string;
    date: string;
    end_date: string | null;
    city: string | null;
    image_url: string | null;
  } | null;
  cosplay?: {
    id: string;
    character_name: string;
    universe: string;
    image_url: string | null;
    status: string;
    progress_level: number;
  } | null;
}

const TABLE = "event_lineups";

/* ─── Queries ──────────────────────────────────────────────────────────────── */

/**
 * Lineups for a specific cosplay_plans ID — future events only.
 * Used by OverviewTab.
 */
export const useLineupsByCosplay = (cosplayPlanId: string | undefined) => {
  return useQuery({
    queryKey: ["unified-lineups", "by-cosplay", cosplayPlanId],
    queryFn: async (): Promise<UnifiedLineup[]> => {
      if (!cosplayPlanId) return [];

      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select(`
          id, cosplay_plan_id, event_id, user_id, created_at,
          event:events!event_id (
            id, title, date, end_date, city, image_url
          )
        `)
        .eq("cosplay_plan_id", cosplayPlanId);

      if (error) throw error;

      const now = new Date().toISOString().slice(0, 10);
      return (data || [])
        .map((row: any) => ({
          ...row,
          event: row.event ?? null,
          cosplay: null,
        }))
        .filter((r: UnifiedLineup) => r.event && r.event.date >= now)
        .sort((a: UnifiedLineup, b: UnifiedLineup) =>
          (a.event?.date ?? "").localeCompare(b.event?.date ?? "")
        );
    },
    enabled: !!cosplayPlanId,
  });
};

/**
 * ALL lineups for a cosplay — past + future.
 * Used by LineupTab.
 */
export const useAllLineupsByCosplay = (cosplayPlanId: string | undefined) => {
  return useQuery({
    queryKey: ["unified-lineups", "all-by-cosplay", cosplayPlanId],
    queryFn: async (): Promise<UnifiedLineup[]> => {
      if (!cosplayPlanId) return [];

      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select(`
          id, cosplay_plan_id, event_id, user_id, created_at,
          event:events!event_id (
            id, title, date, end_date, city, image_url
          )
        `)
        .eq("cosplay_plan_id", cosplayPlanId);

      if (error) throw error;

      return (data || [])
        .map((row: any) => ({
          ...row,
          event: row.event ?? null,
          cosplay: null,
        }))
        .sort((a: UnifiedLineup, b: UnifiedLineup) =>
          (a.event?.date ?? "").localeCompare(b.event?.date ?? "")
        );
    },
    enabled: !!cosplayPlanId,
  });
};

/**
 * All lineups for a user (global agenda).
 * Joins cosplay_plans for cosplay data.
 */
export const useLineupsByUser = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["unified-lineups", "by-user", userId],
    queryFn: async (): Promise<UnifiedLineup[]> => {
      if (!userId) return [];

      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select(`
          id, cosplay_plan_id, event_id, user_id, created_at,
          event:events!event_id (
            id, title, date, end_date, city, image_url
          ),
          cosplay:cosplay_plans!cosplay_plan_id (
            id, character_name, universe, image_url, status, progress_level
          )
        `)
        .eq("user_id", userId);

      if (error) throw error;

      return (data || [])
        .map((row: any) => ({
          ...row,
          event: row.event ?? null,
          cosplay: row.cosplay ?? null,
        }))
        .sort((a: UnifiedLineup, b: UnifiedLineup) =>
          (a.event?.date ?? "").localeCompare(b.event?.date ?? "")
        );
    },
    enabled: !!userId,
  });
};

/**
 * Lineups for a specific event.
 */
export const useLineupsByEvent = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["unified-lineups", "by-event", eventId],
    queryFn: async (): Promise<UnifiedLineup[]> => {
      if (!eventId) return [];

      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select(`
          id, cosplay_plan_id, event_id, user_id, created_at,
          cosplay:cosplay_plans!cosplay_plan_id (
            id, character_name, universe, image_url, status, progress_level
          )
        `)
        .eq("event_id", eventId);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        ...row,
        event: null,
        cosplay: row.cosplay ?? null,
      }));
    },
    enabled: !!eventId,
  });
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const LINEUP_KEYS = ["unified-lineups", "cosplayer-agenda"];

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  LINEUP_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

/**
 * Resolve cosplay_vestiaire ID → cosplay_plans ID.
 * The registration modal selects from cosplay_vestiaire,
 * but event_lineups.cosplay_plan_id FK → cosplay_plans.
 */
async function resolveVestiaireToPlanId(
  vestiaireId: string,
  userId: string
): Promise<string | null> {
  const { data, error } = await (supabase as any)
    .from("cosplay_plans")
    .select("id")
    .eq("source_vestiaire_id", vestiaireId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("resolveVestiaireToPlanId error:", error);
    return null;
  }
  return data?.id ?? null;
}

/* ─── Mutations ────────────────────────────────────────────────────────────── */

/**
 * Assign a cosplay_plans item to an event.
 * Used by LineupTab "Add Event" dialog — receives a cosplay_plans ID directly.
 */
export const useAssignCosplayToEventUnified = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cosplayProjectId,
      eventId,
      userId,
    }: {
      cosplayProjectId: string;
      eventId: string;
      userId: string;
      eventDate?: string;   // kept for call-site compat, ignored
      slotType?: string;    // kept for call-site compat, ignored
    }) => {
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .insert({
          cosplay_plan_id: cosplayProjectId,
          event_id: eventId,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Ce cosplay est déjà associé à cet événement.");
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Cosplay associé à l'événement !");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'association");
    },
  });
};

/**
 * Remove a lineup row by ID.
 */
export const useRemoveLineup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lineupId }: { lineupId: string }) => {
      const { error } = await (supabase as any)
        .from(TABLE)
        .delete()
        .eq("id", lineupId);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Association retirée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });
};

/**
 * Sync lineup for a user+event pair after registration/update.
 *
 * 1. Delete existing lineups for user+event.
 * 2. If cosplayVestiaireId provided, resolve to cosplay_plans ID and insert.
 *
 * The registration modal provides a cosplay_vestiaire ID.
 * event_lineups.cosplay_plan_id expects a cosplay_plans ID.
 * resolveVestiaireToPlanId bridges that gap.
 */
export const useSyncLineupForEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      eventId,
      cosplayVestiaireId,
    }: {
      userId: string;
      eventId: string;
      eventDate?: string;          // kept for call-site compat, not used
      cosplayVestiaireId: string | null;
    }) => {
      // Step 1 — delete existing lineups for user+event
      const { error: deleteError } = await (supabase as any)
        .from(TABLE)
        .delete()
        .eq("user_id", userId)
        .eq("event_id", eventId);

      if (deleteError) {
        console.warn("Lineup cleanup failed:", deleteError);
      }

      // Step 2 — insert if cosplay selected
      if (!cosplayVestiaireId) return null;

      const planId = await resolveVestiaireToPlanId(cosplayVestiaireId, userId);
      if (!planId) {
        console.warn(
          "No cosplay_plans found for vestiaire ID:",
          cosplayVestiaireId
        );
        return null;
      }

      const { data, error: insertError } = await (supabase as any)
        .from(TABLE)
        .insert({
          cosplay_plan_id: planId,
          event_id: eventId,
          user_id: userId,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code !== "23505") {
          console.warn("Lineup insert failed:", insertError);
        }
        return null;
      }
      return data;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
    },
  });
};

/**
 * Remove all lineups for a user+event pair (cleanup on unregister).
 */
export const useCleanupLineupsForEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      eventId,
    }: {
      userId: string;
      eventId: string;
    }) => {
      const { error } = await (supabase as any)
        .from(TABLE)
        .delete()
        .eq("user_id", userId)
        .eq("event_id", eventId);

      if (error) {
        console.warn("Lineup cleanup on unregister failed:", error);
      }
    },
    onSuccess: () => {
      invalidateAll(queryClient);
    },
  });
};
