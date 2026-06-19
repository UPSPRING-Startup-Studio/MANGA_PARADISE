import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Clock, MapPin, UserPlus, Check, Loader2, Star, Sparkles, 
  Plus, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import MeetupDetailModal from "./MeetupDetailModal";
import CreateMeetupModal, { MeetupFormData } from "./CreateMeetupModal";
import { useAuth } from "@/contexts/AuthContext";

export interface CosplayMeetup {
  id: string;
  universe: string;
  title: string;
  imageUrl: string;
  time: string;
  location: string;
  currentParticipants: number;
  maxParticipants?: number;
  organizerName: string;
  organizerAvatar?: string;
  organizerId?: string;
  isJoined?: boolean;
  isFeatured?: boolean;
  description?: string;
  participants?: { id: string; avatarUrl?: string; name: string }[];
}

interface CosplayMeetupsSectionProps {
  meetups: CosplayMeetup[];
  onJoinMeetup: (meetupId: string) => Promise<void>;
  onLeaveMeetup: (meetupId: string) => Promise<void>;
  onCreateMeetup?: (data: MeetupFormData) => Promise<void>;
  isLoading?: boolean;
  currentUserName?: string;
  currentUserAvatar?: string;
}

export default function CosplayMeetupsSection({
  meetups,
  onJoinMeetup,
  onLeaveMeetup,
  onCreateMeetup,
  isLoading = false,
  currentUserName = "Nakama",
  currentUserAvatar,
}: CosplayMeetupsSectionProps) {
  const { user } = useAuth();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [selectedMeetup, setSelectedMeetup] = useState<CosplayMeetup | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleJoin = async (meetupId: string, isJoined: boolean) => {
    setJoiningId(meetupId);
    try {
      if (isJoined) {
        await onLeaveMeetup(meetupId);
      } else {
        await onJoinMeetup(meetupId);
      }
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreateMeetupSubmit = async (data: MeetupFormData) => {
    if (onCreateMeetup) {
      await onCreateMeetup(data);
      toast.success("Meet-up créé avec succès ! +50 XP d'Organisateur 🎉");
    } else {
      toast.success("Meet-up créé avec succès ! +50 XP d'Organisateur 🎉");
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCardClick = (meetup: CosplayMeetup) => {
    setSelectedMeetup(meetup);
  };

  // Update meetup joined status when modal actions happen
  const handleModalJoin = async (meetupId: string) => {
    await onJoinMeetup(meetupId);
    // Update selectedMeetup to reflect the change
    if (selectedMeetup?.id === meetupId) {
      setSelectedMeetup({ ...selectedMeetup, isJoined: true });
    }
  };

  const handleModalLeave = async (meetupId: string) => {
    await onLeaveMeetup(meetupId);
    // Update selectedMeetup to reflect the change
    if (selectedMeetup?.id === meetupId) {
      setSelectedMeetup({ ...selectedMeetup, isJoined: false });
    }
  };

  return (
    <>
      <Card className="p-6 border-turquoise/20 bg-card/50 backdrop-blur">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-turquoise/20 to-sakura/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-turquoise" />
            </div>
            <div>
              <h3 className="font-display text-xl">Meet-ups Cosplay & Communauté</h3>
              <p className="text-sm text-muted-foreground">Retrouve ta communauté à l'événement</p>
            </div>
          </div>
          <Badge className="bg-turquoise/20 text-turquoise border-turquoise/30">
            {meetups.length} rassemblement{meetups.length > 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Create Meetup CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            onClick={handleOpenCreateModal}
            className="w-full gap-2 bg-gradient-to-r from-turquoise/20 to-sakura/20 border border-turquoise/30 text-foreground hover:from-turquoise/30 hover:to-sakura/30 hover:border-turquoise/50 h-14"
            variant="ghost"
          >
            <div className="w-10 h-10 rounded-full bg-turquoise/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-turquoise" />
            </div>
            <div className="text-left">
              <span className="font-semibold block">Organiser un Meet-up</span>
              <span className="text-xs text-muted-foreground">Image de couverture, titre, lieu</span>
            </div>
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-turquoise" />
          </div>
        ) : meetups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">Aucun rassemblement prévu pour le moment</p>
            <p className="text-sm text-muted-foreground mt-1">Sois le premier à en créer un !</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
                {meetups.map((meetup, index) => {
                const progressPercent = meetup.maxParticipants
                  ? Math.min((meetup.currentParticipants / meetup.maxParticipants) * 100, 100)
                  : 50;
                const isProcessing = joiningId === meetup.id;
                const isOrganizer = user?.id && meetup.organizerId === user.id;

                return (
                  <motion.div
                    key={meetup.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.1 }}
                    layout
                    className="group"
                  >
                    <Card
                      className={cn(
                        "overflow-hidden border transition-all duration-300 cursor-pointer",
                        meetup.isJoined
                          ? "bg-turquoise/5 border-turquoise/40 shadow-[0_0_20px_rgba(45,212,191,0.15)]"
                          : "bg-card/80 border-white/10 hover:border-turquoise/30",
                        meetup.isFeatured && "ring-2 ring-sakura/30",
                        isOrganizer && "ring-2 ring-yellow-500/50"
                      )}
                      onClick={() => handleCardClick(meetup)}
                    >
                      {/* Image Header with Organizer Avatar */}
                      <div className="relative h-32 overflow-hidden">
                        <img
                          src={meetup.imageUrl}
                          alt={meetup.universe}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                        {/* Organizer Badge with Crown for self */}
                        {isOrganizer && (
                          <div className="absolute top-2 left-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1.5 bg-yellow-500/90 text-black px-2 py-1 rounded-full shadow-lg">
                                    <Crown className="w-3.5 h-3.5 fill-current" />
                                    <span className="text-xs font-bold">Organisateur</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-yellow-500 text-black border-yellow-600">
                                  <p className="font-medium">Tu es l'organisateur de ce meetup</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}

                        {/* Organizer Avatar - Floating on image */}
                        <div className="absolute top-3 left-3">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="relative">
                                  <Avatar className={cn(
                                    "w-10 h-10 border-2 shadow-lg",
                                    isOrganizer 
                                      ? "border-yellow-500 ring-2 ring-yellow-500/50" 
                                      : "border-white/50 ring-2 ring-turquoise/50"
                                  )}>
                                    <AvatarImage src={meetup.organizerAvatar} alt={meetup.organizerName} />
                                    <AvatarFallback className="bg-turquoise/30 text-sm font-bold">
                                      {meetup.organizerName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className={cn(
                                    "absolute -bottom-1 -right-1 rounded-full p-0.5",
                                    isOrganizer ? "bg-yellow-500" : "bg-turquoise"
                                  )}>
                                    <Crown className={cn(
                                      "w-2.5 h-2.5",
                                      isOrganizer ? "text-black fill-current" : "text-card"
                                    )} />
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>
                                  {isOrganizer ? "Tu organises ce meetup" : `Organisé par ${meetup.organizerName}`}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {/* Featured Badge */}
                        {meetup.isFeatured && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-sakura/90 text-white gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              Populaire
                            </Badge>
                          </div>
                        )}

                        {/* Universe Title Overlay */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <h4 className="font-display text-lg text-white drop-shadow-lg">{meetup.title}</h4>
                          <p className="text-sm text-white/80">{meetup.universe}</p>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-4">
                        {/* Time & Location */}
                        <div className="flex flex-wrap gap-3 text-sm">
                          <div className="flex items-center gap-1.5 text-turquoise">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{meetup.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{meetup.location}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Participants</span>
                            <span className="font-medium text-turquoise">
                              {meetup.currentParticipants}
                              {meetup.maxParticipants && ` / ${meetup.maxParticipants}`}
                            </span>
                          </div>
                          <Progress
                            value={progressPercent}
                            className="h-2 bg-muted/30"
                          />
                        </div>

                        {/* Participants Preview */}
                        {meetup.participants && meetup.participants.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {meetup.participants.slice(0, 4).map((p) => (
                                <Avatar key={p.id} className="w-7 h-7 border-2 border-background">
                                  <AvatarImage src={p.avatarUrl} alt={p.name} />
                                  <AvatarFallback className="text-[10px] bg-turquoise/20">
                                    {p.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {meetup.participants.length > 4 && (
                                <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                  <span className="text-[10px] font-medium">
                                    +{meetup.participants.length - 4}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              inscrits
                            </span>
                          </div>
                        )}

                        {/* Join Button */}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoin(meetup.id, !!meetup.isJoined);
                          }}
                          disabled={isProcessing}
                          className={cn(
                            "w-full gap-2 font-medium transition-all",
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
                              Rejoindre le rassemblement
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </Card>

      {/* Meetup Detail Modal */}
      <MeetupDetailModal
        meetup={selectedMeetup}
        isOpen={!!selectedMeetup}
        onClose={() => setSelectedMeetup(null)}
        onJoin={handleModalJoin}
        onLeave={handleModalLeave}
      />

      {/* Create Meetup Modal */}
      <CreateMeetupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateMeetupSubmit}
        organizerName={currentUserName}
        organizerAvatar={currentUserAvatar}
      />
    </>
  );
}
