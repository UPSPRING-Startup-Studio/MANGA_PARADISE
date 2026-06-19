import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  CosplayPhotoWithTags,
  PhotoTagWithProfile,
  PhotoType,
  TagStatus,
} from "@/types/cosplayPhotos";

// ─── Types internes pour les résultats bruts de Supabase ─────────────────────

interface RawTag {
  id: string;
  photo_id: string;
  tagger_user_id: string;
  tagged_user_id: string | null;
  tagged_name: string | null;
  tagged_character: string | null;
  tagged_social_link: string | null;
  pin_x: number;
  pin_y: number;
  status: string;
  notified_at: string | null;
  accepted_at: string | null;
  created_at: string;
  linked_cosplay_id: string | null;
  profiles: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
  cosplay_plan: {
    id: string;
    character_name: string;
    universe: string;
  } | null;
}

interface RawPhoto {
  id: string;
  cosplay_id: string;
  user_id: string;
  photo_url: string;
  photo_type: string;
  is_group_photo: boolean;
  event_id: string | null;
  activity_id: string | null;
  event_name_manual: string | null;
  event_date_manual: string | null;
  event_location_manual: string | null;
  caption: string | null;
  exif_date: string | null;
  exif_gps_lat: number | null;
  exif_gps_lng: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  cosplay_photo_tags: RawTag[];
  events: { id: string; title: string; date: string; location: string | null } | null;
}

// Mappe un résultat brut Supabase vers CosplayPhotoWithTags
function mapRawPhoto(raw: RawPhoto, acceptedOnly = true): CosplayPhotoWithTags {
  const tags: PhotoTagWithProfile[] = (raw.cosplay_photo_tags ?? [])
    .filter((t) => (acceptedOnly ? t.status === "accepted" : true))
    .map((t) => ({
      ...t,
      status: t.status as TagStatus,
      linked_cosplay_id: t.linked_cosplay_id ?? null,
      tagged_profile: t.profiles
        ? {
            id: t.profiles.id,
            username: t.profiles.username,
            display_name: null, // non sélectionné dans la query legère
            avatar_url: t.profiles.avatar_url,
          }
        : null,
      cosplay_plan: t.cosplay_plan ?? null,
    }));

  return {
    ...raw,
    photo_type: raw.photo_type as PhotoType,
    tags,
    event_name: raw.events?.title ?? null,
  };
}

// ─── Clés de query ────────────────────────────────────────────────────────────

const QUERY_KEYS = {
  photos: (cosplayId: string) => ["cosplay-photos", cosplayId] as const,
  detail: (photoId: string) => ["photo-detail", photoId] as const,
  eventsCount: (cosplayId: string) => ["cosplay-events-count", cosplayId] as const,
  peopleMet: (cosplayId: string) => ["cosplay-people-met", cosplayId] as const,
  taggedIn: (userId: string) => ["photos-tagged-in", userId] as const,
};

// ─── 1. useCosplayPhotos ──────────────────────────────────────────────────────
// Toutes les photos d'un cosplay avec leurs tags acceptés et l'événement lié.
// Inclut aussi les photos collaboratives : photos d'autres utilisateurs où
// le propriétaire du cosplay a été tagué et a choisi ce cosplay (linked_cosplay_id).

export const useCosplayPhotos = (cosplayId: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.photos(cosplayId ?? ""),
    queryFn: async (): Promise<CosplayPhotoWithTags[]> => {
      const tagSelect = `*, profiles:tagged_user_id(id, username, avatar_url), cosplay_plan:linked_cosplay_id(id, character_name, universe)`;
      const photoSelect = `*, cosplay_photo_tags(${tagSelect}), events:event_id(id, title, date, location)`;

      // 1. Photos directement liées à ce cosplay (propriétaire)
      const ownPromise = (supabase as any)
        .from("cosplay_photos")
        .select(photoSelect)
        .eq("cosplay_id", cosplayId)
        .order("sort_order", { ascending: true });

      // 2. Photos collaboratives : tags acceptés avec linked_cosplay_id = ce cosplay
      const taggedPromise = (supabase as any)
        .from("cosplay_photo_tags")
        .select(`id, photo_id, linked_cosplay_id, cosplay_photos(${photoSelect})`)
        .eq("linked_cosplay_id", cosplayId)
        .eq("status", "accepted");

      const [ownResult, taggedResult] = await Promise.all([ownPromise, taggedPromise]);

      if (ownResult.error) throw ownResult.error;
      // Tagged query may fail if linked_cosplay_id FK is missing — degrade gracefully
      const taggedData = taggedResult.error ? [] : (taggedResult.data ?? []);

      const ownPhotos = ((ownResult.data as RawPhoto[]) ?? []).map((p) => mapRawPhoto(p, false));
      const ownIds = new Set(ownPhotos.map((p) => p.id));

      // Map tagged entries, dedup against own photos
      const taggedPhotos: CosplayPhotoWithTags[] = (taggedData as any[])
        .map((entry: any) => entry.cosplay_photos ? mapRawPhoto(entry.cosplay_photos as RawPhoto, false) : null)
        .filter((p: CosplayPhotoWithTags | null): p is CosplayPhotoWithTags => p !== null && !ownIds.has(p.id));

      return [...ownPhotos, ...taggedPhotos];
    },
    enabled: !!cosplayId,
  });
};

