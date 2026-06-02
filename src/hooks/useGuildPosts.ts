import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GuildPost {
  id: string;
  guild_id: string;
  author_id: string | null;
  title: string;
  content: string | null;
  image_url: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export function useGuildPosts(guildId: string | undefined) {
  return useQuery({
    queryKey: ["guild-posts", guildId],
    queryFn: async () => {
      if (!guildId) return [];

      const { data, error } = await supabase
        .from("guild_posts")
        .select(`
          *,
          author:profiles!guild_posts_author_id_fkey(display_name, username, avatar_url)
        `)
        .eq("guild_id", guildId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GuildPost[];
    },
    enabled: !!guildId,
  });
}

export function useCreateGuildPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postData: {
      guild_id: string;
      title: string;
      content?: string;
      image_url?: string;
      is_pinned?: boolean;
    }) => {
      if (!user) throw new Error("Vous devez être connecté");

      const { data, error } = await supabase
        .from("guild_posts")
        .insert({
          ...postData,
          author_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Guild post insert error:", error.message, error.details, error.hint);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["guild-posts", variables.guild_id] });
      toast.success("Article publié avec succès !");
    },
    onError: (error: any) => {
      console.error("Error creating guild post:", error?.message, error);
      toast.error("Erreur lors de la publication de l'article");
    },
  });
}

export function useUpdateGuildPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      postId, 
      guildId, 
      updates 
    }: { 
      postId: string; 
      guildId: string; 
      updates: Partial<Pick<GuildPost, 'title' | 'content' | 'image_url' | 'is_pinned'>>
    }) => {
      const { error } = await supabase
        .from("guild_posts")
        .update(updates)
        .eq("id", postId);

      if (error) throw error;
      return guildId;
    },
    onSuccess: (guildId) => {
      queryClient.invalidateQueries({ queryKey: ["guild-posts", guildId] });
      toast.success("Article mis à jour");
    },
    onError: (error) => {
      console.error("Error updating guild post:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });
}

export function useDeleteGuildPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, guildId }: { postId: string; guildId: string }) => {
      const { error } = await supabase
        .from("guild_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;
      return guildId;
    },
    onSuccess: (guildId) => {
      queryClient.invalidateQueries({ queryKey: ["guild-posts", guildId] });
      toast.success("Article supprimé");
    },
    onError: (error) => {
      console.error("Error deleting guild post:", error);
      toast.error("Erreur lors de la suppression");
    },
  });
}
