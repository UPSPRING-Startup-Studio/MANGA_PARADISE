import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { CosplayPlan } from "@/hooks/useCosplans";
import { supabase } from "@/integrations/supabase/client";

interface TransferToVestiaireModalProps {
  open: boolean;
  onClose: () => void;
  plan: CosplayPlan | null;
  userId: string;
  onTransfer: (plan: CosplayPlan, userImageUrl: string) => Promise<void>;
}

export const TransferToVestiaireModal = ({ 
  open, 
  onClose, 
  plan, 
  userId,
  onTransfer 
}: TransferToVestiaireModalProps) => {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleTransfer = async () => {
    if (!plan || !selectedFile) return;

    setLoading(true);
    try {
      // Upload the cosplay photo - try cosplay-vestiaire bucket first
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      console.log("DEBUG TRANSFER - Uploading to cosplay-vestiaire bucket:", fileName);

      let uploadError = null;
      let bucketName = "cosplay-vestiaire";
      
      const result = await supabase.storage
        .from(bucketName)
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });
      
      uploadError = result.error;
      
      // Fallback to cosplays bucket if cosplay-vestiaire doesn't exist
      if (uploadError?.message?.includes("Bucket not found") || uploadError?.name === "StorageError") {
        console.warn("DEBUG TRANSFER - Bucket 'cosplay-vestiaire' not found, trying 'cosplays'");
        bucketName = "cosplays";
        const fallbackResult = await supabase.storage
          .from(bucketName)
          .upload(fileName, selectedFile, {
            cacheControl: "3600",
            upsert: false,
          });
        uploadError = fallbackResult.error;
      }

      if (uploadError) {
        console.error("DEBUG TRANSFER - Upload failed:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      console.log("DEBUG TRANSFER - Upload success! URL:", urlData.publicUrl);

      await onTransfer(plan, urlData.publicUrl);
      
      // Reset
      setSelectedFile(null);
      setPreviewUrl(null);
      onClose();
    } catch (error) {
      console.error("Error transferring:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sakura" />
            Transférer vers le Vestiaire
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-sakura/10 to-accent/10 rounded-xl border border-sakura/30">
            <p className="text-sm text-muted-foreground mb-1">Cosplay terminé :</p>
            <p className="font-display text-lg">{plan.character_name}</p>
            <p className="text-sm text-muted-foreground">{plan.universe}</p>
          </div>

          <div className="space-y-2">
            <Label>Ta photo en cosplay *</Label>
            <p className="text-xs text-muted-foreground">
              Ajoute une photo de toi en costume pour le Vestiaire
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative w-full aspect-[3/4] max-w-[200px] mx-auto rounded-xl overflow-hidden bg-muted">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-2 right-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Changer
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[3/4] max-w-[200px] mx-auto flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-sakura/50 transition-colors bg-muted/30"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Ajouter une photo</span>
              </button>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleTransfer}
              disabled={loading || !selectedFile}
              className="bg-gradient-to-r from-sakura to-accent text-white hover:opacity-90"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Transférer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
