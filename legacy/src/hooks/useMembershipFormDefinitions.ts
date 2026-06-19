import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { MembershipFormDefinitionRecord } from "@/types/membershipWorkflow";

// ──────────────────────────────────────────────
// List all form definitions for an association
// ──────────────────────────────────────────────

export function useAssociationMembershipForms(associationId: string | undefined) {
  return useQuery({
    queryKey: ["membership-form-definitions", associationId],
    enabled: !!associationId,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<MembershipFormDefinitionRecord[]> => {
      if (!associationId) return [];

      const { data, error } = await supabase
        .from("membership_form_definitions" as any)
        .select("*")
        .eq("association_id", associationId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data || []) as MembershipFormDefinitionRecord[];
    },
  });
}

// ──────────────────────────────────────────────
// Get single form definition by ID
// ──────────────────────────────────────────────

export function useMembershipFormDefinition(formId: string | undefined) {
  return useQuery({
    queryKey: ["membership-form-definition-detail", formId],
    enabled: !!formId,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<MembershipFormDefinitionRecord | null> => {
      if (!formId) return null;

      const { data, error } = await supabase
        .from("membership_form_definitions" as any)
        .select("*")
        .eq("id", formId)
        .single();

      if (error) return null;
      return data as MembershipFormDefinitionRecord;
    },
  });
}

// ──────────────────────────────────────────────
// Get published default form by association slug (public)
// ──────────────────────────────────────────────

export function usePublishedMembershipFormBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["membership-form-published", slug],
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<MembershipFormDefinitionRecord | null> => {
      if (!slug) return null;

      const { data: asso } = await supabase
        .from("associations")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!asso) return null;

      const { data } = await supabase
        .from("membership_form_definitions" as any)
        .select("*")
        .eq("association_id", asso.id)
        .eq("status", "published")
        .eq("is_default", true)
        .maybeSingle();

      return (data as MembershipFormDefinitionRecord) || null;
    },
  });
}

// ──────────────────────────────────────────────
// Publish a form definition
// ──────────────────────────────────────────────

export function usePublishMembershipForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formId, associationId }: { formId: string; associationId: string }) => {
      const { error } = await supabase
        .from("membership_form_definitions" as any)
        .update({ status: "published" } as any)
        .eq("id", formId);

      if (error) throw error;
    },
    onSuccess: (_, { associationId, formId }) => {
      queryClient.invalidateQueries({ queryKey: ["membership-form-definitions", associationId] });
      queryClient.invalidateQueries({ queryKey: ["membership-form-definition-detail", formId] });
      toast.success("Formulaire publie");
    },
    onError: () => toast.error("Erreur lors de la publication"),
  });
}

// ──────────────────────────────────────────────
// Archive a form definition
// ──────────────────────────────────────────────

export function useArchiveMembershipForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formId, associationId }: { formId: string; associationId: string }) => {
      // Remove is_default if archiving
      const { error } = await supabase
        .from("membership_form_definitions" as any)
        .update({ status: "archived", is_default: false } as any)
        .eq("id", formId);

      if (error) throw error;
    },
    onSuccess: (_, { associationId, formId }) => {
      queryClient.invalidateQueries({ queryKey: ["membership-form-definitions", associationId] });
      queryClient.invalidateQueries({ queryKey: ["membership-form-definition-detail", formId] });
      toast.success("Formulaire archive");
    },
    onError: () => toast.error("Erreur lors de l'archivage"),
  });
}

// ──────────────────────────────────────────────
// Set a form as default (unset others)
// ──────────────────────────────────────────────

export function useSetDefaultMembershipForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formId, associationId }: { formId: string; associationId: string }) => {
      // First, unset all defaults for this association
      const { error: unsetError } = await supabase
        .from("membership_form_definitions" as any)
        .update({ is_default: false } as any)
        .eq("association_id", associationId);

      if (unsetError) throw unsetError;

      // Then set the chosen one
      const { error: setError } = await supabase
        .from("membership_form_definitions" as any)
        .update({ is_default: true } as any)
        .eq("id", formId);

      if (setError) throw setError;
    },
    onSuccess: (_, { associationId, formId }) => {
      queryClient.invalidateQueries({ queryKey: ["membership-form-definitions", associationId] });
      queryClient.invalidateQueries({ queryKey: ["membership-form-definition-detail", formId] });
      toast.success("Formulaire defini par defaut");
    },
    onError: () => toast.error("Erreur"),
  });
}

// ──────────────────────────────────────────────
// Duplicate a form definition
// ──────────────────────────────────────────────

export function useDuplicateMembershipForm() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      sourceForm,
    }: {
      sourceForm: MembershipFormDefinitionRecord;
    }): Promise<string> => {
      // Find next version number
      const { data: existing } = await supabase
        .from("membership_form_definitions" as any)
        .select("version")
        .eq("association_id", sourceForm.association_id)
        .eq("slug", sourceForm.slug)
        .order("version", { ascending: false })
        .limit(1);

      const nextVersion = existing && existing.length > 0
        ? (existing[0] as any).version + 1
        : sourceForm.version + 1;

      const { data: newForm, error } = await supabase
        .from("membership_form_definitions" as any)
        .insert({
          association_id: sourceForm.association_id,
          slug: sourceForm.slug,
          name: `${sourceForm.name} (v${nextVersion})`,
          season: sourceForm.season,
          version: nextVersion,
          status: "draft",
          definition: sourceForm.definition,
          is_default: false,
          created_by: user?.id || null,
        } as any)
        .select("id")
        .single();

      if (error) throw error;
      return (newForm as any).id;
    },
    onSuccess: (_, { sourceForm }) => {
      queryClient.invalidateQueries({
        queryKey: ["membership-form-definitions", sourceForm.association_id],
      });
      toast.success("Formulaire duplique");
    },
    onError: () => toast.error("Erreur lors de la duplication"),
  });
}
