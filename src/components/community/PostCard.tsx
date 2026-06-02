import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
  Star,
  MoreHorizontal,
  Flag,
  Bookmark,
  Trash2,
  Loader2,
} from "lucide-react";
import { Post, useToggleLike, useDeletePost } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";

interface PostCardProps {
  post: Post;
  isLiked?: boolean;
  variant?: "list" | "grid";
  onCommentClick?: () => void;
}

const classColors: Record<string, { bg: string; text: string; emoji: string }> = {
  "Ninja": { bg: "bg-emerald-500/20", text: "text-emerald-400", emoji: "🔰" },
  "Guerrier": { bg: "bg-red-500/20", text: "text-red-400", emoji: "⚔️" },
  "Hokage": { bg: "bg-orange-500/20", text: "text-orange-400", emoji: "🔥" },
  "Stratège": { bg: "bg-blue-500/20", text: "text-blue-400", emoji: "🧠" },
  "Artiste": { bg: "bg-purple-500/20", text: "text-purple-400", emoji: "🎨" },
  "Senpai": { bg: "bg-amber-500/20", text: "text-amber-400", emoji: "⭐" },
  default: { bg: "bg-muted", text: "text-muted-foreground", emoji: "🎌" },
};

const PostCard = ({ post, isLiked = false, variant = "list", onCommentClick }: PostCardProps) => {
  const { user } = useAuth();
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localLikesCount, setLocalLikesCount] = useState(post.likes_count);
  const [expanded, setExpanded] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const toggleLikeMutation = useToggleLike();
  const deletePostMutation = useDeletePost();

  const isOwner = user?.id === post.author_id;
  const displayName = post.author?.display_name || post.author?.username || "Anonyme";
  const classInfo = classColors[post.author?.otaku_class || ""] || classColors.default;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { 
    addSuffix: true, 
    locale: fr 
  });

  const handleLike = async () => {
    if (!user || isLiking) return;
    
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
      // Revert on error
      setLocalLiked(localLiked);
      setLocalLikesCount(post.likes_count);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    await deletePostMutation.mutateAsync(post.id);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post.title || "Post sur Manga Paradise",
        text: post.content?.slice(0, 100) || "",
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Content truncation
  const shouldTruncate = post.content && post.content.length > 200 && !expanded;
  const displayContent = shouldTruncate 
    ? post.content.slice(0, 200) + "..." 
    : post.content;

  if (variant === "grid") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-sakura/30 transition-all"
      >
        {/* Media */}
        {post.media_url && (
          <div className="aspect-square overflow-hidden">
            <img
              src={post.media_url}
              alt={post.title || "Post image"}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="w-6 h-6 border border-white/20">
                <AvatarImage src={post.author?.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-sakura/20">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-white truncate">
                {displayName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <span className="flex items-center gap-1">
                <Heart className={cn("w-4 h-4", localLiked && "fill-sakura text-sakura")} />
                {localLikesCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {post.comments_count}
              </span>
            </div>
          </div>
        </div>

        {/* Tags overlay */}
        {post.tags && post.tags.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {post.tags.slice(0, 2).map((tag, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="bg-black/50 text-turquoise text-xs backdrop-blur-sm"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // List variant (default)
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-sakura/20 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-sakura/30">
            <AvatarImage src={post.author?.avatar_url || undefined} />
            <AvatarFallback className="bg-sakura/20 text-sakura font-display">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{displayName}</span>
              {post.author?.otaku_class && (
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs px-2 py-0", classInfo.bg, classInfo.text)}
                >
                  {classInfo.emoji} {post.author.otaku_class}
                </Badge>
              )}
              {post.author?.level && post.author.level >= 10 && (
                <Badge variant="outline" className="text-xs border-accent/50 text-accent">
                  Lv.{post.author.level}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem className="gap-2">
              <Bookmark className="w-4 h-4" />
              Sauvegarder
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <Flag className="w-4 h-4" />
              Signaler
            </DropdownMenuItem>
            {isOwner && (
              <DropdownMenuItem 
                className="gap-2 text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map((tag, i) => (
            <button
              key={i}
              className="text-turquoise text-sm hover:text-turquoise/80 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Title */}
      {post.title && (
        <h3 className="font-display text-lg text-foreground mb-2">{post.title}</h3>
      )}

      {/* Media */}
      {post.media_url && (
        <div className="rounded-lg overflow-hidden mb-3 -mx-1">
          <img
            src={post.media_url}
            alt={post.title || "Post media"}
            className="w-full max-h-[400px] object-cover"
          />
        </div>
      )}

      {/* Content */}
      {post.content && (
        <div className="mb-3">
          <p className="text-foreground/90 whitespace-pre-wrap">{displayContent}</p>
          {shouldTruncate && (
            <button
              onClick={() => setExpanded(true)}
              className="text-sakura text-sm mt-1 hover:underline"
            >
              Voir plus
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-1">
          {/* Like */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={!user || isLiking}
            className={cn(
              "gap-1.5 hover:bg-sakura/10",
              localLiked && "text-sakura"
            )}
          >
            <AnimatePresence mode="wait">
              {isLiking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <motion.div
                  key={localLiked ? "liked" : "not-liked"}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.5 }}
                >
                  <Heart 
                    className={cn(
                      "w-4 h-4 transition-all",
                      localLiked && "fill-sakura text-sakura"
                    )} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <span>{localLikesCount}</span>
          </Button>

          {/* Comment */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCommentClick}
            className="gap-1.5 hover:bg-turquoise/10"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.comments_count}</span>
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {/* Award */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 hover:bg-accent/10 text-accent"
            disabled={!user}
          >
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Valoriser</span>
          </Button>

          {/* Share */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="gap-1.5 hover:bg-turquoise/10"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
};

export default PostCard;
