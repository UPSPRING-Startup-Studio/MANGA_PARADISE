import { motion } from "framer-motion";
import { Coins, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Link } from "react-router-dom";

const WalletBar = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const currentOTK = profile?.otk_coins || 0;
  const nextTier = Math.ceil(currentOTK / 5000) * 5000 + 5000;
  const progressToNext = ((currentOTK % 5000) / 5000) * 100;
  const otkToNextTier = nextTier - currentOTK;

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-16 z-40 bg-[hsl(255_22%_16%/0.95)] backdrop-blur-lg border-b border-primary/20"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-accent" />
              <span className="text-foreground/80">Mon Porte-Monnaie</span>
            </div>
            <Link 
              to="/auth" 
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Connectez-vous pour voir votre solde →
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-16 z-40 bg-[hsl(255_22%_16%/0.95)] backdrop-blur-lg border-b border-primary/20"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Left - Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-accent" />
            </div>
            <span className="text-foreground/80 font-medium">Mon Porte-Monnaie</span>
          </div>
          
          {/* Right - Balance & Progress */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
            {/* Current Balance */}
            <div className="flex items-center gap-2">
              <span className="text-2xl font-display text-accent text-glow-yellow">
                🪙 {currentOTK.toLocaleString()}
              </span>
              <span className="text-foreground/60 text-sm">OTK disponibles</span>
            </div>
            
            {/* Progress to next tier */}
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <TrendingUp className="w-3 h-3" />
                <span>+{otkToNextTier.toLocaleString()} pour le palier</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WalletBar;
