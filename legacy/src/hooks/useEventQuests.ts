import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface EventQuest {
  id: string;
  quest_id: string;
  event_id: string;
  is_active: boolean;
  quest: {
    id: string;
    title: string;
    description: string | null;
    xp_reward: number | null;
    otk_reward: number | null;
    quest_type: string | null;
    validation_type: string | null;
    icon: string | null;
    class_requirement: string | null;
    target_count: number | null;
  };
}

export interface UserQuestProgress {
  id: string;
  user_id: string;
  quest_id: string;
  event_id: string | null;
  status: string;
  proof_url: string | null;
  progress: number | null;
  completed_at: string | null;
}

export interface QuestWithProgress extends EventQuest {
  userProgress: UserQuestProgress | null;
  isLocked: boolean;
  lockReason?: string;
}

export const useEventQuests = (eventId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["event-quests", eventId, user?.id],
    queryFn: async (): Promise<QuestWithProgress[]> => {
      if (!eventId) return [];

      // Fetch event quests with quest details
      const { data: eventQuests, error: eqError } = await supabase
        .from("event_quests")
        .select(`
          id,
          quest_id,
          event_id,
          is_active,
          quest:quests (
            id,
            title,
            description,
            xp_reward,
            otk_reward,
            quest_type,
            validation_type,
            icon,
            class_requirement,
            target_count
          )
        `)
        .eq("event_id", eventId)
        .eq("is_active", true);

      if (eqError) return [];

      // Cast the result to handle the nested quest object
      const questsWithDetails = (eventQuests || []).map((eq: any) => ({
        id: eq.id,
        quest_id: eq.quest_id,
        event_id: eq.event_id,
        is_active: eq.is_active,
        quest: eq.quest,
      })) as EventQuest[];

      if (!user) {
        // Return quests without progress for non-logged in users
        return questsWithDetails.map((eq) => ({
          ...eq,
          userProgress: null,
          isLocked: true,
          lockReason: "Connecte-toi pour débloquer les quêtes",
        }));
      }

      // Fetch user's progress
      const { data: userProgress, error: upError } = await supabase
        .from("user_quests")
        .select("*")
        .eq("user_id", user.id)
        .eq("event_id", eventId);

      if (upError) {
        console.error("Error fetching user progress:", upError);
      }

      // Fetch user's class for class requirements
      const { data: profile } = await supabase
        .from("profiles")
        .select("otaku_class, membership_status")
        .eq("id", user.id)
        .maybeSingle();

      // Check if user is registered to the event
      const { data: registration } = await supabase
        .from("event_participants")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();

      const isRegistered = !!registration;

      // Map quests with progress and lock status
      return questsWithDetails.map((eq) => {
        const progress = (userProgress || []).find(
          (up: any) => up.quest_id === eq.quest_id
        ) as UserQuestProgress | undefined;

        let isLocked = false;
        let lockReason = "";

        // Check if user is registered
        if (!isRegistered) {
          isLocked = true;
          lockReason = "Inscris-toi à l'événement pour débloquer";
        }
        
        // Check class requirement
        else if (
          eq.quest.class_requirement && 
          eq.quest.class_requirement !== "ALL" &&
          profile?.otaku_class?.toUpperCase() !== eq.quest.class_requirement
        ) {
          isLocked = true;
          lockReason = `Réservé à la classe ${eq.quest.class_requirement}`;
        }

        // Check membership status
        else if (profile?.membership_status !== "active") {
          isLocked = true;
          lockReason = "Ton compte doit être actif";
        }

        return {
          ...eq,
          userProgress: progress || null,
          isLocked,
          lockReason,
        };
      });
    },
    enabled: !!eventId,
  });
};

interface CompleteQuestResult {
  success: boolean;
  xp_earned?: number;
  otk_earned?: number;
  quest_title?: string;
  error?: string;
}

export const useCompleteQuest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      questId,
      eventId,
      proofUrl,
    }: {
      questId: string;
      eventId: string;
      proofUrl?: string;
    }): Promise<CompleteQuestResult> => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("complete_quest", {
        _user_id: user.id,
        _quest_id: questId,
        _event_id: eventId,
        _proof_url: proofUrl || null,
      });

      if (error) throw error;
      return data as unknown as CompleteQuestResult;
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success(`🎉 Quête validée : ${data.quest_title}`);
        if (data.xp_earned) {
          toast.info(`+${data.xp_earned} XP gagnés !`);
        }
        if (data.otk_earned) {
          toast.info(`+${data.otk_earned} OTK Coins !`);
        }
      } else {
        toast.error(data.error || "Impossible de valider la quête");
      }
      
      queryClient.invalidateQueries({ queryKey: ["event-quests", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      console.error("Quest completion error:", error);
      toast.error("Erreur lors de la validation de la quête");
    },
  });
};

export const useStartQuest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      questId,
      eventId,
    }: {
      questId: string;
      eventId: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("user_quests").upsert(
        {
          user_id: user.id,
          quest_id: questId,
          event_id: eventId,
          status: "in_progress",
          progress: 0,
        },
        { onConflict: "user_id,quest_id" }
      );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success("Quête démarrée !");
      queryClient.invalidateQueries({ queryKey: ["event-quests", variables.eventId] });
    },
    onError: (error) => {
      console.error("Start quest error:", error);
      toast.error("Erreur lors du démarrage de la quête");
    },
  });
};
