import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { AssociationRole } from "./useAssociation";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface AssociationInvitation {
  id: string;
  association_id: string;
  user_id: string;
  invited_by: string;
  role: AssociationRole;
  status: "pending" | "accepted" | "rejected" | "expired";
  message: string | null;
  responded_at: string | null;
  expires_at: string | null;
  created_at: string;
  association?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  inviter?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  invitee?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// ──────────────────────────────────────────────
// Mes invitations en attente
// ──────────────────────────────────────────────

export function useMyPendingAssociationInvitations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-association-invitations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("association_invitations")
        .select(`
          *,
          association:associations(id, name, logo_url),
          inviter:profiles!association_invitations_invited_by_fkey(id, username, display_name, avatar_url)
        `)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AssociationInvitation[];
    },
    enabled: !!user,
  });
}

// ──────────────────────────────────────────────
// Invitations en attente d'une association (pour les leaders)
// ──────────────────────────────────────────────

export function useAssociationPendingInvitations(associationId: string | undefined) {
  return useQuery({
    queryKey: ["association-pending-invitations", associationId],
    queryFn: async () => {
      if (!associationId) return [];

      const { data, error } = await supabase
        .from("association_invitations")
        .select(`
          *,
          invitee:profiles!association_invitations_user_id_fkey(id, username, display_name, avatar_url),
          inviter:profiles!association_invitations_invited_by_fkey(id, username, display_name, avatar_url)
        `)
        .eq("association_id", associationId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AssociationInvitation[];
    },
    enabled: !!associationId,
  });
}

// ──────────────────────────────────────────────
// Toutes les invitations d'une association (tous statuts)
// ──────────────────────────────────────────────

export function useAllAssociationInvitations(associationId: string | undefined) {
  return useQuery({
    queryKey: ["association-all-invitations", associationId],
    queryFn: async () => {
      if (!associationId) return [];

      const { data, error } = await supabase
        .from("association_invitations")
        .select(`
          *,
          invitee:profiles!association_invitations_user_id_fkey(id, username, display_name, avatar_url),
          inviter:profiles!association_invitations_invited_by_fkey(id, username, display_name, avatar_url)
        `)
        .eq("association_id", associationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AssociationInvitation[];
    },
    enabled: !!associationId,
  });
}

// ──────────────────────────────────────────────
// Envoyer une invitation
// ──────────────────────────────────────────────

export function useSendAssociationInvitation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      associationId,
      userId,
      role = "membre",
      message,
    }: {
      associationId: string;
      userId: string;
      role?: AssociationRole;
      message?: string;
    }) => {
      if (!user) throw new Error("Vous devez être connecté");

      const { error } = await supabase
        .from("association_invitations")
        .insert({
          association_id: associationId,
          user_id: userId,
          invited_by: user.id,
          role: role as any,
          status: "pending" as any,
          message: message || null,
        });

      if (error) throw error;
    },
    onSuccess: (_, { associationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["association-pending-invitations", associationId],
      });
      toast.success("Invitation envoyée !");
    },
    onError: (error: any) => {
      console.error("Error sending invitation:", error);
      if (error.message?.includes("duplicate")) {
        toast.error("Une invitation a déjà été envoyée à cet utilisateur");
      } else {
        toast.error("Erreur lors de l'envoi de l'invitation");
      }
    },
  });
}

// ──────────────────────────────────────────────
// Accepter une invitation
// ──────────────────────────────────────────────

export function useAcceptAssociationInvitation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      invitationId,
      associationId,
      role,
    }: {
      invitationId: string;
      associationId: string;
      role: AssociationRole;
    }) => {
      if (!user) throw new Error("Vous devez être connecté");

      // Mettre à jour le statut de l'invitation
      const { error: updateError } = await supabase
        .from("association_invitations")
        .update({
          status: "accepted" as any,
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitationId);

      if (updateError) throw updateError;

      // Créer le membership
      const { error: memberError } = await supabase
        .from("association_memberships")
        .insert({
          association_id: associationId,
          user_id: user.id,
          role: role as any,
        });

      if (memberError) throw memberError;
    },
    onSuccess: (_, { associationId }) => {
      queryClient.invalidateQueries({ queryKey: ["my-association-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["my-association"] });
      queryClient.invalidateQueries({ queryKey: ["association-members", associationId] });
      queryClient.invalidateQueries({ queryKey: ["association-membership", associationId] });
      queryClient.invalidateQueries({ queryKey: ["association-by-id", associationId] });
      toast.success("Vous avez rejoint l'association !");
    },
    onError: (error: Error) => {
      console.error("Error accepting invitation:", error);
      toast.error("Erreur lors de l'acceptation de l'invitation");
    },
  });
}

// ──────────────────────────────────────────────
// Refuser une invitation
// ──────────────────────────────────────────────

export function useRejectAssociationInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("association_invitations")
        .update({
          status: "rejected" as any,
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-association-invitations"] });
      toast.success("Invitation refusée");
    },
    onError: (error: Error) => {
      console.error("Error rejecting invitation:", error);
      toast.error("Erreur lors du refus de l'invitation");
    },
  });
}

