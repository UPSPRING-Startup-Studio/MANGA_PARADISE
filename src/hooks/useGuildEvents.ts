import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GuildEvent {
  id: string;
  guild_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location_type: "online" | "irl";
  location_address: string | null;
  cover_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useGuildEvents(guildId: string | undefined) {
  return useQuery({
    queryKey: ["guild-events", guildId],
    queryFn: async () => {
      if (!guildId) return [];

      const { data, error } = await supabase
        .from("guild_events")
        .select("*")
        .eq("guild_id", guildId)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as GuildEvent[];
    },
    enabled: !!guildId,
  });
}

export function useCreateGuildEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (eventData: {
      guild_id: string;
      title: string;
      description?: string;
      start_time: string;
      end_time?: string;
      location_type: "online" | "irl";
      location_address?: string;
      cover_url?: string;
    }) => {
      if (!user) throw new Error("Vous devez être connecté");

      const { data, error } = await supabase
        .from("guild_events")
        .insert({
          ...eventData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Guild event insert error:", error.message, error.details, error.hint);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["guild-events", variables.guild_id] });
      toast.success("Événement créé avec succès !");
    },
    onError: (error: any) => {
      console.error("Error creating guild event:", error?.message, error);
      toast.error("Erreur lors de la création de l'événement");
    },
  });
}

export function useDeleteGuildEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, guildId }: { eventId: string; guildId: string }) => {
      const { error } = await supabase
        .from("guild_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
      return guildId;
    },
    onSuccess: (guildId) => {
      queryClient.invalidateQueries({ queryKey: ["guild-events", guildId] });
      toast.success("Événement supprimé");
    },
    onError: (error) => {
      console.error("Error deleting guild event:", error);
      toast.error("Erreur lors de la suppression");
    },
  });
}
