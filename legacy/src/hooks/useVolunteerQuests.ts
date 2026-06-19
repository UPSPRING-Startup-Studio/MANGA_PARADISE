import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface VolunteerQuest {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  deadline: string | null;
  status: string;
  otk_reward: number;
  xp_reward: number;
  icon: string | null;
  created_at: string;
  created_by: string | null;
}

export interface QuestSubmission {
  id: string;
  quest_id: string;
  user_id: string;
  proof_text: string | null;
  proof_link: string | null;
  status: string;
  feedback: string | null;
  created_at: string;
  reviewed_at: string | null;
  quest?: VolunteerQuest;
  profile?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useVolunteerQuests = () => {
  return useQuery({
    queryKey: ["volunteer-quests"],
    queryFn: async (): Promise<VolunteerQuest[]> => {
      const { data, error } = await supabase
        .from("quests")
        .select("*")
        .eq("status", "open")
        .eq("is_active", true)
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching quests:", error);
        throw error;
      }

      return (data || []) as VolunteerQuest[];
    },
  });
};

export const useMyQuestSubmissions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-quest-submissions", user?.id],
    queryFn: async (): Promise<QuestSubmission[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("quest_submissions")
        .select(`
          *,
          quest:quests(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching submissions:", error);
        throw error;
      }

      return (data || []).map((item: any) => ({
        ...item,
        quest: item.quest,
      })) as QuestSubmission[];
    },
    enabled: !!user,
  });
};

export const usePendingSubmissions = () => {
  return useQuery({
    queryKey: ["pending-quest-submissions"],
    queryFn: async (): Promise<QuestSubmission[]> => {
      const { data, error } = await supabase
        .from("quest_submissions")
        .select(`
          *,
          quest:quests(*)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching pending submissions:", error);
        throw error;
      }

      // Fetch profiles separately to avoid ambiguous relationship
      const submissions = data || [];
      const userIds = [...new Set(submissions.map(s => s.user_id))];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return submissions.map((item: any) => ({
        ...item,
        quest: item.quest,
        profile: profileMap.get(item.user_id) || null,
      })) as QuestSubmission[];
    },
  });
};

export const useAcceptQuest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (questId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("quest_submissions").insert({
        quest_id: questId,
        user_id: user.id,
        status: "in_progress",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("🎮 Quête acceptée ! Bonne chance, aventurier !");
      queryClient.invalidateQueries({ queryKey: ["volunteer-quests"] });
      queryClient.invalidateQueries({ queryKey: ["my-quest-submissions"] });
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Tu as déjà accepté cette quête !");
      } else {
        toast.error("Erreur lors de l'acceptation de la quête");
        console.error(error);
      }
    },
  });
};

export const useSubmitQuestProof = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      proofText,
      proofLink,
    }: {
      submissionId: string;
      proofText: string;
      proofLink?: string;
    }) => {
      const { error } = await supabase
        .from("quest_submissions")
        .update({
          proof_text: proofText,
          proof_link: proofLink || null,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("📜 Rapport soumis ! Un référent va le valider.");
      queryClient.invalidateQueries({ queryKey: ["my-quest-submissions"] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la soumission");
      console.error(error);
    },
  });
};

export const useValidateSubmission = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      submissionId,
      approved,
      feedback,
    }: {
      submissionId: string;
      approved: boolean;
      feedback?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Get submission details first
      const { data: submission, error: fetchError } = await supabase
        .from("quest_submissions")
        .select("user_id, quest_id, quest:quests(otk_reward, xp_reward, title)")
        .eq("id", submissionId)
        .single();

      if (fetchError) throw fetchError;

      // Update submission status
      const { error: updateError } = await supabase
        .from("quest_submissions")
        .update({
          status: approved ? "approved" : "rejected",
          feedback: feedback || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", submissionId);

      if (updateError) throw updateError;

      // If approved, credit rewards to user
      if (approved && submission) {
        const quest = submission.quest as any;
        const otkReward = quest?.otk_reward || 0;
        const xpReward = quest?.xp_reward || 0;

        // Update user's OTK and XP directly
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("otk_coins, xp")
          .eq("id", submission.user_id)
          .single();

        if (userProfile) {
          await supabase
            .from("profiles")
            .update({
              otk_coins: (userProfile.otk_coins || 0) + otkReward,
              xp: (userProfile.xp || 0) + xpReward,
            })
            .eq("id", submission.user_id);
        }

        // Create notification for user
        await supabase.from("notifications").insert({
          user_id: submission.user_id,
          type: "quest_completed",
          content: `🎉 Ta quête "${quest?.title}" a été validée ! +${otkReward} OTK, +${xpReward} XP`,
          related_link: "/espace-membre/quetes",
        });
      }

      return { approved, submission };
    },
    onSuccess: ({ approved }) => {
      if (approved) {
        toast.success("✅ Quête validée ! Récompenses créditées.");
      } else {
        toast.info("❌ Quête refusée.");
      }
      queryClient.invalidateQueries({ queryKey: ["pending-quest-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["my-quest-submissions"] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la validation");
      console.error(error);
    },
  });
};

export const useCreateVolunteerQuest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (questData: {
      title: string;
      description: string;
      category: string;
      priority: string;
      otk_reward: number;
      xp_reward: number;
      deadline?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("quests").insert({
        ...questData,
        created_by: user.id,
        is_active: true,
        status: "open",
        quest_type: "volunteer",
        validation_type: "MANUAL_ADMIN",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("🎯 Nouvelle quête créée !");
      queryClient.invalidateQueries({ queryKey: ["volunteer-quests"] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la création");
      console.error(error);
    },
  });
};
