import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface EventSeriesRow {
  id: string;
  slug: string;
  canonical_name: string;
  description: string | null;
  type_evenement: string | null;
  default_city: string | null;
  default_venue: string | null;
  organizer_association_id: string | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventSeriesWithStats extends EventSeriesRow {
  edition_count: number;
  association_name: string | null;
}

export interface EventSeriesPayload {
  slug: string;
  canonical_name: string;
  description?: string | null;
  type_evenement?: string | null;
  default_city?: string | null;
  default_venue?: string | null;
  organizer_association_id?: string | null;
  cover_image?: string | null;
}

// ──────────────────────────────────────────────
// Liste de toutes les séries (avec stats)
// ──────────────────────────────────────────────

export function useEventSeriesList(search?: string) {
  return useQuery({
    queryKey: ["event-series", search || ""],
    queryFn: async () => {
      let query = supabase
        .from("event_series")
        .select("*, association:associations(name)")
        .order("canonical_name", { ascending: true });

      if (search && search.trim().length >= 2) {
        query = query.or(
          `canonical_name.ilike.%${search.trim()}%,slug.ilike.%${search.trim()}%`
        );
      }

      const { data, error } = await query;
      if (error) {
        if (error.message?.includes("schema cache") || error.message?.includes("not find")) {
          console.warn("[useEventSeriesList] Table event_series introuvable — migration non appliquée ?");
          return [];
        }
        throw error;
      }

      // Fetch edition counts per series
      const seriesIds = (data || []).map((s: any) => s.id);
      let editionCounts: Record<string, number> = {};

      if (seriesIds.length > 0) {
        const { data: events } = await supabase
          .from("events")
          .select("series_id")
          .in("series_id", seriesIds);

        if (events) {
          for (const e of events) {
            if (e.series_id) {
              editionCounts[e.series_id] = (editionCounts[e.series_id] || 0) + 1;
            }
          }
        }
      }

      return (data || []).map((s: any): EventSeriesWithStats => ({
        id: s.id,
        slug: s.slug,
        canonical_name: s.canonical_name,
        description: s.description,
        type_evenement: s.type_evenement,
        default_city: s.default_city,
        default_venue: s.default_venue,
        organizer_association_id: s.organizer_association_id,
        cover_image: s.cover_image,
        created_at: s.created_at,
        updated_at: s.updated_at,
        edition_count: editionCounts[s.id] || 0,
        association_name: s.association?.name || null,
      }));
    },
  });
}

// ──────────────────────────────────────────────
// Détail d'une série
// ──────────────────────────────────────────────

export function useEventSeries(seriesId: string | undefined) {
  return useQuery({
    queryKey: ["event-series-detail", seriesId],
    queryFn: async () => {
      if (!seriesId) return null;

      const { data, error } = await supabase
        .from("event_series")
        .select("*, association:associations(name)")
        .eq("id", seriesId)
        .single();

      if (error) throw error;
      return {
        ...data,
        association_name: (data as any).association?.name || null,
      } as EventSeriesRow & { association_name: string | null };
    },
    enabled: !!seriesId,
  });
}

// ──────────────────────────────────────────────
// Événements liés à une série
// ──────────────────────────────────────────────

export function useSeriesEditions(seriesId: string | undefined) {
  return useQuery({
    queryKey: ["series-editions", seriesId],
    queryFn: async () => {
      if (!seriesId) return [];

      const { data, error } = await supabase
        .from("events")
        .select("id, title, date, date_debut, date_fin, city, venue_name, image_url, edition_label, series_id, status")
        .eq("series_id", seriesId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!seriesId,
  });
}

// ──────────────────────────────────────────────
// Créer une série
// ──────────────────────────────────────────────

export function useCreateEventSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: EventSeriesPayload) => {
      const { data, error } = await supabase
        .from("event_series")
        .insert(payload)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error(`Le slug "${payload.slug}" est déjà utilisé`);
        }
        // Schema cache miss / table not found
        if (
          error.code === "PGRST204" ||
          error.message?.includes("schema cache") ||
          error.message?.includes("not find")
        ) {
          console.error("[useCreateEventSeries] Table event_series introuvable :", error);
          throw new Error(
            "La table event_series n'est pas disponible. Vérifie que la migration Phase 1 (20260413_event_series_phase1.sql) a bien été appliquée sur l'environnement Supabase courant, puis rafraîchis le cache schema (Project Settings → API → Reload)."
          );
        }
        console.error("[useCreateEventSeries] Erreur Supabase :", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-series"] });
      toast.success("Série créée !");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la création de la série");
    },
  });
}

