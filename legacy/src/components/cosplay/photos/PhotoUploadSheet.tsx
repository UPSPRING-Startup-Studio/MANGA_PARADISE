import { useRef, useState, useEffect } from "react";
import { Camera, CheckCircle2, ImagePlus, Users, CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useAddCosplayPhoto, useUpdatePhotoMeta } from "@/hooks/useCosplayPhotos";
import { useAuth } from "@/contexts/AuthContext";
import type { PhotoType } from "@/types/cosplayPhotos";

// ─── Config des types de photo ────────────────────────────────────────────────

const PHOTO_TYPES: { value: PhotoType; label: string }[] = [
  { value: "shooting", label: "Shooting" },
  { value: "toi",      label: "Toi" },
  { value: "original", label: "Original" },
  { value: "wip",      label: "WIP" },
  { value: "detail",   label: "Détail" },
];

const STORAGE_BUCKET = "cosplay-photos";
const MAX_FILE_SIZE  = 10 * 1024 * 1024; // 10 Mo

// ─── Types locaux ─────────────────────────────────────────────────────────────

interface UploadedPhoto {
  id: string;
  photo_url: string;
  photo_type: PhotoType;
  /** Date derived from EXIF at upload time (YYYY-MM-DD) */
  detectedDate: string | null;
}

// ─── Sous-composant : preview d'une photo uploadée avec chips de type ─────────

interface UploadedPhotoItemProps {
  photo: UploadedPhoto;
  onTypeChange: (id: string, newType: PhotoType) => void;
}

