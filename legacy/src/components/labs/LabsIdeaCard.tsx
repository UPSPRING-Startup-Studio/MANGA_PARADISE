import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ThumbsUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { LabsIdea, useVoteIdea, useUnvoteIdea } from "@/hooks/useLabsIdeas";
import { useAuth } from "@/contexts/AuthContext";

interface LabsIdeaCardProps {
  idea: LabsIdea;
}

const categoryLabels: Record<string, { label: string; color: string }> = {
  event: { label: "Événement", color: "bg-turquoise/20 text-turquoise border-turquoise/30" },
  feature: { label: "Fonctionnalité", color: "bg-sakura/20 text-sakura border-sakura/30" },
  merch: { label: "Merch", color: "bg-gold/20 text-gold border-gold/30" },
  other: { label: "Autre", color: "bg-muted text-muted-foreground border-muted" },
};

export const LabsIdeaCard = ({ idea }: LabsIdeaCardProps) => {
  const { user } = useAuth();
  const voteIdea = useVoteIdea();
  const unvoteIdea = useUnvoteIdea();

  const progress = Math.min((idea.votes_count / idea.target_votes) * 100, 100);
  const categoryInfo = categoryLabels[idea.category] || categoryLabels.other;

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      window.location.href = "/auth";
      return;
    }

    if (idea.has_voted) {
      unvoteIdea.mutate(idea.id);
    } else {
      voteIdea.mutate(idea.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/labs/${idea.id}`}>
        <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-sakura/50 transition-all duration-300 group">
          {/* Cover Image */}
          <div className="relative aspect-[16/9] overflow-hidden">
            <img
              src={idea.cover_url}
              alt={idea.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Category Badge */}
            <Badge 
              variant="outline" 
              className={cn("absolute top-3 left-3", categoryInfo.color)}
            >
              {categoryInfo.label}
            </Badge>

            {/* Vote count overlay */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm">{idea.votes_count}</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Title */}
            <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2 group-hover:text-sakura transition-colors">
              {idea.title}
            </h3>

            {/* Author */}
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={idea.author?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {idea.author?.display_name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {idea.author?.display_name || idea.author?.username || "Anonyme"}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{idea.votes_count} votes</span>
                <span>Objectif: {idea.target_votes}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Vote Button */}
            <Button
              onClick={handleVote}
              disabled={voteIdea.isPending || unvoteIdea.isPending}
              variant={idea.has_voted ? "secondary" : "cta"}
              className="w-full"
            >
              <ThumbsUp className={cn("w-4 h-4 mr-2", idea.has_voted && "fill-current")} />
              {idea.has_voted ? "Soutenu ✓" : "Soutenir 👍"}
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
