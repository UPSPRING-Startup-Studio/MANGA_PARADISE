import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Loader2, 
  Store, 
  User, 
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  Palette,
  Zap,
  Info
} from "lucide-react";
import { useSubmitExhibitorRequest } from "@/hooks/useEventExhibitors";
import { CREATOR_ROLE_LABELS } from "@/types/exhibitor";

interface ExhibitorRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  userId: string;
  userRole?: string | null; // Rôle de l'utilisateur (creator, pro, admin)
  onChooseVisitor: () => void; // Callback when user chooses visitor flow
}

type ParticipationType = "visitor" | "exhibitor";
type Step = "choice" | "form" | "success";

const ExhibitorRequestModal = ({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  userId,
  userRole,
  onChooseVisitor,
}: ExhibitorRequestModalProps) => {
  const [step, setStep] = useState<Step>("choice");
  const [participationType, setParticipationType] = useState<ParticipationType | null>(null);
  const [standName, setStandName] = useState("");
  const [standDescription, setStandDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  
  const submitMutation = useSubmitExhibitorRequest();

  // Obtenir le label du rôle créateur
  const creatorRoleLabel = userRole && ['creator', 'pro', 'admin'].includes(userRole) 
    ? CREATOR_ROLE_LABELS[userRole as 'creator' | 'pro' | 'admin'] 
    : '🎨 Créateur';

  const handleSubmit = async () => {
    if (!standName.trim()) return;
    
    await submitMutation.mutateAsync({
      eventId,
      userId,
      standName: standName.trim(),
      standDescription: standDescription.trim() || undefined,
      requirements: requirements.trim() || undefined,
    });
    
    setStep("success");
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after close animation
    setTimeout(() => {
      setStep("choice");
      setParticipationType(null);
      setStandName("");
      setStandDescription("");
      setRequirements("");
    }, 300);
  };

  const handleChooseVisitor = () => {
    // Close modal and trigger visitor flow (RSVP Modal)
    onOpenChange(false);
    setParticipationType("visitor");
    // Call parent callback to open the full RSVP wizard
    onChooseVisitor();
  };

  const handleChooseExhibitor = () => {
    setParticipationType("exhibitor");
    setStep("form");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-[hsl(var(--mp-primary))]/20 overflow-hidden p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-gradient-to-br from-[hsl(var(--mp-primary))]/10 to-[hsl(var(--mp-info))]/10">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-info))] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,127,0.5)]">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block">Quartier des Créateurs</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {eventTitle}
                </span>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Choisis ton type de participation
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[280px]">
          <AnimatePresence mode="wait">
            {/* Step 1: Choice */}
            {step === "choice" && (
              <motion.div
                key="choice"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-[hsl(var(--mp-primary))]/10 border border-[hsl(var(--mp-primary))]/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-[hsl(var(--mp-primary))] flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Tu es <strong>{creatorRoleLabel}</strong> ! Demande ton stand dans le Village Créateurs.</span>
                  </p>
                </div>
                
                <div className="space-y-3">
                  {/* Visitor Option */}
                  <button
                    onClick={handleChooseVisitor}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left transition-all",
                      "border-muted-foreground/30 hover:border-muted-foreground/50",
                      "bg-gradient-to-r from-muted-foreground/10 to-muted-foreground/5",
                      "hover:scale-[1.02] active:scale-[0.98]"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-muted-foreground/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-lg">👤 Visiteur</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Participer en tant que visiteur classique
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </button>

                  {/* Exhibitor Option */}
                  <button
                    onClick={handleChooseExhibitor}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left transition-all",
                      "border-[hsl(var(--mp-primary))]/50 hover:border-[hsl(var(--mp-primary))]",
                      "bg-gradient-to-r from-[hsl(var(--mp-primary))]/20 to-[hsl(var(--mp-primary))]/10",
                      "hover:scale-[1.02] active:scale-[0.98]",
                      "shadow-[0_0_15px_rgba(255,0,127,0.2)]"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[hsl(var(--mp-primary))]/20 flex items-center justify-center">
                        <Store className="w-6 h-6 text-[hsl(var(--mp-primary))]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-lg">🎨 Exposant / Créateur</span>
                          <Badge className="bg-[hsl(var(--mp-primary))]/20 text-[hsl(var(--mp-primary))] border-[hsl(var(--mp-primary))]/30 text-xs">
                            Artist Alley
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Demander un stand pour exposer/vendre tes créations
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[hsl(var(--mp-primary))]" />
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Form */}
            {step === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Store className="w-5 h-5 text-[hsl(var(--mp-primary))]" />
                  <span className="font-display text-lg">Informations de ton stand</span>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stand-name">
                      Nom du stand <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="stand-name"
                      value={standName}
                      onChange={(e) => setStandName(e.target.value)}
                      placeholder="Ex: L'Atelier de Luna"
                      className="bg-background/50 border-white/10 focus:border-[hsl(var(--mp-primary))]/50"
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      Le nom qui sera affiché publiquement sur la page de l'événement
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stand-description">Description publique</Label>
                    <Textarea
                      id="stand-description"
                      value={standDescription}
                      onChange={(e) => setStandDescription(e.target.value)}
                      placeholder="Ex: Illustrations, prints, stickers manga, badges..."
                      className="bg-background/50 border-white/10 focus:border-[hsl(var(--mp-primary))]/50 min-h-[80px]"
                      maxLength={250}
                    />
                    <p className="text-xs text-muted-foreground">
                      {standDescription.length}/250 caractères • Visible par tous les visiteurs
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requirements" className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Besoins techniques (optionnel)
                    </Label>
                    <Textarea
                      id="requirements"
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      placeholder="Ex: 1 table, 2 chaises, prise électrique, éclairage..."
                      className="bg-background/50 border-white/10 focus:border-amber-500/50 min-h-[60px]"
                      maxLength={300}
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Visible uniquement par l'équipe d'organisation
                    </p>
                  </div>
                </div>

                <div className="bg-[hsl(var(--mp-primary))]/10 border border-[hsl(var(--mp-primary))]/20 rounded-lg p-3 mt-4">
                  <p className="text-sm text-[hsl(var(--mp-primary))] flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Ta demande sera examinée par le staff. Tu recevras une notification dès qu'elle sera traitée.</span>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-info))] flex items-center justify-center shadow-[0_0_20px_rgba(255,0,127,0.5)]"
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>
                
                <h3 className="font-display text-2xl mb-2">Demande envoyée ! 🎉</h3>
                <p className="text-muted-foreground mb-6">
                  Ta demande de stand est en cours de validation par le staff.
                  Tu seras notifié(e) dès qu'elle sera traitée !
                </p>
                
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 px-4 py-2">
                  🟠 En attente de validation
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          {step === "form" && (
            <>
              <Button
                variant="ghost"
                onClick={() => setStep("choice")}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!standName.trim() || submitMutation.isPending}
                className="bg-gradient-to-r from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-info))] hover:opacity-90 text-white gap-2 shadow-[0_0_15px_rgba(255,0,127,0.3)]"
              >
                {submitMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Store className="w-4 h-4" />
                )}
                Envoyer ma demande
              </Button>
            </>
          )}
          
          {step === "success" && (
            <Button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-info))] hover:opacity-90 text-white shadow-[0_0_15px_rgba(255,0,127,0.3)]"
            >
              Fermer
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExhibitorRequestModal;
