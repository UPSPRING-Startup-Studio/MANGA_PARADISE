import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  requester?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  addressee?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

// Fetch user's friends (accepted friendships)
export const useFriends = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["friends", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Step 1: get accepted friendships (no nested JOIN, no extra columns — avoids PostgREST schema cache issues)
      const { data: friendships, error } = await supabase
        .from("friendships")
        .select("id, requester_id, addressee_id, status, created_at, updated_at")
        .eq("status", "accepted")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      if (error) throw error;
      if (!friendships || friendships.length === 0) return [];

      // Step 2: collect friend profile IDs (the other person in each friendship)
      const friendIds = friendships.map(f =>
        f.requester_id === userId ? f.addressee_id : f.requester_id
      );

      // Step 3: fetch friend profiles in one query
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", friendIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Step 4: attach the friend's profile to the correct side
      return friendships.map(f => {
        const friendId = f.requester_id === userId ? f.addressee_id : f.requester_id;
        const friendProfile = profileMap.get(friendId) ?? null;
        return {
          ...f,
          requester: f.requester_id !== userId ? friendProfile : null,
          addressee: f.addressee_id !== userId ? friendProfile : null,
        };
      }) as unknown as Friendship[];
    },
    enabled: !!userId,
  });
};

// Fetch pending friend requests (received)
export const usePendingFriendRequests = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["friend-requests", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Step 1: get pending friendships (no nested JOIN)
      const { data: pendingFriendships, error } = await supabase
        .from("friendships")
        .select("id, requester_id, addressee_id, status, created_at, updated_at")
        .eq("addressee_id", userId)
        .eq("status", "pending");

      if (error) throw error;
      if (!pendingFriendships || pendingFriendships.length === 0) return [];

      // Step 2: fetch requester profiles
      const requesterIds = pendingFriendships.map(f => f.requester_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", requesterIds);

      if (profilesError) throw profilesError;
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return pendingFriendships.map(f => ({
        ...f,
        requester: profileMap.get(f.requester_id) ?? null,
        addressee: null,
      })) as unknown as Friendship[];
    },
    enabled: !!userId,
  });
};

// Check if two users are friends
export const useAreFriends = (userId1: string | undefined, userId2: string | undefined) => {
  return useQuery({
    queryKey: ["are-friends", userId1, userId2],
    queryFn: async () => {
      if (!userId1 || !userId2) return false;

      const { data, error } = await supabase
        .from("friendships")
        .select("id")
        .eq("status", "accepted")
        .or(
          `and(requester_id.eq.${userId1},addressee_id.eq.${userId2}),and(requester_id.eq.${userId2},addressee_id.eq.${userId1})`
        )
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!userId1 && !!userId2,
  });
};

// Get friend IDs for current user
export const useFriendIds = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["friend-ids", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      if (error) throw error;
      
      // Extract friend IDs (the other person in each friendship)
      return data.map(f => f.requester_id === userId ? f.addressee_id : f.requester_id);
    },
    enabled: !!userId,
  });
};

// Send friend request
export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requesterId, addresseeId }: { requesterId: string; addresseeId: string }) => {
      const { data, error } = await supabase
        .from("friendships")
        .insert({
          requester_id: requesterId,
          addressee_id: addresseeId,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["friends", variables.requesterId] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests", variables.addresseeId] });
      toast.success("Demande de Nakama envoyée !");
    },
    onError: (error) => {
      console.error("Error sending friend request:", error);
      toast.error("Erreur lors de l'envoi de la demande");
    },
  });
};

// Accept friend request
export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ friendshipId, userId }: { friendshipId: string; userId: string }) => {
      const { data, error } = await supabase
        .from("friendships")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", friendshipId)
        .select()
        .single();

      if (error) throw error;
      return { data, userId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests", result.userId] });
      queryClient.invalidateQueries({ queryKey: ["friend-ids"] });
      toast.success("Nouveau Nakama ajouté !");
    },
    onError: (error) => {
      console.error("Error accepting friend request:", error);
      toast.error("Erreur lors de l'acceptation");
    },
  });
};

// Reject friend request
export const useRejectFriendRequest = () => {
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
      queryClient.invalidateQueries({ queryKey: ["friend-requests", variables.userId] });
      toast.success("Demande refusée");
    },
    onError: (error) => {
      console.error("Error rejecting friend request:", error);
      toast.error("Erreur lors du refus");
    },
  });
};
