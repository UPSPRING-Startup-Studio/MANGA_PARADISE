import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Camera, 
  Video, 
  BarChart3, 
  X, 
  Loader2, 
  Sparkles,
  Image as ImageIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreatePost } from "@/hooks/usePosts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userAvatar?: string | null;
}

const categories = [
  { value: "general", label: "💬 Discussion", emoji: "💬" },
  { value: "galerie", label: "🎨 Galerie Créarts", emoji: "🎨" },
  { value: "cosplay", label: "🎎 Cosplay Zone", emoji: "🎎" },
  { value: "gaming", label: "🎮 Gaming", emoji: "🎮" },
  { value: "events", label: "📅 Événements", emoji: "📅" },
  { value: "tendances", label: "🔥 Tendances", emoji: "🔥" },
];

const CreatePostModal = ({
  open,
  onOpenChange,
  userId,
  userName,
  userAvatar,
}: CreatePostModalProps) => {
  const [contentType, setContentType] = useState<"text" | "image" | "video" | "poll">("text");
  const [category, setCategory] = useState("general");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPostMutation = useCreatePost();

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setContentType(file.type.startsWith("video/") ? "video" : "image");
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setContentType("text");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, "");
      if (newTag && !tags.includes(newTag) && tags.length < 5) {
        setTags([...tags, newTag]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) {
      toast.error("Ajoute du contenu à ton post");
      return;
    }

    setIsSubmitting(true);

    try {
      let mediaUrl: string | undefined;

      // Upload media if present
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars") // Using avatars bucket for now, should create posts bucket
          .upload(`posts/${fileName}`, mediaFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(`posts/${fileName}`);
        
        mediaUrl = urlData.publicUrl;
      }

      await createPostMutation.mutateAsync({
        authorId: userId,
        contentType,
        category,
        title: title.trim() || undefined,
        content: content.trim() || undefined,
        mediaUrl,
        tags,
      });

      // Reset form
      setTitle("");
      setContent("");
      setTags([]);
      setTagInput("");
      handleRemoveMedia();
      setCategory("general");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Erreur lors de la publication");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#362F4B] border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sakura" />
            Créer un post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Author preview */}
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <Avatar className="w-10 h-10 border-2 border-sakura/30">
              <AvatarImage src={userAvatar || undefined} />
              <AvatarFallback className="bg-sakura/20 text-sakura">
                {userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{userName}</p>
              <p className="text-xs text-turquoise flex items-center gap-1">
                💡 Poster rapporte +10 XP
              </p>
            </div>
          </div>

          {/* Category selector */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Catégorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#362F4B] border-white/10">
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title (optional) */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Titre (optionnel)</Label>
            <Input
              placeholder="Un titre accrocheur..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-sakura/50"
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Contenu</Label>
            <Textarea
              placeholder="Quoi de neuf dans ton univers ? 🌸"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-sakura/50 min-h-[120px] resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/2000
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Tags (max 5)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              <AnimatePresence>
                {tags.map((tag) => (
                  <motion.div
                    key={tag}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Badge 
                      variant="secondary"
                      className="bg-turquoise/20 text-turquoise gap-1"
                    >
                      #{tag}
                      <button 
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {tags.length < 5 && (
              <Input
                placeholder="Ajoute des tags (Entrée pour valider)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="bg-white/5 border-white/10 focus:border-turquoise/50"
              />
            )}
          </div>

          {/* Media preview */}
          <AnimatePresence>
            {mediaPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="relative rounded-lg overflow-hidden"
              >
                {contentType === "video" ? (
                  <video src={mediaPreview} className="w-full max-h-48 object-cover" controls />
                ) : (
                  <img src={mediaPreview} alt="Preview" className="w-full max-h-48 object-cover" />
                )}
                <button
                  onClick={handleRemoveMedia}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Media buttons */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 border-white/10 hover:bg-white/5"
            >
              <ImageIcon className="w-4 h-4" />
              Photo/Fanart
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              className="gap-2 border-white/10 opacity-50"
            >
              <BarChart3 className="w-4 h-4" />
              Sondage
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="border-white/10"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && !mediaFile)}
            className="bg-gradient-to-r from-sakura to-turquoise hover:opacity-90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publication...
              </>
            ) : (
              "Publier"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
