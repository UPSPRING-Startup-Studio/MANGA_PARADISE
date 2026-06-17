import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Fetch user's QR token
export const useUserQrToken = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["qr-token", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("qr_code_token")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data?.qr_code_token as string;
    },
    enabled: !!userId,
  });
};

// Fetch profile by QR token
export const useProfileByQrToken = (token: string | null) => {
  return useQuery({
    queryKey: ["profile-by-qr", token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, bio, otaku_class, level, city")
        .eq("qr_code_token", token)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });
};

// Get friendship status between two users
export const useFriendshipStatus = (userId1: string | undefined, userId2: string | undefined) => {
  return useQuery({
    queryKey: ["friendship-status", userId1, userId2],
    queryFn: async () => {
      if (!userId1 || !userId2 || userId1 === userId2) return null;

      const { data, error } = await supabase
        .from("friendships")
        .select("id, status, requester_id, addressee_id")
        .or(
          `and(requester_id.eq.${userId1},addressee_id.eq.${userId2}),and(requester_id.eq.${userId2},addressee_id.eq.${userId1})`
        )
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId1 && !!userId2 && userId1 !== userId2,
  });
};

// Send friend request with meeting context
export const useSendFriendRequestWithContext = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      requesterId, 
      addresseeId, 
      meetingEventId, 
      meetingContext 
    }: { 
      requesterId: string; 
      addresseeId: string;
      meetingEventId?: string | null;
      meetingContext?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("friendships")
        .insert({
          requester_id: requesterId,
          addressee_id: addresseeId,
          status: "pending",
          meeting_event_id: meetingEventId || null,
          meeting_context: meetingContext || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendship-status"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests", variables.addresseeId] });
      toast.success("Demande de Nakama envoyée !");
    },
    onError: (error: any) => {
      console.error("Error sending friend request:", error);
      if (error.code === '23505') {
        toast.error("Vous avez déjà envoyé une demande à cette personne");
      } else {
        toast.error("Erreur lors de l'envoi de la demande");
      }
    },
  });
};

// Get friend's event registrations (agenda)
export const useFriendAgenda = (friendId: string | undefined, isFriend: boolean) => {
  return useQuery({
    queryKey: ["friend-agenda", friendId],
    queryFn: async () => {
      if (!friendId) return [];

      console.log("🔍 DEBUG FRIEND AGENDA - Fetching for friend:", friendId);
      
      // REMOVED DATE FILTER - Get ALL registrations regardless of event date
      const { data, error } = await supabase
        .from("event_participants")
        .select(`
          id,
          role,
          registered_at,
          planned_cosplay_id,
          event:events (
            id,
            title,
            date,
            end_date,
            city,
            image_url,
            category
          )
        `)
        .eq("user_id", friendId)
        .order("registered_at", { ascending: false });

      if (error) {
        console.error("❌ DEBUG FRIEND AGENDA - Error:", error);
        throw error;
      }
      
      console.log("✅ DEBUG FRIEND AGENDA - Data received:", data?.length || 0, "registrations");
      
      // Filter out null events (in case event was deleted)
      return (data || []).filter(p => p.event !== null);
    },
    enabled: !!friendId && isFriend,
    staleTime: 0,
    refetchOnMount: "always",
  });
};

// Check if current user is also registered to an event
export const useMyEventRegistrations = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["my-event-registrations", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("event_participants")
        .select("event_id")
        .eq("user_id", userId);

      if (error) throw error;
      return data.map(p => p.event_id);
    },
    enabled: !!userId,
  });
};

// Get current/upcoming events for meeting context selector
export const useCurrentEvents = () => {
  return useQuery({
    queryKey: ["current-events-for-meeting"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date")
        .gte("date", today)
        .lte("date", weekFromNow)
        .order("date", { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });
};

// Extended friendship with meeting context
export interface FriendshipWithContext {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  meeting_event_id: string | null;
  meeting_context: string | null;
  meeting_event?: {
    id: string;
    title: string;
  } | null;
  friend: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

// Get friends list with meeting context
export const useFriendsWithContext = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["friends-with-context", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("friendships")
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at,
          meeting_event_id,
          meeting_context,
          meeting_event:events!friendships_meeting_event_id_fkey (id, title),
          requester:profiles!friendships_requester_id_fkey (id, display_name, username, avatar_url),
          addressee:profiles!friendships_addressee_id_fkey (id, display_name, username, avatar_url)
        `)
        .eq("status", "accepted")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      if (error) throw error;
      
      // Transform to get the friend (the other person)
      return (data || []).map(f => ({
        ...f,
        friend: f.requester_id === userId ? f.addressee : f.requester,
      })) as unknown as FriendshipWithContext[];
    },
    enabled: !!userId,
  });
};
