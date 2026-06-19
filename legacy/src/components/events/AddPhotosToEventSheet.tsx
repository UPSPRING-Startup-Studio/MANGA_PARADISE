import { useRef, useState, useMemo } from "react";
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  ArrowLeft,
  Shirt,
  Upload,
  Loader2,
} from "lucide-react";
import exifr from "exifr";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { thumbnailUrl } from "@/lib/imageUtils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useAllCosplayPhotos, type EnrichedPhoto } from "@/hooks/useAllCosplayPhotos";
import { useWardrobeItems, type WardrobeItem } from "@/hooks/useWardrobeItems";
import { usePhotosBatchActions } from "@/hooks/usePhotosBatchActions";
import { useAddCosplayPhoto } from "@/hooks/useCosplayPhotos";
import { useQueryClient } from "@tanstack/react-query";

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_BUCKET = "cosplay-photos";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

// ─── Types ──────────────────────────────────────────────────────────────────

type Step = "source" | "wardrobe" | "upload-select-cosplay" | "upload" | "confirm";

interface AddPhotosToEventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
}

// ─── Source selection step ───────────────────────────────────────────────────

function SourceStep({
  onSelectWardrobe,
  onSelectUpload,
}: {
  onSelectWardrobe: () => void;
  onSelectUpload: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/50">
        Choisis comment ajouter tes photos à la galerie communautaire.
      </p>

      <button
        type="button"
        onClick={onSelectWardrobe}
        className="w-full p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10 transition-colors text-left space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
            <Shirt className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Depuis mon vestiaire</p>
            <p className="text-xs text-white/40">
              Sélectionne des photos déjà dans tes cosplays
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={onSelectUpload}
        className="w-full p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors text-left space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Upload className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Importer de nouvelles photos</p>
            <p className="text-xs text-white/40">
              Ajoute des photos depuis ton appareil
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}

// ─── Wardrobe photo selection step ──────────────────────────────────────────

function WardrobeStep({
  eventId,
  onBack,
  onConfirm,
}: {
  eventId: string;
  onBack: () => void;
  onConfirm: (photoIds: string[]) => void;
}) {
  const { user } = useAuth();
  const { photos, photosByCosplay, isLoading } = useAllCosplayPhotos(user?.id);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter out photos already associated to this event
  const availablePhotos = useMemo(
    () => photos.filter((p) => p.event_id !== eventId),
    [photos, eventId]
  );

  const availableByCosplay = useMemo(() => {
    const map = new Map<string, { cosplan: EnrichedPhoto["cosplan"]; photos: EnrichedPhoto[] }>();
    for (const photo of availablePhotos) {
      const key = photo.cosplay_id;
      const existing = map.get(key);
      if (existing) {
        existing.photos.push(photo);
      } else {
        map.set(key, { cosplan: photo.cosplan, photos: [photo] });
      }
    }
    return map;
  }, [availablePhotos]);

  const togglePhoto = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (availablePhotos.length === 0) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="py-8 text-center">
          <Camera className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/40">Aucune photo disponible dans ton vestiaire.</p>
          <p className="text-xs text-white/30 mt-1">Toutes tes photos sont déjà liées à cet événement.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        {selectedIds.size > 0 && (
          <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30">
            {selectedIds.size} sélectionnée{selectedIds.size > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <p className="text-xs text-white/40">
        Sélectionne les photos à associer à cet événement.
      </p>

      {/* Photos grouped by cosplay */}
      <div className="space-y-5 max-h-[45vh] overflow-y-auto">
        {[...availableByCosplay.entries()].map(([cosplayId, group]) => (
          <div key={cosplayId} className="space-y-2">
            <div className="flex items-center gap-2">
              <Shirt className="w-3.5 h-3.5 text-pink-400" />
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                {group.cosplan?.character_name ?? "Cosplay"}
                {group.cosplan?.universe && (
                  <span className="text-white/30 font-normal ml-1">— {group.cosplan.universe}</span>
                )}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {group.photos.map((photo) => {
                const isSelected = selectedIds.has(photo.id);
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => togglePhoto(photo.id)}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden focus:outline-none transition-all",
                      isSelected
                        ? "ring-2 ring-teal-400 ring-offset-1 ring-offset-[#1A1A2E]"
                        : "opacity-70 hover:opacity-100"
                    )}
                  >
                    <img
                      src={thumbnailUrl(photo.photo_url, 200, 200)}
                      alt={photo.cosplan?.character_name ?? "Photo"}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-teal-400 drop-shadow" />
                      </div>
                    )}
                    {photo.event_name && (
                      <div className="absolute top-0.5 right-0.5">
                        <Badge className="text-[7px] bg-black/60 text-white/60 border-none py-0 h-3">
                          {photo.event_name}
                        </Badge>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Confirm button */}
      <Button
        onClick={() => onConfirm([...selectedIds])}
        disabled={selectedIds.size === 0}
        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold"
      >
        <ImagePlus className="w-4 h-4 mr-2" />
        Associer {selectedIds.size} photo{selectedIds.size > 1 ? "s" : ""} à l'événement
      </Button>
    </div>
  );
}

// ─── Cosplay selection step (for upload) ────────────────────────────────────

function CosplaySelectStep({
  onBack,
  onSelect,
}: {
  onBack: () => void;
  onSelect: (cosplay: WardrobeItem) => void;
}) {
  const { user } = useAuth();
  const { data: items = [], isLoading } = useWardrobeItems(user?.id);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-white/40 hover:text-white/70 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <p className="text-xs text-white/40">
        À quel cosplay ces nouvelles photos sont-elles liées ?
      </p>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {items.map((item) => {
          const imgUrl = item.image_url || item.user_image_url || item.official_image_url;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                {imgUrl ? (
                  <img src={thumbnailUrl(imgUrl, 96, 96)} alt={item.character_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Shirt className="w-5 h-5 text-white/20" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.character_name}</p>
                <p className="text-xs text-white/40 truncate">{item.universe}</p>
              </div>
            </button>
          );
        })}

        {items.length === 0 && (
          <div className="py-8 text-center">
            <Shirt className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-sm text-white/40">Aucun cosplay dans ton vestiaire.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Upload step ────────────────────────────────────────────────────────────

function UploadStep({
  cosplay,
  eventId,
  onBack,
  onDone,
}: {
  cosplay: WardrobeItem;
  eventId: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const addPhoto = useAddCosplayPhoto();
  const queryClient = useQueryClient();

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user?.id) return;

    const validFiles = Array.from(files).filter(
      (f) => f.size <= MAX_FILE_SIZE && f.type.startsWith("image/")
    );

    if (validFiles.length === 0) {
      toast.error("Aucun fichier valide (max 10 Mo, images uniquement).");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    let done = 0;

    for (const file of validFiles) {
      try {
        // Extract EXIF
        let exifDate: string | undefined;
        let lat: number | undefined;
        let lng: number | undefined;
        try {
          const exif = await exifr.parse(file, ["DateTimeOriginal", "GPSLatitude", "GPSLongitude"]);
          if (exif?.DateTimeOriginal) {
            exifDate = new Date(exif.DateTimeOriginal).toISOString();
          }
          if (exif?.latitude) lat = exif.latitude;
          if (exif?.longitude) lng = exif.longitude;
        } catch {
          // EXIF extraction is best-effort
        }

        // Upload to storage
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${cosplay.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(path);

        // Insert photo record with event_id
        await addPhoto.mutateAsync({
          cosplay_id: cosplay.id,
          photo_url: urlData.publicUrl,
          photo_type: "shooting",
          event_id: eventId,
          exif_date: exifDate,
          exif_gps_lat: lat,
          exif_gps_lng: lng,
          shot_date: exifDate ? exifDate.split("T")[0] : undefined,
        });

        done++;
        setUploadedCount(done);
        setUploadProgress(Math.round((done / validFiles.length) * 100));
      } catch (err) {
        console.error("Upload error:", err);
        toast.error(`Erreur pour ${file.name}`);
      }
    }

    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ["event-photos", eventId] });

    if (done > 0) {
      toast.success(
        `${done} photo${done > 1 ? "s" : ""} ajoutée${done > 1 ? "s" : ""} à la galerie !`
      );
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const imgUrl = cosplay.image_url || cosplay.user_image_url || cosplay.official_image_url;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-white/40 hover:text-white/70 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      {/* Selected cosplay recap */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-teal-500/20 bg-teal-500/5">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
          {imgUrl ? (
            <img src={thumbnailUrl(imgUrl, 80, 80)} alt={cosplay.character_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Shirt className="w-4 h-4 text-white/20" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{cosplay.character_name}</p>
          <p className="text-xs text-white/40 truncate">{cosplay.universe}</p>
        </div>
        <CheckCircle2 className="w-5 h-5 text-teal-400 ml-auto flex-shrink-0" />
      </div>

      {/* Upload area */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFiles}
        className="hidden"
      />

      {uploading ? (
        <div className="space-y-3 py-4">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
            <span className="text-sm text-white/60">
              Upload en cours… {uploadedCount}/{uploadProgress > 0 ? Math.ceil(uploadedCount / (uploadProgress / 100)) : "?"}
            </span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-8 rounded-xl border-2 border-dashed border-white/10 hover:border-teal-500/30 bg-white/[0.02] hover:bg-teal-500/5 transition-all text-center"
        >
          <Camera className="w-10 h-10 text-white/15 mx-auto mb-3" />
          <p className="text-sm font-medium text-white/60">
            Clique pour sélectionner des photos
          </p>
          <p className="text-xs text-white/30 mt-1">
            JPEG, PNG, WebP — max 10 Mo par photo
          </p>
        </button>
      )}

      {/* Done info */}
      {uploadedCount > 0 && !uploading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-300">
              {uploadedCount} photo{uploadedCount > 1 ? "s" : ""} ajoutée{uploadedCount > 1 ? "s" : ""} avec succès
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 border-white/10 text-white/60 text-xs"
            >
              Ajouter d'autres photos
            </Button>
            <Button
              onClick={onDone}
              className="flex-1 bg-teal-500 hover:bg-teal-600 text-white text-xs"
            >
              Terminé
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function AddPhotosToEventSheet({
  open,
  onOpenChange,
  eventId,
  eventTitle,
}: AddPhotosToEventSheetProps) {
  const [step, setStep] = useState<Step>("source");
  const [selectedCosplay, setSelectedCosplay] = useState<WardrobeItem | null>(null);
  const { associateEvent } = usePhotosBatchActions();
  const queryClient = useQueryClient();

  const reset = () => {
    setStep("source");
    setSelectedCosplay(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  // Batch associate wardrobe photos to the event
  const handleWardrobeConfirm = (photoIds: string[]) => {
    associateEvent.mutate(
      { photoIds, eventId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["event-photos", eventId] });
          handleClose(false);
        },
      }
    );
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="bg-[#1A1A2E] border-t border-white/10 max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2 text-white">
            <Camera className="w-5 h-5 text-teal-400" />
            Ajouter mes photos
          </DrawerTitle>
          <DrawerDescription className="text-white/40 text-xs">
            {eventTitle}
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-8 space-y-5">
          {step === "source" && (
            <SourceStep
              onSelectWardrobe={() => setStep("wardrobe")}
              onSelectUpload={() => setStep("upload-select-cosplay")}
            />
          )}

          {step === "wardrobe" && (
            <WardrobeStep
              eventId={eventId}
              onBack={() => setStep("source")}
              onConfirm={handleWardrobeConfirm}
            />
          )}

          {step === "upload-select-cosplay" && (
            <CosplaySelectStep
              onBack={() => setStep("source")}
              onSelect={(cosplay) => {
                setSelectedCosplay(cosplay);
                setStep("upload");
              }}
            />
          )}

          {step === "upload" && selectedCosplay && (
            <UploadStep
              cosplay={selectedCosplay}
              eventId={eventId}
              onBack={() => setStep("upload-select-cosplay")}
              onDone={() => handleClose(false)}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
