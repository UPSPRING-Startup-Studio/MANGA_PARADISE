import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFriendIds } from "@/hooks/useFriendships";
import { toast } from "sonner";

export interface NotifyNakamasParams {
  userId: string;
  userDisplayName: string;
  eventId: string;
  eventTitle: string;
  role: string;
}

// Hook to notify all friends about event participation
export const useNotifyNakamas = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, userDisplayName, eventId, eventTitle, role }: NotifyNakamasParams) => {
      // First, get all friend IDs
      const { data: friendships, error: friendshipError } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      if (friendshipError) throw friendshipError;

      // Extract friend IDs
      const friendIds = friendships?.map(f => 
        f.requester_id === userId ? f.addressee_id : f.requester_id
      ) || [];

      if (friendIds.length === 0) {
        return { notifiedCount: 0 };
      }

      // Format role for display
      const roleLabels: Record<string, string> = {
        visitor: "Visiteur",
        cosplayer: "Cosplayer",
        volunteer: "Bénévole",
        exhibitor: "Exposant",
      };
      const roleLabel = roleLabels[role] || role;

      // Create notifications for all friends
      const notifications = friendIds.map(friendId => ({
        user_id: friendId,
        sender_id: userId,
        type: "EVENT_PARTICIPATION",
        content: `${userDisplayName} participe à ${eventTitle} en tant que ${roleLabel}. Rejoins-le !`,
        related_link: `/evenements/${eventId}`,
        is_read: false,
      }));

      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (insertError) throw insertError;

      return { notifiedCount: friendIds.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      if (result.notifiedCount > 0) {
        toast.success(`${result.notifiedCount} nakama${result.notifiedCount > 1 ? 's' : ''} prévenu${result.notifiedCount > 1 ? 's' : ''} !`);
      }
    },
    onError: (error) => {
      console.error("Error notifying nakamas:", error);
      toast.error("Impossible de prévenir tes nakamas");
    },
  });
};
