import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Autocomplete pro-partners (pour le wizard événement)
// Pattern identique à useAssociationsAutocomplete
// ──────────────────────────────────────────────

export function useProPartnersAutocomplete(search: string) {
  return useQuery({
    queryKey: ["pro-partners-autocomplete", search],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pro_partners")
        .select("id, name, city, logo_url")
        .ilike("name", `%${search.trim()}%`)
        .eq("status", "active")
        .is("deleted_at", null)
        .order("name", { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: search.trim().length >= 1,
    staleTime: 60_000,
  });
}

// ──────────────────────────────────────────────
// Hook : tous les événements d'un partenaire
// ──────────────────────────────────────────────

export function useProPartnerEvents(partnerId: string | undefined) {
  return useQuery({
    queryKey: ["pro-partner-events", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_type", "pro_partner")
        .eq("organizer_id", partnerId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId,
  });
}

// ──────────────────────────────────────────────
// Hook : événements à venir d'un partenaire
// ──────────────────────────────────────────────

export function useUpcomingProPartnerEvents(partnerId: string | undefined) {
  return useQuery({
    queryKey: ["pro-partner-events-upcoming", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_type", "pro_partner")
        .eq("organizer_id", partnerId)
        .gte("date", now)
        .order("date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId,
  });
}

// ──────────────────────────────────────────────
// Hook : événements passés d'un partenaire
// ──────────────────────────────────────────────

export function usePastProPartnerEvents(partnerId: string | undefined) {
  return useQuery({
    queryKey: ["pro-partner-events-past", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_type", "pro_partner")
        .eq("organizer_id", partnerId)
        .lt("date", now)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId,
  });
}

// ──────────────────────────────────────────────
// Mutation : créer un événement pour le partenaire
// ──────────────────────────────────────────────

export function useCreateProPartnerEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      partnerId,
      data,
    }: {
      partnerId: string;
      data: Record<string, any>;
    }) => {
      const payload = {
        ...data,
        organizer_type: "pro_partner",
        organizer_id: partnerId,
      };

      const { data: result, error } = await supabase
        .from("events")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { partnerId }) => {
      queryClient.invalidateQueries({ queryKey: ["pro-partner-events", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["pro-partner-events-upcoming", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["pro-partner-events-past", partnerId] });
      toast.success("Événement créé !");
    },
    onError: (error: Error) => {
      console.error("Error creating event:", error);
      toast.error("Erreur lors de la création de l'événement");
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : mettre à jour un événement
// ──────────────────────────────────────────────

export function useUpdateProPartnerEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      data,
    }: {
      eventId: string;
      partnerId: string;
      data: Record<string, any>;
    }) => {
      const { error } = await supabase
        .from("events")
        .update(data)
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: (_, { partnerId }) => {
      queryClient.invalidateQueries({ queryKey: ["pro-partner-events", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["pro-partner-events-upcoming", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["pro-partner-events-past", partnerId] });
      toast.success("Événement mis à jour !");
    },
    onError: (error: Error) => {
      console.error("Error updating event:", error);
      toast.error("Erreur lors de la mise à jour de l'événement");
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : annuler un événement
// ──────────────────────────────────────────────

export function useCancelProPartnerEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
    }: {
      eventId: string;
      partnerId: string;
    }) => {
      const { error } = await supabase
        .from("events")
        .update({ status: "cancelled" })
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: (_, { partnerId }) => {
      queryClient.invalidateQueries({ queryKey: ["pro-partner-events", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["pro-partner-events-upcoming", partnerId] });
      toast.success("Événement annulé");
    },
    onError: (error: Error) => {
      console.error("Error cancelling event:", error);
      toast.error("Erreur lors de l'annulation");
    },
  });
}
