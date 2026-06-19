import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AssociationRole } from "@/hooks/useAssociation";

// ──────────────────────────────────────────────
// Types enrichis V2
// ──────────────────────────────────────────────

export type EngagementLevel =
  | "membre"
  | "adherent"
  | "benevole_occasionnel"
  | "benevole_actif"
  | "staff"
  | "bureau";

export type BelongingStatus =
  | "invite"
  | "dossier_commence"
  | "a_valider"
  | "valide"
  | "refuse"
  | "archive";

export type VolunteerExperience =
  | "debutant"
  | "intermediaire"
  | "confirme"
  | "expert";

export interface MembershipV2 {
  id: string;
  association_id: string;
  user_id: string;
  role: AssociationRole;
  title: string | null;
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
  membership_status: string;
  engagement_level: EngagementLevel;
  belonging_status: BelongingStatus;
  interests: string[];
  participation_preferences: string[];
  availability: Record<string, boolean>;
  volunteer_experience: VolunteerExperience;
  languages: string[];
  consent_photo: boolean;
  skills: string[];
  mandate_start: string | null;
  mandate_end: string | null;
  public_visibility: boolean;
  display_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    city: string | null;
  };
}

// ──────────────────────────────────────────────
// Constantes métier
// ──────────────────────────────────────────────

