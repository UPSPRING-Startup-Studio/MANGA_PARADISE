// ============================================================
// MEMBERSHIP WORKFLOW — Types for the backend / admin layer
// ============================================================

export type MembershipSubmissionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "needs_more_info"
  | "approved"
  | "rejected"
  | "awaiting_payment"
  | "activated";

export type MembershipPaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "waived"
  | "not_applicable";

export type SubmissionPathway = "major" | "minor";

export const SUBMISSION_STATUS_LABELS: Record<MembershipSubmissionStatus, string> = {
  draft: "Brouillon",
  submitted: "Soumis",
  under_review: "En cours d'examen",
  needs_more_info: "Complement demande",
  approved: "Approuve",
  rejected: "Refuse",
  awaiting_payment: "En attente de paiement",
  activated: "Active",
};

export const SUBMISSION_STATUS_COLORS: Record<MembershipSubmissionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/20 text-blue-400",
  under_review: "bg-amber-500/20 text-amber-400",
  needs_more_info: "bg-orange-500/20 text-orange-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
  awaiting_payment: "bg-purple-500/20 text-purple-400",
  activated: "bg-emerald-600/20 text-emerald-300",
};

export const PAYMENT_STATUS_LABELS: Record<MembershipPaymentStatus, string> = {
  unpaid: "Non paye",
  pending: "En attente",
  paid: "Paye",
  waived: "Exonere",
  not_applicable: "N/A",
};

// ── DB Record types ──

export interface MembershipSubmissionRecord {
  id: string;
  association_id: string;
  form_definition_id: string;
  public_slug: string | null;
  applicant_profile_id: string | null;
  submitted_by_user_id: string | null;
  pathway: SubmissionPathway;
  season: string | null;
  status: MembershipSubmissionStatus;
  payment_status: MembershipPaymentStatus;
  review_notes: string | null;
  internal_notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields (optional, from queries)
  applicant_name?: string;
  applicant_email?: string;
}

export interface MembershipSubmissionAnswer {
  id: string;
  submission_id: string;
  step_id: string;
  field_id: string;
  field_type: string;
  value: unknown;
  is_visible: boolean;
  created_at: string;
}

export interface MembershipConsentRecord {
  id: string;
  submission_id: string;
  field_id: string;
  label: string;
  accepted: boolean;
  accepted_at: string | null;
  consent_text: string | null;
  version: string | null;
  actor_type: "member" | "guardian" | "admin";
  created_at: string;
}

export interface MembershipSignatureRecord {
  id: string;
  submission_id: string;
  field_id: string;
  signed_name: string;
  signed_at: string;
  actor_type: "member" | "guardian" | "admin";
  signature_payload: unknown;
  created_at: string;
}

export interface MembershipStatusHistoryRecord {
  id: string;
  submission_id: string;
  from_status: string | null;
  to_status: string;
  reason: string | null;
  changed_by: string | null;
  created_at: string;
  // Joined
  changed_by_name?: string;
}

export interface MembershipRequestRecord {
  id: string;
  submission_id: string;
  type: string;
  message: string;
  status: "open" | "resolved" | "cancelled";
  requested_by: string;
  requested_at: string;
  resolved_at: string | null;
  created_at: string;
  // Joined
  requested_by_name?: string;
}

export interface MembershipFormDefinitionRecord {
  id: string;
  association_id: string;
  slug: string;
  name: string;
  season: string | null;
  version: number;
  status: "draft" | "published" | "archived";
  definition: unknown;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Submission detail (all related data) ──

export interface MembershipSubmissionDetail extends MembershipSubmissionRecord {
  answers: MembershipSubmissionAnswer[];
  consents: MembershipConsentRecord[];
  signatures: MembershipSignatureRecord[];
  statusHistory: MembershipStatusHistoryRecord[];
  requests: MembershipRequestRecord[];
}
