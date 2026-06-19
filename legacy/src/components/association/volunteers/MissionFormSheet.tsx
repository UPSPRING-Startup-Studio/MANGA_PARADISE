import { useState, useEffect, useMemo, useCallback, type KeyboardEvent } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lock,
  Loader2,
  Save,
  Plus,
  X,
  FileText,
  Settings,
  Users,
  Calendar,
  MapPin,
  Tag,
  Zap,
  ClipboardList,
  LayoutList,
  Star,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useMissionSchemaWithFields,
  useMissionTemplates,
  resolveSchema,
  evaluateConditions,
  getDefaultValues,
  applyTemplate,
  type SchemaSection,
  type SchemaField,
  type FieldOption,
  type MissionTemplate,
} from "@/hooks/association/useMissionSchema";
import {
  useCreateMission,
  useUpdateMission,
  type VolunteerMission,
} from "@/hooks/association/useVolunteerModule";
import { useAssociationEvents } from "@/hooks/useAssociationEvents";

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface MissionFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associationId: string;
  editingMission?: VolunteerMission | null;
  onSuccess?: () => void;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const SECTION_ICONS: Record<string, React.ElementType> = {
  general: FileText,
  settings: Settings,
  team: Users,
  planning: Calendar,
  location: MapPin,
  tags: Tag,
  skills: Zap,
  checklist: ClipboardList,
  details: LayoutList,
  priority: Star,
};

function getSectionIcon(iconName: string | null): React.ElementType {
  if (!iconName) return FileText;
  return SECTION_ICONS[iconName] ?? FileText;
}

/**
 * Splits form values into native DB columns and custom_data JSONB.
 */
function splitValues(
  values: Record<string, unknown>,
  fields: SchemaField[]
): { native: Record<string, unknown>; custom: Record<string, unknown> } {
  const native: Record<string, unknown> = {};
  const custom: Record<string, unknown> = {};

  fields.forEach((f) => {
    const val = values[f.slug];
    if (val === undefined) return;
    if (f.native_column) {
      native[f.native_column] = val;
    } else {
      custom[f.slug] = val;
    }
  });

  return { native, custom };
}

/**
 * Build initial form values from an editing mission + schema fields.
 */
function buildEditValues(
  mission: VolunteerMission,
  fields: SchemaField[]
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  const customData = (mission as any).custom_data ?? {};

  fields.forEach((f) => {
    if (f.native_column) {
      const raw = (mission as any)[f.native_column];
      if (raw !== undefined && raw !== null) {
        values[f.slug] = raw;
      }
    } else if (customData[f.slug] !== undefined) {
      values[f.slug] = customData[f.slug];
    }
  });

  return values;
}

// ──────────────────────────────────────────────
// Dynamic field renderer
// ──────────────────────────────────────────────

interface DynamicFieldProps {
  field: SchemaField;
  value: unknown;
  onChange: (slug: string, value: unknown) => void;
  events: { id: string; title: string }[];
}

