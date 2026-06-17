/**
 * CosplayGridWithDnd Component
 * Grid display for cosplay projects with drag & drop support
 * Includes: Toolbar (search, filter, sort), enriched cards (event badge, priority, context menu)
 * Uses unified WardrobeItem type to display both cosplay_plans and migrated vestiaire items
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  Image,
  Calendar,
  Target,
  Sparkles,
  MoreVertical,
  Edit3,
  Shirt,
  Trash2,
  Flame,
  Star,
  Pencil,
  TrendingUp,
  LayoutDashboard,
  Presentation,
  Camera,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useWardrobeItems, WardrobeItem } from '@/hooks/useWardrobeItems';
import { useCosplayFolders } from '@/hooks/useCosplayFolders';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEvents, Event } from '@/hooks/useEvents';
import { WardrobeToolbar, StatusFilter, SortOption } from './WardrobeToolbar';
import { WardrobeQuickEditSheet } from './WardrobeQuickEditSheet';
import { useDeleteCosplan } from '@/hooks/useCosplans';
import { toast } from 'sonner';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface CosplayGridWithDndProps {
  selectedFolderId: string | null;
}

// ─── Priority Config ───────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  number,
  { label: string; icon: React.ReactNode; color: string; glow: string }
> = {
  3: {
    label: 'Urgent',
    icon: <Flame className="w-3 h-3" />,
    color: 'text-red-400 bg-red-500/20 border-red-500/40',
    glow: 'shadow-[0_0_8px_rgba(239,68,68,0.4)]',
  },
  2: {
    label: 'Haute',
    icon: <Star className="w-3 h-3" />,
    color: 'text-[hsl(var(--mp-saffron))] bg-[hsl(var(--mp-saffron))]/20 border-[hsl(var(--mp-saffron))]/40',
    glow: 'shadow-[0_0_8px_rgba(255,215,0,0.4)]',
  },
  1: {
    label: 'Normale',
    icon: <Target className="w-3 h-3" />,
    color: 'text-[hsl(var(--mp-info))] bg-[hsl(var(--mp-info))]/10 border-[hsl(var(--mp-info))]/30',
    glow: '',
  },
};

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  wishlist: 'from-slate-600 to-slate-700',
  started: 'from-blue-600 to-blue-700',
  paused: 'from-yellow-600 to-yellow-700',
  finished: 'from-green-600 to-green-700',
};

const STATUS_LABELS: Record<string, string> = {
  wishlist: 'Wishlist',
  started: 'En cours',
  paused: 'En pause',
  finished: 'Terminé',
};

// ─── Context Menu ──────────────────────────────────────────────────────────────

interface CardContextMenuProps {
  cosplay: WardrobeItem;
  onEdit: () => void;
  onTransfer: () => void;
  onDelete: () => void;
  onNavigate: (path: string) => void;
}

function CardContextMenu({ cosplay, onEdit, onTransfer, onDelete, onNavigate }: CardContextMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const isInProgress = !cosplay.is_in_wardrobe;

  return (
    <div
      ref={menuRef}
      className="relative"
      // Stop drag propagation so clicking the menu doesn't trigger DnD
      onPointerDown={(e) => e.stopPropagation()}
    >
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="
          w-7 h-7 flex items-center justify-center rounded-full
          bg-black/60 backdrop-blur-sm border border-white/10
          text-mp-ink-muted hover:text-white hover:border-white/30
          transition-all duration-150
        "
        aria-label="Options"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.15 }}
            className="
              absolute right-0 top-9 z-50 w-48
              bg-mp-paper/95 backdrop-blur-md
              border border-white/10 rounded-xl
              shadow-[0_8px_32px_rgba(0,0,0,0.6)]
              overflow-hidden
            "
          >
            {/* Edit */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onEdit();
              }}
              className="
                w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300
                hover:bg-white/10 hover:text-white transition-colors duration-150
              "
            >
              <Edit3 className="w-4 h-4 text-[hsl(var(--mp-info))]" />
              Modifier les infos
            </button>

            {/* Navigation shortcut — Dashboard (in progress) or Showcase (in wardrobe) */}
            {isInProgress ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onNavigate(`/espace-membre/cosplay/${cosplay.id}?tab=tasks`);
                }}
                className="
                  w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300
                  hover:bg-white/10 hover:text-white transition-colors duration-150
                "
              >
                <LayoutDashboard className="w-4 h-4 text-[hsl(var(--mp-saffron))]" />
                Ouvrir le tableau de bord
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onNavigate(`/espace-membre/cosplay/${cosplay.id}?tab=overview`);
                }}
                className="
                  w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300
                  hover:bg-white/10 hover:text-white transition-colors duration-150
                "
              >
                <Presentation className="w-4 h-4 text-[hsl(var(--mp-primary))]" />
                Voir la Vitrine
              </button>
            )}

            {/* Photos shortcut */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onNavigate(`/espace-membre/cosplay/${cosplay.id}?tab=photos`);
              }}
              className="
                w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300
                hover:bg-white/10 hover:text-white transition-colors duration-150
              "
            >
              <Camera className="w-4 h-4 text-teal-400" />
              Voir les photos
            </button>

            {/* Transfer to wardrobe - only if in progress */}
            {isInProgress && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onTransfer();
                }}
                className="
                  w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300
                  hover:bg-white/10 hover:text-white transition-colors duration-150
                "
              >
                <Shirt className="w-4 h-4 text-[hsl(var(--mp-primary))]" />
                Transférer au vestiaire
              </button>
            )}

            {/* Divider */}
            <div className="h-px bg-white/10 mx-2" />

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onDelete();
              }}
              className="
                w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400
                hover:bg-red-500/10 hover:text-red-300 transition-colors duration-150
              "
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Event Badge ───────────────────────────────────────────────────────────────

