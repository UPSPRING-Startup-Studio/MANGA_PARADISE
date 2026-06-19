import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Bell, MapPin, Check, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useProfileByQrToken, 
  useFriendshipStatus, 
  useSendFriendRequestWithContext,
  useCurrentEvents 
} from "@/hooks/useCosCard";
import { OTAKU_CLASSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ScanResultSheetProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
}

const ScanResultSheet = ({ isOpen, onClose, token }: ScanResultSheetProps) => {
  const { user } = useAuth();
  const { data: scannedProfile, isLoading: profileLoading } = useProfileByQrToken(token);
  const { data: friendshipStatus } = useFriendshipStatus(user?.id, scannedProfile?.id);
  const { data: currentEvents } = useCurrentEvents();
  const sendFriendRequest = useSendFriendRequestWithContext();
  
  const [showContextForm, setShowContextForm] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [customContext, setCustomContext] = useState("");

  const userClass = scannedProfile?.otaku_class 
    ? OTAKU_CLASSES[scannedProfile.otaku_class as keyof typeof OTAKU_CLASSES]
    : null;

  const handleFollow = () => {
    // For now, just show a toast - could implement a separate follows table later
    // toast.success(`Vous suivez ${scannedProfile?.display_name || 'ce membre'}`);
  };

  const handleAddNakama = () => {
    setShowContextForm(true);
  };

  const handleSendRequest = () => {
    if (!user?.id || !scannedProfile?.id) return;

    const meetingContext = selectedEventId === "other" 
      ? customContext 
      : selectedEventId === "" 
        ? null 
        : null;
    
    const meetingEventId = selectedEventId && selectedEventId !== "other" 
      ? selectedEventId 
      : null;

    sendFriendRequest.mutate({
      requesterId: user.id,
      addresseeId: scannedProfile.id,
      meetingEventId,
      meetingContext: selectedEventId === "other" ? customContext : null,
    }, {
      onSuccess: () => {
        setShowContextForm(false);
        onClose();
      }
    });
  };

  const isSelf = user?.id === scannedProfile?.id;
  const isPending = friendshipStatus?.status === 'pending';
  const isAccepted = friendshipStatus?.status === 'accepted';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-3xl overflow-hidden max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="p-6 pt-2">
            {profileLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-sakura" />
              </div>
            ) : !scannedProfile ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Profil introuvable</p>
              </div>
            ) : isSelf ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">C'est votre propre profil !</p>
              </div>
            ) : (
              <>
                {/* Profile Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-hero border-2 border-sakura overflow-hidden flex-shrink-0">
                    {scannedProfile.avatar_url ? (
                      <img 
                        src={scannedProfile.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        🎮
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-xl tracking-wider truncate">
                      {scannedProfile.display_name || scannedProfile.username}
                    </h3>
                    
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      {userClass && (
                        <span className="flex items-center gap-1">
                          <span>{userClass.icon}</span>
                          <span>{userClass.name}</span>
                        </span>
                      )}
                      <span className="text-accent">Niv. {scannedProfile.level}</span>
                    </div>

                    {scannedProfile.city && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{scannedProfile.city}</span>
                      </div>
                    )}

                    {scannedProfile.bio && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {scannedProfile.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                {isAccepted && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-success/10 text-success">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">Vous êtes déjà Nakamas !</span>
                  </div>
                )}

                {isPending && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-accent/10 text-accent">
                    <Loader2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Demande en attente...</span>
                  </div>
                )}

                {/* Context Form */}
                {showContextForm && !isAccepted && !isPending && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-4 p-4 rounded-lg border border-border bg-muted/20"
                  >
                    <Label className="text-sm font-medium mb-2 block">
                      Où vous êtes-vous rencontrés ?
                    </Label>
                    
                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner un événement" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentEvents && currentEvents.length > 0 && (
                          <>
                            {currentEvents.map(event => (
                              <SelectItem key={event.id} value={event.id}>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  {event.title}
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                        <SelectItem value="other">Hors convention / Autre</SelectItem>
                      </SelectContent>
                    </Select>

                    {selectedEventId === "other" && (
                      <Input
                        className="mt-3"
                        placeholder="Ex: Discord, Twitter, IRL..."
                        value={customContext}
                        onChange={(e) => setCustomContext(e.target.value)}
                      />
                    )}

                    <Button
                      className="w-full mt-4 bg-gradient-cta text-tokyo-night font-display"
                      onClick={handleSendRequest}
                      disabled={sendFriendRequest.isPending}
                    >
                      {sendFriendRequest.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Envoyer la demande
                    </Button>
                  </motion.div>
                )}

                {/* Action Buttons */}
                {!showContextForm && !isAccepted && !isPending && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="font-display"
                      onClick={handleFollow}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      S'abonner
                    </Button>
                    <Button 
                      className="bg-gradient-cta text-tokyo-night font-display"
                      onClick={handleAddNakama}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Ajouter en Nakama
                    </Button>
                  </div>
                )}

                {/* View Profile Link */}
                <Button 
                  variant="ghost" 
                  className="w-full mt-3 text-sm text-muted-foreground"
                  onClick={() => {
                    window.location.href = `/profil/${scannedProfile.id}`;
                  }}
                >
                  Voir le profil complet
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScanResultSheet;
