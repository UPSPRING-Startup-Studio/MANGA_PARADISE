import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Tag, CalendarDays, CalendarMinus, CheckSquare, X, Undo2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { UndoState } from "@/hooks/usePhotosBatchActions";

interface BatchActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onChangeType: (type: string) => void;
  onAssociateEvent: () => void;
  onRemoveEvent: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  // Undo support
  lastAction?: UndoState | null;
  onUndo?: () => void;
  isUndoing?: boolean;
  // Target label for the permanent summary
  targetLabel?: string | null;
}

const TYPES = [
  { value: "toi", label: "TOI", color: "bg-red-500" },
  { value: "original", label: "ORIGINAL", color: "bg-blue-500" },
  { value: "wip", label: "WIP", color: "bg-orange-500" },
  { value: "shooting", label: "SHOOTING", color: "bg-purple-500" },
  { value: "detail", label: "DÉTAIL", color: "bg-teal-500" },
] as const;

// ── Summary line sub-component ───────────────────────────────────────────────

function SummaryLine({
  selectedCount,
  targetLabel,
  lastAction,
}: {
  selectedCount: number;
  targetLabel?: string | null;
  lastAction?: UndoState | null;
}) {
  // Resolve which target text to display:
  // 1. Explicit targetLabel prop (from parent — e.g. drawer selection in progress)
  // 2. lastAction.label (just-completed action)
  // 3. "aucune" fallback
  const resolvedTarget = targetLabel || lastAction?.label || null;

  const countText =
    selectedCount === 0
      ? "Aucune photo sélectionnée"
      : `${selectedCount} photo${selectedCount > 1 ? "s" : ""} sélectionnée${selectedCount > 1 ? "s" : ""}`;

  const targetText = resolvedTarget
    ? `\u00AB\u00A0${resolvedTarget}\u00A0\u00BB`
    : "aucune";

  return (
    <div className="flex items-center gap-1.5 min-w-0 px-0.5">
      <Target className="w-3 h-3 text-teal-400 flex-shrink-0" />
      <p className="text-[11px] text-white/50 truncate leading-tight">
        <span className="text-white/70 font-medium">{countText}</span>
        <span className="text-white/20 mx-1">·</span>
        <span>
          Cible : <span className={resolvedTarget ? "text-teal-300/80" : "text-white/30"}>{targetText}</span>
        </span>
      </p>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function BatchActionBar({
  selectedCount,
  onDelete,
  onChangeType,
  onAssociateEvent,
  onRemoveEvent,
  onSelectAll,
  onDeselectAll,
  lastAction,
  onUndo,
  isUndoing,
  targetLabel,
}: BatchActionBarProps) {
  const showBar = selectedCount > 0 || !!lastAction;

  return (
    <AnimatePresence>
      {showBar && (
        <motion.div
          initial={{ y: 80, opacity: 0, x: "-50%" }}
          animate={{ y: 0, opacity: 1, x: "-50%" }}
          exit={{ y: 80, opacity: 0, x: "-50%" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md"
        >
          <div className="flex flex-col gap-1.5 px-3 sm:px-4 py-2.5 rounded-2xl bg-[#1A1A2E]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
            {/* ── Row 1 : Permanent summary ──────────────────────────────── */}
            <SummaryLine
              selectedCount={selectedCount}
              targetLabel={targetLabel}
              lastAction={lastAction}
            />

            {/* ── Row 2 : Actions ────────────────────────────────────────── */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
              {/* ── Undo-only mode (no selection, but lastAction exists) ── */}
              {lastAction && selectedCount === 0 && onUndo && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1.5 whitespace-nowrap"
                  onClick={onUndo}
                  disabled={isUndoing}
                >
                  <Undo2 className="w-4 h-4" />
                  <span className="text-xs">
                    {isUndoing
                      ? "Annulation…"
                      : `Annuler (${lastAction.snapshots.length} photo${lastAction.snapshots.length > 1 ? "s" : ""})`}
                  </span>
                </Button>
              )}

              {/* ── Selection controls + actions ─────────────────────────── */}
              {selectedCount > 0 && (
                <>
                  {/* Select all / Deselect all */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-white/50 hover:text-white hover:bg-white/10"
                    onClick={onSelectAll}
                    title="Tout sélectionner"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-white/50 hover:text-white hover:bg-white/10"
                    onClick={onDeselectAll}
                    title="Annuler la sélection"
                  >
                    <X className="w-4 h-4" />
                  </Button>

                  <div className="w-px h-6 bg-white/10" />

                  {/* Undo inline (when both selection + lastAction exist) */}
                  {lastAction && onUndo && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1.5"
                        onClick={onUndo}
                        disabled={isUndoing}
                        title="Annuler la dernière action"
                      >
                        <Undo2 className="w-4 h-4" />
                        <span className="text-xs hidden sm:inline">Annuler</span>
                      </Button>

                      <div className="w-px h-6 bg-white/10" />
                    </>
                  )}

                  {/* Type dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5"
                      >
                        <Tag className="w-4 h-4" />
                        <span className="text-xs hidden sm:inline">Type</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      side="top"
                      className="bg-[#1A1A2E] border-white/10 mb-2"
                    >
                      {TYPES.map((t) => (
                        <DropdownMenuItem
                          key={t.value}
                          onSelect={() => onChangeType(t.value)}
                          className="text-white hover:bg-white/10 cursor-pointer"
                        >
                          <span className={`w-2 h-2 rounded-full ${t.color} mr-2 flex-shrink-0`} />
                          {t.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Associate event */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5"
                    onClick={onAssociateEvent}
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-xs hidden sm:inline">Événement</span>
                  </Button>

                  {/* Remove event */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5"
                    onClick={onRemoveEvent}
                  >
                    <CalendarMinus className="w-4 h-4" />
                    <span className="text-xs hidden sm:inline">Retirer</span>
                  </Button>

                  {/* Delete with confirmation */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-xs hidden sm:inline">Supprimer</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#1A1A2E] border-white/10">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">
                          Supprimer {selectedCount} photo{selectedCount > 1 ? "s" : ""} ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Les photos et leurs tags seront définitivement supprimés.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                          Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={onDelete}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          Supprimer {selectedCount} photo{selectedCount > 1 ? "s" : ""}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
