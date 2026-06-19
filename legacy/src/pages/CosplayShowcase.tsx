/**
 * CosplayShowcase Page
 * The "Vitrine" (Showcase) for a finished cosplay project.
 * Displays: Hero Banner, Battle Report (stats), and dynamic Photo Gallery.
 * Route: /espace-membre/vestiaire/:id
 */

import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Euro,
  Sparkles,
  Download,
  Plus,
  Image as ImageIcon,
  Trophy,
  Shirt,
  Star,
  Flame,
  Target,
  Camera,
  Trash2,
  Loader2,
  Users,
  UserPlus,
  Swords,
  X,
  MapPin,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWardrobeItems, WardrobeItem } from '@/hooks/useWardrobeItems';
import { useAuth } from '@/contexts/AuthContext';
import { useUpcomingEvents } from '@/hooks/useEvents';
import {
  useShowcasePhotos,
  useUploadShowcasePhoto,
  useDeleteShowcasePhoto,
  ShowcasePhoto,
} from '@/hooks/useShowcasePhotos';
import { PartyFinderModal } from '@/components/cosplay/PartyFinderModal';
import {
  useEventLineupsByCosplay,
  useAssignCosplayToEvent,
  useRemoveCosplayFromEvent,
  EventLineupWithEvent,
} from '@/hooks/useEventLineups';

// ─── Craft Type Config ─────────────────────────────────────────────────────────

const CRAFT_TYPE_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  handmade: {
    label: 'Fait Main',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    emoji: '✋',
  },
  bought: {
    label: 'Acheté',
    color: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    emoji: '🛍️',
  },
  mixed: {
    label: 'Mixte',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    emoji: '🎨',
  },
};

// ─── Priority Config ───────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<number, { label: string; icon: React.ReactNode; color: string }> = {
  1: { label: 'Normale', icon: <Target className="w-3.5 h-3.5" />, color: 'text-[hsl(var(--mp-info))]' },
  2: { label: 'Haute', icon: <Star className="w-3.5 h-3.5" />, color: 'text-[hsl(var(--mp-saffron))]' },
  3: { label: 'Urgente', icon: <Flame className="w-3.5 h-3.5" />, color: 'text-red-400' },
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  accentClass: string;
}

