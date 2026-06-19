import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ScheduleCategory = 
  | "animation"
  | "conference"
  | "meet_greet"
  | "concert"
  | "gaming"
  | "cosplay"
  | "workshop"
  | "contest"
  | "screening"
  | "other";

export interface EventScheduleItem {
  id: string;
  event_id: string;
  time: string;
  start_time: string;
  end_time: string | null;
  title: string;
  location: string | null;
  category: ScheduleCategory;
  description: string | null;
  day_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventScheduleItemInput {
  event_id: string;
  time: string;
  start_time?: string;
  end_time?: string | null;
  title: string;
  location?: string | null;
  category: ScheduleCategory;
  description?: string | null;
  day_date?: string | null;
}

// Category options for select
export const SCHEDULE_CATEGORIES: { value: ScheduleCategory; label: string }[] = [
  { value: "animation", label: "Animation" },
  { value: "conference", label: "Conférence" },
  { value: "meet_greet", label: "Meet & Greet" },
  { value: "concert", label: "Concert" },
  { value: "gaming", label: "Gaming / Tournoi" },
  { value: "cosplay", label: "Cosplay" },
  { value: "workshop", label: "Atelier" },
  { value: "contest", label: "Concours" },
  { value: "screening", label: "Projection" },
  { value: "other", label: "Autre" },
];

// Fetch all schedule items for an event
export const useEventSchedule = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["event_schedule", eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from("event_schedule")
        .select("*")
        .eq("event_id", eventId)
        .order("time", { ascending: true });

      if (error) throw error;

      return data as EventScheduleItem[];
    },
    enabled: !!eventId,
  });
};

// Create a new schedule item
export const useCreateScheduleItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: EventScheduleItemInput) => {
      const { data, error } = await supabase
        .from("event_schedule")
        .insert({ ...item, start_time: item.start_time || item.time })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event_schedule", variables.event_id] });
      toast.success("Activité ajoutée au programme");
    },
    onError: (error: any) => {
      console.error("Error creating schedule item:", error);
      toast.error("Erreur lors de l'ajout de l'activité");
    },
  });
};

// Update a schedule item
export const useUpdateScheduleItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EventScheduleItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("event_schedule")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event_schedule", data.event_id] });
      toast.success("Activité modifiée");
    },
    onError: (error: any) => {
      console.error("Error updating schedule item:", error);
      toast.error("Erreur lors de la modification");
    },
  });
};

// Delete a schedule item
export const useDeleteScheduleItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase
        .from("event_schedule")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, eventId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event_schedule", variables.eventId] });
      toast.success("Activité supprimée");
    },
    onError: (error: any) => {
      console.error("Error deleting schedule item:", error);
      toast.error("Erreur lors de la suppression");
    },
  });
};

// Bulk upsert schedule items (for form submission)
export const useUpsertScheduleItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, items }: { eventId: string; items: Omit<EventScheduleItemInput, "event_id">[] }) => {
      // First, delete all existing items for this event
      const { error: deleteError } = await supabase
        .from("event_schedule")
        .delete()
        .eq("event_id", eventId);

      if (deleteError) throw deleteError;

      // Then, insert all new items
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          ...item,
          event_id: eventId,
          start_time: item.start_time || item.time,
        }));

        const { data, error: insertError } = await supabase
          .from("event_schedule")
          .insert(itemsToInsert)
          .select();

        if (insertError) throw insertError;
        return data;
      }

      return [];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event_schedule", variables.eventId] });
      toast.success("Programme enregistré");
    },
    onError: (error: any) => {
      console.error("Error upserting schedule items:", error);
      toast.error("Erreur lors de l'enregistrement du programme");
    },
  });
};
