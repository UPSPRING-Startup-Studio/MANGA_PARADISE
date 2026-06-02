import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Event } from "./useEvents";

// ── Helpers ────────────────────────────────────────────────────

// Cast needed because generated Supabase types don't yet include event_bookmarks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ── Hook : Set<eventId> des favoris ───────────────────────────
/**
 * Retourne un Set des IDs d'événements bookmarkés par l'utilisateur.
 * Utilisé pour un lookup O(1) depuis AgendaPage.
 */
export function useUserBookmarkIds(userId: string | undefined) {
  return useQuery<Set<string>>({
    queryKey: ["event-bookmark-ids", userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      const { data, error } = await db
        .from("event_bookmarks")
        .select("event_id")
        .eq("user_id", userId);
      if (error) throw error;
      return new Set<string>((data || []).map((b: { event_id: string }) => b.event_id));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Hook : événements sauvegardés (avec détails complets) ─────
/**
 * Retourne les événements sauvegardés d'un utilisateur, enrichis des
 * données de l'événement pour affichage dans AgendaFavoritesPage.
 */
export function useUserBookmarkedEvents(userId: string | undefined) {
  return useQuery<(Event & { bookmark_created_at: string })[]>({
    queryKey: ["event-bookmarks-full", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await db
        .from("event_bookmarks")
        .select("created_at, event:events(*, association:associations(name))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return (data || [])
        .map((b: { created_at: string; event: Record<string, unknown> | null }) => {
          const e = b.event;
          if (!e) return null;
          const assoc = e.association as { name?: string } | null;
          return {
            ...(e as unknown as Event),
            association_name: assoc?.name ?? null,
            // Normalize fields that may be missing
            coordonnees_gps: null,
            has_contest: false,
            schedule: null,
            bookmark_created_at: b.created_at,
          } as Event & { bookmark_created_at: string };
        })
        .filter((e): e is Event & { bookmark_created_at: string } => e !== null);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Mutation : toggle bookmark ────────────────────────────────
/**
 * Ajoute ou retire un bookmark.
 * Invalide automatiquement les deux caches de favoris.
 */
export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      eventId,
      isCurrentlyBookmarked,
    }: {
      userId: string;
      eventId: string;
      isCurrentlyBookmarked: boolean;
    }) => {
      if (isCurrentlyBookmarked) {
        const { error } = await db
          .from("event_bookmarks")
          .delete()
          .eq("user_id", userId)
          .eq("event_id", eventId);
        if (error) throw error;
        return false; // bookmark removed
      } else {
        const { error } = await db
          .from("event_bookmarks")
          .insert({ user_id: userId, event_id: eventId });
        if (error) throw error;
        return true; // bookmark added
      }
    },
    onSuccess: (added, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-bookmark-ids", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["event-bookmarks-full", variables.userId] });
      if (added) {
        toast.success("Événement sauvegardé !");
      } else {
        toast.success("Retiré des favoris.");
      }
    },
    onError: (err: Error) => {
      console.error("[useToggleBookmark] Erreur:", err);
      toast.error("Erreur lors de la sauvegarde. Réessaie.");
    },
  });
}
