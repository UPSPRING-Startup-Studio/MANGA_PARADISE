import type { MembershipSubmissionStatus } from "@/types/membershipWorkflow";

// ============================================================
// STATUS MACHINE — Transitions autorisees
// ============================================================

const TRANSITIONS: Record<MembershipSubmissionStatus, MembershipSubmissionStatus[]> = {
  draft: ["submitted"],
  submitted: ["under_review", "needs_more_info", "approved", "rejected"],
  under_review: ["needs_more_info", "approved", "rejected"],
  needs_more_info: ["under_review", "submitted"],
  approved: ["awaiting_payment", "activated"],
  rejected: [],
  awaiting_payment: ["activated"],
  activated: [],
};

export function canTransition(
  from: MembershipSubmissionStatus,
  to: MembershipSubmissionStatus
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAvailableTransitions(
  current: MembershipSubmissionStatus
): MembershipSubmissionStatus[] {
  return TRANSITIONS[current] || [];
}

/** Actions metier lisibles */
export interface StatusAction {
  targetStatus: MembershipSubmissionStatus;
  label: string;
  variant: "default" | "destructive" | "outline" | "secondary";
  requiresReason: boolean;
  requiresMessage: boolean;
  icon: string;
}

export function getStatusActions(
  current: MembershipSubmissionStatus
): StatusAction[] {
  const actions: StatusAction[] = [];

  const available = getAvailableTransitions(current);

  if (available.includes("under_review")) {
    actions.push({
      targetStatus: "under_review",
      label: "Prendre en charge",
      variant: "outline",
      requiresReason: false,
      requiresMessage: false,
      icon: "Eye",
    });
  }

  if (available.includes("needs_more_info")) {
    actions.push({
      targetStatus: "needs_more_info",
      label: "Demander un complement",
      variant: "secondary",
      requiresReason: false,
      requiresMessage: true,
      icon: "MessageSquarePlus",
    });
  }

  if (available.includes("approved")) {
    actions.push({
      targetStatus: "approved",
      label: "Approuver",
      variant: "default",
      requiresReason: false,
      requiresMessage: false,
      icon: "CheckCircle2",
    });
  }

  if (available.includes("rejected")) {
    actions.push({
      targetStatus: "rejected",
      label: "Refuser",
      variant: "destructive",
      requiresReason: true,
      requiresMessage: false,
      icon: "XCircle",
    });
  }

  if (available.includes("awaiting_payment")) {
    actions.push({
      targetStatus: "awaiting_payment",
      label: "En attente de paiement",
      variant: "outline",
      requiresReason: false,
      requiresMessage: false,
      icon: "CreditCard",
    });
  }

  if (available.includes("activated")) {
    actions.push({
      targetStatus: "activated",
      label: "Activer le membre",
      variant: "default",
      requiresReason: false,
      requiresMessage: false,
      icon: "UserCheck",
    });
  }

  return actions;
}
