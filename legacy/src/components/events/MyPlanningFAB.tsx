import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck, X, Clock, MapPin, Users, Bookmark, ChevronRight, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ScheduleSlot } from "./EventScheduleTimeline";
import { CosplayMeetup } from "./CosplayMeetupsSection";
import { useUserFavorites } from "@/hooks/useUserFavorites";

interface MyPlanningFABProps {
  eventId?: string;
  favoriteSlots?: ScheduleSlot[]; // Legacy prop - now optional
  joinedMeetups: CosplayMeetup[];
  onRemoveFavorite?: (slotId: string) => void; // Legacy prop - now optional
  onLeaveMeetup: (meetupId: string) => void;
}

export default function MyPlanningFAB({
  eventId,
  favoriteSlots: legacyFavoriteSlots,
  joinedMeetups,
  onRemoveFavorite: legacyOnRemoveFavorite,
  onLeaveMeetup,
}: MyPlanningFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Use new Supabase-based favorites system
  const { favoriteActivities, toggleFavorite } = useUserFavorites(eventId);
  
  // Convert favorite activities to ScheduleSlot format
  const favoriteSlots: ScheduleSlot[] = favoriteActivities.map(activity => ({
    id: activity.id,
    time: activity.time,
    endTime: activity.end_time || undefined,
    title: activity.title,
    type: activity.category as ScheduleSlot["type"],
    category: activity.category,
    location: activity.location || undefined,
    description: activity.description || undefined,
    day: activity.day_date || undefined,
  }));
  
  const totalItems = favoriteSlots.length + joinedMeetups.length;

  // Sort all items by time (already sorted in hook, but ensure consistency)
  const allItems = [
    ...favoriteSlots.map(slot => ({ type: 'slot' as const, time: slot.time, data: slot })),
    ...joinedMeetups.map(meetup => ({ type: 'meetup' as const, time: meetup.time, data: meetup })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <>
      {/* FAB Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
            className={cn(
              "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3.5 rounded-full",
              "bg-gradient-to-r from-sakura to-purple-500 text-white font-medium",
              "shadow-[0_8px_30px_rgba(236,72,153,0.4)] hover:shadow-[0_8px_40px_rgba(236,72,153,0.6)]",
              "transition-all duration-300 hover:scale-105 active:scale-95"
            )}
          >
            <CalendarCheck className="w-5 h-5" />
            <span>Mon Programme</span>
            {totalItems > 0 && (
              <Badge className="bg-white/20 text-white border-0 ml-1">
                {totalItems}
              </Badge>
            )}
          </motion.button>
        </SheetTrigger>

        <SheetContent 
          side="right" 
          className="w-full sm:max-w-md border-l border-sakura/20 bg-background/95 backdrop-blur-xl"
        >
          <SheetHeader className="pb-4 border-b border-white/10">
            <SheetTitle className="flex items-center gap-3 font-display text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sakura/20 to-purple-500/20 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-sakura" />
              </div>
              Mon Programme Personnel
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
            {totalItems === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h4 className="font-display text-lg text-foreground mb-2">
                  Ton programme est vide
                </h4>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  Ajoute des activités à tes favoris ou rejoins des meet-ups pour créer ta roadmap personnalisée !
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="flex gap-3 mb-6">
                  <Card className="flex-1 p-3 bg-sakura/5 border-sakura/20">
                    <div className="flex items-center gap-2 text-sakura">
                      <Bookmark className="w-4 h-4" />
                      <span className="text-sm font-medium">{favoriteSlots.length} favoris</span>
                    </div>
                  </Card>
                  <Card className="flex-1 p-3 bg-turquoise/5 border-turquoise/20">
                    <div className="flex items-center gap-2 text-turquoise">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">{joinedMeetups.length} meet-ups</span>
                    </div>
                  </Card>
                </div>

                {/* Timeline */}
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-sakura/50 via-turquoise/50 to-transparent" />

                  <AnimatePresence mode="popLayout">
                    {allItems.map((item, index) => (
                      <motion.div
                        key={item.type === 'slot' ? `slot-${item.data.id}` : `meetup-${item.data.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative pl-10 pb-4"
                      >
                        {/* Timeline Dot */}
                        <div
                          className={cn(
                            "absolute left-3 top-1 w-4 h-4 rounded-full border-2",
                            item.type === 'slot'
                              ? "bg-sakura border-sakura/50"
                              : "bg-turquoise border-turquoise/50"
                          )}
                        />

                        {item.type === 'slot' ? (
                          // Schedule Slot Card
                          <Card className="p-3 bg-card/80 border-sakura/20 hover:border-sakura/40 transition-colors group">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-[10px] bg-sakura/10 text-sakura border-sakura/30">
                                    {item.data.time}
                                  </Badge>
                                  <Badge variant="secondary" className="text-[10px]">
                                    {item.data.type}
                                  </Badge>
                                </div>
                                <h5 className="font-medium text-sm text-foreground truncate">
                                  {item.data.title}
                                </h5>
                                {item.data.location && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {item.data.location}
                                  </p>
                                )}
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => toggleFavorite(item.data.id)}
                                className="h-7 w-7 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        ) : (
                          // Meetup Card
                          <Card className="p-3 bg-card/80 border-turquoise/20 hover:border-turquoise/40 transition-colors group overflow-hidden">
                            <div className="flex gap-3">
                              <img
                                src={(item.data as CosplayMeetup).imageUrl}
                                alt={(item.data as CosplayMeetup).universe}
                                className="w-12 h-12 rounded-lg object-cover shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-[10px] bg-turquoise/10 text-turquoise border-turquoise/30">
                                    {(item.data as CosplayMeetup).time}
                                  </Badge>
                                  <Badge className="text-[10px] bg-turquoise/20 text-turquoise border-0">
                                    Meet-up
                                  </Badge>
                                </div>
                                <h5 className="font-medium text-sm text-foreground truncate">
                                  {(item.data as CosplayMeetup).title}
                                </h5>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {(item.data as CosplayMeetup).location}
                                </p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => onLeaveMeetup((item.data as CosplayMeetup).id)}
                                className="h-7 w-7 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Tip */}
                <Card className="p-4 bg-gradient-to-r from-sakura/5 to-turquoise/5 border-white/10 mt-6">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">💡</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">Astuce</p>
                      <p className="text-xs text-muted-foreground">
                        Ton programme est trié par horaire pour t'aider à optimiser ta journée !
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
