import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft, Calendar, MapPin, Sparkles, Loader2, Camera
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvents";
import { 
  useEventMemories, 
  useEventEncounters, 
  useEventMemoryPhotos 
} from "@/hooks/useEventMemories";
import EncountersSection from "@/components/memories/EncountersSection";
import PhotoGallerySection from "@/components/memories/PhotoGallerySection";
import JournalSection from "@/components/memories/JournalSection";

const EventMemoryCapsule = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: memories = [], isLoading: memoriesLoading } = useEventMemories(eventId, user?.id);
  const { data: encounters = [], isLoading: encountersLoading } = useEventEncounters(eventId, user?.id);
  const { data: photos = [], isLoading: photosLoading } = useEventMemoryPhotos(eventId, user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || eventLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user || !event) return null;

  const eventDate = parseISO(event.date);

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Navigation />
      
      {/* Hero Header with nostalgic styling */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={event.image_url || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200"}
          alt={event.title}
          className="w-full h-full object-cover filter brightness-50 sepia-[0.2]"
        />
        
        {/* Golden glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-amber-900/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0F172A]" />
        
        {/* Golden particles effect */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-amber-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          <div className="container mx-auto">
            <Link to="/mon-agenda">
              <Button 
                variant="ghost" 
                className="mb-4 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'agenda
              </Button>
            </Link>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-2"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-amber-400/60 text-sm font-medium">Capsule Temporelle</p>
                <h1 className="font-display text-2xl md:text-4xl text-white">
                  {event.title}
                </h1>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-4 text-amber-400/80 text-sm mt-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(eventDate, "d MMMM yyyy", { locale: fr })}</span>
              </div>
              {event.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{event.venue_name ? `${event.venue_name}, ` : ""}{event.city}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Stats summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-display text-amber-400">{encounters.length}</div>
            <div className="text-xs text-amber-400/60">Nakamas</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-display text-orange-400">{photos.length}</div>
            <div className="text-xs text-orange-400/60">Photos</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-display text-yellow-400">{memories.length}</div>
            <div className="text-xs text-yellow-400/60">Moments</div>
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <EncountersSection
              encounters={encounters}
              eventId={eventId!}
              userId={user.id}
              isLoading={encountersLoading}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <PhotoGallerySection
              photos={photos}
              eventId={eventId!}
              userId={user.id}
              isLoading={photosLoading}
            />
            {photos.length > 0 && (
              <Link
                to={`/espace-membre/mes-photos?event=${eventId}`}
                className="flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 transition-colors mt-3"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Tu as {photos.length} photo{photos.length > 1 ? "s" : ""} à cet événement → Voir</span>
              </Link>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <JournalSection
              memories={memories}
              eventId={eventId!}
              userId={user.id}
              isLoading={memoriesLoading}
            />
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventMemoryCapsule;
