import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PhotoType, TagStatus } from "@/types/cosplayPhotos";

// ─── Raw types from the Supabase join ────────────────────────────────────────

interface RawTagProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface RawTagCosplay {
  id: string;
  character_name: string;
  universe: string;
}

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
  profiles: RawTagProfile | null;
  cosplay_plan: RawTagCosplay | null;
}

interface RawCosplan {
  id: string;
  character_name: string;
  universe: string;
  image_url: string | null;
}

interface RawEvent {
  id: string;
  title: string;
  date: string;
  end_date: string | null;
  location: string | null;
  cover_image: string | null;
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
  shot_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  cosplay_plans: RawCosplan | null;
  events: RawEvent | null;
  cosplay_photo_tags: RawTag[];
}

// ─── Public types ────────────────────────────────────────────────────────────

export interface TaggedProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface PhotoTag {
  id: string;
  pin_x: number;
  pin_y: number;
  status: TagStatus;
  tagged_user_id: string | null;
  tagged_name: string | null;
  tagged_character: string | null;
  tagged_social_link: string | null;
  linked_cosplay_id: string | null;
  created_at: string;
  tagged_profile: TaggedProfile | null;
  cosplay_plan: RawTagCosplay | null;
}

export interface PhotoCosplan {
  id: string;
  character_name: string;
  universe: string;
  image_url: string | null;
}

export interface PhotoEvent {
  id: string;
  title: string;
  date: string;
  end_date: string | null;
  location: string | null;
  cover_image: string | null;
}

export interface EnrichedPhoto {
  id: string;
  cosplay_id: string;
  user_id: string;
  photo_url: string;
  photo_type: PhotoType;
  is_group_photo: boolean;
  event_id: string | null;
  activity_id: string | null;
  event_name_manual: string | null;
  event_date_manual: string | null;
  caption: string | null;
  created_at: string;
  /** Jour de prise de vue normalisé (shot_date > exif_date > null) */
  shot_date: string | null;
  cosplan: PhotoCosplan | null;
  event: PhotoEvent | null;
  /** Resolved event name (from join or manual) */
  event_name: string | null;
  tags: PhotoTag[];
  /** Pre-computed count of accepted tags (avoids .filter() in render loops) */
  acceptedTagCount: number;
  /** True if this photo was shared via tag collaboration (not owned by the user) */
  isTaggedPhoto?: boolean;
}

export interface PersonAggregate {
  profile: TaggedProfile;
  photos: EnrichedPhoto[];
  eventCount: number;
}

export interface AllPhotosStats {
  totalPhotos: number;
  totalEvents: number;
  totalCosplays: number;
  totalPeopleTagged: number;
}

// ─── Mapper ──────────────────────────────────────────────────────────────────

function mapRawPhoto(raw: RawPhoto): EnrichedPhoto {
  const tags: PhotoTag[] = (raw.cosplay_photo_tags ?? []).map((t) => ({
    id: t.id,
    pin_x: t.pin_x,
    pin_y: t.pin_y,
    status: t.status as TagStatus,
    tagged_user_id: t.tagged_user_id,
    tagged_name: t.tagged_name,
    tagged_character: t.tagged_character,
    tagged_social_link: t.tagged_social_link,
    linked_cosplay_id: t.linked_cosplay_id,
    created_at: t.created_at,
    tagged_profile: t.profiles
      ? {
          id: t.profiles.id,
          username: t.profiles.username,
          display_name: t.profiles.display_name,
          avatar_url: t.profiles.avatar_url,
        }
      : null,
    cosplay_plan: t.cosplay_plan ?? null,
  }));

  return {
    id: raw.id,
    cosplay_id: raw.cosplay_id,
    user_id: raw.user_id,
    photo_url: raw.photo_url,
    photo_type: raw.photo_type as PhotoType,
    is_group_photo: raw.is_group_photo ?? false,
    event_id: raw.event_id,
    activity_id: raw.activity_id,
    event_name_manual: raw.event_name_manual,
    event_date_manual: raw.event_date_manual,
    caption: raw.caption,
    created_at: raw.created_at,
    shot_date: raw.shot_date ?? (raw.exif_date ? raw.exif_date.split("T")[0] : null),
    cosplan: raw.cosplay_plans
      ? {
          id: raw.cosplay_plans.id,
          character_name: raw.cosplay_plans.character_name,
          universe: raw.cosplay_plans.universe,
          image_url: raw.cosplay_plans.image_url,
        }
      : null,
    event: raw.events
      ? {
          id: raw.events.id,
          title: raw.events.title,
          date: raw.events.date,
          end_date: raw.events.end_date ?? null,
          location: raw.events.location,
          cover_image: raw.events.cover_image,
        }
      : null,
    event_name: raw.events?.title ?? raw.event_name_manual ?? null,
    tags,
    acceptedTagCount: tags.filter((t) => t.status === "accepted").length,
  };
}

