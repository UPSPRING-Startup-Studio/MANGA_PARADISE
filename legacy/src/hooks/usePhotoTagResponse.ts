import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AcceptTagInput {
  tagId: string;
  linkedCosplayId: string;
  characterName?: string | null;
}

interface DeclineTagInput {
  tagId: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePhotoTagResponse() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["cosplay-photos"] });
    queryClient.invalidateQueries({ queryKey: ["all-cosplay-photos"] });
    queryClient.invalidateQueries({ queryKey: ["photo-detail"] });
    queryClient.invalidateQueries({ queryKey: ["photos-tagged-in"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    queryClient.invalidateQueries({ queryKey: ["tag-detail"] });
    queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getCurrentUserId = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");
    return user.id;
  };

  // ── Accept ────────────────────────────────────────────────────────────────

  const accept = useMutation({
    mutationFn: async ({ tagId, linkedCosplayId, characterName }: AcceptTagInput) => {
      const userId = await getCurrentUserId();

      // 1. Guard: check the tag is still pending (idempotence).
      //    RLS cpt_select (USING true) → tout auth peut lire → .single() fiable.
      const { data: existing, error: fetchError } = await (supabase as any)
        .from("cosplay_photo_tags")
        .select("id, status, tagged_user_id")
        .eq("id", tagId)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") throw new Error("Tag introuvable");
        throw fetchError;
      }
      if (!existing) throw new Error("Tag introuvable");
      if (existing.tagged_user_id !== userId) throw new Error("Action non autorisée");
      if (existing.status !== "pending") throw new Error("Ce tag a déjà été traité.");

      // 2. Update avec les champs requis.
      //    RLS cpt_update USING (auth.uid() = tagged_user_id) → passe car c'est l'utilisateur courant.
      const updateData: Record<string, unknown> = {
        status: "accepted",
        accepted_at: new Date().toISOString(),
        linked_cosplay_id: linkedCosplayId,
      };
      if (characterName) {
        updateData.tagged_character = characterName;
      }

      const { error: updateError } = await (supabase as any)
        .from("cosplay_photo_tags")
        .update(updateData)
        .eq("id", tagId)
        .eq("tagged_user_id", userId);

      if (updateError) throw updateError;

      // Note: PHOTO_TAG_ACCEPTED notification créée par le trigger DB notify_photo_tag_response.
      return { tagId, linkedCosplayId };
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Tag accepté ! La photo apparaîtra dans tes photos cosplay.");
    },
    onError: (error: any) => {
      if (error?.message === "Ce tag a déjà été traité.") {
        toast.error("Ce tag a déjà été traité.");
      } else if (error?.message === "Action non autorisée") {
        toast.error("Tu ne peux pas répondre à ce tag.");
      } else {
        toast.error(`Erreur lors de l'acceptation : ${error?.message ?? "Erreur inconnue"}`);
      }
    },
  });

  // ── Decline ───────────────────────────────────────────────────────────────

  const decline = useMutation({
    mutationFn: async ({ tagId }: DeclineTagInput) => {
      const userId = await getCurrentUserId();

      // 1. Guard idempotence
      const { data: existing, error: fetchError } = await (supabase as any)
        .from("cosplay_photo_tags")
        .select("id, status, tagged_user_id")
        .eq("id", tagId)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") throw new Error("Tag introuvable");
        throw fetchError;
      }
      if (!existing) throw new Error("Tag introuvable");
      if (existing.tagged_user_id !== userId) throw new Error("Action non autorisée");
      if (existing.status !== "pending") throw new Error("Ce tag a déjà été traité.");

      // 2. Update status to declined
      const { error: updateError } = await (supabase as any)
        .from("cosplay_photo_tags")
        .update({ status: "declined" })
        .eq("id", tagId)
        .eq("tagged_user_id", userId);

      if (updateError) throw updateError;

      // Note: PHOTO_TAG_DECLINED notification créée par le trigger DB notify_photo_tag_response.
      return { tagId };
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Tag refusé.");
    },
    onError: (error: any) => {
      if (error?.message === "Ce tag a déjà été traité.") {
        toast.error("Ce tag a déjà été traité.");
      } else if (error?.message === "Action non autorisée") {
        toast.error("Tu ne peux pas répondre à ce tag.");
      } else {
        toast.error(`Erreur : ${error?.message ?? "Erreur inconnue"}`);
      }
    },
  });

  return { accept, decline };
}
