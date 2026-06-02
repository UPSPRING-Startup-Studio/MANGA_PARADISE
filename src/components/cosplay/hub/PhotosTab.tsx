/**
 * PhotosTab — Galerie photos unifiée (WIP + vitrine).
 * Seul endroit pour visualiser et gérer toutes les photos d'un cosplay.
 * Pas de section "Photo vitrine" séparée : un seul flux unifié.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Plus, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CosplayProject } from "@/hooks/useCosplayProject";
import { EnrichedPhotoGrid } from "@/components/cosplay/photos/EnrichedPhotoGrid";
import { PhotoUploadSheet } from "@/components/cosplay/photos/PhotoUploadSheet";
import { PhotoViewer } from "@/components/cosplay/photos/PhotoViewer";
import type { PhotoViewerAction } from "@/components/cosplay/photos/PhotoViewer";
import { CaptionEditor } from "@/components/cosplay/photos/CaptionEditor";
import { EventAssociationSheet } from "@/components/cosplay/photos/EventAssociationSheet";
import { PhotoShareSheet } from "@/components/cosplay/photos/PhotoShareSheet";
import { useCosplayPhotos } from "@/hooks/useCosplayPhotos";
import type { CosplayPhotoWithTags } from "@/types/cosplayPhotos";

interface PhotosTabProps {
  cosplay: CosplayProject;
  userId: string;
}

export function PhotosTab({ cosplay, userId }: PhotosTabProps) {
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [viewerAction, setViewerAction] = useState<{
    type: PhotoViewerAction;
    photo: CosplayPhotoWithTags;
  } | null>(null);

  const isOwner = userId === cosplay.user_id;
  const { data: photos = [], isLoading } = useCosplayPhotos(cosplay.id);

  const handleViewerAction = (
    action: PhotoViewerAction,
    photo: CosplayPhotoWithTags
  ) => {
    setTimeout(() => setViewerAction({ type: action, photo }), 0);
  };

  const closeViewerAction = () => setViewerAction(null);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
            <Camera className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Photos</h2>
            <p className="text-xs text-mp-ink-muted">
              {isLoading
                ? "Chargement…"
                : `${photos.length} photo${photos.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setUploadSheetOpen(true)}
          className="border-teal-500/40 text-teal-400 hover:bg-teal-500/10"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Ajouter des photos
        </Button>
      </div>

      {/* ── Photo Grid ── */}
      {!isLoading && photos.length > 0 && (
        <EnrichedPhotoGrid
          cosplayId={cosplay.id}
          isOwner={isOwner}
          onPhotoClick={(_photo, index) => {
            setSelectedPhotoIndex(index);
            setPhotoViewerOpen(true);
          }}
          onAddClick={() => setUploadSheetOpen(true)}
        />
      )}

      {/* ── Empty State ── */}
      {!isLoading && photos.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] text-center space-y-4"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500/20 to-[hsl(var(--mp-info))]/20 flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-mp-ink-muted" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-300">
              Aucune photo pour le moment
            </h3>
            <p className="text-sm text-mp-ink-muted mt-1 max-w-xs">
              Ajoute des photos de progression, de shooting ou de référence.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setUploadSheetOpen(true)}
            className="border-teal-500/40 text-teal-400 hover:bg-teal-500/10"
          >
            <Plus className="w-4 h-4 mr-2" /> Ajouter mes premières photos
          </Button>
        </motion.div>
      )}

      {/* ── Loading skeleton ── */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ── Upload Sheet ── */}
      <PhotoUploadSheet
        cosplayId={cosplay.id}
        open={uploadSheetOpen}
        onOpenChange={setUploadSheetOpen}
      />

      {/* ── Full-screen Viewer ── */}
      {photoViewerOpen && (
        <PhotoViewer
          photos={photos}
          initialIndex={selectedPhotoIndex}
          isOwner={isOwner}
          onClose={() => setPhotoViewerOpen(false)}
          onAction={handleViewerAction}
        />
      )}

      {/* ── Action Sheets (caption, event, share) ── */}
      {viewerAction?.type === "caption" && (
        <CaptionEditor
          photo={viewerAction.photo}
          open
          onOpenChange={(o) => {
            if (!o) closeViewerAction();
          }}
          onSaved={closeViewerAction}
        />
      )}
      {viewerAction?.type === "event" && (
        <EventAssociationSheet
          photo={viewerAction.photo}
          open
          onOpenChange={(o) => {
            if (!o) closeViewerAction();
          }}
          onAssociated={closeViewerAction}
        />
      )}
      {viewerAction?.type === "share" && (
        <PhotoShareSheet
          photo={viewerAction.photo}
          open
          onOpenChange={(o) => {
            if (!o) closeViewerAction();
          }}
        />
      )}
    </div>
  );
}
