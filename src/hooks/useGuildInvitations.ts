import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GuildInvitation {
  id: string;
  guild_id: string;
  user_id: string;
  invited_by: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  guild?: {
    id: string;
    name: string;
    banner_url: string | null;
    category?: {
      id: string;
      name: string;
      icon: string;
    };
  };
  inviter?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  invitee?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// Get pending invitations for the current user
export function useMyPendingInvitations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-guild-invitations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("guild_invitations")
        .select(`
          *,
          guild:guilds(id, name, banner_url, category:guild_categories(id, name, icon)),
          inviter:profiles!guild_invitations_invited_by_fkey(id, username, display_name, avatar_url)
        `)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GuildInvitation[];
    },
    enabled: !!user,
  });
}

// Get pending invitations sent by the guild (for admins)
export function useGuildPendingInvitations(guildId: string | undefined) {
  return useQuery({
    queryKey: ["guild-pending-invitations", guildId],
    queryFn: async () => {
      if (!guildId) return [];

      const { data, error } = await supabase
        .from("guild_invitations")
        .select(`
          *,
          invitee:profiles!guild_invitations_user_id_fkey(id, username, display_name, avatar_url),
          inviter:profiles!guild_invitations_invited_by_fkey(id, username, display_name, avatar_url)
        `)
        .eq("guild_id", guildId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GuildInvitation[];
    },
    enabled: !!guildId,
  });
}

// Send an invitation
export function useSendGuildInvitation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ guildId, userId }: { guildId: string; userId: string }) => {
      if (!user) throw new Error("Vous devez être connecté");

      const { error } = await supabase
        .from("guild_invitations")
        .insert({
          guild_id: guildId,
          user_id: userId,
          invited_by: user.id,
          status: "pending",
        });

      if (error) throw error;
    },
    onSuccess: (_, { guildId }) => {
      queryClient.invalidateQueries({ queryKey: ["guild-pending-invitations", guildId] });
      toast.success("Invitation envoyée !");
    },
    onError: (error: any) => {
      console.error("Error sending invitation:", error);
      if (error.message?.includes("duplicate")) {
        toast.error("Une invitation a déjà été envoyée à cet utilisateur");
      } else {
        toast.error("Erreur lors de l'envoi de l'invitation");
      }
    },
  });
}

// Accept an invitation
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ invitationId, guildId }: { invitationId: string; guildId: string }) => {
      if (!user) throw new Error("Vous devez être connecté");

      // Update invitation status
      const { error: updateError } = await supabase
        .from("guild_invitations")
        .update({ status: "accepted" })
        .eq("id", invitationId);

      if (updateError) throw updateError;

      // Add user as member
      const { error: memberError } = await supabase
        .from("guild_members")
        .insert({
          guild_id: guildId,
          user_id: user.id,
          role: "member",
        });

      if (memberError) throw memberError;
    },
    onSuccess: (_, { guildId }) => {
      queryClient.invalidateQueries({ queryKey: ["my-guild-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["guild", guildId] });
      queryClient.invalidateQueries({ queryKey: ["guild-members", guildId] });
      queryClient.invalidateQueries({ queryKey: ["guild-membership", guildId] });
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
      toast.success("Vous avez rejoint la guilde !");
    },
    onError: (error) => {
      console.error("Error accepting invitation:", error);
      toast.error("Erreur lors de l'acceptation de l'invitation");
    },
  });
}

// Reject an invitation
export function useRejectInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("guild_invitations")
        .update({ status: "rejected" })
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-guild-invitations"] });
      toast.success("Invitation refusée");
    },
    onError: (error) => {
      console.error("Error rejecting invitation:", error);
      toast.error("Erreur lors du refus de l'invitation");
    },
  });
}

// Cancel an invitation (for admins)
export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId, guildId }: { invitationId: string; guildId: string }) => {
      const { error } = await supabase
        .from("guild_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: (_, { guildId }) => {
      queryClient.invalidateQueries({ queryKey: ["guild-pending-invitations", guildId] });
      toast.success("Invitation annulée");
    },
    onError: (error) => {
      console.error("Error canceling invitation:", error);
      toast.error("Erreur lors de l'annulation de l'invitation");
    },
  });
}

// Search users for invitation (exclude current members)
export function useSearchUsersForInvite(guildId: string, searchQuery: string) {
  return useQuery({
    queryKey: ["search-users-for-invite", guildId, searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      // Get current members
      const { data: members } = await supabase
        .from("guild_members")
        .select("user_id")
        .eq("guild_id", guildId);

      const memberIds = members?.map(m => m.user_id) || [];

      // Get pending invitations
      const { data: invitations } = await supabase
        .from("guild_invitations")
        .select("user_id")
        .eq("guild_id", guildId)
        .eq("status", "pending");

      const invitedIds = invitations?.map(i => i.user_id) || [];
      const excludeIds = [...memberIds, ...invitedIds];

      // Search users
      let query = supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(10);

      if (excludeIds.length > 0) {
        query = query.not("id", "in", `(${excludeIds.join(",")})`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
    enabled: searchQuery.length >= 2,
  });
}
