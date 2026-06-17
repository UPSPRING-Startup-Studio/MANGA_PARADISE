import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type ProPartnerAdminStatus = "active" | "restricted" | "blocked";

export type PartnerStatus =
  | "opportunite"
  | "mail_envoye"
  | "en_cours_edition"
  | "attente_signature"
  | "accord_principe"
  | "convention_signee";

export const PARTNER_STATUS_LABELS: Record<PartnerStatus, string> = {
  opportunite: "Opportunité",
  mail_envoye: "Mail envoyé",
  en_cours_edition: "En cours d'édition",
  attente_signature: "En attente de signature",
  accord_principe: "Accord de principe",
  convention_signee: "Convention signée",
};

export const PARTNER_STATUS_COLORS: Record<PartnerStatus, string> = {
  opportunite: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  mail_envoye: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  en_cours_edition: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  attente_signature: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  accord_principe: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  convention_signee: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

export type DirectoryCategory =
  | "acteurs_publics"
  | "boutiques_librairies"
  | "cinemas"
  | "restauration"
  | "partenaires_associatifs"
  | "artistes_createurs"
  | "evenements_lieux_culturels"
  | "entreprises_marques";

export const DIRECTORY_CATEGORY_LABELS: Record<DirectoryCategory, string> = {
  acteurs_publics: "Acteurs publics",
  boutiques_librairies: "Boutiques & librairies",
  cinemas: "Cinémas",
  restauration: "Restauration",
  partenaires_associatifs: "Partenaires associatifs",
  artistes_createurs: "Artistes & créateurs",
  evenements_lieux_culturels: "Événements & lieux culturels",
  entreprises_marques: "Entreprises & marques",
};

export interface ProPartner {
  id: string;
  name: string;
  slug: string;
  type: string;
  directory_category: DirectoryCategory | null;
  subcategories: string[];
  description: string | null;
  description_long: string | null;
  member_benefit: string | null;
  logo_url: string | null;
  banner_url: string | null;
  siret: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  region: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  social_links: Record<string, string> | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  partner_status: PartnerStatus;
  partner_offers: string | null;
  mp_offers: string | null;
  status: string;
  is_public: boolean;
  is_featured: boolean;
  admin_status: ProPartnerAdminStatus;
  admin_status_reason: string | null;
  admin_status_changed_at: string | null;
  admin_status_changed_by: string | null;
  admin_notes: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  deletion_reason: string | null;
  source_import: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export type ProPartnerRole = "owner" | "admin" | "manager" | "member";

export const PRO_PARTNER_ROLE_LABELS: Record<ProPartnerRole, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  manager: "Gestionnaire",
  member: "Membre",
};

export const ADMIN_ROLES: ProPartnerRole[] = ["owner", "admin"];
export const MANAGER_ROLES: ProPartnerRole[] = ["owner", "admin", "manager"];

export const PRO_PARTNER_TYPE_LABELS: Record<string, string> = {
  societe: "Société",
  association: "Association",
  auto_entrepreneur: "Auto-entrepreneur",
  institution: "Institution",
  collectivite: "Collectivité",
  boutique: "Boutique",
  lieu_culturel: "Lieu culturel",
  media: "Média",
  autre: "Autre",
};

export interface ProPartnerMembership {
  id: string;
  partner_id: string;
  user_id: string;
  role: ProPartnerRole;
  title: string | null;
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
  membership_status: string;
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
// Hook : récupérer un partenaire par slug
// ──────────────────────────────────────────────

export function useProPartnerBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["pro-partner", slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("pro_partners")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;

      const { count } = await supabase
        .from("pro_partner_members")
        .select("*", { count: "exact", head: true })
        .eq("partner_id", data.id)
        .eq("is_active", true);

      return { ...data, member_count: count || 0 } as ProPartner;
    },
    enabled: !!slug,
  });
}

// ──────────────────────────────────────────────
// Hook : récupérer un partenaire par ID
// ──────────────────────────────────────────────

export function useProPartnerById(id: string | undefined) {
  return useQuery({
    queryKey: ["pro-partner-by-id", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("pro_partners")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      const { count } = await supabase
        .from("pro_partner_members")
        .select("*", { count: "exact", head: true })
        .eq("partner_id", id)
        .eq("is_active", true);

      return { ...data, member_count: count || 0 } as ProPartner;
    },
    enabled: !!id,
  });
}

