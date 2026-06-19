import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Plus, X, Loader2, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAddMemoryPhoto, useDeleteMemoryPhoto, EventMemoryPhoto } from "@/hooks/useEventMemories";
import { toast } from "sonner";

interface PhotoGallerySectionProps {
  photos: EventMemoryPhoto[];
  eventId: string;
  userId: string;
  isLoading: boolean;
}

const PhotoGallerySection = ({ photos, eventId, userId, isLoading }: PhotoGallerySectionProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addPhoto = useAddMemoryPhoto();
  const deletePhoto = useDeleteMemoryPhoto();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} n'est pas une image valide`);
          continue;
        }

        // Upload to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${eventId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("memories")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Erreur lors de l'upload de ${file.name}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("memories")
          .getPublicUrl(fileName);

        // Save to database
        await addPhoto.mutateAsync({
          eventId,
          userId,
          photoUrl: urlData.publicUrl,
        });
      }

      toast.success("Photos ajoutées aux souvenirs !");
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error("Erreur lors de l'upload des photos");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deletePhoto.mutateAsync({ photoId, eventId, userId });
      toast.success("Photo supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  // Masonry-like layout with varying sizes
  const getPhotoSize = (index: number) => {
    const pattern = index % 5;
    if (pattern === 0) return "col-span-2 row-span-2";
    if (pattern === 3) return "col-span-2";
    return "";
  };

  return (
    <Card className="bg-gradient-to-br from-orange-900/20 to-amber-900/10 border-orange-500/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg text-white">Galerie Photo</h3>
            <p className="text-orange-400/60 text-sm">{photos.length} souvenir{photos.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <Button 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-1" />
          )}
          Ajouter
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-8">
          <Camera className="w-12 h-12 mx-auto text-orange-500/30 mb-3" />
          <p className="text-white/50 text-sm">Aucune photo dans cette capsule</p>
          <p className="text-white/30 text-xs mt-1">Ajoute tes meilleurs moments !</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 auto-rows-[100px]">
          <AnimatePresence>
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`relative group overflow-hidden rounded-lg ${getPhotoSize(index)}`}
              >
                <img
                  src={photo.photo_url}
                  alt="Memory"
                  className="w-full h-full object-cover filter brightness-90 sepia-[0.1] group-hover:brightness-100 group-hover:sepia-0 transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedPhoto(photo.photo_url)}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Actions */}
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setSelectedPhoto(photo.photo_url)}
                    className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30"
                  >
                    <ZoomIn className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="w-8 h-8 rounded-full bg-red-500/50 backdrop-blur-sm flex items-center justify-center hover:bg-red-500"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="bg-black/95 border-white/10 max-w-4xl p-0">
          {selectedPhoto && (
            <img
              src={selectedPhoto}
              alt="Memory"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PhotoGallerySection;
