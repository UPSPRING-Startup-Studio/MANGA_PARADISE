import { supabase } from "@/integrations/supabase/client";
import type { MembershipSubmission } from "@/types/membershipForm";
import type { FormDefinition, FormStep } from "@/types/membershipForm";

// ============================================================
// Service : soumettre un formulaire d'adhesion complet
// ============================================================

interface SubmitResult {
  submissionId: string;
  publicSlug: string;
}

function generatePublicSlug(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let slug = "MP-";
  for (let i = 0; i < 8; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

export async function submitMembershipForm(
  submission: MembershipSubmission,
  definition: FormDefinition,
  userId?: string
): Promise<SubmitResult> {
  const publicSlug = generatePublicSlug();

  // 1) Create the main submission record
  const { data: submissionRow, error: submissionError } = await supabase
    .from("membership_submissions" as any)
    .insert({
      association_id: submission.associationId,
      form_definition_id: submission.formDefinitionId,
      public_slug: publicSlug,
      applicant_profile_id: userId || null,
      submitted_by_user_id: userId || null,
      pathway: submission.pathway,
      season: definition.season || null,
      status: "submitted",
      payment_status: "unpaid",
      submitted_at: new Date().toISOString(),
    } as any)
    .select("id")
    .single();

  if (submissionError || !submissionRow) {
    throw new Error(
      submissionError?.message || "Erreur lors de la creation du dossier"
    );
  }

  const submissionId = (submissionRow as any).id as string;

  // 2) Insert all visible answers grouped by step
  const answers: Array<{
    submission_id: string;
    step_id: string;
    field_id: string;
    field_type: string;
    value: unknown;
    is_visible: boolean;
  }> = [];

  for (const step of definition.steps) {
    for (const field of step.fields) {
      // Skip non-data fields
      if (["heading", "paragraph", "divider"].includes(field.type)) continue;

      const val = submission.data[field.key];
      if (val === undefined) continue;

      answers.push({
        submission_id: submissionId,
        step_id: step.id,
        field_id: field.key,
        field_type: field.type,
        value: JSON.stringify(val),
        is_visible: true,
      });
    }
  }

  if (answers.length > 0) {
    const { error: answersError } = await supabase
      .from("membership_submission_answers" as any)
      .insert(answers as any);
    if (answersError) {
      console.error("Error saving answers:", answersError);
    }
  }

  // 3) Insert consents
  if (submission.consents.length > 0) {
    const consents = submission.consents.map((c) => ({
      submission_id: submissionId,
      field_id: c.key,
      label: c.label,
      accepted: c.accepted,
      accepted_at: c.acceptedAt,
      actor_type: submission.pathway === "minor" ? "guardian" : "member",
    }));

    const { error: consentsError } = await supabase
      .from("membership_consents" as any)
      .insert(consents as any);
    if (consentsError) {
      console.error("Error saving consents:", consentsError);
    }
  }

  // 4) Insert signatures
  if (submission.signatures.length > 0) {
    const signatures = submission.signatures.map((s) => ({
      submission_id: submissionId,
      field_id: "signature",
      signed_name: s.signedBy,
      signed_at: s.signedAt,
      actor_type: submission.pathway === "minor" ? "guardian" : "member",
    }));

    const { error: sigError } = await supabase
      .from("membership_signatures" as any)
      .insert(signatures as any);
    if (sigError) {
      console.error("Error saving signatures:", sigError);
    }
  }

  // 5) Create initial status history entry
  const { error: historyError } = await supabase
    .from("membership_submission_status_history" as any)
    .insert({
      submission_id: submissionId,
      from_status: null,
      to_status: "submitted",
      reason: "Dossier soumis via le formulaire public",
      changed_by: userId || null,
    } as any);

  if (historyError) {
    console.error("Error saving status history:", historyError);
  }

  return { submissionId, publicSlug };
}
