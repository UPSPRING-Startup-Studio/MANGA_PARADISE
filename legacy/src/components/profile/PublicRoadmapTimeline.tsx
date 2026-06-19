import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Clock, MapPin, Plus, Sparkles, Calendar,
  Mic2, Users, Music, Gamepad2, Drama, Award, Film, Coffee
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { RoadmapActivity } from "@/hooks/usePublicUserRoadmap";

interface PublicRoadmapTimelineProps {
  activities: RoadmapActivity[];
  isLoading?: boolean;
  isOwnProfile?: boolean;
  onAddActivity?: (activity: RoadmapActivity) => void;
  eventId?: string;
  username?: string;
}

// Category icon mapping
const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, any> = {
    animation: Sparkles,
    conference: Mic2,
    meet_greet: Users,
    concert: Music,
    gaming: Gamepad2,
    cosplay: Drama,
    workshop: Award,
    contest: Award,
    screening: Film,
    other: Coffee,
  };
  return iconMap[category] || Coffee;
};

// Category color mapping
const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    animation: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    conference: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    meet_greet: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    concert: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    gaming: "bg-green-500/20 text-green-400 border-green-500/30",
    cosplay: "bg-[hsl(var(--mp-primary))]/20 text-[hsl(var(--mp-primary))] border-[hsl(var(--mp-primary))]/30",
    workshop: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    contest: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    screening: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return colorMap[category] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
};

// Group activities by day
const groupActivitiesByDay = (activities: RoadmapActivity[]) => {
  const grouped: Record<string, RoadmapActivity[]> = {};
  
  activities.forEach((activity) => {
    const day = activity.day_date || "unknown";
    if (!grouped[day]) {
      grouped[day] = [];
    }
    grouped[day].push(activity);
  });

  return grouped;
};

