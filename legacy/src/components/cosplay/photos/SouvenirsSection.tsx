import { useMemo } from "react";
import { motion } from "framer-motion";
import { Camera, Users, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  useCosplayPhotos,
  useCosplayEventsCount,
  useCosplayPeopleMet,
} from "@/hooks/useCosplayPhotos";
import type { CosplayPhotoWithTags } from "@/types/cosplayPhotos";

// ─── Types internes ────────────────────────────────────────────────────────────

interface PhotoGroup {
  key: string;
  label: string;
  date: string | null;
  photos: CosplayPhotoWithTags[];
}

interface TaggedPerson {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupPhotos(photos: CosplayPhotoWithTags[]): PhotoGroup[] {
  const map = new Map<string, PhotoGroup>();

  for (const photo of photos) {
    let key: string;
    let label: string;
    const date: string | null = photo.event_date_manual ?? null;

    if (photo.event_id) {
      key = photo.event_id;
      label = photo.event_name ?? "Événement";
    } else if (photo.event_name_manual) {
      key = `manual:${photo.event_name_manual}`;
      label = photo.event_name_manual;
    } else {
      key = "__free__";
      label = "Shootings libres";
    }

    const existing = map.get(key);
    if (existing) {
      existing.photos.push(photo);
    } else {
      map.set(key, { key, label, date, photos: [photo] });
    }
  }

  const entries = Array.from(map.values());
  const eventGroups = entries.filter((g) => g.key !== "__free__");
  const freeGroup = entries.find((g) => g.key === "__free__");