// ──────────────────────────────────────────────
// Hook : membership de l'utilisateur courant
// ──────────────────────────────────────────────

export function useMyProPartnerMembership(partnerId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pro-partner-membership", partnerId, user?.id],
    queryFn: async () => {
      if (!partnerId || !user) return null;

      const { data, error } = await supabase
        .from("pro_partner_members")
        .select("*")
        .eq("partner_id", partnerId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as ProPartnerMembership | null;
    },
    enabled: !!partnerId && !!user,
  });
}

// ──────────────────────────────────────────────
// Hook : le partenaire principal de l'utilisateur
// ──────────────────────────────────────────────

export function useMyProPartner() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-pro-partner", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: membership, error: membershipError } = await supabase
        .from("pro_partner_members")
        .select("partner_id, role")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (membershipError) throw membershipError;
      if (!membership) return null;

      const { data, error } = await supabase
        .from("pro_partners")
        .select("*")
        .eq("id", membership.partner_id)
        .single();

      if (error) throw error;

      return {
        partner: data as ProPartner,
        role: membership.role as ProPartnerRole,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// ──────────────────────────────────────────────
// Hook : vérifier si l'utilisateur est admin du partenaire
// ──────────────────────────────────────────────

export function useIsProPartnerAdmin(partnerId: string | undefined) {
  const { data: membership } = useMyProPartnerMembership(partnerId);

  return {
    isAdmin: membership ? ADMIN_ROLES.includes(membership.role) : false,
    isManager: membership ? MANAGER_ROLES.includes(membership.role) : false,
    membership,
  };
}

// ──────────────────────────────────────────────
// Hook : liste des membres d'un partenaire
// ──────────────────────────────────────────────

export function useProPartnerMembers(partnerId: string | undefined) {
  return useQuery({
    queryKey: ["pro-partner-members", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];

      const { data, error } = await supabase
        .from("pro_partner_members")
        .select(`
          *,
          profile:profiles(id, username, display_name, avatar_url)
        `)
        .eq("partner_id", partnerId)
        .eq("is_active", true)
        .order("role", { ascending: true })
        .order("joined_at", { ascending: true });

      if (error) throw error;
      return data as ProPartnerMembership[];
    },
    enabled: !!partnerId,
  });
}

// ──────────────────────────────────────────────
// Mutation : mettre à jour la fiche partenaire
// ──────────────────────────────────────────────

export function useUpdateProPartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<ProPartner, "id" | "created_at" | "updated_at" | "created_by" | "member_count">>;
    }) => {
      const { error } = await supabase
        .from("pro_partners")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["pro-partner-by-id", id] });
      queryClient.invalidateQueries({ queryKey: ["pro-partner"] });
      queryClient.invalidateQueries({ queryKey: ["my-pro-partner"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pro-partners"] });
      queryClient.invalidateQueries({ queryKey: ["public-pro-partners"] });
      toast.success("Fiche partenaire mise à jour !");
    },
    onError: (error: Error) => {
      console.error("Error updating pro partner:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : modifier le rôle d'un membre
// ──────────────────────────────────────────────

export function useUpdateProPartnerMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      membershipId,
      newRole,
    }: {
      membershipId: string;
      newRole: ProPartnerRole;
    }) => {
      const { error } = await supabase
        .from("pro_partner_members")
        .update({ role: newRole })
        .eq("id", membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pro-partner-members"] });
      queryClient.invalidateQueries({ queryKey: ["pro-partner-membership"] });
      toast.success("Rôle mis à jour !");
    },
    onError: (error: Error) => {
      console.error("Error updating member role:", error);
      toast.error("Erreur lors de la mise à jour du rôle");
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : désactiver un membre
// ──────────────────────────────────────────────

export function useDeactivateProPartnerMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from("pro_partner_members")
        .update({ is_active: false, left_at: new Date().toISOString() })
        .eq("id", membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pro-partner-members"] });
      queryClient.invalidateQueries({ queryKey: ["pro-partner-membership"] });
      toast.success("Membre retiré du partenaire");
    },
    onError: (error: Error) => {
      console.error("Error deactivating member:", error);
      toast.error("Erreur lors du retrait du membre");
    },
  });
}
