import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type AdminStatus = "active" | "restricted" | "blocked";

export interface Association {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  siret: string | null;
  rna_number: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  region: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  social_links: Record<string, string> | null;
  status: string;
  admin_status: AdminStatus;
  admin_status_reason: string | null;
  admin_status_changed_at: string | null;
  admin_status_changed_by: string | null;
  admin_notes: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  deletion_reason: string | null;
  founded_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export type AssociationRole =
  | "president"
  | "vice_president"
  | "tresorier"
  | "secretaire"
  | "responsable"
  | "benevole"
  | "membre";

export const ASSOCIATION_ROLE_LABELS: Record<AssociationRole, string> = {
  president: "Président·e",
  vice_president: "Vice-Président·e",
  tresorier: "Trésorier·ère",
  secretaire: "Secrétaire",
  responsable: "Responsable",
  benevole: "Bénévole",
  membre: "Membre",
};

export const LEADER_ROLES: AssociationRole[] = [
  "president",
  "vice_president",
  "secretaire",
  "tresorier",
  "responsable",
];

export interface AssociationMembership {
  id: string;
  association_id: string;
  user_id: string;
  role: AssociationRole;
  title: string | null;
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// ──────────────────────────────────────────────
// Hook : récupérer une association par slug
// ──────────────────────────────────────────────

export function useAssociationBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["association", slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("associations")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;

      // Nombre de membres actifs
      const { count } = await supabase
        .from("association_memberships")
        .select("*", { count: "exact", head: true })
        .eq("association_id", data.id)
        .eq("is_active", true);

      return { ...data, member_count: count || 0 } as Association;
    },
    enabled: !!slug,
  });
}

// ──────────────────────────────────────────────
// Hook : récupérer une association par ID
// ──────────────────────────────────────────────

export function useAssociationById(id: string | undefined) {
  return useQuery({
    queryKey: ["association-by-id", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("associations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      const { count } = await supabase
        .from("association_memberships")
        .select("*", { count: "exact", head: true })
        .eq("association_id", id)
        .eq("is_active", true);

      return { ...data, member_count: count || 0 } as Association;
    },
    enabled: !!id,
  });
}

// ──────────────────────────────────────────────
// Hook : membership de l'utilisateur courant
// ──────────────────────────────────────────────

export function useMyAssociationMembership(associationId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["association-membership", associationId, user?.id],
    queryFn: async () => {
      if (!associationId || !user) return null;

      const { data, error } = await supabase
        .from("association_memberships")
        .select("*")
        .eq("association_id", associationId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as AssociationMembership | null;
    },
    enabled: !!associationId && !!user,
  });
}

// ──────────────────────────────────────────────
// Hook : vérifier si l'utilisateur est leader
// ──────────────────────────────────────────────

export function useIsAssociationLeader(associationId: string | undefined) {
  const { data: membership } = useMyAssociationMembership(associationId);

  return {
    isLeader: membership
      ? LEADER_ROLES.includes(membership.role)
      : false,
    membership,
  };
}

// ──────────────────────────────────────────────
// Hook : liste des membres d'une association
// ──────────────────────────────────────────────

export function useAssociationMembers(associationId: string | undefined) {
  return useQuery({
    queryKey: ["association-members", associationId],
    queryFn: async () => {
      if (!associationId) return [];

      const { data, error } = await supabase
        .from("association_memberships")
        .select(`
          *,
          profile:profiles(id, username, display_name, avatar_url)
        `)
        .eq("association_id", associationId)
        .eq("is_active", true)
        .order("role", { ascending: true })
        .order("joined_at", { ascending: true });

      if (error) throw error;
      return data as AssociationMembership[];
    },
    enabled: !!associationId,
  });
}

// ──────────────────────────────────────────────
// Hook : l'association principale de l'utilisateur (V1)
// ──────────────────────────────────────────────

export function useMyAssociation() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-association", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Cherche le membership actif de l'utilisateur
      const { data: membership, error: membershipError } = await supabase
        .from("association_memberships")
        .select("association_id, role")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (membershipError) throw membershipError;
      if (!membership) return null;

      // Récupère l'association
      const { data, error } = await supabase
        .from("associations")
        .select("*")
        .eq("id", membership.association_id)
        .single();

      if (error) throw error;

      return {
        association: data as Association,
        role: membership.role as AssociationRole,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// ──────────────────────────────────────────────
// Mutation : mettre à jour la fiche association
// ──────────────────────────────────────────────

export function useUpdateAssociation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Association, "id" | "created_at" | "updated_at" | "created_by" | "member_count">>;
    }) => {
      const { error } = await supabase
        .from("associations")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["association-by-id", id] });
      queryClient.invalidateQueries({ queryKey: ["association"] });
      queryClient.invalidateQueries({ queryKey: ["my-association"] });
      toast.success("Association mise à jour !");
    },
    onError: (error: Error) => {
      console.error("Error updating association:", error);
      toast.error("Erreur lors de la mise à jour de l'association");
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : modifier le rôle d'un membre
// ──────────────────────────────────────────────

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      membershipId,
      newRole,
    }: {
      membershipId: string;
      newRole: AssociationRole;
    }) => {
      const { error } = await supabase
        .from("association_memberships")
        .update({ role: newRole })
        .eq("id", membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["association-members"] });
      queryClient.invalidateQueries({ queryKey: ["association-membership"] });
      toast.success("Rôle mis à jour !");
    },
    onError: (error: Error) => {
      console.error("Error updating member role:", error);
      toast.error("Erreur lors de la mise à jour du rôle");
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : désactiver un membre (retrait)
// ──────────────────────────────────────────────

export function useDeactivateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from("association_memberships")
        .update({ is_active: false, left_at: new Date().toISOString() })
        .eq("id", membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["association-members"] });
      queryClient.invalidateQueries({ queryKey: ["association-membership"] });
      queryClient.invalidateQueries({ queryKey: ["association-by-id"] });
      toast.success("Membre retiré de l'association");
    },
    onError: (error: Error) => {
      console.error("Error deactivating member:", error);
      toast.error("Erreur lors du retrait du membre");
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : suspendre un membre
// ──────────────────────────────────────────────

export function useSuspendMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from("association_memberships")
        .update({ is_active: false })
        .eq("id", membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["association-members"] });
      toast.success("Membre suspendu");
    },
    onError: (error: Error) => {
      console.error("Error suspending member:", error);
      toast.error("Erreur lors de la suspension");
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : réactiver un membre suspendu
// ──────────────────────────────────────────────

export function useReactivateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from("association_memberships")
        .update({ is_active: true, left_at: null })
        .eq("id", membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["association-members"] });
      queryClient.invalidateQueries({ queryKey: ["association-membership"] });
      toast.success("Membre réactivé !");
    },
    onError: (error: Error) => {
      console.error("Error reactivating member:", error);
      toast.error("Erreur lors de la réactivation");
    },
  });
}
