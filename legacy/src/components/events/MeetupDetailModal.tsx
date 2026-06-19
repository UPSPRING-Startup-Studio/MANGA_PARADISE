import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Clock, MapPin, Users, MessageCircle, UserPlus, Check, Loader2,
  Crown, Sparkles, Share2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CosplayMeetup } from "./CosplayMeetupsSection";

interface MeetupDetailModalProps {
  meetup: CosplayMeetup | null;
  isOpen: boolean;
  onClose: () => void;
  onJoin: (meetupId: string) => Promise<void>;
  onLeave: (meetupId: string) => Promise<void>;
}

export default function MeetupDetailModal({
  meetup,
  isOpen,
  onClose,
  onJoin,
  onLeave,
}: MeetupDetailModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!meetup) return null;

  const progressPercent = meetup.maxParticipants
    ? Math.min((meetup.currentParticipants / meetup.maxParticipants) * 100, 100)
    : 50;

  const handleToggleJoin = async () => {
    setIsProcessing(true);
    try {
      if (meetup.isJoined) {
        await onLeave(meetup.id);
        toast.success("Tu as quitté le rassemblement");
      } else {
        await onJoin(meetup.id);
        toast.success("Tu as rejoint le squad !");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: meetup.title,
        text: `Rejoins-moi au ${meetup.title} !`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  };

  const handleOpenChat = () => {
    toast.info("Le chat sera disponible bientôt !");
  };

  // Real cosplay avatars for generated participants
  const realAvatars = [
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044479/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.27.53_lvsgmb.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044489/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.28.06_c4x9tj.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044556/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.29.13_fdbjcy.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044546/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.29.03_bup3qv.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044522/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.28.38_aclsfk.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044508/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.28.25_zewu3q.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044618/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.30.14_o1gvtf.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044594/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.29.51_hlxinj.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044570/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.29.26_rbptp3.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044690/Cosplay-Tanjiro-Lucas-P_eqtjer.jpg",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044754/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.32.29_pc5acn.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044816/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.33.29_del6by.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044962/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.35.37_c8xqpu.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044940/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.35.25_ts7q9x.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044927/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.35.09_tkpunv.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044905/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.34.35_yzqkt6.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768044964/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.35.58_eqr0e3.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768045062/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.37.18_ee7n7k.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768045091/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.37.53_uhot2v.png",
    "https://res.cloudinary.com/dkw8snibz/image/upload/v1768045071/Capture_d_%C3%A9cran_2026-01-10_%C3%A0_12.37.39_pfid8z.png"
  ];

  // Generate more demo participants for the grid using real avatars
  const allParticipants = meetup.participants || [];
  const displayParticipants = [
    ...allParticipants,
    ...Array.from({ length: Math.max(0, meetup.currentParticipants - allParticipants.length) }, (_, i) => ({
      id: `generated-${i}`,
      name: `Participant ${i + allParticipants.length + 1}`,
      avatarUrl: realAvatars[(allParticipants.length + i) % realAvatars.length],
    })),
  ].slice(0, 20);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-turquoise/30 bg-card/95 backdrop-blur-xl">
        {/* Hero Banner */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={meetup.imageUrl}
            alt={meetup.universe}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />

          {/* Organizer Avatar - Floating */}
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-14 h-14 border-4 border-card ring-2 ring-turquoise shadow-xl">
                <AvatarImage src={meetup.organizerAvatar} alt={meetup.organizerName} />
                <AvatarFallback className="bg-turquoise/30 text-lg font-bold">
                  {meetup.organizerName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-turquoise rounded-full p-1">
                <Crown className="w-3 h-3 text-card" />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Organisé par</p>
              <p className="font-semibold text-foreground">{meetup.organizerName}</p>
            </div>
          </div>

          {/* Featured Badge */}
          {meetup.isFeatured && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-sakura/90 text-white gap-1">
                <Sparkles className="w-3 h-3" />
                Populaire
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Title & Universe */}
          <div>
            <DialogHeader className="p-0">
              <DialogTitle className="font-display text-2xl text-foreground">
                {meetup.title}
              </DialogTitle>
            </DialogHeader>
            <Badge variant="secondary" className="mt-2">
              {meetup.universe}
            </Badge>
          </div>

          {/* Time & Location */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-turquoise">
              <Clock className="w-5 h-5" />
              <span className="font-semibold text-lg">{meetup.time}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-5 h-5 text-sakura" />
              <span>{meetup.location}</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Rejoins-nous pour un rassemblement épique dédié à l'univers de <strong>{meetup.universe}</strong> ! 
              Que tu sois cosplayer confirmé ou simple fan, viens partager ta passion avec la communauté.
              Photos, échanges et bonne humeur garantis ! 🎉
            </p>
          </div>

          <Separator className="bg-white/10" />

          {/* Participants Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Participants
              </span>
              <span className="font-semibold text-turquoise">
                {meetup.currentParticipants}
                {meetup.maxParticipants && ` / ${meetup.maxParticipants}`}
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-2.5 bg-muted/30"
            />
          </div>

          {/* Participants Grid */}
          {displayParticipants.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Déjà inscrits :</p>
              <div className="flex flex-wrap gap-2">
                {displayParticipants.map((p, index) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Avatar className="w-10 h-10 border-2 border-background hover:ring-2 hover:ring-turquoise/50 transition-all cursor-pointer">
                      <AvatarImage src={p.avatarUrl} alt={p.name} />
                      <AvatarFallback className="text-xs bg-turquoise/20">
                        {p.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                ))}
                {meetup.currentParticipants > 20 && (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-background">
                    <span className="text-xs font-medium">+{meetup.currentParticipants - 20}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Action Footer */}
        <div className="sticky bottom-0 p-4 bg-card/95 backdrop-blur border-t border-white/10 flex gap-3">
          {/* Chat Button */}
          <Button
            variant="outline"
            onClick={handleOpenChat}
            className="gap-2 border-white/20 hover:bg-white/5"
          >
            <MessageCircle className="w-4 h-4" />
            Chat
          </Button>

          {/* Share Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            className="border-white/20 hover:bg-white/5"
          >
            <Share2 className="w-4 h-4" />
          </Button>

          {/* Join Button */}
          <Button
            onClick={handleToggleJoin}
            disabled={isProcessing}
            className={cn(
              "flex-1 gap-2 font-semibold transition-all",
              meetup.isJoined
                ? "bg-turquoise/20 text-turquoise border border-turquoise/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
                : "bg-gradient-to-r from-turquoise to-turquoise/80 hover:from-turquoise/90 hover:to-turquoise/70 text-tokyo-night"
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : meetup.isJoined ? (
              <>
                <Check className="w-4 h-4" />
                Je participe !
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Rejoindre le Squad
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
