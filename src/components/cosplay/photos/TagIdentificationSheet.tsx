import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Users, CalendarDays, Search, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/hooks/useFriendships";
import { useEventParticipants } from "@/hooks/useEventParticipants";
import { useDebounce } from "@/hooks/useDebounce";
import type { CosplayPhotoWithTags } from "@/types/cosplayPhotos";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TagIdentifiedData {
  tagged_user_id?: string;
  tagged_name?: string;
  tagged_character?: string;
  tagged_social_link?: string;
  avatar_url?: string;
  username?: string;
}

interface TagIdentificationSheetProps {
  photo: CosplayPhotoWithTags;
  pinPosition: { x: number; y: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIdentified: (tagData: TagIdentifiedData) => void;
  onCancel: () => void;
}

interface ProfileResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

// ─── Schéma Zod pour le formulaire non-membre ─────────────────────────────────

const nonMemberSchema = z.object({
  tagged_name: z.string().min(1, "Nom requis"),
  tagged_character: z.string().optional(),
  tagged_social_link: z
    .string()
    .url("URL invalide (ex: https://instagram.com/pseudo)")
    .optional()
    .or(z.literal("")),
});

type NonMemberFormData = z.infer<typeof nonMemberSchema>;

// ─── Sous-composant : titre de section ───────────────────────────────────────

function SectionTitle({
  icon,
  iconClass,
  label,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span className={iconClass}>{icon}</span>
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
        {label}
      </p>
    </div>
  );
}

// ─── Sous-composant : avatar cliquable (nakama ou participant event) ──────────

function AvatarChip({
  avatarUrl,
  label,
  ringClass,
  onClick,
}: {
  avatarUrl: string | null;
  label: string;
  ringClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-16 flex flex-col items-center gap-1 focus:outline-none group"
    >
      <Avatar className={cn("w-12 h-12 ring-2 group-hover:scale-105 transition-transform", ringClass)}>
        <AvatarImage src={avatarUrl ?? undefined} />
        <AvatarFallback className="text-sm bg-white/10 text-white">
          {label[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <p className="text-[10px] text-white/70 truncate w-16 text-center">{label}</p>
    </button>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function TagIdentificationSheet({
  photo,
  open,
  onOpenChange,
  onIdentified,
  onCancel,
}: TagIdentificationSheetProps) {
  const { user } = useAuth();
  const userId = user?.id;

  // Empêche onCancel de se déclencher quand une identification a eu lieu
  const didIdentifyRef = useRef(false);

  const [searchTerm, setSearchTerm]       = useState("");
  const [isNonMemberOpen, setIsNonMemberOpen] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // ── Nakamas ────────────────────────────────────────────────────────────────

  const { data: friendships = [] } = useFriends(userId);

  // Extrait le profil de l'ami (l'autre personne dans la friendship)
  const nakamaProfiles = friendships
    .map((f) => (f.requester_id === userId ? f.addressee : f.requester))
    .filter((p): p is NonNullable<typeof p> => !!p);

  const nakamaIds = new Set(nakamaProfiles.map((p) => p.id));

  // ── Participants de l'event ────────────────────────────────────────────────

  const { data: participants = [] } = useEventParticipants(
    photo.event_id ?? undefined
  );

  const eventParticipants = participants.filter(
    (p) => p.user && p.user.id !== userId && !nakamaIds.has(p.user.id!)
  );

  const eventName = photo.event_name ?? photo.event_name_manual ?? "l'événement";

  // ── Recherche globale ──────────────────────────────────────────────────────

  const { data: searchResults = [] } = useQuery({
    queryKey: ["tag-search", debouncedSearch],
    queryFn: async (): Promise<ProfileResult[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(
          `username.ilike.%${debouncedSearch}%,display_name.ilike.%${debouncedSearch}%`
        )
        .neq("id", userId ?? "")
        .limit(10);
      if (error) throw error;
      return (data as ProfileResult[]) ?? [];
    },
    enabled: debouncedSearch.length >= 2,
  });

  // ── Formulaire non-membre ──────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<NonMemberFormData>({
    resolver: zodResolver(nonMemberSchema),
    defaultValues: { tagged_name: "", tagged_character: "", tagged_social_link: "" },
  });

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleIdentify = (tagData: TagIdentifiedData) => {
    didIdentifyRef.current = true;
    onIdentified(tagData);
  };

  const handleSheetOpenChange = (isOpen: boolean) => {
    if (!isOpen && !didIdentifyRef.current) {
      onCancel();
    }
    didIdentifyRef.current = false;
    onOpenChange(isOpen);
    // Reset search et formulaire à la fermeture
    if (!isOpen) {
      setSearchTerm("");
      setIsNonMemberOpen(false);
      resetForm();
    }
  };

  const onNonMemberSubmit = (data: NonMemberFormData) => {
    handleIdentify({
      tagged_name:        data.tagged_name,
      tagged_character:   data.tagged_character || undefined,
      tagged_social_link: data.tagged_social_link || undefined,
    });
  };

  // ─────────────────────────────────────────────────────────────────────────

  const inputClass =
    "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20 h-10";

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[60vh] rounded-t-2xl bg-[#1A1A2E] border-t border-white/10 p-0 flex flex-col"
      >
        {/* Titre accessible (masqué visuellement) */}
        <SheetHeader className="sr-only">
          <SheetTitle>Identifier un cosplayeur</SheetTitle>
          <SheetDescription>Identifie un cosplayeur sur cette photo</SheetDescription>
        </SheetHeader>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Contenu scrollable */}
        <ScrollArea className="flex-1 px-4 pb-6">
          <div className="space-y-5">

            {/* ── NIVEAU 1 : MES NAKAMAS ──────────────────────────────────── */}
            {nakamaProfiles.length > 0 && (
              <div>
                <SectionTitle
                  icon={<Users className="w-3.5 h-3.5" />}
                  iconClass="text-pink-400"
                  label="Mes Nakamas"
                />
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {nakamaProfiles.map((friend) => (
                    <AvatarChip
                      key={friend.id}
                      avatarUrl={friend.avatar_url}
                      label={friend.username ? `@${friend.username}` : (friend.display_name ?? "?")}
                      ringClass="ring-pink-500/30"
                      onClick={() =>
                        handleIdentify({
                          tagged_user_id: friend.id,
                          username:       friend.username ?? undefined,
                          avatar_url:     friend.avatar_url ?? undefined,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── NIVEAU 2 : COSPLAYEURS À L'EVENT ────────────────────────── */}
            {photo.event_id && eventParticipants.length > 0 && (
              <div>
                <SectionTitle
                  icon={<CalendarDays className="w-3.5 h-3.5" />}
                  iconClass="text-teal-400"
                  label={`À ${eventName}`}
                />
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {eventParticipants.map((p) => {
                    if (!p.user) return null;
                    const character = p.cosplay_data?.[0]?.character ?? undefined;
                    return (
                      <AvatarChip
                        key={p.user.id}
                        avatarUrl={p.user.avatar_url}
                        label={
                          p.user.username
                            ? `@${p.user.username}`
                            : (p.user.display_name ?? "?")
                        }
                        ringClass="ring-teal-500/30"
                        onClick={() =>
                          handleIdentify({
                            tagged_user_id:   p.user!.id,
                            username:         p.user!.username ?? undefined,
                            avatar_url:       p.user!.avatar_url ?? undefined,
                            tagged_character: character,
                          })
                        }
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── NIVEAU 3 : RECHERCHE GLOBALE ────────────────────────────── */}
            <div>
              <SectionTitle
                icon={null}
                iconClass=""
                label="Rechercher un membre"
              />

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pseudo, nom, ou personnage..."
                  className={cn("pl-9", inputClass)}
                />
              </div>

              {/* Résultats de recherche */}
              {debouncedSearch.length >= 2 && (
                <div className="space-y-0.5">
                  {searchResults.length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-3">
                      Aucun résultat pour « {debouncedSearch} »
                    </p>
                  ) : (
                    searchResults.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() =>
                          handleIdentify({
                            tagged_user_id: profile.id,
                            username:       profile.username ?? undefined,
                            avatar_url:     profile.avatar_url ?? undefined,
                          })
                        }
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors focus:outline-none text-left"
                      >
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={profile.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs bg-white/10 text-white">
                            {(profile.username ?? profile.display_name ?? "?")[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            @{profile.username ?? profile.display_name}
                          </p>
                          {profile.display_name && profile.username && (
                            <p className="text-white/50 text-xs truncate">
                              {profile.display_name}
                            </p>
                          )}
                        </div>

                        {nakamaIds.has(profile.id) && (
                          <Badge className="bg-pink-500/20 text-pink-300 text-[10px] border-0 flex-shrink-0">
                            Nakama
                          </Badge>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* ── NIVEAU 4 : NON-MEMBRE ────────────────────────────────────── */}
            <Collapsible open={isNonMemberOpen} onOpenChange={setIsNonMemberOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center gap-2 text-white/40 text-sm cursor-pointer hover:text-white/60 transition-colors select-none">
                  <span>Cette personne n'est pas sur Manga Paradise</span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 ml-auto flex-shrink-0 transition-transform duration-200",
                      isNonMemberOpen && "rotate-180"
                    )}
                  />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <form
                  onSubmit={handleSubmit(onNonMemberSubmit)}
                  className="mt-3 space-y-2"
                >
                  {/* Nom ou pseudo */}
                  <div>
                    <Input
                      {...register("tagged_name")}
                      placeholder="Nom ou pseudo *"
                      className={inputClass}
                    />
                    {errors.tagged_name && (
                      <p className="text-red-400 text-xs mt-1 px-1">
                        {errors.tagged_name.message}
                      </p>
                    )}
                  </div>

                  {/* Personnage cosplayé */}
                  <Input
                    {...register("tagged_character")}
                    placeholder="Personnage cosplayé (optionnel)"
                    className={inputClass}
                  />

                  {/* Lien social */}
                  <div>
                    <Input
                      {...register("tagged_social_link")}
                      placeholder="Lien social — Instagram, TikTok, etc. (optionnel)"
                      className={inputClass}
                    />
                    {errors.tagged_social_link && (
                      <p className="text-red-400 text-xs mt-1 px-1">
                        {errors.tagged_social_link.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full mt-2 border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    Ajouter ce tag
                  </Button>
                </form>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default TagIdentificationSheet;
