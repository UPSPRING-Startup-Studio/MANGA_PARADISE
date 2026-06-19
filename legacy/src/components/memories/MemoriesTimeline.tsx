import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, Users, Camera, Sparkles, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PastEventItem {
  id: string;
  event_id: string;
  events: {
    id: string;
    title: string;
    date: string;
    end_date: string | null;
    image_url: string | null;
    city: string | null;
    venue_name: string | null;
  };
  encounterCount: number;
  photoCount: number;
}

interface MemoriesTimelineProps {
  pastEvents: PastEventItem[];
  isLoading: boolean;
}

const MemoriesTimeline = ({ pastEvents, isLoading }: MemoriesTimelineProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-4">
              <div className="w-1 bg-amber-500/20 rounded-full" />
              <Card className="flex-1 h-48 bg-white/30" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (pastEvents.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-500/20 p-12 text-center">
        <Sparkles className="w-16 h-16 mx-auto text-amber-500/40 mb-4" />
        <h3 className="font-display text-xl text-white mb-2">Pas encore de souvenirs</h3>
        <p className="text-white/60 text-sm max-w-md mx-auto">
          Tes événements passés apparaîtront ici. Inscris-toi à des événements et crée des souvenirs !
        </p>
      </Card>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500/50 via-orange-500/30 to-transparent" />
      
      <div className="space-y-6 pl-10">
        {pastEvents.map((item, index) => {
          const event = item.events;
          const eventDate = parseISO(event.date);
          const year = format(eventDate, "yyyy");
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Timeline dot */}
              <div className="absolute -left-10 top-6 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-slate-900 shadow-lg shadow-amber-500/20" />
              
              <Card 
                className={cn(
                  "overflow-hidden bg-white/40 backdrop-blur-md border-amber-500/10",
                  "hover:border-amber-500/30 transition-all duration-300 cursor-pointer group"
                )}
                onClick={() => navigate(`/mes-souvenirs/${event.id}`)}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Event Image with nostalgic overlay */}
                  <div className="relative w-full md:w-64 h-40 md:h-auto overflow-hidden">
                    <img
                      src={event.image_url || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800"}
                      alt={event.title}
                      className="w-full h-full object-cover filter brightness-75 sepia-[0.15] group-hover:brightness-90 transition-all duration-500"
                    />
                    {/* Golden glow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-900/60 via-transparent to-amber-500/10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-transparent md:hidden" />
                    
                    {/* Year Badge */}
                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-amber-400 font-display text-sm">{year}</span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-amber-500/60 text-xs mb-2">
                        <Clock className="w-3 h-3" />
                        <span>{format(eventDate, "d MMMM yyyy", { locale: fr })}</span>
                      </div>
                      
                      <h3 className="font-display text-xl text-white group-hover:text-amber-400 transition-colors mb-2">
                        {event.title}
                      </h3>
                      
                      {event.city && (
                        <p className="text-white/40 text-sm mb-4">
                          📍 {event.venue_name ? `${event.venue_name}, ` : ""}{event.city}
                        </p>
                      )}
                      
                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-amber-400/80">
                          <Users className="w-4 h-4" />
                          <span>{item.encounterCount} ami{item.encounterCount !== 1 ? 's' : ''} rencontré{item.encounterCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-orange-400/80">
                          <Camera className="w-4 h-4" />
                          <span>{item.photoCount} photo{item.photoCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* CTA */}
                    <div className="mt-4 flex justify-end">
                      <Button 
                        variant="ghost" 
                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 group-hover:translate-x-1 transition-all"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Ouvrir la Capsule
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MemoriesTimeline;
