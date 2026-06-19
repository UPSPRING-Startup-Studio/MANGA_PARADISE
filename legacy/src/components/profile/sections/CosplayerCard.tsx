import { motion } from "framer-motion";
import { Star, Scissors, Users, Calendar, Target, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface CosplayPlan {
  id: string;
  character_name: string;
  universe: string;
  progress_level: number;
  status: string;
  image_url: string | null;
  budget: number | null;
  deadline: string | null;
}

interface CosplayerCardProps {
  yearsExperience?: string | null;
  specialties?: string[] | null;
  collaborationPrefs?: string[] | null;
  cosplayStyle?: string | null;
  motivation?: string | null;
  nightmare?: string | null;
  conCrunch?: string | null;
  cosplans?: CosplayPlan[] | null;
}

const experienceLabels: Record<string, { label: string; stars: number }> = {
  beginner: { label: "Débutant", stars: 1 },
  intermediate: { label: "Intermédiaire", stars: 2 },
  advanced: { label: "Confirmé", stars: 3 },
  expert: { label: "Vétéran", stars: 4 },
};

const specialtyLabels: Record<string, { emoji: string; label: string }> = {
  sewing: { emoji: "🧵", label: "Couture" },
  armor: { emoji: "🛡️", label: "Armure" },
  wig: { emoji: "💇", label: "Wig Styling" },
  makeup: { emoji: "💄", label: "FX Makeup" },
  performance: { emoji: "🎭", label: "Performance" },
  model: { emoji: "📸", label: "Modèle" },
};

const collabPrefLabels: Record<string, string> = {
  photographers: "📷 Photographes",
  duo: "👥 Binôme Cosplay",
  group: "🎭 Groupe / Shooting",
  contest: "🏆 Partenaire Concours",
  events: "🎪 Événements",
};

const CosplayerCard = ({
  yearsExperience,
  specialties,
  collaborationPrefs,
  cosplayStyle,
  motivation,
  nightmare,
  conCrunch,
  cosplans,
}: CosplayerCardProps) => {
  // Defensive: ensure arrays are safe
  const safeSpecialties = Array.isArray(specialties) ? specialties : [];
  const safeCollabPrefs = Array.isArray(collaborationPrefs) ? collaborationPrefs : [];
  const safeCosplans = Array.isArray(cosplans) ? cosplans : [];
  
  const expInfo = yearsExperience ? experienceLabels[yearsExperience] : null;
  const activePlans = safeCosplans.filter(p => p.status !== 'finished').slice(0, 3);
  
  const cosplayDNA = [
    { label: "Mon style", value: cosplayStyle, emoji: "✨" },
    { label: "Ma motivation", value: motivation, emoji: "💪" },
    { label: "Mon cauchemar", value: nightmare, emoji: "😱" },
    { label: "Mon crunch de con'", value: conCrunch, emoji: "⏰" },
  ].filter(q => q.value);

  return (
    <div className="space-y-6">
      {/* Experience Level & Specialties */}
      {(expInfo || safeSpecialties.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-sakura/10 to-accent/10 rounded-xl p-6 border border-sakura/30"
        >
          {/* Experience Stars */}
          {expInfo && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-accent" />
                Niveau d'expérience
              </p>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg text-foreground">{expInfo.label}</span>
                <div className="flex gap-0.5">
                  {[...Array(4)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < expInfo.stars ? 'text-accent fill-accent' : 'text-muted'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Specialties */}
          {safeSpecialties.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-sakura" />
                Spécialités
              </p>
              <div className="flex flex-wrap gap-2">
                {safeSpecialties.map((specialty) => {
                  const info = specialtyLabels[specialty];
                  return (
                    <Badge 
                      key={specialty} 
                      variant="secondary" 
                      className="bg-sakura/20 text-foreground px-3 py-1"
                    >
                      <span className="mr-1">{info?.emoji || "✨"}</span>
                      {info?.label || specialty}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* WIP Projects */}
      {activePlans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-6 border"
        >
          <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-turquoise" />
            Projets en cours
          </h3>
          <div className="space-y-3">
            {activePlans.map((plan) => (
              <div 
                key={plan.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {plan.image_url ? (
                    <img 
                      src={plan.image_url} 
                      alt={plan.character_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🎭
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-foreground truncate">
                    {plan.character_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {plan.universe}
                  </p>
                  {/* Progress bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={plan.progress_level} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {plan.progress_level}%
                    </span>
                  </div>
                </div>
                
                {/* Budget/Deadline */}
                <div className="text-right text-xs text-muted-foreground">
                  {plan.budget && <p>{plan.budget}€</p>}
                  {plan.deadline && (
                    <p className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(plan.deadline).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Looking For - Networking Section */}
      {safeCollabPrefs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-turquoise/10 to-sakura/10 rounded-xl p-6 border border-turquoise/30"
        >
          <h3 className="font-display text-lg text-foreground mb-3 flex items-center gap-2">
            <Search className="w-5 h-5 text-turquoise" />
            Je cherche...
          </h3>
          <div className="flex flex-wrap gap-2">
            {safeCollabPrefs.map((pref) => (
              <Badge 
                key={pref} 
                variant="outline" 
                className="border-turquoise/50 bg-turquoise/10 text-foreground px-3 py-1.5"
              >
                {collabPrefLabels[pref] || pref}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cosplay DNA */}
      {cosplayDNA.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl p-6 border"
        >
          <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
            🧬 ADN COSPLAYER
          </h3>
          <div className="space-y-3">
            {cosplayDNA.map((q) => (
              <div
                key={q.label}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <span className="text-lg">{q.emoji}</span>
                <div>
                  <p className="text-xs text-muted-foreground">{q.label}</p>
                  <p className="text-sm font-body text-foreground">{q.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CosplayerCard;
