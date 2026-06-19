import { useOutletContext } from "react-router-dom";
import type { Association, AssociationRole, AdminStatus } from "./useAssociation";

// ──────────────────────────────────────────────
// Context shapes (emitted by both layouts)
// ──────────────────────────────────────────────

interface AssociationOutletContext {
  association?: Association;
  role?: AssociationRole;
  basePath?: string;
  isAdminMode?: boolean;
  isBlocked?: boolean;
  isRestricted?: boolean;
}

// ──────────────────────────────────────────────
// Governance capabilities
// ──────────────────────────────────────────────

export interface GovernanceCapabilities {
  /** Association is fully blocked — read only for members */
  isBlocked: boolean;
  /** Association is restricted — some actions disabled */
  isRestricted: boolean;
  /** Current user is a super-admin in admin mode */
  isAdminMode: boolean;
  /** Admin status value */
  adminStatus: AdminStatus;

  // ── Granular capabilities ──

  /** Can edit association info, settings, fiche */
  canEdit: boolean;
  /** Can add / invite members */
  canCreateMembers: boolean;
  /** Can send invitations */
  canInvite: boolean;
  /** Can change member roles, suspend, reactivate */
  canManageMembers: boolean;
  /** Can create / edit / attach / detach events */
  canManageEvents: boolean;
  /** Can upload / create / review documents */
  canManageDocuments: boolean;
  /** Can create / edit membership forms */
  canManageForms: boolean;
  /** Can manage contacts CRM */
  canManageContacts: boolean;
  /** Can review / approve submissions */
  canReviewSubmissions: boolean;
  /** Can create / edit volunteer missions */
  canManageMissions: boolean;
  /** Can create / confirm / manage volunteer assignments */
  canManageAssignments: boolean;
  /** Can create volunteer applications */
  canManageVolunteers: boolean;
  /** Can delete entities */
  canDelete: boolean;
  /** Can save / update settings */
  canSaveSettings: boolean;

  /** Human-readable reason if actions are restricted */
  readOnlyReason: string | null;
  /** Human-readable reason for restricted actions */
  restrictedReason: string | null;
}

/**
 * Central hook for association governance.
 *
 * Reads `isBlocked`, `isRestricted`, `isAdminMode` from the Outlet context
 * and derives granular capabilities for every action type.
 *
 * Usage in any association page:
 * ```ts
 * const gov = useAssociationGovernance();
 * <Button disabled={!gov.canInvite}>Inviter</Button>
 * ```
 */
export function useAssociationGovernance(): GovernanceCapabilities {
  const ctx = useOutletContext<AssociationOutletContext>() ?? {};

  const isBlocked = ctx.isBlocked ?? false;
  const isRestricted = ctx.isRestricted ?? false;
  const isAdminMode = ctx.isAdminMode ?? false;
  const adminStatus: AdminStatus = isBlocked
    ? "blocked"
    : isRestricted
      ? "restricted"
      : "active";

  // Super-admin in admin mode bypasses everything
  if (isAdminMode) {
    return {
      isBlocked,
      isRestricted,
      isAdminMode: true,
      adminStatus,
      canEdit: true,
      canCreateMembers: true,
      canInvite: true,
      canManageMembers: true,
      canManageEvents: true,
      canManageDocuments: true,
      canManageForms: true,
      canManageContacts: true,
      canReviewSubmissions: true,
      canManageMissions: true,
      canManageAssignments: true,
      canManageVolunteers: true,
      canDelete: true,
      canSaveSettings: true,
      readOnlyReason: isBlocked
        ? "Association bloquée par l'administration (vous intervenez en tant qu'admin global)."
        : null,
      restrictedReason: isRestricted
        ? "Association restreinte par l'administration (vous intervenez en tant qu'admin global)."
        : null,
    };
  }

  // ── Blocked: full read-only ──
  if (isBlocked) {
    return {
      isBlocked: true,
      isRestricted: false,
      isAdminMode: false,
      adminStatus: "blocked",
      canEdit: false,
      canCreateMembers: false,
      canInvite: false,
      canManageMembers: false,
      canManageEvents: false,
      canManageDocuments: false,
      canManageForms: false,
      canManageContacts: false,
      canReviewSubmissions: false,
      canManageMissions: false,
      canManageAssignments: false,
      canManageVolunteers: false,
      canDelete: false,
      canSaveSettings: false,
      readOnlyReason:
        "Cette association est bloquée par l'administration plateforme. Les modifications sont temporairement désactivées.",
      restrictedReason: null,
    };
  }

  // ── Restricted: targeted limitations ──
  if (isRestricted) {
    return {
      isBlocked: false,
      isRestricted: true,
      isAdminMode: false,
      adminStatus: "restricted",
      canEdit: true,
      canCreateMembers: false,
      canInvite: false,
      canManageMembers: true,
      canManageEvents: false,
      canManageDocuments: true,
      canManageForms: false,
      canManageContacts: true,
      canReviewSubmissions: true,
      canManageMissions: false,
      canManageAssignments: true,
      canManageVolunteers: false,
      canDelete: false,
      canSaveSettings: true,
      readOnlyReason: null,
      restrictedReason:
        "Cette association fait l'objet de restrictions administratives. Certaines actions sont temporairement indisponibles.",
    };
  }

  // ── Active: all capabilities ──
  return {
    isBlocked: false,
    isRestricted: false,
    isAdminMode: false,
    adminStatus: "active",
    canEdit: true,
    canCreateMembers: true,
    canInvite: true,
    canManageMembers: true,
    canManageEvents: true,
    canManageDocuments: true,
    canManageForms: true,
    canManageContacts: true,
    canReviewSubmissions: true,
    canManageMissions: true,
    canManageAssignments: true,
    canManageVolunteers: true,
    canDelete: true,
    canSaveSettings: true,
    readOnlyReason: null,
    restrictedReason: null,
  };
}
