import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCw, User, Gamepad2, Tv, Drama, Users, CalendarDays, Trophy, Maximize2, Palette, Sparkles, Minimize2, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useCosCardStats } from "@/hooks/useCosCardStats";
import { cn } from "@/lib/utils";
import { OTAKU_CLASSES, getLeagueFromXp } from "@/lib/constants";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";

interface CosCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Rarity glow colors for badges
const rarityStyles: Record<string, string> = {
  legendary: "ring-2 ring-violet-400 shadow-[0_0_15px_rgba(167,139,250,0.6)]",
  epic: "ring-2 ring-fuchsia-400 shadow-[0_0_12px_rgba(232,121,249,0.5)]",
  rare: "ring-2 ring-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.4)]",
  common: "ring-1 ring-gray-500",
};

// Tier border colors
const tierBorderColors: Record<string, string> = {
  bronze: "border-amber-600",
  silver: "border-gray-400",
  gold: "border-yellow-500",
};

const CosCardModal = ({ isOpen, onClose }: CosCardModalProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data: stats } = useCosCardStats(user?.id);
  const isMobile = useIsMobile();
  
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isQrZoomed, setIsQrZoomed] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // Detect landscape orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Auto-fullscreen on landscape mobile
  useEffect(() => {
    if (isMobile && isLandscape && isOpen) {
      setIsFullscreen(true);
    }
  }, [isMobile, isLandscape, isOpen]);

  const qrCodeUrl = profile?.username 
    ? `${window.location.origin}/u/${profile.username}` 
    : null;

  const userClass = profile?.otaku_class 
    ? OTAKU_CLASSES[profile.otaku_class as keyof typeof OTAKU_CLASSES]
    : null;

  const currentLeague = getLeagueFromXp(profile?.monthly_xp || 0);

  // Calculate XP progress percentage
  const xpForNextLevel = ((profile?.level || 1) + 1) * 100;
  const xpProgress = ((profile?.xp || 0) / xpForNextLevel) * 100;

  // Generate member ID
  const memberYear = new Date().getFullYear();
  const memberIdShort = user?.id?.substring(0, 6).toUpperCase() || "XXXXXX";
  const memberId = `MP-${memberYear}-${memberIdShort}`;

  // Member since date
  const memberSinceFormatted = format(new Date(), "MMMM yyyy", { locale: fr });

  // Tier for border styling
  const tier = profile?.membership_tier || "bronze";
  const borderColor = tierBorderColors[tier] || "border-sakura";

  // Profile modes
  const isCosplayer = profile?.is_cosplayer_mode_active;
  const isCreator = profile?.is_creator_profile_active;
  const isOtaku = (stats?.mangasCount || 0) > 0 || (stats?.animesCount || 0) > 0;
  const isGamer = (stats?.gamesCount || 0) > 0;

  // Contest wins (mock for now - would come from stats)
  const contestWins = 0; // TODO: Add to stats hook when contest_wins field exists

  if (!isOpen) return null;

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  const handleQrClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsQrZoomed(true);
  };

  const handleFullscreenToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm",
          isFullscreen ? "p-0" : "p-4"
        )}
        onClick={onClose}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors z-20"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>

        {/* Flip Instruction (Above the card) */}
        <div className="absolute top-12 left-0 right-0 text-center z-10 pointer-events-none">
          <p className="text-white/60 text-sm flex items-center justify-center gap-2 animate-pulse">
            <RotateCw className="w-3 h-3" /> Cliquer pour retourner
          </p>
        </div>

        {/* Card Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "relative cursor-pointer",
            isFullscreen 
              ? "w-full h-full flex items-center justify-center" 
              : "w-full max-w-[400px]"
          )}
          style={{ perspective: "1000px" }}
        >
          {/* Flip Container */}
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
            style={{ transformStyle: "preserve-3d" }}
            className={cn(
              "relative",
              isFullscreen 
                ? isLandscape 
                  ? "w-[85vh] max-w-[95vw]" 
                  : "w-[90vw] max-w-[500px]"
                : "w-full"
            )}
          >
            {/* ==================== RECTO (Front) ==================== */}
            <div
              className={cn(
                "relative w-full rounded-2xl overflow-hidden border-2",
                borderColor,
                "bg-gradient-to-br from-card via-card/95 to-muted/50",
                "backdrop-blur-xl shadow-2xl",
                "[backface-visibility:hidden]"
              )}
              style={{ aspectRatio: "1.586 / 1" }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:20px_20px]" />
              </div>

              {/* Fullscreen Toggle Button */}
              <button
                onClick={handleFullscreenToggle}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/30 hover:bg-black/50 transition-colors z-10"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4 text-white/80" />
                ) : (
                  <Maximize2 className="h-4 w-4 text-white/80" />
                )}
              </button>

              {/* Content Grid */}
              <div className="relative h-full flex p-4 gap-4">
                {/* Left Side - Profile */}
                <div className="flex-1 flex flex-col justify-between">
                  {/* Avatar & Info */}
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-16 h-16 rounded-full overflow-hidden border-2 flex-shrink-0",
                      borderColor,
                      "bg-gradient-to-br from-muted to-card"
                    )}>
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg tracking-wider truncate text-foreground">
                        {profile?.display_name || profile?.username || "Membre"}
                      </h3>
                      {userClass && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <span>{userClass.emoji}</span>
                          <span>{userClass.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Level & XP */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Niveau</span>
                      <span className="font-display text-accent">{profile?.level || 1}</span>
                    </div>
                    <Progress value={xpProgress} className="h-1.5" />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{profile?.xp || 0} XP</span>
                      <span>{xpForNextLevel} XP</span>
                    </div>
                  </div>

                  {/* Member Since */}
                  {memberSinceFormatted && (
                    <p className="text-[10px] text-muted-foreground">
                      Membre depuis {memberSinceFormatted}
                    </p>
                  )}
                </div>

                {/* Right Side - QR Code */}
                <div className="flex flex-col items-center justify-between">
                  {/* QR Code - Clickable for zoom */}
                  <button
                    onClick={handleQrClick}
                    className="p-2 bg-white rounded-lg hover:ring-2 hover:ring-accent transition-all group"
                    title="Agrandir le QR Code"
                  >
                    {qrCodeUrl ? (
                      <QRCodeSVG
                        value={qrCodeUrl}
                        size={90}
                        level="H"
                        includeMargin={false}
                        fgColor="#1a1625"
                        bgColor="#ffffff"
                      />
                    ) : (
                      <div className="w-[90px] h-[90px] flex items-center justify-center bg-muted rounded text-muted-foreground text-xs">
                        Erreur
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                      <Maximize2 className="h-6 w-6 text-white" />
                    </div>
                  </button>

                  {/* Member ID */}
                  <div className="text-center mt-2">
                    <p className="font-mono text-[10px] text-muted-foreground tracking-wider">
                      {memberId}
                    </p>
                  </div>

                  {/* League Badge */}
                  <div className="flex items-center gap-1 text-xs mt-1">
                    <span>{currentLeague.emoji}</span>
                    <span className={cn("font-medium", currentLeague.textColor)}>
                      {currentLeague.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Brand Footer */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-1.5 bg-gradient-to-t from-black/30 to-transparent">
                <p className="font-display text-[10px] tracking-[0.3em] text-muted-foreground/70 text-center uppercase">
                  Manpêche • Cos-Card
                </p>
              </div>

              {/* Flip FAB Button */}
              <button
                onClick={handleFlip}
                className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-accent/80 hover:bg-accent flex items-center justify-center shadow-lg transition-all hover:scale-110 z-10"
                title="Retourner la carte"
              >
                <RotateCw className="h-5 w-5 text-accent-foreground" />
              </button>
            </div>

            {/* ==================== VERSO (Back) ==================== */}
            <div
              className={cn(
                "absolute top-0 left-0 w-full rounded-2xl overflow-hidden border-2",
                borderColor,
                "bg-gradient-to-br from-card via-card/95 to-muted/50",
                "backdrop-blur-xl shadow-2xl",
                "[backface-visibility:hidden]"
              )}
              style={{ 
                aspectRatio: "1.586 / 1",
                transform: "rotateY(180deg)",
              }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:20px_20px]" />
              </div>

              {/* Fullscreen Toggle Button */}
              <button
                onClick={handleFullscreenToggle}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/30 hover:bg-black/50 transition-colors z-10"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4 text-white/80" />
                ) : (
                  <Maximize2 className="h-4 w-4 text-white/80" />
                )}
              </button>

              {/* Content */}
              <div className="relative h-full flex flex-col p-4">
                {/* Top - Profile Icons & Bio */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Active Profile Icons with Labels */}
                  <div className="flex gap-2">
                    {isCosplayer && (
                      <div className="flex flex-col items-center gap-0.5" title="Cosplayer">
                        <div className="w-8 h-8 rounded-full bg-sakura/20 flex items-center justify-center">
                          <Drama className="h-4 w-4 text-sakura" />
                        </div>
                        <span className="text-[8px] text-sakura">Cosplay</span>
                      </div>
                    )}
                    {isOtaku && (
                      <div className="flex flex-col items-center gap-0.5" title="Otaku">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-accent" />
                        </div>
                        <span className="text-[8px] text-accent">Otaku</span>
                      </div>
                    )}
                    {isGamer && (
                      <div className="flex flex-col items-center gap-0.5" title="Gamer">
                        <div className="w-8 h-8 rounded-full bg-turquoise/20 flex items-center justify-center">
                          <Gamepad2 className="h-4 w-4 text-turquoise" />
                        </div>
                        <span className="text-[8px] text-turquoise">Gamer</span>
                      </div>
                    )}
                    {isCreator && (
                      <div className="flex flex-col items-center gap-0.5" title="Créateur">
                        <div className="w-8 h-8 rounded-full bg-purple-400/20 flex items-center justify-center">
                          <Palette className="h-4 w-4 text-purple-400" />
                        </div>
                        <span className="text-[8px] text-purple-400">Créateur</span>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {profile?.bio && (
                    <p className="flex-1 text-[11px] text-muted-foreground line-clamp-2 italic">
                      "{profile.bio}"
                    </p>
                  )}
                </div>

                {/* Center - Stats Grid */}
                <div className="flex-1 grid grid-cols-3 gap-2">
                  {/* Events - Always visible */}
                  <StatCapsule
                    icon={<CalendarDays className="h-3.5 w-3.5" />}
                    value={stats?.eventsCount || 0}
                    label="Events"
                    color="text-accent"
                  />

                  {/* Nakamas - Always visible */}
                  <StatCapsule
                    icon={<Users className="h-3.5 w-3.5" />}
                    value={stats?.nakamasCount || 0}
                    label="Nakamas"
                    color="text-sakura"
                  />

                  {/* Conditional Stats with improved icons */}
                  {isCosplayer && (stats?.cosplaysCount || 0) > 0 && (
                    <StatCapsule
                      icon={<Drama className="h-3.5 w-3.5" />}
                      value={stats?.cosplaysCount || 0}
                      label="Cosplays"
                      color="text-turquoise"
                    />
                  )}

                  {isOtaku && (stats?.mangasCount || 0) > 0 && (
                    <StatCapsule
                      icon={<Sparkles className="h-3.5 w-3.5" />}
                      value={stats?.mangasCount || 0}
                      label="Mangas"
                      color="text-orange-400"
                    />
                  )}

                  {isOtaku && (stats?.animesCount || 0) > 0 && (
                    <StatCapsule
                      icon={<Tv className="h-3.5 w-3.5" />}
                      value={stats?.animesCount || 0}
                      label="Animes"
                      color="text-blue-400"
                    />
                  )}

                  {isGamer && (stats?.gamesCount || 0) > 0 && (
                    <StatCapsule
                      icon={<Gamepad2 className="h-3.5 w-3.5" />}
                      value={stats?.gamesCount || 0}
                      label="Jeux"
                      color="text-green-400"
                    />
                  )}
                </div>

                {/* Bottom - Top Badges & Contest Wins */}
                <div className="mt-auto pt-2 border-t border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Palmarès</span>
                    </div>
                    
                    {/* Contest Wins */}
                    {contestWins > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-500/20">
                        <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="text-[10px] font-medium text-yellow-500">
                          {contestWins} Victoire{contestWins > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {stats?.topBadges && stats.topBadges.length > 0 ? (
                      stats.topBadges.map((badge) => (
                        <div
                          key={badge.id}
                          className={cn(
                            "w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center",
                            rarityStyles[badge.rarity || "common"]
                          )}
                          title={badge.name}
                        >
                          <span className="text-sm">{badge.icon}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic">
                        Aucun trophée obtenu
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Flip FAB Button */}
              <button
                onClick={handleFlip}
                className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-accent/80 hover:bg-accent flex items-center justify-center shadow-lg transition-all hover:scale-110 z-10"
                title="Retourner la carte"
              >
                <RotateCw className="h-5 w-5 text-accent-foreground" />
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Rotation Suggestion (Mobile Portrait Only) */}
        {isMobile && !isLandscape && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10 pointer-events-none">
            <div className="text-white/40 text-xs flex items-center gap-2">
              <Smartphone className="w-4 h-4 rotate-90" />
              <span>Pivoter pour plein écran</span>
            </div>
          </div>
        )}

        {/* QR Code Lightbox (At the very end for proper z-index) */}
        <AnimatePresence>
          {isQrZoomed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95"
              onClick={(e) => {
                e.stopPropagation();
                setIsQrZoomed(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="p-6 bg-white rounded-2xl shadow-2xl"
              >
                {qrCodeUrl && (
                  <QRCodeSVG
                    value={qrCodeUrl}
                    size={280}
                    level="H"
                    includeMargin={false}
                    fgColor="#1a1625"
                    bgColor="#ffffff"
                  />
                )}
              </motion.div>
              <p className="mt-6 text-lg text-white/80 font-medium">
                Scanner pour valider
              </p>
              <p className="mt-2 text-sm text-white/50">
                Toucher pour fermer
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

// Stat Capsule Component
const StatCapsule = ({ 
  icon, 
  value, 
  label, 
  color 
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string; 
  color: string;
}) => (
  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/30 border border-border/30">
    <div className={cn("mb-1", color)}>{icon}</div>
    <span className={cn("text-lg font-display", color)}>{value}</span>
    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
  </div>
);

export default CosCardModal;
