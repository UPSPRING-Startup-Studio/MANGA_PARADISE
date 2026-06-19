import { motion } from "framer-motion";
import { Lock, Ticket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PartyLockedStateProps {
  onRegister: () => void;
}

export default function PartyLockedState({ onRegister }: PartyLockedStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      <Card className="p-8 border-dashed border-2 border-muted-foreground/30 bg-gradient-to-br from-card/80 to-muted/30 backdrop-blur-sm">
        {/* Background blur effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-sakura/5 to-turquoise/5" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          {/* Lock Icon */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              delay: 0.1 
            }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-sakura/20 to-turquoise/20 flex items-center justify-center"
          >
            <Lock className="w-8 h-8 text-muted-foreground" />
          </motion.div>
          
          {/* Title */}
          <div className="space-y-2">
            <h3 className="font-display text-xl flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-sakura" />
              Débloque le Party Finder !
            </h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Inscris-toi à l'événement pour créer ton escouade ou rejoindre un groupe.
            </p>
          </div>
          
          {/* CTA Button */}
          <Button
            onClick={onRegister}
            size="lg"
            className="bg-gradient-to-r from-sakura to-turquoise hover:opacity-90 text-white gap-2 mt-4"
          >
            <Ticket className="w-5 h-5" />
            Prendre mon billet / M'inscrire
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
