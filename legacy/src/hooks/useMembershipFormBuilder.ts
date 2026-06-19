import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMembershipFormDefinition } from "@/hooks/useMembershipFormDefinitions";
import type { MembershipFormDefinitionRecord } from "@/types/membershipWorkflow";
import type {
  FormStep,
  FormField,
  FieldType,
  FieldOption,
  FieldValidation,
  VisibilityCondition,
} from "@/types/membershipForm";

// ──────────────────────────────────────────────
// Types for builder state
// ──────────────────────────────────────────────

export interface BuilderDefinition {
  description?: string;
  estimatedDuration?: string;
  links?: Array<{ label: string; url: string }>;
  steps: FormStep[];
}

export interface BuilderState {
  definition: BuilderDefinition;
  selectedStepId: string | null;
  selectedFieldKey: string | null;
  isDirty: boolean;
  isSaving: boolean;
}

// ──────────────────────────────────────────────
// ID generator
// ──────────────────────────────────────────────

let _counter = 0;
function generateId(prefix: string): string {
  _counter++;
  return `${prefix}_${Date.now().toString(36)}_${_counter}`;
}

// ──────────────────────────────────────────────
// Default field template
// ──────────────────────────────────────────────

function createDefaultField(type: FieldType): FormField {
  const key = generateId("field");
  const base: FormField = { key, type };

  switch (type) {
    case "text":
      return { ...base, label: "Nouveau champ texte", placeholder: "" };
    case "email":
      return { ...base, label: "Email", validation: { required: true } };
    case "tel":
      return { ...base, label: "Telephone" };
    case "date":
      return { ...base, label: "Date" };
    case "textarea":
      return { ...base, label: "Zone de texte" };
    case "select":
      return { ...base, label: "Liste deroulante", options: [{ value: "option1", label: "Option 1" }] };
    case "radio":
      return { ...base, label: "Choix unique", options: [{ value: "option1", label: "Option 1" }, { value: "option2", label: "Option 2" }] };
    case "checkbox":
      return { ...base, label: "Case a cocher" };
    case "checkbox-group":
      return { ...base, label: "Choix multiples", options: [{ value: "option1", label: "Option 1" }] };
    case "consent":
      return { ...base, label: "Consentement", content: "Texte du consentement...", validation: { required: true } };
    case "signature":
      return { ...base, label: "Signature", validation: { required: true } };
    case "heading":
      return { ...base, label: "Titre de section" };
    case "paragraph":
      return { ...base, content: "Texte d'information..." };
    case "divider":
      return { ...base };
    default:
      return { ...base, label: "Nouveau champ" };
  }
}

// ──────────────────────────────────────────────
// Hook principal
// ──────────────────────────────────────────────

