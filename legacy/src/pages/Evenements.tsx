import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, Users, Ticket, Loader2, Heart, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import eventsSpace from "@/assets/events-space.jpg";
import { useUpcomingEvents, useEvents } from "@/hooks/useEvents";
import { useEventParticipants } from "@/hooks/useEventParticipants";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

// Default placeholder image for events without images
const DEFAULT_EVENT_IMAGE = "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80";

// Hook for managing favorites (local storage)
const useFavoriteEvents = () => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("event_favorites");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (eventId: string) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId];
      localStorage.setItem("event_favorites", JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const isFavorite = (eventId: string) => favorites.includes(eventId);

  return { favorites, toggleFavorite, isFavorite };
};

// Component for individual event card with participant count
const EventCard = ({ 
  event, 
  index, 
  isFavorite, 
  onToggleFavorite 
}: { 
  event: any; 
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) => {
  const { data: participants = [] } = useEventParticipants(event.id);
  
  // Handle multi-day events
  const isMultiDay = event.schedule && Array.isArray(event.schedule) && event.schedule.length > 1;
  const formattedDate = isMultiDay
    ? `Du ${format(parseISO(event.schedule[0].date), "d", { locale: fr })} au ${format(parseISO(event.schedule[event.schedule.length - 1].date), "d MMM", { locale: fr })}`
    : event.date 
      ? format(parseISO(event.date), "d MMMM yyyy", { locale: fr })
      : "";

  // Check if contest registration is still open (not past the event date)
  const isContestOpen = event.date && !isBefore(parseISO(event.date), new Date());

  const getStatusBadge = (status: string, participantCount: number, maxAttendees: number | null) => {
    if (status === "cancelled") {
      return <Badge className="bg-red-500/80 text-white border-0 backdrop-blur-sm">Annulé</Badge>;
    }
    if (maxAttendees && participantCount >= maxAttendees) {
      return <Badge className="bg-slate-600/80 text-white border-0 backdrop-blur-sm">Complet</Badge>;
    }
    if (maxAttendees && participantCount >= maxAttendees * 0.8) {
      return <Badge className="bg-amber-500/80 text-white border-0 backdrop-blur-sm">Places limitées</Badge>;
    }
    return <Badge className="bg-emerald-500/80 text-white border-0 backdrop-blur-sm">Dispo</Badge>;
  };

  const getCategoryStyle = (category: string) => {
    const map: Record<string, { emoji: string; bg: string }> = {
      "Atelier": { emoji: "🎨", bg: "bg-purple-500/80" },
      "atelier": { emoji: "🎨", bg: "bg-purple-500/80" },
      "Projection": { emoji: "🎬", bg: "bg-blue-500/80" },
      "projection": { emoji: "🎬", bg: "bg-blue-500/80" },
      "cinema": { emoji: "🍿", bg: "bg-blue-500/80" },
      "Gaming": { emoji: "🎮", bg: "bg-green-500/80" },
      "gaming": { emoji: "🎮", bg: "bg-green-500/80" },
      "Cosplay": { emoji: "🎭", bg: "bg-pink-500/80" },
      "cosplay": { emoji: "🎭", bg: "bg-pink-500/80" },
      "Rencontre": { emoji: "🤝", bg: "bg-cyan-500/80" },
      "rencontre": { emoji: "🤝", bg: "bg-cyan-500/80" },
      "Convention": { emoji: "🎪", bg: "bg-orange-500/80" },
      "convention": { emoji: "🎪", bg: "bg-orange-500/80" },
      "soiree": { emoji: "🌙", bg: "bg-violet-500/80" },
      "concert": { emoji: "🎶", bg: "bg-rose-500/80" },
      "culture": { emoji: "🌸", bg: "bg-pink-400/80" },
      "general": { emoji: "📅", bg: "bg-slate-500/80" },
    };
    return map[category] || { emoji: "📅", bg: "bg-slate-500/80" };
  };

  const categoryStyle = getCategoryStyle(event.category);
  const imageUrl = event.image_url || DEFAULT_EVENT_IMAGE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="h-full"
    >
      <Card className="overflow-hidden h-full flex flex-col bg-card/50 backdrop-blur-sm border-border/50 hover:border-sakura/50 hover:shadow-xl hover:shadow-sakura/10 transition-all duration-300 group">
        {/* Image Container */}
        <div className="relative h-44 overflow-hidden">
          <img 
            src={imageUrl} 
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Favorite Button */}
          <motion.button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(event.id);
            }}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all hover:bg-black/50 hover:scale-110 z-10"
            whileTap={{ scale: 0.85 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isFavorite ? "filled" : "empty"}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Heart 
                  className={`w-5 h-5 transition-colors ${
                    isFavorite 
                      ? "fill-red-500 text-red-500" 
                      : "text-white/80 hover:text-white"
                  }`}
                />
              </motion.div>
            </AnimatePresence>
          </motion.button>
          
           {/* Badges on Image */}
           <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 flex-wrap">
             <div className="flex gap-2 flex-wrap">
               <Badge className={`${categoryStyle.bg} text-white border-0 backdrop-blur-sm text-xs`}>
                 {categoryStyle.emoji} {event.category}
               </Badge>
               {event.has_contest && (
                 <Badge className="bg-[hsl(var(--mp-saffron))]/80 text-black border-0 backdrop-blur-sm text-xs font-semibold shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                   🏆 Concours Cosplay
                 </Badge>
               )}
               {event.has_contest && isContestOpen && (
                 <Badge className="bg-emerald-500/80 text-white border-0 backdrop-blur-sm text-xs">
                   ✓ Inscriptions Ouvertes
                 </Badge>
               )}
             </div>
             {getStatusBadge(event.status, participants.length, event.max_attendees)}
           </div>
        </div>
        
        {/* Content */}
        <Link to={`/evenements/${event.id}`} className="flex-1 flex flex-col p-5">
          <h3 className="font-display text-lg mb-3 text-foreground group-hover:text-sakura transition-colors line-clamp-2">
            {event.title}
          </h3>

          <div className="space-y-2 mb-4 text-sm text-muted-foreground flex-grow">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sakura shrink-0" />
              <span className="capitalize">{formattedDate}</span>
            </div>
            {event.time && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sakura shrink-0" />
                <span>{event.time}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sakura shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sakura shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>
                    {participants.length}
                    {event.max_attendees ? `/${event.max_attendees}` : ""} inscrits
                  </span>
                  {event.price && (
                    <span className="font-semibold text-cta">{event.price}</span>
                  )}
                </div>
                {event.max_attendees && (
                  <div className="w-full h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-sakura to-primary rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.min((participants.length / event.max_attendees) * 100, 100)}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

           <div className="flex gap-2">
             <Button 
               variant="default" 
               className="flex-1 bg-gradient-to-r from-sakura to-primary hover:from-sakura/90 hover:to-primary/90 text-white font-medium"
             >
               Voir l'événement
             </Button>
             {event.has_contest && (
               <Button
                 variant="outline"
                 className="flex-1 border-[hsl(var(--mp-saffron))]/50 text-[hsl(var(--mp-saffron))] hover:bg-[hsl(var(--mp-saffron))]/10 font-medium"
                 asChild
               >
                 <Link to={`/evenements/${event.id}#contest`}>
                   🏆 Candidater
                 </Link>
               </Button>
             )}
           </div>
         </Link>
      </Card>
    </motion.div>
  );
};

const Evenements = () => {
  const { data: allEvents = [], isLoading } = useEvents();
  const { toggleFavorite, isFavorite } = useFavoriteEvents();
  const [filterContestOnly, setFilterContestOnly] = useState(false);
  
  // Split into upcoming and past events
  const today = startOfDay(new Date());
  let upcomingEvents = allEvents.filter(e => !isBefore(parseISO(e.date), today));
  let pastEvents = allEvents.filter(e => isBefore(parseISO(e.date), today)).slice(0, 5);
  
  // Apply contest filter if enabled
  if (filterContestOnly) {
    upcomingEvents = upcomingEvents.filter(e => e.has_contest);
    pastEvents = pastEvents.filter(e => e.has_contest);
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={eventsSpace} 
              alt="Événements Manga Paradise" 
              className="w-full h-full object-cover opacity-20"
            />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h1 className="font-display text-5xl md:text-7xl mb-6">
                Événements
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Ateliers, projections, tournois et rencontres pour tous les passionnés
              </p>
            </motion.div>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-4xl mb-4">Prochains Événements</h2>
                  <p className="text-muted-foreground">
                    Inscrivez-vous dès maintenant pour ne rien manquer
                  </p>
                </div>
              </div>
              
              {/* Filter Buttons */}
              <div className="flex gap-3 flex-wrap">
                <motion.button
                  onClick={() => setFilterContestOnly(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    !filterContestOnly
                      ? 'bg-gradient-to-r from-sakura to-primary text-white shadow-lg shadow-sakura/30'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted/70'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  📅 Tous
                </motion.button>
                <motion.button
                  onClick={() => setFilterContestOnly(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterContestOnly
                      ? 'bg-[hsl(var(--mp-saffron))]/80 text-black shadow-lg shadow-[hsl(var(--mp-saffron))]/30'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted/70'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🏆 Concours
                </motion.button>
              </div>
            </motion.div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-sakura" />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  Aucun événement à venir pour le moment
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Reviens bientôt pour découvrir nos prochaines aventures !
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event, index) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    index={index}
                    isFavorite={isFavorite(event.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Event Categories */}
        <section className="py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-display text-4xl mb-4">Types d'Événements</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { name: "Ateliers Créatifs", emoji: "🎨" },
                { name: "Projections", emoji: "🎬" },
                { name: "Tournois Gaming", emoji: "🎮" },
                { name: "Rencontres", emoji: "🤝" },
              ].map((category, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 text-center hover:shadow-lg hover:border-sakura/30 transition-all cursor-pointer group">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform text-2xl">
                      {category.emoji}
                    </div>
                    <h3 className="font-display text-lg">{category.name}</h3>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="font-display text-4xl mb-6">Événements Passés</h2>
                  <div className="space-y-3">
                    {pastEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link 
                          to={`/evenements/${event.id}`}
                          className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-sakura/30 transition-colors"
                        >
                          <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                          <span className="text-muted-foreground flex-1">{event.title}</span>
                          <span className="text-xs text-muted-foreground/70 capitalize">
                            {format(parseISO(event.date), "MMMM yyyy", { locale: fr })}
                          </span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Evenements;
