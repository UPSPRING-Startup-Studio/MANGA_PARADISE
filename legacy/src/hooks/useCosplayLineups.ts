import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CosplayLineup {
  id: string;
  user_id: string;
  event_id: string;
  event_date: string;
  cosplay_id: string | null;
  slot_type: 'day' | 'morning' | 'afternoon';
  created_at: string;
  updated_at: string;
}

export interface LineupWithDetails extends CosplayLineup {
  cosplay?: {
    id: string;
    character_name: string;
    universe: string;
    user_image_url: string;
  } | null;
  event?: {
    id: string;
    title: string;
    date: string;
    end_date: string | null;
    image_url: string | null;
  } | null;
}

// Fetch user's lineups for a specific event
export const useEventLineups = (userId: string | undefined, eventId: string | undefined) => {
  return useQuery({
    queryKey: ["cosplay-lineups", userId, eventId],
    queryFn: async () => {
      if (!userId || !eventId) return [];
      
      const { data, error } = await supabase
        .from("cosplay_lineups")
        .select(`
          *,
          cosplay:cosplay_vestiaire(id, character_name, universe, user_image_url)
        `)
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data as LineupWithDetails[];
    },
    enabled: !!userId && !!eventId,
  });
};

// Fetch all user's lineups
export const useUserLineups = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["cosplay-lineups", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("cosplay_lineups")
        .select(`
          *,
          cosplay:cosplay_vestiaire(id, character_name, universe, user_image_url),
          event:events(id, title, date, end_date, image_url)
        `)
        .eq("user_id", userId)
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data as LineupWithDetails[];
    },
    enabled: !!userId,
  });
};

// Upsert a lineup entry
export const useUpsertLineup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      userId: string;
      eventId: string;
      eventDate: string;
      cosplayId: string | null;
      slotType?: 'day' | 'morning' | 'afternoon';
    }) => {
      const { userId, eventId, eventDate, cosplayId, slotType = 'day' } = input;

      const { data, error } = await supabase
        .from("cosplay_lineups")
        .upsert({
          user_id: userId,
          event_id: eventId,
          event_date: eventDate,
          cosplay_id: cosplayId,
          slot_type: slotType,
        }, {
          onConflict: 'user_id,event_id,event_date,slot_type'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplay-lineups", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["cosplay-lineups", variables.userId, variables.eventId] });
    },
    onError: (error) => {
      console.error("Error upserting lineup:", error);
      toast.error("Erreur lors de la mise à jour du planning");
    },
  });
};

// Delete a lineup entry
export const useDeleteLineup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from("cosplay_lineups")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
      return { id, userId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplay-lineups", variables.userId] });
      toast.success("Slot supprimé du planning");
    },
    onError: (error) => {
      console.error("Error deleting lineup:", error);
      toast.error("Erreur lors de la suppression");
    },
  });
};
