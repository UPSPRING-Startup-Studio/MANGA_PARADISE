/**
 * Type definitions for Cosplay Folder System
 * Supports hierarchical organization of cosplay projects
 */

export interface CosplayFolder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CosplayFolderWithChildren extends CosplayFolder {
  children: CosplayFolderWithChildren[];
  isExpanded?: boolean;
}

export interface CreateCosplayFolderInput {
  name: string;
  parent_id?: string | null;
}

export interface UpdateCosplayFolderInput {
  name?: string;
  parent_id?: string | null;
}

export interface MoveCosplayToFolderInput {
  cosplay_id: string;
  folder_id: string | null;
}
