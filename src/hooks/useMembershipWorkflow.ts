import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { canTransition } from "@/lib/membership-form/statusMachine";
import type {
  MembershipSubmissionRecord,
  MembershipSubmissionDetail,
  MembershipSubmissionStatus,
  MembershipFormDefinitionRecord,
} from "@/types/membershipWorkflow";

// ──────────────────────────────────────────────
// Fetch published form definition by association slug
// ──────────────────────────────────────────────

export function usePublishedMembershipForm(associationSlug: string | undefined) {
  return useQuery({
    queryKey: ["membership-form-definition", associationSlug],
    enabled: !!associationSlug,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<MembershipFormDefinitionRecord | null> => {
      if (!associationSlug) return null;

      // Find association by slug then its default published form
      const { data: asso } = await supabase
        .from("associations")
        .select("id")
        .eq("slug", associationSlug)
        .single();

      if (!asso) return null;

      const { data } = await supabase
        .from("membership_form_definitions" as any)
        .select("*")
        .eq("association_id", asso.id)
        .eq("status", "published")
        .eq("is_default", true)
        .maybeSingle();

      return data as MembershipFormDefinitionRecord | null;
    },
  });
}

// ──────────────────────────────────────────────
// List submissions for an association
// ──────────────────────────────────────────────

interface SubmissionsFilters {
  status?: string;
  paymentStatus?: string;
  pathway?: string;
  season?: string;
  search?: string;
}

export function useAssociationMembershipSubmissions(
  associationId: string | undefined,
  filters?: SubmissionsFilters
) {
  return useQuery({
    queryKey: ["membership-submissions", associationId, filters],
    enabled: !!associationId,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<MembershipSubmissionRecord[]> => {
      if (!associationId) return [];

      let query = supabase
        .from("membership_submissions" as any)
        .select("*")
        .eq("association_id", associationId)
        .order("submitted_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.paymentStatus && filters.paymentStatus !== "all") {
        query = query.eq("payment_status", filters.paymentStatus);
      }
      if (filters?.pathway && filters.pathway !== "all") {
        query = query.eq("pathway", filters.pathway);
      }
      if (filters?.season && filters.season !== "all") {
        query = query.eq("season", filters.season);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = (data || []) as MembershipSubmissionRecord[];

      // Enrich with applicant names from answers
      for (const sub of results) {
        const { data: nameAnswers } = await supabase
          .from("membership_submission_answers" as any)
          .select("field_id, value")
          .eq("submission_id", sub.id)
          .in("field_id", ["first_name", "last_name", "email", "minor_first_name", "minor_last_name", "guardian_first_name", "guardian_last_name"]);

        if (nameAnswers) {
          const map: Record<string, string> = {};
          for (const a of nameAnswers as any[]) {
            try {
              map[a.field_id] = JSON.parse(a.value);
            } catch {
              map[a.field_id] = String(a.value);
            }
          }
          if (sub.pathway === "minor") {
            sub.applicant_name = [map.minor_first_name, map.minor_last_name]
              .filter(Boolean).join(" ") || [map.guardian_first_name, map.guardian_last_name].filter(Boolean).join(" ");
            sub.applicant_email = map.email;
          } else {
            sub.applicant_name = [map.first_name, map.last_name].filter(Boolean).join(" ");
            sub.applicant_email = map.email;
          }
        }
      }

      // Client-side search filter
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(
          (s) =>
            s.applicant_name?.toLowerCase().includes(q) ||
            s.applicant_email?.toLowerCase().includes(q) ||
            s.public_slug?.toLowerCase().includes(q)
        );
      }

      return results;
    },
  });
}

// ──────────────────────────────────────────────
// Get submission detail with all related data
// ──────────────────────────────────────────────

