import { useState, useCallback, useMemo } from "react";
import type {
  FormDefinition,
  FormStep,
  FormField,
  FieldCondition,
  VisibilityCondition,
  FormEngineState,
  ConsentRecord,
  SignatureRecord,
  MembershipSubmission,
} from "@/types/membershipForm";

// ──────────────────────────────────────────────
// Condition evaluation engine
// ──────────────────────────────────────────────

function evaluateCondition(
  condition: FieldCondition,
  values: Record<string, unknown>
): boolean {
  const fieldValue = values[condition.field];

  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value;
    case "not_equals":
      return fieldValue !== condition.value;
    case "in":
      if (Array.isArray(condition.value)) {
        return condition.value.includes(String(fieldValue));
      }
      return false;
    case "not_in":
      if (Array.isArray(condition.value)) {
        return !condition.value.includes(String(fieldValue));
      }
      return true;
    case "is_truthy":
      return !!fieldValue;
    case "is_falsy":
      return !fieldValue;
    default:
      return true;
  }
}

function evaluateVisibility(
  vis: VisibilityCondition | undefined,
  values: Record<string, unknown>
): boolean {
  if (!vis || vis.conditions.length === 0) return true;

  const logic = vis.logic || "all";
  if (logic === "all") {
    return vis.conditions.every((c) => evaluateCondition(c, values));
  }
  return vis.conditions.some((c) => evaluateCondition(c, values));
}

// ──────────────────────────────────────────────
// Field validation
// ──────────────────────────────────────────────

function validateField(
  field: FormField,
  value: unknown,
  values: Record<string, unknown>
): string | null {
  // Skip validation for hidden fields
  if (!evaluateVisibility(field.visibleWhen, values)) return null;

  // Non-data fields don't need validation
  if (["heading", "paragraph", "divider"].includes(field.type)) return null;

  const v = field.validation;
  if (!v) return null;

  const strVal = value === undefined || value === null ? "" : String(value);

  if (v.required) {
    if (field.type === "checkbox" || field.type === "consent") {
      if (value !== true) return v.requiredMessage || "Ce champ est obligatoire";
    } else if (field.type === "checkbox-group") {
      if (!Array.isArray(value) || value.length === 0) {
        return v.requiredMessage || "Selectionne au moins une option";
      }
    } else if (!strVal.trim()) {
      return v.requiredMessage || "Ce champ est obligatoire";
    }
  }

  if (strVal && v.minLength && strVal.length < v.minLength) {
    return `Minimum ${v.minLength} caracteres`;
  }

  if (strVal && v.maxLength && strVal.length > v.maxLength) {
    return `Maximum ${v.maxLength} caracteres`;
  }

  if (strVal && v.pattern) {
    const regex = new RegExp(v.pattern);
    if (!regex.test(strVal)) {
      return v.patternMessage || "Format invalide";
    }
  }

  if (field.type === "date" && strVal && v.minAge !== undefined) {
    const birthDate = new Date(strVal);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < v.minAge) {
      return `L'age minimum est ${v.minAge} ans`;
    }
  }

  if (field.type === "email" && strVal) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
      return "Adresse email invalide";
    }
  }

  return null;
}

// ──────────────────────────────────────────────
// Hook principal
// ──────────────────────────────────────────────

export interface UseMembershipFormReturn {
  state: FormEngineState;
  currentStep: FormStep | null;
  totalVisibleSteps: number;
  progressPercent: number;
  visibleFields: FormField[];
  /** Set a field value */
  setValue: (key: string, value: unknown) => void;
  /** Get a field value */
  getValue: (key: string) => unknown;
  /** Check if a field is visible */
  isFieldVisible: (field: FormField) => boolean;
  /** Validate current step, return true if valid */
  validateCurrentStep: () => boolean;
  /** Go to next step (validates first) */
  goNext: () => boolean;
  /** Go to previous step */
  goPrev: () => void;
  /** Go to a specific step index */
  goToStep: (index: number) => void;
  /** Get errors for a specific field */
  getError: (key: string) => string | undefined;
  /** Check if field was touched */
  isTouched: (key: string) => boolean;
  /** Mark field as touched */
  touchField: (key: string) => void;
  /** Get all consents from current values */
  getConsents: () => ConsentRecord[];
  /** Get all signatures from current values */
  getSignatures: () => SignatureRecord[];
  /** Build submission object */
  buildSubmission: () => MembershipSubmission;
  /** Is this the last step? */
  isLastStep: boolean;
  /** Is this the first step? */
  isFirstStep: boolean;
}

