import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type SectionVisibility = "visible" | "internal" | "hidden";

export interface SectionsVisibility {
  president_message: SectionVisibility;
  mission: SectionVisibility;
  vision: SectionVisibility;
  values: SectionVisibility;
  team_bureau: SectionVisibility;
  team_staff: SectionVisibility;
  documents: SectionVisibility;
  charter: SectionVisibility;
  quick_actions: SectionVisibility;
  faq: SectionVisibility;
}

export interface CharterRule {
  emoji: string;
  title: string;
  description: string;
}

export interface AssociationFicheConfig {
  id: string;
  association_id: string;
  president_message: string | null;
  president_name: string | null;
  president_title: string | null;
  president_photo: string | null;
  mission: string | null;
  vision: string | null;
  values: string | null;
  charter_rules: CharterRule[];
  sections_visibility: SectionsVisibility;
  team_visible_roles: string[];
  featured_document_ids: string[];
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_SECTIONS_VISIBILITY: SectionsVisibility = {
  president_message: "visible",
  mission: "visible",
  vision: "visible",
  values: "visible",
  team_bureau: "visible",
  team_staff: "visible",
  documents: "internal",
  charter: "visible",
  quick_actions: "internal",
  faq: "hidden",
};

export const SECTION_LABELS: Record<keyof SectionsVisibility, string> = {
  president_message: "Mot du/de la Président·e",
  mission: "Notre Mission",
  vision: "Notre Vision",
  values: "Nos Valeurs",
  team_bureau: "Équipe — Bureau",
  team_staff: "Équipe — Staff",
  documents: "Ressources & Documents",
  charter: "Charte des Membres",
  quick_actions: "Actions Rapides",
  faq: "Foire aux Questions",
};

export const VISIBILITY_LABELS: Record<SectionVisibility, string> = {
  visible: "Visible par tous",
  internal: "Membres uniquement",
  hidden: "Masqué",
};

// ──────────────────────────────────────────────
// Hook : récupérer la config fiche d'une association
// ──────────────────────────────────────────────

export function useAssociationFicheConfig(associationId: string | undefined) {
  return useQuery({
    queryKey: ["association-fiche-config", associationId],
    queryFn: async () => {
      if (!associationId) return null;

      const { data, error } = await supabase
        .from("association_fiche_config" as any)
        .select("*")
        .eq("association_id", associationId)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      // Parse & normalize
      return {
        ...data,
        charter_rules: Array.isArray(data.charter_rules) ? data.charter_rules : [],
        sections_visibility: {
          ...DEFAULT_SECTIONS_VISIBILITY,
          ...(typeof data.sections_visibility === "object" && data.sections_visibility !== null
            ? data.sections_visibility
            : {}),
        },
        team_visible_roles: Array.isArray(data.team_visible_roles)
          ? data.team_visible_roles
          : ["president", "vice_president", "tresorier", "secretaire", "responsable"],
        featured_document_ids: Array.isArray(data.featured_document_ids)
          ? data.featured_document_ids
          : [],
      } as AssociationFicheConfig;
    },
    enabled: !!associationId,
    staleTime: 2 * 60 * 1000,
  });
}

// ──────────────────────────────────────────────
// Mutation : mettre à jour la config fiche
// ──────────────────────────────────────────────

export function useUpdateFicheConfig() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      associationId,
      data,
    }: {
      associationId: string;
      data: Partial<
        Omit<AssociationFicheConfig, "id" | "association_id" | "created_at" | "updated_at" | "updated_by">
      >;
    }) => {
      if (!user) throw new Error("Vous devez être connecté");

      // Upsert : si la config n'existe pas encore, on la crée
      const { error } = await supabase
        .from("association_fiche_config" as any)
        .upsert(
          {
            association_id: associationId,
            ...data,
            updated_by: user.id,
          } as any,
          { onConflict: "association_id" }
        );

      if (error) throw error;
    },
    onSuccess: (_, { associationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["association-fiche-config", associationId],
      });
      toast.success("Fiche association mise à jour !");
    },
    onError: (error: Error) => {
      console.error("Error updating fiche config:", error);
      toast.error("Erreur lors de la mise à jour de la fiche");
    },
  });
}

// ──────────────────────────────────────────────
// Utilitaire : déterminer si une section est visible
// pour un utilisateur donné
// ──────────────────────────────────────────────

export function isSectionVisible(
  sectionKey: keyof SectionsVisibility,
  visibility: SectionsVisibility,
  isMember: boolean
): boolean {
  const v = visibility[sectionKey];
  if (v === "hidden") return false;
  if (v === "internal" && !isMember) return false;
  return true;
}