export function useMembershipSubmissionDetail(submissionId: string | undefined) {
  return useQuery({
    queryKey: ["membership-submission-detail", submissionId],
    enabled: !!submissionId,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<MembershipSubmissionDetail | null> => {
      if (!submissionId) return null;

      const { data: sub, error } = await supabase
        .from("membership_submissions" as any)
        .select("*")
        .eq("id", submissionId)
        .single();

      if (error || !sub) return null;

      // Fetch related data in parallel
      const [answersRes, consentsRes, signaturesRes, historyRes, requestsRes] =
        await Promise.all([
          supabase
            .from("membership_submission_answers" as any)
            .select("*")
            .eq("submission_id", submissionId)
            .order("created_at"),
          supabase
            .from("membership_consents" as any)
            .select("*")
            .eq("submission_id", submissionId),
          supabase
            .from("membership_signatures" as any)
            .select("*")
            .eq("submission_id", submissionId),
          supabase
            .from("membership_submission_status_history" as any)
            .select("*")
            .eq("submission_id", submissionId)
            .order("created_at", { ascending: false }),
          supabase
            .from("membership_submission_requests" as any)
            .select("*")
            .eq("submission_id", submissionId)
            .order("created_at", { ascending: false }),
        ]);

      // Enrich with applicant name
      const record = sub as any as MembershipSubmissionRecord;
      const answers = (answersRes.data || []) as any[];
      const nameMap: Record<string, string> = {};
      for (const a of answers) {
        if (["first_name", "last_name", "email", "minor_first_name", "minor_last_name"].includes(a.field_id)) {
          try { nameMap[a.field_id] = JSON.parse(a.value); } catch { nameMap[a.field_id] = String(a.value); }
        }
      }
      if (record.pathway === "minor") {
        record.applicant_name = [nameMap.minor_first_name, nameMap.minor_last_name].filter(Boolean).join(" ");
      } else {
        record.applicant_name = [nameMap.first_name, nameMap.last_name].filter(Boolean).join(" ");
      }
      record.applicant_email = nameMap.email;

      return {
        ...record,
        answers: answers,
        consents: (consentsRes.data || []) as any[],
        signatures: (signaturesRes.data || []) as any[],
        statusHistory: (historyRes.data || []) as any[],
        requests: (requestsRes.data || []) as any[],
      } as MembershipSubmissionDetail;
    },
  });
}

// ──────────────────────────────────────────────
// Update submission status (with state machine check)
// ──────────────────────────────────────────────

export function useUpdateMembershipSubmissionStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      submissionId,
      associationId,
      currentStatus,
      newStatus,
      reason,
    }: {
      submissionId: string;
      associationId: string;
      currentStatus: MembershipSubmissionStatus;
      newStatus: MembershipSubmissionStatus;
      reason?: string;
    }) => {
      if (!canTransition(currentStatus, newStatus)) {
        throw new Error(
          `Transition impossible : ${currentStatus} → ${newStatus}`
        );
      }

      const updatePayload: Record<string, unknown> = {
        status: newStatus,
      };

      if (newStatus === "under_review") {
        updatePayload.reviewed_at = new Date().toISOString();
        updatePayload.reviewed_by = user?.id || null;
      }
      if (newStatus === "approved") {
        updatePayload.approved_at = new Date().toISOString();
      }
      if (newStatus === "rejected") {
        updatePayload.rejected_at = new Date().toISOString();
        updatePayload.review_notes = reason || null;
      }
      if (newStatus === "activated") {
        updatePayload.activated_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("membership_submissions" as any)
        .update(updatePayload as any)
        .eq("id", submissionId);

      if (updateError) throw updateError;

      // Record status history
      await supabase
        .from("membership_submission_status_history" as any)
        .insert({
          submission_id: submissionId,
          from_status: currentStatus,
          to_status: newStatus,
          reason: reason || null,
          changed_by: user?.id || null,
        } as any);
    },
    onSuccess: (_, { submissionId, associationId }) => {
      queryClient.invalidateQueries({ queryKey: ["membership-submissions", associationId] });
      queryClient.invalidateQueries({ queryKey: ["membership-submission-detail", submissionId] });
      toast.success("Statut mis a jour");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la mise a jour");
    },
  });
}