// ─── 2. usePhotoDetail ───────────────────────────────────────────────────────
// Photo unique avec TOUS les tags (pending inclus, RLS gère la visibilité).

export const usePhotoDetail = (photoId: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.detail(photoId ?? ""),
    queryFn: async (): Promise<CosplayPhotoWithTags | null> => {
      const { data, error } = await (supabase as any)
        .from("cosplay_photos")
        .select(
          `*,
          cosplay_photo_tags(*, profiles:tagged_user_id(id, username, display_name, avatar_url), cosplay_plan:linked_cosplay_id(id, character_name, universe)),
          events:event_id(id, title, date, location)`
        )
        .eq("id", photoId)
        .single();

      if (error) throw error;
      if (!data) return null;
      return mapRawPhoto(data as RawPhoto, false);
    },
    enabled: !!photoId,
  });
};

// ─── 3. useAddCosplayPhoto ───────────────────────────────────────────────────

interface AddPhotoInput {
  cosplay_id: string;
  photo_url: string;
  photo_type?: PhotoType;
  is_group_photo?: boolean;
  exif_date?: string;
  exif_gps_lat?: number;
  exif_gps_lng?: number;
  shot_date?: string;
  event_id?: string;
}

export const useAddCosplayPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddPhotoInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Derive shot_date from exif_date if not explicitly provided
      const derivedShotDate =
        input.shot_date ??
        (input.exif_date ? input.exif_date.split("T")[0] : null);

      const insertData: Record<string, unknown> = {
        user_id: user.id,
        cosplay_id: input.cosplay_id,
        photo_url: input.photo_url,
        photo_type: input.photo_type ?? "shooting",
        exif_date: input.exif_date ?? null,
        exif_gps_lat: input.exif_gps_lat ?? null,
        exif_gps_lng: input.exif_gps_lng ?? null,
      };

      // shot_date: include only if we have a value (column may not exist yet)
      if (derivedShotDate) {
        insertData.shot_date = derivedShotDate;
      }

      // Only include is_group_photo if explicitly set (avoids PGRST204 if column doesn't exist yet)
      if (input.is_group_photo) {
        insertData.is_group_photo = true;
      }

      // Include event_id if provided (for gallery contribution flow)
      if (input.event_id) {
        insertData.event_id = input.event_id;
      }

      let { data, error } = await (supabase as any)
        .from("cosplay_photos")
        .insert(insertData)
        .select()
        .single();

      // Fallback: if is_group_photo column doesn't exist, retry without it
      if (error && insertData.is_group_photo && (error.code === "PGRST204" || error.message?.includes("is_group_photo"))) {
        delete insertData.is_group_photo;
        const retry = await (supabase as any)
          .from("cosplay_photos")
          .insert(insertData)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      // Fallback: if shot_date column doesn't exist yet, retry without it
      if (error && insertData.shot_date && (error.code === "PGRST204" || error.message?.includes("shot_date"))) {
        delete insertData.shot_date;
        const retry = await (supabase as any)
          .from("cosplay_photos")
          .insert(insertData)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.photos(variables.cosplay_id) });
      if (variables.event_id) {
        queryClient.invalidateQueries({ queryKey: ["event-photos", variables.event_id] });
      }
      toast.success("Photo ajoutée au projet !");
    },
    onError: (error: any) => {
      console.error("Erreur ajout photo cosplay:", error);
      toast.error(`Erreur lors de l'ajout : ${error?.message ?? "Erreur inconnue"}`);
    },
  });
};

