import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Check, X, User, Calendar, Eye, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingAchievements, useModerateAchievement } from "@/hooks/useCosplayAchievements";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const AdminAchievements = () => {
  const { user } = useAuth();
  const { data: pendingAchievements, isLoading } = usePendingAchievements();
  const moderateMutation = useModerateAchievement();
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    if (!user) return;
    moderateMutation.mutate({ id, status: "approved", reviewerId: user.id });
  };

  const handleReject = (id: string) => {
    if (!user) return;
    moderateMutation.mutate({ id, status: "rejected", reviewerId: user.id });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-sakura tracking-wide flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            MODÉRATION TROPHÉES
          </h1>
          <p className="text-muted-foreground font-body mt-1">
            Vérifiez les preuves et validez les prix déclarés par les membres
          </p>
        </div>
        
        {pendingAchievements && pendingAchievements.length > 0 && (
          <div className="bg-amber-500/20 text-amber-500 px-3 py-1.5 rounded-full text-sm font-display">
            {pendingAchievements.length} en attente
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!pendingAchievements || pendingAchievements.length === 0) && (
        <div className="text-center py-16 bg-muted/30 rounded-xl">
          <Trophy className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-body text-lg">
            Aucun trophée en attente de validation
          </p>
          <p className="text-muted-foreground/60 font-body text-sm mt-1">
            Les nouvelles déclarations apparaîtront ici
          </p>
        </div>
      )}

      {/* Pending Achievements List */}
      {pendingAchievements && pendingAchievements.length > 0 && (
        <div className="grid gap-4">
          {pendingAchievements.map((achievement, index) => {
            const displayName = achievement.profiles?.display_name || achievement.profiles?.username || "Membre";
            
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl p-5 border border-border shadow-lg"
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 lg:w-48 flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-sakura/20 flex items-center justify-center overflow-hidden">
                      {achievement.profiles?.avatar_url ? (
                        <img 
                          src={achievement.profiles.avatar_url} 
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-sakura" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-foreground truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(achievement.created_at), "d MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>

                  {/* Achievement Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-5 h-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-lg text-foreground truncate">
                          {achievement.award_title}
                        </h3>
                        <p className="text-muted-foreground truncate">
                          {achievement.contest_name}
                        </p>
                        <p className="text-sm text-muted-foreground/70 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(achievement.event_date), "d MMMM yyyy", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 lg:flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProof(achievement.proof_image_url)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Voir preuve
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => handleApprove(achievement.id)}
                      disabled={moderateMutation.isPending}
                      className="bg-success hover:bg-success/90 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Valider
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReject(achievement.id)}
                      disabled={moderateMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Refuser
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Proof Lightbox */}
      <Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-sakura flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preuve de récompense
            </DialogTitle>
          </DialogHeader>
          
          {selectedProof && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <img
                  src={selectedProof}
                  alt="Preuve"
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(selectedProof, "_blank")}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ouvrir en grand
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAchievements;