export function useMembershipForm(
  definition: FormDefinition
): UseMembershipFormReturn {
  // ── State ──
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    // Initialize with defaults
    const defaults: Record<string, unknown> = {};
    for (const step of definition.steps) {
      for (const field of step.fields) {
        if (field.defaultValue !== undefined) {
          defaults[field.key] = field.defaultValue;
        }
      }
    }
    return defaults;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Visible steps (filtered by conditions) ──
  const visibleSteps = useMemo(
    () =>
      definition.steps.filter((step) =>
        evaluateVisibility(step.visibleWhen, values)
      ),
    [definition.steps, values]
  );

  const currentStep = visibleSteps[currentStepIndex] || null;

  // ── Visible fields for current step ──
  const visibleFields = useMemo(() => {
    if (!currentStep) return [];
    return currentStep.fields.filter((f) =>
      evaluateVisibility(f.visibleWhen, values)
    );
  }, [currentStep, values]);

  // ── Progress ──
  const totalVisibleSteps = visibleSteps.length;
  const progressPercent =
    totalVisibleSteps > 0
      ? Math.round(((currentStepIndex + 1) / totalVisibleSteps) * 100)
      : 0;

  // ── Actions ──
  const setValue = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear error when value changes
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const getValue = useCallback(
    (key: string) => values[key],
    [values]
  );

  const isFieldVisible = useCallback(
    (field: FormField) => evaluateVisibility(field.visibleWhen, values),
    [values]
  );

  const touchField = useCallback((key: string) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const getError = useCallback(
    (key: string) => errors[key],
    [errors]
  );

  const isTouched = useCallback(
    (key: string) => !!touched[key],
    [touched]
  );

  // ── Validation ──
  const validateCurrentStep = useCallback((): boolean => {
    if (!currentStep) return true;

    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    for (const field of currentStep.fields) {
      // Skip hidden fields
      if (!evaluateVisibility(field.visibleWhen, values)) continue;
      // Skip non-data fields
      if (["heading", "paragraph", "divider"].includes(field.type)) continue;

      newTouched[field.key] = true;
      const error = validateField(field, values[field.key], values);
      if (error) {
        newErrors[field.key] = error;
      }
    }

    setTouched((prev) => ({ ...prev, ...newTouched }));
    setErrors((prev) => {
      // Remove old errors for current step fields, add new ones
      const next = { ...prev };
      for (const field of currentStep.fields) {
        delete next[field.key];
      }
      return { ...next, ...newErrors };
    });

    return Object.keys(newErrors).length === 0;
  }, [currentStep, values]);

  // ── Navigation ──
  const goNext = useCallback((): boolean => {
    const valid = validateCurrentStep();
    if (!valid) return false;

    if (currentStepIndex < visibleSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return true;
  }, [validateCurrentStep, currentStepIndex, visibleSteps.length]);

  const goPrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStepIndex]);

  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < visibleSteps.length) {
        setCurrentStepIndex(index);
      }
    },
    [visibleSteps.length]
  );

  // ── Extract consents ──
  const getConsents = useCallback((): ConsentRecord[] => {
    const consents: ConsentRecord[] = [];
    for (const step of definition.steps) {
      for (const field of step.fields) {
        if (field.type === "consent") {
          consents.push({
            key: field.key,
            label: field.label || field.key,
            accepted: values[field.key] === true,
            acceptedAt:
              values[field.key] === true ? new Date().toISOString() : null,
          });
        }
      }
    }
    return consents;
  }, [definition.steps, values]);

  // ── Extract signatures ──
  const getSignatures = useCallback((): SignatureRecord[] => {
    const sigs: SignatureRecord[] = [];
    for (const step of definition.steps) {
      for (const field of step.fields) {
        if (field.type === "signature" && values[field.key]) {
          sigs.push({
            signedBy: String(values[field.key]),
            signedAt: new Date().toISOString(),
          });
        }
      }
    }
    return sigs;
  }, [definition.steps, values]);

  // ── Build submission ──
  const buildSubmission = useCallback((): MembershipSubmission => {
    return {
      formDefinitionId: definition.id,
      associationId: definition.associationId,
      pathway: values._pathway === "minor" ? "minor" : "major",
      data: { ...values },
      consents: getConsents(),
      signatures: getSignatures(),
      status: "submitted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };
  }, [definition, values, getConsents, getSignatures]);

  return {
    state: {
      currentStepIndex,
      visibleSteps,
      values,
      errors,
      touched,
      isSubmitting,
      isDirty: Object.keys(touched).length > 0,
    },
    currentStep,
    totalVisibleSteps,
    progressPercent,
    visibleFields,
    setValue,
    getValue,
    isFieldVisible,
    validateCurrentStep,
    goNext,
    goPrev,
    goToStep,
    getError,
    isTouched,
    touchField,
    getConsents,
    getSignatures,
    buildSubmission,
    isLastStep: currentStepIndex === visibleSteps.length - 1,
    isFirstStep: currentStepIndex === 0,
  };
}
