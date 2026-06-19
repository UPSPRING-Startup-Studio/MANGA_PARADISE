import { motion } from "framer-motion";
import { X, Trophy, Music, Image as ImageIcon, CheckCircle, Clock, DoorOpen, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { type ContestRegistrationData, type ContestStatus } from "./ContestActivityModule";

interface ContestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contestData: ContestRegistrationData;
}

// Get status styling configuration
const getStatusConfig = (status: ContestStatus) => {
  switch (status) {
    case "approved":
      return {
        bgColor: "bg-green-500/20",
        borderColor: "border-green-500",
        textColor: "text-green-400",
        label: "Validé",
        icon: CheckCircle,
      };
    case "pending":
      return {
        bgColor: "bg-yellow-500/20",
        borderColor: "border-yellow-500",
        textColor: "text-yellow-400",
        label: "En examen",
        icon: Clock,
      };
    case "waitlist":
      return {
        bgColor: "bg-blue-500/20",
        borderColor: "border-blue-500",
        textColor: "text-blue-400",
        label: "Liste d'attente",
        icon: Clock,
      };
    case "rejected":
      return {
        bgColor: "bg-red-500/20",
        borderColor: "border-red-500",
        textColor: "text-red-400",
        label: "Refusé",
        icon: X,
      };
  }
};

/**
 * ContestDetailModal - "Fiche Candidat Complète"
 * 
 * Modal affichant le récapitulatif complet de l'inscription au concours.
 * Accessible en cliquant sur le ContestActivityModule.
 */
export const ContestDetailModal = ({ isOpen, onClose, contestData }: ContestDetailModalProps) => {
  const statusConfig = getStatusConfig(contestData.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-mp-paper border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-[hsl(var(--mp-saffron))]" />
              <DialogTitle className="font-display text-2xl text-white">
                {contestData.contest_name || "Ma Compétition"}
              </DialogTitle>
            </div>
            <Badge
              className={cn(
                "border-2 font-semibold",
                statusConfig.bgColor,
                statusConfig.borderColor,
                statusConfig.textColor
              )}
            >
              <StatusIcon className="w-4 h-4 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Section: Mes Infos */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-display text-white mb-3 flex items-center gap-2">
              📝 Mes Informations
            </h3>
            <div className="bg-white/50 backdrop-blur-md border border-white/10 rounded-lg p-4 space-y-3">
              {/* Personnage */}
              <div>
                <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Personnage</div>
                <div className="text-white font-semibold text-lg">{contestData.character_name}</div>
                {contestData.universe && (
                  <div className="text-white/60 text-sm">{contestData.universe}</div>
                )}
              </div>

              {/* Description */}
              {contestData.description && (
                <div>
                  <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Description</div>
                  <div className="text-white/80 text-sm">{contestData.description}</div>
                </div>
              )}

              {/* Format & Groupe */}
              <div className="grid grid-cols-2 gap-4">
                {contestData.format && (
                  <div>
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Format</div>
                    <div className="text-white font-medium">{contestData.format}</div>
                  </div>
                )}
                {contestData.group_name && (
                  <div>
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Groupe</div>
                    <div className="text-white font-medium flex items-center gap-1">
                      <Users className="w-4 h-4 text-[hsl(var(--mp-saffron))]" />
                      {contestData.group_name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <Separator className="bg-white/10" />

          {/* Section: Média */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-display text-white mb-3 flex items-center gap-2">
              🎵 Média
            </h3>
            <div className="bg-white/50 backdrop-blur-md border border-white/10 rounded-lg p-4">
              {contestData.media_url ? (
                <div className="flex items-center gap-3">
                  {contestData.media_type === "audio" ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Music className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          Bande son reçue
                        </div>
                        <div className="text-white/50 text-sm">Fichier audio validé</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-400" />
                          Image de référence reçue
                        </div>
                        <div className="text-white/50 text-sm">Aperçu disponible</div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-white/50 text-sm text-center py-2">
                  Aucun média fourni
                </div>
              )}
            </div>
          </motion.div>

          <Separator className="bg-white/10" />

          {/* Section: Planning (si validé) */}
          {contestData.status === "approved" && (contestData.judging_time || contestData.passage_time) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-lg font-display text-white mb-3 flex items-center gap-2">
                📍 Mon Planning
              </h3>
              <div className="space-y-3">
                {/* Pré-judging */}
                {contestData.judging_time && (
                  <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <DoorOpen className="w-8 h-8 text-cyan-400" />
                      <div className="flex-1">
                        <div className="text-xs text-cyan-300 font-semibold uppercase tracking-wider">
                          Convocation Pré-judging
                        </div>
                        <div className="text-2xl font-display text-white font-bold">
                          {contestData.judging_time}
                        </div>
                        <div className="text-xs text-white/60 mt-1">
                          Présente-toi en coulisses pour la validation jury
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Passage Scène */}
                {contestData.passage_time && (
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-8 h-8 text-green-400 animate-pulse" />
                      <div className="flex-1">
                        <div className="text-xs text-green-300 font-semibold uppercase tracking-wider">
                          Passage Scène
                        </div>
                        <div className="text-2xl font-display text-white font-bold">
                          {contestData.passage_time}
                        </div>
                        {contestData.passage_order && (
                          <div className="text-xs text-white/60 mt-1">
                            Tu passes en #{contestData.passage_order}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Message selon le statut */}
          {contestData.status === "pending" && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
              <div className="text-yellow-400 font-semibold mb-1">⏳ En cours de validation</div>
              <div className="text-white/60 text-sm">
                L'équipe organisatrice examine actuellement ta candidature. Tu recevras une notification dès validation.
              </div>
            </div>
          )}

          {contestData.status === "waitlist" && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
              <div className="text-blue-400 font-semibold mb-1">ℹ️ Liste d'attente</div>
              <div className="text-white/60 text-sm">
                Tu es sur liste d'attente. Si une place se libère, nous te contacterons immédiatement.
              </div>
            </div>
          )}

          {contestData.status === "rejected" && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <div className="text-red-400 font-semibold mb-1">❌ Candidature non retenue</div>
              <div className="text-white/60 text-sm">
                Malheureusement, ta candidature n'a pas été retenue pour cette édition. N'hésite pas à retenter ta chance lors du prochain événement !
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-sakura to-primary hover:from-sakura/90 hover:to-primary/90 text-white"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
