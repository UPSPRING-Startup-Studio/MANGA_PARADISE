import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Friendship } from "./useFriendships";

// Fetch sent friend requests (pending)
export const useSentFriendRequests = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["sent-friend-requests", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Step 1: get pending friendships sent by user (no nested JOIN)
      const { data: sentFriendships, error } = await supabase
        .from("friendships")
        .select("id, requester_id, addressee_id, status, created_at, updated_at")
        .eq("requester_id", userId)
        .eq("status", "pending");

      if (error) throw error;
      if (!sentFriendships || sentFriendships.length === 0) return [];

      // Step 2: fetch addressee profiles
      const addresseeIds = sentFriendships.map(f => f.addressee_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", addresseeIds);

      if (profilesError) throw profilesError;
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return sentFriendships.map(f => ({
        ...f,
        requester: null,
        addressee: profileMap.get(f.addressee_id) ?? null,
      })) as unknown as Friendship[];
    },
    enabled: !!userId,
  });
};

// Cancel a sent friend request
export const useCancelFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ friendshipId, userId }: { friendshipId: string; userId: string }) => {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;
      return { friendshipId, userId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sent-friend-requests", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["friendship-status"] });
      toast.success("Demande annulée");
    },
    onError: (error) => {
      console.error("Error cancelling friend request:", error);
      toast.error("Erreur lors de l'annulation");
    },
  });
};

// Get friendship status between current user and target user
export const useFriendshipStatus = (currentUserId: string | undefined, targetUserId: string | undefined) => {
  return useQuery({
    queryKey: ["friendship-status", currentUserId, targetUserId],
    queryFn: async () => {
      if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
        return { status: "self" as const, friendship: null };
      }

      // Check for any existing friendship
      const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .or(
          `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
        )
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return { status: "none" as const, friendship: null };
      }

      if (data.status === "accepted") {
        return { status: "friends" as const, friendship: data };
      }

      // It's pending
      if (data.requester_id === currentUserId) {
        return { status: "pending_sent" as const, friendship: data };
      } else {
        return { status: "pending_received" as const, friendship: data };
      }
    },
    enabled: !!currentUserId && !!targetUserId,
  });
};

// Count pending friend requests for current user (for badge)
export const usePendingFriendRequestsCount = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["pending-friend-requests-count", userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .eq("addressee_id", userId)
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });
};
