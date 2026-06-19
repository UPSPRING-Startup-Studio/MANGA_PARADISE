import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CosplayRegistration {
  id: string;
  character_name: string;
  universe: string;
  participation_type: string;
  group_name: string | null;
  is_minor: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  event_date: string;
  contest_name: string;
  event_location: string | null;
  image_url: string | null;
  reference_image_url: string | null;
  music_file_url: string | null;
  music_file_name: string | null;
  authorization_file_url: string | null;
  authorization_file_name: string | null;
  technical_needs: string | null;
  staff_comments: string | null;
  created_at: string;
}

const REGISTRATION_SELECT = "*, event:event_schedule(title, start_time, location), costume:costumes(image_url)";

export const useCosplayRegistrations = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["cosplay-registrations", userId],
    queryFn: async (): Promise<CosplayRegistration[]> => {
      if (!userId) return [];

      const { data, error } = await (supabase as any)
        .from("cosplay_registrations")
        .select(REGISTRATION_SELECT)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur chargement inscriptions:", error);
        throw error;
      }

      if (!data) return [];

      return data.map((reg: any) => ({
        id: reg.id,
        character_name: reg.character_name,
        universe: reg.universe || "Univers inconnu",
        participation_type: reg.participation_type,
        group_name: reg.group_name || null,
        is_minor: reg.is_minor || false,
        status: reg.status || "PENDING",
        event_date: reg.event?.start_time || new Date().toISOString(),
        contest_name: reg.event?.title || "Concours Cosplay",
        event_location: reg.event?.location || null,
        image_url: reg.costume?.image_url || reg.reference_image_url || null,
        reference_image_url: reg.reference_image_url || null,
        music_file_url: reg.music_file_url || null,
        music_file_name: reg.music_file_name || null,
        authorization_file_url: reg.authorization_file_url || null,
        authorization_file_name: reg.authorization_file_name || null,
        technical_needs: reg.technical_needs || null,
        staff_comments: reg.staff_comments || null,
        created_at: reg.created_at,
      }));
    },
    enabled: !!userId,
  });
};
