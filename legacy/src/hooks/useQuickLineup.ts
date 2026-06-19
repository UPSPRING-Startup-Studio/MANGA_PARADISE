import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Check if user has any lineup for an event
export const useHasLineup = (userId: string | undefined, eventId: string | undefined) => {
  return useQuery({
    queryKey: ["has-lineup", userId, eventId],
    queryFn: async () => {
      if (!userId || !eventId) return false;
      
      const { data, error } = await supabase
        .from("cosplay_lineups")
        .select("id")
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    },
    enabled: !!userId && !!eventId,
  });
};

// Quick add to lineup (creates entry with null cosplay = "civil")
export const useQuickAddToLineup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      userId: string;
      eventId: string;
      eventDate: string;
    }) => {
      const { userId, eventId, eventDate } = input;

      const { data, error } = await supabase
        .from("cosplay_lineups")
        .insert({
          user_id: userId,
          event_id: eventId,
          event_date: eventDate,
          cosplay_id: null,
          slot_type: 'day',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplay-lineups", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["cosplay-lineups", variables.userId, variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["has-lineup", variables.userId, variables.eventId] });
      toast.success("Ajouté à ton agenda !");
    },
    onError: (error) => {
      console.error("Error adding to lineup:", error);
      toast.error("Erreur lors de l'ajout à l'agenda");
    },
  });
};

// Remove all lineups for an event
export const useRemoveFromLineup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      userId: string;
      eventId: string;
    }) => {
      const { userId, eventId } = input;

      const { error } = await supabase
        .from("cosplay_lineups")
        .delete()
        .eq("user_id", userId)
        .eq("event_id", eventId);

      if (error) throw error;
      return { userId, eventId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplay-lineups", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["cosplay-lineups", variables.userId, variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["has-lineup", variables.userId, variables.eventId] });
      toast.success("Retiré de ton agenda");
    },
    onError: (error) => {
      console.error("Error removing from lineup:", error);
      toast.error("Erreur lors de la suppression");
    },
  });
};
