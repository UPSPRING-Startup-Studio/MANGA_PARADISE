import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

// ──────────────────────────────────────────────
// Événements liés à une association
// ──────────────────────────────────────────────

export function useAssociationEvents(associationId: string | undefined) {
  return useQuery({
    queryKey: ["association-events", associationId],
    queryFn: async () => {
      if (!associationId) return [];

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("association_id", associationId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!associationId,
  });
}

// ──────────────────────────────────────────────
// Prochains événements de l'association
// ──────────────────────────────────────────────

export function useUpcomingAssociationEvents(associationId: string | undefined) {
  return useQuery({
    queryKey: ["association-upcoming-events", associationId],
    queryFn: async () => {
      if (!associationId) return [];

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("association_id", associationId)
        .gte("date", now.split("T")[0])
        .order("date", { ascending: true })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!associationId,
  });
}

// ──────────────────────────────────────────────
// Payload type pour création/édition
// ──────────────────────────────────────────────

export interface AssociationEventPayload {
  title: string;
  description?: string;
  category: string;
  status: string;
  date: string;
  time?: string;
  end_date?: string;
  schedule?: unknown[];
  venue_name?: string;
  city?: string;
  region?: string;
  location?: string;
  ticketing_mode: string;
  external_link?: string;
  price?: string;
  max_attendees?: number;
  image_url?: string;
  type_evenement?: string;
}

// ──────────────────────────────────────────────
// Créer un événement pour l'association
// ──────────────────────────────────────────────

export function useCreateAssociationEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      associationId,
      data,
    }: {
      associationId: string;
      data: AssociationEventPayload;
    }) => {
      if (!user) throw new Error("Non connecté");

      const { data: created, error } = await supabase
        .from("events")
        .insert({
          ...data,
          association_id: associationId,
          created_by: user.id,
          schedule: (data.schedule || []) as unknown as Json,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return created;
    },
    onSuccess: (_, { associationId }) => {
      queryClient.invalidateQueries({ queryKey: ["association-events", associationId] });
      queryClient.invalidateQueries({ queryKey: ["association-upcoming-events", associationId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Événement créé pour l'association !");
    },
    onError: (error: Error) => {
      console.error("Error creating association event:", error);
      toast.error("Erreur lors de la création de l'événement");
    },
  });
}

// ──────────────────────────────────────────────
// Événements non rattachés (pour AttachExistingEventSheet)
// ──────────────────────────────────────────────

export function useUnattachedEvents(search: string) {
  return useQuery({
    queryKey: ["unattached-events", search],
    queryFn: async () => {
      let query: any = supabase
        .from("events")
        .select("id, title, date, city, venue_name, image_url, status")
        .is("association_id", null)
        .order("date", { ascending: false })
        .limit(20);

      if (search && search.trim().length >= 2) {
        query = query.ilike("title", `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: true,
    staleTime: 30 * 1000,
  });
}

// ──────────────────────────────────────────────
// Associer un événement existant à l'association
// ──────────────────────────────────────────────

export function useAttachEventToAssociation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      associationId,
    }: {
      eventId: string;
      associationId: string;
    }) => {
      const { error } = await supabase
        .from("events")
        .update({ association_id: associationId } as any)
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: (_, { associationId }) => {
      queryClient.invalidateQueries({ queryKey: ["association-events", associationId] });
      queryClient.invalidateQueries({ queryKey: ["unattached-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Événement rattaché à l'association !");
    },
    onError: (error: Error) => {
      console.error("Error attaching event:", error);
      toast.error("Erreur lors du rattachement de l'événement");
    },
  });
}

// ──────────────────────────────────────────────
// Détacher un événement de l'association
// ──────────────────────────────────────────────

export function useDetachEventFromAssociation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      associationId,
    }: {
      eventId: string;
      associationId: string;
    }) => {
      const { error } = await supabase
        .from("events")
        .update({ association_id: null } as any)
        .eq("id", eventId)
        .eq("association_id", associationId);

      if (error) throw error;
    },
    onSuccess: (_, { associationId }) => {
      queryClient.invalidateQueries({ queryKey: ["association-events", associationId] });
      queryClient.invalidateQueries({ queryKey: ["unattached-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Événement détaché de l'association");
    },
    onError: (error: Error) => {
      console.error("Error detaching event:", error);
      toast.error("Erreur lors du détachement de l'événement");
    },
  });
}

// ──────────────────────────────────────────────
// Autocomplete associations (pour le wizard événement)
// ──────────────────────────────────────────────

export function useAssociationsAutocomplete(search: string) {
  return useQuery({
    queryKey: ["associations-autocomplete", search],
    queryFn: async () => {
      let query = supabase
        .from("associations")
        .select("id, name, slug, city, logo_url")
        .order("name", { ascending: true })
        .limit(15);

      if (search && search.trim().length >= 1) {
        query = query.ilike("name", `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: search.trim().length >= 1,
    staleTime: 60_000,
  });
}

// ──────────────────────────────────────────────
// Modifier un événement de l'association
// ──────────────────────────────────────────────

export function useUpdateAssociationEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      associationId,
      data,
    }: {
      eventId: string;
      associationId: string;
      data: AssociationEventPayload;
    }) => {
      const { error } = await supabase
        .from("events")
        .update({
          ...data,
          schedule: (data.schedule || []) as unknown as Json,
        } as any)
        .eq("id", eventId)
        .eq("association_id", associationId);

      if (error) throw error;
    },
    onSuccess: (_, { associationId, eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["association-events", associationId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      toast.success("Événement mis à jour !");
    },
    onError: (error: Error) => {
      console.error("Error updating association event:", error);
      toast.error("Erreur lors de la mise à jour de l'événement");
    },
  });
}