function DynamicField({ field, value, onChange, events }: DynamicFieldProps) {
  const [tagInput, setTagInput] = useState("");

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = tagInput.trim();
      if (!trimmed) return;
      const current = Array.isArray(value) ? (value as string[]) : [];
      if (!current.includes(trimmed)) {
        onChange(field.slug, [...current, trimmed]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    const current = Array.isArray(value) ? (value as string[]) : [];
    onChange(field.slug, current.filter((t) => t !== tag));
  };

  const toggleMulti = (optValue: string) => {
    const current = Array.isArray(value) ? (value as string[]) : [];
    if (current.includes(optValue)) {
      onChange(field.slug, current.filter((v) => v !== optValue));
    } else {
      onChange(field.slug, [...current, optValue]);
    }
  };

  const toggleChecklist = (optValue: string) => {
    const current = Array.isArray(value) ? (value as string[]) : [];
    if (current.includes(optValue)) {
      onChange(field.slug, current.filter((v) => v !== optValue));
    } else {
      onChange(field.slug, [...current, optValue]);
    }
  };

  const inputClasses = "bg-[#111827]/60 border-border/40 text-foreground placeholder:text-muted-foreground";

  switch (field.field_type) {
    case "text":
      return (
        <Input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.slug, e.target.value)}
          placeholder={field.placeholder ?? undefined}
          className={inputClasses}
        />
      );

    case "textarea":
      return (
        <Textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.slug, e.target.value)}
          placeholder={field.placeholder ?? undefined}
          rows={3}
          className={cn(inputClasses, "resize-none")}
        />
      );

    case "richtext":
      return (
        <Textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.slug, e.target.value)}
          placeholder={field.placeholder ?? undefined}
          rows={5}
          className={cn(inputClasses, "resize-none")}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          value={value !== undefined && value !== null ? String(value) : ""}
          onChange={(e) => onChange(field.slug, e.target.value ? Number(e.target.value) : null)}
          placeholder={field.placeholder ?? undefined}
          className={inputClasses}
        />
      );

    case "boolean":
      return (
        <div className="flex items-center gap-3 pt-1">
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => onChange(field.slug, checked)}
          />
          <span className="text-sm text-muted-foreground">
            {value ? "Oui" : "Non"}
          </span>
        </div>
      );

    case "select":
      return (
        <Select
          value={(value as string) ?? ""}
          onValueChange={(v) => onChange(field.slug, v)}
        >
          <SelectTrigger className={inputClasses}>
            <SelectValue placeholder={field.placeholder || "Choisir..."} />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((opt: FieldOption) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.emoji ? `${opt.emoji} ` : ""}{opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "multiselect":
    case "relation_skill": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options || []).map((opt: FieldOption) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleMulti(opt.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all",
                  isSelected
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                    : "border-border/40 bg-[#111827]/40 text-muted-foreground hover:bg-white/5"
                )}
              >
                {opt.emoji && <span>{opt.emoji}</span>}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      );
    }

    case "date":
      return (
        <Input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.slug, e.target.value)}
          className={inputClasses}
        />
      );

    case "datetime":
      return (
        <Input
          type="datetime-local"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.slug, e.target.value)}
          className={inputClasses}
        />
      );

    case "tags": {
      const tags = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={field.placeholder || "Ajouter un tag..."}
              className={inputClasses}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!tagInput.trim()}
              onClick={() => {
                const trimmed = tagInput.trim();
                if (!trimmed) return;
                const current = Array.isArray(value) ? (value as string[]) : [];
                if (!current.includes(trimmed)) {
                  onChange(field.slug, [...current, trimmed]);
                }
                setTagInput("");
              }}
              className="shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-red-500/20 hover:text-red-300 transition-colors"
                  onClick={() => removeTag(tag)}
                >
                  {tag} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>
      );
    }

    case "checklist": {
      const checked = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt: FieldOption) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 p-2.5 rounded-lg border border-border/30 bg-[#111827]/40 cursor-pointer hover:bg-white/5 transition-colors"
            >
              <Checkbox
                checked={checked.includes(opt.value)}
                onCheckedChange={() => toggleChecklist(opt.value)}
              />
              <span className="text-sm text-foreground">
                {opt.emoji ? `${opt.emoji} ` : ""}{opt.label}
              </span>
            </label>
          ))}
        </div>
      );
    }

    case "relation_event":
      return (
        <Select
          value={(value as string) ?? ""}
          onValueChange={(v) => onChange(field.slug, v)}
        >
          <SelectTrigger className={inputClasses}>
            <SelectValue placeholder="Choisir un evenement..." />
          </SelectTrigger>
          <SelectContent>
            {events.map((ev) => (
              <SelectItem key={ev.id} value={ev.id}>
                {ev.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "relation_user":
      return (
        <Select
          value={(value as string) ?? ""}
          onValueChange={(v) => onChange(field.slug, v)}
        >
          <SelectTrigger className={inputClasses}>
            <SelectValue placeholder="Choisir un responsable..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">Non attribue</SelectItem>
          </SelectContent>
        </Select>
      );

    case "url":
      return (
        <Input
          type="url"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.slug, e.target.value)}
          placeholder={field.placeholder || "https://..."}
          className={inputClasses}
        />
      );

    case "email":
      return (
        <Input
          type="email"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.slug, e.target.value)}
          placeholder={field.placeholder || "email@exemple.com"}
          className={inputClasses}
        />
      );

    case "phone":
      return (
        <Input
          type="tel"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.slug, e.target.value)}
          placeholder={field.placeholder || "06 12 34 56 78"}
          className={inputClasses}
        />
      );

    default:
      return (
        <Input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.slug, e.target.value)}
          placeholder={field.placeholder ?? undefined}
          className={inputClasses}
        />
      );
  }
}