// ─── Raw type for tagged photo entries (fetched via cosplay_photo_tags) ──────

interface RawTaggedEntry {
  id: string;
  photo_id: string;
  linked_cosplay_id: string;
  tagged_character: string | null;
  accepted_at: string | null;
  cosplay_photos: RawPhoto;
  linked_cosplay: RawCosplan | null;
}

/**
 * Maps a tagged photo entry into an EnrichedPhoto, using linked_cosplay_id
 * as the effective cosplay_id so it groups correctly in the tagged user's views.
 */
function mapTaggedEntry(entry: RawTaggedEntry): EnrichedPhoto | null {
  const raw = entry.cosplay_photos;
  if (!raw) return null;

  const base = mapRawPhoto(raw);

  // Override cosplay_id and cosplan with the tagged user's chosen cosplay
  return {
    ...base,
    cosplay_id: entry.linked_cosplay_id,
    cosplan: entry.linked_cosplay
      ? {
          id: entry.linked_cosplay.id,
          character_name: entry.linked_cosplay.character_name,
          universe: entry.linked_cosplay.universe,
          image_url: entry.linked_cosplay.image_url,
        }
      : null,
    isTaggedPhoto: true,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

const PHOTO_SELECT = `
  *,
  cosplay_plans:cosplay_id(id, character_name, universe, image_url),
  events:event_id(id, title, date, end_date, location, cover_image),
  cosplay_photo_tags(
    id, photo_id, tagger_user_id, tagged_user_id, tagged_name, tagged_character,
    tagged_social_link, pin_x, pin_y, status, notified_at, accepted_at, created_at,
    linked_cosplay_id,
    profiles:tagged_user_id(id, username, display_name, avatar_url),
    cosplay_plan:linked_cosplay_id(id, character_name, universe)
  )
`;

export function useAllCosplayPhotos(userId: string | undefined) {
  const { data: rawPhotos, isLoading, error } = useQuery({
    queryKey: ["all-cosplay-photos", userId],
    queryFn: async () => {
      // 1. Fetch user's own photos
      const ownPromise = (supabase as any)
        .from("cosplay_photos")
        .select(PHOTO_SELECT)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // 2. Fetch photos where user is tagged with accepted status + linked_cosplay_id
      //    These are collaboration photos that should appear in the user's cosplay views.
      const taggedPromise = (supabase as any)
        .from("cosplay_photo_tags")
        .select(`
          id, photo_id, linked_cosplay_id, tagged_character, accepted_at,
          cosplay_photos(${PHOTO_SELECT}),
          linked_cosplay:linked_cosplay_id(id, character_name, universe, image_url)
        `)
        .eq("tagged_user_id", userId)
        .eq("status", "accepted")
        .not("linked_cosplay_id", "is", null);

      const [ownResult, taggedResult] = await Promise.all([ownPromise, taggedPromise]);

      if (ownResult.error) throw ownResult.error;
      if (taggedResult.error) throw taggedResult.error;

      const ownPhotos: EnrichedPhoto[] = ((ownResult.data as RawPhoto[]) ?? []).map(mapRawPhoto);
      const ownPhotoIds = new Set(ownPhotos.map((p) => p.id));

      // Map tagged entries, dedup against own photos
      const taggedPhotos: EnrichedPhoto[] = ((taggedResult.data as RawTaggedEntry[]) ?? [])
        .map(mapTaggedEntry)
        .filter((p): p is EnrichedPhoto => p !== null && !ownPhotoIds.has(p.id));

      // Merge: own photos first, then tagged photos
      return [...ownPhotos, ...taggedPhotos];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,  // 5 min — no refetch on tab switches
    gcTime: 10 * 60 * 1000,    // 10 min cache after unmount
  });

  const photos = rawPhotos ?? [];

  // ── Photos grouped by event ───────────────────────────────────────────────

  const photosByEvent = useMemo(() => {
    const map = new Map<string, { key: string; label: string; event: PhotoEvent | null; photos: EnrichedPhoto[] }>();

    for (const photo of photos) {
      let groupKey: string;
      let groupLabel: string;
      let groupEvent: PhotoEvent | null;

      if (photo.event_id && photo.event) {
        groupKey = photo.event_id;
        groupLabel = photo.event.title;
        groupEvent = photo.event;
      } else if (photo.event_name_manual) {
        groupKey = `manual:${photo.event_name_manual}`;
        groupLabel = photo.event_name_manual;
        groupEvent = null;
      } else {
        groupKey = "__none__";
        groupLabel = "Sans événement";
        groupEvent = null;
      }

      const existing = map.get(groupKey);
      if (existing) {
        existing.photos.push(photo);
      } else {
        map.set(groupKey, { key: groupKey, label: groupLabel, event: groupEvent, photos: [photo] });
      }
    }

    return map;
  }, [photos]);

  // ── Photos grouped by cosplay ─────────────────────────────────────────────

  const photosByCosplay = useMemo(() => {
    const map = new Map<string, { cosplan: PhotoCosplan | null; photos: EnrichedPhoto[] }>();

    for (const photo of photos) {
      const key = photo.cosplay_id;
      const existing = map.get(key);
      if (existing) {
        existing.photos.push(photo);
      } else {
        map.set(key, { cosplan: photo.cosplan, photos: [photo] });
      }
    }

    return map;
  }, [photos]);

  // ── Photos grouped by tagged person ───────────────────────────────────────

  const photosByPerson = useMemo(() => {
    const map = new Map<string, PersonAggregate>();

    for (const photo of photos) {
      const acceptedTags = photo.tags.filter(
        (t) => t.status === "accepted" && t.tagged_user_id && t.tagged_profile
      );

      for (const tag of acceptedTags) {
        const uid = tag.tagged_user_id!;
        const existing = map.get(uid);
        if (existing) {
          // Avoid duplicate photos (one person can have multiple tags on different photos)
          if (!existing.photos.some((p) => p.id === photo.id)) {
            existing.photos.push(photo);
          }
        } else {
          map.set(uid, {
            profile: tag.tagged_profile!,
            photos: [photo],
            eventCount: 0,
          });
        }
      }
    }

    // Compute eventCount per person
    for (const aggregate of map.values()) {
      const eventIds = new Set<string>();
      for (const photo of aggregate.photos) {
        if (photo.event_id) eventIds.add(photo.event_id);
        else if (photo.event_name_manual) eventIds.add(`manual:${photo.event_name_manual}`);
      }
      aggregate.eventCount = eventIds.size;
    }

    return map;
  }, [photos]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo((): AllPhotosStats => {
    const eventIds = new Set<string>();
    const cosplayIds = new Set<string>();
    const personIds = new Set<string>();

    for (const photo of photos) {
      cosplayIds.add(photo.cosplay_id);
      if (photo.event_id) eventIds.add(photo.event_id);
      else if (photo.event_name_manual) eventIds.add(`manual:${photo.event_name_manual}`);

      for (const tag of photo.tags) {
        if (tag.status === "accepted" && tag.tagged_user_id) {
          personIds.add(tag.tagged_user_id);
        }
      }
    }

    return {
      totalPhotos: photos.length,
      totalEvents: eventIds.size,
      totalCosplays: cosplayIds.size,
      totalPeopleTagged: personIds.size,
    };
  }, [photos]);

  // ── Filter lists (for dropdowns) ──────────────────────────────────────────

  const events = useMemo(() => {
    const seen = new Map<string, PhotoEvent>();
    for (const photo of photos) {
      if (photo.event && !seen.has(photo.event.id)) {
        seen.set(photo.event.id, photo.event);
      }
    }
    return [...seen.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [photos]);

  const cosplays = useMemo(() => {
    const seen = new Map<string, PhotoCosplan>();
    for (const photo of photos) {
      if (photo.cosplan && !seen.has(photo.cosplan.id)) {
        seen.set(photo.cosplan.id, photo.cosplan);
      }
    }
    return [...seen.values()].sort((a, b) => a.character_name.localeCompare(b.character_name));
  }, [photos]);

  const people = useMemo(() => {
    const seen = new Map<string, TaggedProfile>();
    for (const photo of photos) {
      for (const tag of photo.tags) {
        if (tag.status === "accepted" && tag.tagged_user_id && tag.tagged_profile && !seen.has(tag.tagged_user_id)) {
          seen.set(tag.tagged_user_id, tag.tagged_profile);
        }
      }
    }
    return [...seen.values()].sort((a, b) =>
      (a.username ?? a.display_name ?? "").localeCompare(b.username ?? b.display_name ?? "")
    );
  }, [photos]);

  return {
    photos,
    photosByEvent,
    photosByCosplay,
    photosByPerson,
    stats,
    events,
    cosplays,
    people,
    isLoading,
    error,
  };
}