export const ENGAGEMENT_COLORS: Record<EngagementLevel, string> = {
  membre: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  adherent: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  benevole_occasionnel: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  benevole_actif: "bg-green-500/20 text-green-300 border-green-500/30",
  staff: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  bureau: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

// Labels métier alignés sur le vocabulaire fonctionnel Manga Paradise
export const BELONGING_LABELS: Record<BelongingStatus, string> = {
  valide: "Adhésion active",
  a_valider: "En cours de traitement",
  dossier_commence: "En cours de traitement",
  invite: "En attente du bulletin d'adhésion",
  refuse: "Radié",
  archive: "Archivé·e",
};

export const BELONGING_COLORS: Record<BelongingStatus, string> = {
  invite: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  dossier_commence: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  a_valider: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  valide: "bg-green-500/20 text-green-300 border-green-500/30",
  refuse: "bg-red-500/20 text-red-300 border-red-500/30",
  archive: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

// ──────────────────────────────────────────────
// Labels statut d'adhésion (membership_status)
// ──────────────────────────────────────────────

export const MEMBERSHIP_STATUS_LABELS: Record<string, string> = {
  invited: "En attente",
  active: "Active",
  inactive: "Expirée",
  left: "Expirée",
  revoked: "Révoquée",
};

export const MEMBERSHIP_STATUS_COLORS: Record<string, string> = {
  invited: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  active: "bg-green-500/20 text-green-300 border-green-500/30",
  inactive: "bg-slate-500/20 text-mp-ink-muted border-slate-500/30",
  left: "bg-slate-500/20 text-mp-ink-muted border-slate-500/30",
  revoked: "bg-red-500/20 text-red-400 border-red-500/30",
};

// ──────────────────────────────────────────────
// Niveaux d'engagement — wizard (3 valeurs spec)
// ──────────────────────────────────────────────
// DB constraints: 'membre'|'adherent'|'benevole_occasionnel'|'benevole_actif'|'staff'|'bureau'
// Mapping wizard → DB :
//   "Membre actif" → adherent  (membre ayant cotisé, actif)
//   "Bénévole"     → benevole_actif
//   "Adhérent"     → membre    (adhésion simple, moins impliqué)

export const WIZARD_ENGAGEMENT_OPTIONS: { value: EngagementLevel; label: string }[] = [
  { value: "adherent",    label: "Membre actif" },
  { value: "benevole_actif", label: "Bénévole" },
  { value: "membre",      label: "Adhérent" },
];

// ENGAGEMENT_LABELS complets (pour les badges partout)
// Surcharge les anciens labels avec le vocabulaire métier
export const ENGAGEMENT_LABELS: Record<EngagementLevel, string> = {
  adherent:            "Membre actif",
  benevole_actif:      "Bénévole",
  membre:              "Adhérent",
  benevole_occasionnel:"Bénévole occasionnel",
  staff:               "Staff",
  bureau:              "Bureau",
};

export const INTERESTS_OPTIONS = [
  { value: "manga", label: "Manga", emoji: "📚" },
  { value: "anime", label: "Anime", emoji: "🎬" },
  { value: "cosplay", label: "Cosplay", emoji: "🎭" },
  { value: "kpop", label: "K-pop", emoji: "🎤" },
  { value: "jeux_video", label: "Jeux vidéo", emoji: "🎮" },
  { value: "tcg", label: "TCG / Cartes", emoji: "🃏" },
  { value: "jmusic", label: "J-Music", emoji: "🎵" },
  { value: "cuisine_japonaise", label: "Cuisine japonaise", emoji: "🍱" },
  { value: "culture_japonaise", label: "Culture japonaise", emoji: "⛩️" },
  { value: "figurines", label: "Figurines / Goodies", emoji: "🎎" },
  { value: "dessin", label: "Dessin / Fan-art", emoji: "🎨" },
  { value: "light_novel", label: "Light novel", emoji: "📖" },
];

export const PARTICIPATION_OPTIONS = [
  { value: "accueil", label: "Accueil visiteurs", emoji: "👋" },
  { value: "scene", label: "Animation scène", emoji: "🎤" },
  { value: "concours_cosplay", label: "Concours cosplay", emoji: "🏆" },
  { value: "logistique", label: "Logistique", emoji: "📦" },
  { value: "atelier", label: "Atelier / Workshop", emoji: "✂️" },
  { value: "animation_stand", label: "Animation stand", emoji: "🎪" },
  { value: "photo_video", label: "Photo / Vidéo", emoji: "📸" },
  { value: "reseaux_sociaux", label: "Réseaux sociaux", emoji: "📱" },
  { value: "securite", label: "Sécurité", emoji: "🛡️" },
  { value: "billetterie", label: "Billetterie", emoji: "🎫" },
  { value: "restauration", label: "Restauration", emoji: "🍜" },
  { value: "technique", label: "Technique / Son / Lumière", emoji: "🔧" },
];

export const AVAILABILITY_OPTIONS = [
  { value: "semaine", label: "En semaine" },
  { value: "weekend", label: "Week-end" },
  { value: "conventions", label: "Conventions" },
  { value: "soirees", label: "Soirées" },
  { value: "festivals", label: "Festivals" },
  { value: "vacances", label: "Vacances scolaires" },
];

export const EXPERIENCE_LABELS: Record<VolunteerExperience, string> = {
  debutant: "Débutant·e",
  intermediaire: "Intermédiaire",
  confirme: "Confirmé·e",
  expert: "Expert·e",
};

export const EXPERIENCE_COLORS: Record<VolunteerExperience, string> = {
  debutant: "bg-slate-500/20 text-slate-300",
  intermediaire: "bg-blue-500/20 text-blue-300",
  confirme: "bg-purple-500/20 text-purple-300",
  expert: "bg-amber-500/20 text-amber-300",
};

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

const MEMBER_SELECT = `
  *,
  profile:profiles(id, username, display_name, avatar_url, city)
`;

export function useAssociationMembersV2(associationId: string | undefined) {
  return useQuery({
    queryKey: ["association-members-v2", associationId],
    queryFn: async () => {
      if (!associationId) return [];
      const { data, error } = await supabase
        .from("association_memberships")
        .select(MEMBER_SELECT)
        .eq("association_id", associationId)
        .order("display_order", { ascending: true })
        .order("joined_at", { ascending: true });
      if (error) throw error;
      return data as MembershipV2[];
    },
    enabled: !!associationId,
  });
}

export function useAssociationVolunteers(associationId: string | undefined) {
  return useQuery({
    queryKey: ["association-volunteers", associationId],
    queryFn: async () => {
      if (!associationId) return [];
      const { data, error } = await supabase
        .from("association_memberships")
        .select(MEMBER_SELECT)
        .eq("association_id", associationId)
        .eq("is_active", true)
        .in("engagement_level", [
          "benevole_occasionnel",
          "benevole_actif",
          "staff",
        ])
        .order("volunteer_experience", { ascending: false })
        .order("joined_at", { ascending: true });
      if (error) throw error;
      return data as MembershipV2[];
    },
    enabled: !!associationId,
  });
}

export function useAssociationBureau(associationId: string | undefined) {
  return useQuery({
    queryKey: ["association-bureau", associationId],
    queryFn: async () => {
      if (!associationId) return [];
      const { data, error } = await supabase
        .from("association_memberships")
        .select(MEMBER_SELECT)
        .eq("association_id", associationId)
        .eq("is_active", true)
        .in("role", [
          "president",
          "vice_president",
          "tresorier",
          "secretaire",
          "responsable",
        ])
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as MembershipV2[];
    },
    enabled: !!associationId,
  });
}

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

export function useUpdateMemberEngagement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      membershipId,
      updates,
    }: {
      membershipId: string;
      updates: Partial<
        Pick<
          MembershipV2,
          | "engagement_level"
          | "belonging_status"
          | "interests"
          | "participation_preferences"
          | "availability"
          | "volunteer_experience"
          | "languages"
          | "consent_photo"
          | "skills"
          | "mandate_start"
          | "mandate_end"
          | "public_visibility"
          | "display_order"
        >
      >;
    }) => {
      const { error } = await supabase
        .from("association_memberships")
        .update(updates)
        .eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["association-members-v2"] });
      queryClient.invalidateQueries({ queryKey: ["association-members"] });
      queryClient.invalidateQueries({ queryKey: ["association-volunteers"] });
      queryClient.invalidateQueries({ queryKey: ["association-bureau"] });
      toast.success("Profil membre mis à jour !");
    },
    onError: (error: Error) => {
      console.error("Error updating member engagement:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });
}

export function usePromoteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      membershipId,
      newRole,
      engagementLevel,
    }: {
      membershipId: string;
      newRole: AssociationRole;
      engagementLevel: EngagementLevel;
    }) => {
      const { error } = await supabase
        .from("association_memberships")
        .update({ role: newRole, engagement_level: engagementLevel })
        .eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["association-members-v2"] });
      queryClient.invalidateQueries({ queryKey: ["association-members"] });
      queryClient.invalidateQueries({ queryKey: ["association-volunteers"] });
      queryClient.invalidateQueries({ queryKey: ["association-bureau"] });
      toast.success("Membre promu !");
    },
    onError: (error: Error) => {
      console.error("Error promoting member:", error);
      toast.error("Erreur lors de la promotion");
    },
  });
}

