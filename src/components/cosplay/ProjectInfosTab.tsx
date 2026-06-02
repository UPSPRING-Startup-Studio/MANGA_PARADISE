import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Flame,
  Heart,
  Star,
  Sparkles,
  Users,
  UserPlus,
  Calendar,
  Euro,
  StickyNote,
  Target,
  Zap,
  TrendingUp,
  Image as ImageIcon,
} from "lucide-react";
import { CosplayPlan } from "@/hooks/useCosplans";
import { useCosplanStats } from "@/hooks/useCosplanStats";
import { useAuth } from "@/contexts/AuthContext";
import { VisualLineUpModal } from "./VisualLineUpModal";
import { PartyFinderModal } from "./PartyFinderModal";
import { SouvenirsSection } from "@/components/cosplay/photos/SouvenirsSection";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProjectInfosTabProps {
  plan: CosplayPlan;
  onOpenVisualLineUp?: () => void;
  onOpenPartyFinder?: () => void;
}

export const ProjectInfosTab = ({ 
  plan, 
  onOpenVisualLineUp,
  onOpenPartyFinder 
}: ProjectInfosTabProps) => {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useCosplanStats(plan.id);
  const [showVisualLineUpModal, setShowVisualLineUpModal] = useState(false);
  const [showPartyFinderModal, setShowPartyFinderModal] = useState(false);

  // Check if the cosplay has a target event
  const hasTargetEvent = !!plan.target_event_id;

  // Check if the cosplay has a group
  const hasGroup = !!plan.group_id;

  // Stats configuration with Manga Paradise theme
  const statsConfig = [
    {
      key: 'hype',
      label: 'HYPE',
      icon: Flame,
      value: stats?.hype_count || 0,
      color: 'from-orange-500 to-red-500',
      glowColor: 'shadow-[0_0_15px_rgba(255,127,0,0.5)]',
      textColor: 'text-orange-400',
    },
    {
      key: 'love',
      label: "J'ADORE",
      icon: Heart,
      value: stats?.love_count || 0,
      color: 'from-[hsl(var(--mp-primary))] to-pink-500',
      glowColor: 'shadow-[0_0_15px_rgba(255,0,127,0.5)]',
      textColor: 'text-[hsl(var(--mp-primary))]',
    },
    {
      key: 'favorite',
      label: 'FAVORIS',
      icon: Star,
      value: stats?.favorite_count || 0,
      color: 'from-[hsl(var(--mp-saffron))] to-yellow-500',
      glowColor: 'shadow-[0_0_15px_rgba(255,215,0,0.5)]',
      textColor: 'text-[hsl(var(--mp-saffron))]',
    },
    {
      key: 'amazing',
      label: 'INCROYABLE',
      icon: Sparkles,
      value: stats?.amazing_count || 0,
      color: 'from-[hsl(var(--mp-info))] to-cyan-500',
      glowColor: 'shadow-[0_0_15px_rgba(0,240,255,0.5)]',
      textColor: 'text-[hsl(var(--mp-info))]',
    },
  ];

  const handleVisualLineUpClick = () => {
    if (onOpenVisualLineUp) {
      onOpenVisualLineUp();
    } else {
      setShowVisualLineUpModal(true);
      toast.info("Fonctionnalité Visual Line-Up à venir ! 🎨");
    }
  };

  const handlePartyFinderClick = () => {
    if (onOpenPartyFinder) {
      onOpenPartyFinder();
    } else {
      setShowPartyFinderModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section - Project Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-white/10 p-6"
      >
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6">
          {/* Project Image */}
          <div className="relative w-full md:w-48 h-64 rounded-xl overflow-hidden bg-black/40 backdrop-blur-md border border-white/10 flex-shrink-0">
            {plan.image_url ? (
              <img
                src={plan.image_url}
                alt={plan.character_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <ImageIcon className="w-16 h-16" />
              </div>
            )}
            
            {/* Priority Badge */}
            {plan.priority > 0 && (
              <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-bold">PRIORITAIRE</span>
              </div>
            )}
          </div>

          {/* Project Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="font-display text-3xl text-white mb-2">
                {plan.character_name}
              </h2>
              <p className="text-lg text-muted-foreground">{plan.universe}</p>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="bg-black/40 backdrop-blur-md border-white/20">
                <Calendar className="w-3 h-3 mr-1" />
                {plan.target_year}
              </Badge>
              
              {plan.budget && (
                <Badge variant="outline" className="bg-black/40 backdrop-blur-md border-white/20">
                  <Euro className="w-3 h-3 mr-1" />
                  {plan.budget}€
                </Badge>
              )}
              
              {plan.deadline && (
                <Badge variant="outline" className="bg-black/40 backdrop-blur-md border-white/20">
                  <Target className="w-3 h-3 mr-1" />
                  {format(parseISO(plan.deadline), "dd MMM yyyy", { locale: fr })}
                </Badge>
              )}
            </div>

            {/* Notes */}
            {plan.notes && (
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <StickyNote className="w-4 h-4 text-[hsl(var(--mp-saffron))] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{plan.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Visual Line-Up Button (Conditional) */}
      {hasTargetEvent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            onClick={handleVisualLineUpClick}
            className={cn(
              "w-full h-16 text-lg font-bold",
              "bg-gradient-to-r from-[hsl(var(--mp-primary))] to-pink-600",
              "hover:from-[hsl(var(--mp-primary))]/90 hover:to-pink-600/90",
              "shadow-[0_0_20px_rgba(255,0,127,0.6)]",
              "hover:shadow-[0_0_30px_rgba(255,0,127,0.8)]",
              "transition-all duration-300",
              "border border-[hsl(var(--mp-primary))]/50"
            )}
          >
            <Zap className="w-6 h-6 mr-2" />
            Générer mon Visual Line-Up
          </Button>
        </motion.div>
      )}

      {/* Stats Section - Reactions & Hype */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[hsl(var(--mp-info))]" />
          <h3 className="font-display text-xl text-white">Statistiques & Hype</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsConfig.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Card
                  className={cn(
                    "relative overflow-hidden",
                    "bg-black/40 backdrop-blur-md",
                    "border border-white/10",
                    "hover:border-white/20",
                    "transition-all duration-300",
                    "p-4",
                    stat.value > 0 && stat.glowColor
                  )}
                >
                  {/* Gradient Background */}
                  <div
                    className={cn(
                      "absolute inset-0 opacity-10",
                      `bg-gradient-to-br ${stat.color}`
                    )}
                  />

                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <Icon className={cn("w-8 h-8", stat.textColor)} />
                    <div className="text-center">
                      <div className={cn("text-3xl font-bold", stat.textColor)}>
                        {statsLoading ? "..." : stat.value}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <Separator className="bg-white/10" />

      {/* Souvenirs & Rencontres */}
      <SouvenirsSection cosplayId={plan.id} />

      <Separator className="bg-white/10" />

      {/* Social Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[hsl(var(--mp-saffron))]" />
          <h3 className="font-display text-xl text-white">Actions Sociales</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Party Finder / Group Management */}
          <Button
            onClick={handlePartyFinderClick}
            variant="outline"
            className={cn(
              "h-20 flex flex-col items-center justify-center gap-2",
              "bg-black/40 backdrop-blur-md",
              "border-white/20 hover:border-[hsl(var(--mp-info))]/50",
              "hover:bg-black/60",
              "transition-all duration-300"
            )}
          >
            {hasGroup ? (
              <>
                <Users className="w-6 h-6 text-[hsl(var(--mp-info))]" />
                <span className="text-sm font-medium">Gestion du groupe</span>
              </>
            ) : (
              <>
                <UserPlus className="w-6 h-6 text-[hsl(var(--mp-saffron))]" />
                <span className="text-sm font-medium">Chercher un binôme / squad</span>
              </>
            )}
          </Button>

          {/* Placeholder for future social actions */}
          <Button
            variant="outline"
            disabled
            className={cn(
              "h-20 flex flex-col items-center justify-center gap-2",
              "bg-black/20 backdrop-blur-md",
              "border-white/10",
              "opacity-50 cursor-not-allowed"
            )}
          >
            <Sparkles className="w-6 h-6 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Partager sur le feed
            </span>
          </Button>
        </div>
      </motion.div>

      {/* Modals */}
      <VisualLineUpModal
        open={showVisualLineUpModal}
        onClose={() => setShowVisualLineUpModal(false)}
      />
      <PartyFinderModal
        open={showPartyFinderModal}
        onClose={() => setShowPartyFinderModal(false)}
        plan={plan}
      />
    </div>
  );
};
