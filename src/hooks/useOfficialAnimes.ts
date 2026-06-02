import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OfficialAnime {
  id: string;
  title: string;
  cover_url: string;
  studio?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const useOfficialAnimes = () => {
  const queryClient = useQueryClient();

  // Fetch all official animes
  const { data: animes = [], isLoading } = useQuery({
    queryKey: ["official-animes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("official_animes")
        .select("*")
        .order("title", { ascending: true });

      if (error) throw error;
      return data as OfficialAnime[];
    },
  });

  // Search animes by title
  const searchAnimes = useCallback(
    (searchTerm: string): OfficialAnime[] => {
      if (!searchTerm.trim()) return animes.slice(0, 12);
      const term = searchTerm.toLowerCase();
      return animes.filter((a) =>
        a.title.toLowerCase().includes(term)
      ).slice(0, 20);
    },
    [animes]
  );

  // Create a new anime (admin only)
  const createAnimeMutation = useMutation({
    mutationFn: async ({
      title,
      coverFile,
      studio,
    }: {
      title: string;
      coverFile: File;
      studio?: string;
    }) => {
      // Upload cover image
      const fileExt = coverFile.name.split(".").pop();
      const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("official-anime-covers")
        .upload(fileName, coverFile, { upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("official-anime-covers")
        .getPublicUrl(fileName);

      // Insert anime into database
      const { data, error: insertError } = await supabase
        .from("official_animes")
        .insert({
          title,
          cover_url: urlData.publicUrl,
          studio: studio || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data as OfficialAnime;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["official-animes"] });
    },
  });

  // Update anime (admin only)
  const updateAnimeMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      studio,
      coverFile,
    }: {
      id: string;
      title: string;
      studio?: string;
      coverFile?: File;
    }) => {
      let cover_url: string | undefined;

      if (coverFile) {
        const fileExt = coverFile.name.split(".").pop();
        const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("official-anime-covers")
          .upload(fileName, coverFile, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("official-anime-covers")
          .getPublicUrl(fileName);
        
        cover_url = urlData.publicUrl;
      }

      const updateData: Partial<OfficialAnime> = {
        title,
        studio: studio || null,
      };
      if (cover_url) updateData.cover_url = cover_url;

      const { error } = await supabase
        .from("official_animes")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["official-animes"] });
      toast.success("Anime mis à jour !");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  // Delete anime (admin only)
  const deleteAnimeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("official_animes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["official-animes"] });
      toast.success("Anime supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  return {
    animes,
    isLoading,
    searchAnimes,
    createAnime: createAnimeMutation.mutateAsync,
    updateAnime: updateAnimeMutation.mutateAsync,
    deleteAnime: deleteAnimeMutation.mutate,
    isCreating: createAnimeMutation.isPending,
    isUpdating: updateAnimeMutation.isPending,
    isDeleting: deleteAnimeMutation.isPending,
  };
};
