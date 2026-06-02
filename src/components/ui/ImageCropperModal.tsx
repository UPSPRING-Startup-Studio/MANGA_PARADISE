import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Crop, ZoomIn } from "lucide-react";

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  /** Aspect ratio – defaults to 3 (banner 3:1) */
  aspect?: number;
  onClose: () => void;
  /** Called with the pixel-area the user selected */
  onCropComplete: (croppedAreaPixels: Area) => void;
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  aspect = 3 / 1,
  onClose,
  onCropComplete,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = () => {
    if (croppedAreaPixels) {
      onCropComplete(croppedAreaPixels);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-[95vw] p-0 overflow-hidden z-[100] bg-black/95 border-white/10">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2 text-white">
            <Crop className="w-5 h-5 text-sakura" />
            Recadrer la bannière
          </DialogTitle>
        </DialogHeader>

        {/* Cropper area */}
        <div className="relative w-full h-[300px] md:h-[400px] bg-black">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          )}
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-6 py-3">
          <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
          <Slider
            min={1}
            max={3}
            step={0.05}
            value={[zoom]}
            onValueChange={(v) => setZoom(v[0])}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-10 text-right">
            {zoom.toFixed(1)}x
          </span>
        </div>

        <DialogFooter className="p-4 pt-0 gap-2">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-sakura hover:bg-sakura/90 text-white"
          >
            Valider la découpe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
