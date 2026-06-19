import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, ThumbsUp, Share2, Calendar, User } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { LabsStatusTimeline } from "@/components/labs/LabsStatusTimeline";
import { useLabsIdea, useIdeaVoters, useVoteIdea, useUnvoteIdea } from "@/hooks/useLabsIdeas";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const categoryLabels: Record<string, { label: string; color: string }> = {
  event: { label: "Événement", color: "bg-turquoise/20 text-turquoise border-turquoise/30" },
  feature: { label: "Fonctionnalité", color: "bg-sakura/20 text-sakura border-sakura/30" },
  merch: { label: "Merch", color: "bg-gold/20 text-gold border-gold/30" },
  other: { label: "Autre", color: "bg-muted text-muted-foreground border-muted" },
};

const LabsIdeaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: idea, isLoading } = useLabsIdea(id || "");
  const { data: voters } = useIdeaVoters(id || "");
  const voteIdea = useVoteIdea();
  const unvoteIdea = useUnvoteIdea();

  const handleVote = () => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    if (!idea) return;

    if (idea.has_voted) {
      unvoteIdea.mutate(idea.id);
    } else {
      voteIdea.mutate(idea.id);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Lien copié dans le presse-papier !");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16">
          <div className="container">
            <Skeleton className="h-8 w-32 mb-8" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-40 w-full" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16">
          <div className="container text-center py-16">
            <h1 className="font-display text-2xl font-bold mb-4">Idée introuvable</h1>
            <p className="text-muted-foreground mb-6">Cette idée n'existe pas ou a été supprimée.</p>
            <Link to="/labs">
              <Button variant="outline">Retour au Labs</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const progress = Math.min((idea.votes_count / idea.target_votes) * 100, 100);
  const categoryInfo = categoryLabels[idea.category] || categoryLabels.other;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="container">
          {/* Back Link */}
          <Link
            to="/labs"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Labs
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cover Image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative aspect-video rounded-xl overflow-hidden"
              >
                <img
                  src={idea.cover_url}
                  alt={idea.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <Badge 
                  variant="outline" 
                  className={cn("absolute top-4 left-4", categoryInfo.color)}
                >
                  {categoryInfo.label}
                </Badge>
              </motion.div>

              {/* Title & Meta */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  {idea.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={idea.author?.avatar_url || undefined} />
                      <AvatarFallback>{idea.author?.display_name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <span>Par {idea.author?.display_name || idea.author?.username || "Anonyme"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(idea.created_at), "d MMMM yyyy", { locale: fr })}</span>
                  </div>
                </div>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h2 className="font-display font-semibold mb-4">Description</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{idea.description}</p>
                </div>
              </motion.div>

              {/* Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <LabsStatusTimeline currentStatus={idea.status} />
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-xl p-6 sticky top-28"
              >
                <div className="text-center mb-6">
                  <div className="text-5xl font-display font-bold text-sakura mb-2">
                    {idea.votes_count}
                  </div>
                  <p className="text-muted-foreground">votes sur {idea.target_votes}</p>
                </div>

                {/* Progress */}
                <div className="mb-6">
                  <Progress value={progress} className="h-3" />
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    {Math.round(progress)}% de l'objectif
                  </p>
                </div>

                {/* Vote Button */}
                <Button
                  onClick={handleVote}
                  disabled={voteIdea.isPending || unvoteIdea.isPending}
                  variant={idea.has_voted ? "secondary" : "cta"}
                  className="w-full mb-3"
                  size="lg"
                >
                  <ThumbsUp className={cn("w-5 h-5 mr-2", idea.has_voted && "fill-current")} />
                  {idea.has_voted ? "Soutenu ✓" : "Je soutiens ce projet"}
                </Button>

                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="w-full"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>

                {/* Recent Voters */}
                {voters && voters.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Derniers soutiens
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {voters.slice(0, 10).map((vote) => (
                        <Avatar key={vote.id} className="w-8 h-8 border-2 border-background">
                          <AvatarImage src={vote.voter?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {vote.voter?.display_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {voters.length > 10 && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          +{voters.length - 10}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LabsIdeaDetail;
