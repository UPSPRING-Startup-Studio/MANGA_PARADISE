import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GripVertical,
  Save,
  Loader2,
  Music,
  Lightbulb,
  Baby,
  Users,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

interface PassageOrderTabProps {
  registrations: any[];
  eventId: string;
}

// Sortable Item Component
const SortableCandidate = ({ candidate, index }: { candidate: any; index: number }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const profile = candidate.profiles;
  const displayName = profile?.display_name || profile?.username || "Anonyme";
  const avatarUrl = profile?.avatar_url;

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasAudio = !!candidate.audio_url;
  const needsLighting = candidate.needs_lighting;
  const isMinor = candidate.is_minor;

  const formatLabel =
    candidate.format === "solo"
      ? "Solo"
      : candidate.format === "duo"
      ? "Duo"
      : candidate.format === "group"
      ? "Groupe"
      : candidate.format;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200">
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Passage Number */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-sakura/20 border-2 border-sakura">
            <span className="text-xl font-bold text-sakura">{index + 1}</span>
          </div>

          {/* Avatar */}
          <Avatar className="w-12 h-12 border-2 border-sakura/30">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-sakura/20 text-sakura font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm truncate">{candidate.character_name}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {candidate.universe}
            </p>
          </div>

          {/* Format Badge */}
          <Badge
            variant="outline"
            className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs"
          >
            <Users className="w-3 h-3 mr-1" />
            {formatLabel}
          </Badge>

          {/* Indicators */}
          <div className="flex items-center gap-2">
            {hasAudio && (
              <Badge
                variant="outline"
                className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs"
                title="Fichier audio fourni"
              >
                <Music className="w-3 h-3" />
              </Badge>
            )}
            {needsLighting && (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs"
                title="Demande d'éclairage spécial"
              >
                <Lightbulb className="w-3 h-3" />
              </Badge>
            )}
            {isMinor && (
              <Badge
                variant="outline"
                className="bg-red-500/10 text-red-400 border-red-500/30 text-xs"
                title="Participant mineur"
              >
                <Baby className="w-3 h-3" />
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export const PassageOrderTab = ({ registrations, eventId }: PassageOrderTabProps) => {
  const queryClient = useQueryClient();

  // Filter only approved candidates and sort by passage_order
  const approvedCandidates = registrations
    .filter((r: any) => r.status === "approved")
    .sort((a: any, b: any) => {
      // If both have passage_order, sort by it
      if (a.passage_order !== null && b.passage_order !== null) {
        return a.passage_order - b.passage_order;
      }
      // If only one has passage_order, it comes first
      if (a.passage_order !== null) return -1;
      if (b.passage_order !== null) return 1;
      // Otherwise, sort by created_at
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  const [items, setItems] = useState(approvedCandidates);
  const [isSaving, setIsSaving] = useState(false);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Save order mutation
  const saveOrderMutation = useMutation({
    mutationFn: async () => {
      // Update passage_order for each candidate
      const updates = items.map((item, index) => ({
        id: item.id,
        passage_order: index + 1,
      }));

      // Batch update
      const promises = updates.map((update) =>
        supabase
          .from("contest_registrations" as any)
          .update({ passage_order: update.passage_order })
          .eq("id", update.id)
      );

      const results = await Promise.all(promises);

      // Check for errors
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error("Erreur lors de la sauvegarde de l'ordre");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contest-registrations"] });
      toast.success("Ordre de passage sauvegardé !");
    },
    onError: (error) => {
      console.error("Error saving order:", error);
      toast.error("Erreur lors de la sauvegarde de l'ordre");
    },
  });

  const handleSaveOrder = async () => {
    setIsSaving(true);
    try {
      await saveOrderMutation.mutateAsync();
    } finally {
      setIsSaving(false);
    }
  };

  if (approvedCandidates.length === 0) {
    return (
      <Card className="p-6 bg-white/5 border-white/10">
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="font-display font-bold text-xl mb-2">
            Aucun candidat validé
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Validez des candidatures dans l'onglet "Candidats" pour pouvoir
            organiser l'ordre de passage.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-white/5 border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[hsl(var(--mp-saffron))]" />
              Ordre de Passage
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Glissez-déposez les cartes pour réorganiser l'ordre de passage des
              candidats validés.
            </p>
          </div>
          <Button
            onClick={handleSaveOrder}
            disabled={isSaving}
            className="bg-sakura hover:bg-sakura/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder l'ordre
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Sortable List */}
      <Card className="p-6 bg-white/5 border-white/10">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map((candidate, index) => (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SortableCandidate candidate={candidate} index={index} />
                </motion.div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/30">
        <p className="text-sm text-blue-400">
          💡 <strong>Astuce :</strong> L'ordre que vous définissez ici sera utilisé
          dans la vue "Live" pour annoncer les candidats sur scène.
        </p>
      </Card>
    </div>
  );
};
