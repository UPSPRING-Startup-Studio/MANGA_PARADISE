import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Association, AssociationRole, AdminStatus } from "./useAssociation";

// ──────────────────────────────────────────────
// Helpers : invalidation communes
// ──────────────────────────────────────────────

function invalidateAssociationCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  associationId?: string
) {
  queryClient.invalidateQueries({ queryKey: ["admin-associations"] });
  queryClient.invalidateQueries({ queryKey: ["association"] });
  if (associationId) {
    queryClient.invalidateQueries({ queryKey: ["association-by-id", associationId] });
    queryClient.invalidateQueries({ queryKey: ["association-by-slug"] });
  }
}

// ──────────────────────────────────────────────
// Liste de toutes les associations (admin)
// ──────────────────────────────────────────────

export function useAdminAssociations() {
  return useQuery({
    queryKey: ["admin-associations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("associations")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const withCounts = await Promise.all(
        (data || []).map(async (assoc) => {
          const { count } = await supabase
            .from("association_memberships")
            .select("*", { count: "exact", head: true })
            .eq("association_id", assoc.id)
            .eq("is_active", true);
          return { ...assoc, member_count: count || 0 } as Association;
        })
      );

      return withCounts;
    },
  });
}

// ──────────────────────────────────────────────
// Liste des associations supprimées (admin)
// ──────────────────────────────────────────────

export function useAdminDeletedAssociations() {
  return useQuery({
    queryKey: ["admin-deleted-associations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("associations")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Association[];
    },
  });
}

// ──────────────────────────────────────────────
// Créer une association
// ──────────────────────────────────────────────

interface CreateAssociationData {
  name: string;
  slug: string;
  description?: string;
  city?: string;
  region?: string;
  email?: string;
  website_url?: string;
}

export function useCreateAssociation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateAssociationData) => {
      if (!user) throw new Error("Non connecté");

      const { data: created, error } = await supabase
        .from("associations")
        .insert({
          ...data,
          created_by: user.id,
          status: "active",
        } as any)
        .select()
        .single();

      if (error) throw error;
      return created as Association;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-associations"] });
      toast.success("Association créée !");
    },
    onError: (error: any) => {
      console.error("Error creating association:", error);
      if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
        toast.error("Ce slug est déjà utilisé. Choisis un autre identifiant.");
      } else {
        toast.error("Erreur lors de la création de l'association");
      }
    },
  });
}

// ──────────────────────────────────────────────
// Ajouter un membre à une association (admin)
// ──────────────────────────────────────────────

export function useAddAssociationMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      associationId,
      userId,
      role,
    }: {
      associationId: string;
      userId: string;
      role: AssociationRole;
    }) => {
      const { error } = await supabase
        .from("association_memberships")
        .insert({
          association_id: associationId,
          user_id: userId,
          role: role as any,
          is_active: true,
        });

      if (error) throw error;
    },
    onSuccess: (_, { associationId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-associations"] });
      queryClient.invalidateQueries({ queryKey: ["association-members", associationId] });
      queryClient.invalidateQueries({ queryKey: ["my-association"] });
      toast.success("Membre ajouté à l'association !");
    },
    onError: (error: any) => {
      console.error("Error adding member:", error);
      if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
        toast.error("Cet utilisateur est déjà membre de cette association");
      } else {
        toast.error("Erreur lors de l'ajout du membre");
      }
    },
  });
}

// ──────────────────────────────────────────────
// Rechercher un utilisateur par pseudo (admin)
// ──────────────────────────────────────────────

export function useSearchUsersAdmin(searchQuery: string) {
  return useQuery({
    queryKey: ["admin-search-users", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(
          `username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`
        )
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: searchQuery.length >= 2,
  });
}

// ──────────────────────────────────────────────
// Membres d'une association (admin view)
// ──────────────────────────────────────────────

export function useAdminAssociationMembers(associationId: string | undefined) {
  return useQuery({
    queryKey: ["admin-association-members", associationId],
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
        .order("role", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!associationId,
  });
}

// ──────────────────────────────────────────────
// Mise à jour d'une association (admin)
// ──────────────────────────────────────────────

interface UpdateAssociationAdminData {
  name?: string;
  slug?: string;
  description?: string;
  short_description?: string;
  city?: string;
  region?: string;
  email?: string;
  website_url?: string;
  logo_url?: string;
  banner_url?: string;
  status?: string;
  admin_notes?: string;
}

export function useUpdateAssociationAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAssociationAdminData;
    }) => {
      const { data: updatedRows, error } = await supabase
        .from("associations")
        .update(data)
        .eq("id", id)
        .select("id, name, slug, status, admin_status");

      if (error) throw error;
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error(
          "La modification n'a pas pu être enregistrée (0 lignes mises à jour). Vérifiez les permissions RLS."
        );
      }

      return updatedRows[0];
    },
    onSuccess: (_, { id }) => {
      invalidateAssociationCaches(queryClient, id);
      toast.success("Association mise à jour !");
    },
    onError: (error: any) => {
      console.error("Error updating association:", error);
      if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
        toast.error("Ce slug est déjà utilisé.");
      } else if (error.message?.includes("0 lignes")) {
        toast.error("Mise à jour refusée : permissions insuffisantes ou association introuvable.");
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    },
  });
}

