/**
 * Custom hook for managing Cosplay Folders
 * Handles CRUD operations and hierarchical structure
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  CosplayFolder,
  CosplayFolderWithChildren,
  CreateCosplayFolderInput,
  UpdateCosplayFolderInput,
  MoveCosplayToFolderInput,
} from '@/types/cosplayFolder';

export function useCosplayFolders() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<CosplayFolder[]>([]);
  const [folderTree, setFolderTree] = useState<CosplayFolderWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build hierarchical tree structure from flat folder list
  const buildFolderTree = useCallback((flatFolders: CosplayFolder[]): CosplayFolderWithChildren[] => {
    const folderMap = new Map<string, CosplayFolderWithChildren>();
    const rootFolders: CosplayFolderWithChildren[] = [];

    // Initialize all folders with empty children array
    flatFolders.forEach((folder) => {
      folderMap.set(folder.id, { ...folder, children: [], isExpanded: false });
    });

    // Build tree structure
    flatFolders.forEach((folder) => {
      const folderWithChildren = folderMap.get(folder.id)!;
      
      if (folder.parent_id === null) {
        // Root level folder
        rootFolders.push(folderWithChildren);
      } else {
        // Child folder - add to parent's children
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children.push(folderWithChildren);
        }
      }
    });

    return rootFolders;
  }, []);

  // Fetch all folders for current user
  const fetchFolders = useCallback(async () => {
    if (!user) {
      setFolders([]);
      setFolderTree([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('cosplay_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      const fetchedFolders = data || [];
      setFolders(fetchedFolders);
      setFolderTree(buildFolderTree(fetchedFolders));
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch folders');
    } finally {
      setLoading(false);
    }
  }, [user, buildFolderTree]);

  // Create a new folder
  const createFolder = async (input: CreateCosplayFolderInput): Promise<CosplayFolder | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setError(null);

      const { data, error: createError } = await supabase
        .from('cosplay_folders')
        .insert({
          user_id: user.id,
          name: input.name.trim(),
          parent_id: input.parent_id || null,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Refresh folders list
      await fetchFolders();

      return data;
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to create folder');
      return null;
    }
  };

  // Update an existing folder
  const updateFolder = async (folderId: string, input: UpdateCosplayFolderInput): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setError(null);

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name.trim();
      if (input.parent_id !== undefined) updateData.parent_id = input.parent_id;

      const { error: updateError } = await supabase
        .from('cosplay_folders')
        .update(updateData)
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Refresh folders list
      await fetchFolders();

      return true;
    } catch (err) {
      console.error('Error updating folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to update folder');
      return false;
    }
  };

  // Delete a folder (cascade will handle children)
  const deleteFolder = async (folderId: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('cosplay_folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Refresh folders list
      await fetchFolders();

      return true;
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete folder');
      return false;
    }
  };

  // Move a cosplay to a folder
  const moveCosplayToFolder = async (input: MoveCosplayToFolderInput): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('cosplay_plans')
        .update({ folder_id: input.folder_id })
        .eq('id', input.cosplay_id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      console.error('Error moving cosplay to folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to move cosplay');
      return false;
    }
  };

  // Toggle folder expanded state
  const toggleFolderExpanded = useCallback((folderId: string) => {
    const toggleInTree = (folders: CosplayFolderWithChildren[]): CosplayFolderWithChildren[] => {
      return folders.map((folder) => {
        if (folder.id === folderId) {
          return { ...folder, isExpanded: !folder.isExpanded };
        }
        if (folder.children.length > 0) {
          return { ...folder, children: toggleInTree(folder.children) };
        }
        return folder;
      });
    };

    setFolderTree((prevTree) => toggleInTree(prevTree));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return {
    folders,
    folderTree,
    loading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    moveCosplayToFolder,
    toggleFolderExpanded,
    refetch: fetchFolders,
  };
}
