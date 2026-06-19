/**
 * useCosplayProject
 * Single hook to fetch one cosplay project by ID with all enriched fields.
 * Source of truth: cosplay_plans table (after Lot 1 unification).
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CosplayProject {
  id: string;
  user_id: string;
  character_name: string;
  character_id: string | null;
  universe: string;
  universe_id: string | null;
  target_year: number;
  progress_level: number;
  status: string;
  priority: number;
  image_url: string | null;
  user_image_url: string | null;
  official_image_url: string | null;
  notes: string | null;
  budget: number | null;
  deadline: string | null;
  target_event_id: string | null;
  group_id: string | null;
  auto_progress: boolean;
  is_in_wardrobe: boolean;
  craft_type: string | null;
  folder_id: string | null;
  source_vestiaire_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useCosplayProject = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ["cosplay-project", projectId],
    queryFn: async (): Promise<CosplayProject | null> => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from("cosplay_plans")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // not found
        throw error;
      }

      const item = data as any;
      return {
        ...item,
        image_url: item.user_image_url || item.image_url || null,
        is_in_wardrobe: item.is_in_wardrobe ?? false,
        craft_type: item.craft_type ?? null,
        folder_id: item.folder_id ?? null,
        source_vestiaire_id: item.source_vestiaire_id ?? null,
        completed_at: item.completed_at ?? null,
        auto_progress: item.auto_progress ?? false,
      } as CosplayProject;
    },
    enabled: !!projectId,
  });
};