// ──────────────────────────────────────────────
// Request more info
// ──────────────────────────────────────────────

export function useRequestMoreMembershipInfo() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      submissionId,
      associationId,
      currentStatus,
      message,
    }: {
      submissionId: string;
      associationId: string;
      currentStatus: MembershipSubmissionStatus;
      message: string;
    }) => {
      if (!canTransition(currentStatus, "needs_more_info")) {
        throw new Error("Impossible de demander un complement dans cet etat");
      }
      if (!user) throw new Error("Vous devez etre connecte");

      // Create request
      await supabase
        .from("membership_submission_requests" as any)
        .insert({
          submission_id: submissionId,
          type: "missing_info",
          message,
          status: "open",
          requested_by: user.id,
          requested_at: new Date().toISOString(),
        } as any);

      // Update status
      await supabase
        .from("membership_submissions" as any)
        .update({ status: "needs_more_info" } as any)
        .eq("id", submissionId);

      // History
      await supabase
        .from("membership_submission_status_history" as any)
        .insert({
          submission_id: submissionId,
          from_status: currentStatus,
          to_status: "needs_more_info",
          reason: message,
          changed_by: user.id,
        } as any);
    },
    onSuccess: (_, { submissionId, associationId }) => {
      queryClient.invalidateQueries({ queryKey: ["membership-submissions", associationId] });
      queryClient.invalidateQueries({ queryKey: ["membership-submission-detail", submissionId] });
      toast.success("Demande de complement envoyee");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

// ──────────────────────────────────────────────
// Activate member (creates/updates membership)
// ──────────────────────────────────────────────

export function useActivateMembershipSubmission() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      submissionId,
      associationId,
      currentStatus,
      answers,
    }: {
      submissionId: string;
      associationId: string;
      currentStatus: MembershipSubmissionStatus;
      answers: Array<{ field_id: string; value: unknown }>;
    }) => {
      if (!canTransition(currentStatus, "activated")) {
        throw new Error("Impossible d'activer dans cet etat");
      }
      if (!user) throw new Error("Vous devez etre connecte");

      // Extract profile info from answers
      const answerMap: Record<string, string> = {};
      for (const a of answers) {
        try {
          answerMap[a.field_id] = typeof a.value === "string" ? JSON.parse(a.value) : String(a.value);
        } catch {
          answerMap[a.field_id] = String(a.value);
        }
      }

      const email = answerMap.email || answerMap.guardian_email;

      // Try to find existing profile by email
      let profileId: string | null = null;
      if (email) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", email)
          .maybeSingle();

        profileId = existingProfile?.id || null;
      }

      // If profile found, create/update membership
      if (profileId) {
        await supabase
          .from("association_memberships")
          .upsert({
            association_id: associationId,
            user_id: profileId,
            role: "membre",
            is_active: true,
            membership_status: "active",
            joined_at: new Date().toISOString(),
          } as any, { onConflict: "association_id,user_id" });

        // Update profile membership_status
        await supabase
          .from("profiles")
          .update({ membership_status: "active" })
          .eq("id", profileId);
      }

      // Update submission
      await supabase
        .from("membership_submissions" as any)
        .update({
          status: "activated",
          activated_at: new Date().toISOString(),
          applicant_profile_id: profileId,
        } as any)
        .eq("id", submissionId);

      // History
      await supabase
        .from("membership_submission_status_history" as any)
        .insert({
          submission_id: submissionId,
          from_status: currentStatus,
          to_status: "activated",
          reason: profileId
            ? `Membre active (profil ${profileId})`
            : "Membre active (profil non lie)",
          changed_by: user.id,
        } as any);
    },
    onSuccess: (_, { submissionId, associationId }) => {
      queryClient.invalidateQueries({ queryKey: ["membership-submissions", associationId] });
      queryClient.invalidateQueries({ queryKey: ["membership-submission-detail", submissionId] });
      toast.success("Membre active !");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
