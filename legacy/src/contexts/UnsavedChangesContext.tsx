import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UnsavedChangesModal } from "@/components/ui/UnsavedChangesModal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DirtyEntry {
  isDirty: boolean;
  onSave: (() => Promise<void>) | null;
}

interface UnsavedChangesContextValue {
  /** True when at least one registered component has unsaved changes. */
  isAnyDirty: boolean;

  /**
   * Register (or update) a component's dirty state.
   * Call this whenever isDirty or onSave changes.
   *
   * @param id      Unique key for the component (e.g. "settings-otaku")
   * @param isDirty Whether the component currently has unsaved changes
   * @param onSave  Optional async save handler for "Save and leave" in the modal
   */
  register: (id: string, isDirty: boolean, onSave?: () => Promise<void>) => void;

  /**
   * Remove a component from the registry (call in cleanup / useEffect return).
   */
  unregister: (id: string) => void;

  /**
   * Attempt a navigation action.
   * If any component is dirty the action is deferred and the confirmation modal
   * is displayed. If clean the action executes immediately.
   */
  requestNavigation: (fn: () => void) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const registry = useRef<Map<string, DirtyEntry>>(new Map());
  const [isAnyDirty, setIsAnyDirty] = useState(false);

  // Pending internal navigation (sidebar tab switches, etc.)
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [pendingSaveHandler, setPendingSaveHandler] = useState<(() => Promise<void>) | null>(null);

  // ── Recompute isAnyDirty from the registry ──────────────────────────────
  const sync = useCallback(() => {
    const anyDirty = Array.from(registry.current.values()).some((e) => e.isDirty);
    setIsAnyDirty(anyDirty);
  }, []);

  const register = useCallback(
    (id: string, isDirty: boolean, onSave?: () => Promise<void>) => {
      registry.current.set(id, { isDirty, onSave: onSave ?? null });
      sync();
    },
    [sync]
  );

  const unregister = useCallback(
    (id: string) => {
      registry.current.delete(id);
      sync();
    },
    [sync]
  );

  const requestNavigation = useCallback((fn: () => void) => {
    const dirty = Array.from(registry.current.values()).some((e) => e.isDirty);
    if (!dirty) {
      fn();
      return;
    }
    const dirtyEntry = Array.from(registry.current.values()).find(
      (e) => e.isDirty && e.onSave
    );
    setPendingSaveHandler(dirtyEntry?.onSave ?? null);
    setPendingNavigation(() => fn);
  }, []);

  const clearPending = useCallback(() => {
    setPendingNavigation(null);
    setPendingSaveHandler(null);
  }, []);

  // ── beforeunload (browser refresh / tab close) ───────────────────────────
  useEffect(() => {
    if (!isAnyDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isAnyDirty]);

  // ── Block browser back/forward when dirty (popstate) ────────────────────
  const location = useLocation();
  const navigate = useNavigate();
  const isAnyDirtyRef = useRef(isAnyDirty);
  useEffect(() => { isAnyDirtyRef.current = isAnyDirty; }, [isAnyDirty]);

  const [routerPending, setRouterPending] = useState<string | null>(null);

  useEffect(() => {
    if (!isAnyDirty) return;

    // Push a duplicate entry so the first "back" stays on the same page
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      if (isAnyDirtyRef.current) {
        // Re-push so user stays on current page while modal is open
        window.history.pushState(null, "", window.location.href);
        setRouterPending(location.pathname);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnyDirty, location.pathname]);

  // ── Derive save handler for the router blocker modal ─────────────────────
  const routerSaveHandler = React.useMemo(() => {
    const entry = Array.from(registry.current.values()).find(
      (e) => e.isDirty && e.onSave
    );
    return entry?.onSave ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnyDirty]);

  return (
    <UnsavedChangesContext.Provider value={{ isAnyDirty, register, unregister, requestNavigation }}>
      {children}

      {/* ── Modal: Browser back/forward navigation block ── */}
      <UnsavedChangesModal
        isOpen={routerPending !== null}
        onSaveAndLeave={
          routerSaveHandler
            ? async () => {
                await routerSaveHandler();
                const dest = routerPending;
                setRouterPending(null);
                if (dest) navigate(-1);
              }
            : null
        }
        onLeaveWithoutSaving={() => {
          const dest = routerPending;
          setRouterPending(null);
          if (dest) navigate(-1);
        }}
        onContinueEditing={() => setRouterPending(null)}
      />

      {/* ── Modal: Internal tab / section navigation ── */}
      <UnsavedChangesModal
        isOpen={pendingNavigation !== null}
        onSaveAndLeave={
          pendingSaveHandler
            ? async () => {
                await pendingSaveHandler();
                pendingNavigation?.();
                clearPending();
              }
            : null
        }
        onLeaveWithoutSaving={() => {
          pendingNavigation?.();
          clearPending();
        }}
        onContinueEditing={clearPending}
      />
    </UnsavedChangesContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Access the unsaved-changes context.
 * Must be used inside <UnsavedChangesProvider>.
 */
export function useUnsavedChanges(): UnsavedChangesContextValue {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) {
    throw new Error("useUnsavedChanges must be used within <UnsavedChangesProvider>");
  }
  return ctx;
}

/**
 * Convenience hook: registers a component's dirty state and keeps the
 * registration in sync automatically.
 *
 * The `onSave` function reference is intentionally stabilised via a ref,
 * so callers can pass an unstable (non-memoised) callback without causing
 * unnecessary re-registrations.
 *
 * Usage:
 *   useRegisterDirty("settings-otaku", isDirty, handleSave);
 */
export function useRegisterDirty(
  id: string,
  isDirty: boolean,
  onSave?: () => Promise<void>
) {
  const { register, unregister } = useUnsavedChanges();

  // Keep the latest onSave in a ref so re-registration is not needed on every render
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  });

  useEffect(() => {
    // Register a stable wrapper that always delegates to the current onSave ref
    register(
      id,
      isDirty,
      onSaveRef.current != null
        ? async () => { await onSaveRef.current?.(); }
        : undefined
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isDirty, register]);

  // Cleanup on unmount
  useEffect(() => {
    return () => unregister(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, unregister]);
}
