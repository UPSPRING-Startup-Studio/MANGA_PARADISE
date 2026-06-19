/**
 * useWardrobeItems Hook
 * Unified data source for the Wardrobe page
 * Fetches ALL cosplay_plans (projects + migrated incarnations)
 * and provides a standardized interface for the grid
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CraftType = 'handmade' | 'bought' | 'mixed' | null;
export type WardrobeItemStatus = 'wishlist' | 'started' | 'paused' | 'finished';

export interface WardrobeItem {
  id: string;
  user_id: string;
  character_name: string;
  universe: string;
  // Image fields - cosplay_plans uses image_url, vestiaire uses user_image_url
  image_url: string | null;
  user_image_url?: string | null;
  official_image_url?: string | null;
  // Progress & status
  progress_level: number;
  status: WardrobeItemStatus;
  priority: number;
  // Wardrobe specific
  is_in_wardrobe: boolean;
  craft_type: CraftType;
  folder_id: string | null;
  // Metadata
  target_year: number;
  created_at: string;
  // Event targeting
  target_event_id?: string | null;
  // Source tracking
  source_vestiaire_id?: string | null;
}

/**
 * Fetches all cosplay_plans for the wardrobe
 * This is the single source of truth after migration
 */
export const useWardrobeItems = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['wardrobe-items', userId],
    queryFn: async (): Promise<WardrobeItem[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('cosplay_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Normalize the data to ensure consistent image_url
      // Using 'any' cast because new columns (is_in_wardrobe, craft_type, folder_id, etc.)
      // are not yet in the auto-generated Supabase types
      return (data || []).map((item: any) => ({
        ...item,
        // Prefer user_image_url for wardrobe items (migrated from vestiaire)
        // Fall back to image_url for regular cosplans
        image_url: item.user_image_url || item.image_url || null,
        is_in_wardrobe: item.is_in_wardrobe ?? false,
        craft_type: (item.craft_type as CraftType) ?? null,
        folder_id: item.folder_id ?? null,
        source_vestiaire_id: item.source_vestiaire_id ?? null,
      })) as WardrobeItem[];
    },
    enabled: !!userId,
  });
};

/**
 * Fetches wardrobe items filtered by folder
 */
export const useWardrobeItemsByFolder = (
  userId: string | undefined,
  folderId: string | null
) => {
  const { data: allItems = [], ...rest } = useWardrobeItems(userId);

  const filteredItems = folderId === null
    ? allItems
    : allItems.filter((item) => item.folder_id === folderId);

  return { data: filteredItems, ...rest };
};
