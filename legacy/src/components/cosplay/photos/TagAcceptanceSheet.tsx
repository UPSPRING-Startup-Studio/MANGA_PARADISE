import { useState } from "react";
import { Check, Slash, ImageOff, PlusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWardrobeItems, WardrobeItem } from "@/hooks/useWardrobeItems";
import { usePhotoTagResponse } from "@/hooks/usePhotoTagResponse";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TagAcceptanceSheetProps {
  tagId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResponded: () => void;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function TagAcceptanceSheet({ tagId, open, onOpenChange, onResponded }: TagAcceptanceSheetProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCosplay, setSelectedCosplay] = useState<WardrobeItem | null>(null);
  const { accept, decline } = usePhotoTagResponse();

  // ── Fetch du tag avec photo, tagger, événement ────────────────────────────
  // Note: les deux FK (tagger_user_id et tagged_user_id) pointent vers profiles.
  // PostgREST requiert le nom exact de la FK pour désambiguïser.

  const { data: tag, isLoading: tagLoading, isError: tagError } = useQuery({
    queryKey: ["tag-detail", tagId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cosplay_photo_tags")
        .select(`
          *,
          cosplay_photos(
            *,
            events:event_id(id, title, date, location)
          ),
          tagger:profiles!cosplay_photo_tags_tagger_user_id_fkey(username, avatar_url, display_name)
        `)
        .eq("id", tagId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!tagId && open,
    staleTime: 0,
    retry: 1,
  });

  const photo = tag?.cosplay_photos;
  const tagger = tag?.tagger;
  const event = photo?.events;
  const tagStatus = tag?.status as string | undefined;
  const isAlreadyProcessed = tagStatus === "accepted" || tagStatus === "declined";
  // Distinguish real not-found vs fetch still loading
  const isNotFound = !tagLoading && (tagError || (!tag && !!tagId));

  // ── Vestiaire du taggé ────────────────────────────────────────────────────

  const { data: cosplays = [], isLoading: vestiaireLoading } = useWardrobeItems(user?.id);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAccept = () => {
    if (!selectedCosplay) return;
    accept.mutate(
      {
        tagId,
        linkedCosplayId: selectedCosplay.id,
        characterName: selectedCosplay.character_name,
      },
      {
        onSuccess: () => {
          setSelectedCosplay(null);
          onResponded();
        },
      }
    );
  };

  const handleDecline = () => {
    decline.mutate(
      { tagId },
      {
        onSuccess: () => {
          setSelectedCosplay(null);
          onResponded();
        },
      }
    );
  };

  const handleGoToVestiaire = () => {
    onOpenChange(false);
    navigate("/espace-membre/vestiaire");
  };

  // ── Computed ──────────────────────────────────────────────────────────────

  const canAccept = !!selectedCosplay && !isAlreadyProcessed;
  const isPending = accept.isPending || decline.isPending;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-2xl bg-[#1A1A2E] border-t border-white/10 p-0 flex flex-col"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Répondre au tag photo</SheetTitle>
          <SheetDescription className="sr-only">
            Accepte ou refuse le tag sur cette photo cosplay
          </SheetDescription>
        </SheetHeader>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {tagLoading ? (
          <div className="flex-1 flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <span className="text-white/40 text-sm">Chargement de la demande…</span>
          </div>
        ) : isNotFound ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6">
            <ImageOff className="w-10 h-10 text-white/20" />
            <p className="text-white/40 text-sm text-center font-medium">Cette demande n&apos;est plus disponible</p>
            <p className="text-white/25 text-xs text-center">Elle a peut-être été supprimée ou annulée.</p>
          </div>
        ) : !photo ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6">
            <ImageOff className="w-10 h-10 text-white/20" />
            <p className="text-white/30 text-sm text-center">
              La photo associée n&apos;est plus disponible
            </p>
          </div>
        ) : isAlreadyProcessed ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6">
            <Check className="w-10 h-10 text-green-400/50" />
            <p className="text-white/40 text-sm text-center">
              Ce tag a déjà été {tagStatus === "accepted" ? "accepté" : "refusé"}.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="px-4 pb-32 space-y-5">

                {/* ── Section 1 : Photo avec pin ──────────────────────────────── */}
                <div>
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
                    <img
                      src={photo.photo_url}
                      alt="Photo"
                      className="w-full h-full object-contain"
                    />
                    {/* Pin orange animé */}
                    <div
                      className="absolute"
                      style={{
                        left: `${tag.pin_x * 100}%`,
                        top: `${tag.pin_y * 100}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div className="relative flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-orange-500/90 ring-2 ring-orange-300/50 flex items-center justify-center animate-pulse">
                          <span className="text-white text-[10px] font-bold">Toi</span>
                        </div>
                        <span className="text-[10px] text-white bg-black/60 rounded px-1 whitespace-nowrap">
                          C&apos;est toi !
                        </span>
                      </div>
                    </div>

                    {/* Badge événement + jour de prise */}
                    {event && (
                      <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
                        <Badge className="bg-teal-500/80 text-white border-0 text-xs">
                          {event.title}
                        </Badge>
                        {photo.shot_date && (
                          <Badge className="bg-white/20 text-white border-0 text-xs capitalize">
                            {new Date(photo.shot_date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Contexte événementiel manuel */}
                    {!event && photo.event_name_manual && (
                      <div className="absolute bottom-2 left-2">
                        <Badge className="bg-white/20 text-white border-0 text-xs">
                          {photo.event_name_manual}
                          {photo.event_date_manual && ` · ${new Date(photo.event_date_manual).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Tagger info */}
                  <div className="flex items-center gap-2 mt-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={tagger?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs bg-white/10 text-white">
                        {(tagger?.username ?? "?")[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-white/70 text-sm">
                      <span className="text-white font-medium">
                        @{tagger?.username ?? tagger?.display_name ?? "quelqu'un"}
                      </span>
                      {" "}t&apos;a tagué(e) sur cette photo
                    </p>
                  </div>
                </div>

                {/* ── Section 2 : Sélection du cosplay (OBLIGATOIRE) ──────────── */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1">
                    Avec quel cosplay étais-tu ?
                  </p>
                  <p className="text-xs text-white/30 mb-3">
                    Choisis le cosplay que tu portais pour rattacher la photo à ton vestiaire
                  </p>

                  {vestiaireLoading ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="aspect-square rounded-lg bg-white/5 animate-pulse" />
                      ))}
                    </div>
                  ) : cosplays.length === 0 ? (
                    /* ── État vide : aucun cosplay dans le vestiaire ────────── */
                    <div className="text-center py-6 px-4 rounded-xl bg-white/5 border border-white/10">
                      <Slash className="w-8 h-8 text-white/20 mx-auto mb-2" />
                      <p className="text-white/40 text-sm mb-1">
                        Tu n&apos;as pas encore de cosplay dans ton vestiaire
                      </p>
                      <p className="text-white/25 text-xs mb-4">
                        Ajoute au moins un cosplay pour pouvoir accepter ce tag
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-sakura/40 text-sakura hover:bg-sakura/10 text-xs"
                        onClick={handleGoToVestiaire}
                      >
                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                        Ajouter un cosplay
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {cosplays.map((item) => {
                        const isSelected = selectedCosplay?.id === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() =>
                              setSelectedCosplay(isSelected ? null : item)
                            }
                            className="relative focus:outline-none"
                          >
                            <div
                              className={cn(
                                "aspect-square rounded-lg overflow-hidden bg-white/5 ring-2 transition-all",
                                isSelected ? "ring-green-400" : "ring-transparent"
                              )}
                            >
                              <img
                                src={item.image_url ?? undefined}
                                alt={item.character_name}
                                className="w-full h-full object-cover"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-white" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <p className="text-white text-[11px] font-medium truncate mt-1 text-left">
                              {item.character_name}
                            </p>
                            <p className="text-white/40 text-[10px] truncate text-left">
                              {item.universe}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </ScrollArea>

            {/* ── Section 3 : Boutons sticky ─────────────────────────────────── */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#1A1A2E] via-[#1A1A2E]/95 to-transparent pt-8 pb-6 px-4 space-y-2">
              <Button
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold disabled:opacity-40"
                onClick={handleAccept}
                disabled={!canAccept || isPending}
              >
                {accept.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {cosplays.length === 0
                  ? "Accepter (ajoute un cosplay d'abord)"
                  : !selectedCosplay
                    ? "Choisis un cosplay pour accepter"
                    : `Accepter — ${selectedCosplay.character_name}`}
              </Button>

              <Button
                variant="ghost"
                className="w-full text-red-400 hover:text-red-300"
                onClick={handleDecline}
                disabled={isPending}
              >
                {decline.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : null}
                Refuser
              </Button>

              <button
                className="w-full text-white/30 text-sm py-1 hover:text-white/50 transition-colors"
                onClick={() => onOpenChange(false)}
              >
                Plus tard
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default TagAcceptanceSheet;
