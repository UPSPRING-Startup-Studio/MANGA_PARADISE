import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Trash2,
  Copy,
  Settings2,
  Type,
  Mail,
  Phone,
  Calendar,
  Hash,
  AlignLeft,
  ListChecks,
  CircleDot,
  CheckSquare,
  SquareCheck,
  ShieldCheck,
  PenLine,
  Heading,
  FileText,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { FormStep, FormField, FieldType } from "@/types/membershipForm";

interface StepEditorProps {
  step: FormStep;
  onUpdateStep: (updates: Partial<Pick<FormStep, "title" | "description">>) => void;
  onAddField: (type: FieldType) => void;
  onRemoveField: (fieldKey: string) => void;
  onDuplicateField: (fieldKey: string) => void;
  onReorderFields: (from: number, to: number) => void;
  selectedFieldKey: string | null;
  onSelectField: (key: string | null) => void;
}

const FIELD_TYPE_ICON: Record<string, React.ReactNode> = {
  text: <Type className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
  tel: <Phone className="w-3.5 h-3.5" />,
  date: <Calendar className="w-3.5 h-3.5" />,
  number: <Hash className="w-3.5 h-3.5" />,
  textarea: <AlignLeft className="w-3.5 h-3.5" />,
  select: <ListChecks className="w-3.5 h-3.5" />,
  radio: <CircleDot className="w-3.5 h-3.5" />,
  checkbox: <CheckSquare className="w-3.5 h-3.5" />,
  "checkbox-group": <SquareCheck className="w-3.5 h-3.5" />,
  consent: <ShieldCheck className="w-3.5 h-3.5" />,
  signature: <PenLine className="w-3.5 h-3.5" />,
  heading: <Heading className="w-3.5 h-3.5" />,
  paragraph: <FileText className="w-3.5 h-3.5" />,
  divider: <Minus className="w-3.5 h-3.5" />,
};

const FIELD_TYPE_GROUPS = [
  {
    label: "Saisie",
    items: [
      { type: "text" as FieldType, label: "Texte" },
      { type: "email" as FieldType, label: "Email" },
      { type: "tel" as FieldType, label: "Telephone" },
      { type: "date" as FieldType, label: "Date" },
      { type: "number" as FieldType, label: "Nombre" },
      { type: "textarea" as FieldType, label: "Zone de texte" },
    ],
  },
  {
    label: "Choix",
    items: [
      { type: "select" as FieldType, label: "Liste deroulante" },
      { type: "radio" as FieldType, label: "Choix unique" },
      { type: "checkbox" as FieldType, label: "Case a cocher" },
      { type: "checkbox-group" as FieldType, label: "Choix multiples" },
    ],
  },
  {
    label: "Legal",
    items: [
      { type: "consent" as FieldType, label: "Consentement" },
      { type: "signature" as FieldType, label: "Signature" },
    ],
  },
  {
    label: "Mise en page",
    items: [
      { type: "heading" as FieldType, label: "Titre" },
      { type: "paragraph" as FieldType, label: "Paragraphe" },
      { type: "divider" as FieldType, label: "Separateur" },
    ],
  },
];

// ── Sortable field row ──

function SortableFieldRow({
  field,
  isSelected,
  onSelect,
  onRemove,
  onDuplicate,
}: {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors",
        isSelected
          ? "bg-sakura/10 border border-sakura/30"
          : "bg-white/5 border border-transparent hover:border-white/10"
      )}
      onClick={onSelect}
    >
      <button
        className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <div className="text-muted-foreground">
        {FIELD_TYPE_ICON[field.type] || <Settings2 className="w-3.5 h-3.5" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">
          {field.label || field.content?.slice(0, 40) || field.type}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {field.key}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {field.validation?.required && (
          <Badge variant="outline" className="text-[9px] h-4 px-1 text-sakura border-sakura/30">
            Requis
          </Badge>
        )}
        {field.visibleWhen && (
          <Badge variant="outline" className="text-[9px] h-4 px-1">
            Cond.
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="p-1 rounded hover:bg-white/10 text-muted-foreground"
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

const StepEditor = ({
  step,
  onUpdateStep,
  onAddField,
  onRemoveField,
  onDuplicateField,
  onReorderFields,
  selectedFieldKey,
  onSelectField,
}: StepEditorProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = step.fields.findIndex((f) => f.key === active.id);
    const newIndex = step.fields.findIndex((f) => f.key === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderFields(oldIndex, newIndex);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Step header */}
      <div className="p-4 border-b border-border/30 space-y-3">
        <Input
          value={step.title}
          onChange={(e) => onUpdateStep({ title: e.target.value })}
          className="text-lg font-display bg-transparent border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-sakura h-auto py-1"
          placeholder="Titre de l'etape"
        />
        <Textarea
          value={step.description || ""}
          onChange={(e) => onUpdateStep({ description: e.target.value || undefined })}
          className="text-sm bg-transparent border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-sakura min-h-0 h-auto py-1 resize-none"
          placeholder="Description (facultatif)"
          rows={1}
        />
      </div>

      {/* Fields list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={step.fields.map((f) => f.key)}
            strategy={verticalListSortingStrategy}
          >
            {step.fields.map((field) => (
              <SortableFieldRow
                key={field.key}
                field={field}
                isSelected={selectedFieldKey === field.key}
                onSelect={() => onSelectField(field.key)}
                onRemove={() => onRemoveField(field.key)}
                onDuplicate={() => onDuplicateField(field.key)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {step.fields.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Settings2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun champ dans cette etape</p>
          </div>
        )}
      </div>

      {/* Add field */}
      <div className="p-3 border-t border-border/30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un champ
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="center">
            {FIELD_TYPE_GROUPS.map((group, gi) => (
              <div key={group.label}>
                {gi > 0 && <DropdownMenuSeparator />}
                <div className="px-2 py-1 text-[10px] text-muted-foreground font-medium">
                  {group.label}
                </div>
                {group.items.map((item) => (
                  <DropdownMenuItem
                    key={item.type}
                    onClick={() => onAddField(item.type)}
                    className="gap-2"
                  >
                    {FIELD_TYPE_ICON[item.type]}
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default StepEditor;