export const PublicRoadmapTimeline = ({
  activities,
  isLoading = false,
  isOwnProfile = false,
  onAddActivity,
  eventId,
  username,
}: PublicRoadmapTimelineProps) => {
  const navigate = useNavigate();
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<RoadmapActivity | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const groupedActivities = useMemo(() => groupActivitiesByDay(activities), [activities]);
  const sortedDays = useMemo(() => Object.keys(groupedActivities).sort(), [groupedActivities]);

  const handleActivityClick = (activity: RoadmapActivity) => {
    setSelectedActivity(activity);
    setIsDetailOpen(true);
  };

  const handleAddActivity = (activity: RoadmapActivity) => {
    if (onAddActivity) {
      onAddActivity(activity);
    }
  };

  const handleDiscoverProgram = () => {
    if (eventId) {
      navigate(`/events/${eventId}`);
    } else {
      navigate("/events");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

   if (activities.length === 0) {
     return (
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="text-center py-12"
       >
         <div className="relative inline-block mb-6">
           <div className="absolute inset-0 bg-[hsl(var(--mp-primary))]/20 blur-xl rounded-full" />
           <Sparkles className="w-16 h-16 mx-auto text-[hsl(var(--mp-primary))] relative" />
         </div>
         <h3 className="text-xl font-display text-white mb-2">
           {isOwnProfile ? "Ta roadmap est vide" : "Aucune activité planifiée"}
         </h3>
         <p className="text-muted-foreground mb-6">
           {isOwnProfile
             ? "Commence à construire ton programme en ajoutant des activités"
             : "Cet utilisateur n'a pas encore planifié d'activités"}
         </p>
         <Button
           onClick={handleDiscoverProgram}
           className={cn(
             "bg-gradient-to-r from-[hsl(var(--mp-primary))] to-pink-500 hover:from-[hsl(var(--mp-primary))]/90 hover:to-pink-500/90",
             "text-white shadow-[0_0_20px_rgba(255,0,127,0.4)] hover:shadow-[0_0_30px_rgba(255,0,127,0.6)]",
             "transition-all duration-300"
           )}
         >
           <Calendar className="w-4 h-4 mr-2" />
           Découvrir le programme
         </Button>
       </motion.div>
     );
   }

   return (
     <>
       <div className="space-y-6">
         {sortedDays.map((day, dayIndex) => {
           const dayActivities = groupedActivities[day];
           const dayDate = day !== "unknown" ? parseISO(day) : null;
           const dayLabel = dayDate
             ? format(dayDate, "EEEE d MMMM", { locale: fr })
             : "Date inconnue";
           
           // Check if this is the last day and activities are short
           const isLastDay = dayIndex === sortedDays.length - 1;
           const shouldShowEngagementMessage = isLastDay && activities.length < 8 && !isOwnProfile;

           return (
             <motion.div
               key={day}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: dayIndex * 0.1 }}
               className="space-y-3"
             >
               {/* Day Header - Compact */}
               <div className="flex items-center gap-2 mb-3 px-2">
                 <div className="h-px flex-1 bg-mp-cloud/50" />
                 <h3 className="text-xs font-semibold text-mp-ink-muted uppercase tracking-wider whitespace-nowrap">
                   {dayLabel}
                 </h3>
                 <div className="h-px flex-1 bg-mp-cloud/50" />
               </div>

               {/* Compact Timeline */}
               <div className="space-y-1">
                 {dayActivities.map((activity, actIndex) => {
                   const CategoryIcon = getCategoryIcon(activity.category);

                   return (
                     <motion.div
                       key={activity.id}
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: dayIndex * 0.1 + actIndex * 0.05 }}
                       onClick={() => handleActivityClick(activity)}
                       className={cn(
                         "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer",
                         "bg-mp-paper/40 border border-mp-border/50",
                         "hover:bg-mp-paper/60 hover:border-[hsl(var(--mp-primary))]/40",
                         "hover:shadow-[0_0_15px_rgba(255,0,127,0.2)]",
                         "transition-all duration-200 group"
                       )}
                     >
                       {/* Colonne Gauche : Heure en Cyan */}
                       <div className="flex-shrink-0 w-16">
                         <div className="font-mono text-sm font-bold text-[hsl(var(--mp-info))]">
                           {activity.time}
                         </div>
                         {activity.end_time && (
                           <div className="font-mono text-xs text-mp-ink-muted">
                             → {activity.end_time}
                           </div>
                         )}
                       </div>

                       {/* Séparateur vertical */}
                       <div className="w-px h-12 bg-gradient-to-b from-[hsl(var(--mp-primary))]/30 to-transparent" />

                       {/* Colonne Centrale : Titre + Badge */}
                       <div className="flex-1 min-w-0">
                         <h4 className="font-display text-sm text-white truncate mb-1">
                           {activity.title}
                         </h4>
                         <Badge
                           variant="outline"
                           className={cn(
                             "text-xs border inline-flex",
                             getCategoryColor(activity.category)
                           )}
                         >
                           <CategoryIcon className="w-3 h-3 mr-1" />
                           {activity.category}
                         </Badge>
                       </div>

                       {/* Colonne Droite : Lieu (masqué sur mobile) */}
                       {activity.location && (
                         <div className="hidden sm:flex items-center gap-1 flex-shrink-0 text-xs text-mp-ink-muted max-w-[150px]">
                           <MapPin className="w-3 h-3 flex-shrink-0" />
                           <span className="truncate">{activity.location}</span>
                         </div>
                       )}

                       {/* Action Button */}
                       {!isOwnProfile && onAddActivity && (
                         <motion.button
                           onClick={(e) => {
                             e.stopPropagation();
                             handleAddActivity(activity);
                           }}
                           whileHover={{ scale: 1.1 }}
                           whileTap={{ scale: 0.95 }}
                           className={cn(
                             "p-1.5 rounded-full transition-all flex-shrink-0",
                             "bg-[hsl(var(--mp-primary))]/20 hover:bg-[hsl(var(--mp-primary))]/40",
                             "border border-[hsl(var(--mp-primary))]/30 hover:border-[hsl(var(--mp-primary))]/60",
                             "text-[hsl(var(--mp-primary))] hover:shadow-[0_0_12px_rgba(255,0,127,0.4)]"
                           )}
                           title="Ajouter à mon programme"
                         >
                           <Plus className="w-3 h-3" />
                         </motion.button>
                       )}
                     </motion.div>
                   );
                 })}
               </div>
               
               {/* Engagement message for short roadmaps */}
               {shouldShowEngagementMessage && (
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.3 }}
                   className={cn(
                     "mt-8 p-6 rounded-lg border",
                     "bg-gradient-to-r from-[hsl(var(--mp-primary))]/10 to-[hsl(var(--mp-info))]/10",
                     "border-[hsl(var(--mp-primary))]/30 backdrop-blur-sm"
                   )}
                 >
                   <p className="text-center text-slate-300 mb-4">
                     Retrouvez <span className="font-semibold text-[hsl(var(--mp-primary))]">@{username}</span> sur ces activités ! 
                     <br />
                     <span className="text-sm text-mp-ink-muted">Et vous, quel est votre programme ?</span>
                   </p>
                   <div className="flex justify-center">
                     <Button
                       onClick={handleDiscoverProgram}
                       variant="outline"
                       className={cn(
                         "border-[hsl(var(--mp-primary))]/50 text-[hsl(var(--mp-primary))] hover:bg-[hsl(var(--mp-primary))]/10",
                         "hover:border-[hsl(var(--mp-primary))]"
                       )}
                     >
                       <Calendar className="w-4 h-4 mr-2" />
                       Voir le programme complet
                     </Button>
                   </div>
                 </motion.div>
               )}
             </motion.div>
           );
         })}
       </div>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="bg-slate-950 border-l border-white/10">
          <SheetHeader>
            <SheetTitle className="text-white">{selectedActivity?.title}</SheetTitle>
            <SheetDescription className="text-muted-foreground">
              Détails de l'activité
            </SheetDescription>
          </SheetHeader>

          {selectedActivity && (
            <div className="space-y-4 mt-6">
              {/* Time */}
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[hsl(var(--mp-primary))]" />
                <div>
                  <p className="text-xs text-muted-foreground">Horaire</p>
                  <p className="text-sm font-semibold text-white">
                    {selectedActivity.time}
                    {selectedActivity.end_time && ` - ${selectedActivity.end_time}`}
                  </p>
                </div>
              </div>

              {/* Location */}
              {selectedActivity.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[hsl(var(--mp-primary))]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Lieu</p>
                    <p className="text-sm font-semibold text-white">
                      {selectedActivity.location}
                    </p>
                  </div>
                </div>
              )}

              {/* Category */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Catégorie</p>
                <Badge
                  className={cn(
                    "border",
                    getCategoryColor(selectedActivity.category)
                  )}
                >
                  {selectedActivity.category}
                </Badge>
              </div>

              {/* Description */}
              {selectedActivity.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Description</p>
                  <p className="text-sm text-white leading-relaxed">
                    {selectedActivity.description}
                  </p>
                </div>
              )}

              {/* Add button */}
              {!isOwnProfile && onAddActivity && (
                <Button
                  onClick={() => {
                    handleAddActivity(selectedActivity);
                    setIsDetailOpen(false);
                  }}
                  className="w-full mt-6 bg-[hsl(var(--mp-primary))] hover:bg-[hsl(var(--mp-primary))]/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter à mon programme
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
