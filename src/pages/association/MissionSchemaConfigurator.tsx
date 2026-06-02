import { useState, useMemo, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Settings,
  Plus,
  GripVertical,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  Pencil,
  ChevronUp,
  ChevronDown,
  Shield,
  ShieldAlert,
  Star,
  Loader2,
  X,
  LayoutList,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Association, AssociationRole } from "@/hooks/useAssociation";
import { useAssociationGovernance } from "@/hooks/useAssociationGovernance";
import {
  useMissionSchemaWithFields,
  useCreateSchemaSection,
  useUpdateSchemaSection,
  useCreateSchemaField,
  useUpdateSchemaField,
  useDeleteSchemaField,
  FIELD_TYPE_LABELS,
  VISIBILITY_LABELS,
  VISIBILITY_COLORS,
  POLE_OPTIONS,
  MISSION_TYPE_OPTIONS,
} from "@/hooks/association/useMissionSchema";
import type {
  SchemaSection,
  SchemaField,
  FieldType,
  FieldOption,
  VisibilityLevel,
} from "@/hooks/association/useMissionSchema";

// ──────────────────────────────────────────────
// Context & Permission
// ──────────────────────────────────────────────

interface AssociationContext {
  association: Association | undefined;
  role: AssociationRole | undefined;
}

const BUREAU_ROLES: AssociationRole[] = [
  "president",
  "vice_president",
  "tresorier",
  "secretaire",
];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const SECTION_ICONS: Record<string, string> = {
  general: "📋",
  planning: "📅",
  lieu: "📍",
  equipe: "👥",
  competences: "🎯",
  materiel: "🛠️",
  communication: "📣",
  budget: "💰",
};

function getSectionIcon(section: SchemaSection): string {
  return section.icon || SECTION_ICONS[section.slug] || "📄";
}

// ──────────────────────────────────────────────
// Multi-select chip component
// ──────────────────────────────────────────────

