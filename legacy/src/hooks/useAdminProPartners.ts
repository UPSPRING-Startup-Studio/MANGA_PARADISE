import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { ProPartner, ProPartnerMembership, ProPartnerRole, ProPartnerAdminStatus } from "./useProPartner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface ProPartnerApplication {
  id: string;
  company_name: string;
  company_type: string;
  siret: string | null;
  description: string | null;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_phone: string | null;
  website_url: string | null;
  social_links: Record<string, string> | null;
  message: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  partner_id: string | null;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────
// Hook : liste de tous les partenaires (admin)
// ──────────────────────────────────────────────

export function useAdminProPartners() {
  return useQuery({
    queryKey: ["admin-pro-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pro_partners")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrichir avec le nombre de membres
      const partners = data || [];
      const enriched = await Promise.all(
        partners.map(async (p) => {
          const { count } = await supabase
            .from("pro_partner_members")
            .select("*", { count: "exact", head: true })
            .eq("partner_id", p.id)
            .eq("is_active", true);

          // Compter les événements
          const { count: eventCount } = await supabase
            .from("events")
            .select("*", { count: "exact", head: true })
            .eq("organizer_type", "pro_partner")
            .eq("organizer_id", p.id);

          return {
            ...p,
            member_count: count || 0,
            event_count: eventCount || 0,
          } as ProPartner & { event_count: number };
        })
      );

      return enriched;
    },
  });
}

// ──────────────────────────────────────────────
// Hook : membres d'un partenaire (admin)
// ──────────────────────────────────────────────

export function useAdminProPartnerMembers(partnerId: string | undefined) {
  return useQuery({
    queryKey: ["admin-pro-partner-members", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];

      const { data, error } = await supabase
        .from("pro_partner_members")
        .select(`
          *,
          profile:profiles(id, username, display_name, avatar_url)
        `)
        .eq("partner_id", partnerId)
        .order("role", { ascending: true });

      if (error) throw error;
      return data as ProPartnerMembership[];
    },
    enabled: !!partnerId,
  });
}

// ──────────────────────────────────────────────
// Hook : toutes les demandes partenaires (admin)
// ──────────────────────────────────────────────