function UploadedPhotoItem({ photo, onTypeChange }: UploadedPhotoItemProps) {
  const updateMeta = useUpdatePhotoMeta(photo.id);

  const handleTypeSelect = (newType: PhotoType) => {
    if (newType === photo.photo_type) return;
    updateMeta.mutate(
      { photo_type: newType },
      { onSuccess: () => onTypeChange(photo.id, newType) }
    );
  };

  return (
    <div className="flex gap-3 items-start">
      {/* Miniature */}
      <div className="relative w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
        <img
          src={photo.photo_url}
          alt="Photo uploadée"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-1 right-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 drop-shadow" />
        </div>
      </div>

      {/* Chips de type */}
      <div className="flex-1 flex flex-wrap gap-1.5 pt-1">
        {PHOTO_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleTypeSelect(value)}
            disabled={updateMeta.isPending}
            className="focus:outline-none"
          >
            <Badge
              className={cn(
                "cursor-pointer text-xs px-2.5 py-1 transition-all duration-150 border",
                photo.photo_type === value
                  ? "bg-white text-black border-transparent"
                  : "bg-white/10 text-white/60 border-white/10 hover:bg-white/20 hover:text-white"
              )}
            >
              {label}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface PhotoUploadSheetProps {
  cosplayId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhotoUploadSheet({ cosplayId, open, onOpenChange }: PhotoUploadSheetProps) {
  const { user } = useAuth();
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const addPhoto      = useAddCosplayPhoto();

  const [isUploading,    setIsUploading]    = useState(false);
  const [uploadDone,     setUploadDone]     = useState(0);
  const [uploadTotal,    setUploadTotal]    = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [isGroupPhoto,   setIsGroupPhoto]   = useState(false);

  // Remet à zéro l'état à chaque ouverture de la sheet
  useEffect(() => {
    if (open) {
      setIsUploading(false);
      setUploadDone(0);
      setUploadTotal(0);
      setUploadedPhotos([]);
      setIsGroupPhoto(false);
    }
  }, [open]);

  // ── Extraction EXIF ──────────────────────────────────────────────────────

  async function extractExif(file: File) {
    try {
      const exifr = await import("exifr");
      const exif  = await exifr.parse(file, ["DateTimeOriginal", "GPSLatitude", "GPSLongitude"]);
      if (!exif) return { exif_date: null, exif_gps_lat: null, exif_gps_lng: null };

      const exif_date =
        exif.DateTimeOriginal instanceof Date
          ? exif.DateTimeOriginal.toISOString()
          : null;

      // exifr renvoie latitude / longitude en degrés décimaux
      const exif_gps_lat = (exif.latitude  as number | undefined) ?? null;
      const exif_gps_lng = (exif.longitude as number | undefined) ?? null;

      return { exif_date, exif_gps_lat, exif_gps_lng };
    } catch {
      return { exif_date: null, exif_gps_lat: null, exif_gps_lng: null };
    }
  }

  // ── Upload d'un fichier unique ────────────────────────────────────────────

  async function uploadSingleFile(file: File): Promise<void> {
    if (!user) {
      toast.error("Non authentifié");
      return;
    }

    // Validation taille
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`${file.name} : photo trop lourde (max 10 Mo)`);
      return;
    }

    // Extraction EXIF
    const exifData = await extractExif(file);

    // Upload vers Supabase Storage
    const ext      = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${user.id}/${cosplayId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (storageError) {
      console.error("Erreur storage:", storageError);
      toast.error(`Erreur upload de ${file.name} : ${storageError.message}`);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    // Insertion en base via le hook
    const newPhoto = await addPhoto.mutateAsync({
      cosplay_id:  cosplayId,
      photo_url:   publicUrl,
      photo_type:  "shooting",
      is_group_photo: isGroupPhoto,
      ...exifData,
    });

    setUploadedPhotos((prev) => [
      ...prev,
      {
        id: newPhoto.id,
        photo_url: publicUrl,
        photo_type: "shooting",
        detectedDate: exifData.exif_date ? exifData.exif_date.split("T")[0] : null,
      },
    ]);
  }

  // ── Handler principal ─────────────────────────────────────────────────────

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadDone(0);
    setUploadTotal(files.length);

    for (const file of files) {
      await uploadSingleFile(file);
      setUploadDone((n) => n + 1);
    }

    setIsUploading(false);

    // Reset input pour permettre re-sélection des mêmes fichiers
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Mise à jour du type localement après mutation ─────────────────────────

  function handleTypeChange(id: string, newType: PhotoType) {
    setUploadedPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, photo_type: newType } : p))
    );
  }

  // ── Calcul progression ────────────────────────────────────────────────────

  const progressPercent = uploadTotal > 0 ? Math.round((uploadDone / uploadTotal) * 100) : 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[70vh] rounded-t-2xl bg-[#1A1A2E] border-white/10 flex flex-col p-0 overflow-hidden"
      >
        {/* ── Drag handle ───────────────────────────────────────────────── */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <SheetHeader className="px-5 pt-2 pb-3 flex-shrink-0">
          <SheetTitle className="text-white text-base font-semibold">
            Ajouter des photos
          </SheetTitle>
          <SheetDescription className="sr-only">
            Upload de photos pour ce cosplay
          </SheetDescription>
        </SheetHeader>

        {/* ── Contenu scrollable ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">

          {/* ── Zone d'upload ─────────────────────────────────────────── */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "w-full rounded-xl border-2 border-dashed border-white/20",
              "flex flex-col items-center justify-center gap-2 py-8",
              "text-white/40 transition-all duration-200",
              "hover:border-white/40 hover:text-white/60 hover:bg-white/5",
              "focus:outline-none active:scale-[0.98]",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            {isUploading ? (
              <ImagePlus className="w-8 h-8 animate-pulse" />
            ) : (
              <Camera className="w-8 h-8" />
            )}
            <span className="text-sm text-center leading-snug">
              Ajouter des photos
              <br />
              <span className="text-xs opacity-70">JPG, PNG, WebP · Max 10 Mo</span>
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* ── Toggle photo de groupe ─────────────────────────────────── */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Photo de groupe</p>
                <p className="text-[11px] text-white/40">
                  Plus de 10 personnes — permet l'auto-tagging par les participants
                </p>
              </div>
            </div>
            <Switch checked={isGroupPhoto} onCheckedChange={setIsGroupPhoto} />
          </div>

          {/* ── Barre de progression ───────────────────────────────────── */}
          {(isUploading || (uploadTotal > 0 && uploadDone === uploadTotal)) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">
                  {isUploading
                    ? `${uploadDone}/${uploadTotal} photo${uploadTotal > 1 ? "s" : ""} uploadée${uploadDone > 1 ? "s" : ""}…`
                    : `${uploadTotal} photo${uploadTotal > 1 ? "s" : ""} ajoutée${uploadTotal > 1 ? "s" : ""}`}
                </span>
                <span className="text-xs text-white/40">{progressPercent}%</span>
              </div>
              <Progress
                value={progressPercent}
                className="h-1.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-[#C70039] [&>div]:to-[#FF8C42]"
              />
            </div>
          )}

          {/* ── Photos uploadées avec chips de type ───────────────────── */}
          {uploadedPhotos.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Type de photo
              </p>
              <div className="space-y-3">
                {uploadedPhotos.map((photo) => (
                  <UploadedPhotoItem
                    key={photo.id}
                    photo={photo}
                    onTypeChange={handleTypeChange}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Date de prise de vue détectée ──────────────────────────── */}
          {uploadedPhotos.length > 0 && (() => {
            // Show a summary of the detected date across all uploaded photos
            const datesSet = new Set(uploadedPhotos.map((p) => p.detectedDate).filter(Boolean) as string[]);
            const uniqueDates = [...datesSet].sort();
            if (uniqueDates.length === 0) return null;

            const formatDate = (d: string) => {
              try { return format(parseISO(d), "EEEE d MMMM yyyy", { locale: fr }); }
              catch { return d; }
            };

            return (
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-1">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <p className="text-sm text-teal-200">
                    {uniqueDates.length === 1
                      ? <>Prise le <span className="font-semibold text-teal-100 capitalize">{formatDate(uniqueDates[0])}</span></>
                      : <>Dates détectées : {uniqueDates.map((d) => <span key={d} className="font-semibold text-teal-100 capitalize">{formatDate(d)}</span>).reduce<React.ReactNode[]>((acc, el, i) => i === 0 ? [el] : [...acc, ", ", el], [])}</>
                    }
                  </p>
                </div>
                <p className="text-[11px] text-white/30 pl-6">
                  Détecté depuis les données EXIF — modifiable via l&apos;association d&apos;événement
                </p>
              </div>
            );
          })()}
        </div>

        {/* ── Footer fixe avec bouton Terminé ──────────────────────────── */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-white/10 bg-[#1A1A2E]">
          <Button
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
            className="w-full bg-gradient-to-r from-[#C70039] to-[#FF8C42] text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Terminé
            {uploadedPhotos.length > 0 && (
              <span className="ml-1.5 text-white/70">
                ({uploadedPhotos.length} photo{uploadedPhotos.length > 1 ? "s" : ""})
              </span>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default PhotoUploadSheet;
