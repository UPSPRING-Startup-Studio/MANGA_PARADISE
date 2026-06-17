import { useMemo } from "react";
import { useEventPhotos } from "@/hooks/useCosplayPhotos";
import type { EventPhotoEnriched } from "@/hooks/useCosplayPhotos";

// ─── Types ──────────────────────────────────────────────────────────────────

export type GalleryFilter = "all" | "mine" | "by_cosplayer" | "by_cosplay" | "group";
export type GallerySort = "recent" | "popular";

export interface GalleryContributor {
  id: string;
  username: string | null;
  avatar_url: string | null;
  photoCount: number;
}

export interface GalleryCosplay {
  id: string;
  character_name: string;
  universe: string;
  photoCount: number;
}

export interface GalleryStats {
  totalPhotos: number;
  totalContributors: number;
  totalCosplays: number;
  totalGroupPhotos: number;
}

export interface GalleryPhotoCard extends EventPhotoEnriched {
  authorName: string;
  authorAvatar: string | null;
  cosplayLabel: string | null;
  acceptedTagCount: number;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useEventCommunityGallery(
  eventId: string | undefined,
  eventTitle?: string,
) {
  const { data: rawPhotos, isLoading, error } = useEventPhotos(eventId, eventTitle);

  // ── Enriched photos (stable memo — computed once per data change) ──────

  const enriched = useMemo((): GalleryPhotoCard[] => {
    return (rawPhotos ?? []).map((photo) => ({
      ...photo,
      authorName: photo.photographer?.username ?? "Cosplayer",
      authorAvatar: photo.photographer?.avatar_url ?? null,
      cosplayLabel: photo.cosplay
        ? `${photo.cosplay.character_name} — ${photo.cosplay.universe}`
        : null,
      acceptedTagCount: photo.tags.filter((t) => t.status === "accepted").length,
    }));
  }, [rawPhotos]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo((): GalleryStats => {
    const contributorIds = new Set<string>();
    const cosplayIds = new Set<string>();
    let groupCount = 0;

    for (const photo of enriched) {
      contributorIds.add(photo.user_id);
      if (photo.cosplay_id) cosplayIds.add(photo.cosplay_id);
      if (photo.is_group_photo) groupCount++;
    }

    return {
      totalPhotos: enriched.length,
      totalContributors: contributorIds.size,
      totalCosplays: cosplayIds.size,
      totalGroupPhotos: groupCount,
    };
  }, [enriched]);

  // ── Contributors list ─────────────────────────────────────────────────────

  const contributors = useMemo((): GalleryContributor[] => {
    const map = new Map<string, GalleryContributor>();

    for (const photo of enriched) {
      const existing = map.get(photo.user_id);
      if (existing) {
        existing.photoCount++;
      } else {
        map.set(photo.user_id, {
          id: photo.user_id,
          username: photo.authorName,
          avatar_url: photo.authorAvatar,
          photoCount: 1,
        });
      }
    }

    return [...map.values()].sort((a, b) => b.photoCount - a.photoCount);
  }, [enriched]);

  // ── Cosplays list ─────────────────────────────────────────────────────────

  const cosplays = useMemo((): GalleryCosplay[] => {
    const map = new Map<string, GalleryCosplay>();

    for (const photo of enriched) {
      if (!photo.cosplay) continue;
      const existing = map.get(photo.cosplay.id);
      if (existing) {
        existing.photoCount++;
      } else {
        map.set(photo.cosplay.id, {
          id: photo.cosplay.id,
          character_name: photo.cosplay.character_name,
          universe: photo.cosplay.universe,
          photoCount: 1,
        });
      }
    }

    return [...map.values()].sort((a, b) => b.photoCount - a.photoCount);
  }, [enriched]);

  // ── Filter + sort (called by component with local state) ──────────────────

  function applyFilterSort(
    filter: GalleryFilter,
    sort: GallerySort,
    selectedContributorId?: string,
    selectedCosplayId?: string,
    currentUserId?: string,
  ): GalleryPhotoCard[] {
    let result = enriched;

    switch (filter) {
      case "mine":
        if (currentUserId) result = result.filter((p) => p.user_id === currentUserId);
        break;
      case "by_cosplayer":
        if (selectedContributorId) result = result.filter((p) => p.user_id === selectedContributorId);
        break;
      case "by_cosplay":
        if (selectedCosplayId) result = result.filter((p) => p.cosplay_id === selectedCosplayId);
        break;
      case "group":
        result = result.filter((p) => p.is_group_photo);
        break;
    }

    // Avoid mutating — spread then sort
    result = [...result];
    if (sort === "recent") {
      result.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else {
      result.sort((a, b) => b.acceptedTagCount - a.acceptedTagCount);
    }

    return result;
  }

  return {
    enriched,
    stats,
    contributors,
    cosplays,
    applyFilterSort,
    isLoading,
    error,
  };
}
