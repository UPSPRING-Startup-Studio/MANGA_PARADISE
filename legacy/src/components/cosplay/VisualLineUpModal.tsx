import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Sparkles, Image as ImageIcon, Wand2 } from "lucide-react";

interface VisualLineUpModalProps {
  open: boolean;
  onClose: () => void;
}

export const VisualLineUpModal = ({ open, onClose }: VisualLineUpModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-950 border-[hsl(var(--mp-primary))]/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-display">
            <Zap className="w-6 h-6 text-[hsl(var(--mp-primary))]" />
            Visual Line-Up Generator
          </DialogTitle>
          <DialogDescription className="text-mp-ink-muted">
            Crée un visuel professionnel pour présenter ton line-up cosplay à l'événement
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 py-6"
        >
          {/* Preview Area */}
          <div className="relative aspect-video rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-dashed border-[hsl(var(--mp-primary))]/30 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
            <div className="relative z-10 text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <ImageIcon className="w-20 h-20 text-[hsl(var(--mp-primary))]/50" />
                  <Sparkles className="w-8 h-8 text-[hsl(var(--mp-saffron))] absolute -top-2 -right-2 animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-lg font-medium text-white mb-2">
                  Génération automatique de ton Visual Line-Up
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Cette fonctionnalité va compiler automatiquement tes cosplays prévus pour l'événement
                  dans un visuel partageable sur les réseaux sociaux.
                </p>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "Compilation automatique des cosplays",
              "Design personnalisable",
              "Export haute résolution",
              "Partage direct sur les réseaux",
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-3"
              >
                <Wand2 className="w-4 h-4 text-[hsl(var(--mp-info))] flex-shrink-0" />
                <span className="text-sm text-slate-300">{feature}</span>
              </motion.div>
            ))}
          </div>

          {/* Coming Soon Badge */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(var(--mp-primary))]/20 to-[hsl(var(--mp-info))]/20 border border-[hsl(var(--mp-primary))]/30 rounded-full px-6 py-3">
              <Sparkles className="w-5 h-5 text-[hsl(var(--mp-saffron))]" />
              <span className="text-sm font-medium text-white">
                Fonctionnalité en développement - Bientôt disponible ! 🚀
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-black/40 backdrop-blur-md border-white/20 hover:bg-black/60"
            >
              Fermer
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
