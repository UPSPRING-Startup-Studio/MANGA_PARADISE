import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface PartyInvitation {
  id: string;
  party_id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  // Joined data
  party?: {
    id: string;
    name: string;
    mode: string;
    event_id: string;
    creator_id: string;
  };
  sender?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  receiver?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// Fetch pending invitations for the current user (as receiver)
export function usePendingInvitations(userId: string | undefined) {
  return useQuery({
    queryKey: ['party-invitations', 'pending', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('party_invitations')
        .select(`
          *,
          party:event_parties(id, name, mode, event_id, creator_id),
          sender:profiles!party_invitations_sender_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as PartyInvitation[];
    },
    enabled: !!userId,
  });
}

// Fetch invitations sent by the current user for a specific party
export function usePartyInvitations(partyId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['party-invitations', 'sent', partyId, userId],
    queryFn: async () => {
      if (!partyId || !userId) return [];
      
      const { data, error } = await supabase
        .from('party_invitations')
        .select(`
          *,
          receiver:profiles!party_invitations_receiver_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('party_id', partyId)
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as PartyInvitation[];
    },
    enabled: !!partyId && !!userId,
  });
}

// Send an invitation
export function useSendInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ partyId, senderId, receiverId }: {
      partyId: string;
      senderId: string;
      receiverId: string;
    }) => {
      const { data, error } = await supabase
        .from('party_invitations')
        .insert({
          party_id: partyId,
          sender_id: senderId,
          receiver_id: receiverId,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['party-invitations'] });
      toast({
        title: "Invitation envoyée !",
        description: "L'utilisateur recevra une notification.",
      });
    },
    onError: (error: Error) => {
      console.error("Error sending invitation:", error);
      if (error.message.includes('duplicate')) {
        toast({
          title: "Déjà invité",
          description: "Cet utilisateur a déjà été invité à ce groupe.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: error.message || "Impossible d'envoyer l'invitation.",
          variant: "destructive",
        });
      }
    },
  });
}

// Accept an invitation
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ invitationId, partyId, userId }: {
      invitationId: string;
      partyId: string;
      userId: string;
    }) => {
      // First, update the invitation status
      const { error: updateError } = await supabase
        .from('party_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);
      
      if (updateError) throw updateError;
      
      // Then, add the user to the party
      const { error: joinError } = await supabase
        .from('event_party_members')
        .insert({
          party_id: partyId,
          user_id: userId,
          role: 'member'
        });
      
      if (joinError) throw joinError;
      
      return { invitationId, partyId, userId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['event-parties'] });
      queryClient.invalidateQueries({ queryKey: ['event-party'] });
      toast({
        title: "Invitation acceptée !",
        description: "Tu as rejoint le groupe.",
      });
    },
    onError: (error: Error) => {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'accepter l'invitation.",
        variant: "destructive",
      });
    },
  });
}

// Reject an invitation
export function useRejectInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ invitationId }: { invitationId: string }) => {
      const { error } = await supabase
        .from('party_invitations')
        .update({ status: 'rejected' })
        .eq('id', invitationId);
      
      if (error) throw error;
      return { invitationId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party-invitations'] });
      toast({
        title: "Invitation refusée",
      });
    },
    onError: (error: Error) => {
      console.error("Error rejecting invitation:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de refuser l'invitation.",
        variant: "destructive",
      });
    },
  });
}

// Search users by username/display_name for invitation
export function useSearchUsers(query: string, excludeIds: string[] = []) {
  return useQuery({
    queryKey: ['search-users', query, excludeIds],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: query.length >= 2,
  });
}
