import { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type {
  FormField,
  FieldType,
  FieldOption,
  FieldValidation,
  VisibilityCondition,
} from "@/types/membershipForm";

interface FieldEditorPanelProps {
  field: FormField;
  stepId: string;
  allFieldKeys: Array<{ key: string; label: string; stepId: string }>;
  onUpdate: (updates: Partial<FormField>) => void;
  onClose: () => void;
}

const FIELD_TYPES: Array<{ value: FieldType; label: string }> = [
  { value: "text", label: "Texte" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Telephone" },
  { value: "date", label: "Date" },
  { value: "number", label: "Nombre" },
  { value: "textarea", label: "Zone de texte" },
  { value: "select", label: "Liste deroulante" },
  { value: "radio", label: "Choix unique" },
  { value: "checkbox", label: "Case a cocher" },
  { value: "checkbox-group", label: "Choix multiples" },
  { value: "consent", label: "Consentement" },
  { value: "signature", label: "Signature" },
  { value: "heading", label: "Titre" },
  { value: "paragraph", label: "Paragraphe" },
  { value: "divider", label: "Separateur" },
];

const HAS_OPTIONS: FieldType[] = ["select", "radio", "checkbox-group"];
const HAS_CONTENT: FieldType[] = ["consent", "paragraph"];
const IS_LAYOUT: FieldType[] = ["heading", "paragraph", "divider"];

const FieldEditorPanel = ({
  field,
  stepId,
  allFieldKeys,
  onUpdate,
  onClose,
}: FieldEditorPanelProps) => {
  const isLayout = IS_LAYOUT.includes(field.type);
  const hasOptions = HAS_OPTIONS.includes(field.type);
  const hasContent = HAS_CONTENT.includes(field.type);

  // ── Options editor ──
  const updateOption = (index: number, updates: Partial<FieldOption>) => {
    const options = [...(field.options || [])];
    options[index] = { ...options[index], ...updates };
    onUpdate({ options });
  };

  const addOption = () => {
    const idx = (field.options?.length || 0) + 1;
    onUpdate({
      options: [
        ...(field.options || []),
        { value: `option${idx}`, label: `Option ${idx}` },
      ],
    });
  };

  const removeOption = (index: number) => {
    const options = [...(field.options || [])];
    options.splice(index, 1);
    onUpdate({ options });
  };

  // ── Validation editor ──
  const updateValidation = (updates: Partial<FieldValidation>) => {
    onUpdate({ validation: { ...field.validation, ...updates } });
  };

  // ── Condition editor ──
  const setSimpleCondition = (sourceField: string, value: string) => {
    if (!sourceField || !value) {
      onUpdate({ visibleWhen: undefined });
      return;
    }
    onUpdate({
      visibleWhen: {
        conditions: [{ field: sourceField, operator: "equals", value }],
      },
    });
  };

  const currentConditionField = field.visibleWhen?.conditions?.[0]?.field || "";
  const currentConditionValue =
    (field.visibleWhen?.conditions?.[0]?.value as string) || "";

  // Find source field options (for condition value dropdown)
  const sourceFieldDef = allFieldKeys.find((f) => f.key === currentConditionField);

  return (
    <div className="w-72 flex-shrink-0 border-l border-border/30 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border/30 flex items-center justify-between">
        <h3 className="text-xs font-display text-muted-foreground">
          Proprietes du champ
        </h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <Accordion type="multiple" defaultValue={["general", "options", "validation", "condition"]} className="space-y-2">
          {/* ═══ General ═══ */}
          <AccordionItem value="general" className="border-none">
            <AccordionTrigger className="text-xs font-display py-2 hover:no-underline">
              General
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-1">
              <div className="space-y-1">
                <Label className="text-[10px]">Type</Label>
                <Select
                  value={field.type}
                  onValueChange={(v) => onUpdate({ type: v as FieldType })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px]">ID technique</Label>
                <Input
                  value={field.key}
                  onChange={(e) => onUpdate({ key: e.target.value.replace(/\s/g, "_").toLowerCase() })}
                  className="h-8 text-xs font-mono"
                />
              </div>

              {!isLayout && (
                <div className="space-y-1">
                  <Label className="text-[10px]">Label</Label>
                  <Input
                    value={field.label || ""}
                    onChange={(e) => onUpdate({ label: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              )}

              {field.type === "heading" && (
                <div className="space-y-1">
                  <Label className="text-[10px]">Texte du titre</Label>
                  <Input
                    value={field.label || ""}
                    onChange={(e) => onUpdate({ label: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              )}

              {hasContent && (
                <div className="space-y-1">
                  <Label className="text-[10px]">Contenu / Texte</Label>
                  <Textarea
                    value={field.content || ""}
                    onChange={(e) => onUpdate({ content: e.target.value })}
                    className="text-xs min-h-[60px]"
                    rows={3}
                  />
                </div>
              )}

              {!isLayout && (
                <>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Placeholder</Label>
                    <Input
                      value={field.placeholder || ""}
                      onChange={(e) => onUpdate({ placeholder: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px]">Texte d'aide</Label>
                    <Input
                      value={field.helpText || ""}
                      onChange={(e) => onUpdate({ helpText: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px]">Largeur</Label>
                    <Select
                      value={String(field.gridSpan || 1)}
                      onValueChange={(v) => onUpdate({ gridSpan: v === "0.5" ? 0.5 : 1 })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Pleine largeur</SelectItem>
                        <SelectItem value="0.5">Demi largeur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ═══ Options ═══ */}
          {hasOptions && (
            <AccordionItem value="options" className="border-none">
              <AccordionTrigger className="text-xs font-display py-2 hover:no-underline">
                Options ({field.options?.length || 0})
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-1">
                {field.options?.map((opt, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Input
                      value={opt.value}
                      onChange={(e) => updateOption(i, { value: e.target.value })}
                      className="h-7 text-[10px] font-mono w-20 flex-shrink-0"
                      placeholder="valeur"
                    />
                    <Input
                      value={opt.label}
                      onChange={(e) => updateOption(i, { label: e.target.value })}
                      className="h-7 text-[10px] flex-1"
                      placeholder="label"
                    />
                    <button
                      className="text-muted-foreground hover:text-destructive p-0.5"
                      onClick={() => removeOption(i)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-xs gap-1" onClick={addOption}>
                  <Plus className="w-3 h-3" />
                  Ajouter une option
                </Button>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* ═══ Validation ═══ */}
          {!isLayout && (
            <AccordionItem value="validation" className="border-none">
              <AccordionTrigger className="text-xs font-display py-2 hover:no-underline">
                Validation
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px]">Obligatoire</Label>
                  <Switch
                    checked={!!field.validation?.required}
                    onCheckedChange={(c) => updateValidation({ required: c })}
                  />
                </div>

                {field.validation?.required && (
                  <div className="space-y-1">
                    <Label className="text-[10px]">Message si manquant</Label>
                    <Input
                      value={field.validation?.requiredMessage || ""}
                      onChange={(e) => updateValidation({ requiredMessage: e.target.value })}
                      className="h-7 text-[10px]"
                      placeholder="Ce champ est obligatoire"
                    />
                  </div>
                )}

                {["text", "textarea", "email", "tel"].includes(field.type) && (
                  <div className="space-y-1">
                    <Label className="text-[10px]">Longueur minimum</Label>
                    <Input
                      type="number"
                      value={field.validation?.minLength || ""}
                      onChange={(e) => updateValidation({ minLength: e.target.value ? Number(e.target.value) : undefined })}
                      className="h-7 text-[10px]"
                    />
                  </div>
                )}

                {field.type === "date" && (
                  <div className="space-y-1">
                    <Label className="text-[10px]">Age minimum</Label>
                    <Input
                      type="number"
                      value={field.validation?.minAge || ""}
                      onChange={(e) => updateValidation({ minAge: e.target.value ? Number(e.target.value) : undefined })}
                      className="h-7 text-[10px]"
                      placeholder="ex: 18"
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* ═══ Condition ═══ */}
          <AccordionItem value="condition" className="border-none">
            <AccordionTrigger className="text-xs font-display py-2 hover:no-underline">
              Condition de visibilite
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-1">
              <p className="text-[10px] text-muted-foreground">
                Afficher ce champ uniquement si un autre champ a une valeur precise.
              </p>
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Si le champ...</Label>
                  <Select
                    value={currentConditionField}
                    onValueChange={(v) => setSimpleCondition(v, currentConditionValue)}
                  >
                    <SelectTrigger className="h-7 text-[10px]">
                      <SelectValue placeholder="Aucune condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucune condition</SelectItem>
                      {allFieldKeys
                        .filter((f) => f.key !== field.key)
                        .map((f) => (
                          <SelectItem key={f.key} value={f.key}>
                            {f.label} ({f.key})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentConditionField && (
                  <div className="space-y-1">
                    <Label className="text-[10px]">... a la valeur</Label>
                    <Input
                      value={currentConditionValue}
                      onChange={(e) => setSimpleCondition(currentConditionField, e.target.value)}
                      className="h-7 text-[10px]"
                      placeholder="valeur attendue"
                    />
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default FieldEditorPanel;