// Type de retour de useAddMemberDirect pour savoir si c'était un INSERT ou UPDATE
export type AddMemberResult = { action: "inserted" } | { action: "updated" };

export function useAddMemberDirect() {
  const queryClient = useQueryClient();

  return useMutation<
    AddMemberResult,
    Error,
    {
      associationId: string;
      userId: string;
      role: AssociationRole;
      engagementLevel: EngagementLevel;
      belongingStatus?: BelongingStatus;
      title?: string;
    }
  >({
    mutationFn: async ({
      associationId,
      userId,
      role,
      engagementLevel,
      belongingStatus = "valide",
      title,
    }) => {
      const isActive = belongingStatus === "valide";
      const membershipStatus = isActive ? "active" : "invited";

      const payload = {
        role,
        engagement_level: engagementLevel,
        belonging_status: belongingStatus,
        title: title || null,
        is_active: isActive,
        membership_status: membershipStatus,
      };

      // ── 1. Vérifier si la membership existe déjà ──
      const { data: existing, error: fetchError } = await supabase
        .from("association_memberships")
        .select("id")
        .eq("association_id", associationId)
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Erreur de vérification de l'appartenance : ${fetchError.message}`);
      }

      if (existing) {
        // ── Cas B/C : Membre déjà présent → UPDATE ──
        const { error: updateError } = await supabase
          .from("association_memberships")
          .update(payload)
          .eq("id", existing.id);

        if (updateError) {
          const code = (updateError as { code?: string }).code;
          const status = (updateError as { status?: number }).status;
          if (status === 403 || code === "42501") {
            throw new Error(
              "Droits insuffisants : vous devez être président·e, vice-président·e, secrétaire, trésorier·ère ou responsable pour modifier ce membre."
            );
          }
          throw new Error(`Impossible de mettre à jour le membre : ${updateError.message}`);
        }

        return { action: "updated" };
      }

      // ── Cas A : Nouveau membre → INSERT ──
      const { error: insertError } = await supabase
        .from("association_memberships")
        .insert({
          association_id: associationId,
          user_id: userId,
          ...payload,
        });

      if (insertError) {
        const code = (insertError as { code?: string }).code;
        const status = (insertError as { status?: number }).status;

        // 23505 = violation contrainte unique (duplicate key) : ne devrait plus arriver
        // mais on le gère en fallback avec un UPDATE
        if (code === "23505") {
          console.warn("[useAddMemberDirect] Duplicate key inattendu — tentative de récupération via UPDATE");
          const { error: fallbackError } = await supabase
            .from("association_memberships")
            .update(payload)
            .eq("association_id", associationId)
            .eq("user_id", userId);
          if (fallbackError) {
            throw new Error(`Impossible de mettre à jour la fiche existante : ${fallbackError.message}`);
          }
          return { action: "updated" };
        }

        if (status === 403 || code === "42501") {
          throw new Error(
            "Droits insuffisants : vous devez être président·e, vice-président·e, secrétaire, trésorier·ère ou responsable pour ajouter un membre."
          );
        }
        if (status === 404) {
          throw new Error(
            "Table introuvable : la migration Supabase n'a pas encore été appliquée. Contactez l'administrateur."
          );
        }
        throw new Error(`Impossible d'ajouter le membre : ${insertError.message}`);
      }

      return { action: "inserted" };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["association-members-v2"] });
      queryClient.invalidateQueries({ queryKey: ["association-members"] });
      queryClient.invalidateQueries({ queryKey: ["association-volunteers"] });
      queryClient.invalidateQueries({ queryKey: ["association-bureau"] });
      queryClient.invalidateQueries({ queryKey: ["association-membership"] });
      if (result.action === "updated") {
        toast.success("Fiche membre mise à jour !");
      } else {
        toast.success("Membre ajouté avec succès !");
      }
    },
    onError: (error: Error) => {
      console.error("[useAddMemberDirect] Erreur :", error.message);
      // Le wizard gère l'affichage inline de l'erreur
    },
  });
}

