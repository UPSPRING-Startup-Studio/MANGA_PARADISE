import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OfficialManga {
  id: string;
  title: string;
  cover_url: string;
  author?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const useOfficialMangas = () => {
  const queryClient = useQueryClient();

  // Fetch all official mangas
  const { data: mangas = [], isLoading } = useQuery({
    queryKey: ["official-mangas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("official_mangas")
        .select("*")
        .order("title", { ascending: true });

      if (error) throw error;
      return data as OfficialManga[];
    },
  });

  // Search mangas by title
  const searchMangas = useCallback(
    (searchTerm: string): OfficialManga[] => {
      if (!searchTerm.trim()) return mangas.slice(0, 12);
      const term = searchTerm.toLowerCase();
      return mangas.filter((m) =>
        m.title.toLowerCase().includes(term)
      ).slice(0, 20);
    },
    [mangas]
  );

  // Create a new manga (admin only)
  const createMangaMutation = useMutation({
    mutationFn: async ({
      title,
      coverFile,
      author,
    }: {
      title: string;
      coverFile: File;
      author?: string;
    }) => {
      // Upload cover image
      const fileExt = coverFile.name.split(".").pop();
      const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("official-manga-covers")
        .upload(fileName, coverFile, { upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("official-manga-covers")
        .getPublicUrl(fileName);

      // Insert manga into database
      const { data, error: insertError } = await supabase
        .from("official_mangas")
        .insert({
          title,
          cover_url: urlData.publicUrl,
          author: author || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data as OfficialManga;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["official-mangas"] });
    },
  });

  // Update manga (admin only)
  const updateMangaMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      author,
      coverFile,
    }: {
      id: string;
      title: string;
      author?: string;
      coverFile?: File;
    }) => {
      let cover_url: string | undefined;

      if (coverFile) {
        const fileExt = coverFile.name.split(".").pop();
        const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("official-manga-covers")
          .upload(fileName, coverFile, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("official-manga-covers")
          .getPublicUrl(fileName);
        
        cover_url = urlData.publicUrl;
      }

      const updateData: Partial<OfficialManga> = {
        title,
        author: author || null,
      };
      if (cover_url) updateData.cover_url = cover_url;

      const { error } = await supabase
        .from("official_mangas")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["official-mangas"] });
      toast.success("Manga mis à jour !");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  // Delete manga (admin only)
  const deleteMangaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("official_mangas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["official-mangas"] });
      toast.success("Manga supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  return {
    mangas,
    isLoading,
    searchMangas,
    createManga: createMangaMutation.mutateAsync,
    updateManga: updateMangaMutation.mutateAsync,
    deleteManga: deleteMangaMutation.mutate,
    isCreating: createMangaMutation.isPending,
    isUpdating: updateMangaMutation.isPending,
    isDeleting: deleteMangaMutation.isPending,
  };
};
