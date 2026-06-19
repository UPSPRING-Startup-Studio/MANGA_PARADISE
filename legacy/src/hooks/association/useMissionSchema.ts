import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type FieldType =
  | "text" | "textarea" | "number" | "boolean" | "select" | "multiselect"
  | "date" | "datetime" | "tags" | "url" | "email" | "phone" | "checklist"
  | "relation_event" | "relation_user" | "relation_skill" | "richtext";

export type VisibilityLevel = "internal" | "volunteer" | "public";

export interface FieldOption {
  value: string;
  label: string;
  emoji?: string;
}

export interface FieldCondition {
  field_slug: string;
  operator: "eq" | "neq" | "in" | "not_empty";
  value?: string | string[];
}

export interface SchemaSection {
  id: string;
  association_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_visible: boolean;
  is_active: boolean;
  is_collapsed_default: boolean;
  is_required: boolean;
  is_system: boolean;
  applicable_poles: string[];
  applicable_types: string[];
  created_at: string;
  updated_at: string;
  fields?: SchemaField[];
}

export interface SchemaField {
  id: string;
  section_id: string;
  association_id: string | null;
  slug: string;
  label: string;
  helper_text: string | null;
  placeholder: string | null;
  field_type: FieldType;
  display_order: number;
  is_required: boolean;
  is_visible: boolean;
  is_active: boolean;
  is_admin_only: boolean;
  is_locked_after_create: boolean;
  is_multi_value: boolean;
  is_system: boolean;
  native_column: string | null;
  default_value: unknown;
  options: FieldOption[];
  validation_rules: Record<string, unknown>;
  conditions: FieldCondition[];
  visibility_level: VisibilityLevel;
  applicable_poles: string[];
  applicable_types: string[];
  created_at: string;
  updated_at: string;
}

export interface MissionTemplate {
  id: string;
  association_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  pole: string | null;
  mission_type: string | null;
  mission_subtype: string | null;
  default_values: Record<string, unknown>;
  custom_field_values: Record<string, unknown>;
  enabled_sections: string[];
  is_active: boolean;
  is_global: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Texte court",
  textarea: "Texte long",
  number: "Nombre",
  boolean: "Oui / Non",
  select: "Liste déroulante",
  multiselect: "Sélection multiple",
  date: "Date",
  datetime: "Date & heure",
  tags: "Tags libres",
  url: "URL",
  email: "Email",
  phone: "Téléphone",
  checklist: "Checklist",
  relation_event: "Événement",
  relation_user: "Utilisateur",
  relation_skill: "Compétence",
  richtext: "Texte riche",
};

export const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
  internal: "Interne staff",
  volunteer: "Visible bénévoles",
  public: "Public",
};

export const VISIBILITY_COLORS: Record<VisibilityLevel, string> = {
  internal: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  volunteer: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  public: "bg-green-500/20 text-green-300 border-green-500/30",
};

export const POLE_OPTIONS: FieldOption[] = [
  { value: "animation", label: "Animation", emoji: "🎤" },
  { value: "culture", label: "Culture", emoji: "📚" },
  { value: "communication", label: "Communication", emoji: "📣" },
  { value: "creatif", label: "Créatif", emoji: "🎨" },
  { value: "technique", label: "Technique", emoji: "🔧" },
  { value: "accueil", label: "Accueil", emoji: "👋" },
  { value: "logistique", label: "Logistique", emoji: "📦" },
  { value: "boutique", label: "Boutique", emoji: "🛍️" },
  { value: "coordination", label: "Coordination", emoji: "🧭" },
];

export const MISSION_TYPE_OPTIONS: FieldOption[] = [
  { value: "accueil", label: "Accueil public", emoji: "👋" },
  { value: "stand", label: "Stand associatif", emoji: "🎪" },
  { value: "quiz", label: "Quiz / Blind test", emoji: "🎯" },
  { value: "tournoi", label: "Tournoi jeux vidéo", emoji: "🎮" },
  { value: "cosplay", label: "Cosplay / Concours", emoji: "🎭" },
  { value: "photo", label: "Photo / Vidéo", emoji: "📸" },
  { value: "community", label: "Community management", emoji: "📱" },
  { value: "redaction", label: "Rédaction / Blog", emoji: "✍️" },
  { value: "atelier", label: "Atelier / Workshop", emoji: "✂️" },
  { value: "regie", label: "Régie / Technique", emoji: "🔧" },
  { value: "caisse", label: "Caisse / Vente", emoji: "💰" },
  { value: "buvette", label: "Buvette / Restauration", emoji: "🍜" },
  { value: "logistique", label: "Logistique", emoji: "📦" },
  { value: "installation", label: "Installation / Montage", emoji: "🔨" },
  { value: "demontage", label: "Démontage", emoji: "🧹" },
  { value: "pret_materiel", label: "Prêt de matériel", emoji: "🎲" },
  { value: "securite", label: "Sécurité / Orientation", emoji: "🛡️" },
  { value: "autre", label: "Autre", emoji: "⚡" },
];

