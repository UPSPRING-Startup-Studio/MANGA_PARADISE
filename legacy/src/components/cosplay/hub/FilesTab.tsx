/**
 * FilesTab
 * Dossiers / fichiers de référence pour un cosplay.
 * Wraps existing CosplayFolderTree component.
 */

import { FolderOpen } from "lucide-react";
import { CosplayFolderTree } from "@/components/cosplay/CosplayFolderTree";

export function FilesTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--mp-saffron))]/20 flex items-center justify-center">
          <FolderOpen className="w-4 h-4 text-[hsl(var(--mp-saffron))]" />
        </div>
        <h2 className="text-xl font-bold text-white">Dossiers</h2>
      </div>

      <CosplayFolderTree selectedFolderId={null} onSelectFolder={() => {}} />
    </div>
  );
}
