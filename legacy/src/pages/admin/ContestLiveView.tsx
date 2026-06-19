import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Music,
  Lightbulb,
  Boxes,
  Users,
  X,
  Maximize2,
  Minimize2,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "sonner";

const ContestLiveView = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch contest registrations (approved only, sorted by passage_order)
  const { data: registrations, isLoading } = useQuery({
    queryKey: ["contest-live", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contest_registrations" as any)
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("event_id", eventId)
        .eq("status", "approved")
        .order("passage_order", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const currentCandidate: any = registrations?.[currentIndex];
  const totalCandidates = registrations?.length || 0;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          navigate(`/admin/contest-manager/${eventId}`);
        }
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, totalCandidates, isFullscreen]);

  const handleNext = () => {
    if (currentIndex < totalCandidates - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(false);
    } else {
      toast.info("Vous êtes au dernier candidat !");
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(false);
    } else {
      toast.info("Vous êtes au premier candidat !");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sakura border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Chargement du Live...</p>
        </div>
      </div>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Card className="p-8 bg-white/5 border-white/10 text-center max-w-md">
          <h2 className="text-2xl font-display font-bold mb-4">Aucun candidat validé</h2>
          <p className="text-muted-foreground mb-6">
            Validez des candidatures et définissez l'ordre de passage avant de lancer le Live.
          </p>
          <Button onClick={() => navigate(`/admin/contest-manager/${eventId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (!currentCandidate) {
    return null;
  }

  const profile = currentCandidate.profiles;
  const displayName = profile?.display_name || profile?.username || "Anonyme";

  const formatLabel =
    currentCandidate.format === "solo"
      ? "Solo"
      : currentCandidate.format === "duo"
      ? "Duo"
      : currentCandidate.format === "trio"
      ? "Trio"
      : currentCandidate.format === "quatuor"
      ? "Quatuor"
      : currentCandidate.format === "group"
      ? "Groupe"
      : currentCandidate.format;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-sakura/10 via-black to-cyan/10 opacity-50"></div>

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between p-6 bg-black/50 backdrop-blur-md border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/admin/contest-manager/${eventId}`)}
          className="text-white hover:bg-white/10"
        >
          <X className="w-6 h-6" />
        </Button>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50 text-lg px-4 py-2">
            🔴 LIVE
          </Badge>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Candidat</p>
            <p className="text-2xl font-bold">
              {currentIndex + 1} / {totalCandidates}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="text-white hover:bg-white/10"
        >
          {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCandidate.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-6xl"
          >
            {/* Passage Number */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-sakura/20 border-4 border-sakura mb-4">
                <span className="text-5xl font-bold text-sakura">{currentIndex + 1}</span>
              </div>
            </div>

            {/* Main Card */}
            <Card className="p-12 bg-white/5 backdrop-blur-xl border-white/20 shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left: Image */}
                <div className="space-y-6">
                  {currentCandidate.reference_image_url ? (
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-4 border-sakura/30 shadow-[0_0_30px_rgba(255,0,127,0.3)]">
                      <img
                        src={currentCandidate.reference_image_url}
                        alt={currentCandidate.character_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[3/4] rounded-2xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                      <p className="text-muted-foreground">Aucune image de référence</p>
                    </div>
                  )}
                </div>

                {/* Right: Info */}
                <div className="space-y-8">
                  {/* Character Name */}
                  <div>
                    <h1 className="text-6xl font-display font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-sakura to-cyan">
                      {currentCandidate.character_name}
                    </h1>
                    <p className="text-3xl text-muted-foreground">{currentCandidate.universe}</p>
                  </div>

                  {/* Format */}
                  <div>
                    <Badge
                      variant="outline"
                      className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 text-2xl px-6 py-3"
                    >
                      <Users className="w-6 h-6 mr-2" />
                      {formatLabel}
                    </Badge>
                  </div>

                  {/* Participant */}
                  <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-sm text-muted-foreground mb-2">Participant</p>
                    <p className="text-2xl font-bold">{displayName}</p>
                  </div>

                  {/* Technical Requirements */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-sakura">Besoins Techniques</h3>

                    {/* Audio */}
                    {currentCandidate.audio_url && (
                      <div className="p-6 bg-purple-500/10 rounded-xl border border-purple-500/30">
                        <div className="flex items-center gap-3 mb-4">
                          <Music className="w-6 h-6 text-purple-400" />
                          <span className="text-xl font-bold text-purple-400">Bande Son</span>
                        </div>
                        <audio
                          controls
                          className="w-full"
                          src={currentCandidate.audio_url}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        >
                          Votre navigateur ne supporte pas la lecture audio.
                        </audio>
                      </div>
                    )}

                    {/* Lighting */}
                    {currentCandidate.needs_lighting ? (
                      <div className="p-6 bg-amber-500/10 rounded-xl border border-amber-500/30">
                        <div className="flex items-center gap-3 mb-2">
                          <Lightbulb className="w-6 h-6 text-amber-400" />
                          <span className="text-xl font-bold text-amber-400">Éclairage Spécial</span>
                        </div>
                        {currentCandidate.lighting_details && (
                          <p className="text-lg text-muted-foreground mt-2">
                            {currentCandidate.lighting_details}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="w-6 h-6 text-muted-foreground" />
                          <span className="text-xl text-muted-foreground">Éclairage Standard</span>
                        </div>
                      </div>
                    )}

                    {/* Props */}
                    {currentCandidate.props_details && (
                      <div className="p-6 bg-green-500/10 rounded-xl border border-green-500/30">
                        <div className="flex items-center gap-3 mb-2">
                          <Boxes className="w-6 h-6 text-green-400" />
                          <span className="text-xl font-bold text-green-400">Décors / Accessoires</span>
                        </div>
                        <p className="text-lg text-muted-foreground mt-2">
                          {currentCandidate.props_details}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="relative z-10 fixed bottom-0 left-0 right-0 p-6 bg-black/50 backdrop-blur-md border-t border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            size="lg"
            className="bg-white/10 hover:bg-white/20 text-white text-xl px-8 py-6"
          >
            <ChevronLeft className="w-8 h-8 mr-2" />
            Précédent
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Raccourcis clavier</p>
            <div className="flex items-center gap-4 text-xs">
              <span>← Précédent</span>
              <span>→ Suivant</span>
              <span>F Plein écran</span>
              <span>Esc Quitter</span>
            </div>
          </div>

          <Button
            onClick={handleNext}
            disabled={currentIndex === totalCandidates - 1}
            size="lg"
            className="bg-sakura hover:bg-sakura/90 text-white text-xl px-8 py-6"
          >
            Suivant
            <ChevronRight className="w-8 h-8 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContestLiveView;
