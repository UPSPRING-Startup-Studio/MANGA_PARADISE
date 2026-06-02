/**
 * Types TypeScript pour "Le Quartier des Créateurs"
 * Gestion des Exposants / Stands
 */

import { Tables } from "@/integrations/supabase/types";

// =====================================================
// TYPES DE BASE
// =====================================================

/**
 * Statut de la demande d'exposant
 * - pending: En attente de validation
 * - approved: Validé par l'admin
 * - rejected: Refusé par l'admin
 */
export type ExhibitorStatus = 'pending' | 'approved' | 'rejected';

/**
 * Type de base depuis Supabase (table event_exhibitors)
 */
export type EventExhibitor = Tables<"event_exhibitors">;

/**
 * Rôles utilisateur éligibles pour être exposant
 */
export type ExhibitorEligibleRole = 'creator' | 'pro' | 'admin';

// =====================================================
// TYPES AVEC RELATIONS
// =====================================================

/**
 * Profil utilisateur minimal pour l'affichage
 */
export interface ExhibitorProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role_function: string | null;
}

/**
 * Exposant avec les données du profil utilisateur
 * Utilisé pour l'affichage public et admin
 */
export interface ExhibitorWithProfile extends EventExhibitor {
  profile: ExhibitorProfile | null;
}

/**
 * Exposant avec les données de l'événement
 * Utilisé pour le dashboard admin global
 */
export interface ExhibitorWithEvent extends EventExhibitor {
  profile: ExhibitorProfile | null;
  event: {
    id: string;
    title: string;
    date: string;
    city: string | null;
  } | null;
}

// =====================================================
// TYPES POUR LES FORMULAIRES
// =====================================================

/**
 * Données pour créer une demande de stand
 */
export interface CreateExhibitorRequest {
  eventId: string;
  userId: string;
  standName: string;
  standDescription?: string;
  requirements?: string; // Besoins techniques (visible admin uniquement)
}

/**
 * Données pour mettre à jour le statut d'une demande
 */
export interface UpdateExhibitorStatus {
  requestId: string;
  status: ExhibitorStatus;
}

/**
 * Données pour ajouter manuellement un exposant (admin)
 */
export interface AddExhibitorManually {
  eventId: string;
  userId: string;
  standName: string;
  standDescription?: string;
  requirements?: string;
}

// =====================================================
// TYPES POUR L'ÉLIGIBILITÉ
// =====================================================

/**
 * Résultat de la vérification d'éligibilité
 */
export interface ExhibitorEligibility {
  isEligible: boolean;
  reason?: string;
  userRole: string | null;
}

/**
 * Vérifie si un rôle est éligible pour être exposant
 */
export const EXHIBITOR_ELIGIBLE_ROLES: ExhibitorEligibleRole[] = ['creator', 'pro', 'admin'];

export function isExhibitorEligible(roleFunction: string | null): boolean {
  if (!roleFunction) return false;
  return EXHIBITOR_ELIGIBLE_ROLES.includes(roleFunction as ExhibitorEligibleRole);
}

// =====================================================
// CONSTANTES D'AFFICHAGE
// =====================================================

/**
 * Configuration des badges de statut
 */
export const EXHIBITOR_STATUS_CONFIG: Record<ExhibitorStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  pending: {
    label: 'En attente',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    icon: '🕐',
  },
  approved: {
    label: 'Validé',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    icon: '✅',
  },
  rejected: {
    label: 'Refusé',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    icon: '❌',
  },
};

/**
 * Labels pour les rôles créateurs
 */
export const CREATOR_ROLE_LABELS: Record<ExhibitorEligibleRole, string> = {
  creator: '🎨 Créateur',
  pro: '⭐ Professionnel',
  admin: '👑 Admin',
};
