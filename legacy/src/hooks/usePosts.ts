import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Post {
  id: string;
  author_id: string;
  content_type: "text" | "image" | "video" | "poll";
  category: string;
  title: string | null;
  content: string | null;
  media_url: string | null;
  tags: string[];
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  post_type: "wip" | "showcase";
  related_cosplay_id: string | null;
  related_event_id: string | null;
  tagged_photographer_id: string | null;
  author?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    otaku_class: string | null;
    level: number;
  };
  related_cosplay?: {
    id: string;
    character_name: string;
    universe: string;
    user_image_url: string;
  } | null;
  related_event?: {
    id: string;
    title: string;
    date: string;
  } | null;
  photographer?: {
    id: string;
    display_name: string | null;
    username: string | null;
  } | null;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
  author?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

// Fetch posts with filters
export const usePosts = (options?: {
  category?: string;
  sortBy?: "recent" | "popular";
  limit?: number;
  postType?: "wip" | "showcase";
  eventId?: string;
  cosplayId?: string;
  authorId?: string;
}) => {
  const { category, sortBy = "recent", limit = 20, postType, eventId, cosplayId, authorId } = options || {};

  return useQuery({
    queryKey: ["posts", category, sortBy, limit, postType, eventId, cosplayId, authorId],
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select(`
          *,
          author:profiles!posts_author_id_fkey (id, display_name, username, avatar_url, otaku_class, level),
          related_cosplay:cosplay_vestiaire!posts_related_cosplay_id_fkey (id, character_name, universe, user_image_url),
          related_event:events!posts_related_event_id_fkey (id, title, date),
          photographer:profiles!posts_tagged_photographer_id_fkey (id, display_name, username)
        `)
        .limit(limit);

      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      if (postType) {
        query = query.eq("post_type", postType);
      }

      if (eventId) {
        query = query.eq("related_event_id", eventId);
      }

      if (cosplayId) {
        query = query.eq("related_cosplay_id", cosplayId);
      }

      if (authorId) {
        query = query.eq("author_id", authorId);
      }

      if (sortBy === "popular") {
        query = query.order("likes_count", { ascending: false });
      } else {
        query = query.order("is_pinned", { ascending: false })
                     .order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Post[];
    },
  });
};

// Create a new post
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      authorId: string;
      contentType: "text" | "image" | "video" | "poll";
      category: string;
      title?: string;
      content?: string;
      mediaUrl?: string;
      tags?: string[];
      postType?: "wip" | "showcase";
      relatedCosplayId?: string;
      relatedEventId?: string;
      taggedPhotographerId?: string;
    }) => {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id: input.authorId,
          content_type: input.contentType,
          category: input.category,
          title: input.title || null,
          content: input.content || null,
          media_url: input.mediaUrl || null,
          tags: input.tags || [],
          post_type: input.postType || "showcase",
          related_cosplay_id: input.relatedCosplayId || null,
          related_event_id: input.relatedEventId || null,
          tagged_photographer_id: input.taggedPhotographerId || null,
        })
        .select(`
          *,
          author:profiles!posts_author_id_fkey (id, display_name, username, avatar_url, otaku_class, level)
        `)
        .single();

      if (error) throw error;
      return data as Post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post publié ! +10 XP 🎉");
    },
    onError: (error) => {
      console.error("Error creating post:", error);
      toast.error("Erreur lors de la publication");
    },
  });
};

// Like/Unlike a post
export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, userId, isLiked }: { 
      postId: string; 
      userId: string; 
      isLiked: boolean;
    }) => {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
      return { postId, isLiked: !isLiked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post-likes"] });
    },
  });
};

// Check if user has liked a post
export const useUserLikes = (userId: string | undefined, postIds: string[]) => {
  return useQuery({
    queryKey: ["post-likes", userId, postIds],
    queryFn: async () => {
      if (!userId || postIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds);

      if (error) throw error;
      return data.map(d => d.post_id);
    },
    enabled: !!userId && postIds.length > 0,
  });
};

// Delete a post
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post supprimé");
    },
    onError: (error) => {
      console.error("Error deleting post:", error);
      toast.error("Erreur lors de la suppression");
    },
  });
};

// Fetch comments for a post
export const usePostComments = (postId: string | undefined) => {
  return useQuery({
    queryKey: ["post-comments", postId],
    queryFn: async () => {
      if (!postId) return [];
      
      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          *,
          author:profiles!post_comments_author_id_fkey (id, display_name, username, avatar_url)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as PostComment[];
    },
    enabled: !!postId,
  });
};

// Create a comment
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      postId: string;
      authorId: string;
      content: string;
      parentId?: string;
    }) => {
      const { data, error } = await supabase
        .from("post_comments")
        .insert({
          post_id: input.postId,
          author_id: input.authorId,
          content: input.content,
          parent_id: input.parentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};
