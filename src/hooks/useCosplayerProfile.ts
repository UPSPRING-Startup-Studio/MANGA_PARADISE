import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CosplayerProfileData {
  is_cosplayer_mode_active: boolean;
  cosplay_specialties: string[];
  cosplay_years_experience: string;
  cosplay_collaboration_prefs: string[];
  cosplay_style: string;
  cosplay_con_crunch: string;
  cosplay_nightmare: string;
  cosplay_motivation: string;
}

// Fetch cosplayer profile data from profiles table
export const useCosplayerProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["cosplayer-profile", userId],
    queryFn: async () => {
      if (!userId) {
        console.log("DEBUG COSPLAYER PROFILE - No userId provided");
        return null;
      }

      console.log("DEBUG COSPLAYER PROFILE - Fetching for user:", userId);

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          is_cosplayer_mode_active,
          cosplay_specialties,
          cosplay_years_experience,
          cosplay_collaboration_prefs,
          cosplay_style,
          cosplay_con_crunch,
          cosplay_nightmare,
          cosplay_motivation
        `)
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("DEBUG COSPLAYER PROFILE - Fetch error:", error);
        console.error("DEBUG COSPLAYER PROFILE - Error code:", error.code);
        console.error("DEBUG COSPLAYER PROFILE - Error message:", error.message);
        console.error("DEBUG COSPLAYER PROFILE - Error details:", error.details);
        
        // If PGRST205 or similar, the table might not have the columns yet
        if (error.code === "PGRST205" || error.message?.includes("does not exist")) {
          console.warn("DEBUG COSPLAYER PROFILE - Column/table may not exist yet");
          return null;
        }
        
        throw error;
      }

      console.log("DEBUG COSPLAYER PROFILE - Data fetched:", data);
      return data as CosplayerProfileData | null;
    },
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: "always",
  });
};

// Upsert cosplayer profile data
export const useUpsertCosplayerProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: Partial<CosplayerProfileData>;
    }) => {
      console.log("DEBUG COSPLAYER PROFILE - Starting update for user:", userId);
      console.log("DEBUG COSPLAYER PROFILE - Data to update:", data);

      // Use UPDATE instead of UPSERT to avoid RLS issues
      // The profile row should already exist (created at signup)
      const { data: result, error } = await supabase
        .from("profiles")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select("id, is_cosplayer_mode_active")
        .single();

      if (error) {
        console.error("DEBUG COSPLAYER PROFILE - Update error:", error);
        console.error("DEBUG COSPLAYER PROFILE - Error code:", error.code);
        console.error("DEBUG COSPLAYER PROFILE - Error message:", error.message);
        console.error("DEBUG COSPLAYER PROFILE - Error details:", error.details);
        console.error("DEBUG COSPLAYER PROFILE - Error hint:", error.hint);
        throw error;
      }

      console.log("DEBUG COSPLAYER PROFILE - SUCCESS! Data updated:", result);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplayer-profile", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profil cosplayer enregistré !");
    },
    onError: (error: any) => {
      console.error("DEBUG COSPLAYER PROFILE - Mutation error:", error);
      toast.error(`Erreur lors de la sauvegarde: ${error.message || "Erreur inconnue"}`);
    },
  });
};