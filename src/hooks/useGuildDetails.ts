import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GuildMember {
  id: string;
  guild_id: string;
  user_id: string;
  role: "master" | "officer" | "member";
  joined_at: string;
  profile?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface GuildWithDetails {
  id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  access_type: "public" | "private" | "hidden";
  city: string | null;
  category_id: string | null;
  created_by: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  goal?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  category?: {
    id: string;
    name: string;
    icon: string;
  };
  member_count?: number;
}

export function useGuildDetails(guildId: string | undefined) {
  return useQuery({
    queryKey: ["guild", guildId],
    queryFn: async () => {
      if (!guildId) return null;

      const { data, error } = await supabase
        .from("guilds")
        .select(`
          *,
          category:guild_categories(id, name, icon)
        `)
        .eq("id", guildId)
        .single();

      if (error) throw error;

      // Get member count
      const { count } = await supabase
        .from("guild_members")
        .select("*", { count: "exact", head: true })
        .eq("guild_id", guildId);

      return {
        ...data,
        member_count: count || 0,
      } as GuildWithDetails;
    },
    enabled: !!guildId,
  });
}

export function useGuildMembers(guildId: string | undefined) {
  return useQuery({
    queryKey: ["guild-members", guildId],
    queryFn: async () => {
      if (!guildId) return [];

      const { data, error } = await supabase
        .from("guild_members")
        .select(`
          *,
          profile:profiles(id, username, display_name, avatar_url)
        `)
        .eq("guild_id", guildId)
        .order("role", { ascending: true })
        .order("joined_at", { ascending: true });

      if (error) throw error;
      return data as GuildMember[];
    },
    enabled: !!guildId,
  });
}

export function useUserGuildMembership(guildId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["guild-membership", guildId, user?.id],
    queryFn: async () => {
      if (!guildId || !user) return null;

      const { data, error } = await supabase
        .from("guild_members")
        .select("*")
        .eq("guild_id", guildId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as GuildMember | null;
    },
    enabled: !!guildId && !!user,
  });
}

export function useJoinGuild() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (guildId: string) => {
      if (!user) throw new Error("Vous devez être connecté");

      const { error } = await supabase
        .from("guild_members")
        .insert({
          guild_id: guildId,
          user_id: user.id,
          role: "member",
        });

      if (error) throw error;
    },
    onSuccess: (_, guildId) => {
      queryClient.invalidateQueries({ queryKey: ["guild", guildId] });
      queryClient.invalidateQueries({ queryKey: ["guild-members", guildId] });
      queryClient.invalidateQueries({ queryKey: ["guild-membership", guildId] });
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
      toast.success("Vous avez rejoint la guilde !");
    },
    onError: (error) => {
      console.error("Error joining guild:", error);
      toast.error("Erreur lors de l'adhésion à la guilde");
    },
  });
}

export function useLeaveGuild() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (guildId: string) => {
      if (!user) throw new Error("Vous devez être connecté");

      const { error } = await supabase
        .from("guild_members")
        .delete()
        .eq("guild_id", guildId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: (_, guildId) => {
      queryClient.invalidateQueries({ queryKey: ["guild", guildId] });
      queryClient.invalidateQueries({ queryKey: ["guild-members", guildId] });
      queryClient.invalidateQueries({ queryKey: ["guild-membership", guildId] });
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
      toast.success("Vous avez quitté la guilde");
    },
    onError: (error) => {
      console.error("Error leaving guild:", error);
      toast.error("Erreur lors du départ de la guilde");
    },
  });
}

export function useUpdateGuild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      guildId, 
      data 
    }: { 
      guildId: string; 
      data: { 
        name?: string; 
        description?: string; 
        city?: string; 
        access_type?: "public" | "private"; 
        banner_url?: string;
        goal?: string;
        primary_color?: string;
        secondary_color?: string;
      }
    }) => {
      const { error } = await supabase
        .from("guilds")
        .update(data)
        .eq("id", guildId);

      if (error) throw error;
    },
    onSuccess: (_, { guildId }) => {
      queryClient.invalidateQueries({ queryKey: ["guild", guildId] });
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
      toast.success("Guilde mise à jour !");
    },
    onError: (error) => {
      console.error("Error updating guild:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });
}

export function useKickMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ guildId, memberId }: { guildId: string; memberId: string }) => {
      const { error } = await supabase
        .from("guild_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: (_, { guildId }) => {
      queryClient.invalidateQueries({ queryKey: ["guild", guildId] });
      queryClient.invalidateQueries({ queryKey: ["guild-members", guildId] });
      toast.success("Membre exclu de la guilde");
    },
    onError: (error) => {
      console.error("Error kicking member:", error);
      toast.error("Erreur lors de l'exclusion");
    },
  });
}

export function usePromoteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      memberId, 
      newRole 
    }: { 
      memberId: string; 
      newRole: "officer" | "member" 
    }) => {
      const { error } = await supabase
        .from("guild_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guild-members"] });
      toast.success("Rôle mis à jour !");
    },
    onError: (error) => {
      console.error("Error promoting member:", error);
      toast.error("Erreur lors de la promotion");
    },
  });
}

// Interface for public guild listing
export interface PublicGuild {
  id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  city: string | null;
  category_id: string | null;
  member_count: number;
  access_type: "public" | "private" | "hidden";
  category?: {
    id: string;
    name: string;
    icon: string;
  };
}

// Hook for fetching public guilds (approved, non-hidden)
export function usePublicGuilds(search: string = "", categoryId: string = "all") {
  return useQuery({
    queryKey: ["public-guilds", search, categoryId],
    queryFn: async () => {
      let query = supabase
        .from("guilds")
        .select(`
          *,
          category:guild_categories(id, name, icon)
        `)
        .eq("status", "approved")
        .neq("access_type", "hidden");

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      if (categoryId && categoryId !== "all") {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      // Get member count for each guild
      const guildsWithCounts = await Promise.all(
        (data || []).map(async (guild) => {
          const { count } = await supabase
            .from("guild_members")
            .select("*", { count: "exact", head: true })
            .eq("guild_id", guild.id);

          return {
            ...guild,
            member_count: count || 0,
          };
        })
      );

      return guildsWithCounts as PublicGuild[];
    },
  });
}

// Hook for fetching guilds where current user is a member
export function useMyGuilds() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-guilds", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get the guild IDs where user is a member
      const { data: memberships, error: membershipError } = await supabase
        .from("guild_members")
        .select("guild_id")
        .eq("user_id", user.id);

      if (membershipError) throw membershipError;
      if (!memberships || memberships.length === 0) return [];

      const guildIds = memberships.map((m) => m.guild_id);

      // Then fetch those guilds with category info
      const { data: guilds, error: guildsError } = await supabase
        .from("guilds")
        .select(`
          *,
          category:guild_categories(id, name, icon)
        `)
        .in("id", guildIds)
        .order("created_at", { ascending: false });

      if (guildsError) throw guildsError;

      // Get member count for each guild
      const guildsWithCounts = await Promise.all(
        (guilds || []).map(async (guild) => {
          const { count } = await supabase
            .from("guild_members")
            .select("*", { count: "exact", head: true })
            .eq("guild_id", guild.id);

          return {
            ...guild,
            member_count: count || 0,
          };
        })
      );

      return guildsWithCounts as PublicGuild[];
    },
    enabled: !!user,
  });
}
