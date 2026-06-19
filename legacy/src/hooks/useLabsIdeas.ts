import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type LabsCategory = 'event' | 'feature' | 'merch' | 'other';
export type LabsStatus = 'draft' | 'voting' | 'review' | 'approved' | 'rejected';

export interface LabsIdea {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  author_id: string;
  category: LabsCategory;
  status: LabsStatus;
  target_votes: number;
  votes_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
  has_voted?: boolean;
}

export interface LabsVote {
  id: string;
  idea_id: string;
  user_id: string;
  created_at: string;
  voter?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useLabsIdeas = (status?: LabsStatus) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["labs-ideas", status, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("labs_ideas")
        .select(`
          *,
          author:profiles!labs_ideas_author_id_fkey(id, display_name, avatar_url, username)
        `)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Check if user has voted on each idea
      if (user && data) {
        const { data: userVotes } = await supabase
          .from("labs_votes")
          .select("idea_id")
          .eq("user_id", user.id);

        const votedIdeaIds = new Set(userVotes?.map(v => v.idea_id) || []);
        
        return data.map(idea => ({
          ...idea,
          has_voted: votedIdeaIds.has(idea.id)
        })) as LabsIdea[];
      }

      return data as LabsIdea[];
    },
  });
};

export const useLabsIdea = (ideaId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["labs-idea", ideaId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labs_ideas")
        .select(`
          *,
          author:profiles!labs_ideas_author_id_fkey(id, display_name, avatar_url, username)
        `)
        .eq("id", ideaId)
        .single();

      if (error) throw error;

      // Check if user has voted
      let hasVoted = false;
      if (user) {
        const { data: vote } = await supabase
          .from("labs_votes")
          .select("id")
          .eq("idea_id", ideaId)
          .eq("user_id", user.id)
          .maybeSingle();
        
        hasVoted = !!vote;
      }

      return { ...data, has_voted: hasVoted } as LabsIdea;
    },
    enabled: !!ideaId,
  });
};

export const useIdeaVoters = (ideaId: string) => {
  return useQuery({
    queryKey: ["labs-idea-voters", ideaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labs_votes")
        .select(`
          *,
          voter:profiles!labs_votes_user_id_fkey(id, display_name, avatar_url)
        `)
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as LabsVote[];
    },
    enabled: !!ideaId,
  });
};

export const useVoteIdea = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (ideaId: string) => {
      if (!user) throw new Error("Vous devez être connecté pour voter");

      const { error } = await supabase
        .from("labs_votes")
        .insert({ idea_id: ideaId, user_id: user.id });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Vous avez déjà voté pour cette idée");
        }
        throw error;
      }
    },
    onSuccess: (_, ideaId) => {
      queryClient.invalidateQueries({ queryKey: ["labs-ideas"] });
      queryClient.invalidateQueries({ queryKey: ["labs-idea", ideaId] });
      queryClient.invalidateQueries({ queryKey: ["labs-idea-voters", ideaId] });
      toast.success("Vote enregistré ! 🎉");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUnvoteIdea = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (ideaId: string) => {
      if (!user) throw new Error("Vous devez être connecté");

      const { error } = await supabase
        .from("labs_votes")
        .delete()
        .eq("idea_id", ideaId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: (_, ideaId) => {
      queryClient.invalidateQueries({ queryKey: ["labs-ideas"] });
      queryClient.invalidateQueries({ queryKey: ["labs-idea", ideaId] });
      queryClient.invalidateQueries({ queryKey: ["labs-idea-voters", ideaId] });
      toast.success("Vote retiré");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useCreateIdea = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (idea: {
      title: string;
      description: string;
      cover_url: string;
      category: LabsCategory;
    }) => {
      if (!user) throw new Error("Vous devez être connecté");

      const { data, error } = await supabase
        .from("labs_ideas")
        .insert({
          ...idea,
          author_id: user.id,
          status: "voting" as LabsStatus,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labs-ideas"] });
      toast.success("Idée soumise avec succès ! 🚀");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
