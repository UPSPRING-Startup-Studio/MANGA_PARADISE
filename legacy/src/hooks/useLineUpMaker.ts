import { useState, useCallback } from "react";
import { format, parseISO } from "date-fns";

export interface LineUpMapping {
  [dateStr: string]: string | null; // date -> cosplay_id (null for civil)
}

export interface UseLineUpMakerReturn {
  mapping: LineUpMapping;
  setMapping: (mapping: LineUpMapping) => void;
  setCosplayForDate: (dateStr: string, cosplayId: string | null) => void;
  getCosplayForDate: (dateStr: string) => string | null;
  clearMapping: () => void;
}

/**
 * Hook pour gérer le mapping entre les jours d'un événement et les costumes du vestiaire
 * Permet de créer un line-up personnalisé pour chaque jour
 */
export const useLineUpMaker = (): UseLineUpMakerReturn => {
  const [mapping, setMapping] = useState<LineUpMapping>({});

  const setCosplayForDate = useCallback((dateStr: string, cosplayId: string | null) => {
    setMapping((prev) => ({
      ...prev,
      [dateStr]: cosplayId,
    }));
  }, []);

  const getCosplayForDate = useCallback((dateStr: string): string | null => {
    return mapping[dateStr] || null;
  }, [mapping]);

  const clearMapping = useCallback(() => {
    setMapping({});
  }, []);

  return {
    mapping,
    setMapping,
    setCosplayForDate,
    getCosplayForDate,
    clearMapping,
  };
};
