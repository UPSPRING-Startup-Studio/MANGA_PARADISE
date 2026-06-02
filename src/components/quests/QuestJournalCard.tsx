import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Scroll, 
  CheckCircle, 
  Clock, 
  XCircle,
  Send,
  Coins,
  Zap,
  Loader2
} from "lucide-react";
import type { QuestSubmission } from "@/hooks/useVolunteerQuests";

interface QuestJournalCardProps {
  submission: QuestSubmission;
  onSubmitProof: (submissionId: string, proofText: string, proofLink?: string) => void;
  isSubmitting?: boolean;
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  in_progress: { icon: <Clock className="w-4 h-4" />, label: "En cours", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  pending: { icon: <Scroll className="w-4 h-4" />, label: "En attente", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  approved: { icon: <CheckCircle className="w-4 h-4" />, label: "Validée", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  rejected: { icon: <XCircle className="w-4 h-4" />, label: "Refusée", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export const QuestJournalCard = ({ submission, onSubmitProof, isSubmitting }: QuestJournalCardProps) => {
  const [showModal, setShowModal] = useState(false);
  const [proofText, setProofText] = useState("");
  const [proofLink, setProofLink] = useState("");

  const status = statusConfig[submission.status] || statusConfig.in_progress;
  const quest = submission.quest;

  const handleSubmit = () => {
    if (!proofText.trim()) return;
    onSubmitProof(submission.id, proofText, proofLink);
    setShowModal(false);
    setProofText("");
    setProofLink("");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full"
      >
        <Card className="p-4 bg-gradient-to-r from-card to-card/80 border border-border hover:border-sakura/30 transition-all">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="text-3xl">{quest?.icon || "📜"}</div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-base leading-tight">{quest?.title}</h3>
                <Badge className={`${status.color} flex items-center gap-1 shrink-0`}>
                  {status.icon}
                  {status.label}
                </Badge>
              </div>

              {quest?.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {quest.description}
                </p>
              )}

              {/* Rewards */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-accent">
                  <Coins className="w-4 h-4" />
                  <span>+{quest?.otk_reward || 0} OTK</span>
                </div>
                <div className="flex items-center gap-1 text-turquoise">
                  <Zap className="w-4 h-4" />
                  <span>+{quest?.xp_reward || 0} XP</span>
                </div>
              </div>

              {/* Feedback if rejected */}
              {submission.status === "rejected" && submission.feedback && (
                <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-xs text-red-400">
                    <strong>Motif :</strong> {submission.feedback}
                  </p>
                </div>
              )}

              {/* Action */}
              {submission.status === "in_progress" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowModal(true)}
                  className="mt-2 gap-2"
                >
                  <Send className="w-4 h-4" />
                  Soumettre mon rapport
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Submit Proof Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scroll className="w-5 h-5 text-sakura" />
              Rapport de Mission
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proof-text">Comment as-tu réalisé cette mission ?</Label>
              <Textarea
                id="proof-text"
                placeholder="Décris ce que tu as fait, les résultats obtenus..."
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof-link">Lien de preuve (optionnel)</Label>
              <Input
                id="proof-link"
                type="url"
                placeholder="https://drive.google.com/... ou lien vers image"
                value={proofLink}
                onChange={(e) => setProofLink(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Google Drive, Imgur, Canva, ou tout lien pertinent
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!proofText.trim() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
