import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { CharterRule } from "@/hooks/useAssociationFiche";

interface FicheCharterSectionProps {
  rules: CharterRule[];
  associationName: string;
}

const FicheCharterSection = ({
  rules,
  associationName,
}: FicheCharterSectionProps) => {
  const [open, setOpen] = useState(false);

  if (rules.length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <button onClick={() => setOpen(true)} className="w-full text-left">
          <Card className="cursor-pointer hover:bg-white/5 hover:border-sakura/50 hover:scale-[1.01] transition-all duration-300 group">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-sakura/10 text-sakura group-hover:bg-sakura/20 transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-0.5 group-hover:text-sakura transition-colors">
                  Charte des Membres
                </h3>
                <p className="text-sm text-muted-foreground">
                  {rules.length} engagement{rules.length > 1 ? "s" : ""} fondamentaux
                </p>
              </div>
            </CardContent>
          </Card>
        </button>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <ShieldCheck className="w-7 h-7 text-sakura" />
              Charte des Membres
            </DialogTitle>
            <DialogDescription>
              Les engagements fondamentaux de {associationName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {rules.map((rule, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 hover:border-sakura/30 transition-colors">
                  <CardContent className="p-4 flex items-start gap-4">
                    <span className="text-3xl flex-shrink-0">{rule.emoji}</span>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        {rule.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {rule.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-sakura/10 rounded-xl border border-sakura/30 text-center">
            <p className="text-sm text-muted-foreground">
              En rejoignant {associationName}, tu t'engages a respecter ces valeurs.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FicheCharterSection;
