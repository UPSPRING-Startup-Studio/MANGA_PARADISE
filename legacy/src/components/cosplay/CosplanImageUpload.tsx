import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface CosplanImageUploadProps {
  userId: string;
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
}

export const CosplanImageUpload = ({
  userId,
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
}: CosplanImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    setUploading(true);

    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      console.log("DEBUG COSPLAN UPLOAD - Uploading to cosplay-projects bucket:", fileName);

      // Try primary bucket: cosplay-projects
      let uploadError = null;
      let bucketName = "cosplay-projects";
      
      const result = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });
      
      uploadError = result.error;

      // Fallback to cosplan-images if cosplay-projects doesn't exist
      if (uploadError?.message?.includes("Bucket not found") || uploadError?.name === "StorageError") {
        console.warn("DEBUG COSPLAN UPLOAD - Bucket 'cosplay-projects' not found, trying 'cosplan-images'");
        bucketName = "cosplan-images";
        const fallbackResult = await supabase.storage
          .from(bucketName)
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });
        uploadError = fallbackResult.error;
        
        if (uploadError) {
          // Last fallback: images bucket
          console.warn("DEBUG COSPLAN UPLOAD - Trying 'images' bucket as last resort");
          bucketName = "images";
          const lastResult = await supabase.storage
            .from(bucketName)
            .upload(`cosplans/${fileName}`, file, {
              cacheControl: "3600",
              upsert: false,
            });
          uploadError = lastResult.error;
        }
      }

      if (uploadError) {
        console.error("DEBUG COSPLAN UPLOAD - All buckets failed:", uploadError);
        throw uploadError;
      }

      // Store the file path (not the full URL) in the database
      const storagePath = bucketName === "images" ? `cosplans/${fileName}` : fileName;
      
      // Get public URL for preview only
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(storagePath);

      console.log("DEBUG COSPLAN UPLOAD - SUCCESS! Storage path:", storagePath);
      console.log("DEBUG COSPLAN UPLOAD - Preview URL:", urlData.publicUrl);
      
      setPreviewUrl(urlData.publicUrl);
      // Pass the storage path to be saved in DB, not the full URL
      onImageUploaded(storagePath);
      toast.success("Image uploadée !");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(`Erreur lors de l'upload: ${error.message || "Erreur inconnue"}`);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageRemoved?.();
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-muted group">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-32 border-dashed border-2 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-sakura/50"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Upload en cours...</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-6 h-6" />
              <span className="text-sm">Ajouter une image</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
};
