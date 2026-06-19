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
  arrayMove,
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
  Layers,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FormStep } from "@/types/membershipForm";

interface StepsSidebarProps {
  steps: FormStep[];
  selectedStepId: string | null;
  onSelectStep: (id: string) => void;
  onAddStep: () => void;
  onRemoveStep: (id: string) => void;
  onDuplicateStep: (id: string) => void;
  onReorderSteps: (from: number, to: number) => void;
}

function SortableStep({
  step,
  index,
  isSelected,
  onSelect,
  onRemove,
  onDuplicate,
}: {
  step: FormStep;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dataFieldCount = step.fields.filter(
    (f) => !["heading", "paragraph", "divider"].includes(f.type)
  ).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-2 p-2.5 rounded-lg cursor-pointer transition-colors",
        isSelected
          ? "bg-sakura/10 border border-sakura/30"
          : "hover:bg-white/5 border border-transparent"
      )}
      onClick={onSelect}
    >
      <button
        className="mt-1 text-muted-foreground/50 hover:text-muted-foreground cursor-grab"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">
          {step.title || "Sans titre"}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-muted-foreground">
            {dataFieldCount} champ{dataFieldCount > 1 ? "s" : ""}
          </span>
          {step.visibleWhen && (
            <Badge variant="outline" className="text-[9px] h-4 px-1">
              <Eye className="w-2.5 h-2.5 mr-0.5" />
              Cond.
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="p-1 rounded hover:bg-white/10 text-muted-foreground"
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          title="Dupliquer"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title="Supprimer"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

const StepsSidebar = ({
  steps,
  selectedStepId,
  onSelectStep,
  onAddStep,
  onRemoveStep,
  onDuplicateStep,
  onReorderSteps,
}: StepsSidebarProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderSteps(oldIndex, newIndex);
    }
  };

  return (
    <div className="w-56 flex-shrink-0 border-r border-border/30 flex flex-col h-full">
      <div className="p-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-display text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Etapes ({steps.length})
          </h3>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddStep}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {steps.map((step, index) => (
              <SortableStep
                key={step.id}
                step={step}
                index={index}
                isSelected={selectedStepId === step.id}
                onSelect={() => onSelectStep(step.id)}
                onRemove={() => onRemoveStep(step.id)}
                onDuplicate={() => onDuplicateStep(step.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {steps.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">Aucune etape</p>
            <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={onAddStep}>
              <Plus className="w-3 h-3 mr-1" />
              Ajouter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepsSidebar;
