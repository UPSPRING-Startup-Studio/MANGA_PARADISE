import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type DocumentStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "archived";

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Brouillon",
  pending_review: "En attente de validation",
  approved: "Approuvé",
  rejected: "Refusé",
  archived: "Archivé",
};

export const DOCUMENT_CATEGORIES = [
  { value: "general", label: "Général" },
  { value: "legal", label: "Juridique" },
  { value: "finance", label: "Finance" },
  { value: "event", label: "Événement" },
  { value: "communication", label: "Communication" },
] as const;

export interface AssociationDocument {
  id: string;
  association_id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  status: DocumentStatus;
  submitted_by: string | null;
  reviewed_by: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
  submitter?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  reviewer?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// ──────────────────────────────────────────────
// Liste des documents
// ──────────────────────────────────────────────

export function useAssociationDocuments(
  associationId: string | undefined,
  filters?: { status?: string; category?: string }
) {
  return useQuery({
    queryKey: ["association-documents", associationId, filters],
    queryFn: async () => {
      if (!associationId) return [];

      let query = supabase
        .from("association_documents")
        .select(`
          *,
          submitter:profiles!association_documents_submitted_by_fkey(id, username, display_name, avatar_url),
          reviewer:profiles!association_documents_reviewed_by_fkey(id, username, display_name, avatar_url)
        `)
        .eq("association_id", associationId)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AssociationDocument[];
    },
    enabled: !!associationId,
  });
}

// ──────────────────────────────────────────────
// Créer un document
// ──────────────────────────────────────────────

export function useCreateAssociationDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      data: Pick<
        AssociationDocument,
        "association_id" | "title" | "description" | "category" | "file_url" | "file_name" | "file_size" | "mime_type"
      >
    ) => {
      if (!user) throw new Error("Vous devez être connecté");

      const { error } = await supabase
        .from("association_documents")
        .insert({
          ...data,
          submitted_by: user.id,
          status: "draft" as any,
        } as any);

      if (error) throw error;
    },
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: ["association-documents", data.association_id],
      });
      toast.success("Document créé !");
    },
    onError: (error: Error) => {
      console.error("Error creating document:", error);
      toast.error("Erreur lors de la création du document");
    },
  });
}

// ──────────────────────────────────────────────
// Soumettre un document pour validation
// ──────────────────────────────────────────────

export function useSubmitDocumentForReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      associationId,
    }: {
      documentId: string;
      associationId: string;
    }) => {
      const { error } = await supabase
        .from("association_documents")
        .update({
          status: "pending_review" as any,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      if (error) throw error;
    },
    onSuccess: (_, { associationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["association-documents", associationId],
      });
      toast.success("Document soumis pour validation !");
    },
    onError: (error: Error) => {
      console.error("Error submitting document:", error);
      toast.error("Erreur lors de la soumission");
    },
  });
}

// ──────────────────────────────────────────────
// Valider / Refuser un document
// ──────────────────────────────────────────────

export function useReviewDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      documentId,
      associationId,
      decision,
      comment,
    }: {
      documentId: string;
      associationId: string;
      decision: "approved" | "rejected";
      comment?: string;
    }) => {
      if (!user) throw new Error("Vous devez être connecté");

      const { error } = await supabase
        .from("association_documents")
        .update({
          status: decision as any,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_comment: comment || null,
        })
        .eq("id", documentId);

      if (error) throw error;
    },
    onSuccess: (_, { associationId, decision }) => {
      queryClient.invalidateQueries({
        queryKey: ["association-documents", associationId],
      });
      toast.success(
        decision === "approved" ? "Document approuvé !" : "Document refusé"
      );
    },
    onError: (error: Error) => {
      console.error("Error reviewing document:", error);
      toast.error("Erreur lors de la validation");
    },
  });
}

// ──────────────────────────────────────────────
// Supprimer un document
// ──────────────────────────────────────────────

export function useDeleteAssociationDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      associationId,
    }: {
      documentId: string;
      associationId: string;
    }) => {
      const { error } = await supabase
        .from("association_documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;
    },
    onSuccess: (_, { associationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["association-documents", associationId],
      });
      toast.success("Document supprimé");
    },
    onError: (error: Error) => {
      console.error("Error deleting document:", error);
      toast.error("Erreur lors de la suppression");
    },
  });
}