// ──────────────────────────────────────────────
// Annuler une invitation (pour les leaders)
// ──────────────────────────────────────────────

export function useCancelAssociationInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invitationId,
      associationId,
    }: {
      invitationId: string;
      associationId: string;
    }) => {
      const { error } = await supabase
        .from("association_invitations")
        .update({
          status: "rejected" as any,
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: (_, { associationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["association-pending-invitations", associationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["association-all-invitations", associationId],
      });
      toast.success("Invitation annulée");
    },
    onError: (error: Error) => {
      console.error("Error canceling invitation:", error);
      toast.error("Erreur lors de l'annulation de l'invitation");
    },
  });
}

// ──────────────────────────────────────────────
// Renvoyer une invitation (reset pending + expires_at)
// TODO : brancher l'emailing transactionnel quand disponible
// ──────────────────────────────────────────────

export function useResendAssociationInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invitationId,
      associationId,
    }: {
      invitationId: string;
      associationId: string;
    }) => {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30);

      const { error } = await supabase
        .from("association_invitations")
        .update({
          status: "pending" as any,
          responded_at: null,
          expires_at: newExpiry.toISOString(),
        })
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: (_, { associationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["association-all-invitations", associationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["association-pending-invitations", associationId],
      });
      toast.success("Invitation renvoyée !");
    },
    onError: (error: Error) => {
      console.error("Error resending invitation:", error);
      toast.error("Erreur lors du renvoi de l'invitation");
    },
  });
}

// ──────────────────────────────────────────────
// Inviter par email (utilisateur existant ou non)
// ──────────────────────────────────────────────

export function useInviteByEmail() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      associationId,
      email,
      role = "membre" as AssociationRole,
      prenom,
      nom,
      message,
    }: {
      associationId: string;
      email: string;
      role?: AssociationRole;
      prenom?: string;
      nom?: string;
      message?: string;
    }) => {
      if (!user) throw new Error("Non connecté");

      // Récupérer le JWT pour authentifier l'appel serveur
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) throw new Error("Session expirée, reconnecte-toi");

      // Appel à l'endpoint serveur sécurisé
      const response = await fetch("/api/admin/invite-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          email,
          prenom,
          nom,
          associationId,
          associationRole: role,
          noteInterne: message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur serveur");
      }

      return result as {
        success: boolean;
        invitationId: string;
        existingProfile: boolean;
        message: string;
        warning?: string;
      };
    },
    onSuccess: (result, { associationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["association-pending-invitations", associationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["association-all-invitations", associationId],
      });
      toast.success(result.message);
      if (result.warning) {
        toast.warning(result.warning, { duration: 6000 });
      }
    },
    onError: (error: any) => {
      const msg = error?.message || "Erreur lors de l'envoi de l'invitation";
      toast.error(msg);
    },
  });
}

// ──────────────────────────────────────────────
// Recherche d'utilisateurs pour invitation
// ──────────────────────────────────────────────

export function useSearchUsersForAssociationInvite(
  associationId: string,
  searchQuery: string
) {
  return useQuery({
    queryKey: ["search-users-for-assoc-invite", associationId, searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      // Exclure les membres existants
      const { data: members } = await supabase
        .from("association_memberships")
        .select("user_id")
        .eq("association_id", associationId)
        .eq("is_active", true);

      const memberIds = members?.map((m) => m.user_id) || [];

      // Exclure les invitations en attente
      const { data: invitations } = await supabase
        .from("association_invitations")
        .select("user_id")
        .eq("association_id", associationId)
        .eq("status", "pending");

      const invitedIds = invitations?.map((i) => i.user_id) || [];
      const excludeIds = [...memberIds, ...invitedIds];

      let query = supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(
          `username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`
        )
        .limit(10);

      if (excludeIds.length > 0) {
        query = query.not("id", "in", `(${excludeIds.join(",")})`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
    enabled: searchQuery.length >= 2,
  });
}
