import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface AttendanceDetail {
  date: string;
  role: "visitor" | "volunteer" | "exhibitor" | "cosplayer";
  cosplay_id: string | null;
}

// Cosplay info stored directly in cosplay_data JSONB column
export interface CosplayDataEntry {
  character: string;
  universe: string;
  date?: string;
  imageUrl?: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  role: string;
  registered_at: string;
  attendance_details: AttendanceDetail[] | null;
  attendance_dates: string[] | null;
  cosplay_details: Record<string, { character: string; universe: string; imageUrl?: string }> | null;
  cosplay_data: CosplayDataEntry[] | null;
  universe: string | null;
  user?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  // Legacy field - kept for backward compatibility but no longer used for joins
  planned_cosplay_id?: string | null;
}

// Fetch participants for an event
export const useEventParticipants = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["event-participants", eventId],
    queryFn: async () => {
      if (!eventId) return [];

       const { data, error } = await supabase
         .from("event_participants")
         .select(`
            id,
            event_id,
            user_id,
            role,
            registered_at,
            attendance_dates,
            cosplay_data,
            universe,
            user:user_id (id, display_name, username, avatar_url)
          `)
         .eq("event_id", eventId)
         .order("registered_at", { ascending: true });

      if (error) {
        console.error("DEBUG useEventParticipants - Error:", error);
        throw error;
      }
      
      // Parse attendance_dates and cosplay_data from JSON
      return (data || []).map((p: any) => ({
        ...p,
        attendance_details: null, // Legacy field - no longer fetched
        attendance_dates: (Array.isArray(p.attendance_dates) ? p.attendance_dates : null) as string[] | null,
        cosplay_details: null, // Legacy field - no longer fetched
        cosplay_data: (Array.isArray(p.cosplay_data) ? p.cosplay_data : null) as CosplayDataEntry[] | null,
        universe: p.universe || null,
      })) as EventParticipant[];
    },
    enabled: !!eventId,
  });
};

// Check if user is registered to an event
export const useIsRegistered = (eventId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ["is-registered", eventId, userId],
    queryFn: async () => {
      if (!eventId || !userId) return null;

      const { data, error } = await supabase
        .from("event_participants")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId && !!userId,
  });
};

// Register to an event
export const useRegisterToEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      userId,
      plannedCosplayId,
      role = "visitor",
      attendanceDetails,
      attendanceDates,
      cosplayData
    }: {
      eventId: string;
      userId: string;
      plannedCosplayId?: string | null;
      role?: string;
      attendanceDetails?: AttendanceDetail[] | null;
      attendanceDates?: string[] | null;
      cosplayData?: CosplayDataEntry[] | null;
    }) => {
      // Build insert data with proper typing
      const insertData: {
        event_id: string;
        user_id: string;
        role: string;
        planned_cosplay_id?: string;
        attendance_details?: Json;
        attendance_dates?: Json;
        cosplay_data?: Json;
      } = {
        event_id: eventId,
        user_id: userId,
        role,
      };

      // Only add optional fields if they have values
      if (plannedCosplayId) {
        insertData.planned_cosplay_id = plannedCosplayId;
      }

      // Send empty object instead of null for attendance_details
      if (attendanceDetails && attendanceDetails.length > 0) {
        insertData.attendance_details = attendanceDetails as unknown as Json;
      }

      // Add attendance_dates if provided (NEW for Visual Line-Up Phase 2)
      if (attendanceDates && attendanceDates.length > 0) {
        insertData.attendance_dates = attendanceDates as unknown as Json;
      }

      // Add cosplay_data if provided
      if (cosplayData && cosplayData.length > 0) {
        insertData.cosplay_data = cosplayData as unknown as Json;
      }

      const { data, error } = await supabase
        .from("event_participants")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Force immediate refetch of registration status
      queryClient.invalidateQueries({ queryKey: ["event-participants", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["is-registered", variables.eventId, variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations", variables.userId] });
      // Sync lineup caches
      queryClient.invalidateQueries({ queryKey: ["unified-lineups"] });
      queryClient.invalidateQueries({ queryKey: ["cosplayer-agenda"] });
      // Force refetch without waiting for invalidation
      queryClient.refetchQueries({ queryKey: ["is-registered", variables.eventId, variables.userId] });
      toast.success("Inscription confirmée !");
    },
    onError: (error) => {
      console.error("Error registering to event:", error);
      toast.error("Erreur lors de l'inscription");
    },
  });
};

// Update participation (change cosplay and role)
export const useUpdateParticipation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      participationId,
      eventId,
      plannedCosplayId,
      role,
      attendanceDetails,
      attendanceDates,
      cosplayData
    }: {
      participationId: string;
      eventId: string;
      plannedCosplayId: string | null;
      role?: string;
      attendanceDetails?: AttendanceDetail[] | null;
      attendanceDates?: string[] | null;
      cosplayData?: CosplayDataEntry[] | null;
    }) => {
      const updateData: {
        planned_cosplay_id: string | null;
        role?: string;
        attendance_details?: Json;
        attendance_dates?: Json;
        cosplay_data?: Json;
      } = {
        planned_cosplay_id: plannedCosplayId,
      };
      if (role) {
        updateData.role = role;
      }
      if (attendanceDetails !== undefined) {
        updateData.attendance_details = attendanceDetails as unknown as Json;
      }
      if (attendanceDates !== undefined && attendanceDates && attendanceDates.length > 0) {
        updateData.attendance_dates = attendanceDates as unknown as Json;
      }
      if (cosplayData !== undefined && cosplayData && cosplayData.length > 0) {
        updateData.cosplay_data = cosplayData as unknown as Json;
      }
      
      const { data, error } = await supabase
        .from("event_participants")
        .update(updateData)
        .eq("id", participationId)
        .select()
        .single();

      if (error) throw error;
      return { data, eventId };
    },
    onSuccess: (result) => {
      // Force immediate refetch
      queryClient.invalidateQueries({ queryKey: ["event-participants", result.eventId] });
      queryClient.invalidateQueries({ queryKey: ["is-registered"] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
      // Sync lineup caches
      queryClient.invalidateQueries({ queryKey: ["unified-lineups"] });
      queryClient.invalidateQueries({ queryKey: ["cosplayer-agenda"] });
      queryClient.refetchQueries({ queryKey: ["event-participants", result.eventId] });
      toast.success("Participation mise à jour !");
    },
    onError: (error) => {
      console.error("Error updating participation:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });
};

// Unregister from event
export const useUnregisterFromEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      userId 
    }: { 
      eventId: string; 
      userId: string;
    }) => {
      const { error } = await supabase
        .from("event_participants")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", userId);

      if (error) throw error;
      return { eventId, userId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-participants", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["is-registered", variables.eventId, variables.userId] });
      // Sync lineup caches (lineup rows cleaned up by EventDetail.handleUnregister)
      queryClient.invalidateQueries({ queryKey: ["unified-lineups"] });
      queryClient.invalidateQueries({ queryKey: ["cosplayer-agenda"] });
      toast.success("Désinscription effectuée");
    },
    onError: (error) => {
      console.error("Error unregistering from event:", error);
      toast.error("Erreur lors de la désinscription");
    },
  });
};
