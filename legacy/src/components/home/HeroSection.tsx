import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Instagram, MessageCircle, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

// Fallback poster image
const POSTER_IMAGE = "https://res.cloudinary.com/dkw8snibz/image/upload/v1753258639/Cosplay-Garden-WEB-3_iuzymn.jpg";

interface HeroSectionProps {
  videoMode?: 'fullscreen' | 'contained' | 'none';
  videoContainerClassName?: string;
}

const HeroSection = ({ 
  videoMode = 'fullscreen',
  videoContainerClassName = ''
}: HeroSectionProps) => {
  const isMobile = useIsMobile();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Vimeo video IDs with privacy hash
  const desktopVideoUrl = "https://player.vimeo.com/video/1102758125?h=a073264c5c&background=1&autoplay=1&loop=1&muted=1&dnt=1";
  const mobileVideoUrl = "https://player.vimeo.com/video/1105043336?background=1&autoplay=1&loop=1&muted=1&dnt=1";
  const videoUrl = isMobile ? mobileVideoUrl : desktopVideoUrl;

  const socialBadges = [
    { icon: Instagram, label: "3200+ Followers", color: "text-mp-primary" },
    { icon: MessageCircle, label: "500+ Membres", color: "text-mp-coral" },
    { icon: Zap, label: "20+ Événements/an", color: "text-mp-orange" },
  ];

  // Handle iframe load
  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoLoaded(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Video container styles based on mode
  const getVideoContainerStyles = () => {
    if (videoMode === 'none') return 'hidden';
    
    if (videoMode === 'contained') {
      return `relative z-[1] transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'} ${videoContainerClassName}`;
    }
    
    // Default fullscreen mode
    return `absolute inset-0 z-[1] transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`;
  };

  const getIframeStyles = () => {
    if (videoMode === 'contained') {
      return 'w-full h-full';
    }
    // Fullscreen cover styles
    return 'absolute w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.78vh] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden -mt-16 lg:-mt-20 pt-16 lg:pt-20">
      {/* Fallback Poster Image Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={POSTER_IMAGE} 
          alt="Manga Paradise" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Video Background */}
      {videoMode !== 'none' && !videoError && (
        <div className={getVideoContainerStyles()}>
          <iframe
            src={videoUrl}
            className={getIframeStyles()}
            style={{ 
              border: 'none',
              pointerEvents: 'none'
            }}
            allow="autoplay; fullscreen; picture-in-picture"
            title="Background video"
            onError={() => setVideoError(true)}
          />
        </div>
      )}

      {/* Dark Overlay for text readability */}
      <div className="absolute inset-0 bg-mp-night/60 z-[2]" />

      {/* Content - Centered */}
      <div className="container mx-auto px-4 relative z-10 pt-20 lg:pt-0">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            {/* Main Title */}
            <h1 className="font-display italic font-extrabold text-4xl sm:text-5xl md:text-7xl lg:text-8xl mb-4 md:mb-6 leading-none text-white tracking-tight">
              BIENVENUE AU
              <span className="block bg-gradient-hero bg-clip-text text-transparent mt-2">
                MANGA PARADISE
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed font-sans px-4">
              Le 1er Réseau Social Otaku : Cosplay, Anime, Créateur, Gaming & Pop Culture Japonaise réunis en une seule app.
            </p>

            {/* Social Proof Badges */}
            <motion.div 
              className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8 md:mb-10 px-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {socialBadges.map((badge, i) => (
                <motion.div
                  key={badge.label}
                  className="flex items-center gap-2 px-4 py-2.5 bg-mp-night/70 backdrop-blur-md rounded-full border border-white/15"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <badge.icon className={`w-4 h-4 ${badge.color}`} />
                  <span className="text-sm font-medium text-white whitespace-nowrap">
                    {badge.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                asChild
                size="xl"
                variant="cta"
                className="font-display italic text-base tracking-wide uppercase w-full sm:w-auto"
              >
                <Link to="/auth" className="flex items-center gap-2">
                  NOUS REJOINDRE
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>

              <Button
                asChild
                size="xl"
                variant="outline"
                className="border-2 border-white/80 text-white bg-transparent hover:bg-white hover:text-mp-ink font-display italic text-base tracking-wide uppercase transition-all w-full sm:w-auto"
              >
                <Link to="/agenda">
                  VOIR L'AGENDA
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
    </section>
  );
};

export default HeroSection;