function StatCard({ icon, label, value, unit, accentClass }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300">
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accentClass}`}>
            {icon}
          </div>
          <div>
            <p className="text-xs text-mp-ink-muted uppercase tracking-wider font-medium">{label}</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {value}
              {unit && <span className="text-sm text-mp-ink-muted ml-1 font-normal">{unit}</span>}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Photo Card ────────────────────────────────────────────────────────────────

interface PhotoCardProps {
  photo: ShowcasePhoto;
  cosplayName: string;
  onDelete: (photo: ShowcasePhoto) => void;
  isDeleting: boolean;
}

function PhotoCard({ photo, cosplayName, onDelete, isDeleting }: PhotoCardProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photo.image_url;
    link.download = `${cosplayName.replace(/\s+/g, '-').toLowerCase()}-${photo.id.slice(0, 8)}.jpg`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
      className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white group cursor-pointer"
    >
      <img
        src={photo.image_url}
        alt={photo.caption || cosplayName}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center gap-3">
        {/* Download Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="
            opacity-0 group-hover:opacity-100 transition-opacity duration-200
            w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm
            flex items-center justify-center
            border border-white/30 text-white
            hover:bg-white/30 hover:scale-110 active:scale-95
            transition-all
          "
          onClick={handleDownload}
          aria-label="Télécharger"
          title="Télécharger"
        >
          <Download className="w-5 h-5" />
        </motion.button>

        {/* Delete Button */}
        <motion.button
          className="
            opacity-0 group-hover:opacity-100 transition-opacity duration-200
            w-11 h-11 rounded-full bg-red-500/20 backdrop-blur-sm
            flex items-center justify-center
            border border-red-500/30 text-red-400
            hover:bg-red-500/30 hover:scale-110 active:scale-95
            transition-all
          "
          onClick={() => onDelete(photo)}
          disabled={isDeleting}
          aria-label="Supprimer"
          title="Supprimer"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      {/* Caption */}
      {photo.caption && (
        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-xs text-slate-300 truncate">{photo.caption}</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Photo Gallery ─────────────────────────────────────────────────────────────

interface PhotoGalleryProps {
  cosplayPlanId: string;
  cosplayName: string;
  userId: string;
}

function PhotoGallery({ cosplayPlanId, cosplayName, userId }: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: photos = [], isLoading: isLoadingPhotos } = useShowcasePhotos(cosplayPlanId);
  const uploadPhoto = useUploadShowcasePhoto();
  const deletePhoto = useDeleteShowcasePhoto();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Upload all selected files sequentially
    for (const file of Array.from(files)) {
      await uploadPhoto.mutateAsync({
        file,
        cosplayPlanId,
        userId,
      });
    }

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (photo: ShowcasePhoto) => {
    if (!window.confirm('Supprimer cette photo ? Cette action est irréversible.')) return;
    await deletePhoto.mutateAsync({
      photoId: photo.id,
      imageUrl: photo.image_url,
      cosplayPlanId,
    });
  };

  const isUploading = uploadPhoto.isPending;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--mp-primary))]/20 flex items-center justify-center">
            <Camera className="w-4 h-4 text-[hsl(var(--mp-primary))]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Mes Shootings</h2>
            <p className="text-xs text-mp-ink-muted">
              {isLoadingPhotos
                ? 'Chargement…'
                : photos.length > 0
                ? `${photos.length} photo${photos.length > 1 ? 's' : ''}`
                : 'Aucune photo pour le moment'}
            </p>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Upload Button */}
        <Button
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="
            border-[hsl(var(--mp-primary))]/40 text-[hsl(var(--mp-primary))] hover:bg-[hsl(var(--mp-primary))]/10
            hover:border-[hsl(var(--mp-primary))]/70 hover:shadow-[0_0_12px_rgba(255,0,127,0.3)]
            transition-all duration-200
          "
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Upload en cours…
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter des photos
            </>
          )}
        </Button>
      </div>

      {/* Loading Skeleton */}
      {isLoadingPhotos && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Upload Progress Skeleton */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[hsl(var(--mp-primary))]/10 border border-[hsl(var(--mp-primary))]/20"
        >
          <Loader2 className="w-4 h-4 text-[hsl(var(--mp-primary))] animate-spin shrink-0" />
          <p className="text-sm text-[hsl(var(--mp-primary))]">Upload en cours, ne ferme pas la page…</p>
        </motion.div>
      )}

      {/* Photo Grid */}
      {!isLoadingPhotos && photos.length > 0 && (
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                cosplayName={cosplayName}
                onDelete={handleDelete}
                isDeleting={deletePhoto.isPending}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoadingPhotos && photos.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="
            flex flex-col items-center justify-center py-16 rounded-2xl
            border-2 border-dashed border-white/10
            bg-white/[0.02]
            text-center space-y-4
          "
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(var(--mp-primary))]/20 to-[hsl(var(--mp-info))]/20 flex items-center justify-center">
            <Camera className="w-10 h-10 text-mp-ink-muted" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-300">Aucun shooting pour le moment</h3>
            <p className="text-sm text-mp-ink-muted mt-1 max-w-xs">
              Ajoute tes photos de shooting pour immortaliser ce cosplay dans ta vitrine.
            </p>
          </div>
          <Button
            variant="outline"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="
              border-[hsl(var(--mp-primary))]/40 text-[hsl(var(--mp-primary))] hover:bg-[hsl(var(--mp-primary))]/10
              hover:border-[hsl(var(--mp-primary))]/70 transition-all duration-200
            "
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter mes premières photos
          </Button>
        </motion.div>
      )}
    </motion.section>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

// ─── Event Badge (sub-component) ───────────────────────────────────────────────

interface EventBadgeProps {
  lineup: EventLineupWithEvent;
  onRemove: (lineup: EventLineupWithEvent) => void;
  isRemoving: boolean;
}

function EventBadge({ lineup, onRemove, isRemoving }: EventBadgeProps) {
  const event = lineup.event!;
  const dateFormatted = new Date(event.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.2 }}
      className="
        group flex items-center gap-2 px-3 py-2 rounded-xl
        bg-[hsl(var(--mp-info))]/10 border border-[hsl(var(--mp-info))]/30
        hover:border-[hsl(var(--mp-info))]/60 hover:bg-[hsl(var(--mp-info))]/15
        hover:shadow-[0_0_12px_rgba(0,240,255,0.2)]
        transition-all duration-200
      "
    >
      {/* Event icon */}
      <Calendar className="w-3.5 h-3.5 text-[hsl(var(--mp-info))] shrink-0" />

      {/* Event info */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate leading-tight">
          {event.title}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] text-mp-ink-muted">{dateFormatted}</span>
          {event.city && (
            <>
              <span className="text-[10px] text-mp-ink-muted">·</span>
              <MapPin className="w-2.5 h-2.5 text-mp-ink-muted" />
              <span className="text-[10px] text-mp-ink-muted truncate">{event.city}</span>
            </>
          )}
        </div>
      </div>

      {/* Remove button */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onRemove(lineup)}
        disabled={isRemoving}
        className="
          ml-1 shrink-0 w-5 h-5 rounded-full
          flex items-center justify-center
          bg-red-500/0 hover:bg-red-500/20
          text-mp-ink-muted hover:text-red-400
          border border-transparent hover:border-red-500/30
          transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        aria-label={`Retirer ${event.title}`}
        title={`Retirer ${event.title}`}
      >
        {isRemoving ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <X className="w-3 h-3" />
        )}
      </motion.button>
    </motion.div>
  );
}

// ─── Add Event Dialog (sub-component) ──────────────────────────────────────────

interface AddEventDialogProps {
  open: boolean;
  onClose: () => void;
  cosplayPlanId: string;
  userId: string;
  /** IDs of events already assigned — to exclude them from the list */
  assignedEventIds: string[];
}

function AddEventDialog({
  open,
  onClose,
  cosplayPlanId,
  userId,
  assignedEventIds,
}: AddEventDialogProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const { data: upcomingEvents = [], isLoading: isLoadingEvents } = useUpcomingEvents();
  const assignMutation = useAssignCosplayToEvent();

  // Filter out already-assigned events
  const availableEvents = upcomingEvents.filter(
    (e) => !assignedEventIds.includes(e.id)
  );

  const handleConfirm = async () => {
    if (!selectedEventId) return;
    await assignMutation.mutateAsync({
      cosplayPlanId,
      eventId: selectedEventId,
      userId,
    });
    setSelectedEventId('');
    onClose();
  };

  const handleClose = () => {
    setSelectedEventId('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-slate-950 border border-[hsl(var(--mp-info))]/30 shadow-[0_0_40px_rgba(0,240,255,0.1)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <Calendar className="w-5 h-5 text-[hsl(var(--mp-info))]" />
            Programmer une sortie
          </DialogTitle>
          <DialogDescription className="text-mp-ink-muted text-sm">
            Sélectionne un événement futur pour y associer ce cosplay.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-5 pt-2"
        >
          {/* Event selector */}
          {isLoadingEvents ? (
            <div className="flex items-center gap-2 text-mp-ink-muted text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement des événements…
            </div>
          ) : availableEvents.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <Calendar className="w-10 h-10 text-mp-ink-muted mx-auto" />
              <p className="text-sm text-mp-ink-muted">
                Aucun événement futur disponible.
              </p>
              <p className="text-xs text-mp-ink-muted">
                Tous les événements à venir sont déjà assignés à ce cosplay.
              </p>
            </div>
          ) : (
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="bg-black/40 border-white/20 text-white focus:border-[hsl(var(--mp-info))]/50 focus:ring-[hsl(var(--mp-info))]/20 h-12">
                <SelectValue placeholder="Choisir un événement…" />
              </SelectTrigger>
              <SelectContent className="bg-mp-paper border-white/10 text-white max-h-60">
                {availableEvents.map((event) => {
                  const dateStr = new Date(event.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <SelectItem
                      key={event.id}
                      value={event.id}
                      className="focus:bg-white/10 focus:text-white py-3"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{event.title}</span>
                        <span className="text-xs text-mp-ink-muted">
                          {dateStr}{event.city ? ` · ${event.city}` : ''}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-white/20 text-slate-300 hover:bg-white/5"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedEventId || assignMutation.isPending}
              className="
                flex-1 font-bold
                bg-gradient-to-r from-[hsl(var(--mp-info))]/20 to-[hsl(var(--mp-info))]/10
                border border-[hsl(var(--mp-info))]/50 text-[hsl(var(--mp-info))]
                hover:from-[hsl(var(--mp-info))]/30 hover:to-[hsl(var(--mp-info))]/20
                hover:border-[hsl(var(--mp-info))]/80
                hover:shadow-[0_0_16px_rgba(0,240,255,0.3)]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
              "
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assignation…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Confirmer
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CosplayShowcase() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: allCosplays = [], isLoading } = useWardrobeItems(user?.id);

  // Party Finder modal state
  const [partyFinderOpen, setPartyFinderOpen] = useState(false);
  // Add Event Dialog state
  const [addEventOpen, setAddEventOpen] = useState(false);

  // Find the specific cosplay by ID
  const cosplay = allCosplays.find((c) => c.id === id) as
    | (WardrobeItem & { budget?: number | null })
    | undefined;

  // N:M event lineups for this cosplay
  const { data: eventLineups = [], isLoading: isLoadingLineups } =
    useEventLineupsByCosplay(cosplay?.id);
  const removeMutation = useRemoveCosplayFromEvent();

  const craftConfig = cosplay?.craft_type ? CRAFT_TYPE_CONFIG[cosplay.craft_type] : null;
  const priorityConfig = cosplay?.priority ? PRIORITY_LABELS[cosplay.priority] : null;

  // IDs of already-assigned events (to exclude from the "add" dialog)
  const assignedEventIds = eventLineups.map((l) => l.event_id);

  // Handler to remove a cosplay from an event
  const handleRemoveFromEvent = async (lineup: EventLineupWithEvent) => {
    if (!user?.id || !cosplay?.id) return;
    await removeMutation.mutateAsync({
      lineupId: lineup.id,
      cosplayPlanId: cosplay.id,
      userId: user.id,
    });
  };


  // ── Loading State ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-[hsl(var(--mp-primary))] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // ── Not Found State ──────────────────────────────────────────────────────────
  if (!cosplay) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center gap-6 text-center p-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[hsl(var(--mp-primary))]/20 to-[hsl(var(--mp-info))]/20 flex items-center justify-center">
          <Shirt className="w-12 h-12 text-mp-ink-muted" />
        </div>
        <h1 className="text-2xl font-bold text-white">Cosplay introuvable</h1>
        <p className="text-mp-ink-muted">Ce cosplay n'existe pas ou ne t'appartient pas.</p>
        <Button
          onClick={() => navigate(-1)}
          className="bg-[hsl(var(--mp-primary))] hover:bg-[hsl(var(--mp-primary))]/80 text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* ── Hero Banner ──────────────────────────────────────────────────────── */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        {/* Background Image */}
        {cosplay.image_url ? (
          <img
            src={cosplay.image_url}
            alt={cosplay.character_name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <ImageIcon className="w-24 h-24 text-mp-ink-muted" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-6 left-6 z-10"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="
              bg-black/40 backdrop-blur-sm border border-white/10
              text-white hover:bg-black/60 hover:text-white
              transition-all duration-200
            "
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </motion.div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-3 max-w-3xl"
          >
            {/* Badges Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Finished Badge */}
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/40 text-xs">
                <Trophy className="w-3 h-3 mr-1" />
                Terminé
              </Badge>

              {/* Craft Type Badge */}
              {craftConfig && (
                <Badge className={`border text-xs ${craftConfig.color}`}>
                  {craftConfig.emoji} {craftConfig.label}
                </Badge>
              )}

              {/* Priority Badge */}
              {priorityConfig && (
                <Badge className={`border text-xs bg-transparent ${priorityConfig.color}`}>
                  {priorityConfig.icon}
                  <span className="ml-1">{priorityConfig.label}</span>
                </Badge>
              )}
            </div>

            {/* Character Name */}
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-2xl">
              {cosplay.character_name}
            </h1>

            {/* Universe */}
            <p className="text-xl text-slate-300 font-medium">{cosplay.universe}</p>
          </motion.div>
        </div>
      </section>

      {/* ── Page Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-12 space-y-16">

        {/* ── Battle Report (Stats) ─────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--mp-saffron))]/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-[hsl(var(--mp-saffron))]" />
            </div>
            <h2 className="text-xl font-bold text-white">Rapport de Bataille</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Budget */}
            <StatCard
              icon={<Euro className="w-5 h-5 text-[hsl(var(--mp-saffron))]" />}
              label="Budget Total"
              value={cosplay.budget != null ? cosplay.budget : '—'}
              unit={cosplay.budget != null ? '€' : undefined}
              accentClass="bg-[hsl(var(--mp-saffron))]/10 border border-[hsl(var(--mp-saffron))]/20"
            />

            {/* Target Year */}
            <StatCard
              icon={<Calendar className="w-5 h-5 text-[hsl(var(--mp-info))]" />}
              label="Année Cible"
              value={cosplay.target_year || '—'}
              accentClass="bg-[hsl(var(--mp-info))]/10 border border-[hsl(var(--mp-info))]/20"
            />

            {/* Progress */}
            <StatCard
              icon={<Sparkles className="w-5 h-5 text-[hsl(var(--mp-primary))]" />}
              label="Progression Finale"
              value={cosplay.progress_level}
              unit="%"
              accentClass="bg-[hsl(var(--mp-primary))]/10 border border-[hsl(var(--mp-primary))]/20"
            />
          </div>
        </motion.section>

        {/* ── Mes Prochaines Sorties & Social ──────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="space-y-6"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--mp-info))]/20 flex items-center justify-center">
                <Swords className="w-4 h-4 text-[hsl(var(--mp-info))]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Mes Prochaines Sorties</h2>
                <p className="text-xs text-mp-ink-muted mt-0.5">
                  {isLoadingLineups
                    ? 'Chargement…'
                    : eventLineups.length > 0
                    ? `${eventLineups.length} événement${eventLineups.length > 1 ? 's' : ''} programmé${eventLineups.length > 1 ? 's' : ''}`
                    : 'Aucune sortie programmée'}
                </p>
              </div>
            </div>

            {/* CTA: Add new event */}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={() => setAddEventOpen(true)}
                size="sm"
                className="
                  font-semibold
                  bg-gradient-to-r from-[hsl(var(--mp-info))]/20 to-[hsl(var(--mp-info))]/10
                  border border-[hsl(var(--mp-info))]/40 text-[hsl(var(--mp-info))]
                  hover:from-[hsl(var(--mp-info))]/30 hover:to-[hsl(var(--mp-info))]/20
                  hover:border-[hsl(var(--mp-info))]/70
                  hover:shadow-[0_0_14px_rgba(0,240,255,0.3)]
                  transition-all duration-200
                "
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Programmer une sortie
              </Button>
            </motion.div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-white/10 p-6 space-y-5">
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[hsl(var(--mp-info))]/5 rounded-full blur-3xl pointer-events-none" />

            {/* ── Event Lineups List ─────────────────────────────────────────── */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[hsl(var(--mp-info))]" />
                <h3 className="text-sm font-medium text-slate-300">Événements programmés</h3>
              </div>

              {/* Loading skeleton */}
              {isLoadingLineups && (
                <div className="flex flex-wrap gap-2">
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className="h-12 w-48 rounded-xl bg-white/5 animate-pulse"
                    />
                  ))}
                </div>
              )}

              {/* Event badges list */}
              {!isLoadingLineups && eventLineups.length > 0 && (
                <motion.div layout className="flex flex-wrap gap-2">
                  <AnimatePresence mode="popLayout">
                    {eventLineups.map((lineup) => (
                      <EventBadge
                        key={lineup.id}
                        lineup={lineup}
                        onRemove={handleRemoveFromEvent}
                        isRemoving={removeMutation.isPending}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Empty state */}
              {!isLoadingLineups && eventLineups.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="
                    flex flex-col items-center justify-center py-8 rounded-xl
                    border border-dashed border-white/10 bg-white/[0.02]
                    text-center space-y-3
                  "
                >
                  <Calendar className="w-10 h-10 text-mp-ink-muted" />
                  <div>
                    <p className="text-sm font-medium text-mp-ink-muted">
                      Aucune sortie programmée
                    </p>
                    <p className="text-xs text-mp-ink-muted mt-1">
                      Clique sur "Programmer une sortie" pour associer ce cosplay à un événement.
                    </p>
                  </div>
                  <Button
                    onClick={() => setAddEventOpen(true)}
                    size="sm"
                    variant="outline"
                    className="border-[hsl(var(--mp-info))]/30 text-[hsl(var(--mp-info))] hover:bg-[hsl(var(--mp-info))]/10 mt-1"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Programmer une sortie
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Separator */}
            <div className="relative z-10 h-px bg-white/10" />

            {/* Party Finder CTA */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[hsl(var(--mp-info))]" />
                <h3 className="text-sm font-medium text-slate-300">Trouver une escouade</h3>
              </div>

              <p className="text-xs text-mp-ink-muted">
                Rejoins ou crée un groupe de cosplayers pour cet événement. Coordonnez vos costumes et défilez ensemble !
              </p>

              <Button
                onClick={() => setPartyFinderOpen(true)}
                className="
                  w-full h-12 font-bold
                  bg-gradient-to-r from-[hsl(var(--mp-info))]/20 to-[hsl(var(--mp-saffron))]/20
                  border border-[hsl(var(--mp-info))]/40
                  text-[hsl(var(--mp-info))]
                  hover:from-[hsl(var(--mp-info))]/30 hover:to-[hsl(var(--mp-saffron))]/30
                  hover:border-[hsl(var(--mp-info))]/60
                  hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]
                  transition-all duration-300
                "
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Chercher un binôme / squad
              </Button>
            </div>
          </div>
        </motion.section>

        {/* ── Photo Gallery ─────────────────────────────────────────────────── */}
        {user?.id && (
          <PhotoGallery
            cosplayPlanId={cosplay.id}
            cosplayName={cosplay.character_name}
            userId={user.id}
          />
        )}

      </div>

      {/* Party Finder Modal — agnostic mode: cosplayPlanId pre-filled, eventId optional */}
      {cosplay?.id && (
        <PartyFinderModal
          open={partyFinderOpen}
          onClose={() => setPartyFinderOpen(false)}
          cosplayPlanId={cosplay.id}
          cosplayName={cosplay.character_name}
        />
      )}

      {/* Add Event Dialog */}
      {user?.id && cosplay?.id && (
        <AddEventDialog
          open={addEventOpen}
          onClose={() => setAddEventOpen(false)}
          cosplayPlanId={cosplay.id}
          userId={user.id}
          assignedEventIds={assignedEventIds}
        />
      )}
    </div>
  );
}