// ─── 4. useUpdatePhotoMeta ───────────────────────────────────────────────────

interface UpdatePhotoMetaInput {
  event_id?: string | null;
  activity_id?: string | null;
  event_name_manual?: string | null;
  event_date_manual?: string | null;
  event_location_manual?: string | null;
  caption?: string | null;
  photo_type?: PhotoType;
  shot_date?: string | null;
}

export const useUpdatePhotoMeta = (photoId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: UpdatePhotoMetaInput) => {
      const { data, error } = await (supabase as any)
        .from("cosplay_photos")
        .update(updates)
        .eq("id", photoId)
        .select()
        .single();

      if (error) {
        // Fallback: if activity_id column doesn't exist yet, retry without it
        if (error.code === "PGRST204" && error.message?.includes("activity_id")) {
          console.warn("Column activity_id not found in schema cache — retrying without it");
          const { activity_id: _, ...safeUpdates } = updates;
          const { data: retryData, error: retryError } = await (supabase as any)
            .from("cosplay_photos")
            .update(safeUpdates)
            .eq("id", photoId)
            .select()
            .single();
          if (retryError) throw retryError;
          return retryData;
        }
        // Fallback: if shot_date column doesn't exist yet, retry without it
        if (error.code === "PGRST204" && error.message?.includes("shot_date")) {
          const { shot_date: _, ...safeUpdates } = updates as Record<string, unknown>;
          const { data: retryData, error: retryError } = await (supabase as any)
            .from("cosplay_photos")
            .update(safeUpdates)
            .eq("id", photoId)
            .select()
            .single();
          if (retryError) throw retryError;
          return retryData;
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cosplay-photos"] });
      queryClient.invalidateQueries({ queryKey: ["all-cosplay-photos"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(photoId) });
      toast.success("Photo mise à jour");
    },
    onError: (error: any) => {
      console.error("Erreur mise à jour photo:", error);
      toast.error(`Erreur lors de la mise à jour : ${error?.message ?? "Erreur inconnue"}`);
    },
  });
};

// ─── 5. useAddPhotoTag ───────────────────────────────────────────────────────

interface AddTagInput {
  photo_id: string;
  tagged_user_id?: string | null;
  tagged_name?: string | null;
  tagged_character?: string | null;
  tagged_social_link?: string | null;
  pin_x: number;
  pin_y: number;
}

export const useAddPhotoTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddTagInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Non-membre (tagged_user_id null) → accepté directement, sinon en attente
      const status: TagStatus = input.tagged_user_id ? "pending" : "accepted";

      const { data, error } = await (supabase as any)
        .from("cosplay_photo_tags")
        .insert({
          photo_id: input.photo_id,
          tagger_user_id: user.id,
          tagged_user_id: input.tagged_user_id ?? null,
          tagged_name: input.tagged_name ?? null,
          tagged_character: input.tagged_character ?? null,
          tagged_social_link: input.tagged_social_link ?? null,
          pin_x: input.pin_x,
          pin_y: input.pin_y,
          status,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.photo_id) });
      queryClient.invalidateQueries({ queryKey: ["cosplay-photos"] });
      toast.success("Tag ajouté !");
    },
    onError: (error: any) => {
      console.error("Erreur ajout tag:", error);
      toast.error(`Erreur lors du tag : ${error?.message ?? "Erreur inconnue"}`);
    },
  });
};

// ─── 6. useRespondToTag ──────────────────────────────────────────────────────

interface RespondToTagInput {
  tagId: string;
  photoId: string;
  response: "accepted" | "declined";
}

export const useRespondToTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tagId, response }: RespondToTagInput) => {
      const updates: Record<string, unknown> = { status: response };
      if (response === "accepted") {
        updates.accepted_at = new Date().toISOString();
      }

      const { data, error } = await (supabase as any)
        .from("cosplay_photo_tags")
        .update(updates)
        .eq("id", tagId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.photoId) });
      queryClient.invalidateQueries({ queryKey: ["cosplay-photos"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      if (variables.response === "accepted") {
        toast.success("Tag accepté !");
      } else {
        toast.success("Tag refusé");
      }
    },
    onError: (error: any) => {
      console.error("Erreur réponse tag:", error);
      toast.error(`Erreur : ${error?.message ?? "Erreur inconnue"}`);
    },
  });
};

// ─── 7. useDeletePhotoTag ────────────────────────────────────────────────────

