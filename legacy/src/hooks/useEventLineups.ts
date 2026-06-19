/**
 * useEventLineups.ts
 * Hooks for managing the event_lineups table (N:M relation between cosplay_plans and events).
 * Allows assigning/removing a cosplay plan from one or more events.
 *
 * TODO: Replace (supabase as any) with typed client once the migration
 *       20260226_create_event_lineups.sql has been applied and types regenerated.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface EventLineup {
  id: string;
  cosplay_plan_id: string;
  event_id: string;
  user_id: string;
  created_at: string;
}

export interface EventLineupWithEvent extends EventLineup {
  event: {
    id: string;
    title: string;
    date: string;
    end_date: string | null;
    location: string | null;
    city: string | null;
    image_url: string | null;
  } | null;
}

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const eventLineupsKeys = {
  all: ["event-lineups"] as const,
  byCosplay: (cosplayPlanId: string) =>
    ["event-lineups", "cosplay", cosplayPlanId] as const,
  byEvent: (eventId: string) =>
    ["event-lineups", "event", eventId] as const,
};

// ─── useEventLineupsByCosplay ──────────────────────────────────────────────────
// Fetches all future events assigned to a specific cosplay plan (with event details).
// Used in CosplayShowcase to display "Mes Prochaines Sorties".

export const useEventLineupsByCosplay = (cosplayPlanId: string | undefined) => {
  return useQuery({
    queryKey: eventLineupsKeys.byCosplay(cosplayPlanId ?? ""),
    queryFn: async (): Promise<EventLineupWithEvent[]> => {
      if (!cosplayPlanId) return [];

      const today = new Date().toISOString().split("T")[0];

      // TODO: Replace (supabase as any) with typed client once migration is applied
      const { data, error } = await (supabase as any)
        .from("event_lineups")
        .select(`
          id,
          cosplay_plan_id,
          event_id,
          user_id,
          created_at,
          event:events (
            id,
            title,
            date,
            end_date,
            location,
            city,
            image_url
          )
        `)
        .eq("cosplay_plan_id", cosplayPlanId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Filter client-side to only show future events (date >= today)
      const rows = (data as EventLineupWithEvent[]) ?? [];
      return rows.filter(
        (row) => row.event !== null && row.event.date >= today
      );
    },
    enabled: !!cosplayPlanId,
  });
};

// ─── useAssignCosplayToEvent ───────────────────────────────────────────────────
// Inserts a new row in event_lineups (assigns a cosplay plan to an event).
// Invalidates the cosplay-related cache after success.

export const useAssignCosplayToEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cosplayPlanId,
      eventId,
      userId,
    }: {
      cosplayPlanId: string;
      eventId: string;
      userId: string;
    }): Promise<EventLineup> => {
      // TODO: Replace (supabase as any) with typed client once migration is applied
      const { data, error } = await (supabase as any)
        .from("event_lineups")
        .insert({
          cosplay_plan_id: cosplayPlanId,
          event_id: eventId,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation (already assigned)
        if (error.code === "23505") {
          throw new Error("Ce cosplay est déjà assigné à cet événement.");
        }
        throw error;
      }

      return data as EventLineup;
    },
    onSuccess: (_, variables) => {
      // Invalidate the lineup list for this cosplay
      queryClient.invalidateQueries({
        queryKey: eventLineupsKeys.byCosplay(variables.cosplayPlanId),
      });
      // Also invalidate the wardrobe cache (cosplay_plans) in case UI depends on it
      queryClient.invalidateQueries({
        queryKey: ["wardrobe-items", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["cosplans", variables.userId],
      });
      toast.success("🎯 Événement programmé avec succès !");
    },
    onError: (error: Error) => {
      console.error("Error assigning cosplay to event:", error);
      toast.error(error.message || "Erreur lors de l'assignation de l'événement");
    },
  });
};

// ─── useRemoveCosplayFromEvent ─────────────────────────────────────────────────
// Deletes a row from event_lineups by its lineup ID.
// Invalidates the cosplay-related cache after success.

export const useRemoveCosplayFromEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lineupId,
      cosplayPlanId,
      userId,
    }: {
      lineupId: string;
      cosplayPlanId: string;
      userId: string;
    }): Promise<void> => {
      // TODO: Replace (supabase as any) with typed client once migration is applied
      const { error } = await (supabase as any)
        .from("event_lineups")
        .delete()
        .eq("id", lineupId)
        .eq("user_id", userId); // RLS double-check

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate the lineup list for this cosplay
      queryClient.invalidateQueries({
        queryKey: eventLineupsKeys.byCosplay(variables.cosplayPlanId),
      });
      // Also invalidate the wardrobe/cosplans cache
      queryClient.invalidateQueries({
        queryKey: ["wardrobe-items", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["cosplans", variables.userId],
      });
      toast.success("🗑️ Événement retiré du planning.");
    },
    onError: (error: Error) => {
      console.error("Error removing cosplay from event:", error);
      toast.error(error.message || "Erreur lors de la suppression de l'événement");
    },
  });
};
