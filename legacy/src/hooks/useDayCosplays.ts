import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventParticipant, AttendanceDetail } from "./useEventParticipants";

export interface CosplayInfo {
  id: string;
  character_name: string;
  universe: string;
  user_image_url: string;
}

// Extract all unique cosplay IDs from participants' attendance_details
export const extractCosplayIds = (participants: EventParticipant[]): string[] => {
  const ids = new Set<string>();
  
  participants.forEach(p => {
    const details = p.attendance_details as AttendanceDetail[] | null;
    if (Array.isArray(details)) {
      details.forEach(d => {
        if (d.cosplay_id) {
          ids.add(d.cosplay_id);
        }
      });
    }
    // Also add the main planned_cosplay_id if exists
    if (p.planned_cosplay_id) {
      ids.add(p.planned_cosplay_id);
    }
  });
  
  return Array.from(ids);
};

// Fetch all cosplays referenced in participants' attendance_details
export const useDayCosplays = (participants: EventParticipant[]) => {
  const cosplayIds = extractCosplayIds(participants);
  
  return useQuery({
    queryKey: ["day-cosplays", cosplayIds.sort().join(",")],
    queryFn: async () => {
      if (cosplayIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from("cosplay_vestiaire")
        .select("id, character_name, universe, user_image_url")
        .in("id", cosplayIds);
      
      if (error) throw error;
      
      // Create a map for O(1) lookup
      const cosplayMap: Record<string, CosplayInfo> = {};
      (data || []).forEach(c => {
        cosplayMap[c.id] = c;
      });
      
      return cosplayMap;
    },
    enabled: cosplayIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Helper function to get cosplay for a specific day
export const getCosplayForDay = (
  participant: EventParticipant,
  selectedDate: string | null,
  cosplayMap: Record<string, CosplayInfo>
): CosplayInfo | null => {
  const details = participant.attendance_details as AttendanceDetail[] | null;
  
  if (!selectedDate || !Array.isArray(details)) {
    // Return main cosplay if no specific day selected
    if (participant.planned_cosplay_id && cosplayMap[participant.planned_cosplay_id]) {
      return cosplayMap[participant.planned_cosplay_id];
    }
    return null;
  }
  
  // Find the attendance detail for this specific date
  const dayDetail = details.find(d => d.date === selectedDate);
  
  if (dayDetail?.cosplay_id && cosplayMap[dayDetail.cosplay_id]) {
    return cosplayMap[dayDetail.cosplay_id];
  }
  
  return null;
};

// Check if participant has multiple different cosplays
export const hasMultipleCosplays = (
  participant: EventParticipant
): boolean => {
  const details = participant.attendance_details as AttendanceDetail[] | null;
  
  if (!Array.isArray(details)) return false;
  
  const cosplayIds = details
    .filter(d => d.cosplay_id)
    .map(d => d.cosplay_id);
  
  const uniqueIds = new Set(cosplayIds);
  return uniqueIds.size > 1;
};
