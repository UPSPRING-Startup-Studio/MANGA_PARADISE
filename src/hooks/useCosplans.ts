import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CosplanStatus = 'wishlist' | 'started' | 'paused' | 'finished';

export interface CosplayPlan {
  id: string;
  user_id: string;
  character_name: string;
  character_id?: string | null;
  universe: string;
  universe_id?: string | null;
  target_year: number;
  progress_level: number;
  status: CosplanStatus;
  priority: number;
  image_url: string | null;
  notes: string | null;
  budget: number | null;
  deadline: string | null;
  target_event_id?: string | null;
  group_id?: string | null; // NEW: Reference to party/group
  auto_progress: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCosplanInput {
  character_name: string;
  character_id?: string | null;
  universe: string;
  universe_id?: string | null;
  target_year: number;
  image_url?: string;
  status?: CosplanStatus;
  priority?: number;
  budget?: number | null;
  deadline?: string | null;
  target_event_id?: string | null;
  notes?: string | null;
}

export interface UpdateCosplanInput {
  id: string;
  character_name?: string;
  universe?: string;
  target_year?: number;
  image_url?: string | null;
  progress_level?: number;
  status?: CosplanStatus;
  priority?: number;
  budget?: number | null;
  deadline?: string | null;
  target_event_id?: string | null;
  notes?: string | null;
  auto_progress?: boolean;
}

// Fetch user's cosplans
export const useCosplans = (userId: string | undefined, year?: number) => {
  return useQuery({
    queryKey: ["cosplans", userId, year],
    queryFn: async () => {
      if (!userId) return [];
      
      let query = supabase
        .from("cosplay_plans")
        .select("*")
        .eq("user_id", userId)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (year) {
        query = query.eq("target_year", year);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform image_url to public URL if it's a storage path
      const transformedData = (data as CosplayPlan[]).map(plan => {
        if (plan.image_url && !plan.image_url.startsWith('http')) {
          // It's a storage path, generate public URL
          const { data: urlData } = supabase.storage
            .from('cosplay-projects')
            .getPublicUrl(plan.image_url);
          
          console.log("DEBUG COSPLAN FETCH - Transformed image URL:", {
            original: plan.image_url,
            public: urlData.publicUrl
          });
          
          return {
            ...plan,
            image_url: urlData.publicUrl
          };
        }
        return plan;
      });
      
      return transformedData;
    },
    enabled: !!userId,
  });
};

// Create a new cosplan
export const useCreateCosplan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCosplanInput & { userId: string }) => {
      const { userId, ...planData } = input;

      console.log("DEBUG COSPLAN - Creating cosplan with data:", {
        userId,
        ...planData,
      });

      const { data, error } = await supabase
        .from("cosplay_plans")
        .insert({
          user_id: userId,
          progress_level: 0, // Default progress to 0%
          auto_progress: false, // Default auto_progress
          ...planData,
        })
        .select()
        .single();

      if (error) {
        console.error("DEBUG COSPLAN - Insert error:", error);
        console.error("DEBUG COSPLAN - Error code:", error.code);
        console.error("DEBUG COSPLAN - Error message:", error.message);
        console.error("DEBUG COSPLAN - Error details:", error.details);
        throw error;
      }

      console.log("DEBUG COSPLAN - SUCCESS! Created:", data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplans", variables.userId] });
      toast.success("Projet cosplay ajouté ! 🎯");
    },
    onError: (error: any) => {
      console.error("Error creating cosplan:", error);
      toast.error(`Erreur lors de l'ajout du projet: ${error.message || "Erreur inconnue"}`);
    },
  });
};

// Update a cosplan
export const useUpdateCosplan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCosplanInput & { userId: string }) => {
      const { id, userId, ...updates } = input;

      const { data, error } = await supabase
        .from("cosplay_plans")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplans", variables.userId] });
    },
    onError: (error) => {
      console.error("Error updating cosplan:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });
};

// Delete a cosplan
export const useDeleteCosplan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from("cosplay_plans")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
      return { id, userId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplans", variables.userId] });
      toast.success("Projet supprimé");
    },
    onError: (error) => {
      console.error("Error deleting cosplan:", error);
      toast.error("Erreur lors de la suppression");
    },
  });
};

// Transfer finished cosplan to vestiaire
export const useTransferToVestiaire = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      plan, 
      userId, 
      userImageUrl 
    }: { 
      plan: CosplayPlan; 
      userId: string; 
      userImageUrl: string;
    }) => {
      // First, add to vestiaire
      const { error: insertError } = await supabase
        .from("cosplay_vestiaire")
        .insert({
          user_id: userId,
          character_name: plan.character_name,
          universe: plan.universe,
          user_image_url: userImageUrl,
          official_image_url: plan.image_url || userImageUrl,
        });

      if (insertError) throw insertError;

      // Then delete the plan
      const { error: deleteError } = await supabase
        .from("cosplay_plans")
        .delete()
        .eq("id", plan.id)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      return { planId: plan.id, userId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cosplans", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["cosplay-vestiaire", variables.userId] });
      toast.success("🎉 Cosplay transféré vers le Vestiaire !");
    },
    onError: (error) => {
      console.error("Error transferring to vestiaire:", error);
      toast.error("Erreur lors du transfert");
    },
  });
};
