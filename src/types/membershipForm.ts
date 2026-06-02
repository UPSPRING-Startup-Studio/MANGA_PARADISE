// ============================================================
// MEMBERSHIP FORM ENGINE — Types & Interfaces
//
// Architecture SaaS : les formulaires d'adhesion sont definis
// par une FormDefinition JSON-serializable. Chaque association
// peut avoir sa propre definition. Le moteur de rendu
// (useMembershipForm + composants) est generique.
// ============================================================

// ──────────────────────────────────────────────
// Field types supportes par le moteur
// ──────────────────────────────────────────────

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "date"
  | "number"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "checkbox-group"
  | "consent"
  | "signature"
  | "file"
  | "heading"
  | "paragraph"
  | "divider";

// ──────────────────────────────────────────────
// Conditions (logique conditionnelle)
// ──────────────────────────────────────────────

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "in"
  | "not_in"
  | "is_truthy"
  | "is_falsy";

export interface FieldCondition {
  /** Cle du champ dont depend cette condition */
  field: string;
  operator: ConditionOperator;
  /** Valeur(s) de comparaison */
  value?: string | string[] | boolean;
}

/** Condition composite : AND de toutes les conditions du tableau */
export interface VisibilityCondition {
  conditions: FieldCondition[];
  /** Si 'all' : toutes doivent etre vraies. Si 'any' : au moins une. */
  logic?: "all" | "any";
}

// ──────────────────────────────────────────────
// Options (pour select, radio, checkbox-group)
// ──────────────────────────────────────────────

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
}

// ──────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────

export interface FieldValidation {
  required?: boolean;
  requiredMessage?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  minAge?: number;
  maxAge?: number;
}

// ──────────────────────────────────────────────
// FormField — unite atomique du formulaire
// ──────────────────────────────────────────────

export interface FormField {
  /** Cle unique du champ (sert de key dans le formulaire) */
  key: string;
  type: FieldType;
  label?: string;
  placeholder?: string;
  helpText?: string;
  /** Texte long pour les blocs consent / paragraph */
  content?: string;
  options?: FieldOption[];
  validation?: FieldValidation;
  /** Condition d'affichage */
  visibleWhen?: VisibilityCondition;
  /** Valeur par defaut */
  defaultValue?: string | boolean | string[];
  /** Largeur dans la grille (1 = pleine, 0.5 = demi) */
  gridSpan?: 1 | 0.5;
  /** Metadata pour le form builder futur */
  meta?: Record<string, unknown>;
}

// ──────────────────────────────────────────────
// FormStep — un ecran du formulaire multi-etapes
// ──────────────────────────────────────────────

export interface FormStep {
  /** Identifiant unique de l'etape */
  id: string;
  /** Titre affiche en haut de l'etape */
  title: string;
  /** Sous-titre ou description */
  description?: string;
  /** Icone (nom lucide-react) */
  icon?: string;
  /** Champs de cette etape */
  fields: FormField[];
  /** Condition d'affichage de l'etape entiere */
  visibleWhen?: VisibilityCondition;
}

// ──────────────────────────────────────────────
// FormDefinition — definition complete du formulaire
// ──────────────────────────────────────────────

export interface FormDefinition {
  /** Identifiant unique (ex: "manga-paradise-2025") */
  id: string;
  /** Nom affiche */
  name: string;
  /** Association liee */
  associationId: string;
  /** Saison */
  season: string;
  /** Description longue affichee en preambule */
  description?: string;
  /** Duree estimee */
  estimatedDuration?: string;
  /** Liens utiles */
  links?: Array<{ label: string; url: string }>;
  /** Toutes les etapes (parcours majeur + mineur inclus, filtrees par conditions) */
  steps: FormStep[];
  /** Version du schema */
  version: number;
}

// ──────────────────────────────────────────────
// Soumission
// ──────────────────────────────────────────────

export interface ConsentRecord {
  key: string;
  label: string;
  accepted: boolean;
  acceptedAt: string | null;
}

export interface SignatureRecord {
  signedBy: string;
  signedAt: string;
  /** Base64 de la signature canvas (si implementee) */
  signatureData?: string;
}

export interface MembershipSubmission {
  /** ID de la soumission */
  id?: string;
  /** ID du formulaire utilise */
  formDefinitionId: string;
  /** ID de l'association */
  associationId: string;
  /** ID du profil si l'utilisateur est connecte */
  profileId?: string;
  /** Parcours suivi */
  pathway: "major" | "minor";
  /** Donnees brutes du formulaire (cle → valeur) */
  data: Record<string, unknown>;
  /** Consentements extraits */
  consents: ConsentRecord[];
  /** Signatures */
  signatures: SignatureRecord[];
  /** Statut */
  status: "draft" | "submitted" | "validated" | "rejected";
  /** Dates */
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

// ──────────────────────────────────────────────
// Form engine state
// ──────────────────────────────────────────────

export interface FormEngineState {
  currentStepIndex: number;
  /** Index dans les etapes visibles (apres filtrage conditions) */
  visibleSteps: FormStep[];
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
}