export function useProPartnerApplications(statusFilter?: string) {
  return useQuery({
    queryKey: ["pro-partner-applications", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("pro_partner_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ProPartnerApplication[];
    },
  });
}

// ──────────────────────────────────────────────
// Hook : nombre de demandes en attente
// ──────────────────────────────────────────────

export function usePendingApplicationsCount() {
  return useQuery({
    queryKey: ["pro-partner-applications-pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("pro_partner_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
    staleTime: 30 * 1000,
  });
}

// ──────────────────────────────────────────────
// Mutation : créer un partenaire (admin)
// ──────────────────────────────────────────────

export function useCreateProPartner() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      slug: string;
      type?: string;
      directory_category?: string | null;
      subcategories?: string[];
      description?: string;
      city?: string;
      region?: string;
      address?: string;
      postal_code?: string;
      email?: string;
      phone?: string;
      website_url?: string;
      siret?: string;
      member_benefit?: string;
      is_public?: boolean;
    }) => {
      const { data: result, error } = await supabase
        .from("pro_partners")
        .insert({
          ...data,
          status: "active",
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result as ProPartner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pro-partners"] });
      toast.success("Partenaire créé !");
    },
    onError: (error: Error) => {
      console.error("Error creating partner:", error);
      toast.error("Erreur lors de la création du partenaire");
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : ajouter un membre à un partenaire
// ──────────────────────────────────────────────

export function useAddProPartnerMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      partnerId,
      userId,
      role,
    }: {
      partnerId: string;
      userId: string;
      role: ProPartnerRole;
    }) => {
      const { error } = await supabase
        .from("pro_partner_members")
        .insert({
          partner_id: partnerId,
          user_id: userId,
          role,
          is_active: true,
          membership_status: "active",
        });

      if (error) throw error;
    },
    onSuccess: (_, { partnerId }) => {
      queryClient.invalidateQueries({ queryKey: ["pro-partner-members", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["admin-pro-partner-members", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["admin-pro-partners"] });
      toast.success("Membre ajouté !");
    },
    onError: (error: Error) => {
      console.error("Error adding member:", error);
      toast.error("Erreur lors de l'ajout du membre");
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : approuver une demande partenaire
// ──────────────────────────────────────────────

export function useApproveApplication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      // 1. Récupérer la demande
      const { data: app, error: appError } = await supabase
        .from("pro_partner_applications")
        .select("*")
        .eq("id", applicationId)
        .single();

      if (appError) throw appError;

      // 2. Créer le slug
      const slug = app.company_name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // 3. Créer le partenaire
      const { data: partner, error: partnerError } = await supabase
        .from("pro_partners")
        .insert({
          name: app.company_name,
          slug: slug + "-" + Date.now().toString(36),
          type: app.company_type,
          description: app.description,
          siret: app.siret,
          email: app.contact_email,
          phone: app.contact_phone,
          website_url: app.website_url,
          social_links: app.social_links,
          status: "active",
          is_public: false,
          created_by: user?.id,
        })
        .select()
        .single();

      if (partnerError) throw partnerError;

      // 4. Si le soumetteur est un utilisateur, le rattacher comme owner
      if (app.submitted_by) {
        await supabase
          .from("pro_partner_members")
          .insert({
            partner_id: partner.id,
            user_id: app.submitted_by,
            role: "owner",
            is_active: true,
            membership_status: "active",
          });
      }

      // 5. Mettre à jour la demande
      const { error: updateError } = await supabase
        .from("pro_partner_applications")
        .update({
          status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          partner_id: partner.id,
        })
        .eq("id", applicationId);

      if (updateError) throw updateError;

      return partner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pro-partner-applications"] });
      queryClient.invalidateQueries({ queryKey: ["pro-partner-applications-pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pro-partners"] });
      toast.success("Demande approuvée ! Partenaire créé.");
    },
    onError: (error: Error) => {
      console.error("Error approving application:", error);
      toast.error("Erreur lors de l'approbation");
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : refuser une demande partenaire
// ──────────────────────────────────────────────

export function useRejectApplication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      applicationId,
      reason,
    }: {
      applicationId: string;
      reason?: string;
    }) => {
      const { error } = await supabase
        .from("pro_partner_applications")
        .update({
          status: "rejected",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pro-partner-applications"] });
      queryClient.invalidateQueries({ queryKey: ["pro-partner-applications-pending-count"] });
      toast.success("Demande refusée.");
    },
    onError: (error: Error) => {
      console.error("Error rejecting application:", error);
      toast.error("Erreur lors du refus");
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : suspendre / réactiver un partenaire
// ──────────────────────────────────────────────

export function useSuspendProPartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await supabase
        .from("pro_partners")
        .update({ status: "suspended" })
        .eq("id", partnerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pro-partners"] });
      toast.success("Partenaire suspendu");
    },
    onError: (error: Error) => {
      console.error("Error suspending partner:", error);
      toast.error("Erreur lors de la suspension");
    },
  });
}

export function useReactivateProPartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await supabase
        .from("pro_partners")
        .update({ status: "active" })
        .eq("id", partnerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pro-partners"] });
      toast.success("Partenaire réactivé !");
    },
    onError: (error: Error) => {
      console.error("Error reactivating partner:", error);
      toast.error("Erreur lors de la réactivation");
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : soumettre une demande partenaire (public)
// ──────────────────────────────────────────────

export function useSubmitPartnerApplication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      company_name: string;
      company_type: string;
      siret?: string;
      description?: string;
      contact_first_name: string;
      contact_last_name: string;
      contact_email: string;
      contact_phone?: string;
      website_url?: string;
      social_links?: Record<string, string>;
      message?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("pro_partner_applications")
        .insert({
          ...data,
          submitted_by: user?.id || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pro-partner-applications"] });
      toast.success("Demande envoyée ! Nous reviendrons vers vous rapidement.");
    },
    onError: (error: Error) => {
      console.error("Error submitting application:", error);
      toast.error("Erreur lors de l'envoi de la demande");
    },
  });
}

// ──────────────────────────────────────────────
// Hook : recherche d'utilisateurs (admin)
// ──────────────────────────────────────────────

export function useSearchUsersForPartner(query: string) {
  return useQuery({
    queryKey: ["search-users-partner", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: query.length >= 2,
  });
}

// ──────────────────────────────────────────────
// Hook : partenaires soft-deleted (admin)
// ──────────────────────────────────────────────

export function useAdminDeletedProPartners() {
  return useQuery({
    queryKey: ["admin-pro-partners-deleted"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pro_partners")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ProPartner[];
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : soft-delete un partenaire
// ──────────────────────────────────────────────

export function useSoftDeleteProPartner() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      partnerId,
      reason,
    }: {
      partnerId: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from("pro_partners")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id || null,
          deletion_reason: reason || null,
          admin_status: "blocked",
          admin_status_reason: "Supprimé par un administrateur",
          admin_status_changed_at: new Date().toISOString(),
          admin_status_changed_by: user?.id || null,
        })
        .eq("id", partnerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pro-partners"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pro-partners-deleted"] });
      toast.success("Partenaire supprimé (soft-delete)");
    },
    onError: (error: Error) => {
      console.error("Error soft-deleting partner:", error);
      toast.error("Erreur lors de la suppression du partenaire");
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : restaurer un partenaire soft-deleted
// ──────────────────────────────────────────────

export function useRestoreProPartner() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (partnerId: string) => {
      const { data, error } = await supabase
        .from("pro_partners")
        .update({
          deleted_at: null,
          deleted_by: null,
          deletion_reason: null,
          admin_status: "active",
          admin_status_reason: null,
          admin_status_changed_at: new Date().toISOString(),
          admin_status_changed_by: user?.id || null,
        })
        .eq("id", partnerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pro-partners"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pro-partners-deleted"] });
      toast.success("Partenaire restauré !");
    },
    onError: (error: Error) => {
      console.error("Error restoring partner:", error);
      toast.error("Erreur lors de la restauration du partenaire");
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : changer le admin_status d'un partenaire
// ──────────────────────────────────────────────

export function useChangeProPartnerAdminStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      partnerId,
      adminStatus,
      reason,
    }: {
      partnerId: string;
      adminStatus: ProPartnerAdminStatus;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from("pro_partners")
        .update({
          admin_status: adminStatus,
          admin_status_reason: reason || null,
          admin_status_changed_at: new Date().toISOString(),
          admin_status_changed_by: user?.id || null,
        })
        .eq("id", partnerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { adminStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-pro-partners"] });
      queryClient.invalidateQueries({ queryKey: ["pro-partner"] });
      queryClient.invalidateQueries({ queryKey: ["pro-partner-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["my-pro-partner"] });
      const label =
        adminStatus === "blocked"
          ? "Partenaire bloqué"
          : adminStatus === "restricted"
            ? "Partenaire restreint"
            : "Partenaire réactivé";
      toast.success(label);
    },
    onError: (error: Error) => {
      console.error("Error changing admin status:", error);
      toast.error("Erreur lors du changement de statut administratif");
    },
  });
}
