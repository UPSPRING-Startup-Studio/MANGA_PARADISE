/**
 * CosplayFolderTree Component
 * Sidebar displaying hierarchical folder structure for organizing cosplays
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  FolderPlus,
} from 'lucide-react';
import { useCosplayFolders } from '@/hooks/useCosplayFolders';
import { CosplayFolderWithChildren } from '@/types/cosplayFolder';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDroppable } from '@dnd-kit/core';

interface CosplayFolderTreeProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

interface FolderItemProps {
  folder: CosplayFolderWithChildren;
  level: number;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onToggleExpanded: (folderId: string) => void;
  onEdit: (folder: CosplayFolderWithChildren) => void;
  onDelete: (folderId: string) => void;
  onCreateSubfolder: (parentId: string) => void;
}

function FolderItem({
  folder,
  level,
  selectedFolderId,
  onSelectFolder,
  onToggleExpanded,
  onEdit,
  onDelete,
  onCreateSubfolder,
}: FolderItemProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: folder.id,
    data: { type: 'folder', folderId: folder.id },
  });

  const hasChildren = folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;
  const FolderIcon = folder.isExpanded ? FolderOpen : Folder;

  return (
    <div>
      <motion.div
        ref={setNodeRef}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`
          group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
          transition-all duration-200
          ${isSelected ? 'bg-[hsl(var(--mp-primary))]/20 border border-[hsl(var(--mp-primary))]/50' : 'hover:bg-white/5'}
          ${isOver ? 'bg-[hsl(var(--mp-info))]/20 border border-[hsl(var(--mp-info))] shadow-[0_0_15px_rgba(0,240,255,0.3)]' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => onSelectFolder(folder.id)}
      >
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpanded(folder.id);
            }}
            className="text-mp-ink-muted hover:text-white transition-colors"
          >
            {folder.isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Folder Icon */}
        <FolderIcon
          className={`w-5 h-5 ${isSelected ? 'text-[hsl(var(--mp-primary))]' : 'text-mp-ink-muted'}`}
        />

        {/* Folder Name */}
        <span className="flex-1 text-sm font-medium text-white truncate">
          {folder.name}
        </span>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="opacity-0 group-hover:opacity-100 text-mp-ink-muted hover:text-white transition-all">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-mp-paper border-white/10"
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onCreateSubfolder(folder.id);
              }}
              className="text-slate-200 hover:bg-white/10 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Créer un sous-dossier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(folder);
              }}
              className="text-slate-200 hover:bg-white/10 cursor-pointer"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Renommer
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(folder.id);
              }}
              className="text-red-400 hover:bg-red-500/10 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Render Children */}
      <AnimatePresence>
        {folder.isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {folder.children.map((child) => (
              <FolderItem
                key={child.id}
                folder={child}
                level={level + 1}
                selectedFolderId={selectedFolderId}
                onSelectFolder={onSelectFolder}
                onToggleExpanded={onToggleExpanded}
                onEdit={onEdit}
                onDelete={onDelete}
                onCreateSubfolder={onCreateSubfolder}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CosplayFolderTree({
  selectedFolderId,
  onSelectFolder,
}: CosplayFolderTreeProps) {
  const { folderTree, loading, createFolder, updateFolder, deleteFolder, toggleFolderExpanded } =
    useCosplayFolders();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<CosplayFolderWithChildren | null>(null);

  // Droppable for "All Cosplays" (root level)
  const { setNodeRef: setAllCosplaysRef, isOver: isOverAllCosplays } = useDroppable({
    id: 'all-cosplays',
    data: { type: 'folder', folderId: null },
  });

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du dossier ne peut pas être vide',
        variant: 'destructive',
      });
      return;
    }

    const result = await createFolder({
      name: newFolderName,
      parent_id: parentFolderId,
    });

    if (result) {
      toast({
        title: 'Succès',
        description: 'Dossier créé avec succès',
      });
      setIsCreateDialogOpen(false);
      setNewFolderName('');
      setParentFolderId(null);
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le dossier',
        variant: 'destructive',
      });
    }
  };

  const handleEditFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du dossier ne peut pas être vide',
        variant: 'destructive',
      });
      return;
    }

    const success = await updateFolder(editingFolder.id, { name: newFolderName });

    if (success) {
      toast({
        title: 'Succès',
        description: 'Dossier renommé avec succès',
      });
      setIsEditDialogOpen(false);
      setEditingFolder(null);
      setNewFolderName('');
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible de renommer le dossier',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce dossier ? Les sous-dossiers seront également supprimés.')) {
      return;
    }

    const success = await deleteFolder(folderId);

    if (success) {
      toast({
        title: 'Succès',
        description: 'Dossier supprimé avec succès',
      });
      if (selectedFolderId === folderId) {
        onSelectFolder(null);
      }
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le dossier',
        variant: 'destructive',
      });
    }
  };

  const openCreateDialog = (parentId: string | null = null) => {
    setParentFolderId(parentId);
    setNewFolderName('');
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (folder: CosplayFolderWithChildren) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="w-80 bg-black/40 backdrop-blur-md border-r border-white/10 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-white/5 rounded-lg" />
          <div className="h-8 bg-white/5 rounded-lg" />
          <div className="h-8 bg-white/5 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-80 bg-black/40 backdrop-blur-md border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">
            📁 Mes Dossiers
          </h2>
          <Button
            onClick={() => openCreateDialog()}
            className="w-full bg-gradient-to-r from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-primary))]/80 hover:shadow-[0_0_20px_rgba(255,0,127,0.5)] transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un dossier
          </Button>
        </div>

        {/* Folder List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {/* All Cosplays (Root) */}
          <motion.div
            ref={setAllCosplaysRef}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
              transition-all duration-200
              ${selectedFolderId === null ? 'bg-[hsl(var(--mp-primary))]/20 border border-[hsl(var(--mp-primary))]/50' : 'hover:bg-white/5'}
              ${isOverAllCosplays ? 'bg-[hsl(var(--mp-info))]/20 border border-[hsl(var(--mp-info))] shadow-[0_0_15px_rgba(0,240,255,0.3)]' : ''}
            `}
            onClick={() => onSelectFolder(null)}
          >
            <FolderOpen className={`w-5 h-5 ${selectedFolderId === null ? 'text-[hsl(var(--mp-primary))]' : 'text-mp-ink-muted'}`} />
            <span className="flex-1 text-sm font-medium text-white">
              Tous mes cosplays
            </span>
          </motion.div>

          {/* Folder Tree */}
          {folderTree.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              level={0}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onToggleExpanded={toggleFolderExpanded}
              onEdit={openEditDialog}
              onDelete={handleDeleteFolder}
              onCreateSubfolder={openCreateDialog}
            />
          ))}
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-mp-paper border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Créer un nouveau dossier</DialogTitle>
            <DialogDescription className="text-mp-ink-muted">
              Donnez un nom à votre nouveau dossier pour organiser vos cosplays.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name" className="text-white">
                Nom du dossier
              </Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ex: Cosplays 2026"
                className="bg-black/40 border-white/10 text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="border-white/10 text-white hover:bg-white/5"
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateFolder}
              className="bg-gradient-to-r from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-primary))]/80"
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-mp-paper border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Renommer le dossier</DialogTitle>
            <DialogDescription className="text-mp-ink-muted">
              Modifiez le nom de votre dossier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-folder-name" className="text-white">
                Nom du dossier
              </Label>
              <Input
                id="edit-folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="bg-black/40 border-white/10 text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEditFolder();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-white/10 text-white hover:bg-white/5"
            >
              Annuler
            </Button>
            <Button
              onClick={handleEditFolder}
              className="bg-gradient-to-r from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-primary))]/80"
            >
              Renommer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
