/**
 * CosplayWardrobe Page
 * Main page for organizing cosplay projects with folders and drag & drop
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CosplayFolderTree } from '@/components/cosplay/CosplayFolderTree';
import { CosplayGridWithDnd } from '@/components/cosplay/CosplayGridWithDnd';

export default function CosplayWardrobe() {
  const navigate = useNavigate();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-white/10 bg-black/40 backdrop-blur-md"
      >
        <div className="px-8 py-4 flex items-center gap-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/espace-membre/parametres?tab=cosplayer', { replace: true })}
            className="text-white/60 hover:text-white hover:bg-white/10 -ml-2 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Mon profil cosplay
          </Button>

          <div className="h-6 w-px bg-white/10" />

          <div>
            <h1 className="text-2xl font-bold text-white">
              👘 Vestiaire Cosplay
            </h1>
            <p className="text-mp-ink-muted text-sm mt-0.5">
              Organisez vos projets cosplay avec des dossiers et sous-dossiers
            </p>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Folder Tree */}
        <CosplayFolderTree
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
        />

        {/* Main Area - Cosplay Grid */}
        <CosplayGridWithDnd selectedFolderId={selectedFolderId} />
      </div>
    </div>
  );
}
