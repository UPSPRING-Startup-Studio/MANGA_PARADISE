import { Copy, Download, Share2, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { CosplayPhotoWithTags } from "@/types/cosplayPhotos";

interface PhotoShareSheetProps {
  photo: CosplayPhotoWithTags;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhotoShareSheet({ photo, open, onOpenChange }: PhotoShareSheetProps) {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(photo.photo_url);
      toast.success("Lien copié !");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = photo.photo_url;
    a.download = `cosplay-${photo.id}.jpg`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.caption ?? "Photo cosplay",
          url: photo.photo_url,
        });
      } catch {
        // cancelled by user
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl bg-[#1A1A2E] border-t border-white/10 p-0"
      >
        {/* Accessible header (hidden) */}
        <SheetHeader className="sr-only">
          <SheetTitle>Partager cette photo</SheetTitle>
          <SheetDescription>Partage cette photo cosplay</SheetDescription>
        </SheetHeader>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <p className="text-white font-semibold flex items-center gap-2">
            <Share2 className="w-4 h-4 text-sakura" />
            Partager
          </p>
          <button
            onClick={() => onOpenChange(false)}
            className="text-white/40 hover:text-white focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="px-4 mb-4">
          <img
            src={photo.photo_url}
            alt={photo.caption ?? "Photo cosplay"}
            className="w-full max-h-40 object-cover rounded-xl"
          />
          {photo.caption && (
            <p className="text-white/50 text-xs mt-2 text-center italic truncate">
              {photo.caption}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-8 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
            onClick={handleCopyLink}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copier le lien
          </Button>
          <Button
            variant="outline"
            className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
            onClick={handleNativeShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Partager via...
          </Button>
          <Button
            variant="outline"
            className="border-white/20 text-white/70 hover:text-white hover:bg-white/10 col-span-2"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger la photo
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default PhotoShareSheet;