// ──────────────────────────────────────────────
// SCHEMA SECTIONS — Queries & Mutations
// ──────────────────────────────────────────────

export function useMissionSchemaSections(associationId: string | undefined) {
  return useQuery({
    queryKey: ["mission-schema-sections", associationId],
    queryFn: async () => {
      if (!associationId) return [];
      const { data, error } = await supabase
        .from("mission_schema_sections")
        .select("*")
        .or(`association_id.is.null,association_id.eq.${associationId}`)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SchemaSection[];
    },
    enabled: !!associationId,
  });
}

export function useMissionSchemaWithFields(associationId: string | undefined) {
  return useQuery({
    queryKey: ["mission-schema-full", associationId],
    queryFn: async () => {
      if (!associationId) return [];

      // Get sections
      const { data: sections, error: secErr } = await supabase
        .from("mission_schema_sections")
        .select("*")
        .or(`association_id.is.null,association_id.eq.${associationId}`)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (secErr) throw secErr;

      // Get fields
      const sectionIds = (sections || []).map((s: any) => s.id);
      if (sectionIds.length === 0) return [];

      const { data: fields, error: fieldErr } = await supabase
        .from("mission_schema_fields")
        .select("*")
        .in("section_id", sectionIds)
        .or(`association_id.is.null,association_id.eq.${associationId}`)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (fieldErr) throw fieldErr;

      // Merge fields into sections
      return (sections || []).map((sec: any) => ({
        ...sec,
        fields: (fields || []).filter((f: any) => f.section_id === sec.id),
      })) as SchemaSection[];
    },
    enabled: !!associationId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSchemaSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SchemaSection> & { name: string; slug: string }) => {
      const { data: result, error } = await supabase
        .from("mission_schema_sections")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mission-schema-sections"] });
      queryClient.invalidateQueries({ queryKey: ["mission-schema-full"] });
      toast.success("Section créée !");
    },
    onError: () => toast.error("Erreur lors de la création"),
  });
}