function ChipMultiSelect({
  options,
  selected,
  onChange,
  disabled,
}: {
  options: FieldOption[];
  selected: string[];
  onChange: (val: string[]) => void;
  disabled?: boolean;
}) {
  const toggle = (value: string) => {
    if (disabled) return;
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => toggle(opt.value)}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
              active
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-[#111827]/40 text-muted-foreground border-border/30 hover:border-border/60",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {opt.emoji && <span>{opt.emoji}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Options Editor (for select/multiselect/checklist)
// ──────────────────────────────────────────────

function OptionsEditor({
  options,
  onChange,
  disabled,
}: {
  options: FieldOption[];
  onChange: (opts: FieldOption[]) => void;
  disabled?: boolean;
}) {
  const addOption = () => {
    onChange([...options, { value: "", label: "", emoji: "" }]);
  };

  const updateOption = (idx: number, key: keyof FieldOption, val: string) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], [key]: val };
    // Auto-generate value from label if value is empty
    if (key === "label" && !updated[idx].value) {
      updated[idx].value = slugify(val);
    }
    onChange(updated);
  };

  const removeOption = (idx: number) => {
    onChange(options.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Options de la liste</Label>
      {options.map((opt, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            value={opt.emoji || ""}
            onChange={(e) => updateOption(idx, "emoji", e.target.value)}
            placeholder="🎯"
            className="w-12 text-center bg-[#111827]/40 border-border/30"
            disabled={disabled}
          />
          <Input
            value={opt.label}
            onChange={(e) => updateOption(idx, "label", e.target.value)}
            placeholder="Label"
            className="flex-1 bg-[#111827]/40 border-border/30"
            disabled={disabled}
          />
          <Input
            value={opt.value}
            onChange={(e) => updateOption(idx, "value", e.target.value)}
            placeholder="valeur"
            className="w-32 bg-[#111827]/40 border-border/30 font-mono text-xs"
            disabled={disabled}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive/70 hover:text-destructive shrink-0"
            onClick={() => removeOption(idx)}
            disabled={disabled}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1.5 border-dashed border-border/30 text-muted-foreground"
        onClick={addOption}
        disabled={disabled}
      >
        <Plus className="w-3.5 h-3.5" />
        Ajouter une option
      </Button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Field Editor Sheet
// ──────────────────────────────────────────────

function FieldEditorSheet({
  field,
  open,
  onOpenChange,
  onSave,
  isSaving,
  canEdit,
}: {
  field: SchemaField | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<SchemaField>) => void;
  isSaving: boolean;
  canEdit: boolean;
}) {
  const [form, setForm] = useState<Partial<SchemaField>>({});

  // Sync form when field changes
  const resetForm = useCallback(() => {
    if (field) {
      setForm({
        label: field.label,
        slug: field.slug,
        helper_text: field.helper_text || "",
        placeholder: field.placeholder || "",
        field_type: field.field_type,
        is_required: field.is_required,
        is_visible: field.is_visible,
        is_admin_only: field.is_admin_only,
        is_locked_after_create: field.is_locked_after_create,
        visibility_level: field.visibility_level,
        applicable_poles: field.applicable_poles || [],
        applicable_types: field.applicable_types || [],
        options: field.options || [],
        default_value: field.default_value as string || "",
      });
    }
  }, [field]);

  // Reset form when opening
  const handleOpenChange = (val: boolean) => {
    if (val) resetForm();
    onOpenChange(val);
  };

  // On mount when field changes
  useState(() => {
    if (field && open) resetForm();
  });

  const update = <K extends keyof SchemaField>(key: K, val: SchemaField[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    onSave(form);
  };

  const isOptionType = ["select", "multiselect", "checklist"].includes(
    form.field_type || ""
  );

  if (!field) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[500px] bg-[#0D0D0D] border-border/30 overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-foreground flex items-center gap-2">
            <Pencil className="w-4 h-4 text-emerald-400" />
            {field.is_system ? "Modifier le champ systeme" : "Modifier le champ"}
          </SheetTitle>
          <SheetDescription>
            {field.is_system
              ? "Certains parametres sont verrouilles pour les champs systeme."
              : "Configurez tous les parametres de ce champ."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5">
          {/* Label */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Label</Label>
            <Input
              value={(form.label as string) || ""}
              onChange={(e) => update("label", e.target.value)}
              className="bg-[#111827]/40 border-border/30"
              disabled={!canEdit}
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Slug technique</Label>
            <Input
              value={(form.slug as string) || ""}
              onChange={(e) => update("slug", e.target.value)}
              className="bg-[#111827]/40 border-border/30 font-mono text-xs"
              disabled={!canEdit || field.is_system}
            />
          </div>

          {/* Helper text */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Texte d'aide</Label>
            <Input
              value={(form.helper_text as string) || ""}
              onChange={(e) => update("helper_text", e.target.value)}
              placeholder="Indication affichee sous le champ..."
              className="bg-[#111827]/40 border-border/30"
              disabled={!canEdit}
            />
          </div>

          {/* Placeholder */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Placeholder</Label>
            <Input
              value={(form.placeholder as string) || ""}
              onChange={(e) => update("placeholder", e.target.value)}
              placeholder="Texte dans le champ vide..."
              className="bg-[#111827]/40 border-border/30"
              disabled={!canEdit}
            />
          </div>

          {/* Field type */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Type de champ</Label>
            <Select
              value={form.field_type || "text"}
              onValueChange={(val) => update("field_type", val as FieldType)}
              disabled={!canEdit || field.is_system}
            >
              <SelectTrigger className="bg-[#111827]/40 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FIELD_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-border/20">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Obligatoire</Label>
              <Switch
                checked={form.is_required ?? false}
                onCheckedChange={(val) => update("is_required", val)}
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Visible</Label>
              <Switch
                checked={form.is_visible ?? true}
                onCheckedChange={(val) => update("is_visible", val)}
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Admin uniquement</Label>
              <Switch
                checked={form.is_admin_only ?? false}
                onCheckedChange={(val) => update("is_admin_only", val)}
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Verrouille apres creation</Label>
              <Switch
                checked={form.is_locked_after_create ?? false}
                onCheckedChange={(val) => update("is_locked_after_create", val)}
                disabled={!canEdit}
              />
            </div>
          </div>

          {/* Visibility level */}
          <div className="space-y-1.5 pt-2 border-t border-border/20">
            <Label className="text-xs text-muted-foreground">Niveau de visibilite</Label>
            <Select
              value={form.visibility_level || "internal"}
              onValueChange={(val) => update("visibility_level", val as VisibilityLevel)}
              disabled={!canEdit}
            >
              <SelectTrigger className="bg-[#111827]/40 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VISIBILITY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Applicable poles */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Poles concernes{" "}
              <span className="text-muted-foreground/60">(vide = tous)</span>
            </Label>
            <ChipMultiSelect
              options={POLE_OPTIONS}
              selected={(form.applicable_poles as string[]) || []}
              onChange={(val) => update("applicable_poles", val)}
              disabled={!canEdit}
            />
          </div>

          {/* Applicable types */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Types de mission{" "}
              <span className="text-muted-foreground/60">(vide = tous)</span>
            </Label>
            <ChipMultiSelect
              options={MISSION_TYPE_OPTIONS}
              selected={(form.applicable_types as string[]) || []}
              onChange={(val) => update("applicable_types", val)}
              disabled={!canEdit}
            />
          </div>

          {/* Options editor for select/multiselect/checklist */}
          {isOptionType && (
            <div className="pt-2 border-t border-border/20">
              <OptionsEditor
                options={(form.options as FieldOption[]) || []}
                onChange={(opts) => update("options", opts)}
                disabled={!canEdit}
              />
            </div>
          )}

          {/* Default value */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Valeur par defaut</Label>
            <Input
              value={String(form.default_value ?? "")}
              onChange={(e) => update("default_value", e.target.value)}
              placeholder="Valeur initiale..."
              className="bg-[#111827]/40 border-border/30"
              disabled={!canEdit}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-border/20">
            <Button
              onClick={handleSave}
              disabled={isSaving || !canEdit}
              className="flex-1 gap-2 bg-[#E84A2B] hover:bg-[#E84A2B]/90"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border/30"
            >
              Annuler
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ──────────────────────────────────────────────
// Create Section Dialog
// ──────────────────────────────────────────────

function CreateSectionDialog({
  open,
  onOpenChange,
  onCreate,
  isCreating,
  nextOrder,
  associationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: Partial<SchemaSection> & { name: string; slug: string }) => void;
  isCreating: boolean;
  nextOrder: number;
  associationId: string;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");

  const handleSubmit = () => {
    const finalSlug = slug || slugify(name);
    onCreate({
      name,
      slug: finalSlug,
      description: description || null,
      icon: icon || null,
      display_order: nextOrder,
      association_id: associationId,
      is_system: false,
      is_visible: true,
      is_required: false,
      is_active: true,
      is_collapsed_default: false,
      applicable_poles: [],
      applicable_types: [],
    });
    // Reset
    setName("");
    setSlug("");
    setDescription("");
    setIcon("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0D0D0D] border-border/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Nouvelle section</DialogTitle>
          <DialogDescription>
            Ajoutez une section personnalisee a votre schema de mission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nom de la section</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) setSlug(slugify(e.target.value));
              }}
              placeholder="ex: Informations logistiques"
              className="bg-[#111827]/40 border-border/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Slug technique</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="informations_logistiques"
              className="bg-[#111827]/40 border-border/30 font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle..."
              className="bg-[#111827]/40 border-border/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Icone (emoji)</Label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="📦"
              className="w-20 text-center text-lg bg-[#111827]/40 border-border/30"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border/30"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isCreating}
            className="gap-2 bg-[#E84A2B] hover:bg-[#E84A2B]/90"
          >
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            Creer la section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Create Field Dialog
// ──────────────────────────────────────────────

function CreateFieldDialog({
  open,
  onOpenChange,
  onCreate,
  isCreating,
  sectionId,
  associationId,
  nextOrder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: any) => void;
  isCreating: boolean;
  sectionId: string;
  associationId: string;
  nextOrder: number;
}) {
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>("text");

  const handleSubmit = () => {
    const finalSlug = slug || slugify(label);
    onCreate({
      section_id: sectionId,
      association_id: associationId,
      label,
      slug: finalSlug,
      field_type: fieldType,
      display_order: nextOrder,
      is_system: false,
      is_visible: true,
      is_required: false,
      is_active: true,
      is_admin_only: false,
      is_locked_after_create: false,
      is_multi_value: false,
      visibility_level: "internal" as VisibilityLevel,
      applicable_poles: [],
      applicable_types: [],
      options: [],
      validation_rules: {},
      conditions: [],
    });
    setLabel("");
    setSlug("");
    setFieldType("text");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0D0D0D] border-border/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Nouveau champ</DialogTitle>
          <DialogDescription>
            Ajoutez un champ personnalise a cette section.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Label du champ</Label>
            <Input
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (!slug) setSlug(slugify(e.target.value));
              }}
              placeholder="ex: Nombre de benevoles necessaires"
              className="bg-[#111827]/40 border-border/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Slug technique</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="nombre_benevoles"
              className="bg-[#111827]/40 border-border/30 font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Type de champ</Label>
            <Select
              value={fieldType}
              onValueChange={(val) => setFieldType(val as FieldType)}
            >
              <SelectTrigger className="bg-[#111827]/40 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FIELD_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border/30"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!label.trim() || isCreating}
            className="gap-2 bg-[#E84A2B] hover:bg-[#E84A2B]/90"
          >
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            Creer le champ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Loading skeleton
// ──────────────────────────────────────────────

function SchemaLoadingSkeleton() {
  return (
    <div className="flex gap-6">
      <div className="w-80 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg bg-[#1a1a1a]" />
        ))}
      </div>
      <div className="flex-1 space-y-4">
        <Skeleton className="h-10 w-64 rounded-lg bg-[#1a1a1a]" />
        <Skeleton className="h-6 w-96 rounded bg-[#1a1a1a]" />
        <div className="space-y-2 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg bg-[#1a1a1a]" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

const MissionSchemaConfigurator = () => {
  const { association, role } = useOutletContext<AssociationContext>();
  const gov = useAssociationGovernance();
  const isBureau = role ? BUREAU_ROLES.includes(role) : false;
  const canEditSchema = isBureau && gov.canManageMissions;

  // Data
  const {
    data: sections = [],
    isLoading,
  } = useMissionSchemaWithFields(association?.id);

  // Mutations
  const createSection = useCreateSchemaSection();
  const updateSection = useUpdateSchemaSection();
  const createField = useCreateSchemaField();
  const updateField = useUpdateSchemaField();
  const deleteField = useDeleteSchemaField();

  // Local state
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [createSectionOpen, setCreateSectionOpen] = useState(false);
  const [createFieldOpen, setCreateFieldOpen] = useState(false);
  const [editingField, setEditingField] = useState<SchemaField | null>(null);
  const [fieldSheetOpen, setFieldSheetOpen] = useState(false);

  // Derived
  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId) || null,
    [sections, selectedSectionId]
  );

  const totalFields = useMemo(
    () => sections.reduce((sum, s) => sum + (s.fields?.length || 0), 0),
    [sections]
  );

  // Auto-select first section when data loads
  useMemo(() => {
    if (sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  // ── Handlers ──

  const handleToggleSectionVisible = (section: SchemaSection) => {
    updateSection.mutate({
      id: section.id,
      updates: { is_visible: !section.is_visible },
    });
  };

  const handleToggleSectionRequired = (section: SchemaSection) => {
    updateSection.mutate({
      id: section.id,
      updates: { is_required: !section.is_required },
    });
  };

  const handleToggleSectionCollapsed = (section: SchemaSection) => {
    updateSection.mutate({
      id: section.id,
      updates: { is_collapsed_default: !section.is_collapsed_default },
    });
  };

  const handleMoveSectionUp = (section: SchemaSection) => {
    const idx = sections.findIndex((s) => s.id === section.id);
    if (idx <= 0) return;
    const prev = sections[idx - 1];
    updateSection.mutate({ id: section.id, updates: { display_order: prev.display_order } });
    updateSection.mutate({ id: prev.id, updates: { display_order: section.display_order } });
  };

  const handleMoveSectionDown = (section: SchemaSection) => {
    const idx = sections.findIndex((s) => s.id === section.id);
    if (idx < 0 || idx >= sections.length - 1) return;
    const next = sections[idx + 1];
    updateSection.mutate({ id: section.id, updates: { display_order: next.display_order } });
    updateSection.mutate({ id: next.id, updates: { display_order: section.display_order } });
  };

  const handleUpdateSectionPoles = (poles: string[]) => {
    if (!selectedSection) return;
    updateSection.mutate({
      id: selectedSection.id,
      updates: { applicable_poles: poles },
    });
  };

  const handleUpdateSectionTypes = (types: string[]) => {
    if (!selectedSection) return;
    updateSection.mutate({
      id: selectedSection.id,
      updates: { applicable_types: types },
    });
  };

  const handleCreateSection = (data: Partial<SchemaSection> & { name: string; slug: string }) => {
    createSection.mutate(data, {
      onSuccess: () => setCreateSectionOpen(false),
    });
  };

  const handleCreateField = (data: any) => {
    createField.mutate(data, {
      onSuccess: () => setCreateFieldOpen(false),
    });
  };

  const handleEditField = (field: SchemaField) => {
    setEditingField(field);
    setFieldSheetOpen(true);
  };

  const handleSaveField = (updates: Partial<SchemaField>) => {
    if (!editingField) return;
    updateField.mutate(
      { id: editingField.id, updates },
      { onSuccess: () => setFieldSheetOpen(false) }
    );
  };

  const handleDeleteField = (field: SchemaField) => {
    if (field.is_system) return;
    deleteField.mutate(field.id);
  };

  const handleToggleFieldVisible = (field: SchemaField) => {
    updateField.mutate({
      id: field.id,
      updates: { is_visible: !field.is_visible },
    });
  };

  const handleToggleFieldRequired = (field: SchemaField) => {
    updateField.mutate({
      id: field.id,
      updates: { is_required: !field.is_required },
    });
  };

  const handleToggleFieldAdminOnly = (field: SchemaField) => {
    updateField.mutate({
      id: field.id,
      updates: { is_admin_only: !field.is_admin_only },
    });
  };

  // ── Guards ──

  if (!association) return null;

  if (!isBureau) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display text-foreground">
            Configuration des fiches mission
          </h1>
          <p className="text-muted-foreground mt-1">
            Schema des formulaires de mission
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shield className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">
            Acces restreint
          </h2>
          <p className="text-muted-foreground max-w-md">
            Seuls les membres du bureau (president, vice-president, secretaire,
            tresorier) peuvent configurer le schema des missions.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display text-foreground">
            Configuration des fiches mission
          </h1>
          <p className="text-muted-foreground mt-1">Chargement du schema...</p>
        </div>
        <SchemaLoadingSkeleton />
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* ═══ Governance banner ═══ */}
      {(gov.isBlocked || gov.isRestricted) && (
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
            gov.isBlocked
              ? "border-red-500/30 bg-red-500/[0.06]"
              : "border-amber-500/30 bg-amber-500/[0.06]"
          }`}
        >
          <ShieldAlert
            className={`w-5 h-5 shrink-0 ${
              gov.isBlocked ? "text-red-400" : "text-amber-400"
            }`}
          />
          <p
            className={`text-sm ${
              gov.isBlocked ? "text-red-200/80" : "text-amber-200/80"
            }`}
          >
            {gov.readOnlyReason || gov.restrictedReason}
          </p>
        </div>
      )}

      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-400" />
            Configuration des fiches mission
          </h1>
          <p className="text-muted-foreground mt-1">
            Definissez les sections et champs du formulaire de creation de mission.
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-500/30 text-emerald-300 bg-emerald-500/10 shrink-0"
        >
          <LayoutList className="w-3.5 h-3.5 mr-1.5" />
          {sections.length} sections, {totalFields} champs
        </Badge>
      </div>

      {/* ═══ Two-panel layout ═══ */}
      <div className="flex gap-6 min-h-[600px]">
        {/* ── Left panel: Section list ── */}
        <div className="w-80 shrink-0 flex flex-col">
          <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            {sections.map((section, idx) => {
              const isSelected = section.id === selectedSectionId;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedSectionId(section.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg border transition-all group",
                    isSelected
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-[#111827]/40 border-border/30 hover:border-border/60 hover:bg-[#1a1a1a]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {/* Drag handle (visual) + reorder buttons */}
                    <div className="flex flex-col items-center gap-0.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                      <div className="flex gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSectionUp(section);
                          }}
                          disabled={idx === 0 || !canEditSchema}
                          className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSectionDown(section);
                          }}
                          disabled={idx === sections.length - 1 || !canEditSchema}
                          className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Icon + Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{getSectionIcon(section)}</span>
                        <span
                          className={cn(
                            "text-sm font-medium truncate",
                            isSelected ? "text-emerald-300" : "text-foreground"
                          )}
                        >
                          {section.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {section.is_system && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0 border-blue-500/30 text-blue-400 bg-blue-500/10"
                          >
                            Systeme
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {section.fields?.length || 0} champs
                        </span>
                      </div>
                    </div>

                    {/* Visibility toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSectionVisible(section);
                      }}
                      disabled={!canEditSchema}
                      className={cn(
                        "p-1 rounded transition-colors shrink-0",
                        !canEditSchema && "opacity-50 cursor-not-allowed",
                        section.is_visible
                          ? "text-emerald-400 hover:bg-emerald-500/10"
                          : "text-muted-foreground/40 hover:bg-white/5"
                      )}
                      title={section.is_visible ? "Visible" : "Masquee"}
                    >
                      {section.is_visible ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Required toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSectionRequired(section);
                      }}
                      disabled={!canEditSchema}
                      className={cn(
                        "p-1 rounded transition-colors shrink-0",
                        !canEditSchema && "opacity-50 cursor-not-allowed",
                        section.is_required
                          ? "text-amber-400 hover:bg-amber-500/10"
                          : "text-muted-foreground/40 hover:bg-white/5"
                      )}
                      title={section.is_required ? "Obligatoire" : "Optionnel"}
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add section button */}
          <Button
            variant="outline"
            className="w-full mt-3 gap-2 border-dashed border-border/30 text-muted-foreground hover:text-emerald-300 hover:border-emerald-500/30"
            onClick={() => setCreateSectionOpen(true)}
            disabled={!canEditSchema}
          >
            <Plus className="w-4 h-4" />
            Ajouter une section
          </Button>
        </div>

        {/* ── Right panel: Section detail + fields ── */}
        <div className="flex-1 min-w-0">
          {selectedSection ? (
            <div className="space-y-5">
              {/* Section header */}
              <Card className="bg-[#111827]/40 border-border/30">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-display text-foreground flex items-center gap-2">
                        <span className="text-xl">{getSectionIcon(selectedSection)}</span>
                        {selectedSection.name}
                        {selectedSection.is_system && (
                          <Badge
                            variant="outline"
                            className="text-xs border-blue-500/30 text-blue-400 bg-blue-500/10"
                          >
                            Systeme
                          </Badge>
                        )}
                      </h2>
                      {selectedSection.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedSection.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Section settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0D0D0D]/60 border border-border/20">
                      <Label className="text-xs text-muted-foreground">Visible</Label>
                      <Switch
                        checked={selectedSection.is_visible}
                        onCheckedChange={() => handleToggleSectionVisible(selectedSection)}
                      />
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0D0D0D]/60 border border-border/20">
                      <Label className="text-xs text-muted-foreground">Obligatoire</Label>
                      <Switch
                        checked={selectedSection.is_required}
                        onCheckedChange={() => handleToggleSectionRequired(selectedSection)}
                      />
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0D0D0D]/60 border border-border/20">
                      <Label className="text-xs text-muted-foreground">Replie par defaut</Label>
                      <Switch
                        checked={selectedSection.is_collapsed_default}
                        onCheckedChange={() => handleToggleSectionCollapsed(selectedSection)}
                      />
                    </div>
                  </div>

                  {/* Applicable poles */}
                  <div className="space-y-1.5 mb-3">
                    <Label className="text-xs text-muted-foreground">
                      Poles concernes{" "}
                      <span className="text-muted-foreground/60">(vide = tous les poles)</span>
                    </Label>
                    <ChipMultiSelect
                      options={POLE_OPTIONS}
                      selected={selectedSection.applicable_poles || []}
                      onChange={handleUpdateSectionPoles}
                    />
                  </div>

                  {/* Applicable types */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Types de mission{" "}
                      <span className="text-muted-foreground/60">(vide = tous les types)</span>
                    </Label>
                    <ChipMultiSelect
                      options={MISSION_TYPE_OPTIONS}
                      selected={selectedSection.applicable_types || []}
                      onChange={handleUpdateSectionTypes}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Fields list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Champs ({selectedSection.fields?.length || 0})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-border/30 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                    onClick={() => setCreateFieldOpen(true)}
                    disabled={!canEditSchema}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter un champ
                  </Button>
                </div>

                {(!selectedSection.fields || selectedSection.fields.length === 0) ? (
                  <Card className="bg-[#111827]/40 border-border/30">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <LayoutList className="w-10 h-10 text-muted-foreground/20 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Aucun champ dans cette section.
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2 text-emerald-400"
                        onClick={() => setCreateFieldOpen(true)}
                        disabled={!canEditSchema}
                      >
                        Ajouter le premier champ
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-1.5">
                    {selectedSection.fields.map((field, idx) => (
                      <Card
                        key={field.id}
                        className={cn(
                          "bg-[#111827]/40 border-border/30 transition-colors hover:border-border/50",
                          !field.is_visible && "opacity-50"
                        )}
                      >
                        <CardContent className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {/* Order number */}
                            <span className="text-xs font-mono text-muted-foreground/60 w-5 text-right shrink-0">
                              {idx + 1}
                            </span>

                            {/* Label + type */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-foreground truncate">
                                  {field.label}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 border-border/30 text-muted-foreground bg-[#0D0D0D]/60 shrink-0"
                                >
                                  {FIELD_TYPE_LABELS[field.field_type] || field.field_type}
                                </Badge>
                                {field.is_system && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 border-blue-500/30 text-blue-400 bg-blue-500/10 shrink-0"
                                  >
                                    Systeme
                                  </Badge>
                                )}
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] px-1.5 py-0 shrink-0",
                                    VISIBILITY_COLORS[field.visibility_level]
                                  )}
                                >
                                  {VISIBILITY_LABELS[field.visibility_level]}
                                </Badge>
                              </div>
                              {field.helper_text && (
                                <p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">
                                  {field.helper_text}
                                </p>
                              )}
                            </div>

                            {/* Required toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleFieldRequired(field)}
                              disabled={!canEditSchema}
                              className={cn(
                                "p-1.5 rounded transition-colors shrink-0",
                                !canEditSchema && "opacity-50 cursor-not-allowed",
                                field.is_required
                                  ? "text-amber-400 hover:bg-amber-500/10"
                                  : "text-muted-foreground/30 hover:bg-white/5"
                              )}
                              title={field.is_required ? "Obligatoire" : "Optionnel"}
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>

                            {/* Visible toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleFieldVisible(field)}
                              disabled={!canEditSchema}
                              className={cn(
                                "p-1.5 rounded transition-colors shrink-0",
                                !canEditSchema && "opacity-50 cursor-not-allowed",
                                field.is_visible
                                  ? "text-emerald-400 hover:bg-emerald-500/10"
                                  : "text-muted-foreground/30 hover:bg-white/5"
                              )}
                              title={field.is_visible ? "Visible" : "Masque"}
                            >
                              {field.is_visible ? (
                                <Eye className="w-3.5 h-3.5" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Admin only toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleFieldAdminOnly(field)}
                              disabled={!canEditSchema}
                              className={cn(
                                "p-1.5 rounded transition-colors shrink-0",
                                !canEditSchema && "opacity-50 cursor-not-allowed",
                                field.is_admin_only
                                  ? "text-red-400 hover:bg-red-500/10"
                                  : "text-muted-foreground/30 hover:bg-white/5"
                              )}
                              title={field.is_admin_only ? "Admin seulement" : "Visible par tous"}
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                              onClick={() => handleEditField(field)}
                              disabled={!canEditSchema}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>

                            {/* Delete button (non-system only) */}
                            {!field.is_system && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground/50 hover:text-destructive shrink-0"
                                onClick={() => handleDeleteField(field)}
                                disabled={!canEditSchema}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty state: no section selected */
            <Card className="bg-[#111827]/40 border-border/30 h-full">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <Settings className="w-12 h-12 text-muted-foreground/20 mb-3" />
                <h3 className="text-lg font-display text-foreground mb-1">
                  Selectionnez une section
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Cliquez sur une section dans le panneau de gauche pour configurer
                  ses champs et parametres.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ═══ Dialogs & Sheets ═══ */}
      <CreateSectionDialog
        open={createSectionOpen}
        onOpenChange={setCreateSectionOpen}
        onCreate={handleCreateSection}
        isCreating={createSection.isPending}
        nextOrder={sections.length > 0 ? Math.max(...sections.map((s) => s.display_order)) + 1 : 1}
        associationId={association.id}
      />

      {selectedSection && (
        <CreateFieldDialog
          open={createFieldOpen}
          onOpenChange={setCreateFieldOpen}
          onCreate={handleCreateField}
          isCreating={createField.isPending}
          sectionId={selectedSection.id}
          associationId={association.id}
          nextOrder={
            selectedSection.fields && selectedSection.fields.length > 0
              ? Math.max(...selectedSection.fields.map((f) => f.display_order)) + 1
              : 1
          }
        />
      )}

      <FieldEditorSheet
        field={editingField}
        open={fieldSheetOpen}
        onOpenChange={setFieldSheetOpen}
        onSave={handleSaveField}
        isSaving={updateField.isPending}
        canEdit={canEditSchema}
      />
    </div>
  );
};

export default MissionSchemaConfigurator;
