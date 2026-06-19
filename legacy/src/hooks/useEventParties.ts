import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PartyMode = 'squad' | 'shooting' | 'concours';
export type PartyVisibility = 'public' | 'private';

export interface PartySlot {
  index: number;
  label: string;
  character_name?: string;
  filled_by?: string;
}

export interface EventParty {
  id: string;
  event_id: string;
  creator_id: string;
  name: string;
  description: string | null;
  mode: PartyMode;
  visibility: PartyVisibility;
  tags: string[];
  max_members: number | null;
  slots: PartySlot[];
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  creator_event_role?: string;
  members?: PartyMember[];
  member_count?: number;
}

export interface PartyMember {
  id: string;
  party_id: string;
  user_id: string;
  slot_index: number | null;
  role: 'leader' | 'member';
  status: 'pending' | 'approved';
  joined_at: string;
  user?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface CreatePartyData {
  event_id: string;
  name: string;
  description?: string | null;
  mode: PartyMode;
  visibility: PartyVisibility;
  tags?: string[] | null;
  max_members?: number | null;
  slots?: PartySlot[] | null;
}

// Fetch parties for an event (respects RLS - public + user's private)
export const useEventParties = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["event-parties", eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from("event_parties")
        .select(`
          *,
          creator:creator_id (id, display_name, username, avatar_url)
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // For each party, fetch member count and creator's event role
      const partiesWithCounts = await Promise.all(
        (data || []).map(async (party) => {
          // Fetch member count
          const { count } = await supabase
            .from("event_party_members")
            .select("*", { count: "exact", head: true })
            .eq("party_id", party.id);

          // Fetch creator's registration role for this event
          const { data: registration } = await supabase
            .from("event_participants")
            .select("role")
            .eq("event_id", eventId)
            .eq("user_id", party.creator_id)
            .maybeSingle();

          return {
            ...party,
            slots: (party.slots as unknown as PartySlot[]) || [],
            member_count: count || 0,
            creator_event_role: registration?.role || 'visitor',
          } as EventParty;
        })
      );

      return partiesWithCounts;
    },
    enabled: !!eventId,
  });
};

// Fetch a single party with members
export const useEventParty = (partyId: string | undefined) => {
  return useQuery({
    queryKey: ["event-party", partyId],
    queryFn: async () => {
      if (!partyId) return null;

      const { data: party, error: partyError } = await supabase
        .from("event_parties")
        .select(`
          *,
          creator:creator_id (id, display_name, username, avatar_url)
        `)
        .eq("id", partyId)
        .single();

      if (partyError) throw partyError;

      const { data: members, error: membersError } = await supabase
        .from("event_party_members")
        .select(`
          *,
          user:user_id (id, display_name, username, avatar_url)
        `)
        .eq("party_id", partyId)
        .order("joined_at", { ascending: true });

      if (membersError) throw membersError;

      return {
        ...party,
        slots: (party.slots as unknown as PartySlot[]) || [],
        members: members as PartyMember[],
        member_count: members?.length || 0,
      } as EventParty;
    },
    enabled: !!partyId,
  });
};

// Check if user is member of a party
export const useIsPartyMember = (partyId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ["party-membership", partyId, userId],
    queryFn: async () => {
      if (!partyId || !userId) return null;

      const { data, error } = await supabase
        .from("event_party_members")
        .select("*")
        .eq("party_id", partyId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as PartyMember | null;
    },
    enabled: !!partyId && !!userId,
  });
};

// Create a new party
export const useCreateParty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePartyData & { creator_id: string }) => {
      // Ensure all optional fields are properly formatted for Supabase
      // tags must be text[], slots must be jsonb
      // Preserve ALL metadata for display (image, universe, id)
      // TypeScript may complain about extended types, so we force typing if needed
      const slotsValue = (data.slots || []).map(slot => {
        // Get extended properties even if they're not in the base interface
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const extendedSlot = slot as any;
        return {
          index: slot.index,
          label: slot.label,
          filled_by: null, // Always null at creation
          // Critical data for PartyCard display:
          character_name: slot.character_name || extendedSlot.character_name || null,
          character_id: extendedSlot.character_id || null,
          image_url: extendedSlot.image_url || null,
          universe_name: extendedSlot.universe_name || null,
        };
      });
      
      const insertData = {
        event_id: data.event_id,
        creator_id: data.creator_id,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        mode: data.mode,
        visibility: data.visibility,
        tags: Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : [],
        max_members: typeof data.max_members === 'number' && data.max_members > 0 ? data.max_members : null,
        slots: slotsValue as unknown as import("@/integrations/supabase/types").Json,
      };

      console.log("[useCreateParty] Payload sent:", JSON.stringify(insertData, null, 2));

      const { data: party, error } = await supabase
        .from("event_parties")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("[useCreateParty] Supabase error:", error.message, error.details, error.hint);
        throw error;
      }

      // Auto-join creator as leader
      const { error: memberError } = await supabase
        .from("event_party_members")
        .insert({
          party_id: party.id,
          user_id: data.creator_id,
          role: "leader",
        });

      if (memberError) {
        console.error("Error adding creator as leader:", memberError);
        throw memberError;
      }

      return party;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-parties", variables.event_id] });
      toast.success("Groupe créé avec succès !");
    },
    onError: (error: Error) => {
      console.error("Error creating party:", error);
      // Show the actual technical message (e.g., "RLS violation" or "Invalid type")
      toast.error(`Erreur: ${error.message || "Impossible de créer le groupe"}`);
    },
  });
};

// Update a party
export const useUpdateParty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      partyId, 
      ...data 
    }: Partial<CreatePartyData> & { partyId: string }) => {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.mode !== undefined) updateData.mode = data.mode;
      if (data.visibility !== undefined) updateData.visibility = data.visibility;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.max_members !== undefined) updateData.max_members = data.max_members;
      if (data.slots !== undefined) updateData.slots = data.slots;

      const { data: party, error } = await supabase
        .from("event_parties")
        .update(updateData)
        .eq("id", partyId)
        .select()
        .single();

      if (error) throw error;
      return party;
    },
    onSuccess: (party) => {
      queryClient.invalidateQueries({ queryKey: ["event-parties", party.event_id] });
      queryClient.invalidateQueries({ queryKey: ["event-party", party.id] });
      toast.success("Groupe mis à jour !");
    },
    onError: (error) => {
      console.error("Error updating party:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });
};

// Delete a party
export const useDeleteParty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partyId, eventId }: { partyId: string; eventId: string }) => {
      const { error } = await supabase
        .from("event_parties")
        .delete()
        .eq("id", partyId);

      if (error) throw error;
      return { partyId, eventId };
    },
    onSuccess: ({ eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["event-parties", eventId] });
      toast.success("Groupe supprimé");
    },
    onError: (error) => {
      console.error("Error deleting party:", error);
      toast.error("Erreur lors de la suppression");
    },
  });
};

// Join a party (or request to join - status will be 'pending' for public parties)
export const useJoinParty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      partyId, 
      userId,
      slotIndex,
      status = 'pending' // Default to pending for join requests
    }: { 
      partyId: string; 
      userId: string;
      slotIndex?: number;
      status?: 'pending' | 'approved';
    }) => {
      const { data, error } = await supabase
        .from("event_party_members")
        .insert({
          party_id: partyId,
          user_id: userId,
          slot_index: slotIndex ?? null,
          role: "member",
          status,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, { partyId }) => {
      queryClient.invalidateQueries({ queryKey: ["event-party", partyId] });
      queryClient.invalidateQueries({ queryKey: ["event-parties"] });
      queryClient.invalidateQueries({ queryKey: ["party-membership", partyId] });
      queryClient.invalidateQueries({ queryKey: ["party-pending-requests", partyId] });
      if (data.status === 'pending') {
        toast.success("Demande envoyée ! En attente de validation.");
      } else {
        toast.success("Tu as rejoint le groupe !");
      }
    },
    onError: (error) => {
      console.error("Error joining party:", error);
      toast.error("Erreur lors de l'inscription au groupe");
    },
  });
};

// Get pending join requests for a party (for leader admin)
export const usePendingJoinRequests = (partyId: string | undefined) => {
  return useQuery({
    queryKey: ["party-pending-requests", partyId],
    queryFn: async () => {
      if (!partyId) return [];

      const { data, error } = await supabase
        .from("event_party_members")
        .select(`
          *,
          user:user_id (id, display_name, username, avatar_url)
        `)
        .eq("party_id", partyId)
        .eq("status", "pending")
        .order("joined_at", { ascending: true });

      if (error) throw error;
      return data as PartyMember[];
    },
    enabled: !!partyId,
  });
};

// Approve a join request
export const useApproveJoinRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, partyId }: { memberId: string; partyId: string }) => {
      const { error } = await supabase
        .from("event_party_members")
        .update({ status: 'approved' })
        .eq("id", memberId);

      if (error) throw error;
      return { memberId, partyId };
    },
    onSuccess: ({ partyId }) => {
      queryClient.invalidateQueries({ queryKey: ["event-party", partyId] });
      queryClient.invalidateQueries({ queryKey: ["party-pending-requests", partyId] });
      queryClient.invalidateQueries({ queryKey: ["event-parties"] });
      toast.success("Membre approuvé !");
    },
    onError: (error) => {
      console.error("Error approving member:", error);
      toast.error("Erreur lors de l'approbation");
    },
  });
};

// Reject a join request (delete the pending member)
export const useRejectJoinRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, partyId }: { memberId: string; partyId: string }) => {
      const { error } = await supabase
        .from("event_party_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      return { memberId, partyId };
    },
    onSuccess: ({ partyId }) => {
      queryClient.invalidateQueries({ queryKey: ["event-party", partyId] });
      queryClient.invalidateQueries({ queryKey: ["party-pending-requests", partyId] });
      toast.success("Demande refusée");
    },
    onError: (error) => {
      console.error("Error rejecting member:", error);
      toast.error("Erreur lors du refus");
    },
  });
};

// Kick a member from the party
export const useKickMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, partyId }: { memberId: string; partyId: string }) => {
      const { error } = await supabase
        .from("event_party_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      return { memberId, partyId };
    },
    onSuccess: ({ partyId }) => {
      queryClient.invalidateQueries({ queryKey: ["event-party", partyId] });
      queryClient.invalidateQueries({ queryKey: ["event-parties"] });
      toast.success("Membre exclu du groupe");
    },
    onError: (error) => {
      console.error("Error kicking member:", error);
      toast.error("Erreur lors de l'exclusion");
    },
  });
};

// Check if user has a pending request for a party
export const useHasPendingRequest = (partyId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ["party-pending-request", partyId, userId],
    queryFn: async () => {
      if (!partyId || !userId) return false;

      const { data, error } = await supabase
        .from("event_party_members")
        .select("id, status")
        .eq("party_id", partyId)
        .eq("user_id", userId)
        .eq("status", "pending")
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!partyId && !!userId,
  });
};

// Leave a party
export const useLeaveParty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partyId, userId }: { partyId: string; userId: string }) => {
      const { error } = await supabase
        .from("event_party_members")
        .delete()
        .eq("party_id", partyId)
        .eq("user_id", userId);

      if (error) throw error;
      return { partyId, userId };
    },
    onSuccess: ({ partyId }) => {
      queryClient.invalidateQueries({ queryKey: ["event-party", partyId] });
      queryClient.invalidateQueries({ queryKey: ["event-parties"] });
      queryClient.invalidateQueries({ queryKey: ["party-membership", partyId] });
      toast.success("Tu as quitté le groupe");
    },
    onError: (error) => {
      console.error("Error leaving party:", error);
      toast.error("Erreur lors de la sortie du groupe");
    },
  });
};