export function useUpdateSchemaSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SchemaSection> }) => {
      const { error } = await supabase
        .from("mission_schema_sections")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mission-schema-sections"] });
      queryClient.invalidateQueries({ queryKey: ["mission-schema-full"] });
      toast.success("Section mise à jour !");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

// ──────────────────────────────────────────────
// SCHEMA FIELDS — Queries & Mutations
// ──────────────────────────────────────────────

export function useSectionFields(sectionId: string | undefined, associationId: string | undefined) {
  return useQuery({
    queryKey: ["mission-schema-fields", sectionId, associationId],
    queryFn: async () => {
      if (!sectionId) return [];
      let query = supabase
        .from("mission_schema_fields")
        .select("*")
        .eq("section_id", sectionId)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (associationId) {
        query = query.or(`association_id.is.null,association_id.eq.${associationId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SchemaField[];
    },
    enabled: !!sectionId,
  });
}

export function useCreateSchemaField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SchemaField> & { section_id: string; slug: string; label: string; field_type: FieldType }) => {
      const { data: result, error } = await supabase
        .from("mission_schema_fields")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mission-schema-fields"] });
      queryClient.invalidateQueries({ queryKey: ["mission-schema-full"] });
      toast.success("Champ créé !");
    },
    onError: () => toast.error("Erreur lors de la création du champ"),
  });
}

export function useUpdateSchemaField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SchemaField> }) => {
      const { error } = await supabase
        .from("mission_schema_fields")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mission-schema-fields"] });
      queryClient.invalidateQueries({ queryKey: ["mission-schema-full"] });
      toast.success("Champ mis à jour !");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

export function useDeleteSchemaField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fieldId: string) => {
      // Soft delete: set is_active = false
      const { error } = await supabase
        .from("mission_schema_fields")
        .update({ is_active: false })
        .eq("id", fieldId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mission-schema-fields"] });
      queryClient.invalidateQueries({ queryKey: ["mission-schema-full"] });
      toast.success("Champ désactivé");
    },
    onError: () => toast.error("Erreur lors de la désactivation"),
  });
}

// ──────────────────────────────────────────────
// TEMPLATES — Queries & Mutations
// ──────────────────────────────────────────────

export function useMissionTemplates(associationId: string | undefined) {
  return useQuery({
    queryKey: ["mission-templates", associationId],
    queryFn: async () => {
      if (!associationId) return [];
      const { data, error } = await supabase
        .from("mission_templates")
        .select("*")
        .or(`association_id.eq.${associationId},is_global.eq.true,association_id.is.null`)
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as MissionTemplate[];
    },
    enabled: !!associationId,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: Partial<MissionTemplate> & { name: string; slug: string }) => {
      const { data: result, error } = await supabase
        .from("mission_templates")
        .insert({ ...data, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mission-templates"] });
      toast.success("Template créé !");
    },
    onError: () => toast.error("Erreur lors de la création du template"),
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MissionTemplate> }) => {
      const { error } = await supabase
        .from("mission_templates")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mission-templates"] });
      toast.success("Template mis à jour !");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

export function useDuplicateTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (templateId: string) => {
      // Fetch original
      const { data: original, error: fetchErr } = await supabase
        .from("mission_templates")
        .select("*")
        .eq("id", templateId)
        .single();
      if (fetchErr) throw fetchErr;

      // Create copy
      const { id, created_at, updated_at, ...rest } = original as any;
      const { data: result, error } = await supabase
        .from("mission_templates")
        .insert({
          ...rest,
          name: `${rest.name} (copie)`,
          slug: `${rest.slug}-copy-${Date.now()}`,
          created_by: user?.id,
          is_global: false,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mission-templates"] });
      toast.success("Template dupliqué !");
    },
    onError: () => toast.error("Erreur lors de la duplication"),
  });
}

// ──────────────────────────────────────────────
// HELPERS — Schema resolution
// ──────────────────────────────────────────────

/**
 * Filtre les sections et champs visibles selon le pôle et le type de mission.
 * Les sections/champs avec applicable_poles/applicable_types vides s'affichent toujours.
 */
export function resolveSchema(
  sections: SchemaSection[],
  pole?: string | null,
  missionType?: string | null
): SchemaSection[] {
  return sections
    .filter((sec) => {
      if (!sec.is_visible || !sec.is_active) return false;
      if (sec.applicable_poles.length > 0 && pole && !sec.applicable_poles.includes(pole)) return false;
      if (sec.applicable_types.length > 0 && missionType && !sec.applicable_types.includes(missionType)) return false;
      return true;
    })
    .map((sec) => ({
      ...sec,
      fields: (sec.fields || []).filter((f) => {
        if (!f.is_visible || !f.is_active) return false;
        if (f.applicable_poles.length > 0 && pole && !f.applicable_poles.includes(pole)) return false;
        if (f.applicable_types.length > 0 && missionType && !f.applicable_types.includes(missionType)) return false;
        return true;
      }),
    }));
}

/**
 * Évalue si les conditions d'affichage d'un champ sont remplies.
 */
export function evaluateConditions(
  conditions: FieldCondition[],
  currentValues: Record<string, unknown>
): boolean {
  if (conditions.length === 0) return true;
  return conditions.every((cond) => {
    const val = currentValues[cond.field_slug];
    switch (cond.operator) {
      case "eq": return val === cond.value;
      case "neq": return val !== cond.value;
      case "in": return Array.isArray(cond.value) && cond.value.includes(String(val));
      case "not_empty": return val !== null && val !== undefined && val !== "";
      default: return true;
    }
  });
}

/**
 * Génère les valeurs par défaut à partir du schema.
 */
export function getDefaultValues(sections: SchemaSection[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  sections.forEach((sec) =>
    (sec.fields || []).forEach((f) => {
      if (f.default_value !== null && f.default_value !== undefined) {
        values[f.slug] = f.default_value;
      }
    })
  );
  return values;
}

/**
 * Applique un template sur les valeurs d'un formulaire.
 */
export function applyTemplate(
  template: MissionTemplate,
  currentValues: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...currentValues,
    ...template.default_values,
    ...template.custom_field_values,
    mission_type: template.mission_type || currentValues.mission_type,
    pole: template.pole || currentValues.pole,
    template_id: template.id,
  };
}
