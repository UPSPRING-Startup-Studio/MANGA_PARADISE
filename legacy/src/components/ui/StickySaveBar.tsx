import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SaveStatus = "clean" | "dirty" | "saving" | "saved" | "error";

interface StickySaveBarProps {
  /** Current save status – controls visibility and appearance. */
  status: SaveStatus;

  /** Called when the user clicks "Sauvegarder". */
  onSave: () => void;

  /**
   * Called when the user clicks "Annuler".
   * Should reset all form state back to the last saved snapshot.
   */
  onDiscard: () => void;

  /** Optional error message shown in "error" state. */
  errorMessage?: string;

  /**
   * Optional accessible label for the region.
   * @default "Modifications non sauvegardées"
   */
  label?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Sticky bar that slides up from the bottom of the viewport when the user
 * has unsaved changes. Handles all four visible states:
 *   dirty   – pulsing indicator + Annuler + Sauvegarder
 *   saving  – spinner + disabled button
 *   saved   – green confirmation (auto-hides via parent after ~2 s)
 *   error   – error message + retry / discard buttons
 */
export function StickySaveBar({
  status,
  onSave,
  onDiscard,
  errorMessage,
  label = "Modifications non sauvegardées",
}: StickySaveBarProps) {
  const isVisible = status !== "clean";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="region"
          aria-label={label}
          aria-live="polite"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 pt-2 pointer-events-none"
        >
          <div
            className="
              w-full max-w-2xl
              bg-card border border-border
              shadow-2xl shadow-black/20
              rounded-2xl
              px-5 py-3.5
              flex items-center gap-3
              pointer-events-auto
            "
          >
            {/* ── Status indicator + message ── */}
            <div className="flex-1 flex items-center gap-3 min-w-0">

              {status === "dirty" && (
                <>
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-sakura shrink-0 animate-pulse"
                    aria-hidden="true"
                  />
                  <span className="font-body text-sm text-foreground truncate">
                    Tu as des modifications non sauvegardées
                  </span>
                </>
              )}

              {status === "saving" && (
                <>
                  <Loader2
                    className="w-4 h-4 text-sakura shrink-0 animate-spin"
                    aria-hidden="true"
                  />
                  <span className="font-body text-sm text-muted-foreground">
                    Sauvegarde en cours…
                  </span>
                </>
              )}

              {status === "saved" && (
                <>
                  <CheckCircle2
                    className="w-4 h-4 text-emerald-500 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-body text-sm text-emerald-500 font-medium">
                    Modifications sauvegardées !
                  </span>
                </>
              )}

              {status === "error" && (
                <>
                  <AlertCircle
                    className="w-4 h-4 text-destructive shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-body text-sm text-destructive truncate">
                    {errorMessage ?? "Erreur lors de la sauvegarde"}
                  </span>
                </>
              )}
            </div>

            {/* ── Action buttons ── */}

            {/* dirty or error: Annuler + Sauvegarder */}
            {(status === "dirty" || status === "error") && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDiscard}
                  className="font-body text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-sakura"
                  aria-label="Annuler les modifications"
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={onSave}
                  className="bg-sakura hover:bg-sakura/90 text-white font-display tracking-wide focus-visible:ring-2 focus-visible:ring-sakura focus-visible:ring-offset-2"
                  aria-label="Sauvegarder les modifications"
                >
                  <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                  Sauvegarder
                </Button>
              </div>
            )}

            {/* saving: spinner button (disabled) */}
            {status === "saving" && (
              <Button
                size="sm"
                disabled
                className="bg-sakura/50 text-white font-display tracking-wide shrink-0 cursor-not-allowed"
                aria-label="Sauvegarde en cours…"
              >
                <Loader2
                  className="w-4 h-4 mr-2 animate-spin"
                  aria-hidden="true"
                />
                Sauvegarde…
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
