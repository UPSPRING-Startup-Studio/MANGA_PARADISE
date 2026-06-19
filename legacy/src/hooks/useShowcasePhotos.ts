/**
 * useShowcasePhotos Hook
 * Manages the photo gallery (Book Photo) for a finished cosplay showcase.
 * - Fetches photos from cosplay_showcase_photos table
 * - Handles file upload to Supabase Storage (showcase-photos bucket)
 * - Handles photo deletion
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ShowcasePhoto {
  id: string;
  cosplay_plan_id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

const STORAGE_BUCKET = 'showcase-photos';
const QUERY_KEY = 'showcase-photos';

// ─── Query: Fetch photos for a cosplay plan ────────────────────────────────────

export const useShowcasePhotos = (cosplayPlanId: string | undefined) => {
  return useQuery({
    queryKey: [QUERY_KEY, cosplayPlanId],
    queryFn: async (): Promise<ShowcasePhoto[]> => {
      if (!cosplayPlanId) return [];

      const { data, error } = await (supabase as any)
        .from('cosplay_showcase_photos')
        .select('*')
        .eq('cosplay_plan_id', cosplayPlanId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as ShowcasePhoto[]) || [];
    },
    enabled: !!cosplayPlanId,
  });
};

// ─── Mutation: Upload a photo ──────────────────────────────────────────────────

interface UploadPhotoInput {
  file: File;
  cosplayPlanId: string;
  userId: string;
  caption?: string;
}

export const useUploadShowcasePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, cosplayPlanId, userId, caption }: UploadPhotoInput) => {
      // 1. Build a unique storage path: {userId}/{cosplayPlanId}/{timestamp}.{ext}
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/${cosplayPlanId}/${Date.now()}.${fileExt}`;

      // 2. Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Showcase photo upload error:', uploadError);
        throw uploadError;
      }

      // 3. Get the public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // 4. Insert record in cosplay_showcase_photos table
      const { data, error: insertError } = await (supabase as any)
        .from('cosplay_showcase_photos')
        .insert({
          cosplay_plan_id: cosplayPlanId,
          user_id: userId,
          image_url: publicUrl,
          caption: caption ?? null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Showcase photo insert error:', insertError);
        // Attempt to clean up the uploaded file
        await supabase.storage.from(STORAGE_BUCKET).remove([fileName]);
        throw insertError;
      }

      return data as ShowcasePhoto;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.cosplayPlanId] });
      toast.success('📸 Photo ajoutée à ta vitrine !');
    },
    onError: (error: any) => {
      console.error('Error uploading showcase photo:', error);
      toast.error(`Erreur lors de l'upload : ${error?.message ?? 'Erreur inconnue'}`);
    },
  });
};

// ─── Mutation: Delete a photo ──────────────────────────────────────────────────

interface DeletePhotoInput {
  photoId: string;
  imageUrl: string;
  cosplayPlanId: string;
}

export const useDeleteShowcasePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, imageUrl, cosplayPlanId }: DeletePhotoInput) => {
      // 1. Extract storage path from the public URL
      // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
      const urlParts = imageUrl.split(`/storage/v1/object/public/${STORAGE_BUCKET}/`);
      const storagePath = urlParts[1];

      // 2. Delete from storage (best effort — don't block on failure)
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([storagePath]);

        if (storageError) {
          console.warn('Could not delete file from storage:', storageError);
        }
      }

      // 3. Delete the database record
      const { error: dbError } = await (supabase as any)
        .from('cosplay_showcase_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      return { photoId, cosplayPlanId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, result.cosplayPlanId] });
      toast.success('Photo supprimée');
    },
    onError: (error: any) => {
      console.error('Error deleting showcase photo:', error);
      toast.error(`Erreur lors de la suppression : ${error?.message ?? 'Erreur inconnue'}`);
    },
  });
};
