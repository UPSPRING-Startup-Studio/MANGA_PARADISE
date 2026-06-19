import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types
export interface EventMemory {
  id: string;
  user_id: string;
  event_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface EventEncounter {
  id: string;
  user_id: string;
  event_id: string;
  encountered_user_id: string;
  note: string | null;
  created_at: string;
  encountered_user?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface EventMemoryPhoto {
  id: string;
  user_id: string;
  event_id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
}

// Fetch memories for an event
export const useEventMemories = (eventId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ["event-memories", eventId, userId],
    queryFn: async () => {
      if (!eventId || !userId) return [];
      
      const { data, error } = await supabase
        .from("event_memories")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as EventMemory[];
    },
    enabled: !!eventId && !!userId,
  });
};

// Fetch encounters for an event
export const useEventEncounters = (eventId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ["event-encounters", eventId, userId],
    queryFn: async () => {
      if (!eventId || !userId) return [];
      
      const { data, error } = await supabase
        .from("event_encounters")
        .select(`
          *,
          encountered_user:profiles!event_encounters_encountered_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as EventEncounter[];
    },
    enabled: !!eventId && !!userId,
  });
};

// Fetch photos for an event
export const useEventMemoryPhotos = (eventId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ["event-memory-photos", eventId, userId],
    queryFn: async () => {
      if (!eventId || !userId) return [];
      
      const { data, error } = await supabase
        .from("event_memory_photos")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as EventMemoryPhoto[];
    },
    enabled: !!eventId && !!userId,
  });
};

// Add a memory
export const useAddMemory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, userId, content }: { eventId: string; userId: string; content: string }) => {
      const { data, error } = await supabase
        .from("event_memories")
        .insert({ event_id: eventId, user_id: userId, content })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-memories", variables.eventId, variables.userId] });
    },
  });
};

// Delete a memory
export const useDeleteMemory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memoryId, eventId, userId }: { memoryId: string; eventId: string; userId: string }) => {
      const { error } = await supabase
        .from("event_memories")
        .delete()
        .eq("id", memoryId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-memories", variables.eventId, variables.userId] });
    },
  });
};

// Add an encounter
export const useAddEncounter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, userId, encounteredUserId, note }: { 
      eventId: string; 
      userId: string; 
      encounteredUserId: string;
      note?: string;
    }) => {
      const { data, error } = await supabase
        .from("event_encounters")
        .insert({ 
          event_id: eventId, 
          user_id: userId, 
          encountered_user_id: encounteredUserId,
          note: note || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-encounters", variables.eventId, variables.userId] });
    },
  });
};

// Delete an encounter
export const useDeleteEncounter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ encounterId, eventId, userId }: { encounterId: string; eventId: string; userId: string }) => {
      const { error } = await supabase
        .from("event_encounters")
        .delete()
        .eq("id", encounterId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-encounters", variables.eventId, variables.userId] });
    },
  });
};

// Add a photo
export const useAddMemoryPhoto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, userId, photoUrl, caption }: { 
      eventId: string; 
      userId: string; 
      photoUrl: string;
      caption?: string;
    }) => {
      const { data, error } = await supabase
        .from("event_memory_photos")
        .insert({ 
          event_id: eventId, 
          user_id: userId, 
          photo_url: photoUrl,
          caption: caption || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-memory-photos", variables.eventId, variables.userId] });
    },
  });
};

// Delete a photo
export const useDeleteMemoryPhoto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ photoId, eventId, userId }: { photoId: string; eventId: string; userId: string }) => {
      const { error } = await supabase
        .from("event_memory_photos")
        .delete()
        .eq("id", photoId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-memory-photos", variables.eventId, variables.userId] });
    },
  });
};

// Get memory stats for past events
export const usePastEventsWithMemoryStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["past-events-memory-stats", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const today = new Date().toISOString().split('T')[0];
      
      // Get past event participations
      const { data: registrations, error: regError } = await supabase
        .from("event_participants")
        .select(`
          *,
          events (
            id, title, date, end_date, image_url, city, venue_name
          )
        `)
        .eq("user_id", userId);
      
      if (regError) {
        console.error("Error fetching registrations for memories:", regError);
        throw regError;
      }
      
      // Filter to past events
      const pastEvents = (registrations || []).filter((r: any) => 
        r.events && r.events.date < today
      );
      
      // Get encounter counts - WRAPPED IN TRY/CATCH to prevent 404 from blocking main display
      const eventIds = pastEvents.map((r: any) => r.events.id);
      
      let encounterCounts = new Map<string, number>();
      let photoCounts = new Map<string, number>();
      
      // Try to fetch encounters (table may not exist)
      try {
        const { data: encounters, error: encError } = await supabase
          .from("event_encounters")
          .select("event_id")
          .eq("user_id", userId)
          .in("event_id", eventIds.length > 0 ? eventIds : ['none']);
        
        if (encError) {
          // Log but don't throw - table might not exist
          console.warn("⚠️ event_encounters table not accessible:", encError.message);
        } else {
          (encounters || []).forEach((e: any) => {
            encounterCounts.set(e.event_id, (encounterCounts.get(e.event_id) || 0) + 1);
          });
        }
      } catch (err) {
        console.warn("⚠️ Failed to fetch encounters, continuing without them:", err);
      }
      
      // Try to fetch photos (table may not exist)
      try {
        const { data: photos, error: photoError } = await supabase
          .from("event_memory_photos")
          .select("event_id")
          .eq("user_id", userId)
          .in("event_id", eventIds.length > 0 ? eventIds : ['none']);
        
        if (photoError) {
          // Log but don't throw - table might not exist
          console.warn("⚠️ event_memory_photos table not accessible:", photoError.message);
        } else {
          (photos || []).forEach((p: any) => {
            photoCounts.set(p.event_id, (photoCounts.get(p.event_id) || 0) + 1);
          });
        }
      } catch (err) {
        console.warn("⚠️ Failed to fetch photos, continuing without them:", err);
      }
      
      return pastEvents.map((r: any) => ({
        ...r,
        encounterCount: encounterCounts.get(r.events.id) || 0,
        photoCount: photoCounts.get(r.events.id) || 0,
      })).sort((a: any, b: any) => 
        new Date(b.events.date).getTime() - new Date(a.events.date).getTime()
      );
    },
    enabled: !!userId,
  });
};