// ──────────────────────────────────────────────
// Gouvernance : Changer le admin_status
// ──────────────────────────────────────────────

interface ChangeAdminStatusData {
  associationId: string;
  adminStatus: AdminStatus;
  reason?: string;
  adminNotes?: string;
}

const ADMIN_STATUS_LABELS: Record<AdminStatus, string> = {
  active: "activée",
  restricted: "restreinte",
  blocked: "bloquée",
};

export function useChangeAdminStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ associationId, adminStatus, reason, adminNotes }: ChangeAdminStatusData) => {
      if (!user) throw new Error("Non connecté");

      const payload: Record<string, unknown> = {
        admin_status: adminStatus,
        admin_status_reason: reason || null,
        admin_status_changed_at: new Date().toISOString(),
        admin_status_changed_by: user.id,
      };
      if (adminNotes !== undefined) {
        payload.admin_notes = adminNotes || null;
      }

      const { data: updatedRows, error } = await supabase
        .from("associations")
        .update(payload)
        .eq("id", associationId)
        .select("id, name, admin_status");

      if (error) throw error;
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error("Changement de statut refusé (0 lignes mises à jour).");
      }

      return updatedRows[0];
    },
    onSuccess: (data, { associationId, adminStatus }) => {
      invalidateAssociationCaches(queryClient, associationId);
      toast.success(`Association ${ADMIN_STATUS_LABELS[adminStatus]} avec succès.`);
    },
    onError: (error: any) => {
      console.error("Error changing admin status:", error);
      toast.error("Erreur lors du changement de statut administratif");
    },
  });
}

// ──────────────────────────────────────────────
// Soft-delete d'une association (admin)
// ──────────────────────────────────────────────

export function useSoftDeleteAssociation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string;
      reason: string;
    }) => {
      if (!user) throw new Error("Non connecté");

      const { data: updatedRows, error } = await supabase
        .from("associations")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          deletion_reason: reason,
          admin_status: "blocked",
          admin_status_reason: `Supprimée : ${reason}`,
          admin_status_changed_at: new Date().toISOString(),
          admin_status_changed_by: user.id,
        })
        .eq("id", id)
        .is("deleted_at", null)
        .select("id, name");

      if (error) throw error;
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error("Suppression refusée (association déjà supprimée ou permissions insuffisantes).");
      }

      return updatedRows[0];
    },
    onSuccess: () => {
      invalidateAssociationCaches(queryClient);
      toast.success("Association supprimée (soft-delete). Elle peut être restaurée par un administrateur.");
    },
    onError: (error: any) => {
      console.error("Error soft-deleting association:", error);
      toast.error("Erreur lors de la suppression de l'association");
    },
  });
}

// ──────────────────────────────────────────────
// Restaurer une association soft-deleted (admin)
// ──────────────────────────────────────────────

export function useRestoreAssociation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: updatedRows, error } = await supabase
        .from("associations")
        .update({
          deleted_at: null,
          deleted_by: null,
          deletion_reason: null,
          admin_status: "active",
          admin_status_reason: null,
        })
        .eq("id", id)
        .select("id, name");

      if (error) throw error;
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error("Restauration refusée.");
      }

      return updatedRows[0];
    },
    onSuccess: () => {
      invalidateAssociationCaches(queryClient);
      queryClient.invalidateQueries({ queryKey: ["admin-deleted-associations"] });
      toast.success("Association restaurée avec succès !");
    },
    onError: (error: any) => {
      console.error("Error restoring association:", error);
      toast.error("Erreur lors de la restauration");
    },
  });
}

// ──────────────────────────────────────────────
// Hard-delete (dernier recours absolu)
// ──────────────────────────────────────────────

export function useHardDeleteAssociation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("associations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAssociationCaches(queryClient);
      queryClient.invalidateQueries({ queryKey: ["admin-deleted-associations"] });
      toast.success("Association supprimée définitivement.");
    },
    onError: (error: any) => {
      console.error("Error hard-deleting association:", error);
      toast.error("Erreur lors de la suppression définitive");
    },
  });
}
