import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type AssociationContactType =
  | "partenaire"
  | "fournisseur"
  | "institution"
  | "media"
  | "sponsor"
  | "intervenant"
  | "autre";

export const CONTACT_TYPE_LABELS: Record<AssociationContactType, string> = {
  partenaire: "Partenaire",
  fournisseur: "Fournisseur",
  institution: "Institution",
  media: "Média",
  sponsor: "Sponsor",
  intervenant: "Intervenant",
  autre: "Autre",
};

export interface AssociationContact {
  id: string;
  association_id: string;
  name: string;
  organization: string | null;
  contact_type: AssociationContactType;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  website_url: string | null;
  social_links: Record<string, string> | null;
  notes: string | null;
  tags: string[] | null;
  last_contacted: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────
// Liste des contacts CRM
// ──────────────────────────────────────────────

export function useAssociationContacts(
  associationId: string | undefined,
  filters?: { type?: string; search?: string }
) {
  return useQuery({
    queryKey: ["association-contacts", associationId, filters],
    queryFn: async () => {
      if (!associationId) return [];

      let query = supabase
        .from("association_contacts")
        .select("*")
        .eq("association_id", associationId)
        .order("name", { ascending: true });

      if (filters?.type && filters.type !== "all") {
        query = query.eq("contact_type", filters.type);
      }

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,organization.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AssociationContact[];
    },
    enabled: !!associationId,
  });
}

// ──────────────────────────────────────────────
// Créer un contact
// ──────────────────────────────────────────────

export function useCreateAssociationContact() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      data: Omit<AssociationContact, "id" | "created_at" | "updated_at" | "created_by">
    ) => {
      if (!user) throw new Error("Vous devez être connecté");

      const { error } = await supabase
        .from("association_contacts")
        .insert({ ...data, created_by: user.id } as any);

      if (error) throw error;
    },
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: ["association-contacts", data.association_id],
      });
      toast.success("Contact ajouté !");
    },
    onError: (error: Error) => {
      console.error("Error creating contact:", error);
      toast.error("Erreur lors de la création du contact");
    },
  });
}

// ──────────────────────────────────────────────
// Modifier un contact
// ──────────────────────────────────────────────

export function useUpdateAssociationContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactId,
      associationId,
      data,
    }: {
      contactId: string;
      associationId: string;
      data: Partial<AssociationContact>;
    }) => {
      const { error } = await supabase
        .from("association_contacts")
        .update(data as any)
        .eq("id", contactId);

      if (error) throw error;
    },
    onSuccess: (_, { associationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["association-contacts", associationId],
      });
      toast.success("Contact mis à jour !");
    },
    onError: (error: Error) => {
      console.error("Error updating contact:", error);
      toast.error("Erreur lors de la mise à jour du contact");
    },
  });
}

// ──────────────────────────────────────────────
// Supprimer un contact
// ──────────────────────────────────────────────

export function useDeleteAssociationContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactId,
      associationId,
    }: {
      contactId: string;
      associationId: string;
    }) => {
      const { error } = await supabase
        .from("association_contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;
    },
    onSuccess: (_, { associationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["association-contacts", associationId],
      });
      toast.success("Contact supprimé");
    },
    onError: (error: Error) => {
      console.error("Error deleting contact:", error);
      toast.error("Erreur lors de la suppression du contact");
    },
  });
}