interface EventBadgeProps {
  eventName: string;
}

function EventBadge({ eventName }: EventBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="
        flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
        bg-[hsl(var(--mp-saffron))]/15 text-[hsl(var(--mp-saffron))] border border-[hsl(var(--mp-saffron))]/30
        shadow-[0_0_8px_rgba(255,215,0,0.25)]
        max-w-[160px]
      "
    >
      <Calendar className="w-3 h-3 shrink-0" />
      <span className="truncate">{eventName}</span>
    </motion.div>
  );
}

// ─── Priority Badge ────────────────────────────────────────────────────────────

interface PriorityBadgeProps {
  priority: number;
}

function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  if (!config) return null;

  return (
    <div
      className={`
        flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
        border ${config.color} ${config.glow}
      `}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}

// ─── Draggable Cosplay Card ────────────────────────────────────────────────────

interface DraggableCosplayCardProps {
  cosplay: WardrobeItem;
  eventMap: Map<string, Event>;
  onNavigate: (cosplay: WardrobeItem) => void;
  onQuickEdit: (cosplay: WardrobeItem) => void;
  onTransfer: (cosplay: WardrobeItem) => void;
  onDelete: (cosplay: WardrobeItem) => void;
  onNavigatePath: (path: string) => void;
}

function DraggableCosplayCard({
  cosplay,
  eventMap,
  onNavigate,
  onQuickEdit,
  onTransfer,
  onDelete,
  onNavigatePath,
}: DraggableCosplayCardProps) {
  // DnD hook — listeners/attributes are spread on the drag handle (the card body)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: cosplay.id,
    data: { type: 'cosplay', cosplay },
  });

  // Craft type badge config
  const craftTypeConfig: Record<string, { label: string; color: string }> = {
    handmade: { label: '✋ Fait Main', color: 'bg-yellow-500/80 text-yellow-900' },
    bought: { label: '🛍️ Acheté', color: 'bg-slate-500/80 text-slate-900' },
    mixed: { label: '🎨 Mixte', color: 'bg-purple-500/80 text-purple-900' },
  };

  const craftType = cosplay.craft_type;
  const craftConfig = craftType ? craftTypeConfig[craftType] : null;

  // Resolve event name from map
  const targetEvent = cosplay.target_event_id ? eventMap.get(cosplay.target_event_id) : null;

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: isDragging ? 0.95 : 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className={`
        relative bg-black/40 backdrop-blur-md border border-white/10 rounded-xl
        hover:border-[hsl(var(--mp-primary))]/50 hover:shadow-[0_0_20px_rgba(255,0,127,0.3)]
        transition-all duration-300 group
        ${isDragging ? 'opacity-40 cursor-grabbing' : ''}
      `}
    >
      {/* ── Drag Handle (entire card except the context menu & quick-edit button) ── */}
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing"
        onClick={() => onNavigate(cosplay)}
      >
        {/* Image Zone */}
        <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-t-xl overflow-hidden">
          {cosplay.image_url ? (
            <img
              src={cosplay.image_url}
              alt={cosplay.character_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="w-12 h-12 text-mp-ink-muted" />
            </div>
          )}

          {/* Status Badge — top right */}
          <div
            className={`
              absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold
              bg-gradient-to-r ${STATUS_COLORS[cosplay.status]} text-white shadow-lg
            `}
          >
            {STATUS_LABELS[cosplay.status]}
          </div>

          {/* Craft Type Badge — top left (only if image exists) */}
          {craftConfig && cosplay.image_url && (
            <div
              className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold ${craftConfig.color} shadow-lg`}
            >
              {craftConfig.label}
            </div>
          )}

          {/* Gradient overlay at bottom for readability */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Content Zone */}
        <div className="p-4 space-y-3">
          {/* Character Name */}
          <h3 className="text-lg font-bold text-white truncate leading-tight">
            {cosplay.character_name}
          </h3>

          {/* Universe */}
          <p className="text-sm text-mp-ink-muted truncate">{cosplay.universe}</p>

          {/* Event Badge */}
          {targetEvent && <EventBadge eventName={targetEvent.title} />}

          {/* Priority + Craft (if no image) */}
          <div className="flex items-center gap-2 flex-wrap">
            {cosplay.priority > 0 && <PriorityBadge priority={cosplay.priority} />}
            {craftConfig && !cosplay.image_url && (
              <div
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${craftConfig.color}`}
              >
                {craftConfig.label}
              </div>
            )}
          </div>

          {/* Progress Bar — only for in-progress items (Tâche 3: enhanced visibility) */}
          {!cosplay.is_in_wardrobe && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-[hsl(var(--mp-primary))]" />
                  <span className="text-xs text-mp-ink-muted font-medium">Progression</span>
                </div>
                <motion.span
                  className="text-sm font-bold"
                  style={{
                    color: cosplay.progress_level === 100
                      ? '#00FF88'
                      : cosplay.progress_level >= 50
                      ? 'hsl(var(--mp-info))'
                      : 'hsl(var(--mp-primary))',
                  }}
                  animate={{ scale: cosplay.progress_level === 100 ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {cosplay.progress_level}%
                </motion.span>
              </div>
              {/* shadcn Progress + custom glow */}
              <div
                className="relative"
                style={{
                  filter: cosplay.progress_level > 0
                    ? `drop-shadow(0 0 4px ${cosplay.progress_level === 100 ? '#00FF88' : 'hsl(var(--mp-primary))'}60)`
                    : 'none',
                }}
              >
                <Progress
                  value={cosplay.progress_level}
                  className="h-2.5 bg-white/80 [&>div]:bg-gradient-to-r [&>div]:from-[hsl(var(--mp-primary))] [&>div]:to-[hsl(var(--mp-primary))]/70"
                />
              </div>
            </div>
          )}

          {/* Meta: year */}
          {cosplay.target_year && (
            <div className="flex items-center gap-1 text-xs text-mp-ink-muted">
              <Calendar className="w-3 h-3" />
              <span>{cosplay.target_year}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Edit Button (Pencil) — outside drag handle ── */}
      {/* Appears on hover, positioned below the status badge */}
      <div
        className="absolute top-12 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col gap-1.5"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onQuickEdit(cosplay);
          }}
          className="
            w-7 h-7 flex items-center justify-center rounded-full
            bg-[hsl(var(--mp-info))]/20 backdrop-blur-sm border border-[hsl(var(--mp-info))]/40
            text-[hsl(var(--mp-info))] hover:bg-[hsl(var(--mp-info))]/30
            shadow-[0_0_8px_rgba(0,240,255,0.3)]
            transition-all duration-150
          "
          aria-label="Édition rapide"
          title="Édition rapide"
        >
          <Pencil className="w-3.5 h-3.5" />
        </motion.button>

        {/* Photos shortcut button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onNavigatePath(`/espace-membre/cosplay/${cosplay.id}?tab=photos`);
          }}
          className="
            w-7 h-7 flex items-center justify-center rounded-full
            bg-teal-500/20 backdrop-blur-sm border border-teal-500/40
            text-teal-400 hover:bg-teal-500/30
            shadow-[0_0_8px_rgba(20,184,166,0.3)]
            transition-all duration-150
          "
          aria-label="Voir les photos"
          title="Voir les photos"
        >
          <Camera className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* ── Context Menu (3 dots) — outside drag handle ── */}
      {/* Positioned below the quick-edit + photos buttons */}
      <div className="absolute top-[calc(3rem+4.5rem)] right-2 z-20">
        <CardContextMenu
          cosplay={cosplay}
          onEdit={() => onQuickEdit(cosplay)}
          onTransfer={() => onTransfer(cosplay)}
          onDelete={() => onDelete(cosplay)}
          onNavigate={onNavigatePath}
        />
      </div>

      {/* Sparkle drag hint on hover */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
        <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--mp-info))]" />
      </div>
    </motion.div>
  );
}

