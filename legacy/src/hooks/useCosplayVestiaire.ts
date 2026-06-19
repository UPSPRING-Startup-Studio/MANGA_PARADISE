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
  character_id?: string;
  universe_id?: string;
  created_at: string;
}

export interface AddCosplayInput {
  characterId: string;
  characterName: string;
  universeId: string;
  universeName: string;
  cosplayPhotoFile: File;
  officialImageUrl: string;
}

// Fetch user's cosplays
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

// Add a new cosplay with image upload
export const useAddCosplay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddCosplayInput & { userId: string }) => {
      const { 
        userId, 
        characterId, 
        characterName, 
        universeId, 
        universeName, 
        cosplayPhotoFile, 
        officialImageUrl 
      } = input;

      // Generate unique filename
      const fileExt = cosplayPhotoFile.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Upload cosplay photo to storage - try cosplay-vestiaire bucket first
      let uploadError = null;
      let bucketName = "cosplay-vestiaire";
      
      console.log("DEBUG VESTIAIRE - Uploading to bucket:", bucketName, "file:", fileName);
      
      const result = await supabase.storage
        .from(bucketName)
        .upload(fileName, cosplayPhotoFile, {
          cacheControl: "3600",
          upsert: false,
        });
      
      uploadError = result.error;
      
      // Fallback to cosplays bucket if cosplay-vestiaire doesn't exist
      if (uploadError?.message?.includes("Bucket not found") || uploadError?.name === "StorageError") {
        console.warn("DEBUG VESTIAIRE - Bucket 'cosplay-vestiaire' not found, trying 'cosplays'");
        bucketName = "cosplays";
        const fallbackResult = await supabase.storage
          .from(bucketName)
          .upload(fileName, cosplayPhotoFile, {
            cacheControl: "3600",
            upsert: false,
          });
        uploadError = fallbackResult.error;
      }

      if (uploadError) {
        console.error("DEBUG VESTIAIRE - Upload failed:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
      
      console.log("DEBUG VESTIAIRE - Upload success! URL:", urlData.publicUrl);

      // Insert into database with reference IDs
      console.log("DEBUG VESTIAIRE - Final Insert - Preparing to insert into cosplay_vestiaire");
      console.log("DEBUG VESTIAIRE - Final Insert - Data:", {
        user_id: userId,
        character_id: characterId,
        universe_id: universeId,
        character_name: characterName,
        universe: universeName,
        user_image_url: urlData.publicUrl,
        official_image_url: officialImageUrl,
      });
      
      const { data, error } = await supabase
        .from("cosplay_vestiaire")
        .insert({
          user_id: userId,
          character_id: characterId,
          universe_id: universeId,
          character_name: characterName,
          universe: universeName,
          user_image_url: urlData.publicUrl,
          official_image_url: officialImageUrl,
        })
        .select()
        .single();

      if (error) {
        console.error("DEBUG VESTIAIRE - Final Insert Error:", error);
        console.error("DEBUG VESTIAIRE - Final Insert Error code:", error.code);
        console.error("DEBUG VESTIAIRE - Final Insert Error message:", error.message);
        console.error("DEBUG VESTIAIRE - Final Insert Error details:", error.details);
        console.error("DEBUG VESTIAIRE - Final Insert Error hint:", error.hint);
        throw error;
      }
      
      console.log("DEBUG VESTIAIRE - Final Insert SUCCESS:", data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplay-vestiaire", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["annuaire-cosplays"] });
      queryClient.invalidateQueries({ queryKey: ["cosplayer-user-ids"] });
      queryClient.invalidateQueries({ queryKey: ["annuaire-stats"] });
      toast.success("Cosplay ajouté au vestiaire !");
    },
    onError: (error) => {
      console.error("Error adding cosplay:", error);
      toast.error("Erreur lors de l'ajout du cosplay");
    },
  });
};

// Delete a cosplay
export const useDeleteCosplay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId, imageUrl }: { id: string; userId: string; imageUrl: string }) => {
      // Extract file path from URL for deletion
      const urlParts = imageUrl.split('/cosplays/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("cosplays").remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from("cosplay_vestiaire")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
      return { id, userId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplay-vestiaire", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["annuaire-cosplays"] });
      queryClient.invalidateQueries({ queryKey: ["cosplayer-user-ids"] });
      queryClient.invalidateQueries({ queryKey: ["annuaire-stats"] });
      toast.success("Cosplay supprimé du vestiaire");
    },
    onError: (error) => {
      console.error("Error deleting cosplay:", error);
      toast.error("Erreur lors de la suppression");
    },
  });
};