interface DeleteTagInput {
  tagId: string;
  photoId: string;
}

export const useDeletePhotoTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tagId }: DeleteTagInput) => {
      const { error } = await (supabase as any)
        .from("cosplay_photo_tags")
        .delete()
        .eq("id", tagId);

      if (error) throw error;
      return { tagId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.photoId) });
      queryClient.invalidateQueries({ queryKey: ["cosplay-photos"] });
      toast.success("Tag supprimé");
    },
    onError: (error: any) => {
      console.error("Erreur suppression tag:", error);
      toast.error(`Erreur lors de la suppression : ${error?.message ?? "Erreur inconnue"}`);
    },
  });
};

// ─── 8. useCosplayEventsCount ────────────────────────────────────────────────

export const useCosplayEventsCount = (cosplayId: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.eventsCount(cosplayId ?? ""),
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc("get_cosplay_events_count", {
        p_cosplay_id: cosplayId!,
      });

      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: !!cosplayId,
  });
};

// ─── 9. useCosplayPeopleMet ──────────────────────────────────────────────────

export const useCosplayPeopleMet = (cosplayId: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.peopleMet(cosplayId ?? ""),
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc("get_cosplay_people_met", {
        p_cosplay_id: cosplayId!,
      });

      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: !!cosplayId,
  });
};

// ─── 10. usePhotosTaggedIn ───────────────────────────────────────────────────
// Photos acceptées où un utilisateur est taggé (section "Photos avec moi").

interface TaggedPhotoEntry {
  tag: {
    id: string;
    pin_x: number;
    pin_y: number;
    tagged_character: string | null;
    created_at: string;
  };
  photo: CosplayPhotoWithTags;
}

export const usePhotosTaggedIn = (userId: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.taggedIn(userId ?? ""),
    queryFn: async (): Promise<TaggedPhotoEntry[]> => {
      const { data, error } = await (supabase as any)
        .from("cosplay_photo_tags")
        .select(
          `id, pin_x, pin_y, tagged_character, created_at,
          cosplay_photos(
            *,
            cosplay_photo_tags(*, profiles:tagged_user_id(id, username, avatar_url)),
            events:event_id(id, title, date, location)
          )`
        )
        .eq("tagged_user_id", userId)
        .eq("status", "accepted")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return ((data as any[]) ?? []).map((row) => ({
        tag: {
          id: row.id,
          pin_x: row.pin_x,
          pin_y: row.pin_y,
          tagged_character: row.tagged_character,
          created_at: row.created_at,
        },
        photo: mapRawPhoto(row.cosplay_photos as RawPhoto, true),
      }));
    },
    enabled: !!userId,
  });
};

// ─── 11. useEventGroupPhotos ─────────────────────────────────────────────────
// Photos de groupe associées à un événement, triées par nombre de tags (les plus populaires en premier).

export const useEventGroupPhotos = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["event-group-photos", eventId],
    queryFn: async (): Promise<CosplayPhotoWithTags[]> => {
      const { data, error } = await (supabase as any)
        .from("cosplay_photos")
        .select(
          `*, cosplay_photo_tags(*, profiles:tagged_user_id(id, username, avatar_url), cosplay_plan:linked_cosplay_id(id, character_name, universe)), events:event_id(id, title, date, location)`
        )
        .eq("event_id", eventId)
        .eq("is_group_photo", true)
        .order("created_at", { ascending: false });

      // Column may not exist yet — return empty instead of crashing
      if (error) {
        if (error.code === "PGRST204" || error.message?.includes("is_group_photo")) return [];
        throw error;
      }

      const photos = ((data as RawPhoto[]) ?? []).map((raw) => mapRawPhoto(raw, false));
      photos.sort((a, b) => b.tags.length - a.tags.length);
      return photos;
    },
    enabled: !!eventId,
  });
};

// ─── 12. useDeleteCosplayPhoto ────────────────────────────────────────────────

export const useDeleteCosplayPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, cosplayId }: { photoId: string; cosplayId: string }) => {
      const { error } = await (supabase as any)
        .from("cosplay_photos")
        .delete()
        .eq("id", photoId);

      if (error) throw error;
      return { photoId, cosplayId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.photos(variables.cosplayId) });
      queryClient.invalidateQueries({ queryKey: ["cosplay-photos"] });
      toast.success("Photo supprimée");
    },
    onError: (error: any) => {
      console.error("Erreur suppression photo:", error);
      toast.error(`Erreur lors de la suppression : ${error?.message ?? "Erreur inconnue"}`);
    },
  });
};

