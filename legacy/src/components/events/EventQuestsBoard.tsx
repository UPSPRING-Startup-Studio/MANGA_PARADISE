import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEventQuests, useCompleteQuest, useStartQuest, type QuestWithProgress } from "@/hooks/useEventQuests";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Lock, 
  Circle, 
  CheckCircle2, 
  Sparkles, 
  Camera, 
  QrCode, 
  Trophy,
  Upload,
  Loader2,
  Zap,
  Gift
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EventQuestsBoardProps {
  eventId: string;
}

const VALIDATION_ICONS: Record<string, React.ReactNode> = {
  QR_SCAN: <QrCode className="w-5 h-5" />,
  PHOTO_UPLOAD: <Camera className="w-5 h-5" />,
  MANUAL_ADMIN: <Trophy className="w-5 h-5" />,
  AUTO_ATTENDANCE: <CheckCircle2 className="w-5 h-5" />,
};

const QuestCard = ({ 
  quest, 
  eventId, 
  onComplete 
}: { 
  quest: QuestWithProgress;
  eventId: string;
  onComplete: (questId: string, proofUrl?: string) => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const startQuestMutation = useStartQuest();

  const isCompleted = quest.userProgress?.status === "completed";
  const isInProgress = quest.userProgress?.status === "in_progress";
  const isPending = quest.userProgress?.status === "pending";

  const handlePhotoUpload = async (file: File) => {
    if (!user) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${eventId}/${quest.quest_id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("cosplays")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("cosplays")
        .getPublicUrl(fileName);

      onComplete(quest.quest_id, urlData.publicUrl);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleQRScan = () => {
    // For now, simulate QR scan validation
    // In production, integrate a QR scanner library
    const code = prompt("Entre le code de l'événement :");
    if (code) {
      // Validate the code (simplified)
      onComplete(quest.quest_id);
    }
  };

  const handleStartQuest = () => {
    startQuestMutation.mutate({ questId: quest.quest_id, eventId });
  };

  const getActionButton = () => {
    if (quest.isLocked) return null;
    if (isCompleted) return null;

    switch (quest.quest.validation_type) {
      case "QR_SCAN":
        return (
          <Button
            size="sm"
            onClick={handleQRScan}
            className="bg-[#4ECDC4] hover:bg-[#45B7AA] text-white gap-2"
          >
            <QrCode className="w-4 h-4" />
            Scanner
          </Button>
        );
      case "PHOTO_UPLOAD":
        return (
          <>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-[#FF6B6B] hover:bg-[#FF5252] text-white gap-2"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              Poster
            </Button>
          </>
        );
      case "MANUAL_ADMIN":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
            En attente de validation
          </Badge>
        );
      case "AUTO_ATTENDANCE":
        if (!isInProgress && !isPending) {
          return (
            <Button
              size="sm"
              variant="outline"
              onClick={handleStartQuest}
              disabled={startQuestMutation.isPending}
              className="border-[#4ECDC4]/50 text-[#4ECDC4] hover:bg-[#4ECDC4]/10"
            >
              Commencer
            </Button>
          );
        }
        return (
          <Badge variant="outline" className="text-blue-400 border-blue-400/30 bg-blue-400/10">
            En cours ({quest.userProgress?.progress || 0}/{quest.quest.target_count || 1})
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    if (quest.isLocked) {
      return <Lock className="w-5 h-5 text-muted-foreground" />;
    }
    if (isCompleted) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
        >
          <CheckCircle2 className="w-6 h-6 text-[#4ECDC4]" />
        </motion.div>
      );
    }
    if (isInProgress) {
      return <Circle className="w-5 h-5 text-amber-500 fill-amber-500/30" />;
    }
    return <Circle className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${quest.isLocked ? "opacity-60" : ""}`}
    >
      <Card className={`p-4 transition-all ${
        isCompleted 
          ? "border-[#4ECDC4]/50 bg-[#4ECDC4]/5" 
          : quest.isLocked 
            ? "border-muted bg-muted/5" 
            : "border-border hover:border-[#FF6B6B]/50"
      }`}>
        <div className="flex items-start gap-4">
          {/* Icon & Status */}
          <div className="flex flex-col items-center gap-2">
            <div className={`text-2xl ${quest.isLocked ? "grayscale" : ""}`}>
              {quest.quest.icon || "⭐"}
            </div>
            {getStatusIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className={`font-display text-lg ${isCompleted ? "text-[#4ECDC4]" : ""}`}>
                {quest.quest.title}
              </h4>
              
              {/* Rewards */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {quest.quest.xp_reward && (
                  <Badge variant="secondary" className="bg-[#4ECDC4]/10 text-[#4ECDC4] text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    +{quest.quest.xp_reward} XP
                  </Badge>
                )}
                {quest.quest.otk_reward && (
                  <Badge variant="secondary" className="bg-[#FF6B6B]/10 text-[#FF6B6B] text-xs">
                    <Gift className="w-3 h-3 mr-1" />
                    +{quest.quest.otk_reward} OTK
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              {quest.quest.description}
            </p>

            {/* Lock reason or action */}
            {quest.isLocked ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {quest.lockReason}
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {VALIDATION_ICONS[quest.quest.validation_type || "MANUAL_ADMIN"]}
                  <span>
                    {quest.quest.validation_type === "QR_SCAN" && "Check-in QR"}
                    {quest.quest.validation_type === "PHOTO_UPLOAD" && "Photo requise"}
                    {quest.quest.validation_type === "MANUAL_ADMIN" && "Validation Staff"}
                    {quest.quest.validation_type === "AUTO_ATTENDANCE" && "Automatique"}
                  </span>
                </div>
                <div className="ml-auto">
                  {getActionButton()}
                </div>
              </div>
            )}

            {/* Progress bar for multi-step quests */}
            {isInProgress && quest.quest.target_count && quest.quest.target_count > 1 && (
              <div className="mt-3">
                <Progress 
                  value={((quest.userProgress?.progress || 0) / quest.quest.target_count) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Completion animation overlay */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-10"
          >
            <div className="text-center">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 0.5 }}
                className="text-5xl mb-2"
              >
                🎉
              </motion.div>
              <p className="text-white font-display">Quête validée !</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const EventQuestsBoard = ({ eventId }: EventQuestsBoardProps) => {
  const { data: quests, isLoading } = useEventQuests(eventId);
  const completeQuestMutation = useCompleteQuest();

  const handleCompleteQuest = (questId: string, proofUrl?: string) => {
    completeQuestMutation.mutate({ questId, eventId, proofUrl });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-sakura" />
      </div>
    );
  }

  if (!quests || quests.length === 0) {
    return (
      <div className="text-center py-8">
        <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Aucune quête disponible pour cet événement
        </p>
      </div>
    );
  }

  const completedCount = quests.filter(q => q.userProgress?.status === "completed").length;
  const totalCount = quests.length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📜</span>
          <h3 className="font-display text-xl">Tableau de Quêtes</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalCount} complétées
          </span>
          <div className="w-24">
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>
      </div>

      {/* Quest List */}
      <div className="space-y-3">
        {quests.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            eventId={eventId}
            onComplete={handleCompleteQuest}
          />
        ))}
      </div>

      {/* Total rewards summary */}
      {completedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-[#4ECDC4]/10 to-[#FF6B6B]/10 rounded-xl border border-[#4ECDC4]/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Récompenses gagnées</span>
            <div className="flex items-center gap-3">
              <Badge className="bg-[#4ECDC4]/20 text-[#4ECDC4]">
                <Zap className="w-3 h-3 mr-1" />
                +{quests
                  .filter(q => q.userProgress?.status === "completed")
                  .reduce((sum, q) => sum + (q.quest.xp_reward || 0), 0)} XP
              </Badge>
              <Badge className="bg-[#FF6B6B]/20 text-[#FF6B6B]">
                <Gift className="w-3 h-3 mr-1" />
                +{quests
                  .filter(q => q.userProgress?.status === "completed")
                  .reduce((sum, q) => sum + (q.quest.otk_reward || 0), 0)} OTK
              </Badge>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EventQuestsBoard;
