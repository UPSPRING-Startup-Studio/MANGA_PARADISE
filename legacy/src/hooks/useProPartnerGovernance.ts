import type { ProPartnerAdminStatus } from "./useProPartner";

// ──────────────────────────────────────────────
// Governance capabilities for pro partners
//
// Pattern identique à useAssociationGovernance.ts.
// Utilisé par ProPartnerLayout pour dériver les
// capacités granulaires depuis admin_status / deleted_at.
// ──────────────────────────────────────────────

export interface ProPartnerGovernanceCapabilities {
  /** Partenaire bloqué — lecture seule pour les membres */
  isBlocked: boolean;
  /** Partenaire restreint — certaines actions désactivées */
  isRestricted: boolean;
  /** Partenaire soft-deleted */
  isDeleted: boolean;
  /** User courant est admin global en mode admin */
  isAdminMode: boolean;
  /** Admin status value */
  adminStatus: ProPartnerAdminStatus;

  // ── Capacités granulaires ──

  /** Peut éditer les infos, settings, fiche */
  canEdit: boolean;
  /** Peut ajouter des membres */
  canCreateMembers: boolean;
  /** Peut envoyer des invitations */
  canInvite: boolean;
  /** Peut changer les rôles, suspendre, retirer des membres */
  canManageMembers: boolean;
  /** Peut créer / éditer / annuler des événements */
  canManageEvents: boolean;
  /** Peut supprimer des entités */
  canDelete: boolean;
  /** Peut sauvegarder les paramètres */
  canSaveSettings: boolean;

  /** Raison lisible si lecture seule */
  readOnlyReason: string | null;
  /** Raison lisible si restreint */
  restrictedReason: string | null;
}

/**
 * Dérive les capacités de gouvernance pour un partenaire pro.
 *
 * Contrairement à useAssociationGovernance qui lit un OutletContext,
 * ce hook prend les paramètres directement — il peut être utilisé
 * aussi bien dans un layout que dans un composant isolé.
 */
export function useProPartnerGovernance({
  adminStatus,
  deletedAt,
  isAdminMode = false,
}: {
  adminStatus?: ProPartnerAdminStatus | string;
  deletedAt?: string | null;
  isAdminMode?: boolean;
}): ProPartnerGovernanceCapabilities {
  const isBlocked = adminStatus === "blocked";
  const isRestricted = adminStatus === "restricted";
  const isDeleted = !!deletedAt;
  const resolvedStatus: ProPartnerAdminStatus = isBlocked
    ? "blocked"
    : isRestricted
      ? "restricted"
      : "active";

  // Admin global en mode admin : bypass complet
  if (isAdminMode) {
    return {
      isBlocked,
      isRestricted,
      isDeleted,
      isAdminMode: true,
      adminStatus: resolvedStatus,
      canEdit: true,
      canCreateMembers: true,
      canInvite: true,
      canManageMembers: true,
      canManageEvents: true,
      canDelete: true,
      canSaveSettings: true,
      readOnlyReason: isBlocked
        ? "Partenaire bloqué par l'administration (vous intervenez en tant qu'admin global)."
        : isDeleted
          ? "Partenaire supprimé (vous intervenez en tant qu'admin global)."
          : null,
      restrictedReason: isRestricted
        ? "Partenaire restreint par l'administration (vous intervenez en tant qu'admin global)."
        : null,
    };
  }

  // Bloqué ou supprimé : lecture seule totale
  if (isBlocked || isDeleted) {
    return {
      isBlocked,
      isRestricted: false,
      isDeleted,
      isAdminMode: false,
      adminStatus: resolvedStatus,
      canEdit: false,
      canCreateMembers: false,
      canInvite: false,
      canManageMembers: false,
      canManageEvents: false,
      canDelete: false,
      canSaveSettings: false,
      readOnlyReason: isDeleted
        ? "Ce partenaire a été supprimé. Les modifications sont désactivées."
        : "Ce partenaire est bloqué par l'administration plateforme. Les modifications sont temporairement désactivées.",
      restrictedReason: null,
    };
  }

  // Restreint : limitations ciblées
  if (isRestricted) {
    return {
      isBlocked: false,
      isRestricted: true,
      isDeleted: false,
      isAdminMode: false,
      adminStatus: "restricted",
      canEdit: true,
      canCreateMembers: false,
      canInvite: false,
      canManageMembers: true,
      canManageEvents: false,
      canDelete: false,
      canSaveSettings: true,
      readOnlyReason: null,
      restrictedReason:
        "Ce partenaire fait l'objet de restrictions administratives. Certaines actions sont temporairement indisponibles.",
    };
  }

  // Actif : toutes les capacités
  return {
    isBlocked: false,
    isRestricted: false,
    isDeleted: false,
    isAdminMode: false,
    adminStatus: "active",
    canEdit: true,
    canCreateMembers: true,
    canInvite: true,
    canManageMembers: true,
    canManageEvents: true,
    canDelete: true,
    canSaveSettings: true,
    readOnlyReason: null,
    restrictedReason: null,
  };
}
