import { useState, useCallback } from "react";

export function usePhotoSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelection = useCallback((photoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      if (next.size === 0) {
        setIsSelectionMode(false);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((photoIds: string[]) => {
    setSelectedIds(new Set(photoIds));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  }, []);

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const isSelected = useCallback(
    (photoId: string) => selectedIds.has(photoId),
    [selectedIds],
  );

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isSelectionMode,
    toggleSelection,
    selectAll,
    deselectAll,
    enterSelectionMode,
    isSelected,
  };
}
