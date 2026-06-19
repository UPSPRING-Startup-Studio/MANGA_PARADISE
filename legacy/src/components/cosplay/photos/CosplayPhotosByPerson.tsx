import { useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Users, UserPlus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PhotoThumbnail } from "@/components/cosplay/photos/PhotoThumbnail";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/hooks/useFriendships";
import type { CosplayPhotoWithTags } from "@/types/cosplayPhotos";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PersonProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface CosplayPersonGroup {
  profile: PersonProfile;
  photos: CosplayPhotoWithTags[];
  linkedCosplay: { character_name: string; universe: string } | null;
}

interface CosplayPhotosByPersonProps {
  photosByPerson: Map<string, CosplayPersonGroup>;
  onPhotoClick: (photo: CosplayPhotoWithTags, index: number) => void;
}

// ─── Single person section ──────────────────────────────────────────────────

const PersonSection = memo(function PersonSection({
  group, isNakama, onPhotoClick,
}: {
  group: CosplayPersonGroup;
  isNakama: boolean;
  onPhotoClick: (photo: CosplayPhotoWithTags, index: number) => void;
}) {
  const navigate = useNavigate();
  const { profile, photos, linkedCosplay } = group;
  const displayName = profile.username ? `@${profile.username}` : (profile.display_name ?? "?");

  return (
    <div className="mb-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(`/u/${profile.username ?? profile.id}`)}
        className="w-full flex items-center gap-3 p-2 mb-2 rounded-xl hover:bg-white/5 transition-colors focus:outline-none text-left"
      >
        <Avatar className={cn("w-10 h-10 flex-shrink-0 ring-2", isNakama ? "ring-pink-500/30" : "ring-white/20")}>
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="text-sm bg-white/10 text-white">
            {(profile.username ?? profile.display_name ?? "?")[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-white text-sm truncate">{displayName}</p>
            {isNakama && (
              <Badge className="bg-pink-500/20 text-pink-300 text-[9px] border-0 px-1.5 py-0 h-4">Nakama</Badge>
            )}
          </div>
          {linkedCosplay && (
            <p className="text-[11px] text-white/40 truncate">
              en {linkedCosplay.character_name} — {linkedCosplay.universe}
            </p>
          )}
          <p className="text-[10px] text-white/30 mt-0.5">
            {photos.length} photo{photos.length > 1 ? "s" : ""} ensemble
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
      </button>

      {/* ── Horizontal photo scroll ────────────────────────────────────── */}
      <div
        className="flex gap-1.5 pb-2 overflow-x-auto scrollbar-hide"
        style={{ scrollSnapType: "x mandatory", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
      >
        {photos.map((photo, i) => (
          <div key={photo.id} className="flex-shrink-0 w-24" style={{ scrollSnapAlign: "start", aspectRatio: "3 / 4" }}>
            <PhotoThumbnail
              photo={photo}
              thumbWidth={192}
              thumbHeight={256}
              aspectClass="w-full h-full"
              onClick={() => onPhotoClick(photo, i)}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Empty state ────────────────────────────────────────────────────────────

function PersonEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Users className="w-12 h-12 text-white/10 mb-3" />
      <p className="text-white/40 text-sm mb-1">Aucune rencontre enregistrée</p>
      <p className="text-white/30 text-xs max-w-[280px]">
        Tague des cosplayeurs sur tes photos pour voir tes rencontres ici
      </p>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function CosplayPhotosByPerson({ photosByPerson, onPhotoClick }: CosplayPhotosByPersonProps) {
  const { user } = useAuth();
  const { data: friendships = [] } = useFriends(user?.id);

  const nakamaIds = useMemo(() => {
    const ids = new Set<string>();
    for (const f of friendships) {
      if (f.requester_id === user?.id && f.addressee) ids.add(f.addressee.id);
      else if (f.addressee_id === user?.id && f.requester) ids.add(f.requester.id);
    }
    return ids;
  }, [friendships, user?.id]);

  const groups = useMemo(() => {
    const all = [...photosByPerson.values()];
    // Nakamas first, then by photo count desc
    all.sort((a, b) => {
      const aN = nakamaIds.has(a.profile.id) ? 1 : 0;
      const bN = nakamaIds.has(b.profile.id) ? 1 : 0;
      if (aN !== bN) return bN - aN;
      return b.photos.length - a.photos.length;
    });
    return all;
  }, [photosByPerson, nakamaIds]);

  if (photosByPerson.size === 0) return <PersonEmptyState />;

  return (
    <div>
      {groups.map((group) => (
        <PersonSection
          key={group.profile.id}
          group={group}
          isNakama={nakamaIds.has(group.profile.id)}
          onPhotoClick={onPhotoClick}
        />
      ))}
    </div>
  );
}