  return freeGroup ? [...eventGroups, freeGroup] : eventGroups;
}

function getPeopleInGroup(groupPhotos: CosplayPhotoWithTags[]): TaggedPerson[] {
  const seen = new Set<string>();
  const people: TaggedPerson[] = [];

  for (const photo of groupPhotos) {
    for (const tag of photo.tags) {
      if (
        tag.status === "accepted" &&
        tag.tagged_user_id &&
        !seen.has(tag.tagged_user_id)
      ) {
        seen.add(tag.tagged_user_id);
        people.push({
          id: tag.tagged_user_id,
          username: tag.tagged_profile?.username ?? null,
          avatar_url: tag.tagged_profile?.avatar_url ?? null,
        });
      }
    }
  }

  return people;
}

// ─── Sous-composant : thumbnail ───────────────────────────────────────────────

function PhotoThumb({ photo }: { photo: CosplayPhotoWithTags }) {
  const acceptedTags = photo.tags
    .filter((t) => t.status === "accepted" && t.tagged_user_id)
    .slice(0, 3);

  return (
    <div className="relative flex-shrink-0 w-20 h-[100px] rounded-lg overflow-hidden bg-white/5">
      <img
        src={photo.photo_url}
        alt={photo.caption ?? ""}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {/* Avatar overlays */}
      {acceptedTags.length > 0 && (
        <div className="absolute bottom-1 left-1 flex">
          {acceptedTags.map((tag) => (
            <Avatar
              key={tag.id}
              className="w-4 h-4 -ml-1 first:ml-0 border border-black/60 ring-0"
            >
              <AvatarImage src={tag.tagged_profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-[7px] bg-white/20 text-white">
                {(tag.tagged_profile?.username ?? "?")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sous-composant : groupe d'événement ─────────────────────────────────────

function EventGroup({ group }: { group: PhotoGroup }) {
  const navigate = useNavigate();
  const people = getPeopleInGroup(group.photos);
  const visiblePeople = people.slice(0, 2);
  const overflowCount = people.length - visiblePeople.length;
  const isFree = group.key === "__free__";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="space-y-2"
    >
      {/* Séparateur event */}
      <div className="flex items-center gap-2">
        <Badge
          className={cn(
            "text-xs font-medium border-0",
            isFree
              ? "bg-white/10 text-white/60"
              : "bg-teal-500/20 text-teal-300"
          )}
        >
          {!isFree && <CalendarDays className="w-3 h-3 mr-1 inline" />}
          {group.label}
          {group.date && (
            <span className="ml-1 text-white/40">
              ·{" "}
              {new Date(group.date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
        </Badge>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Carousel de photos */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {group.photos.map((photo) => (
          <PhotoThumb key={photo.id} photo={photo} />
        ))}
      </div>

      {/* Ligne "Avec @user1, @user2..." */}
      {people.length > 0 && (
        <p className="text-xs text-white/50 flex flex-wrap items-center gap-1">
          <Users className="w-3 h-3 flex-shrink-0" />
          <span>Avec</span>
          {visiblePeople.map((p, i) => (
            <button
              key={p.id}
              onClick={() => navigate(`/profile/${p.id}`)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              @{p.username ?? "?"}
              {i < visiblePeople.length - 1 ? "," : ""}
            </button>
          ))}
          {overflowCount > 0 && (
            <span className="text-white/30">
              et {overflowCount} autre{overflowCount > 1 ? "s" : ""}
            </span>
          )}
        </p>
      )}

      {/* Mini compteur */}
      <p className="text-xs text-white/30">
        {group.photos.length} photo{group.photos.length > 1 ? "s" : ""}
        {people.length > 0 &&
          ` · ${people.length} cosplayeur${people.length > 1 ? "s" : ""}`}
      </p>
    </motion.div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface SouvenirsSectionProps {
  cosplayId: string;
}

export function SouvenirsSection({ cosplayId }: SouvenirsSectionProps) {
  const { data: photos = [], isLoading } = useCosplayPhotos(cosplayId);
  const { data: eventsCount = 0 } = useCosplayEventsCount(cosplayId);
  const { data: peopleMet = 0 } = useCosplayPeopleMet(cosplayId);

  const groups = useMemo(() => groupPhotos(photos), [photos]);

  return (
    <div className="space-y-4">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Camera className="w-5 h-5 text-pink-400" />
        <h3 className="font-display text-xl text-white">Souvenirs &amp; Rencontres</h3>
      </div>

      {/* ── Stats inline ─────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="bg-black/40 border-white/15 text-white/70 text-xs">
          <Camera className="w-3 h-3 mr-1" />
          {photos.length} photo{photos.length !== 1 ? "s" : ""}
        </Badge>
        <Badge variant="outline" className="bg-black/40 border-white/15 text-white/70 text-xs">
          <CalendarDays className="w-3 h-3 mr-1" />
          {eventsCount} événement{eventsCount !== 1 ? "s" : ""}
        </Badge>
        <Badge variant="outline" className="bg-black/40 border-white/15 text-white/70 text-xs">
          <Users className="w-3 h-3 mr-1" />
          {peopleMet} cosplayeur{peopleMet !== 1 ? "s" : ""} rencontré{peopleMet !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* ── Contenu ───────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-5 w-32 bg-white/5 rounded-full" />
              <div className="flex gap-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="w-20 h-[100px] bg-white/5 rounded-lg flex-shrink-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        /* ── État vide ──────────────────────────────────────────────────────── */
        <Card className="bg-white/5 border-white/10 p-8 flex flex-col items-center gap-3 text-center">
          <Camera className="w-16 h-16 text-white/10 mx-auto" />
          <p className="text-sm text-white/50">
            Tes photos et rencontres de cosplay apparaîtront ici.
          </p>
          <p className="text-xs text-white/30">
            Ajoute des photos et tague les gens que tu as rencontrés pour garder un souvenir de chaque shooting !
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white/60 hover:text-white hover:bg-white/10 mt-1"
            onClick={() => {
              document
                .querySelector('[data-tab="photos"]')
                ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            }}
          >
            <Camera className="w-3.5 h-3.5 mr-1.5" />
            Ajouter des photos
          </Button>
        </Card>
      ) : (
        /* ── Timeline ───────────────────────────────────────────────────────── */
        <div className="space-y-5">
          {groups.map((group) => (
            <EventGroup key={group.key} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

export default SouvenirsSection;