// ──────────────────────────────────────────────
// Mutation : mettre à jour les données associatives d'un membre
// (mode Éditer — ne touche pas au profil global)
// ──────────────────────────────────────────────

export function useUpdateMemberAssocData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      membershipId,
      role,
      engagementLevel,
      title,
      membershipStatus,
      belongingStatus,
      notes,
    }: {
      membershipId: string;
      role?: AssociationRole;
      engagementLevel?: EngagementLevel;
      title?: string | null;
      membershipStatus?: string;
      belongingStatus?: BelongingStatus;
      notes?: string | null;
    }) => {
      const updates: Record<string, unknown> = {};
      if (role !== undefined) updates.role = role;
      if (engagementLevel !== undefined) updates.engagement_level = engagementLevel;
      if (title !== undefined) updates.title = title;
      if (membershipStatus !== undefined) updates.membership_status = membershipStatus;
      if (belongingStatus !== undefined) updates.belonging_status = belongingStatus;
      if (notes !== undefined) updates.notes = notes;

      const { error } = await supabase
        .from("association_memberships")
        .update(updates)
        .eq("id", membershipId);

      if (error) {
        const status = (error as { status?: number }).status;
        const code = (error as { code?: string }).code;
        if (status === 403 || code === "42501") {
          throw new Error(
            "Droits insuffisants pour modifier ce membre."
          );
        }
        throw new Error(`Impossible de mettre à jour le membre : ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["association-members-v2"] });
      queryClient.invalidateQueries({ queryKey: ["association-members"] });
      queryClient.invalidateQueries({ queryKey: ["association-volunteers"] });
      queryClient.invalidateQueries({ queryKey: ["association-bureau"] });
      toast.success("Fiche membre mise à jour !");
    },
    onError: (error: Error) => {
      console.error("[useUpdateMemberAssocData] Erreur :", error.message);
    },
  });
}