// ─── 13. useEventPhotos ─────────────────────────────────────────────────────
// All photos for an event, with tags, activity, photographer profile.

export interface EventPhotoEnriched extends CosplayPhotoWithTags {
  activity?: { id: string; title: string; start_time: string; category: string } | null;
  photographer?: { id: string; username: string | null; avatar_url: string | null } | null;
  cosplay?: { id: string; character_name: string; universe: string } | null;
}

// Select string that works with real FK relationships in the schema.
// - cosplay_plans:cosplay_id → FK exists (cosplay_photos.cosplay_id → cosplay_plans.id)
// - events:event_id → FK exists (cosplay_photos.event_id → events.id)
// - cosplay_photo_tags → FK exists (cosplay_photo_tags.photo_id → cosplay_photos.id)
// - profiles:tagged_user_id → FK exists (cosplay_photo_tags.tagged_user_id → profiles.id)
// NOTE: there is NO FK cosplay_photos.user_id → profiles, so photographer
//       profile is resolved client-side via a separate batch query.
const EVENT_PHOTOS_SELECT = `
  *,
  cosplay_photo_tags(*, profiles:tagged_user_id(id, username, avatar_url), cosplay_plan:linked_cosplay_id(id, character_name, universe)),
  events:event_id(id, title, date, location),
  cosplay_plans:cosplay_id(id, character_name, universe)
`;

export const useEventPhotos = (eventId: string | undefined, eventTitle?: string) => {
  return useQuery({
    queryKey: ["event-photos", eventId, eventTitle ?? null],
    queryFn: async (): Promise<EventPhotoEnriched[]> => {
      // ── 1. Fetch photos (FK match + manual-name match) ─────────────
      const fkPromise = (supabase as any)
        .from("cosplay_photos")
        .select(EVENT_PHOTOS_SELECT)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      const manualPromise = eventTitle
        ? (supabase as any)
            .from("cosplay_photos")
            .select(EVENT_PHOTOS_SELECT)
            .is("event_id", null)
            .eq("event_name_manual", eventTitle)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null });

      const [fkResult, manualResult] = await Promise.all([fkPromise, manualPromise]);

      if (fkResult.error) throw fkResult.error;

      // Merge and deduplicate
      const fkData = (fkResult.data ?? []) as any[];
      const manualData = (manualResult.error ? [] : manualResult.data ?? []) as any[];
      const seenIds = new Set(fkData.map((p: any) => p.id));
      const allRaw = [...fkData, ...manualData.filter((p: any) => !seenIds.has(p.id))];

      // ── 2. Batch-fetch photographer profiles ───────────────────────
      // No FK cosplay_photos.user_id → profiles, so we resolve separately.
      const userIds = [...new Set(allRaw.map((p: any) => p.user_id as string))];
      let profileMap = new Map<string, { id: string; username: string | null; avatar_url: string | null }>();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);

        if (profiles) {
          for (const p of profiles) {
            profileMap.set(p.id, p);
          }
        }
      }

      // ── 3. Map to EventPhotoEnriched ───────────────────────────────
      return allRaw.map((raw: any) => {
        const base = mapRawPhoto(raw as RawPhoto, false);
        const profile = profileMap.get(raw.user_id) ?? null;
        const cosplanJoin = raw.cosplay_plans ?? null;

        return {
          ...base,
          activity: null, // activity_id column may not exist — omit for now
          photographer: profile
            ? { id: profile.id, username: profile.username, avatar_url: profile.avatar_url }
            : null,
          cosplay: cosplanJoin
            ? { id: cosplanJoin.id, character_name: cosplanJoin.character_name, universe: cosplanJoin.universe }
            : null,
        };
      });
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });
};

// ─── 14. useEventActivities ─────────────────────────────────────────────────
// Activities from an event's schedule, for the activity selector.

export interface EventActivity {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  category: string;
  description: string | null;
  day_date: string | null;
}

export const useEventActivities = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["event-activities", eventId],
    queryFn: async (): Promise<EventActivity[]> => {
      const { data, error } = await (supabase as any)
        .from("event_schedule")
        .select("id, title, start_time, end_time, category, description, day_date")
        .eq("event_id", eventId)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return (data as EventActivity[]) ?? [];
    },
    enabled: !!eventId,
    staleTime: 10 * 60 * 1000,
  });
};
