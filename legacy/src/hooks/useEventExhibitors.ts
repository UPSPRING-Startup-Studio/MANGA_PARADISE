import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ExhibitorStatus, 
  ExhibitorWithProfile, 
  isExhibitorEligible,
  EXHIBITOR_ELIGIBLE_ROLES 
} from "@/types/exhibitor";

export interface EventExhibitor {
  id: string;
  event_id: string;
  user_id: string;
  stand_name: string;
  stand_description: string | null;
  requirements: string | null; // Besoins techniques (visible admin uniquement)
  status: ExhibitorStatus;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    role_function: string | null;
  };
}

// Fetch approved exhibitors for an event (public view)
export const useApprovedExhibitors = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["event-exhibitors", "approved", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from("event_exhibitors")
        .select(`
          *,
          profile:user_id(id, username, display_name, avatar_url)
        `)
        .eq("event_id", eventId)
        .eq("status", "approved")
        .order("stand_name");
      
      if (error) throw error;
      return data as EventExhibitor[];
    },
    enabled: !!eventId,
  });
};

// Fetch all exhibitors for admin management
export const useAllExhibitors = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["event-exhibitors", "all", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from("event_exhibitors")
        .select(`
          *,
          profile:user_id(id, username, display_name, avatar_url)
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as EventExhibitor[];
    },
    enabled: !!eventId,
  });
};

// Fetch user's exhibitor requests
export const useMyExhibitorRequests = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["my-exhibitor-requests", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      try {
        const { data, error } = await supabase
          .from("event_exhibitors")
          .select(`
            *,
            event:event_id(id, title, date, image_url)
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        
        if (error) {
          // Log but don't throw - table might not exist or RLS might block
          console.warn("⚠️ event_exhibitors table not accessible:", error.message);
          return [];
        }
        return data;
      } catch (err) {
        console.warn("⚠️ Failed to fetch exhibitor requests, returning empty:", err);
        return [];
      }
    },
    enabled: !!userId,
  });
};

// Check if user already has an exhibitor request for an event
export const useExhibitorRequest = (eventId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ["exhibitor-request", eventId, userId],
    queryFn: async () => {
      if (!eventId || !userId) return null;
      
      const { data, error } = await supabase
        .from("event_exhibitors")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as EventExhibitor | null;
    },
    enabled: !!eventId && !!userId,
  });
};

// Submit exhibitor request
export const useSubmitExhibitorRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      eventId,
      userId,
      standName,
      standDescription,
      requirements,
    }: {
      eventId: string;
      userId: string;
      standName: string;
      standDescription?: string;
      requirements?: string;
    }) => {
      const { data, error } = await supabase
        .from("event_exhibitors")
        .insert({
          event_id: eventId,
          user_id: userId,
          stand_name: standName,
          stand_description: standDescription || null,
          requirements: requirements || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exhibitor-request", variables.eventId, variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["my-exhibitor-requests", variables.userId] });
      toast.success("Ta demande de stand a été envoyée !");
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi de la demande");
    },
  });
};

// Cancel exhibitor request (user)
export const useCancelExhibitorRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ requestId, eventId, userId }: { requestId: string; eventId: string; userId: string }) => {
      const { error } = await supabase
        .from("event_exhibitors")
        .delete()
        .eq("id", requestId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exhibitor-request", variables.eventId, variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["my-exhibitor-requests", variables.userId] });
      toast.success("Demande annulée");
    },
    onError: () => {
      toast.error("Erreur lors de l'annulation");
    },
  });
};

// Update exhibitor status (admin)
export const useUpdateExhibitorStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      requestId,
      status,
    }: {
      requestId: string;
      status: "approved" | "rejected";
    }) => {
      const { error } = await supabase
        .from("event_exhibitors")
        .update({ status })
        .eq("id", requestId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-exhibitors"] });
      toast.success(variables.status === "approved" ? "Exposant approuvé !" : "Demande refusée");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });
};

// Add exhibitor manually (admin)
export const useAddExhibitorManually = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      eventId,
      userId,
      standName,
      standDescription,
      requirements,
    }: {
      eventId: string;
      userId: string;
      standName: string;
      standDescription?: string;
      requirements?: string;
    }) => {
      const { data, error } = await supabase
        .from("event_exhibitors")
        .insert({
          event_id: eventId,
          user_id: userId,
          stand_name: standName,
          stand_description: standDescription || null,
          requirements: requirements || null,
          status: "approved",
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-exhibitors", "all", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-exhibitors", "approved", variables.eventId] });
      toast.success("Exposant ajouté !");
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout");
    },
  });
};

// =====================================================
// NOUVEAUX HOOKS POUR L'ÉLIGIBILITÉ
// =====================================================

/**
 * Vérifie si l'utilisateur actuel est éligible pour demander un stand
 * (rôles: creator, pro, admin)
 */
export const useExhibitorEligibility = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["exhibitor-eligibility", userId],
    queryFn: async () => {
      if (!userId) return { isEligible: false, role: null };
      
      const { data, error } = await supabase
        .from("profiles")
        .select("role_function")
        .eq("id", userId)
        .single();
      
      if (error) throw error;
      
      const role = data?.role_function;
      const isEligible = isExhibitorEligible(role);
      
      return { isEligible, role };
    },
    enabled: !!userId,
  });
};

/**
 * Hook pour récupérer tous les exposants en attente (admin dashboard global)
 * À travers tous les événements
 */
export const useAllPendingExhibitors = () => {
  return useQuery({
    queryKey: ["all-pending-exhibitors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_exhibitors")
        .select(`
          *,
          profile:user_id(id, username, display_name, avatar_url, role_function),
          event:event_id(id, title, date, city)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as (EventExhibitor & { event: { id: string; title: string; date: string; city: string | null } | null })[];
    },
  });
};

/**
 * Hook pour les statistiques des exposants d'un événement
 */
export const useExhibitorStats = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["exhibitor-stats", eventId],
    queryFn: async () => {
      if (!eventId) return { total: 0, pending: 0, approved: 0, rejected: 0 };
      
      const { data, error } = await supabase
        .from("event_exhibitors")
        .select("status")
        .eq("event_id", eventId);
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        pending: data.filter(e => e.status === "pending").length,
        approved: data.filter(e => e.status === "approved").length,
        rejected: data.filter(e => e.status === "rejected").length,
      };
      
      return stats;
    },
    enabled: !!eventId,
  });
};
