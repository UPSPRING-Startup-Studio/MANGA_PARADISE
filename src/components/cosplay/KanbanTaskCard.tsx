/**
 * KanbanTaskCard
 * A draggable task card for the Kanban board.
 * Displays: task label, category badge, price field (inline editable).
 * Uses @dnd-kit/sortable for drag & drop.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  Pencil,
  Check,
  X,
  Euro,
  Hammer,
  ShoppingBag,
  Shirt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CosplanTask, TaskCategory } from "@/hooks/useCosplanTasks";

// ─── Category Config ────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  TaskCategory,
  { label: string; icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  craft: {
    label: "Craft",
    icon: <Hammer className="w-3 h-3" />,
    color: "text-[hsl(var(--mp-saffron))]",
    bg: "bg-[hsl(var(--mp-saffron))]/10",
    border: "border-[hsl(var(--mp-saffron))]/30",
  },
  achat: {
    label: "Achat",
    icon: <ShoppingBag className="w-3 h-3" />,
    color: "text-[hsl(var(--mp-info))]",
    bg: "bg-[hsl(var(--mp-info))]/10",
    border: "border-[hsl(var(--mp-info))]/30",
  },
  dressing: {
    label: "Dressing",
    icon: <Shirt className="w-3 h-3" />,
    color: "text-[hsl(var(--mp-primary))]",
    bg: "bg-[hsl(var(--mp-primary))]/10",
    border: "border-[hsl(var(--mp-primary))]/30",
  },
};

// ─── Props ──────────────────────────────────────────────────────────────────────

interface KanbanTaskCardProps {
  task: CosplanTask;
  onUpdate: (updates: Partial<Pick<CosplanTask, "label" | "category" | "price">>) => void;
  onDelete: () => void;
  isDragging?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export const KanbanTaskCard = ({ task, onUpdate, onDelete, isDragging }: KanbanTaskCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(task.label);
  const [editPrice, setEditPrice] = useState<string>(task.price !== null ? String(task.price) : "");
  const [editCategory, setEditCategory] = useState<TaskCategory>(task.category);
  const labelInputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCurrentlyDragging = isDragging || isSortableDragging;

  // Focus label input when entering edit mode
  useEffect(() => {
    if (isEditing && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveEdit = () => {
    const trimmedLabel = editLabel.trim();
    if (!trimmedLabel) return;

    const priceValue = editPrice.trim() === "" ? null : parseFloat(editPrice);
    const validPrice = priceValue !== null && !isNaN(priceValue) ? priceValue : null;

    onUpdate({
      label: trimmedLabel,
      category: editCategory,
      price: validPrice,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditLabel(task.label);
    setEditPrice(task.price !== null ? String(task.price) : "");
    setEditCategory(task.category);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveEdit();
    if (e.key === "Escape") handleCancelEdit();
  };

  const categoryConfig = CATEGORY_CONFIG[task.category];

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: isCurrentlyDragging ? 0.5 : 1,
          scale: isCurrentlyDragging ? 1.02 : 1,
        }}
        exit={{ opacity: 0, scale: 0.9, height: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "group relative rounded-xl border p-3 cursor-default",
          "bg-black/40 backdrop-blur-md",
          "transition-all duration-200",
          isCurrentlyDragging
            ? "border-[hsl(var(--mp-primary))]/60 shadow-[0_0_20px_rgba(255,0,127,0.4)] z-50"
            : "border-white/10 hover:border-white/20 hover:shadow-[0_0_10px_rgba(255,255,255,0.05)]"
        )}
      >
        {/* Drag Handle + Content Row */}
        <div className="flex items-start gap-2">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 text-white/20 hover:text-white/60 transition-colors cursor-grab active:cursor-grabbing flex-shrink-0"
            aria-label="Déplacer la tâche"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {isEditing ? (
                /* ── Edit Mode ── */
                <motion.div
                  key="edit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {/* Label Input */}
                  <Input
                    ref={labelInputRef}
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-7 text-sm bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[hsl(var(--mp-primary))]/60"
                    placeholder="Nom de la tâche..."
                  />

                  {/* Category Selector */}
                  <div className="flex gap-1.5">
                    {(Object.keys(CATEGORY_CONFIG) as TaskCategory[]).map((cat) => {
                      const cfg = CATEGORY_CONFIG[cat];
                      return (
                        <button
                          key={cat}
                          onClick={() => setEditCategory(cat)}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md text-xs border transition-all",
                            editCategory === cat
                              ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                              : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                          )}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Price Input */}
                  <div className="relative">
                    <Euro className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="h-7 pl-6 text-sm bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[hsl(var(--mp-saffron))]/60"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Save / Cancel */}
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="h-6 px-2 text-xs bg-[hsl(var(--mp-primary))] hover:bg-[hsl(var(--mp-primary))]/80 text-white"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      OK
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-6 px-2 text-xs text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                /* ── View Mode ── */
                <motion.div
                  key="view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {/* Task Label */}
                  <p className="text-sm text-white leading-snug break-words">{task.label}</p>

                  {/* Footer: Category Badge + Price */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Category Badge */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                        categoryConfig.bg,
                        categoryConfig.color,
                        categoryConfig.border
                      )}
                    >
                      {categoryConfig.icon}
                      {categoryConfig.label}
                    </span>

                    {/* Price */}
                    {task.price !== null && task.price > 0 && (
                      <span className="text-xs text-[hsl(var(--mp-saffron))] font-semibold flex items-center gap-0.5">
                        <Euro className="w-3 h-3" />
                        {task.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons (visible on hover) */}
          {!isEditing && (
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={() => setIsEditing(true)}
                className="w-6 h-6 flex items-center justify-center rounded text-white/40 hover:text-[hsl(var(--mp-info))] hover:bg-[hsl(var(--mp-info))]/10 transition-all"
                aria-label="Modifier la tâche"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={onDelete}
                className="w-6 h-6 flex items-center justify-center rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                aria-label="Supprimer la tâche"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Drag Overlay Card (ghost while dragging) ───────────────────────────────────

export const KanbanTaskCardOverlay = ({ task }: { task: CosplanTask }) => {
  const categoryConfig = CATEGORY_CONFIG[task.category];

  return (
    <div
      className={cn(
        "rounded-xl border p-3 rotate-2",
        "bg-black/80 backdrop-blur-xl",
        "border-[hsl(var(--mp-primary))]/60 shadow-[0_0_30px_rgba(255,0,127,0.5)]",
        "w-64"
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <p className="text-sm text-white leading-snug">{task.label}</p>
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                categoryConfig.bg,
                categoryConfig.color,
                categoryConfig.border
              )}
            >
              {categoryConfig.icon}
              {categoryConfig.label}
            </span>
            {task.price !== null && task.price > 0 && (
              <span className="text-xs text-[hsl(var(--mp-saffron))] font-semibold flex items-center gap-0.5">
                <Euro className="w-3 h-3" />
                {task.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