export function useMembershipFormBuilder(formId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: formRecord, isLoading } = useMembershipFormDefinition(formId);

  const [definition, setDefinition] = useState<BuilderDefinition>({ steps: [] });
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const initialized = useRef(false);

  // ── Hydrate from DB ──
  useEffect(() => {
    if (formRecord && !initialized.current) {
      const def = formRecord.definition as any;
      setDefinition({
        description: def?.description || "",
        estimatedDuration: def?.estimatedDuration || "",
        links: Array.isArray(def?.links) ? def.links : [],
        steps: Array.isArray(def?.steps) ? def.steps : [],
      });
      if (def?.steps?.length > 0) {
        setSelectedStepId(def.steps[0].id);
      }
      initialized.current = true;
    }
  }, [formRecord]);

  // ── Derived state ──
  const selectedStep = useMemo(
    () => definition.steps.find((s) => s.id === selectedStepId) || null,
    [definition.steps, selectedStepId]
  );

  const selectedField = useMemo(() => {
    if (!selectedStep || !selectedFieldKey) return null;
    return selectedStep.fields.find((f) => f.key === selectedFieldKey) || null;
  }, [selectedStep, selectedFieldKey]);

  const allFieldKeys = useMemo(() => {
    const keys: Array<{ key: string; label: string; stepId: string }> = [];
    for (const step of definition.steps) {
      for (const field of step.fields) {
        if (!["heading", "paragraph", "divider"].includes(field.type)) {
          keys.push({ key: field.key, label: field.label || field.key, stepId: step.id });
        }
      }
    }
    return keys;
  }, [definition.steps]);

  // ── Mutate helper ──
  const mutate = useCallback((fn: (draft: BuilderDefinition) => BuilderDefinition) => {
    setDefinition((prev) => {
      const next = fn(prev);
      return next;
    });
    setIsDirty(true);
  }, []);

  // ════════════════════════════════════════════
  // STEP OPERATIONS
  // ════════════════════════════════════════════

  const addStep = useCallback(() => {
    const id = generateId("step");
    mutate((d) => ({
      ...d,
      steps: [...d.steps, { id, title: "Nouvelle etape", fields: [] }],
    }));
    setSelectedStepId(id);
    setSelectedFieldKey(null);
  }, [mutate]);

  const removeStep = useCallback((stepId: string) => {
    mutate((d) => ({
      ...d,
      steps: d.steps.filter((s) => s.id !== stepId),
    }));
    setSelectedStepId((prev) => (prev === stepId ? null : prev));
    setSelectedFieldKey(null);
  }, [mutate]);

  const updateStep = useCallback(
    (stepId: string, updates: Partial<Pick<FormStep, "title" | "description" | "visibleWhen">>) => {
      mutate((d) => ({
        ...d,
        steps: d.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
      }));
    },
    [mutate]
  );

  const reorderSteps = useCallback(
    (fromIndex: number, toIndex: number) => {
      mutate((d) => {
        const steps = [...d.steps];
        const [moved] = steps.splice(fromIndex, 1);
        steps.splice(toIndex, 0, moved);
        return { ...d, steps };
      });
    },
    [mutate]
  );

  const duplicateStep = useCallback(
    (stepId: string) => {
      const source = definition.steps.find((s) => s.id === stepId);
      if (!source) return;
      const newId = generateId("step");
      const newStep: FormStep = {
        ...JSON.parse(JSON.stringify(source)),
        id: newId,
        title: `${source.title} (copie)`,
        fields: source.fields.map((f) => ({
          ...JSON.parse(JSON.stringify(f)),
          key: generateId("field"),
        })),
      };
      mutate((d) => ({
        ...d,
        steps: [...d.steps, newStep],
      }));
      setSelectedStepId(newId);
    },
    [definition.steps, mutate]
  );

  // ════════════════════════════════════════════
  // FIELD OPERATIONS
  // ════════════════════════════════════════════

  const addField = useCallback(
    (stepId: string, type: FieldType) => {
      const field = createDefaultField(type);
      mutate((d) => ({
        ...d,
        steps: d.steps.map((s) =>
          s.id === stepId ? { ...s, fields: [...s.fields, field] } : s
        ),
      }));
      setSelectedFieldKey(field.key);
    },
    [mutate]
  );

  const removeField = useCallback(
    (stepId: string, fieldKey: string) => {
      mutate((d) => ({
        ...d,
        steps: d.steps.map((s) =>
          s.id === stepId
            ? { ...s, fields: s.fields.filter((f) => f.key !== fieldKey) }
            : s
        ),
      }));
      setSelectedFieldKey((prev) => (prev === fieldKey ? null : prev));
    },
    [mutate]
  );

  const updateField = useCallback(
    (stepId: string, fieldKey: string, updates: Partial<FormField>) => {
      mutate((d) => ({
        ...d,
        steps: d.steps.map((s) =>
          s.id === stepId
            ? {
                ...s,
                fields: s.fields.map((f) =>
                  f.key === fieldKey ? { ...f, ...updates } : f
                ),
              }
            : s
        ),
      }));
    },
    [mutate]
  );

  const reorderFields = useCallback(
    (stepId: string, fromIndex: number, toIndex: number) => {
      mutate((d) => ({
        ...d,
        steps: d.steps.map((s) => {
          if (s.id !== stepId) return s;
          const fields = [...s.fields];
          const [moved] = fields.splice(fromIndex, 1);
          fields.splice(toIndex, 0, moved);
          return { ...s, fields };
        }),
      }));
    },
    [mutate]
  );

  const duplicateField = useCallback(
    (stepId: string, fieldKey: string) => {
      const step = definition.steps.find((s) => s.id === stepId);
      const field = step?.fields.find((f) => f.key === fieldKey);
      if (!field) return;
      const newField: FormField = {
        ...JSON.parse(JSON.stringify(field)),
        key: generateId("field"),
        label: field.label ? `${field.label} (copie)` : undefined,
      };
      mutate((d) => ({
        ...d,
        steps: d.steps.map((s) =>
          s.id === stepId ? { ...s, fields: [...s.fields, newField] } : s
        ),
      }));
      setSelectedFieldKey(newField.key);
    },
    [definition.steps, mutate]
  );

  // ════════════════════════════════════════════
  // METADATA
  // ════════════════════════════════════════════

  const updateMetadata = useCallback(
    (updates: Partial<Pick<BuilderDefinition, "description" | "estimatedDuration" | "links">>) => {
      mutate((d) => ({ ...d, ...updates }));
    },
    [mutate]
  );

  // ════════════════════════════════════════════
  // SAVE DRAFT
  // ════════════════════════════════════════════

  const saveDraft = useMutation({
    mutationFn: async () => {
      if (!formId) throw new Error("No form ID");

      const jsonbDefinition = {
        description: definition.description,
        estimatedDuration: definition.estimatedDuration,
        links: definition.links,
        steps: definition.steps,
      };

      const { error } = await supabase
        .from("membership_form_definitions" as any)
        .update({ definition: jsonbDefinition } as any)
        .eq("id", formId);

      if (error) throw error;
    },
    onSuccess: () => {
      setIsDirty(false);
      queryClient.invalidateQueries({
        queryKey: ["membership-form-definition-detail", formId],
      });
      queryClient.invalidateQueries({
        queryKey: ["membership-form-definitions"],
      });
      toast.success("Brouillon enregistre");
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  return {
    // State
    formRecord,
    isLoading,
    definition,
    selectedStepId,
    selectedStep,
    selectedFieldKey,
    selectedField,
    allFieldKeys,
    isDirty,
    isSaving: saveDraft.isPending,

    // Selection
    setSelectedStepId,
    setSelectedFieldKey,

    // Step ops
    addStep,
    removeStep,
    updateStep,
    reorderSteps,
    duplicateStep,

    // Field ops
    addField,
    removeField,
    updateField,
    reorderFields,
    duplicateField,

    // Metadata
    updateMetadata,

    // Persistence
    saveDraft: () => saveDraft.mutate(),
  };
}