// ─── Main Grid Component ───────────────────────────────────────────────────────

export function CosplayGridWithDnd({ selectedFolderId }: CosplayGridWithDndProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: cosplays = [], isLoading } = useWardrobeItems(user?.id);
  const { moveCosplayToFolder } = useCosplayFolders();
  const { toast } = useToast();
  const { data: events = [] } = useEvents();
  const deleteCosplan = useDeleteCosplan();

  // ── DnD Sensors — activationConstraint prevents click/drag conflict ──────────
  // A drag only starts after 5px of movement, allowing normal clicks to navigate
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Must move 5px before drag activates
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // 150ms hold on touch before drag starts
        tolerance: 5,
      },
    })
  );

  // ── Toolbar States ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [universeFilter, setUniverseFilter] = useState<string | null>(null);

  // ── Quick Edit Sheet State ──────────────────────────────────────────────────
  const [quickEditCosplay, setQuickEditCosplay] = useState<WardrobeItem | null>(null);
  const [quickEditOpen, setQuickEditOpen] = useState(false);

  // ── DnD States ──────────────────────────────────────────────────────────────
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // ── Build event lookup map ──────────────────────────────────────────────────
  const eventMap = useMemo(() => {
    const map = new Map<string, Event>();
    events.forEach((ev) => map.set(ev.id, ev));
    return map;
  }, [events]);

  // ── Folder filter ───────────────────────────────────────────────────────────
  const folderFiltered = useMemo(() => {
    if (selectedFolderId === null) return cosplays;
    return cosplays.filter((c) => c.folder_id === selectedFolderId);
  }, [selectedFolderId, cosplays]);

  // ── Available universes (Tâche 4B) ─────────────────────────────────────────
  const availableUniverses = useMemo(() => {
    const set = new Set(cosplays.map((c) => c.universe).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [cosplays]);

  // ── Status filter ───────────────────────────────────────────────────────────
  const statusFiltered = useMemo(() => {
    switch (statusFilter) {
      case 'in_progress':
        return folderFiltered.filter((c) => !c.is_in_wardrobe);
      case 'finished':
        return folderFiltered.filter((c) => c.is_in_wardrobe);
      default:
        return folderFiltered;
    }
  }, [statusFilter, folderFiltered]);

  // ── Universe filter (Tâche 4B) ──────────────────────────────────────────────
  const universeFiltered = useMemo(() => {
    if (!universeFilter) return statusFiltered;
    return statusFiltered.filter((c) => c.universe === universeFilter);
  }, [universeFilter, statusFiltered]);

  // ── Search filter ───────────────────────────────────────────────────────────
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return universeFiltered;
    const q = searchQuery.toLowerCase();
    return universeFiltered.filter(
      (c) =>
        c.character_name.toLowerCase().includes(q) ||
        c.universe.toLowerCase().includes(q)
    );
  }, [searchQuery, universeFiltered]);

  // ── Sort ────────────────────────────────────────────────────────────────────
  const displayedCosplays = useMemo(() => {
    const arr = [...searchFiltered];
    switch (sortOption) {
      case 'alpha':
        return arr.sort((a, b) => a.character_name.localeCompare(b.character_name));
      case 'priority_desc':
        return arr.sort((a, b) => b.priority - a.priority);
      case 'recent':
      default:
        return arr.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  }, [searchFiltered, sortOption]);

  // ── DnD Handlers ────────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const cosplayId = active.id as string;
    const overData = over.data.current;

    if (overData?.type === 'folder') {
      const targetFolderId = overData.folderId;
      const success = await moveCosplayToFolder({
        cosplay_id: cosplayId,
        folder_id: targetFolderId,
      });

      if (success) {
        toast({
          title: 'Succès',
          description: targetFolderId
            ? 'Cosplay déplacé dans le dossier'
            : 'Cosplay déplacé vers la racine',
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de déplacer le cosplay',
          variant: 'destructive',
        });
      }
    }
  };

  // ── Card Action Handlers ─────────────────────────────────────────────────────

  /**
   * Smart navigation on card click:
   * - In-progress cosplay → /espace-membre/projets/:id (future Kanban dashboard)
   * - Finished cosplay (in wardrobe) → /espace-membre/vestiaire/:id (Showcase page)
   */
  const handleNavigate = (cosplay: WardrobeItem) => {
    if (!cosplay.is_in_wardrobe) {
      // Navigate to the project dashboard (route to be created in a future iteration)
      navigate(`/espace-membre/cosplay/${cosplay.id}?tab=tasks`);
    } else {
      // Navigate to the Showcase (Vitrine) page
      navigate(`/espace-membre/cosplay/${cosplay.id}?tab=overview`);
    }
  };

  /** Open the Quick Edit Sheet */
  const handleQuickEdit = (cosplay: WardrobeItem) => {
    setQuickEditCosplay(cosplay);
    setQuickEditOpen(true);
  };

  const handleTransfer = (cosplay: WardrobeItem) => {
    // TODO: Open TransferToVestiaireModal
    console.log('Transfer cosplay to wardrobe:', cosplay);
  };

  const handleDelete = async (cosplay: WardrobeItem) => {
    if (!user?.id) return;
    if (!window.confirm(`Supprimer "${cosplay.character_name}" ? Cette action est irréversible.`)) return;

    try {
      await deleteCosplan.mutateAsync({ id: cosplay.id, userId: user.id });
      toast({ title: 'Supprimé', description: `"${cosplay.character_name}" a été supprimé.` });
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer ce cosplay.', variant: 'destructive' });
    }
  };

  // ── Loading State ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="h-24 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-80 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const activeCosplay = cosplays.find((c) => c.id === activeDragId);

  return (
    <>
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white">
            {selectedFolderId === null ? '📚 Tous mes cosplays' : '📁 Dossier'}
          </h2>
        </div>

        {/* Toolbar */}
        <WardrobeToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortOption={sortOption}
          onSortChange={setSortOption}
          totalCount={folderFiltered.length}
          filteredCount={displayedCosplays.length}
          universes={availableUniverses}
          universeFilter={universeFilter}
          onUniverseFilterChange={setUniverseFilter}
        />

        {/* Empty State */}
        {displayedCosplays.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center space-y-4"
          >
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[hsl(var(--mp-primary))]/20 to-[hsl(var(--mp-info))]/20 rounded-full flex items-center justify-center">
              <Image className="w-12 h-12 text-mp-ink-muted" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {searchQuery || statusFilter !== 'all'
                ? 'Aucun résultat pour ces filtres'
                : selectedFolderId === null
                ? 'Aucun cosplay pour le moment'
                : 'Ce dossier est vide'}
            </h3>
            <p className="text-mp-ink-muted max-w-sm">
              {searchQuery || statusFilter !== 'all'
                ? 'Essayez de modifier votre recherche ou vos filtres.'
                : selectedFolderId === null
                ? 'Créez votre premier projet cosplay pour commencer !'
                : 'Glissez-déposez des cosplays ici pour les organiser.'}
            </p>
          </motion.div>
        )}

        {/* Grid */}
        {displayedCosplays.length > 0 && (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {displayedCosplays.map((cosplay) => (
                <DraggableCosplayCard
                  key={cosplay.id}
                  cosplay={cosplay}
                  eventMap={eventMap}
                  onNavigate={handleNavigate}
                  onQuickEdit={handleQuickEdit}
                  onTransfer={handleTransfer}
                  onDelete={handleDelete}
                  onNavigatePath={navigate}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeCosplay && (
          <div className="bg-black/60 backdrop-blur-md border border-[hsl(var(--mp-primary))] rounded-xl p-4 shadow-[0_0_30px_rgba(255,0,127,0.5)] rotate-2">
            <div className="flex items-center gap-3">
              {activeCosplay.image_url ? (
                <img
                  src={activeCosplay.image_url}
                  alt={activeCosplay.character_name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                  <Image className="w-8 h-8 text-mp-ink-muted" />
                </div>
              )}
              <div>
                <h4 className="text-white font-bold">{activeCosplay.character_name}</h4>
                <p className="text-sm text-mp-ink-muted">{activeCosplay.universe}</p>
              </div>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>

    {/* ── Quick Edit Sheet — rendered outside DndContext to avoid z-index issues ── */}
    <WardrobeQuickEditSheet
      cosplay={quickEditCosplay}
      open={quickEditOpen}
      onOpenChange={(open) => {
        setQuickEditOpen(open);
        if (!open) setQuickEditCosplay(null);
      }}
      allCosplays={cosplays}
    />
  </>
  );
}