// ──────────────────────────────────────────────
// Modifier une série
// ──────────────────────────────────────────────

export function useUpdateEventSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: EventSeriesPayload & { id: string }) => {
      const { error } = await supabase
        .from("event_series")
        .update(payload)
        .eq("id", id);

      if (error) {
        if (error.code === "23505") {
          throw new Error(`Le slug "${payload.slug}" est déjà utilisé`);
        }
        if (error.message?.includes("schema cache") || error.message?.includes("not find")) {
          console.error("[useUpdateEventSeries] Table event_series introuvable :", error);
          throw new Error(
            "La table event_series n'est pas disponible. Vérifie que la migration Phase 1 a bien été appliquée."
          );
        }
        console.error("[useUpdateEventSeries] Erreur Supabase :", error);
        throw error;
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["event-series"] });
      queryClient.invalidateQueries({ queryKey: ["event-series-detail", id] });
      toast.success("Série mise à jour !");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });
}

// ──────────────────────────────────────────────
// Supprimer une série
// ──────────────────────────────────────────────

export function useDeleteEventSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seriesId: string) => {
      const { error } = await supabase
        .from("event_series")
        .delete()
        .eq("id", seriesId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-series"] });
      toast.success("Serie supprimee");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });
}

// ──────────────────────────────────────────────
// Rattacher un event à une série
// ──────────────────────────────────────────────

export function useAttachEventToSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      seriesId,
      editionLabel,
    }: {
      eventId: string;
      seriesId: string;
      editionLabel?: string;
    }) => {
      const update: Record<string, any> = { series_id: seriesId };
      if (editionLabel !== undefined) {
        update.edition_label = editionLabel || null;
      }

      const { error } = await supabase
        .from("events")
        .update(update)
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: (_, { seriesId }) => {
      queryClient.invalidateQueries({ queryKey: ["series-editions", seriesId] });
      queryClient.invalidateQueries({ queryKey: ["event-series"] });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Evenement rattache a la serie !");
    },
    onError: () => {
      toast.error("Erreur lors du rattachement");
    },
  });
}

// ──────────────────────────────────────────────
// Détacher un event d'une série
// ──────────────────────────────────────────────

export function useDetachEventFromSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      seriesId,
    }: {
      eventId: string;
      seriesId: string;
    }) => {
      const { error } = await supabase
        .from("events")
        .update({ series_id: null, edition_label: null } as any)
        .eq("id", eventId)
        .eq("series_id", seriesId);

      if (error) throw error;
    },
    onSuccess: (_, { seriesId }) => {
      queryClient.invalidateQueries({ queryKey: ["series-editions", seriesId] });
      queryClient.invalidateQueries({ queryKey: ["event-series"] });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Evenement detache de la serie");
    },
    onError: () => {
      toast.error("Erreur lors du detachement");
    },
  });
}

// ──────────────────────────────────────────────
// Events non rattachés à aucune série
// ──────────────────────────────────────────────

export function useUnattachedSeriesEvents(search: string) {
  return useQuery({
    queryKey: ["unattached-series-events", search],
    queryFn: async () => {
      let query: any = supabase
        .from("events")
        .select("id, title, date, date_debut, city, venue_name, image_url, series_id")
        .is("series_id", null)
        .order("date", { ascending: false })
        .limit(30);

      if (search && search.trim().length >= 2) {
        query = query.ilike("title", `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });
}

// ──────────────────────────────────────────────
// Autocomplete des séries (pour wizard)
// ──────────────────────────────────────────────

export function useEventSeriesAutocomplete(search: string) {
  return useQuery({
    queryKey: ["event-series-autocomplete", search],
    queryFn: async () => {
      let query = supabase
        .from("event_series")
        .select("id, slug, canonical_name, type_evenement, default_city, default_venue, organizer_association_id, cover_image")
        .order("canonical_name", { ascending: true })
        .limit(15);

      if (search && search.trim().length >= 1) {
        query = query.ilike("canonical_name", `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) {
        if (error.message?.includes("schema cache") || error.message?.includes("not find")) {
          console.warn("[useEventSeriesAutocomplete] Table event_series introuvable — migration non appliquée ?");
          return [];
        }
        throw error;
      }
      return data || [];
    },
    staleTime: 60_000,
  });
}
