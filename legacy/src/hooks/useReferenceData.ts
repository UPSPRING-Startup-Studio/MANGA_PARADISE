import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types
export interface RefUniverse {
  id: string;
  name: string;
  created_at: string;
}

export interface RefCharacter {
  id: string;
  universe_id: string;
  name: string;
  official_image_url: string | null;
  created_at: string;
}

export interface RefCharacterWithUniverse extends RefCharacter {
  universe?: {
    id: string;
    name: string;
  };
}

// ============= UNIVERSES =============

// Search/fetch universes
export const useSearchUniverses = (searchQuery: string) => {
  return useQuery({
    queryKey: ["ref-universes", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from("ref_universes")
        .select("*")
        .ilike("name", `%${searchQuery}%`)
        .order("name")
        .limit(10);

      if (error) throw error;
      return data as RefUniverse[];
    },
    enabled: searchQuery.length >= 2,
  });
};

// Create a new universe
export const useCreateUniverse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("ref_universes")
        .insert({ name: name.trim() })
        .select()
        .single();

      if (error) {
        // Handle duplicate (unique constraint on name_normalized)
        if (error.code === "23505") {
          // Fetch the existing one instead
          const { data: existing, error: fetchError } = await supabase
            .from("ref_universes")
            .select("*")
            .ilike("name", name.trim())
            .single();
          
          if (fetchError) throw fetchError;
          return existing as RefUniverse;
        }
        throw error;
      }
      return data as RefUniverse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ref-universes"] });
    },
  });
};

// ============= CHARACTERS =============

// Search characters (optionally filtered by universe)
export const useSearchCharacters = (searchQuery: string, universeId?: string) => {
  return useQuery({
    queryKey: ["ref-characters", searchQuery, universeId],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      let query = supabase
        .from("ref_characters")
        .select("*, universe:ref_universes(id, name)")
        .ilike("name", `%${searchQuery}%`)
        .order("name")
        .limit(10);

      if (universeId) {
        query = query.eq("universe_id", universeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as RefCharacterWithUniverse[];
    },
    enabled: searchQuery.length >= 2,
  });
};

// Fetch characters for a specific universe
export const useUniverseCharacters = (universeId: string | undefined) => {
  return useQuery({
    queryKey: ["ref-characters-by-universe", universeId],
    queryFn: async () => {
      if (!universeId) return [];
      
      const { data, error } = await supabase
        .from("ref_characters")
        .select("*")
        .eq("universe_id", universeId)
        .order("name");

      if (error) throw error;
      return data as RefCharacter[];
    },
    enabled: !!universeId,
  });
};

// Fetch a single character by ID
export const useCharacterById = (characterId: string | null | undefined) => {
  return useQuery({
    queryKey: ["ref-character", characterId],
    queryFn: async () => {
      if (!characterId) return null;
      
      const { data, error } = await supabase
        .from("ref_characters")
        .select("*, universe:ref_universes(id, name)")
        .eq("id", characterId)
        .single();

      if (error) throw error;
      return data as RefCharacterWithUniverse;
    },
    enabled: !!characterId,
  });
};

// Create a new character
export const useCreateCharacter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      universeId: string;
      officialImageUrl?: string;
    }) => {
      console.log("DEBUG CREATE CHARACTER - Starting creation");
      console.log("DEBUG CREATE CHARACTER - Input:", input);
      
      const insertData = {
        name: input.name.trim(),
        universe_id: input.universeId,
        official_image_url: input.officialImageUrl || null,
      };
      
      console.log("DEBUG CREATE CHARACTER - Insert data:", insertData);
      
      const { data, error } = await supabase
        .from("ref_characters")
        .insert(insertData)
        .select("*, universe:ref_universes(id, name)")
        .single();

      if (error) {
        console.error("DEBUG CREATE CHARACTER - Insert error:", error);
        console.error("DEBUG CREATE CHARACTER - Error code:", error.code);
        console.error("DEBUG CREATE CHARACTER - Error message:", error.message);
        console.error("DEBUG CREATE CHARACTER - Error details:", error.details);
        console.error("DEBUG CREATE CHARACTER - Error hint:", error.hint);
        
        // Handle duplicate
        if (error.code === "23505") {
          console.log("DEBUG CREATE CHARACTER - Duplicate detected, fetching existing...");
          const { data: existing, error: fetchError } = await supabase
            .from("ref_characters")
            .select("*, universe:ref_universes(id, name)")
            .eq("universe_id", input.universeId)
            .ilike("name", input.name.trim())
            .single();
          
          if (fetchError) {
            console.error("DEBUG CREATE CHARACTER - Fetch existing error:", fetchError);
            throw fetchError;
          }
          console.log("DEBUG CREATE CHARACTER - Found existing:", existing);
          return existing as RefCharacterWithUniverse;
        }
        throw error;
      }
      
      console.log("DEBUG CREATE CHARACTER - SUCCESS! Created:", data);
      return data as RefCharacterWithUniverse;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ref-characters"] });
      queryClient.invalidateQueries({ queryKey: ["ref-characters-by-universe", variables.universeId] });
    },
  });
};

// Upload official character image to storage
export const uploadCharacterImage = async (
  file: File,
  userId: string
): Promise<string> => {
  console.log("DEBUG UPLOAD - Starting character image upload");
  console.log("DEBUG UPLOAD - File:", file.name, "Size:", file.size, "Type:", file.type);
  console.log("DEBUG UPLOAD - User ID:", userId);
  
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  console.log("DEBUG UPLOAD - Target path:", fileName);

  const { error: uploadError } = await supabase.storage
    .from("characters")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("DEBUG UPLOAD - Upload error:", uploadError);
    console.error("DEBUG UPLOAD - Error message:", uploadError.message);
    console.error("DEBUG UPLOAD - Error name:", uploadError.name);
    
    // If bucket doesn't exist, try to create it or use a fallback
    if (uploadError.message?.includes("Bucket not found") || uploadError.name === "StorageError") {
      console.warn("DEBUG UPLOAD - Bucket 'characters' may not exist, trying 'images' bucket");
      
      // Try alternative bucket
      const { error: altError } = await supabase.storage
        .from("images")
        .upload(`characters/${fileName}`, file, {
          cacheControl: "3600",
          upsert: false,
        });
        
      if (altError) {
        console.error("DEBUG UPLOAD - Alternative bucket also failed:", altError);
        throw new Error(`Impossible d'uploader l'image. Vérifie que le bucket 'characters' existe dans Supabase Storage.`);
      }
      
      const { data: altUrlData } = supabase.storage
        .from("images")
        .getPublicUrl(`characters/${fileName}`);
        
      console.log("DEBUG UPLOAD - Alternative upload successful:", altUrlData.publicUrl);
      return altUrlData.publicUrl;
    }
    
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from("characters")
    .getPublicUrl(fileName);

  console.log("DEBUG UPLOAD - Upload successful, public URL:", urlData.publicUrl);
  return urlData.publicUrl;
};
