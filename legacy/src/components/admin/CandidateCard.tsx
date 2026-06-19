import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Music, Lightbulb, Baby, Users, Trash2, Loader2 } from "lucide-react";
import { useDeleteContestRegistration } from "@/hooks/useDeleteContestRegistration";

interface CandidateCardProps {
  registration: any;
  onClick: () => void;
}

export const CandidateCard = ({ registration, onClick }: CandidateCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteRegistration = useDeleteContestRegistration();

  const profile = registration.profiles;
  const displayName = profile?.display_name || profile?.username || "Anonyme";
  const avatarUrl = profile?.avatar_url;

  // Get initials for avatar fallback
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Check for special indicators
  const hasAudio = !!registration.audio_url;
  const needsLighting = registration.needs_lighting;
  const isMinor = registration.is_minor;

  // Format type
  const formatLabel = registration.format === "solo" ? "Solo" : 
                      registration.format === "duo" ? "Duo" :
                      registration.format === "group" ? "Groupe" : 
                      registration.format;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    await deleteRegistration.mutateAsync(registration.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          onClick={onClick}
          className="p-4 bg-white/5 border-white/10 hover:bg-white/10 hover:border-sakura/30 cursor-pointer transition-all duration-200"
        >
          {/* Header: Avatar + Name + Delete Button */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-12 h-12 border-2 border-sakura/30">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-sakura/20 text-sakura font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm truncate">{registration.character_name}</h4>
              <p className="text-xs text-muted-foreground truncate">{registration.universe}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              disabled={deleteRegistration.isPending}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
              title="Supprimer la candidature"
            >
              {deleteRegistration.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>

        {/* Format Badge */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs">
            <Users className="w-3 h-3 mr-1" />
            {formatLabel}
          </Badge>
        </div>

        {/* Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasAudio && (
            <Badge
              variant="outline"
              className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs"
              title="Fichier audio fourni"
            >
              <Music className="w-3 h-3 mr-1" />
              Audio
            </Badge>
          )}
          {needsLighting && (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs"
              title="Demande d'éclairage spécial"
            >
              <Lightbulb className="w-3 h-3 mr-1" />
              Lumière
            </Badge>
          )}
          {isMinor && (
            <Badge
              variant="outline"
              className="bg-red-500/10 text-red-400 border-red-500/30 text-xs"
              title="Participant mineur"
            >
              <Baby className="w-3 h-3 mr-1" />
              Mineur
            </Badge>
          )}
        </div>

          {/* User info at bottom */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-muted-foreground">
              Par <span className="text-foreground font-medium">{displayName}</span>
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-950 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-display text-sakura">
              Supprimer la candidature ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Cette action est irréversible. L'historique et les fichiers du candidat seront supprimés. Il pourra alors se réinscrire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 hover:bg-white/5">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteRegistration.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteRegistration.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer définitivement"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
