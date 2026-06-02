import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GuildCategory {
  id: string;
  name: string;
  icon: string;
}

export interface Guild {
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
  updated_at: string;
  category?: GuildCategory;
  member_count?: number;
}

export interface GuildMember {
  id: string;
  guild_id: string;
  user_id: string;
  role: "master" | "officer" | "member";
  joined_at: string;
}

export function useGuildCategories() {
  return useQuery({
    queryKey: ["guild-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guild_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as GuildCategory[];
    },
  });
}

export function useGuilds(categoryId?: string, searchQuery?: string) {
  return useQuery({
    queryKey: ["guilds", categoryId, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("guilds")
        .select(`
          *,
          category:guild_categories(id, name, icon)
        `)
        .eq("status", "approved")
        .neq("access_type", "hidden")
        .order("created_at", { ascending: false });

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get member counts for each guild
      const guildsWithCounts = await Promise.all(
        (data || []).map(async (guild) => {
          const { count } = await supabase
            .from("guild_members")
            .select("*", { count: "exact", head: true })
            .eq("guild_id", guild.id);

          return {
            ...guild,
            member_count: count || 0,
          } as Guild;
        })
      );

      return guildsWithCounts;
    },
  });
}

export function useCreateGuild() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (guildData: {
      name: string;
      description?: string;
      category_id: string;
      access_type: "public" | "private";
      city?: string;
      bannerFile?: File;
    }) => {
      if (!user) throw new Error("Vous devez être connecté");

      let banner_url: string | null = null;

      // Upload banner if provided
      if (guildData.bannerFile) {
        const fileExt = guildData.bannerFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("guild-banners")
          .upload(fileName, guildData.bannerFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("guild-banners")
          .getPublicUrl(fileName);

        banner_url = urlData.publicUrl;
      }

      // Create the guild (status defaults to 'approved' in DB)
      const { data: guild, error: guildError } = await supabase
        .from("guilds")
        .insert({
          name: guildData.name,
          description: guildData.description || null,
          category_id: guildData.category_id,
          access_type: guildData.access_type,
          city: guildData.city?.trim() || null, // Empty string → null
          banner_url,
          created_by: user.id,
        })
        .select()
        .single();

      if (guildError) {
        console.error("Guild insert error:", guildError.message, guildError.details, guildError.hint);
        throw guildError;
      }

      // Add creator as guild master
      const { error: memberError } = await supabase
        .from("guild_members")
        .insert({
          guild_id: guild.id,
          user_id: user.id,
          role: "master",
        });

      if (memberError) {
        console.error("Guild member insert error:", memberError.message, memberError.details, memberError.hint);
        throw memberError;
      }

      return guild;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guilds"] });
      toast.success("Guilde créée avec succès !");
    },
    onError: (error: any) => {
      console.error("Error creating guild:", error?.message, error?.details, error?.hint, error);
      toast.error("Erreur lors de la création de la guilde");
    },
  });
}
