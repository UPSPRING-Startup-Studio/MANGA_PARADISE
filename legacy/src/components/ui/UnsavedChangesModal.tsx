import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Edit3, Loader2, LogOut, Save } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UnsavedChangesModalProps {
  /** Controls whether the modal is open. */
  isOpen: boolean;

  /**
   * Optional async save handler.
   * When provided, the "Save and leave" button calls it before navigating.
   * When null/undefined, the button is hidden.
   */
  onSaveAndLeave?: (() => Promise<void>) | null;

  /** Called when the user chooses to leave WITHOUT saving. */
  onLeaveWithoutSaving: () => void;

  /** Called when the user chooses to stay and keep editing. */
  onContinueEditing: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Confirmation modal shown when the user attempts to navigate away
 * from a page that has unsaved changes.
 *
 * Three actions:
 *   1. Save and leave  (only shown when onSaveAndLeave is provided)
 *   2. Leave without saving
 *   3. Continue editing
 */
export function UnsavedChangesModal({
  isOpen,
  onSaveAndLeave,
  onLeaveWithoutSaving,
  onContinueEditing,
}: UnsavedChangesModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndLeave = async () => {
    if (!onSaveAndLeave) return;
    setIsSaving(true);
    try {
      await onSaveAndLeave();
      onLeaveWithoutSaving(); // navigate after successful save
    } catch {
      // Save failed – stay on page so the user can fix errors
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSaving) onContinueEditing();
      }}
    >
      <DialogContent className="sm:max-w-md bg-card border border-border shadow-2xl">
        <DialogHeader className="space-y-4 pb-2">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-sakura/10 border border-sakura/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-sakura" aria-hidden="true" />
          </div>

          <DialogTitle className="font-display text-xl text-center tracking-wide">
            Modifications non sauvegardées
          </DialogTitle>

          <DialogDescription className="font-body text-center text-muted-foreground leading-relaxed">
            Tu as des modifications en attente.
            <br />
            Que veux-tu faire avant de quitter cette section&nbsp;?
          </DialogDescription>
        </DialogHeader>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          {/* Save and leave */}
          {onSaveAndLeave && (
            <Button
              onClick={handleSaveAndLeave}
              disabled={isSaving}
              className="w-full h-11 bg-sakura hover:bg-sakura/90 text-white font-display tracking-wide"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? "Sauvegarde..." : "Sauvegarder et quitter"}
            </Button>
          )}

          {/* Leave without saving */}
          <Button
            variant="outline"
            onClick={onLeaveWithoutSaving}
            disabled={isSaving}
            className="w-full h-11 font-body border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Quitter sans sauvegarder
          </Button>

          {/* Stay */}
          <Button
            variant="ghost"
            onClick={onContinueEditing}
            disabled={isSaving}
            className="w-full h-11 font-body text-muted-foreground hover:text-foreground"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Continuer l'édition
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
