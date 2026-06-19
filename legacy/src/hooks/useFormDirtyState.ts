import { useMemo } from "react";

/**
 * Compares a saved snapshot vs current form values to determine if the form is dirty.
 * Uses JSON serialization for deep equality (safe for plain objects, arrays, primitives).
 *
 * Returns false while savedValues is null/undefined (data not yet loaded from server).
 *
 * @param savedValues - The last-saved state (null = not yet loaded)
 * @param currentValues - The current form state
 */
export function useFormDirtyState<T>(
  savedValues: T | null | undefined,
  currentValues: T
): boolean {
  return useMemo(() => {
    if (savedValues == null) return false;
    try {
      return JSON.stringify(savedValues) !== JSON.stringify(currentValues);
    } catch {
      return false;
    }
    // currentValues is an object that may change every render but we want deep comparison
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedValues, currentValues]);
}
