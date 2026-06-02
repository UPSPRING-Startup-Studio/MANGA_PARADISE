import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Music,
  Lightbulb,
  Baby,
  Users,
  Image as ImageIcon,
  FileText,
  Loader2,
  Download,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CandidateDetailSheetProps {
  registration: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CandidateDetailSheet = ({
  registration,
  open,
  onOpenChange,
}: CandidateDetailSheetProps) => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const profile = registration?.profiles;
  const displayName = profile?.display_name || profile?.username || "Anonyme";
  const avatarUrl = profile?.avatar_url;

  // Get initials for avatar fallback
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from("contest_registrations" as any)
        .update({ status: newStatus })
        .eq("id", registration.id);

      if (error) throw error;
    },
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["contest-registrations"] });
      const statusLabels: Record<string, string> = {
        approved: "validée",
        rejected: "refusée",
        waitlist: "mise en liste d'attente",
        pending: "remise en attente de validation",
      };
      toast.success(`Candidature ${statusLabels[newStatus] || "mise à jour"} !`);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error updating status:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    },
  });

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateStatusMutation.mutateAsync(newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!registration) return null;

  const formatLabel =
    registration.format === "solo"
      ? "Solo"
      : registration.format === "duo"
      ? "Duo"
      : registration.format === "group"
      ? "Groupe"
      : registration.format;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl bg-slate-950 border-white/10 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-display flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-sakura/30">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-sakura/20 text-sakura font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl">{registration.character_name}</div>
              <div className="text-sm text-muted-foreground font-normal">
                {registration.universe}
              </div>
            </div>
          </SheetTitle>
          <SheetDescription>
            Dossier de candidature complet - Inscrit le{" "}
            {format(new Date(registration.created_at), "d MMMM yyyy à HH:mm", {
              locale: fr,
            })}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Submission Status Block - Highly Visible */}
          <div className="bg-gradient-to-r from-sakura/10 to-purple-600/10 border-2 border-sakura/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-sakura" />
                <span className="font-bold text-white">Dossier soumis le</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {format(new Date(registration.created_at), "d MMMM yyyy à HH:mm", {
                  locale: fr,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Statut actuel :</span>
              <Badge
                variant="outline"
                className={
                  registration.status === "pending"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold"
                    : registration.status === "approved"
                    ? "bg-green-500/20 text-green-300 border-green-500/50 font-bold"
                    : registration.status === "rejected"
                    ? "bg-red-500/20 text-red-300 border-red-500/50 font-bold"
                    : "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold"
                }
              >
                {registration.status === "pending" && "⏳ En attente de validation"}
                {registration.status === "approved" && "✅ Validé"}
                {registration.status === "rejected" && "❌ Refusé"}
                {registration.status === "waitlist" && "⏳ Liste d'attente"}
              </Badge>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                registration.status === "pending"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : registration.status === "approved"
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : registration.status === "rejected"
                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
              }
            >
              {registration.status === "pending" && "À valider"}
              {registration.status === "approved" && "Validé"}
              {registration.status === "rejected" && "Refusé"}
              {registration.status === "waitlist" && "Liste d'attente"}
            </Badge>
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
              <Users className="w-3 h-3 mr-1" />
              {formatLabel}
            </Badge>
          </div>

          <Separator className="bg-white/10" />

          {/* Section: Identité */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-sakura" />
              Identité du Participant
            </h3>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Utilisateur</span>
                <span className="text-sm font-medium">{displayName}</span>
              </div>
              {registration.is_minor && (
                <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
                  <Baby className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-400 font-medium">
                    Participant mineur - Autorisation parentale requise
                  </span>
                </div>
              )}
              {registration.parental_consent_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => window.open(registration.parental_consent_url, "_blank")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger l'autorisation parentale
                </Button>
              )}
            </div>
          </div>

          {/* Section: Artistique */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-sakura" />
              Références Visuelles
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {registration.reference_image_url && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Image de Référence
                  </p>
                  <a
                    href={registration.reference_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative group"
                  >
                    <img
                      src={registration.reference_image_url}
                      alt="Référence"
                      className="w-full h-48 object-cover rounded-lg border border-white/10 group-hover:border-sakura/50 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                  </a>
                </div>
              )}
              {registration.wip_image_url && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Work In Progress
                  </p>
                  <a
                    href={registration.wip_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative group"
                  >
                    <img
                      src={registration.wip_image_url}
                      alt="WIP"
                      className="w-full h-48 object-cover rounded-lg border border-white/10 group-hover:border-sakura/50 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Section: Technique */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <Music className="w-5 h-5 text-sakura" />
              Éléments Techniques
            </h3>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              {registration.audio_url && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium">Bande Son</span>
                  </div>
                  <audio
                    controls
                    className="w-full"
                    src={registration.audio_url}
                    preload="metadata"
                  >
                    Votre navigateur ne supporte pas la lecture audio.
                  </audio>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(registration.audio_url, "_blank")}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger le fichier audio
                  </Button>
                </div>
              )}

              {registration.needs_lighting && (
                <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-amber-400 font-medium">
                    Demande d'éclairage spécial
                  </span>
                </div>
              )}

              {registration.lighting_details && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Détails Éclairage
                  </p>
                  <p className="text-sm bg-white/5 p-2 rounded border border-white/10">
                    {registration.lighting_details}
                  </p>
                </div>
              )}

              {registration.props_details && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Accessoires / Décors
                  </p>
                  <p className="text-sm bg-white/5 p-2 rounded border border-white/10">
                    {registration.props_details}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Actions de Modération */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-lg">Actions de Modération</h3>
            <div className="grid grid-cols-1 gap-3">
              <AnimatePresence mode="wait">
                {isUpdating ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center py-4"
                  >
                    <Loader2 className="w-6 h-6 animate-spin text-sakura" />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 gap-3"
                  >
                    {registration.status !== "approved" && (
                      <Button
                        onClick={() => handleStatusChange("approved")}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Valider la Candidature
                      </Button>
                    )}
                    {registration.status !== "rejected" && (
                      <Button
                        onClick={() => handleStatusChange("rejected")}
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Refuser la Candidature
                      </Button>
                    )}
                    {registration.status !== "waitlist" && (
                      <Button
                        onClick={() => handleStatusChange("waitlist")}
                        variant="outline"
                        className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Mettre en Liste d'Attente
                      </Button>
                    )}
                    {registration.status !== "pending" && (
                      <Button
                        onClick={() => handleStatusChange("pending")}
                        variant="outline"
                        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Remettre en Attente de Validation
                      </Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
