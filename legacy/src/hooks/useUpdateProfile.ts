import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Extended profile fields for Otaku profile
export interface OtakuProfileFields {
  favorite_character_image?: string | null;
  otaku_top3?: {
    masterclass: Array<{ id: string; title: string; image: string } | null>;
    enfers: Array<{ id: string; title: string; image: string } | null>;
  };
  otaku_stats?: {
    shonen: number;
    seinen: number;
    shojo: number;
    isekai: number;
    romance: number;
    horror: number;
  };
}
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface UpdateProfileData {
  display_name?: string;
  bio?: string;
  city?: string;
  avatar_url?: string;
  cover_image_url?: string;
  social_links?: Record<string, string>;
  privacy_settings?: Record<string, boolean>;
  // Gamer profile fields
  is_gamer_mode_active?: boolean;
  gaming_platforms?: string[];
  gamer_ids?: Record<string, string>;
  gamer_play_style?: string | null;
  // Other profile fields (for flexibility)
  [key: string]: unknown;
}

export const useUpdateProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      if (!user?.id) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("profiles")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate profile queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["public-profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useUploadProfileImage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      file, 
      type 
    }: { 
      file: File; 
      type: 'avatar' | 'cover' 
    }) => {
      if (!user?.id) throw new Error("Non authentifié");

      const bucket = type === 'avatar' ? 'avatars' : 'events';
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      // Update profile
      const updateField = type === 'avatar' ? 'avatar_url' : 'cover_image_url';
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          [updateField]: publicUrl, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      return { url: publicUrl, type };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["public-profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
