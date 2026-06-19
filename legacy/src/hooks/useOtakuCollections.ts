import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CosplayItem {
  id: string;
  user_id: string;
  character_name: string;
  universe: string;
  user_image_url: string;
  official_image_url: string;
  created_at: string;
}

export interface LibraryItem {
  id: string;
  user_id: string;
  type: "MANGA" | "ANIME" | "GAME";
  title: string;
  cover_url: string;
  created_at: string;
}

// Fetch cosplay vestiaire for a specific user
export const useCosplayVestiaire = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["cosplay-vestiaire", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("cosplay_vestiaire")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CosplayItem[];
    },
    enabled: !!userId,
  });
};

// Fetch otaku library for a specific user
export const useOtakuLibrary = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["otaku-library", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("otaku_library")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LibraryItem[];
    },
    enabled: !!userId,
  });
};

// Fetch stats for annuaire (count of cosplays and library items per user)
export const useAnnuaireStats = () => {
  return useQuery({
    queryKey: ["annuaire-stats"],
    queryFn: async () => {
      // Get cosplay counts per user
      const { data: cosplayData, error: cosplayError } = await supabase
        .from("cosplay_vestiaire")
        .select("user_id");

      if (cosplayError) throw cosplayError;

      // Get library counts per user
      const { data: libraryData, error: libraryError } = await supabase
        .from("otaku_library")
        .select("user_id, type");

      if (libraryError) throw libraryError;

      // Count cosplays per user
      const cosplayCounts: Record<string, number> = {};
      cosplayData?.forEach((item) => {
        cosplayCounts[item.user_id] = (cosplayCounts[item.user_id] || 0) + 1;
      });

      // Count library items per user (separate manga/anime counts)
      const mangaCounts: Record<string, number> = {};
      const animeCounts: Record<string, number> = {};
      libraryData?.forEach((item) => {
        if (item.type === "MANGA") {
          mangaCounts[item.user_id] = (mangaCounts[item.user_id] || 0) + 1;
        } else {
          animeCounts[item.user_id] = (animeCounts[item.user_id] || 0) + 1;
        }
      });

      return {
        cosplayCounts,
        mangaCounts,
        animeCounts,
      };
    },
  });
};

// Get users who have cosplays
export const useCosplayerUserIds = () => {
  return useQuery({
    queryKey: ["cosplayer-user-ids"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cosplay_vestiaire")
        .select("user_id");

      if (error) throw error;
      
      const uniqueUserIds = [...new Set(data?.map((item) => item.user_id))];
      return uniqueUserIds;
    },
  });
};

// Fetch all cosplays for search in Annuaire
export const useAllCosplays = () => {
  return useQuery({
    queryKey: ["annuaire-cosplays"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cosplay_vestiaire")
        .select("user_id, character_name, universe");

      if (error) throw error;
      return data || [];
    },
  });
};

// Add item to otaku library
export const useAddOtakuLibraryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: { user_id: string; type: "MANGA" | "ANIME" | "GAME"; title: string; cover_url: string }) => {
      const { data, error } = await supabase
        .from("otaku_library")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["otaku-library", variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ["public-profile"] });
      toast.success("Ajouté à la bibliothèque !");
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout");
    },
  });
};
