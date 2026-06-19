import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook to delete a contest registration
 * Invalidates the contest-registrations query on success
 */
export const useDeleteContestRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationId: string) => {
      if (!registrationId) {
        throw new Error("Registration ID is required");
      }

      const { error } = await supabase
        .from("contest_registrations" as any)
        .delete()
        .eq("id", registrationId);

      if (error) {
        console.error("Error deleting contest registration:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate ALL related queries to ensure complete UI refresh
      // 1. Contest-related queries
      queryClient.invalidateQueries({ queryKey: ["contest-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["contest-registration"] });
      queryClient.invalidateQueries({ queryKey: ["user-contest-registrations"] });
      
      // 2. Approved contestants queries (critical for sidebar update)
      queryClient.invalidateQueries({ queryKey: ["approved-contestants"] });
      
      // 3. Event schedule and agenda queries
      queryClient.invalidateQueries({ queryKey: ["event-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["unified-agenda"] });
      
      // 4. Activity participation stats
      queryClient.invalidateQueries({ queryKey: ["activity-participation"] });
      
      // 5. All approved contestants across all activities
      queryClient.invalidateQueries({ queryKey: ["allApprovedContestants"] });
      
      toast.success("✅ Candidature supprimée avec succès");
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Erreur lors de la suppression";
      console.error("Delete registration error:", error);
      toast.error(`❌ ${errorMessage}`);
    },
  });
};
