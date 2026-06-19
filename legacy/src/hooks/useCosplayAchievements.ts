import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CosplayAchievement {
  id: string;
  user_id: string;
  contest_name: string;
  award_title: string;
  event_date: string;
  proof_image_url: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface CosplayAchievementWithProfile extends CosplayAchievement {
  profiles?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

// Fetch user's own achievements (all statuses)
export const useUserAchievements = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["cosplay-achievements", "user", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("cosplay_achievements")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CosplayAchievement[];
    },
    enabled: !!userId,
  });
};

// Fetch approved achievements for a public profile
export const usePublicAchievements = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["cosplay-achievements", "public", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("cosplay_achievements")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "approved")
        .order("event_date", { ascending: false });

      if (error) throw error;
      return data as CosplayAchievement[];
    },
    enabled: !!userId,
  });
};

// Fetch all pending achievements (admin)
export const usePendingAchievements = () => {
  return useQuery({
    queryKey: ["cosplay-achievements", "pending"],
    queryFn: async () => {
      // First get achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from("cosplay_achievements")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (achievementsError) throw achievementsError;
      if (!achievements || achievements.length === 0) return [];

      // Then get profiles for each user
      const userIds = [...new Set(achievements.map(a => a.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return achievements.map(achievement => ({
        ...achievement,
        status: achievement.status as "pending" | "approved" | "rejected",
        profiles: profilesMap.get(achievement.user_id) || undefined,
      })) as CosplayAchievementWithProfile[];
    },
  });
};

// Add a new achievement with multiple proof files
export const useAddAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      contestName,
      awardTitle,
      eventDate,
      proofFiles,
    }: {
      userId: string;
      contestName: string;
      awardTitle: string;
      eventDate: string;
      proofFiles: File[];
    }) => {
      console.log("DEBUG ACHIEVEMENT - Starting upload for user:", userId);
      console.log("DEBUG ACHIEVEMENT - Files to upload:", proofFiles.length);

      // Upload all proof files to storage
      const uploadedUrls: string[] = [];
      
      for (const file of proofFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        console.log("DEBUG ACHIEVEMENT - Uploading file:", fileName);
        
        const { error: uploadError } = await supabase.storage
          .from("achievement-proofs")
          .upload(fileName, file);

        if (uploadError) {
          console.error("DEBUG ACHIEVEMENT - Upload error:", uploadError);
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from("achievement-proofs")
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
        console.log("DEBUG ACHIEVEMENT - File uploaded successfully:", urlData.publicUrl);
      }

      console.log("DEBUG ACHIEVEMENT - All URLs:", uploadedUrls);

      // Store URLs as JSON array in proof_image_url column
      // The column is a string, so we store JSON.stringify array
      const proofUrlsJson = JSON.stringify(uploadedUrls);

      // Insert achievement record
      const { data, error } = await supabase
        .from("cosplay_achievements")
        .insert({
          user_id: userId,
          contest_name: contestName,
          award_title: awardTitle,
          event_date: eventDate,
          proof_image_url: proofUrlsJson,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error("DEBUG ACHIEVEMENT - Insert error:", error);
        throw error;
      }

      console.log("DEBUG ACHIEVEMENT - Achievement created:", data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplay-achievements", "user", variables.userId] });
      toast.success("Prix déclaré ! Il sera visible après validation par un admin.");
    },
    onError: (error) => {
      console.error("Error adding achievement:", error);
      toast.error("Erreur lors de la déclaration du prix");
    },
  });
};

// Delete own achievement (only pending ones)
export const useDeleteAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId, proofUrl }: { id: string; userId: string; proofUrl: string }) => {
      // Extract file path from URL
      const urlParts = proofUrl.split("/achievement-proofs/");
      if (urlParts.length > 1) {
        await supabase.storage.from("achievement-proofs").remove([urlParts[1]]);
      }

      const { error } = await supabase
        .from("cosplay_achievements")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplay-achievements", "user", variables.userId] });
      toast.success("Prix supprimé");
    },
    onError: (error) => {
      console.error("Error deleting achievement:", error);
      toast.error("Erreur lors de la suppression");
    },
  });
};

// Approve or reject achievement (admin)
export const useModerateAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      reviewerId,
    }: {
      id: string;
      status: "approved" | "rejected";
      reviewerId: string;
    }) => {
      const { error } = await supabase
        .from("cosplay_achievements")
        .update({
          status,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplay-achievements"] });
      toast.success(variables.status === "approved" ? "Prix validé !" : "Prix refusé");
    },
    onError: (error) => {
      console.error("Error moderating achievement:", error);
      toast.error("Erreur lors de la modération");
    },
  });
};