// ──────────────────────────────────────────────
// Section renderer
// ──────────────────────────────────────────────

interface SectionBlockProps {
  section: SchemaSection;
  values: Record<string, unknown>;
  onChange: (slug: string, value: unknown) => void;
  events: { id: string; title: string }[];
}

function SectionBlock({ section, values, onChange, events }: SectionBlockProps) {
  const [collapsed, setCollapsed] = useState(section.is_collapsed_default);
  const Icon = getSectionIcon(section.icon);

  const visibleFields = useMemo(() => {
    return (section.fields || []).filter((f) =>
      evaluateConditions(f.conditions, values)
    );
  }, [section.fields, values]);

  if (visibleFields.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/30 bg-[#0D0D0D] overflow-hidden">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-sm font-medium text-foreground flex-1">
          {section.name}
        </span>
        {section.is_required && (
          <Badge
            variant="outline"
            className="text-[10px] border-orange-500/30 text-orange-400 bg-orange-500/10"
          >
            requis
          </Badge>
        )}
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Section fields */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/20">
          {section.description && (
            <p className="text-xs text-muted-foreground pt-3 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {section.description}
            </p>
          )}
          {visibleFields.map((field) => (
            <div key={field.id} className={cn("space-y-1.5", !section.description && "first:pt-3")}>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  {field.label}
                  {field.is_required && (
                    <span className="text-orange-400 ml-0.5">*</span>
                  )}
                </Label>
                {field.is_admin_only && (
                  <Lock className="w-3 h-3 text-yellow-500/70" />
                )}
              </div>
              <DynamicField
                field={field}
                value={values[field.slug]}
                onChange={onChange}
                events={events}
              />
              {field.helper_text && (
                <p className="text-[11px] text-muted-foreground/70 pl-0.5">
                  {field.helper_text}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────

const MissionFormSheet = ({
  open,
  onOpenChange,
  associationId,
  editingMission = null,
  onSuccess,
}: MissionFormSheetProps) => {
  const isEditMode = !!editingMission;

  // ── Data loading ──
  const { data: fullSchema = [], isLoading: isLoadingSchema } =
    useMissionSchemaWithFields(associationId);
  const { data: templates = [] } = useMissionTemplates(associationId);
  const { data: associationEvents = [] } = useAssociationEvents(associationId);

  // ── Mutations ──
  const createMission = useCreateMission();
  const updateMission = useUpdateMission();

  // ── Form state ──
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Flatten all fields from schema for splitValues
  const allFields = useMemo(() => {
    return fullSchema.flatMap((sec) => sec.fields || []);
  }, [fullSchema]);

  // Events list for relation_event fields
  const eventOptions = useMemo(() => {
    return (associationEvents || []).map((ev: any) => ({
      id: ev.id as string,
      title: ev.title as string,
    }));
  }, [associationEvents]);

  // ── Initialize form ──
  useEffect(() => {
    if (!open) {
      setValues({});
      setSelectedTemplateId("");
      return;
    }

    if (fullSchema.length === 0) return;

    if (isEditMode && editingMission) {
      const editVals = buildEditValues(editingMission, allFields);
      setValues(editVals);
    } else {
      const defaults = getDefaultValues(fullSchema);
      setValues(defaults);
    }
  }, [open, fullSchema, isEditMode, editingMission, allFields]);

  // ── Resolved schema (filtered by pole + mission_type) ──
  const resolvedSections = useMemo(() => {
    const pole = values.pole as string | undefined;
    const missionType = values.mission_type as string | undefined;
    return resolveSchema(fullSchema, pole, missionType);
  }, [fullSchema, values.pole, values.mission_type]);

  // ── Handlers ──
  const handleFieldChange = useCallback((slug: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [slug]: value }));
  }, []);

  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      setSelectedTemplateId(templateId);
      const template = templates.find((t) => t.id === templateId);
      if (!template) return;
      setValues((prev) => applyTemplate(template, prev));
    },
    [templates]
  );

  const handleSubmit = useCallback(
    (asDraft: boolean) => {
      const { native, custom } = splitValues(values, allFields);

      if (asDraft) {
        native.status = "draft";
      } else if (!isEditMode) {
        // Default status for new missions = open
        native.status = native.status || "open";
      }

      if (isEditMode && editingMission) {
        const existingCustom = (editingMission as any).custom_data ?? {};
        updateMission.mutate(
          {
            missionId: editingMission.id,
            updates: {
              ...native,
              custom_data: { ...existingCustom, ...custom },
            } as any,
          },
          {
            onSuccess: () => {
              onSuccess?.();
              onOpenChange(false);
            },
          }
        );
      } else {
        createMission.mutate(
          {
            association_id: associationId,
            ...native,
            custom_data: custom,
          } as any,
          {
            onSuccess: () => {
              onSuccess?.();
              onOpenChange(false);
            },
          }
        );
      }
    },
    [
      values,
      allFields,
      isEditMode,
      editingMission,
      associationId,
      createMission,
      updateMission,
      onSuccess,
      onOpenChange,
    ]
  );

  const isPending = createMission.isPending || updateMission.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto bg-[#0D0D0D] border-l border-border/50 flex flex-col"
      >
        <SheetHeader className="space-y-4 shrink-0">
          <SheetTitle className="sr-only">
            {isEditMode ? "Modifier la mission" : "Nouvelle mission"}
          </SheetTitle>

          {/* Mode indicator + template picker */}
          <div className="space-y-3">
            {/* Mode badge */}
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  isEditMode
                    ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
                    : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                )}
              >
                {isEditMode ? "Edition" : "Creation"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {resolvedSections.length} section{resolvedSections.length > 1 ? "s" : ""}
              </span>
            </div>

            {/* Template picker */}
            {!isEditMode && templates.length > 0 && (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <Select
                  value={selectedTemplateId}
                  onValueChange={handleTemplateSelect}
                >
                  <SelectTrigger className="bg-[#111827]/60 border-border/40 text-sm h-9">
                    <SelectValue placeholder="Utiliser un template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((tpl) => (
                      <SelectItem key={tpl.id} value={tpl.id}>
                        {tpl.icon ? `${tpl.icon} ` : ""}{tpl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Form body */}
        <div className="flex-1 mt-6 space-y-4 min-h-0">
          {isLoadingSchema ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <p className="text-sm text-muted-foreground">
                Chargement du formulaire...
              </p>
            </div>
          ) : resolvedSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileText className="w-8 h-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground text-center">
                Aucune section visible pour cette configuration.
                <br />
                Ajustez le pole ou le type de mission.
              </p>
            </div>
          ) : (
            resolvedSections.map((section) => (
              <SectionBlock
                key={section.id}
                section={section}
                values={values}
                onChange={handleFieldChange}
                events={eventOptions}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 pt-4 mt-4 border-t border-border/30 shrink-0">
          {!isEditMode && (
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={isPending}
              className="gap-1.5 text-sm"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Enregistrer en brouillon
            </Button>
          )}
          <Button
            onClick={() => handleSubmit(false)}
            disabled={isPending}
            className="gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-600/90 ml-auto"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isEditMode ? "Mettre a jour" : "Creer la mission"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MissionFormSheet;
