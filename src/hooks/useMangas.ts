import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Manga {
  id: string;
  title: string;
  cover_url: string;
  created_by?: string | null;
  created_at?: string;
}

export const useMangas = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch all mangas
  const { data: mangas = [], isLoading } = useQuery({
    queryKey: ["mangas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mangas")
        .select("*")
        .order("title", { ascending: true });

      if (error) throw error;
      return data as Manga[];
    },
  });

  // Search mangas by title
  const searchMangas = useCallback(
    (searchTerm: string): Manga[] => {
      if (!searchTerm.trim()) return mangas.slice(0, 12);
      const term = searchTerm.toLowerCase();
      return mangas.filter((m) =>
        m.title.toLowerCase().includes(term)
      ).slice(0, 20);
    },
    [mangas]
  );

  // Create a new manga
  const createMangaMutation = useMutation({
    mutationFn: async ({
      title,
      coverFile,
    }: {
      title: string;
      coverFile: File;
    }) => {
      if (!user?.id) throw new Error("Non authentifié");

      // Upload cover image
      const fileExt = coverFile.name.split(".").pop();
      const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("manga-covers")
        .upload(fileName, coverFile, { upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("manga-covers")
        .getPublicUrl(fileName);

      // Insert manga into database
      const { data, error: insertError } = await supabase
        .from("mangas")
        .insert({
          title,
          cover_url: urlData.publicUrl,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data as Manga;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mangas"] });
    },
  });

  return {
    mangas,
    isLoading,
    searchMangas,
    createManga: createMangaMutation.mutateAsync,
    isCreating: createMangaMutation.isPending,
  };
};
