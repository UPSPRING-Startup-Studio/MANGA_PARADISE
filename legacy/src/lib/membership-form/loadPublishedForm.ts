import type { FormDefinition } from "@/types/membershipForm";
import type { MembershipFormDefinitionRecord } from "@/types/membershipWorkflow";

// ============================================================
// Parse a DB form definition record into a FormDefinition
// that the form engine (useMembershipForm) can consume.
// ============================================================

export function parseFormDefinition(
  record: MembershipFormDefinitionRecord,
  associationId: string
): FormDefinition {
  const def = record.definition as any;

  if (!def || typeof def !== "object") {
    throw new Error("Definition de formulaire invalide ou vide");
  }

  const steps = Array.isArray(def.steps) ? def.steps : [];

  if (steps.length === 0) {
    throw new Error("Le formulaire ne contient aucune etape");
  }

  return {
    id: record.id,
    name: record.name,
    associationId,
    season: record.season || "",
    description: def.description || undefined,
    estimatedDuration: def.estimatedDuration || undefined,
    links: Array.isArray(def.links) ? def.links : undefined,
    steps,
    version: record.version,
  };
}

/** Count total data fields across all steps */
export function countFormFields(record: MembershipFormDefinitionRecord): number {
  const def = record.definition as any;
  if (!def?.steps) return 0;

  let count = 0;
  for (const step of def.steps) {
    if (!step.fields) continue;
    for (const field of step.fields) {
      if (!["heading", "paragraph", "divider"].includes(field.type)) {
        count++;
      }
    }
  }
  return count;
}

/** Count total steps */
export function countFormSteps(record: MembershipFormDefinitionRecord): number {
  const def = record.definition as any;
  return Array.isArray(def?.steps) ? def.steps.length : 0;
}

/** Extract step summaries */
export function getStepSummaries(
  record: MembershipFormDefinitionRecord
): Array<{ id: string; title: string; fieldCount: number; hasCondition: boolean }> {
  const def = record.definition as any;
  if (!Array.isArray(def?.steps)) return [];

  return def.steps.map((step: any) => ({
    id: step.id || "unknown",
    title: step.title || "Sans titre",
    fieldCount: (step.fields || []).filter(
      (f: any) => !["heading", "paragraph", "divider"].includes(f.type)
    ).length,
    hasCondition: !!step.visibleWhen,
  }));
}
