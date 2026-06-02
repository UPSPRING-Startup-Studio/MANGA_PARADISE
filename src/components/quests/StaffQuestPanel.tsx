import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Plus, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Loader2,
  Scroll,
  Sparkles,
  PartyPopper
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { 
  usePendingSubmissions, 
  useValidateSubmission, 
  useCreateVolunteerQuest,
  type QuestSubmission 
} from "@/hooks/useVolunteerQuests";

export const StaffQuestPanel = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; submission: QuestSubmission | null }>({
    open: false,
    submission: null,
  });
  const [rejectFeedback, setRejectFeedback] = useState("");

  const { data: pendingSubmissions = [], isLoading } = usePendingSubmissions();
  const validateMutation = useValidateSubmission();
  const createMutation = useCreateVolunteerQuest();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "normal",
    otk_reward: 100,
    xp_reward: 50,
    deadline: "",
  });

  const handleApprove = (submission: QuestSubmission) => {
    // Fire confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#F472B6", "#A855F7", "#3B82F6", "#10B981"],
    });

    validateMutation.mutate({
      submissionId: submission.id,
      approved: true,
    });
  };

  const handleReject = () => {
    if (!rejectModal.submission) return;
    
    validateMutation.mutate({
      submissionId: rejectModal.submission.id,
      approved: false,
      feedback: rejectFeedback,
    });

    setRejectModal({ open: false, submission: null });
    setRejectFeedback("");
  };

  const handleCreateQuest = () => {
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    createMutation.mutate(formData, {
      onSuccess: () => {
        setShowCreateModal(false);
        setFormData({
          title: "",
          description: "",
          category: "general",
          priority: "normal",
          otk_reward: 100,
          xp_reward: 50,
          deadline: "",
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl flex items-center gap-2">
            👑 Bureau des Référents
          </h2>
          <p className="text-muted-foreground">Gérez les quêtes et validez les soumissions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Créer une Quête
        </Button>
      </div>

      {/* Pending Submissions */}
      <div className="space-y-4">
        <h3 className="font-display text-lg flex items-center gap-2">
          <Scroll className="w-5 h-5 text-orange-500" />
          Validations en attente ({pendingSubmissions.length})
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-sakura" />
          </div>
        ) : pendingSubmissions.length === 0 ? (
          <Card className="p-8 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune soumission en attente</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {pendingSubmissions.map((submission) => (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-4 space-y-4">
                  {/* User info */}
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={submission.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {submission.profile?.username?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {submission.profile?.display_name || submission.profile?.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(submission.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>

                  {/* Quest info */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-display text-sm">{submission.quest?.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      +{submission.quest?.otk_reward} OTK • +{submission.quest?.xp_reward} XP
                    </p>
                  </div>

                  {/* Proof */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Rapport du membre</Label>
                    <p className="text-sm">{submission.proof_text}</p>
                    {submission.proof_link && (
                      <a
                        href={submission.proof_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-sakura hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Voir la preuve
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setRejectModal({ open: true, submission })}
                      disabled={validateMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Refuser
                    </Button>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(submission)}
                      disabled={validateMutation.isPending}
                    >
                      {validateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Valider
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Dialog open={rejectModal.open} onOpenChange={(open) => setRejectModal({ open, submission: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la soumission</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="feedback">Motif du refus</Label>
            <Textarea
              id="feedback"
              placeholder="Explique pourquoi cette soumission n'est pas valide..."
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal({ open: false, submission: null })}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Quest Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-sakura" />
              Créer une nouvelle Quête
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de la quête *</Label>
              <Input
                id="title"
                placeholder="Ex: Créer 3 visuels pour les réseaux sociaux"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Objectif, conditions, rendu attendu..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="creation">🎨 Création</SelectItem>
                    <SelectItem value="communication">📢 Communication</SelectItem>
                    <SelectItem value="culture">🇯🇵 Culture</SelectItem>
                    <SelectItem value="animation">🎤 Animation</SelectItem>
                    <SelectItem value="logistique">📦 Logistique</SelectItem>
                    <SelectItem value="general">⚔️ Général</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">🕐 Normal</SelectItem>
                    <SelectItem value="urgent">🔥 Urgent</SelectItem>
                    <SelectItem value="legendary">👑 Légendaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Récompense OTK : {formData.otk_reward}</Label>
              <Slider
                value={[formData.otk_reward]}
                onValueChange={([v]) => setFormData({ ...formData, otk_reward: v })}
                min={50}
                max={1000}
                step={50}
              />
            </div>

            <div className="space-y-2">
              <Label>Récompense XP : {formData.xp_reward}</Label>
              <Slider
                value={[formData.xp_reward]}
                onValueChange={([v]) => setFormData({ ...formData, xp_reward: v })}
                min={25}
                max={500}
                step={25}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Date limite (optionnel)</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateQuest} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Créer la quête
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
