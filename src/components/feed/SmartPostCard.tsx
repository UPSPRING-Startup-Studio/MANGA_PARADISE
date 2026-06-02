import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Bookmark,
  MapPin,
  Camera,
  Wrench,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToggleLike, useDeletePost, Post } from "@/hooks/usePosts";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface SmartPostCardProps {
  post: Post;
  isLiked: boolean;
}

const SmartPostCard = ({ post, isLiked }: SmartPostCardProps) => {
  const { user } = useAuth();
  const toggleLikeMutation = useToggleLike();
  const deletePostMutation = useDeletePost();

  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localLikesCount, setLocalLikesCount] = useState(post.likes_count);
  const [isLiking, setIsLiking] = useState(false);

  const isOwner = user?.id === post.author_id;
  const authorName = post.author?.display_name || post.author?.username || "Anonyme";
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr });

  const handleLike = async () => {
    if (!user) {
      toast.error("Connecte-toi pour liker");
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    setLocalLiked(!localLiked);
    setLocalLikesCount(prev => localLiked ? prev - 1 : prev + 1);

    try {
      await toggleLikeMutation.mutateAsync({
        postId: post.id,
        userId: user.id,
        isLiked: localLiked,
      });
    } catch {
      setLocalLiked(localLiked);
      setLocalLikesCount(post.likes_count);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer ce post ?")) return;
    await deletePostMutation.mutateAsync(post.id);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/feed?post=${post.id}`;
    if (navigator.share) {
      await navigator.share({ url, title: "Post Cos-Feed" });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié !");
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="bg-white/5 border-white/10 overflow-hidden hover:border-white/20 transition-all">
        {/* Header */}
        <div className="p-4 flex items-center gap-3">
          <Link to={`/u/${post.author?.username || post.author_id}`}>
            <Avatar className="w-10 h-10 border-2 border-sakura/30 hover:border-sakura transition-colors">
              <AvatarImage src={post.author?.avatar_url || undefined} />
              <AvatarFallback className="bg-sakura/20 text-sakura">
                {authorName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to={`/u/${post.author?.username || post.author_id}`}
                className="font-medium hover:text-sakura transition-colors truncate"
              >
                {authorName}
              </Link>
              {post.post_type === "wip" ? (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs gap-1">
                  <Wrench className="w-3 h-3" />
                  WIP
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-turquoise/10 text-turquoise border-turquoise/30 text-xs gap-1">
                  <Sparkles className="w-3 h-3" />
                  Showcase
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#362F4B] border-white/10">
              <DropdownMenuItem className="gap-2">
                <Bookmark className="w-4 h-4" />
                Enregistrer
              </DropdownMenuItem>
              {isOwner && (
                <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Media */}
        {post.media_url && (
          <div className="relative aspect-[4/5] max-h-[500px] bg-black/20">
            {post.content_type === "video" ? (
              <video src={post.media_url} className="w-full h-full object-contain" controls />
            ) : (
              <img src={post.media_url} alt="" className="w-full h-full object-contain" />
            )}
          </div>
        )}

        {/* Smart Context Badges */}
        {(post.related_cosplay || post.related_event || post.photographer) && (
          <div className="px-4 pt-3 flex flex-wrap gap-2">
            {post.related_cosplay && (
              <Link to={`/communaute/annuaire?character=${post.related_cosplay.character_name}`}>
                <Badge
                  variant="secondary"
                  className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors cursor-pointer"
                >
                  🎭 {post.related_cosplay.character_name}
                </Badge>
              </Link>
            )}
            {post.related_event && (
              <Link to={`/evenements/${post.related_event.id}`}>
                <Badge
                  variant="secondary"
                  className="bg-sakura/20 text-sakura hover:bg-sakura/30 transition-colors cursor-pointer gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  {post.related_event.title}
                </Badge>
              </Link>
            )}
            {post.photographer && (
              <Link to={`/u/${post.photographer.username || post.photographer.id}`}>
                <Badge
                  variant="secondary"
                  className="bg-turquoise/20 text-turquoise hover:bg-turquoise/30 transition-colors cursor-pointer gap-1"
                >
                  <Camera className="w-3 h-3" />
                  @{post.photographer.display_name || post.photographer.username}
                </Badge>
              </Link>
            )}
          </div>
        )}

        {/* Caption */}
        {post.content && (
          <div className="px-4 pt-3">
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className={cn(
              "gap-1.5 hover:text-sakura",
              localLiked && "text-sakura"
            )}
          >
            <Heart className={cn("w-5 h-5", localLiked && "fill-sakura")} />
            <span className="text-sm">{localLikesCount}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 hover:text-turquoise">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comments_count}</span>
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" onClick={handleShare} className="hover:text-sakura">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default SmartPostCard;
